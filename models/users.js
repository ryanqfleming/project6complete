const mongoose = require('mongoose');
<<<<<<< HEAD
=======
//const { stringify } = require('querystring');
console.log("inside users.js")
>>>>>>> 4ea3f0ea9363e4e252b3a195bd46135c9b832465
const userScheme = new mongoose.Schema({
    email: {type: String, required: true},
    password: {type: String, required: true}
});

module.exports = mongoose.model('User', userScheme);