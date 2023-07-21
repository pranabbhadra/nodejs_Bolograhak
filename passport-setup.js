// passport-setup.js

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

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
