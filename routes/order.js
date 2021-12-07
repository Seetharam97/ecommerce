'use strict'

const router = require('express').Router();

const orderModel = require("../models/orders");
const productModel = require("../models/products");
const auth = require('../middleware/auth');


// Create the order
router.post('/createOrder', auth, async(req,res)=>{
    try{
        let products = req.body.products;
        const order = new orderModel(req.body);
        if(products.length > 0){
            for(const arr of products){
                const product_data = await productModel.findOne({"product_code": arr.product_code}).exec();
                var product_quantity = parseInt(product_data.product_quantity) - parseInt(arr.quantity);
                var available_qty_price = parseInt(product_data.total_price) - parseInt(arr.total_amount);
                product_data.product_quantity = product_quantity
                product_data.total_price = available_qty_price
                await product_data.save();
            }
        };
        const orderDetails = await order.save();
        return res.status(201).json({"status": "Success", "message": "Order successfully placed", "data": orderDetails});
    }catch(err){
        return res.status(400).json({"status": "Failed", "message": err.message});
    }
});

// cancel the order
router.put("/cancelOrder/:uuid", auth, async(req,res)=>{
    try{
        const condition = {uuid: req.params.uuid};
        const update  = {orderStatus: "cancelled"};
        const option = {new: true};
        const orderDetails = await orderModel.findOne(condition).exec();
        if(orderDetails && orderDetails.orderStatus !== "cancelled"){
            const orderData = await orderModel.findOneAndUpdate(condition, update, option).exec();
            if(orderData.products.length > 0){
                for(const arr of orderData.products){
                    const product_data = await productModel.findOne({"product_code": arr.product_code}).exec();
                    var product_quantity = parseInt(product_data.product_quantity) + parseInt(arr.quantity);
                    var available_qty_price = parseInt(product_data.total_price) + parseInt(arr.total_amount);
                    product_data.product_quantity = product_quantity
                    product_data.total_price = available_qty_price
                    await product_data.save();
                }
            };
            return res.status(200).json({"status": "Success", "message": "Order successfully Cancelled", "data": orderData});
        }else if(orderDetails.orderStatus === "cancelled"){
            return res.status(208).json({"status": "Failde", "message": "Order already cancelled"});
        }else{
            return res.status(204).json({"status": "Failed", "message":"No content"});
        }
    }catch(err){
        return res.status(400).json({"status": "Failed", "message": err.message});
    }
});

// update the order
router.put("/updateOrder",auth, async(req,res)=>{
    try{
        let order_uuid = req.body.uuid;
        const orderData = await orderModel.findOne({uuid: order_uuid}).exec();
        if(orderData){
            if(req.body.products){
                let orderProduct = orderData.products;
                let updateProduct = req.body.products;
                let result = updateProduct.filter(o1 => !orderProduct.some(o2 => o1.uuid === o2.uuid));
                if(result.length>0){
                    for(const arr of result){
                        const product_data = await productModel.findOne({"product_code": arr.product_code}).exec();
                        var product_quantity = parseInt(product_data.product_quantity) - parseInt(arr.quantity);
                        var available_qty_price = parseInt(product_data.total_price) - parseInt(arr.total_amount);
                        product_data.product_quantity = product_quantity
                        product_data.total_price = available_qty_price
                        await product_data.save();
                    }
                    orderData.products = orderProduct.concat(result);
                    const details = await orderData.save();
                    const updateData = delete req.body.products
                    let condition = {uuid: order_uuid}
                    let update = updateData;
                    let option = {new: true}
                    const orderDetails = await orderModel.findOneAndUpdate(condition, update, option).exec();    
                    return res.status(200).json({"status": "Success", "message": "Order successfully Updated", "data": orderDetails});
                }else{
                    return res.json({"status": "Failed", message: "Please create New order"});
                }
            }else{
                let condition = {uuid: order_uuid}
                let update = req.body;
                let option = {new: true}
                const orderDetails = await orderModel.findOneAndUpdate(condition, update, option).exec();
                return res.status(200).json({"status": "Success", "message": "Order successfully Updated", "data": orderDetails});
            }
        }else{
            return res.status(204).json({"status": "Failed", "message":"No content"});
        }
    }catch(err){
        return res.status(400).json({"status": "Failed", "message": err.message});
    }
})

// list customers based on the number of products purchased.
router.get("/numberOfProducts", auth, async(req,res)=>{
    try{
        let customerUuid = req.query.uuid;
        if(customerUuid){
            const data = await orderModel.aggregate([
                {
                    $match: {user_uuid: customerUuid}
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "user_uuid",
                        foreignField: "uuid",
                        as:"userDetails"
                    }
                },
                {
                    $unwind : {
                        path: "$userDetails",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group: {
                        _id: "$user_uuid",
                        total: { $sum: { $size: "$products"} },
                        users: {
                            $push: "$userDetails"
                        }
                    }
                }
            ]).exec();
            return res.status(200).json({"status": "Success", "message": "Total products purchased details fetched", data: data});
        }else{
            const data = await orderModel.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "user_uuid",
                        foreignField: "uuid",
                        as:"userDetails"
                    }
                },
                {
                    $unwind : {
                        path: "$userDetails",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group: {
                        _id: "$user_uuid",
                        total: { $sum: { $size: "$products"} },
                        users: {
                            $push: "$userDetails"
                        }
                    }
                }
            ]).exec();
            return res.status(200).json({"status": "Success", "message": "Total products purchased details fetched", purchased_product: data});
        }
    }catch(err){
        return res.status(400).json({"status": "Failed", "message": err.message});
    }
});

module.exports = router;