const mongoose = require('mongoose');
<<<<<<< HEAD
=======
console.log("inside sauces.js")
>>>>>>> 4ea3f0ea9363e4e252b3a195bd46135c9b832465
const sauceScheme = new mongoose.Schema({
    userId: {type: String, required: true},
    name: {type: String, required: true},
    manufacturer: {type: String, required: true},
    description: {type: String, required: true},
    mainPepper: {type: String, required: true},
    imageUrl: {type: String, required: true},
    heat: {type: Number, required: true},
    likes: {type: Number, required: true},
    dislikes: {type: Number, required: true},
    usersLiked: [{type: String}],
    usersDisliked: [{type: String}]
});

module.exports = mongoose.model('sauce', sauceScheme);