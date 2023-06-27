const express = require('express');
const path = require('path');
const db = require('../config');

const router = express.Router();
const publicPath = path.join(__dirname, '../public');

router.get('', (_, resp) => {
    resp.sendFile(`${publicPath}/index.html`)
});

router.get('/countries', (req, res) =>{
    db.query('SELECT * FROM countries', (err, results) => {
        if (err) {
            return res.send(
                {
                    statue: 'err',
                    data: '',
                    message: 'An error occurred while processing your request' + err
                }
            )
        } else {
            if (results.length > 0) {
                return res.status(200).json({
                    statue: 'ok',
                    data: results,
                    message: 'All countries received',
                  });
            }
        }
    })
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
    const currentUserData = JSON.parse(encodedUserData);
    res.render('dashboard', { menu_active_class: 'here show mb-1', page_title: 'Dashboard', currentUserData });
});

router.get('/profile', checkLoggedIn, (req, res) => {
    const encodedUserData = req.cookies.user;
    const currentUserData = JSON.parse(encodedUserData);
    res.render('profile', { menu_active_class: 'here show mb-1', page_title: 'User Profile', currentUserData });
});

router.get('/edit-profile', checkLoggedIn, (req, res) => {
    const encodedUserData = req.cookies.user;
    const currentUserData = JSON.parse(encodedUserData);
    let country_response = [];
    //-- Get Country List --/
    db.query('SELECT * FROM countries', (err, results) => {
        if (err) {
            console.log(err);
        } else {
            if (results.length > 0) {
                //console.log(results);
                country_response = results;
                if(!currentUserData.country){
                    res.render('edit-profile', { page_title: 'Account Settings', currentUserData, country_response });
                }else{
                    // -- send state list --//
                    db.query('SELECT * FROM states WHERE country_id=?', [currentUserData.country], (err, state_results) => {
                        if (err) {
                            console.log(err);
                        }else{
                            if (state_results.length > 0) {
                                state_response = state_results;
                                res.render('edit-profile', { menu_active_class: 'here show mb-1', page_title: 'Account Settings', currentUserData, country_response, state_response });
                            }
                        }
                    })
                }
                
            }
        }
    })
});

router.get('/users', checkLoggedIn, (req, res) => {
    const encodedUserData = req.cookies.user;
    const currentUserData = JSON.parse(encodedUserData);
    //res.render('users', { menu_active_class: 'here show mb-1', page_title: 'Users', currentUserData });
    const user_query = `
                    SELECT users.*, user_customer_meta.*, user_account_type.role_name
                    FROM users
                    JOIN user_customer_meta ON users.user_id = user_customer_meta.user_id
                    JOIN user_account_type ON users.user_type_id = user_account_type.ID
                    `;
    db.query(user_query, (err, results) => {
        if (err) {
            return res.send(
                {
                    statue: 'err',
                    data: '',
                    message: 'An error occurred while processing your request' + err
                }
            )
        } else {
            if (results.length > 0) {
                res.render('users', { menu_active_class: 'here show mb-1', page_title: 'Users', currentUserData, 'allusers': results });
            }
        }
    })
});

router.get('/add-user', checkLoggedIn, (req, res) => {
    const encodedUserData = req.cookies.user;
    const currentUserData = JSON.parse(encodedUserData);
    let country_response = [];
    let accounts_response = [];
    const auto_password = generateRandomPassword();
    //-- Get Country List --/
    db.query('SELECT * FROM countries', (err, results) => {
        if (err) {
            console.log(err);
        } else {
            if (results.length > 0) {
                //console.log(results);
                country_response = results;
                db.query('SELECT * FROM user_account_type', (err, accountresults) => {
                    if (err) {
                        console.log(err);
                    } else {
                        if (accountresults.length > 0) {
                            //console.log(results);
                            accounts_response = accountresults;
                            res.render('add-user', { menu_active_class: 'here show mb-1', page_title: 'Add New User', currentUserData, country_response, accounts_response, auto_password });
                            
                        }
                    }
                })
                
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


function generateRandomPassword() {
    // Logic to generate a random password
    // For simplicity, this example generates a password of 8 characters with letters and numbers
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#!^&*()%';
    let password = '';
    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      password += characters.charAt(randomIndex);
    }
    return password;
  }

module.exports = router;