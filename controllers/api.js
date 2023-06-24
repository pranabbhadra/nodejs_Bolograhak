const express = require('express');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');


const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
})

// const app = express();
// app.use(cookieParser());

//-- States --//
exports.states = (req, res) => {
    console.log(req.body);

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
    console.log(req.body);
    const encodedUserData = req.cookies.user;
    const userData = JSON.parse(encodedUserData);
    const userId = userData.id;
    //const profilePicture = req.file;
    console.log(req.file,'ssssssssssss');
    // Check if the updated phone number exists for any other user
    const checkQuery = 'SELECT user_id FROM users WHERE phone = ? AND user_id <> ?';
    db.query(checkQuery, [req.body.phone, userId], (checkError, checkResults) => {
      if (checkError){
        console.log(checkError)
      }
  
      if (checkResults.length > 0) {
        // Phone number already exists for another user
        res.redirect('/edit-profile?error=phone_exists');
      } else {
        // Update the user's data
        const updateQuery = 'UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE user_id = ?';
        db.query(updateQuery, [req.body.first_name, req.body.last_name, req.body.phone, userId], (updateError, updateResults) => {
          if (updateError) throw updateError;
            
          const updateQuery2 = 'UPDATE user_customer_meta SET profile_pic = ? WHERE user_id = ?';
          db.query(updateQuery2, [req.file.filename, userId], (updateError, updateResults) => {
            if (updateError) throw updateError;
            res.redirect('/profile');
          });
          // Redirect to a success page or display a success message
          
        });
      }
    });
}