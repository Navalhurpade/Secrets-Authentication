//jshint esversion:
require('dotenv').config()
// const md5 = require('md5');
// const mongooseEncryption = require('mongoose-encryption');
// const bcrypt = require('bcrypt')


const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport')
const passportLocal = require('passport-local')
const session = require('express-session')
const passportLocalMongoose = require('passport-local-mongoose');

const app = express()
app.set('view engine', 'ejs')
app.use(express.static(__dirname + "/public"))
app.use(bodyParser.urlencoded({
  extended: true
}));

// -----------------------Using session--------------//
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}))

// -----------------------Using passport--------------//
app.use(passport.initialize())
app.use(passport.session())

// --------------Then connectiong the databases-------//
mongoose.connect("mongodb://localhost:27017/UsersDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
})

const userSchema = new mongoose.Schema({
  email: String,
  password: String
})

userSchema.plugin(passportLocalMongoose)

const roundsOfSalting = 10


// userSchema.plugin(mongooseEncryption, {secret: process.env.SECRET , encryptedFields: ["password"] })

const User = new mongoose.model("user", userSchema)

passport.use(User.createStrategy())

// -----------Setting up cookie--------------//
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.route("/")
  .get(function(req, res) {
    res.render("home")
  });


app.route("/login")
  .get(function(req, res) {
    res.render("login")
  })
  .post(function(req, res) {
    const userDetails = new User({
      username: req.body.username,
      password: req.body.password
    })
    req.login(userDetails, function(err) {
      if (err) {
        console.log("Incorrect Credentials !"+ err);
        res.redirect("/login")
      } else {
        passport.authenticate("local")(req, res, function() {
          console.log("You reached login/Authenticating");
          res.redirect("/secrets")
        })
      }
    })
  })



app.route("/register")
  .get(function(req, res) {
    res.render("register")
  })
  .post(function(req, res) {
    let password = req.body.password
    User.register({
      username: req.body.email
    }, req.body.password, function(err, user) {
      if (err) {
        console.log(err)
        res.redirect("/register")
      } else {
        passport.authenticate("local")(req, res,
          function() {
            console.log("You reached regeister/auth");
            res.redirect("/secrets")
          });
      }
    })





    // bcrypt.hash(password, roundsOfSalting, function (err, hash){
    //   const newUser = new User({
    //     email: req.body.username ,
    //     password: hash
    //   })
    //   console.log(newUser+"\n IS Being saved ! !");
    //   newUser.save(function(err) {
    //     if (!err) {
    //       console.log("Registration Sucusess !")
    //       res.render("login")
    //     } else {
    //       console.log(err)
    //     }
    //   })
    // })
  })


app.route("/secrets").get(function(req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets")
  } else {
    res.redirect("/login")
  }
})

app.listen(8080, function(req, res) {
  console.log("Server is running At Port 8080");
})
