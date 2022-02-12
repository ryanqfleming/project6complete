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
console.log("in node.js");
console.log(Users, "users information");
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

    console.log(req.file.path, "the file");
    let urlFix = "http://localhost:3000/" + req.file.path.replace("\\", "/");
    console.log(req.user, "user id");
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
    .catch((error)=>{console.log('you broke it')});
    //could add a checker for this save like I did for signup
    res.send({ message: "Posted" });
  }
);
//post request for sign up
app.post("/api/auth/signup", (req, res) => {
  const user = new Users({
    email: req.body.email,
    password: req.body.password,
  });
  bcrypt.genSalt(12).then((salt) => {
    console.log("into the crypt");
    bcrypt.hash(req.body.password, salt).then((hash) => {
      user.password = hash;
      console.log("user", user);

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
        //ensure the data is saved before sending response to ensure the login post
        //does not fire before the database has saved. Checking every half a second
        // function dbSaveCheck() {
        //   Users.findOne({ email: user.email }).then((results) => {
        //     if (results === null) {
        //       setTimeout(dbSaveCheck, 500);
        //     } else {
        //       res.send({ message: "Passed" });
        //     }
        //   });
        // }
        //
        if (result.length === 0) {
          //no data exists, Lets just save
          user.save().then((result)=>{
            res.send({message: 'passed'})
          });
          dbSaveCheck();
        } else {
          //data exists lets check for duplicates
          for (let i = 0; i < result.length; i++) {
            if (result[i].email == user.email) {
              //break the loop if match found
              console.log("same email");
              res.sendStatus(403);
            } else if (i == result.length - 1) {
              //Saving the data if we have reached the last item without a match
              user.save();
              dbSaveCheck();
            }
          }
        }
      });
    });
  });
});

app.post("/api/auth/login", (req, res) => {
  //look for email
  console.log("login called");
  console.log(req.body);
  Users.findOne({ email: req.body.email }).then((results) => {
    console.log(results, "results");
    if (results === null) {
      res.sendStatus(403);
    } else {
      //check password
      bcrypt.compare(req.body.password, results.password).then((compared) => {
        console.log("comparing");
        if (compared === false) {
          console.log("failed to create jwt");
          res.sendStatus(403);
        } else {
          //jwt sign
          //createJWT({_id: results._id})
          // const userId = {_id: results._id}
          console.log("creating jwt");
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
  console.log("called the sauce");
  console.log(req.body);
  Sauces.find({}, (err, result) => {
    console.log("found the sauce");
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
    console.log(result.userId, "super user");
    if (req.user._id !== result.userId) return res.send("did not match");

    console.log(req.user, "recked user");
    console.log(result, "recked result");
    result.remove();
    console.log("deleted");
    res.send("whatever bro");
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
        console.log(req.file.path, "the file path");
        let idFind = { _id: result._id };
        let newImage = { $set: { imageUrl: req.file.path } };
        Sauces.updateOne(idFind, newImage, (err, result) => {
          if (err != null) {
            res.send("updated");
          } else {
            res.sendStatus(404);
          }
        });
        console.log(result._id, "the result");
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
      //push to the array we grabbed and then update
      likeHold.push(req.user._id);
      Sauces.updateOne(
        { _id: result._id },
        { $set: { usersLiked: likeHold } },
        (eer, res) => {
          console.log(res);
        }
      );
      Sauces.updateOne(
        { _id: result._id },
        { $inc: { likes: 1 } },
        (err, res) => {
          console.log(res);
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
        console.log("in the for");
        if (likeHold[i] == req.user._id) {
          console.log(i);
          likeHold.splice(i, 1);
          console.log(likeHold);
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
    console.log("passed");
    next();
  });
}
app.listen(3000);
