const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
//const db = require('./config');
const passport = require('passport');
const session = require('express-session');
const axios = require('axios');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const FacebookStrategy = require('passport-facebook').Strategy;

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

app.get('/auth/facebook', passport.authenticate('facebook'));

// Google login callback
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    async (req, res) => {
        // After successful login, redirect to the home page or any other page
        //res.redirect('/profile');
        
        const user = req.user;
        //res.json({ user });
        try {
            const UserResponse = await comFunction.saveUserGoogleLoginDataToDB(user);
            console.log('aaaa',UserResponse);
            // Set a cookie
            let userCookieData = {
                user_id: UserResponse.node_userID,
                first_name: UserResponse.first_name,
                last_name: UserResponse.last_name,
                email: UserResponse.email,
                user_type_id: 2,
                profile_pic: UserResponse.node_userProfilePic,
                source: 'gmail'
            };
            const encodedUserData = JSON.stringify(userCookieData);
            res.cookie('user', encodedUserData);
            const userLoginData = {
                email: UserResponse.email,
                password: UserResponse.email,
            };
            axios.post( process.env.BLOG_API_ENDPOINT+'/login', userLoginData)
            .then((response) => {
                //         
            })
            .catch((error) => {
                console.error(error);               
            });                       
            res.redirect('/');
        } catch (error) {
            console.error('Error during google login:', error);
            res.redirect('/');
        }
    }
);

// FB Login Callback
app.get(
    '/auth/facebook/callback',
    passport.authenticate('facebook', {
      successRedirect: '/facebook-user-data',
      failureRedirect: '/',
    })
);

app.get('/facebook-user-data', async (req, res) => {
    const user = req.user;
    try {
      await comFunction.saveUserFacebookLoginDataToDB(user); // Replace 'saveUserDataToDatabase' with your custom function
      return res.redirect('/');
    } catch (error) {
      console.error('Error saving user data:', error);
      return res.redirect('/error');
    }
});

// Define Routes
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));


app.listen(5000);