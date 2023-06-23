const express = require('express');
const path = require('path');

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
router.get('/dashboard', (req, res) => {
    const encodedUserData = req.cookies.user;

    if (encodedUserData) {
        const userData = JSON.parse(encodedUserData);
        res.render('dashboard', { userData });
    } else {
        res.redirect('sign-in');
    }
});

router.get('/profile', (_, resp) => {
    const user = {
        name: 'Peter',
        email: 'peter@test.com',
        country: 'USA'
    }
    resp.render('profile', { user })
});

router.get('/help', (_, resp) => {
    resp.sendFile(`${publicPath}/help.html`)
});

router.get('*', (_, resp) => {
    resp.sendFile(`${publicPath}/nopage.html`)
});

module.exports = router;