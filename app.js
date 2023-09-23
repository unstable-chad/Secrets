////////////////////////// REQUIRES /////////////////////////
require("dotenv").config();

const express = require("express"); 
const app = express();

const body_parser = require("body-parser");
app.use(body_parser.urlencoded({extended:true}));

// const bcrypt = require("bcrypt");
// const saltRounds = 10;

const _ = require('lodash');

const findOrCreate = require("mongoose-findorcreate");

app.set('view engine', 'ejs');

app.use(express.static("public"));

// const md5 = require('md5');

// const encrypt = require("mongoose-encryption");

const passport = require("passport");

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

const passportLocalMongoose = require("passport-local-mongoose");

const session = require("express-session");
const secret_string = process.env.SECRET;
const secret_array = secret_string.split(",");

app.use(session({
    secret: secret_array,
    resave: false,
    saveUninitialized: false
}));

// GOOGLE STRATEGY
passport.use(new GoogleStrategy({
    clientID: process.env.clientID,
    clientSecret: process.env.Clientsecret,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log("GOOGLE PROFILE");
    console.log(profile);

    const providerUsername = "google_" + profile.id;;
    User.findOrCreate({ username: providerUsername }, function (err, user) {
      return cb(err, user);
    });
  }
));

// FACEBOOK STRATEGY
passport.use(new FacebookStrategy({
    clientID: process.env.ClientIDfb,
    clientSecret: process.env.Clientsecretfb,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log("FACEBOOK PROFILE");
    console.log(profile);

    const providerUsername = "facebook_" + profile.id;
    User.findOrCreate({ username: providerUsername }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.use (passport.initialize());
app.use (passport.session());

const mongoose = require("mongoose");            
main().catch(err => console.log(err));

async function main() {
await mongoose.connect('mongodb+srv://unstable_chad:idkpass13579.@clustertest.cxys5wb.mongodb.net/users_DB');
};






//User Schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true
      },
    email: String,
    password: String,
    secrets: {
      type: Array,
      default: []
    },
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// Serialize the user for storing in the session
passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // Deserialize the user when subsequent requests are made
  passport.deserializeUser((id, done) => {
    User.findById(id).exec()
      .then(user => {
        done(null, user);
      })
      .catch(err => {
        done(err);
      });
  });



  //auth with google
app.get("/auth/google", passport.authenticate('google', { scope: ['profile'] }));

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secret page.
    res.redirect("/secrets");
  });


//auth with facebook
app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secret page.
    res.redirect('/secrets');
  });







//home rendering
app.get("/", function(req, res){
    res.render("home");
})

//login rendering
app.get("/login", function(req, res){
    res.render("login");
})

//register rendering
app.get("/register", function(req, res){
    res.render("register");
})

//secrets rendering
app.get("/secrets", function(req, res){
    User.find({ secrets: { $ne: [], $exists: true } }).then(function(foundUsers){
        res.render("secrets", {usersWithSecrets: foundUsers});
    }).catch(function(err){
        console.log(err);
    })
})

//logout rendering
app.get("/logout", function(req, res){
    req.logout(function(err){
        if(err){
            console.log(err);
        }
        else{
            console.log("logged out");
            res.redirect("/");
        }
    });
})

//rendering submit page
app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
})


// POST REQ TO SAVE SECRETS
app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;
    
    User.findOne({_id: req.user.id}).then(function(foundUser){
        if(foundUser){
            foundUser.secrets.push(submittedSecret);
            foundUser.save().then(function(){
                console.log("saved new secret");
                res.redirect("/secrets");
            })
        }
        }).catch(function(err){
            console.log(err);
        })
    })
























// POST REQ FOR REGISTERING USER CREATING PROFILE
app.post("/register", function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, findings){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
                console.log("successfully registered and logged in");
            })
        } 
    })




    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //     const newUser = new User({
    //         email: req.body.username,
    //         password: hash
    //     });
    
    //     newUser.save().then(function () {
    //         res.render("secrets");
    // }).catch((err) =>{
    //     console.log(err);
    // });
    // })

    
})




// POST REQ FOR LOGIN ROUTE TO CHECK IF USER IS REGISTERED
app.post("/login", function(req, res){

    const user = new User({
        username: req.body.username,
        password: req.body.password 
    })

    req.login(user, function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
                console.log("successfully logged in");
            })
        }
    })





    // const username = req.body.username;
    // const password = req.body.password;

    // User.findOne({email: username}).then(function (findings) {
    //     if(findings){
            
    //         bcrypt.compare(password, findings.password, function(err, result) {
    //             if(result){
    //                 res.render("secrets");
    //             }
    //             else{
    //                 res.send("wrong password");
    //             }
    //         })
    //     }
    //     else{
    //         res.send("acc not found");
    //     }
    // }).catch((err) =>{
    //     console.log(err);
    // });
})








 












// LISTEN
let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function(){
    console.log("server running at port 3000" || process.env.PORT )});