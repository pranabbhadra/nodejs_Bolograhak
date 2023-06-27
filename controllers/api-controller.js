const express = require('express');
const db = require('../config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');


// --countries --//
exports.countries = (req, res) => {
    //console.log(req.body);

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
                // return res.send(
                //     {
                //         statue: 'ok',
                //         data: results,
                //         message: 'All state recived'
                //     }
                // )
                return res.status(200).json({
                    statue: 'ok',
                    data: results,
                    message: 'All countries received',
                  });
            }
        }
    })
}

//-- States --//
exports.states = (req, res) => {
    //console.log(req.body);

    db.query('SELECT * FROM states WHERE country_id = ?', [req.body.country_id], async (err, results) => {
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
                return res.send(
                    {
                        statue: 'ok',
                        data: results,
                        message: 'All state recived'
                    }
                )
            } else {
                return res.send(
                    {
                        statue: 'err',
                        data: '',
                        message: 'State not avilable for this country id'
                    }
                )
            }
        }
    })
}

//-- Profile Edit --//
exports.editProfile = (req, res) => {
    //console.log(req.body);
    const encodedUserData = req.cookies.user;
    const userData = JSON.parse(encodedUserData);
    const userId = userData.user_id;

    const checkQuery = 'SELECT user_id FROM users WHERE phone = ? AND user_id <> ?';
    db.query(checkQuery, [req.body.phone, userId], (checkError, checkResults) => {
        if (checkError) {
            //console.log(checkError)
            return res.send(
                {
                    statue: 'err',
                    data: '',
                    message: 'An error occurred while processing your request' + checkError
                }
            )
        }

        if (checkResults.length > 0) {
            // Phone number already exists for another user
            return res.send(
                {
                    statue: 'err',
                    data: '',
                    message: 'Phone number already exists for another user'
                }
            )
        } else {
            // Update the user's data
            const updateQuery = 'UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE user_id = ?';
            db.query(updateQuery, [req.body.first_name, req.body.last_name, req.body.phone, userId], (updateError, updateResults) => {

                if (updateError) {
                    //console.log(updateError);
                    return res.send(
                        {
                            statue: 'err',
                            data: '',
                            message: 'An error occurred while processing your request' + updateError
                        }
                    )
                } else {
                    // Update the user's meta data

                    if (req.file) {
                        // Unlink (delete) the previous file
                        const unlinkprofilePicture = "uploads/"+userData.profile_pic;
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
                        db.query(updateQueryMeta, [req.body.address, req.body.country, req.body.state, req.body.city, req.body.zip, req.body.date_of_birth, '', req.body.gender, req.file.filename, userId], (updateError, updateResults) => {
                            if (updateError){
                                return res.send(
                                    {
                                        statue: 'err',
                                        data: '',
                                        message: 'An error occurred while processing your request' + updateError
                                    }
                                )
                            }else{
                                const userupdatedData = {
                                    user_id: userId,
                                    first_name: req.body.first_name,
                                    last_name: req.body.last_name,
                                    email: userData.email,
                                    phone: req.body.phone,
                                    user_type_id: userData.user_type_id,
                                    address: req.body.address,
                                    country: req.body.country,
                                    country_name: req.body.country_name,
                                    state: req.body.state,
                                    state_name: req.body.state_name,
                                    city: req.body.city,
                                    zip: req.body.zip,
                                    review_count: userData.review_count,
                                    date_of_birth: req.body.date_of_birth,
                                    occupation: userData.occupation,
                                    gender: req.body.gender,
                                    profile_pic: req.file.filename
                                };
                                const encodedUserData = JSON.stringify(userupdatedData);
                                res.cookie('user', encodedUserData);
                                return res.send(
                                    {
                                        statue: 'ok',
                                        data: userupdatedData,
                                        message: 'Update Successfull'
                                    }
                                )
                            }
                        });

                    } else {
                        const updateQueryMeta = 'UPDATE user_customer_meta SET address = ?, country = ?, state = ?, city = ?, zip = ?, date_of_birth = ?, occupation = ?, gender = ? WHERE user_id = ?';
                        db.query(updateQueryMeta, [req.body.address, req.body.country, req.body.state, req.body.city, req.body.zip, req.body.date_of_birth, '', req.body.gender, userId], (updateError, updateResults) => {
                            if (updateError){
                                return res.send(
                                    {
                                        statue: 'err',
                                        data: '',
                                        message: 'An error occurred while processing your request' + updateError
                                    }
                                )
                            }else{
                                const userupdatedData = {
                                    user_id: userId,
                                    first_name: req.body.first_name,
                                    last_name: req.body.last_name,
                                    email: userData.email,
                                    phone: req.body.phone,
                                    user_type_id: userData.user_type_id,
                                    address: req.body.address,
                                    country: req.body.country,
                                    country_name: req.body.country_name,
                                    state: req.body.state,
                                    state_name: req.body.state_name,
                                    city: req.body.city,
                                    zip: req.body.zip,
                                    review_count: userData.review_count,
                                    date_of_birth: req.body.date_of_birth,
                                    occupation: userData.occupation,
                                    gender: req.body.gender,
                                    profile_pic: userData.profile_pic
                                };
                                const encodedUserData = JSON.stringify(userupdatedData);
                                res.cookie('user', encodedUserData);
                                return res.send(
                                    {
                                        statue: 'ok',
                                        data: userupdatedData,
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
