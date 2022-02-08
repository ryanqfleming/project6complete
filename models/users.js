const mongoose = require('mongoose');
//const { stringify } = require('querystring');
console.log("inside users.js")
const userScheme = new mongoose.Schema({
    email: {type: String, required: true},
    password: {type: String, required: true}
});

module.exports = mongoose.model('User', userScheme);