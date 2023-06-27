const express = require('express');
const db = require('../config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
//const cookieParser = require('cookie-parser');

// const app = express();
// app.use(cookieParser());

//-- Register Function--//
exports.register = (req, res) => {
    console.log(req.body);

    const { first_name, last_name, email, phone, password, confirm_password, toc } = req.body;

    db.query('SELECT email FROM users WHERE email = ? OR phone = ?', [email, phone], async (err, results) => {
        if (err) {
            // return res.render('sign-up', {
            //     message: 'An error occurred while processing your request' + err
            // })
            return res.send(
                {
                    statue: 'err',
                    data: '',
                    message: 'An error occurred while processing your request' + err
                }
            )
        }

        if (results.length > 0) {
            // return res.render('sign-up', {
            //     message: 'Email ID already exist'
            // })
            return res.send(
                {
                    statue: 'err',
                    data: '',
                    message: 'Email ID or Phone number already exist'
                }
            )
        }

        let hasPassword = await bcrypt.hash(password, 8);
        //console.log(hasPassword);
        const currentDate = new Date();

        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const hours = String(currentDate.getHours()).padStart(2, '0');
        const minutes = String(currentDate.getMinutes()).padStart(2, '0');
        const seconds = String(currentDate.getSeconds()).padStart(2, '0');

        const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        db.query('INSERT INTO users SET ?', { first_name: first_name, last_name: last_name, email: email, phone: phone, password: hasPassword, user_registered: formattedDate, user_status: 1, user_type_id: 2 }, (err, results) => {
            if (err) {
                // return res.render('sign-up', {
                //     message: 'An error occurred while processing your request' + err
                // })
                return res.send(
                    {
                        statue: 'err',
                        data: '',
                        message: 'An error occurred while processing your request' + err
                    }
                )
            } else {
                //console.log(results,'User Table');
                //-- Insert User data to meta table--------//
                db.query('INSERT INTO user_customer_meta SET ?', { user_id: results.insertId, address: '', country: '', state: '', city: '', zip: '', review_count: 0, date_of_birth: '', occupation: '', gender: '', profile_pic: '' }, (err, results) => {
                    return res.send(
                        {
                            statue: 'ok',
                            data: results,
                            message: 'User registered'
                        }
                    )
                })
            }
        })
    })
}

//-- Login Function --//
exports.login = (req, res) => {
    console.log(req.body);

    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
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
                const user = results[0];
                console.log(user);
                // Compare the provided password with the stored hashed password
                bcrypt.compare(password, user.password, (err, result) => {
                    if (err) {
                        return res.send(
                            {
                                statue: 'err',
                                data: '',
                                message: 'Error: ' + err
                            }
                        )
                    }
                    if (result) {
                        //check Administrative Login
                        if (user.user_type_id == 1 && user.user_status == 1) {
                            const query = `
                                        SELECT user_meta.*, c.name as country_name, s.name as state_name
                                        FROM user_customer_meta user_meta
                                        JOIN countries c ON user_meta.country = c.id
                                        JOIN states s ON user_meta.state = s.id
                                        WHERE user_id = ?
                                        `;
                            db.query(query, [user.user_id], async (err, results) => {
                                if (results.length > 0) {
                                    const user_meta = results[0];
                                    //console.log(user_meta,'aaaaaaaa');
                                    // Set a cookie
                                    const dateString = user_meta.date_of_birth;
                                    const date_of_birth_date = new Date(dateString);
                                    const formattedDate = date_of_birth_date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

                                    const userData = {
                                        user_id: user.user_id,
                                        first_name: user.first_name,
                                        last_name: user.last_name,
                                        email: user.email,
                                        phone: user.phone,
                                        user_type_id: user.user_type_id,
                                        address: user_meta.address,
                                        country: user_meta.country,
                                        country_name: user_meta.country_name,
                                        state: user_meta.state,
                                        state_name: user_meta.state_name,
                                        city: user_meta.city,
                                        zip: user_meta.zip,
                                        review_count: user_meta.review_count,
                                        date_of_birth: formattedDate,
                                        occupation: user_meta.occupation,
                                        gender: user_meta.gender,
                                        profile_pic: user_meta.profile_pic
                                    };
                                    const encodedUserData = JSON.stringify(userData);
                                    res.cookie('user', encodedUserData);
                                    console.log(encodedUserData, 'login user data');
                                    return res.send(
                                        {
                                            statue: 'ok',
                                            data: userData,
                                            message: 'Login Successfull'
                                        }
                                    )
                                } else {
                                    // Set a cookie
                                    const userData = {
                                        user_id: user.user_id,
                                        first_name: user.first_name,
                                        last_name: user.last_name,
                                        email: user.email,
                                        phone: user.phone,
                                        user_type_id: user.user_type_id
                                    };
                                    const encodedUserData = JSON.stringify(userData);
                                    res.cookie('user', encodedUserData);
                                    return res.send(
                                        {
                                            statue: 'ok',
                                            data: userData,
                                            message: 'Login Successfull'
                                        }
                                    )
                                }
                            })
                        } else {
                            let err_msg = '';
                            if (user.user_status == 0) {
                                err_msg = 'your account is inactive, please contact with administrator.';
                            } else {
                                err_msg = 'You do not have permission to login as administrator.';
                            }
                            return res.send(
                                {
                                    statue: 'err',
                                    data: '',
                                    message: err_msg
                                }
                            )
                        }
                    } else {
                        return res.send(
                            {
                                statue: 'err',
                                data: '',
                                message: 'Invalid password'
                            }
                        )
                    }
                });
            } else {
                return res.send(
                    {
                        statue: 'err',
                        data: '',
                        message: 'Invalid Email'
                    }
                )
            }
        }
    })
}

//--- Create New User ----//
exports.createUser = (req, res) => {
    console.log(req.body);

    db.query('SELECT email FROM users WHERE email = ? OR phone = ?', [req.body.email, req.body.phone], async (err, results) => {
        if (err) {
            return res.send(
                {
                    statue: 'err',
                    data: '',
                    message: 'An error occurred while processing your request' + err
                }
            )
        }

        if (results.length > 0) {
            
            return res.send(
                {
                    statue: 'err',
                    data: '',
                    message: 'Email ID or Phone number already exist'
                }
            )
        }

        let hasPassword = await bcrypt.hash(req.body.password, 8);
        //console.log(hasPassword);
        const currentDate = new Date();

        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const hours = String(currentDate.getHours()).padStart(2, '0');
        const minutes = String(currentDate.getMinutes()).padStart(2, '0');
        const seconds = String(currentDate.getSeconds()).padStart(2, '0');

        const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        db.query('INSERT INTO users SET ?',
                {
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    email: req.body.email,
                    phone: req.body.phone,
                    password: hasPassword,
                    user_registered: formattedDate,
                    user_status: 1,
                    user_type_id: req.body.user_type_id
                }, (err, results) => {
            if (err) {
                return res.send(
                    {
                        statue: 'err',
                        data: '',
                        message: 'An error occurred while processing your request' + err
                    }
                )
            } else {
                //console.log(results,'User Table');
                //-- Insert User data to meta table--------//
                if (req.file) {
                    db.query('INSERT INTO user_customer_meta SET ?',
                                {
                                    user_id: results.insertId,
                                    address: req.body.address,
                                    country: req.body.country,
                                    state: req.body.state,
                                    city: req.body.city,
                                    zip: req.body.zip,
                                    review_count: 0,
                                    date_of_birth: req.body.date_of_birth,
                                    occupation: req.body.occupation,
                                    gender: req.body.gender,
                                    profile_pic: req.file.filename,
                                }, (err, results) => {
                        return res.send(
                            {
                                statue: 'ok',
                                data: results,
                                message: 'New user created'
                            }
                        )
                    })
                } else {
                    db.query('INSERT INTO user_customer_meta SET ?',
                                {
                                    user_id: results.insertId,
                                    address: req.body.address,
                                    country: req.body.country,
                                    state: req.body.state,
                                    city: req.body.city,
                                    zip: req.body.zip,
                                    review_count: 0,
                                    date_of_birth: req.body.date_of_birth,
                                    occupation: req.body.occupation,
                                    gender: req.body.gender,
                                    profile_pic: '',
                                }, (err, results) => {
                        return res.send(
                            {
                                statue: 'ok',
                                data: results,
                                message: 'New user created'
                            }
                        )
                    })
                }
            }
        })
    })
}