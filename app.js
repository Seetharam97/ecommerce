'use strict'

const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require('mongoose');
const routerUser = require('./routes/users');
const productRouter = require('./routes/products');
const orderRouter = require('./routes/order');
const config = require('./config.json')
const port = config.PORT || 8000;

// Database connection
mongoose.connect(config.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(()=>{
    console.log("DB Connected");
}).catch((err)=>{
    console.log("DB Connection error:" +err.message);
    process.exit(1);
});

app.use(cors());
app.use(express.json());
app.use("/api/v1/users/", routerUser);
app.use("/api/v1/orders/", orderRouter);;
app.use("/api/v1/products/", productRouter);

app.listen(port, ()=>{
    console.log(`Profile service running on port: ${port}`);
});