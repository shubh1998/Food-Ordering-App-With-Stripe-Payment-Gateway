const mongoose = require('mongoose');
const AddProductSchema = mongoose.Schema({
    Pid:String,
    Pname: String,
    Pprice: String,
    Pdesc: String,
    Pcategory: String,
    Pimage: String
});

module.exports = mongoose.model('additem',AddProductSchema);