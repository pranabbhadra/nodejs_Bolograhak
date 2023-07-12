const express = require('express');
const db = require('../config');
const mdlconfig = require('../config-module');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const useragent = require('useragent');
const requestIp = require('request-ip');
const fs = require('fs');
const comFunction = require('../common_function');
//const cookieParser = require('cookie-parser');

// const app = express();
// app.use(cookieParser());


//-- Register Function--//
exports.register = (req, res) => {
    //console.log(req.body);

    const { first_name, last_name, email, phone, password, confirm_password, toc } = req.body;

    db.query('SELECT email FROM users WHERE email = ? OR phone = ?', [email, phone], async (err, results) => {
        if (err) {
            // return res.render('sign-up', {
            //     message: 'An error occurred while processing your request' + err
            // })
            return res.send(
                {
                    status: 'err',
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
                    status: 'err',
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
                        status: 'err',
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
                            status: 'ok',
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
    //console.log(req.body);
    const userAgent = req.headers['user-agent'];
    const agent = useragent.parse(userAgent);

    //res.json(deviceInfo);

    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            return res.send(
                {
                    status: 'err',
                    data: '',
                    message: 'An error occurred while processing your request' + err
                }
            )
        } else {
            if (results.length > 0) {
                const user = results[0];
                //console.log(user);
                // Compare the provided password with the stored hashed password
                bcrypt.compare(password, user.password, (err, result) => {
                    if (err) {
                        return res.send(
                            {
                                status: 'err',
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
                                let userData = {};
                                if (results.length > 0) {
                                    const user_meta = results[0];
                                    //console.log(user_meta,'aaaaaaaa');
                                    // Set a cookie
                                    const dateString = user_meta.date_of_birth;
                                    const date_of_birth_date = new Date(dateString);
                                    const formattedDate = date_of_birth_date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

                                    let userData = {
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
                                    //console.log(encodedUserData, 'login user data');
                                } else {
                                    // Set a cookie
                                    let userData = {
                                        user_id: user.user_id,
                                        first_name: user.first_name,
                                        last_name: user.last_name,
                                        email: user.email,
                                        phone: user.phone,
                                        user_type_id: user.user_type_id
                                    };
                                    const encodedUserData = JSON.stringify(userData);
                                    res.cookie('user', encodedUserData);
                                }
                                //console.log(userData, 'User data');
                                //-- check last Login Info-----//
                                const device_query = "SELECT * FROM user_device_info WHERE user_id = ?";
                                db.query(device_query, [user.user_id], async (err, device_query_results) => {
                                    const currentDate = new Date();
                                    const year = currentDate.getFullYear();
                                    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                                    const day = String(currentDate.getDate()).padStart(2, '0');
                                    const hours = String(currentDate.getHours()).padStart(2, '0');
                                    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
                                    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
                                    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

                                    if (device_query_results.length > 0) {
                                        // User exist update info
                                        const device_update_query = 'UPDATE user_device_info SET device_id = ?, IP_address = ?, last_logged_in = ? WHERE user_id = ?';
                                        const values = [agent.toAgent() + ' ' + agent.os.toString(), requestIp.getClientIp(req), formattedDate, user.user_id];
                                        db.query(device_update_query, values, (err, device_update_query_results) => {
                                            return res.send(
                                                {
                                                    status: 'ok',
                                                    data: userData,
                                                    message: 'Login Successfull'
                                                }
                                            )
                                        })
                                    } else {
                                        // User doesnot exist Insert New Row.

                                        const device_insert_query = 'INSERT INTO user_device_info (user_id, device_id, device_token, imei_no, model_name, make_name, IP_address, last_logged_in, created_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
                                        const values = [user.user_id, agent.toAgent() + ' ' + agent.os.toString(), '', '', '', '', requestIp.getClientIp(req), formattedDate, formattedDate];

                                        db.query(device_insert_query, values, (err, device_insert_query_results) => {
                                            return res.send(
                                                {
                                                    status: 'ok',
                                                    data: userData,
                                                    message: 'Login Successfull'
                                                }
                                            )
                                        })

                                    }
                                })
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
                                    status: 'err',
                                    data: '',
                                    message: err_msg
                                }
                            )
                        }
                    } else {
                        return res.send(
                            {
                                status: 'err',
                                data: '',
                                message: 'Invalid password'
                            }
                        )
                    }
                });
            } else {
                return res.send(
                    {
                        status: 'err',
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
    //console.log(req.body);
    db.query('SELECT email FROM users WHERE email = ? OR phone = ?', [req.body.email, req.body.phone], async (err, results) => {
        if (err) {
            return res.send(
                {
                    status: 'err',
                    data: '',
                    message: 'An error occurred while processing your request' + err
                }
            )
        }

        if (results.length > 0) {

            return res.send(
                {
                    status: 'err',
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
                            status: 'err',
                            data: '',
                            message: 'An error occurred while processing your request' + err
                        }
                    )
                } else {
                    //console.log(results,'User Table');
                    //-- Insert User data to meta table--------//
                    var insert_values = [];
                    if (req.file) {
                        insert_values = [results.insertId, req.body.address, req.body.country, req.body.state, req.body.city, req.body.zip, 0, req.body.date_of_birth, req.body.occupation, req.body.gender, req.file.filename];
                    } else {
                        insert_values = [results.insertId, req.body.address, req.body.country, req.body.state, req.body.city, req.body.zip, 0, req.body.date_of_birth, req.body.occupation, req.body.gender, ''];
                    }

                    const insertQuery = 'INSERT INTO user_customer_meta (user_id, address, country, state, city, zip, review_count, date_of_birth, occupation, gender, profile_pic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
                    db.query(insertQuery, insert_values, (error, results, fields) => {
                        if (err) {
                            console.log(err);
                        } else {
                            var mailOptions = {
                                from: 'vivek@scwebtech.com',
                                to: req.body.email,
                                subject: 'Test Message From Bolo Grahak',
                                text: 'Test Message bidy'
                            }
                            mdlconfig.transporter.sendMail(mailOptions, function (err, info) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log('Mail Send: ', info.response);
                                }
                            })
                            return res.send(
                                {
                                    status: 'ok',
                                    data: results,
                                    message: 'New user created'
                                }
                            )
                        }
                    });
                }
            })
    })
}

//Create New Category
exports.createCategory = (req, res) => {
    //console.log('category', req.body);
    const { cat_name, cat_parent_id, country } = req.body;
    const cat_sql = "SELECT category_name FROM category WHERE category_name = ?";
    db.query(cat_sql, cat_name, (cat_err, cat_result) => {
        if (cat_err) throw cat_err;
        if (cat_result.length > 0) {
            return res.send(
                {
                    status: 'Not ok',
                    message: 'Category name already exists '
                }
            )
        } else {
            if (req.file) {
                if (cat_parent_id == '') {
                    const val = [cat_name, 0, req.file.filename];
                    const sql = 'INSERT INTO category (category_name, parent_id, category_img) VALUES (?, ?, ?)';
                    db.query(sql, val, async (err, result) => {
                        if (err) {
                            console.log(err)
                        } else {
                            for (var i = 0; i < country.length; i++) {
                                db.query(`INSERT INTO category_country_relation (cat_id , country_id) VALUES (${result.insertId}, ${country[i]} )`, await function (err, country_val) {
                                    if (err) throw err;

                                });
                            }
                            return res.send(
                                {
                                    status: 'ok',
                                    data: result,
                                    message: 'New Category created'
                                }
                            )
                        }
                    })
                } else {
                    const val = [cat_name, cat_parent_id, req.file.filename];
                    const sql = 'INSERT INTO category (category_name, parent_id, category_img) VALUES (?, ?, ?)';
                    db.query(sql, val, async (err, result) => {
                        if (err) {
                            console.log(err)
                        } else {
                            for (var i = 0; i < country.length; i++) {
                                db.query(`INSERT INTO category_country_relation (cat_id , country_id) VALUES (${result.insertId}, ${country[i]} )`, await function (err, country_val) {
                                    if (err) throw err;

                                });
                            }
                            return res.send(
                                {
                                    status: 'ok',
                                    data: result,
                                    message: 'New Category created'
                                }
                            )
                        }
                    })
                }
            } else {
                if (cat_parent_id == '') {
                    const val = [cat_name, 0, 'NULL'];
                    const sql = 'INSERT INTO category (category_name, parent_id, category_img) VALUES (?, ?, ?)';
                    db.query(sql, val, async (err, result) => {
                        if (err) {
                            console.log(err)
                        } else {
                            for (var i = 0; i < country.length; i++) {
                                db.query(`INSERT INTO category_country_relation (cat_id , country_id) VALUES (${result.insertId}, ${country[i]} )`, await function (err, country_val) {
                                    if (err) throw err;

                                });
                            }
                            return res.send(
                                {
                                    status: 'ok',
                                    data: result,
                                    message: 'New Category created'
                                }
                            )
                        }
                    })
                } else {
                    const val = [cat_name, cat_parent_id, 'NULL'];
                    const sql = 'INSERT INTO category (category_name, parent_id, category_img) VALUES (?, ?, ?)';
                    db.query(sql, val, async (err, result) => {
                        if (err) {
                            console.log(err)
                        } else {
                            for (var i = 0; i < country.length; i++) {
                                db.query(`INSERT INTO category_country_relation (cat_id , country_id) VALUES (${result.insertId}, ${country[i]} )`, await function (err, country_val) {
                                    if (err) throw err;

                                });
                            }
                            return res.send(
                                {
                                    status: 'ok',
                                    data: result,
                                    message: 'New Category created'
                                }
                            )
                        }
                    })
                }
            }
        }
    })

}

//Update Category
exports.updateCategory = (req, res) => {
    console.log('category', req.body, req.file);
    const { cat_id, cat_name, cat_parent_id, country } = req.body;
    const check_arr = [cat_name, cat_id]
    const cat_sql = "SELECT category_name FROM category WHERE category_name = ? AND ID != ?";
    db.query(cat_sql, check_arr, (cat_err, cat_result) => {
        if (cat_err) throw cat_err;
        if (cat_result.length > 0) {
            return res.send(
                {
                    status: 'Not ok',
                    message: 'Category name already exists '
                }
            )
        } else {
            if (req.file) {
                const file_query = `SELECT category_img FROM category WHERE ID = ${cat_id}`;
                db.query(file_query, async function (img_err, img_res) {
                    console.log(img_res);
                    if (img_res[0].category_img != 'NULL') {
                        const filename = img_res[0].category_img;
                        const filePath = `uploads/${filename}`;
                        console.log(filePath);

                        fs.unlink(filePath, await function () {
                            console.log('file deleted');
                        })
                    }
                })
                if (cat_parent_id == '') {
                    const val = [cat_name, req.file.filename, cat_id];
                    const sql = `UPDATE category SET category_name = ?, category_img = ? WHERE ID = ?`;
                    db.query(sql, val, async (err, result) => {
                        if (err) {
                            console.log(err)
                        } else {
                            const delete_query = `DELETE FROM category_country_relation WHERE cat_id = ${cat_id}`;
                            db.query(`DELETE FROM category_country_relation WHERE cat_id = ${cat_id}`, await function (del_err, del_res) {

                            });
                            for (var i = 0; i < country.length; i++) {
                                db.query(`INSERT INTO category_country_relation (cat_id , country_id) VALUES (${cat_id}, ${country[i]} )`, await function (err, country_val) {
                                    if (err) throw err;

                                });
                            }
                            return res.send(
                                {
                                    status: 'ok',
                                    data: result,
                                    message: 'Category updated'
                                }
                            )
                        }
                    })
                } else {
                    const val = [cat_name, cat_parent_id, req.file.filename, cat_id];

                    const sql = `UPDATE category SET category_name = ?, parent_id = ?, category_img = ? WHERE ID = ?`;
                    db.query(sql, val, async (err, result) => {
                        if (err) {
                            console.log(err)
                        } else {
                            const delete_query = `DELETE FROM category_country_relation WHERE cat_id = ${cat_id}`;
                            db.query(`DELETE FROM category_country_relation WHERE cat_id = ${cat_id}`, await function (del_err, del_res) {

                            });

                            for (var i = 0; i < country.length; i++) {
                                db.query(`INSERT INTO category_country_relation (cat_id , country_id) VALUES (${cat_id}, ${country[i]} )`, await function (err, country_val) {
                                    if (err) throw err;

                                });
                            }
                            return res.send(
                                {
                                    status: 'ok',
                                    data: result,
                                    message: 'Category updated'
                                }
                            )
                        }
                    })
                }

            } else {
                if (cat_parent_id == '') {
                    const val = [cat_name, cat_id];

                    const sql = `UPDATE category SET category_name = ? WHERE ID = ?`;
                    db.query(sql, val, async (err, result) => {
                        if (err) {
                            console.log(err)
                        } else {
                            const delete_query = `DELETE FROM category_country_relation WHERE cat_id = ${cat_id}`;
                            db.query(`DELETE FROM category_country_relation WHERE cat_id = ${cat_id}`, await function (del_err, del_res) {

                            });
                            for (var i = 0; i < country.length; i++) {
                                db.query(`INSERT INTO category_country_relation (cat_id , country_id) VALUES (${cat_id}, ${country[i]} )`, await function (err, country_val) {
                                    if (err) throw err;

                                });
                            }
                            return res.send(
                                {
                                    status: 'ok',
                                    data: result,
                                    message: 'Category updated'
                                }
                            )
                        }
                    })
                } else {
                    const val = [cat_name, cat_parent_id, cat_id];

                    const sql = `UPDATE category SET category_name = ?, parent_id = ?  WHERE ID = ?`;
                    db.query(sql, val, async (err, result) => {
                        if (err) {
                            console.log(err)
                        } else {
                            const delete_query = `DELETE FROM category_country_relation WHERE cat_id = ${cat_id}`;
                            db.query(`DELETE FROM category_country_relation WHERE cat_id = ${cat_id}`, await function (del_err, del_res) {

                            });
                            for (var i = 0; i < country.length; i++) {
                                db.query(`INSERT INTO category_country_relation (cat_id , country_id) VALUES (${cat_id}, ${country[i]} )`, await function (err, country_val) {
                                    if (err) throw err;

                                });
                            }
                            return res.send(
                                {
                                    status: 'ok',
                                    data: result,
                                    message: 'Category updated'
                                }
                            )
                        }
                    })
                }
            }
        }
    })
}

//-- User Profile Edit --//
exports.editUserData = (req, res) => {
    //console.log(req.body);
    const userId = req.body.user_id;

    const checkQuery = 'SELECT user_id FROM users WHERE phone = ? AND user_id <> ?';
    db.query(checkQuery, [req.body.phone, userId], (checkError, checkResults) => {
        if (checkError) {
            //console.log(checkError)
            return res.send(
                {
                    status: 'err',
                    data: '',
                    message: 'An error occurred while processing your request' + checkError
                }
            )
        }

        if (checkResults.length > 0) {
            // Phone number already exists for another user
            return res.send(
                {
                    status: 'err',
                    data: '',
                    message: 'Phone number already exists for another user'
                }
            )
        } else {
            // Update the user's data
            const updateQuery = 'UPDATE users SET first_name = ?, last_name = ?, phone = ?, user_type_id = ? WHERE user_id = ?';
            db.query(updateQuery, [req.body.first_name, req.body.last_name, req.body.phone, req.body.user_type_id, userId], (updateError, updateResults) => {

                if (updateError) {
                    //console.log(updateError);
                    return res.send(
                        {
                            status: 'err',
                            data: '',
                            message: 'An error occurred while processing your request' + updateError
                        }
                    )
                } else {
                    // Update the user's meta data

                    if (req.file) {
                        // Unlink (delete) the previous file
                        const unlinkprofilePicture = "uploads/"+req.body.previous_profile_pic;
                        fs.unlink(unlinkprofilePicture, (err) => {
                            if (err) {
                                //console.error('Error deleting file:', err);
                              } else {
                                //console.log('Previous file deleted');
                              }
                        });
                        //const profilePicture = req.file;
                        //console.log(profilePicture);

                        const updateQueryMeta = 'UPDATE user_customer_meta SET address = ?, country = ?, state = ?, city = ?, zip = ?, date_of_birth = ?, occupation = ?, gender = ?, profile_pic = ? WHERE user_id = ?';
                        db.query(updateQueryMeta, [req.body.address, req.body.country, req.body.state, req.body.city, req.body.zip, req.body.date_of_birth, req.body.occupation, req.body.gender, req.file.filename, userId], (updateError, updateResults) => {
                            if (updateError){
                                return res.send(
                                    {
                                        status: 'err',
                                        data: userId,
                                        message: 'An error occurred while processing your request' + updateError
                                    }
                                )
                            }else{
                                return res.send(
                                    {
                                        status: 'ok',
                                        data: userId,
                                        message: 'Update Successfull'
                                    }
                                )
                            }
                        });

                    } else {
                        const updateQueryMeta = 'UPDATE user_customer_meta SET address = ?, country = ?, state = ?, city = ?, zip = ?, date_of_birth = ?, occupation = ?, gender = ? WHERE user_id = ?';
                        db.query(updateQueryMeta, [req.body.address, req.body.country, req.body.state, req.body.city, req.body.zip, req.body.date_of_birth, req.body.occupation, req.body.gender, userId], (updateError, updateResults) => {
                            if (updateError){
                                return res.send(
                                    {
                                        status: 'err',
                                        data: '',
                                        message: 'An error occurred while processing your request' + updateError
                                    }
                                )
                            }else{
                                return res.send(
                                    {
                                        status: 'ok',
                                        data: userId,
                                        message: 'Update Successfull'
                                    }
                                )
                            }
                        });
                    }

                }



            });
        }
    });
}

//--- Create New Company ----//
exports.createCompany = (req, res) => {
    //console.log(req.body);
    const encodedUserData = req.cookies.user;
    const currentUserData = JSON.parse(encodedUserData);

    db.query('SELECT comp_email FROM company WHERE comp_email = ? OR comp_phone = ?', [req.body.comp_email, req.body.comp_phone], async (err, results) => {
        if (err) {
            return res.send(
                {
                    status: 'err',
                    data: '',
                    message: 'An error occurred while processing your request' + err
                }
            )
        }

        if (results.length > 0) {
            
            return res.send(
                {
                    status: 'err',
                    data: '',
                    message: 'Email ID or Phone number already exist for another Company'
                }
            )
        }

        const currentDate = new Date();

        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const hours = String(currentDate.getHours()).padStart(2, '0');
        const minutes = String(currentDate.getMinutes()).padStart(2, '0');
        const seconds = String(currentDate.getSeconds()).padStart(2, '0');

        const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        var insert_values = [];
        if (req.file) {
            insert_values = [ currentUserData.user_id, req.body.company_name, req.file.filename, req.body.comp_phone, req.body.comp_email, req.body.comp_registration_id, formattedDate, formattedDate ];
        } else {
            insert_values = [ currentUserData.user_id, req.body.company_name, '', req.body.comp_phone, req.body.comp_email, req.body.comp_registration_id, formattedDate, formattedDate ];
        }

        const insertQuery = 'INSERT INTO company (user_created_by, company_name, logo, comp_phone, comp_email, comp_registration_id, created_date, updated_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        db.query(insertQuery, insert_values, (err, results, fields) => {
            if (err) {
                return res.send(
                    {
                        status: 'err',
                        data: '',
                        message: 'An error occurred while processing your request' + err
                    }
                )
            } else {
                const companyId = results.insertId;
                const companyCategoryData = req.body.category.map((categoryID) => [companyId, categoryID]); 
                db.query('INSERT INTO company_cactgory_relation (company_id, category_id) VALUES ?', [companyCategoryData], function (error, results) { 
                    if (error) {                     
                        console.log(error);                     
                        res.status(400).json({                         
                            status: 'err',                         
                            message: 'Error while creating company category'                     
                        });                 
                    }
                    else {
                        return res.send(
                            {
                                status: 'ok',
                                data: companyId,
                                message: 'New company created'
                            }
                        )
                    }
                });
            }
        })
    })
}

//-- Company Edit --//
exports.editCompany = (req, res) => {
    //console.log(req.body);
    const companyID = req.body.company_id;
    const currentDate = new Date();

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    // Check if the updated email ID or phone number already exist for another company
    const checkQuery = 'SELECT * FROM company WHERE (comp_email = ? OR comp_phone = ?) AND ID != ?';
    const checkValues = [req.body.comp_email, req.body.comp_phone, companyID];

    db.query(checkQuery, checkValues, (err, results) => {
        if (err) {
            //console.log(err)
            return res.send(
                {
                    status: 'err',
                    data: '',
                    message: 'An error occurred while processing your request' + err
                }
            )
        }

        if (results.length > 0) {
            // Email ID or phone number already exist for another company
            return res.send({
              status: 'err',
              data: '',
              message: 'Email ID or phone number already exist for another company'
            });
        }

        // Update company details in the company table
        const updateQuery = 'UPDATE company SET company_name = ?, logo = ?, comp_phone = ?, comp_email = ?, comp_registration_id = ?, updated_date = ? WHERE ID = ?';
        const updateValues = [req.body.company_name, '', req.body.comp_phone, req.body.comp_email, req.body.comp_registration_id, formattedDate, companyID];

        if (req.file) {
            // Unlink (delete) the previous file
            const unlinkcompanylogo = "uploads/"+req.body.previous_logo;
            fs.unlink(unlinkcompanylogo, (err) => {
                if (err) {
                    //console.error('Error deleting file:', err);
                  } else {
                    //console.log('Previous file deleted');
                  }
            });

            updateValues[1] = req.file.filename;
        }
        db.query(updateQuery, updateValues, (err, results) => {
            if (err) {
                // Handle the error
                return res.send({
                  status: 'err',
                  data: '',
                  message: 'An error occurred while updating the company details: ' + err
                });
            }

            // Update company categories in the company_cactgory_relation table
            const deleteQuery = 'DELETE FROM company_cactgory_relation WHERE company_id = ?';
            db.query(deleteQuery, [companyID], (err) => {
                if (err) {
                    // Handle the error
                    return res.send({
                      status: 'err',
                      data: '',
                      message: 'An error occurred while deleting existing company categories: ' + err
                    });
                }

                const categories = req.body.category; // Assuming company_categories is an array of category IDs

                // Create an array of arrays for bulk insert
                const insertValues = categories.map(categoryId => [companyID, categoryId]);

                const insertQuery = 'INSERT INTO company_cactgory_relation (company_id, category_id) VALUES ?';

                db.query(insertQuery, [insertValues], (err) => {
                    if (err) {
                        // Handle the error
                        return res.send({
                          status: 'err',
                          data: '',
                          message: 'An error occurred while updating company categories: ' + err
                        });
                    }
                    
                    // Return success response
                    return res.send({
                        status: 'ok',
                        data: companyID,
                        message: 'Company details updated successfully'
                    });
                })
            })
        })
    })
}