const mongoose = require('mongoose');
console.log("inside sauces.js")
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