//jshint esversion:6
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const mongooseEncryption = require('mongoose-encryption');

const app = express()
app.set('view engine', 'ejs')
app.use(express.static(__dirname + "/Public"))
app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect("mongodb://localhost:27017/UsersDB", {useNewUrlParser: true, useUnifiedTopology: true})

const userSchema = new mongoose.Schema({
  email: String,
  password: String
})

const secret = "ThisISmYSecrsdzfkjdig"

userSchema.plugin(mongooseEncryption, {secret: secret, encryptedFields: ["password"] })

const User = new mongoose.model("user", userSchema)

app.route("/")
  .get(function(req, res) {
    res.render("home")
  });


app.route("/login")
  .get(function(req, res) {
    res.render("login")
  })

  .post(function(req, res) {
    User.findOne({
      email: req.body.username
    }, function(err, foundUser) {
      if (!err) {
        if (!foundUser) {
            console.log("Incorrect Credential !")
          res.redirect("/login")
        } else {
          if (foundUser.password === req.body.password) {
            res.render("secrets")
          } else {
              console.log(("Incorrect Credentials !!!\nPlease Try again"))
            res.redirect("/login")
          }
        }
      } else {
        console.log(err + "  \nERORR WHILE VRIFING CREDENTIALS\n");
      }
    })
  })


app.route("/register")
  .get(function(req, res) {
    res.render("register")
  })

  .post(function(req, res) {
    const newUser = new User({
      email: req.body.username ,
      password: req.body.password
    })
    console.log(newUser);
    newUser.save(function(err) {
      if (!err) {
        console.log("Registration Sucusess !")
        console.log(err);
        res.render("login")
      } else {
        console.log(err)
      }
    })
  })

app.listen(8080, function(req, res) {
  console.log("Server is running At Port 8080");
})