'use strict'

const router = require('express').Router();
const bcrypt = require("bcrypt");

const userModel = require("../models/users");
const auth = require('../middleware/auth');

// register
router.post("/register", async(req,res)=>{
    try {
        let email = req.body.email;
        let phone_number = req.body.phone_number;
        let username = req.body.username;
        const email_detail = await userModel.find({"email": email}).exec();
        if(email_detail.length>0){
            return res.json({"status": "Failed", "message": "email already exists"});
        }
        const mobile_Availab = await userModel.find({"phone_number": phone_number}).exec()
        if(mobile_Availab.length>0){
            return res.json({"status": "Failed", "message": "phone_number already exists"});
        }
        const username_availabilty = await userModel.find({"username": username}).exec()
        if(username_availabilty.length>0){
            return res.json({"status": "Failed", "message": "Username already exists"});
        }
        let users = new userModel(req.body);
        if(req.body.password){
            let password = req.body.password;
            let salt = await bcrypt.genSalt(10);
            users.password = bcrypt.hashSync(password, salt);
            const user_details = await users.save();
            return res.json({"status": "Success", "message": "Register successfully", "data": user_details});
        }else{
            return res.json({"status": "Failed", "message": "Please Provide password"});
        }
    } catch (err) {
        return res.status(400).json({"status": "Failed", "message": err.message});
    }
});


// login
router.post("/login", async(req,res)=>{
    try{        
        let username = req.body.username;
        let password = req.body.password;
        let users = await userModel.findOne({username: username}).exec();
        if(!users){
            throw new Error("No users found, please register");
        }
        let pass = users.password
        let match = await bcrypt.compare(password, pass);
        let token = users.generateToken();  
    
        if(match){
            return res.status(200).json({"status": "Success", "message": "Login successfully", "data": {...users._doc,token}});
        }else{
            return res.status(200).json({"status": "Failed", "message": "Invalid Username or password"});
        } 
    }catch(err){
        return res.status(400).json({"status": "Failed", "message": err.message});
    }
});

// list ordered products based on the customer;
router.get("/getOrderBasedOnCustomer", auth, async(req,res)=>{
    try{
        let search = req.query.search;
        let sort = req.query.sort;
        if(sort == "ascen"){
            sort = 1
        }else{
            sort = -1
        }
        if(search){
            console.log(search)
            const orderDetails = await userModel.aggregate([
                {
                    $match: {
                        active : true,
                        $and: [
                            { "name": {$regex: `${search}`, $options: 'i'}},
                        ]
                    }
                },
                {
                    $lookup: {
                        from: "orders", 
                        localField: "uuid", 
                        foreignField: "user_uuid", 
                        as: "orderDetails"
                    }
                },
                {
                    $sort: {"name":sort}
                }            
            ]).exec();
            console.log(orderDetails);
            return res.status(200).json({"status": "Success", "message": "Ordered products details fetched successfully", "data": orderDetails});
        }else{
            const orderDetails = await userModel.aggregate([
                {
                    $lookup: {
                        from: "orders", 
                        localField: "uuid", 
                        foreignField: "user_uuid", 
                        as: "order_details"
                    }
                },
                {
                    $sort: {"name":sort}
                }
            ]).exec();
            return res.status(200).json({"status": "Success", "message": "Ordered products details fetched successfully", "data": orderDetails}); 
        }
    }catch(err){
        return res.status(400).json({"status": "Failed", "message": err.message});
    }
});

module.exports = router;