'use strict'

const router = require('express').Router();
const fs = require('fs');
const crypto = require('crypto');
const productModel = require("../models/products");
const auth = require('../middleware/auth');
const multer = require('multer')
const XLSX = require('xlsx');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        fs.mkdir('./uploads/',(err)=>{
            cb(null, './uploads/');
         });
    },
    filename: (req, file, cb) => {
       
        cb(null, file.originalname);
    }
});

const upload = multer({storage: storage,});

//  upload the product data
router.post("/productUpload", auth, upload.single('file'),async(req,res)=>{
    try{        
        let path = "./uploads/" + req.file.filename
        var workbook = XLSX.readFile(path);
        var sheet_name_list = workbook.SheetNames; 
        let data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
        
        for(var key of data){
            var details = await productModel.findOne({product_code: key.product_code}).exec();
            if(details){
                var product_quantity = parseInt(details.product_quantity) + parseInt(key.product_quantity);
                var available_qty_price = parseInt(details.total_price) + parseInt(key.total_price);
                details.product_quantity = product_quantity
                details.total_price = available_qty_price
                await details.save();
            }else{
                if(key.size){
                    key.size = key.size
                }else{
                    key.size = ""
                }
                let productObject = {
                    product_name:key.product_name,
                    product_code:key.product_code,
                    material: key.material,
                    size: key.size,
                    product_description: key.product_description,
                    product_quantity: key.product_quantity,
                    manufacturer: key.manufacturer,
                    indi_price: key.indi_price,
                    total_price: key.total_price,
                    uuid : 'PROD-' + crypto.pseudoRandomBytes(6).toString('hex').toUpperCase()

                }
                const productDetails = new productModel(productObject)
                const product = await productDetails.save()
            }
        }
        return res.status(200).json({"status": "Success", "message": "product datas successfully uploaded"});
    }catch(err){
        return res.status(400).json({"status": "Failed", "message": err.message});
    }
})

module.exports = router;