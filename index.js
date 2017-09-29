const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
var GitHubStrategy = require('passport-github').Strategy;

var app = express();
var Users = require('./models/Users');

var db = "mongodb://theproactivedev:$%40ndb0x@ds147544.mlab.com:47544/sandbox";
mongoose.connect(db);

require("dotenv").config();
app.use(cookieParser());
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));
// app.use(express.static(path.join(__dirname, 'client/public')));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_KEY,
  clientSecret: process.env.GITHUB_SECRET,
  callbackURL: process.env.APP_URL + "/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {

    var searchQuery = {
      name: profile.displayName
    };

    var updates = {
      name: profile.displayName,
      someID: profile.id
    };

    var options = {
      upsert: true
    };

    // update the user if s/he exists or add a new user
    Users.findOneAndUpdate(searchQuery, updates, options, function(err, user) {
      if(err) {
        return done(err);
      } else {
        console.log("Name: " + user.name);
        return done(null, user);
      }
    });
  }

));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  Users.findById(id, function (err, user) {
    done(err, user);
  });
});

app.use(passport.initialize());
app.use(passport.session());

app.route('/auth/github')
  .get(passport.authenticate('github'));

app.route('/auth/github/callback')
  .get(passport.authenticate('github', {
    successRedirect: '/dashboard',
    failureRedirect: '/warning'
  }, function(req, res) {
    console.log("User: " + typeof req.user);
  }));

app.route("/").get(function(req, res) {
  res.sendFile(process.cwd() + "/client/public/index.html");
});

app.route("/warning").get(function(req, res) {
  res.sendFile(process.cwd() + "/client/public/login.html");
});

app.route("/dashboard").get(function(req, res) {
  res.sendFile(process.cwd() + "/client/public/dashboard.html");
});

app.listen(3000, function() {
  console.log("Working...");
});
