const mongoose = require('mongoose');
const AdminSchema = mongoose.Schema({
    uname: String,
    password: String
});

module.exports = mongoose.model('Admin',AdminSchema);