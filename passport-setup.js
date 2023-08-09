// passport-setup.js

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

// Configure the Google Strategy
passport.use(new GoogleStrategy({
    clientID: '465603252229-oq6lbk9754nl10vjf3rq20ku2tudatkf.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    // This function is called when the user logs in successfully
    // You can use the `profile` object to access user data
    return done(null, profile);
}));

passport.use(
    new FacebookStrategy(
      {
        clientID: '2000796626944022',
        clientSecret: 'c83b03c2fbcd7dd57a117ce0fe8fa78b',
        callbackURL: process.env.MAIN_URL+'auth/facebook/callback',
        profileFields: ['id', 'displayName', 'email', 'picture'],
      },
      (accessToken, refreshToken, profile, done) => {
        // You can save or retrieve user data from your database here.
        // For demo purposes, we'll just pass the profile to the done() function.
        return done(null, profile);
      }
    )
  );