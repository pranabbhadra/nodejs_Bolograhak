const express = require('express');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
//const cookieParser = require('cookie-parser');


const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
})

// const app = express();
// app.use(cookieParser());

//-- Register --//
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

        db.query('INSERT INTO users SET ?', { first_name: first_name, last_name: last_name, email: email, phone: phone, password: hasPassword, user_registered:formattedDate, user_status:1, user_type_id: 2}, (err, results) => {
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
                //console.log(results);
                // return res.render('sign-up', {
                //     message: 'User registered.'
                // })
                return res.send(
                    {
                        statue: 'ok',
                        data: results,
                        message: 'User registered'
                    }
                )
            }
        })
    })
}

//-- Login --//
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
                        if( user.user_type_id==1 && user.user_status==1){
                            // Set a cookie
                            const userData = { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, phone: user.phone, user_type_id: user.user_type_id };
                            const encodedUserData = JSON.stringify(userData);
                            res.cookie('user', encodedUserData);
                            //res.redirect('/dashboard');
                            return res.send(
                                {
                                    statue: 'ok',
                                    data: userData,
                                    message: 'Login Successfull'
                                }
                            )
                        }else{
                            let err_msg = '';
                            if(user.user_status==0){
                                err_msg = 'your account is inactive, please contact with administrator.';
                            }else{
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