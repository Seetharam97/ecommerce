'use strict'

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config.json');

const userSchema = new mongoose.Schema({
        uuid: {type: String, trim: true},
        username: {type: String, required: false, trim: true},
        name: {type: String, required: true, trim: true},
        gender: {type: String, enum: ['male', 'female', 'transgender'], required: false},
        phone_number: {type: String, required: true, trim: true},
        country_code: {type: String, required: false, trim: true},
        email: {type: String, required: false, trim: true},
        address: [{
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
        password: {type: String, required: false, trim: true},
        active: {type: Boolean, required: true, default: true},
        verified: {type: Boolean, required: true, default: false},
        created_by: {type: String, required: false},
    },{
        timestamps: true
    }
);

// create the uuid based upon the role
userSchema.pre("save", function(next){
    this.uuid = "USER" + '-'+ crypto.pseudoRandomBytes(4).toString('hex').toUpperCase();
    next();
});

//generate the token send to client 
userSchema.methods.generateToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            uuid: this.uuid,
            email: this.email
        },
        config.JWT_SECRET
    );
};

module.exports = mongoose.model('users', userSchema, "users");