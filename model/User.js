const mongoose = require('mongoose');
const UserSchema = mongoose.Schema({
    UserName: String,
    Password: String,
    Email: String,
    Contact: Number,
    Address: String
});
module.exports = mongoose.model('User',UserSchema);