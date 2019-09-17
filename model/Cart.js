const mongoose = require('mongoose');
const cartSchema = mongoose.Schema({
    productId: String,
    userEmail: String,
    pQuantity: Number
});

module.exports = mongoose.model('cart',cartSchema);