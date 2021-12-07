'use strict'

const mongoose = require('mongoose');
const crypto = require('crypto');

const productSchema = new mongoose.Schema({
    uuid: {type: String, trim: true},
    product_name: {type: String, required: true, trim: true},
    material: {type: String, required: false},
    size: {type: String, required: false},
    product_description: {type: String, required: true, trim: true},
    product_quantity: {type: Number, required: true},
    manufacturer:{type: String, required: true,trim: true},
    indi_price:{type: String, required: true, trim: true},
    total_price:{type: String, required: true, trim: true},
    product_code: {type: String, required: true},
    active:{type: Boolean,default: true},
}, {
    timestamps: true
});

productSchema.pre("save", function (next) {
    if (this.uuid) return next()
    this.uuid = 'PROD-' + crypto.pseudoRandomBytes(6).toString('hex').toUpperCase()
    next();
});

module.exports = mongoose.model('products', productSchema, "products");