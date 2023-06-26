const express = require('express');
const path = require('path');
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
})

const router = express.Router();
const publicPath = path.join(__dirname, '../public');

router.get('', (_, resp) => {
    resp.sendFile(`${publicPath}/index.html`)
});

router.get('/sign-in', (req, res) => {
    const encodedUserData = req.cookies.user;
    if (encodedUserData) {
        res.redirect('dashboard');
    } else {
        res.render('sign-in', { message: '' })
    }
});

router.get('/sign-up', (req, res) => {
    res.render('sign-up', { message: '' })
});

router.get('/logout', (req, res) => {
    res.clearCookie('user');
    res.redirect('/sign-in');
});

// Protected route example

// Middleware function to check if user is logged in
const checkLoggedIn = (req, res, next) => {
    const encodedUserData = req.cookies.user;
    if (encodedUserData) {
      // User is logged in, proceed to the next middleware or route handler
      next();
    } else {
      res.redirect('sign-in');
    }
};

router.get('/dashboard', checkLoggedIn, (req, res) => {
    const encodedUserData = req.cookies.user;
    const userData = JSON.parse(encodedUserData);
    res.render('dashboard', { page_title: 'Dashboard', userData });
});

router.get('/profile', checkLoggedIn, (req, res) => {
    const encodedUserData = req.cookies.user;
    const userData = JSON.parse(encodedUserData);
    res.render('profile', { page_title: 'User Profile', userData });
});

router.get('/edit-profile', checkLoggedIn, (req, res) => {
    const encodedUserData = req.cookies.user;
    const userData = JSON.parse(encodedUserData);
    let country_response = [];
    //-- Get Country List --/
    db.query('SELECT * FROM countries', (err, results) => {
        if (err) {
            console.log(err);
        } else {
            if (results.length > 0) {
                //console.log(results);
                country_response = results;
                res.render('edit-profile', { page_title: 'Account Settings', userData, country_response });
            }
        }
    })
});

router.get('/help', (_, resp) => {
    resp.sendFile(`${publicPath}/help.html`)
});

router.get('*', (_, resp) => {
    resp.sendFile(`${publicPath}/nopage.html`)
});

module.exports = router;