"use strict";

const jwt = require('jsonwebtoken');
const config = require('../config.json');

module.exports = function (req, res, next) {
    const token = req.header('x-auth-token')
    if(!token)
        return res.status(401).json({error: true, status: "Failed",message: 'Access denied. No token provided'})    
    try{
        const decoded_data = jwt.verify(token, config.JWT_SECRET, { ignoreExpiration: true });
        req.user = decoded_data;
        req.user.token = token
        next();
    }
    catch(err){
        res.status(400).json({error: true, status:"Error",message: err.message})
    }
}