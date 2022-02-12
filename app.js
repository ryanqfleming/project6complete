const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");
const mongodbErrorHandler = require('mongoose-mongodb-errors')
const express = require("express");
const multer = require("multer");
const Users = require("./models/users");
const Sauces = require("./models/sauces");
const { ppid, nextTick } = require("process");
const path = require("path");
const bcrypt = require("bcrypt");
const app = express();
const cookieParser = require("cookie-parser");
const dbURI =
  "mongodb+srv://ryanqfleming:DCFjbZHKL9Atku9w@cluster0.ncp8j.mongodb.net/ModelsSauce?retryWrites=true&w=majority";
const jwt = require("jsonwebtoken");
const sauces = require("./models/sauces");
app.use(express.json());
app.use(cookieParser());
require("dotenv").config();
var http = require("http");
app.use("/images", express.static(__dirname + "/images"));
//file storage for multr
const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./images");
  },
  filename: (req, file, cb) => {
    cb(null, Math.floor(Math.random() * 1000000) + "--" + file.originalname);
  },
});

const upload = multer({ storage: fileStorageEngine });
//using mongoose to connect
mongoose
  .connect(dbURI)
  .then((result) => app.listen(8081))
  .catch((error) => console.log(err));

app.post("/api/sauces",upload.single("image"),authenticateToken,(req, res) => {
    //Checks to make sure there is file.
    if (!req.file) return res.sendStatus(404);
    //create the sauce
    sauceObj = JSON.parse(req.body.sauce);

    let urlFix = "http://localhost:3000/" + req.file.path.replace("\\", "/");
    const sauce = new Sauces({
      userId: req.user._id,
      name: sauceObj.name,
      manufacturer: sauceObj.manufacturer,
      description: sauceObj.description,
      mainPepper: sauceObj.mainPepper,
      imageUrl: urlFix,
      heat: sauceObj.heat,
      likes: 0,
      dislikes: 0,
      usersLiked: [],
      usersDisliked: [],
    });
    sauce.save()
    .then((result)=> res.send({message: 'posted'}))
    .catch((error)=>{console.log('Failed To Save')});
  }
);
//post request for sign up
app.post("/api/auth/signup", (req, res) => {
  const user = new Users({
    email: req.body.email,
    password: req.body.password,
  });
  bcrypt.genSalt(12).then((salt) => {
    bcrypt.hash(req.body.password, salt).then((hash) => {
      user.password = hash;

      //pulling data then checking to make sure we don't have duplicates
      //we don't need to pull the extra to match passwords
      Users.find(
        {},
        {
          _id: false,
          password: false,
          __v: false,
        }
      ).then((result) => {
        
        if (result.length === 0) {
          //no data exists, Lets just save
          user.save().then((result)=>{
            res.send({message: 'passed'})
          })
          .catch((error)=> console.log(error));
        } else {
          //data exists lets check for duplicates
          for (let i = 0; i < result.length; i++) {
            if (result[i].email == user.email) {
              //break the loop if match found
              console.log("same email");
              res.sendStatus(403);
            } else if (i == result.length - 1) {
              //Saving the data if we have reached the last item without a match
              user.save().then((result)=>{
                res.send({message: 'passed'})
              })
              .catch((error)=> console.log(error));
            }
          }
        }
      });
    });
  });
});

app.post("/api/auth/login", (req, res) => {
  //look for email
  console.log(req.body);
  Users.findOne({ email: req.body.email }).then((results) => {
    if (results === null) {
      res.sendStatus(403);
    } else {
      //check password
      bcrypt.compare(req.body.password, results.password).then((compared) => {
        if (compared === false) {
          console.log("failed to create jwt");
          res.sendStatus(403);
        } else {
          //jwt sign
        const token = jwt.sign(
            { _id: results._id },
            process.env.ACCESS_TOKEN_SECRET
          );
          res.json({ userid: results._id, token: token });
        }
      });
    }
  });
});
app.get("/api/sauces", authenticateToken, (req, res) => {
  console.log(req.body);
  Sauces.find({}, (err, result) => {
    if (err) return res.sendStatus(403);
    console.log(result);
    res.json(result);
  });
});
app.get("/api/sauces/:id", authenticateToken, (req, res) => {
  Sauces.findById(req.params.id, (err, resultId) => {
    if (err) return res.sendStatus(404);
    if (resultId === null) return res.sendStatus(404);
    res.send(resultId);
    console.log(resultId);
  });
});
app.delete("/api/sauces/:id", authenticateToken, (req, res) => {
  Sauces.findById(req.params.id, (err, result) => {
    if (err || result === null) return res.sendStatus(403);
    if (req.user._id !== result.userId) return res.send("did not match");

    result.remove();
    res.send({message: 'deleted'});
  });
});
app.put(
  "/api/sauces/:id",
  upload.single("image"),
  authenticateToken,
  (req, res) => {
    //Checks to make sure there is file.
    //if there is no file
    if (!req.file) {
    } else {
      //find the user
      Sauces.findById(req.params.id, (err, result) => {
        if (req.user._id !== result.userId) return res.send("did not match");
        let idFind = { _id: result._id };
        let newImage = { $set: { imageUrl: req.file.path } };
        Sauces.updateOne(idFind, newImage, (err, result) => {
          if (err != null) {
            res.send("updated");
          } else {
            res.sendStatus(404);
          }
        });
      });
    }
  }
);
app.post("/api/sauces/:id/like", authenticateToken, (req, res) => {
  //fint the item first and store it in result
  Sauces.findById(req.params.id, (err, result) => {
    //holding just makes it easier to read
    let likeHold = result.usersLiked;
    let disHold = result.usersDisliked;
    if (req.body.like === 1 && likeHold.includes(req.user._id) === false) {
      //if we like we want to find and delete a dislike if it exists
      for (let i = 0; i < disHold.length; i++) {
        if (disHold[i] == req.user._id) {
          disHold.splice(i, 1);
          Sauces.updateOne(
            { _id: result._id },
            { $set: { usersDisliked: disHold } },
            (err, res) => {
            }
          );
          Sauces.updateOne(
            { _id: result._id },
            { $inc: { dislikes: -1 } },
            (err, res) => {
            }
          );
          break;
        }
      }
      //push to the array we grabbed and then update
      likeHold.push(req.user._id);
      Sauces.updateOne(
        { _id: result._id },
        { $set: { usersLiked: likeHold } },
        (eer, res) => {
        }
      );
      Sauces.updateOne(
        { _id: result._id },
        { $inc: { likes: 1 } },
        (err, res) => {
        }
      );
    } else if (
      req.body.like === -1 &&
      disHold.includes(req.user._id) === false
    ) {
      //if we dislike we want to find and delete a like if it exists
      for (let i = 0; i < likeHold.length; i++) {
        if (likeHold[i] == req.user._id) {
          likeHold.splice(i, 1);
          Sauces.updateOne(
            { _id: result._id },
            { $set: { usersLiked: likeHold } },
            (eer, res) => {
              console.log(res);
            }
          );
          Sauces.updateOne(
            { _id: result._id },
            { $inc: { likes: -1 } },
            (err, res) => {
              console.log(res);
            }
          );
          break;
        }
      }
      disHold.push(req.user._id);
      //push to the array we grabbed and then update
      Sauces.updateOne(
        { _id: result._id },
        { $set: { usersDisliked: disHold } },
        (err, res) => {
          console.log(res);
        }
      );
      Sauces.updateOne(
        { _id: result._id },
        { $inc: { dislikes: 1 } },
        (err, res) => {
          console.log(res);
        }
      );
    } else if (req.body.like === 0) {
      //check both arrays and delete
      for (let i = 0; i < likeHold.length; i++) {
        if (likeHold[i] == req.user._id) {
          likeHold.splice(i, 1);
          Sauces.updateOne(
            { _id: result._id },
            { $set: { usersLiked: likeHold } },
            (eer, res) => {
              console.log(res);
            }
          );
          Sauces.updateOne(
            { _id: result._id },
            { $inc: { likes: -1 } },
            (err, res) => {
              console.log(res);
            }
          );
          break;
        }
      }
      for (let i = 0; i < disHold.length; i++) {
        if (disHold[i] == req.user._id) {
          disHold.splice(i, 1);
          Sauces.updateOne(
            { _id: result._id },
            { $set: { usersDisliked: disHold } },
            (err, res) => {
              console.log(res);
            }
          );
          Sauces.updateOne(
            { _id: result._id },
            { $inc: { dislikes: -1 } },
            (err, res) => {
              console.log(res);
            }
          );
          break;
        }
      }
    }
  });
  res.send({ message: "whoop" });
});
function authenticateToken(req, res, next) {
  //
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(403);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, userId) => {
    if (err) return res.sendStatus(403);
    req.user = userId;
    next();
  });
}
app.listen(3000);
