'use strict'

const mongoose = require('mongoose');
const crypto = require('crypto');

const orderSchema = new mongoose.Schema({
    uuid: {type: String, trim: true},
    user_uuid: {type: String, required: true, trim: true},
    products:[],
    orderStatus: {type: String,enum: ['placed', 'packed', 'shipped', 'delivered', 'cancelled'],required: true,default: 'placed'},
    paymentStatus: {type: String,enum: ['paid', 'unpaid'],required: true,default: 'unpaid'},
    currency: {type: String,enum: ['INR', 'USD'],default: 'INR'},
    total_amount: {type: String, required: false},
    deliveryAddress: [{
        door_no: {type: String, required: false},
        street: {type: String, required: false},
        area: {type: String, required: false},
        city: {type: String, required: false},
        state: {type: String, required: false},
        country: {type: String, required: false},
        pincode: {type: String, required: false},
        phoneNumber: {type: String, required: false},
        email: {type: String, required: false},
        instructions: {type: String, default: ''}
    }],
    refundStatus: {type: String, required: false},
    active:{type: Boolean,default: true},
}, {
    timestamps: true
});

orderSchema.pre("save", function (next) {
    if (this.uuid) return next()
    this.uuid = 'ORDER-' + crypto.pseudoRandomBytes(6).toString('hex').toUpperCase()
    next();
});

module.exports = mongoose.model('orders', orderSchema, "orders");