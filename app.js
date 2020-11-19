//jshint esversion:
require('dotenv').config()

const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport')
const passportLocal = require('passport-local')
const session = require('express-session')
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate')
var GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;

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

//------------Creating Schemas For Collections--------------//
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
})

//-------------Adding some plugins---------------//
userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)
// userSchema.plugin(mongooseEncryption, {secret: process.env.SECRET , encryptedFields: ["password"] })


const roundsOfSalting = 10

const User = new mongoose.model("user", userSchema)

passport.use(User.createStrategy())


// -----------Setting up cookie------------(Works with any type of Strategy)-----------//
passport.serializeUser(function(user, done) {      //genrating a cookie
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {     //Opening a cookie
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


//------------------Only Works if Authetication is local-----------------//
// passport.serializeUser(User.serializeUser())
// passport.deserializeUser(User.deserializeUser())


// --------google Auth2.0 GoogleStrategy----------//
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:8080/auth/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

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
          res.redirect("/secrets")
        })
      }
    })
  })

app.get("/logout", function(req, res){
  req.logout()
  res.redirect("/")
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
        console.log("There is err while restering a local user");
        res.redirect("/register")
      } else {
            res.redirect("/secrets")
          }
      })
  })


app.get("/secrets", function(req, res){
  User.find({secret: {$exists: true}}, function(err, foundSecrets){
  if (!err) {
    res.render("secrets", {
      usersSecretes: foundSecrets
    })
  } else {
    console.log(err);
  }
  })

})

app.get("/submit", function(req, res){
  if (req.isAuthenticated()) {
      res.render("submit")
    } else {
    res.redirect("/login")
  }
  })

app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret
  const userid = req.user._id
  User.findById(userid, function(err, founduser){
    if (!err) {
      if (founduser) {
        founduser.secret = submittedSecret
        founduser.save()
      } else {
        console.log("No user Found !");
      }
    }else{
       console.log(err);

       }
  })

  res.redirect("/secrets")
})

app.route("/auth/google")
.get(
passport.authenticate("google",  { scope: ['profile'] })
);

app.route("/auth/secrets")
.get(
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });


app.listen(8080, function(req, res) {
  console.log("Server is running At Port 8080");
})




//     http://localhost:8080/auth/secrets
