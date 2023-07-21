const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
//const db = require('./config');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const comFunction = require('./common_function');

dotenv.config({ path: './.env' });

const app = express();
const publicPath = path.join(__dirname, 'public');
const uploadsPath = path.join(__dirname, 'uploads');


app.use(cookieParser());
app.use(express.static(publicPath));
app.use(express.static(uploadsPath));
app.set('view engine', 'ejs');



app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Set up express-session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

// Include the Passport configuration from passport-setup.js
require('./passport-setup');
// Serialize and deserialize user data
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Set up express-session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Google login route
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google login callback
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // After successful login, redirect to the home page or any other page
        //res.redirect('/profile');
        
        const user = req.user;
        //res.json({ user });
        comFunction.saveUserGoogleDataToDB(user);
        res.redirect('/');
    }
);

// Define Routes
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));


app.listen(5000);