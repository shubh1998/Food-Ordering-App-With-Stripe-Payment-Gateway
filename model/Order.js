const mongoose = require('mongoose');
const OrderSchema = mongoose.Schema({
    orderId:String,
    CustomerEmail: String,
    CustomerContact: Number,
    CustomerAddress: String,
    Products:[{
        ProductName: String,
        ProductQuantity: Number,
        ProductPrice: Number,
    }],
    Total: Number,
    Status: String,
    Time : { type : Date, default: Date.now }
    
});

module.exports = mongoose.model('order',OrderSchema);