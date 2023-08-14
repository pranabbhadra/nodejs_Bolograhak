
const express = require('express');
const db = require('../config');
const mdlconfig = require('../config-module');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const useragent = require('useragent');
const requestIp = require('request-ip');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const cookieParser = require('cookie-parser');
const secretKey = 'grahak-secret-key';
const path = require('path');

const app = express();

const comFunction = require('../common_function');
const axios = require('axios');
//const cookieParser = require('cookie-parser');
app.use(cookieParser());
// Set up multer storage for file upload
const multer = require('multer');

const upload=multer({
    storage : multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        //const originalname = file.originalname;
        // const sanitizedFilename = originalname.replace(/[^a-zA-Z0-9\-\_\.]/g, ''); // Remove symbols and spaces
        // const filename = Date.now() + '-' + sanitizedFilename;
        cb(null, file.fieldname + "-"+Date.now() + ".jpg");
        }
    })
})

//const upload = multer({ storage: storage });


exports.register = (req, res) => {
    console.log(req.body);
    const { first_name, last_name, email, phone, password, confirm_password, toc } = req.body;

    db.query('SELECT email FROM users WHERE email = ? OR phone = ?', [email, phone], async (err, results) => {
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

        let hasPassword = await bcrypt.hash(password, 8);
        console.log(hasPassword);
        const currentDate = new Date();

        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const hours = String(currentDate.getHours()).padStart(2, '0');
        const minutes = String(currentDate.getMinutes()).padStart(2, '0');
        const seconds = String(currentDate.getSeconds()).padStart(2, '0');

        const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

            
        db.query('INSERT INTO users SET ?', { first_name: first_name, last_name: last_name, email: email, phone: phone, password: hasPassword, user_registered: formattedDate, user_status: 1, user_type_id: 2 }, async (err, results) => {
            if (err) {
                return res.send(
                    {
                        status: 'err',
                        data: '',
                        message: 'An error occurred while processing your request' + err
                    });
                }
                console.log(results, 'User Table');
                const user_id=results.insertId;
                const profilePicFile = req.file;
                
                if (profilePicFile) {
                    
                    db.query('UPDATE user_customer_meta SET profile_pic = ? WHERE user_id = ?', [profilePicFile.filename, results.insertId]);
                }

                db.query(
                    'INSERT INTO user_customer_meta SET ?',
                    {
                      user_id: user_id,
                      address: '',
                      country: '',
                      state: '',
                      city: '',
                      zip: '',
                      review_count: 0,
                      date_of_birth: '',
                      occupation: '',
                      gender: '',
                      profile_pic: req.file ? req.file.filename : '',
                    },
                    (err, results) => {
                      if (err) {
                        return res.status(500).json({
                          status: 'error',
                          message: 'An error occurred while processing your request' + err,
                        });
                      }
            
                      return res.json({
                        status: 'success',
                        data: null,
                        message: 'User registered',
                      });
                    }
                  );
                }
          );
     });
}
exports.login = (req, res) => {
    console.log(req.body);
    const userAgent = req.headers['user-agent'];
    const agent = useragent.parse(userAgent);
   // res.json(deviceInfo);

    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
          return res.status(500).json({
            status: 'error',
            message: 'An error occurred while processing your request',
          });
        }
    
        if (results.length === 0) {
          return res.status(404).json({
            status: 'error',
            message: 'User not found',
          });
        }
    
        const user = results[0];
        const isPasswordMatch = await bcrypt.compare(password, user.password);
    
        if (!isPasswordMatch) {
          return res.status(401).json({
            status: 'error',
            message: 'Invalid credentials',
          });
        }
    
        const token = jwt.sign({ userId: user.id }, secretKey, {
          expiresIn: '1h', 
        });
    

        const clientIp = requestIp.getClientIp(req);
        const userAgent = useragent.parse(req.headers['user-agent']);
    
        return res.json({
          status: 'success',
          data: {
            user_id: user.user_id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            token: token,
          },
          message: 'Login successful',
          client_ip: clientIp,
          user_agent: userAgent.toString(),
        });
      });
    }
    exports.edituser = (req, res) => {
        const { user_id, first_name, last_name,phone, address, country, state, city, zip, date_of_birth,occupation, gender } = req.body;
        console.log(req.body)
        db.query(
            'UPDATE users SET first_name=?, last_name=?,phone=? WHERE user_id=?',
            [first_name, last_name, phone,user_id],
            (err, results) => {
                if (err) {
                    return res.status(500).json({
                        status: 'error',
                        message: 'An error occurred while updating user information',
                    });
                }
    
                db.query(
                    'UPDATE user_customer_meta SET address=?, country=?, state=?, city=?, zip=?, date_of_birth=?, occupation=?, gender=? WHERE user_id=?',
                    [address, country, state, city, zip, date_of_birth, occupation, gender, user_id],
                    (err, results) => {
                        if (err) {
                            return res.status(500).json({
                                status: 'error',
                                message: 'An error occurred while updating user information',
                            });
                        }
                        const profilePicFile = req.file;
                        if (!profilePicFile) {
                            return res.status(400).json({
                                status: 'error',
                                message: 'Profile picture file is required',
                            });
                        }
                        db.query(
                            'SELECT profile_pic FROM user_customer_meta WHERE user_id=?',
                            [user_id],
                            (err, result) => {
                                if (err) {
                                    console.error('Error fetching previous profile picture:', err);
                                }
    
                                if (result && result.length > 0) {
                                    const previousProfilePicFilename = result[0].profile_pic;
                                    if (previousProfilePicFilename) {
                                        const previousProfilePicPath = 'uploads/' + previousProfilePicFilename;
                                        fs.unlink(previousProfilePicPath, (err) => {
                                            if (err) {
                                                console.error('Error deleting previous profile picture:', err);
                                            } else {
                                                console.log('Previous profile picture deleted');
                                            }
                                        });
                                    }
                                }
                                db.query(
                                    'UPDATE user_customer_meta SET profile_pic=? WHERE user_id=?',
                                    [profilePicFile.filename, user_id],
                                    (err, results) => {
                                        if (err) {
                                            return res.status(500).json({
                                                status: 'error',
                                                message: 'An error occurred while updating the profile picture',
                                            });
                                        }
    
                                        return res.json({
                                            status: 'success',
                                            data: "",
                                            message: 'User information updated successfully',
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    };
    


exports.createcategories = (req, res) => {
  console.log('category', req.body);
  console.log("aaaaa");
  const { cat_name, cat_parent_id, country } = req.body;
  
  // Check if category_name is provided and not empty
  if (!cat_name || cat_name.trim() === '') {
      return res.status(400).json({
          status: 'error',
          message: 'Category name is required',
      });
  }

  const cat_img = req.file ? req.file.filename : null; 

  const sql = 'INSERT INTO category (category_name, parent_id, category_img) VALUES (?, ?, ?)';
  db.query(sql, [cat_name, cat_parent_id || null, cat_img], async (err, result) => {
      if (err) {
          console.log(err);
          return res.status(500).json({
              status: 'error',
              message: 'An error occurred while creating a new category',
          });
      }

      for (const countryId of country) {
          const catCountrySql = 'INSERT INTO category_country_relation (cat_id, country_id) VALUES (?, ?)';
          db.query(catCountrySql, [result.insertId, countryId], (countryErr) => {
              if (countryErr) {
                  console.log(countryErr);
                  return res.status(500).json({
                      status: 'error',
                      message: 'An error occurred while creating a category-country relation',
                  });
              }
          });
      }return res.send(
                          {
                              status: 'ok',
                              data: result,
                              message: 'New Category created'
                          })
                  })
  }


exports.createcompany = (req, res) => {
  console.log('company', req.body);
  console.log('aaaaaa');

  const { comp_email, company_name, comp_phone, comp_registration_id } = req.body;
  db.query('SELECT comp_email FROM company WHERE comp_email=? OR comp_phone=?', [comp_email, comp_phone], async (err, results) => {
    if (err) {
      return res.send({
        status: 'err',
        data: '',
        message: 'An error occurred while processing',
        err,
      });
    }
    if (results.length > 0) {
      return res.send({
        status: 'err',
        data: '',
        message: 'Email or phone number already exist for another company',
      });
    }
    const currentDate = new Date();

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    const logo = req.file ? req.file.path : ''; 

    const status = "1"; 
    const value = [1, company_name, logo, comp_phone, comp_email, comp_registration_id, formattedDate, status]; // Include the status value

    const Query = 'INSERT INTO company(user_created_by, company_name, logo, comp_phone, comp_email, comp_registration_id, created_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    
    db.query(Query, value, (err, results) => {
      if (err) {
        return res.send({
          status: 'err',
          data: '',
          message: 'An error occurred while processing your request',
          err,
        });
      } else {
        const companyId = results.insertId;
        let companyCategoryData = [];
        if (Array.isArray(req.body.category)) {
          companyCategoryData = req.body.category.map((categoryID) => [companyId, categoryID]);
        } else {
          try {
            companyCategoryData = JSON.parse(req.body.category).map((categoryID) => [companyId, categoryID]);
          } catch (error) {
            console.log(error);
            return res.status(400).json({
              status: 'err',
              message: 'Error while parsing category data',
              error,
            });
          }
        }
        const categoryQuery = 'INSERT INTO company_cactgory_relation (company_id, category_id) VALUES ?';
        db.query(categoryQuery, [companyCategoryData], function (error, results) {
          if (error) {
            console.log(error);
            res.status(400).json({
              status: 'err',
              message: 'Error while creating company category',
              error,
            });
          } else {
            return res.send({
              status: 'ok',
              data: companyId,
              message: 'New company created'
            });
          }
        });
      }
    });
  });
};


exports.editcompany = (req, res) => {
  console.log('company', req.body);
 

  const companyId = req.body.company_id;
  console.log(companyId)
  const { comp_email, company_name, comp_phone, comp_registration_id } = req.body;

  const currentDate = new Date();

  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const hours = String(currentDate.getHours()).padStart(2, '0');
  const minutes = String(currentDate.getMinutes()).padStart(2, '0');
  const seconds = String(currentDate.getSeconds()).padStart(2, '0');

  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

  const logo = req.file ? req.file.path : ''; 

  const statusValue = "1"; 

  const checkQuery = 'SELECT * FROM company WHERE (comp_email=? OR comp_phone=?) AND ID =?';
  const checkValues = [comp_email, comp_phone, companyId];

  db.query(checkQuery, checkValues, (err, results) => {
    if (err) {
      return res.send({
        status: 'err',
        data: '',
        message: "An error occurred while processing"
      });
    }
    if (results.length > 0) {
      return res.send({
        status: 'err',
        data: '',
        message: "Email ID or phone number already exist for another company"
      });
    }

    db.query('SELECT logo FROM company WHERE ID = ?', [companyId], (err, logoResult) => {
      if (err) {
        console.error(err);
      } else {
        // if (logoResult.length > 0 && logoResult[0].logo) {
        //   const previousLogoPath = logoResult[0].logo;
          if (logoResult && logoResult.length>0) {
          const previousLogoPath = logoResult[0].logo;

          // Delete the previous logo file from the server
          fs.unlink(previousLogoPath, (err) => {
            if (err) {
              console.error('Error deleting previous logo:', err);
            } else {
              console.log('Previous logo deleted:', previousLogoPath);
            }

            // Now, update the company details including the logo
            const updateQuery = 'UPDATE company SET company_name = ?, logo = ?, comp_phone = ?, comp_email = ?, comp_registration_id = ?, updated_date = ?, status = ? WHERE ID = ?';
            const updateValues = [company_name, logo, comp_phone, comp_email, comp_registration_id, formattedDate, statusValue, companyId];

            db.query(updateQuery, updateValues, (err, results) => {
              if (err) {
                return res.send({
                  status: 'err',
                  data: '',
                  message: "An error occurred while updating company details"
                });
              }

              const deleteQuery = 'DELETE FROM company_cactgory_relation WHERE company_id=?';
              db.query(deleteQuery, [companyId], (err) => {
                if (err) {
                  return res.send({
                    status: 'err',
                    data: '',
                    message: 'An error occurred while deleting existing company categories: ' + err
                  });
                }

                const categories = req.body.category;
                let companyCategoryData = [];

                if (Array.isArray(categories)) {
                  companyCategoryData = categories.map((categoryID) => [companyId, categoryID]);
                } else {
                  try {
                    companyCategoryData = JSON.parse(categories).map((categoryID) => [companyId, categoryID]);
                  } catch (error) {
                    console.log(error);
                    return res.status(400).json({
                      status: 'err',
                      message: 'Error while parsing category data',
                      error,
                    });
                  }
                }

                const insertQuery = 'INSERT INTO company_cactgory_relation (company_id, category_id) VALUES ?';
                db.query(insertQuery, [companyCategoryData], (err) => {
                  if (err) {
                    return res.send({
                      status: 'err',
                      data: '',
                      message: 'An error occurred while updating company categories: ' + err
                    });
                  }

                  // Return success response
                  return res.send({
                    status: 'ok',
                    data: companyId,
                    message: 'Company details updated successfully'
                  });
                });
              });
            });
          });
        } else {
          // No previous logo to delete, proceed with updating company details
          const updateQuery = 'UPDATE company SET company_name = ?, logo = ?, comp_phone = ?, comp_email = ?, comp_registration_id = ?, updated_date = ?, status = ? WHERE ID = ?';
          const updateValues = [company_name, logo, comp_phone, comp_email, comp_registration_id, formattedDate, statusValue, companyId];

          db.query(updateQuery, updateValues, (err, results) => {
            if (err) {
              return res.send({
                status: 'err',
                data: '',
                message: "An error occurred while updating company details"
              });
            }

            const deleteQuery = 'DELETE FROM company_cactgory_relation WHERE company_id=?';
            db.query(deleteQuery, [companyId], (err) => {
              if (err) {
                return res.send({
                  status: 'err',
                  data: '',
                  message: 'An error occurred while deleting existing company categories: ' + err
                });
              }

              const categories = req.body.category;
              let companyCategoryData = [];

              if (Array.isArray(categories)) {
                companyCategoryData = categories.map((categoryID) => [companyId, categoryID]);
              } else {
                try {
                  companyCategoryData = JSON.parse(categories).map((categoryID) => [companyId, categoryID]);
                } catch (error) {
                  console.log(error);
                  return res.status(400).json({
                    status: 'err',
                    message: 'Error while parsing category data',
                    error,
                  });
                }
              }

              const insertQuery = 'INSERT INTO company_cactgory_relation (company_id, category_id) VALUES ?';
              db.query(insertQuery, [companyCategoryData], (err) => {
                if (err) {
                  return res.send({
                    status: 'err',
                    data: '',
                    message: 'An error occurred while updating company categories: ' + err
                  });
                }

                // Return success response
                return res.send({
                  status: 'ok',
                  data: companyId,
                  message: 'Company details updated successfully'
                });
              });
            });
          });
        }
      }
    });
  });
};



exports.createcompanylocation = (req, res) => {
    console.log(req.body);
    console.log('aaaaa');
    const {
        company_id,
        address,
        country,
        state,
        city,
        zip,
       
    } = req.body;

    console.log('Received company_id:', company_id);

    // Check if the company_id exists in the company table before inserting into company_location
    const checkCompanyQuery = 'SELECT ID FROM company WHERE ID = ?';
    db.query(checkCompanyQuery, [company_id], (checkError, checkResults) => {
        if (checkError) {
            return res.status(500).json({
                status: 'error',
                message: 'Error while checking company existence',
                error: checkError
            });
        }

        console.log('Check company results:', checkResults);

        if (checkResults.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Company does not exist',checkError
            });
        }

        // Insert into company_location table
        const addressQuery = 'INSERT INTO company_location(company_id, address, country, state, city, zip) VALUES (?, ?, ?, ?, ?, ?)';
        const addressValues = [company_id, address, country, state, city, zip]; // Include the 'status' value here
        
        db.query(addressQuery, addressValues, (insertError, results) => {
            if (insertError) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Error while creating company address',
                    error: insertError
                });
            }
        
            return res.status(200).json({
                status: 'success',
                data: results.insertId,
                message: 'Company address created successfully'
            });
        });
        
    });
};



exports.createReviewSubmit = (req, res) => {
  const reviewData = req.body;
  const customerId = 1; // Replace with the desired customer ID

  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const hours = String(currentDate.getHours()).padStart(2, '0');
  const minutes = String(currentDate.getMinutes()).padStart(2, '0');
  const seconds = String(currentDate.getSeconds()).padStart(2, '0');

  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  //const submitReview = (reviewData, customerId, formattedDate, res) => {
  // Check if the company exists in the company table
  const checkCompanyQuery = 'SELECT ID FROM company WHERE ID = ?';
  db.query(checkCompanyQuery, [reviewData.company_id], (err, companyResult) => {
    if (err) {
      console.error('Error checking company:', err);
      res.status(500).json({ error: 'Error checking company' });
    } else if (companyResult.length === 0) {
      const createCompanyQuery = 'INSERT INTO company (ID, company_name,user_created_by,created_date) VALUES (?, ?,?,?)';
      const companyValues = [reviewData.company_id, reviewData.company_name, '1', formattedDate];
      db.query(createCompanyQuery, companyValues, (err) => {
        if (err) {
          console.error('Error creating company:', err);
          res.status(500).json({ error: 'Error creating company' });
        } else {
          // Create location and submit the review
          const createLocationQuery = 'INSERT INTO company_location (address, country, state, city, zip) VALUES (?, ?, ?, ?, ?, ?)';
          db.query(createLocationQuery, [reviewData.address, reviewData.country, reviewData.state, reviewData.city, reviewData.zip], (err) => {
            if (err) {
              console.error('Error creating company location:', err);
              res.status(500).json({ error: 'Error creating company location' });
            } else {
              // Continue with review submission
              submitReview(reviewData, customerId, formattedDate, res);
            }
          });
        }
      });
    } else {
      // Check if the company location exists in the company_location table
      const checkLocationQuery = 'SELECT ID FROM company_location WHERE ID = ?';
      db.query(checkLocationQuery, [reviewData.company_location_id], (err, locationResult) => {
        if (err) {
          console.error('Error checking company location:', err);
          res.status(500).json({ error: 'Error checking company location' });
        } else if (locationResult.length === 0) {
          const createLocationQuery = 'INSERT INTO company_location(company_id, address, country, state, city, zip) VALUES (?, ?, ?, ?, ?, ?)';
      db.query(createLocationQuery, [reviewData.company_location_id, reviewData.address, reviewData.country, reviewData.state, reviewData.city, reviewData.zip], (err) => {
        if (err) {
          console.error('Error creating company location:', err);
          res.status(500).json({ error: 'Error creating company location' });
        } else {
          // Continue with review submission
          submitReview(reviewData, customerId, formattedDate, res);
        }
      });
    } else {
          const fetchLocationQuery = 'SELECT address, country, state, city, zip FROM company_location WHERE ID = ?';
          db.query(fetchLocationQuery, [reviewData.company_location_id], (err, locationDetails) => {
            if (err) {
              console.error('Error fetching company location details:', err);
              res.status(500).json({ error: 'Error fetching company location details' });
            } else {
              const insertQuery = `INSERT INTO reviews (company_id, company_location_id, customer_id, company_location, review_title, rating, review_content, user_privacy, review_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
              
              db.query(insertQuery, [
                reviewData.company_id,
                reviewData.company_location_id,
                customerId,
                locationDetails[0].address, 
                reviewData.review_title,
                reviewData.rating,
                reviewData.review_content,
                reviewData.user_privacy,
                reviewData.review_status,
                formattedDate,
                formattedDate
              ], (err, result) => {
                if (err) {
                  console.error('Error submitting review:', err);
                  res.status(500).json({ error: 'Error submitting review' });
                } else {
                  const reviewId = result.insertId;

                  // Loop through the tags and insert them into the review_tag_relation table
                  reviewData.tags.forEach(tag => {
                    const insertTagQuery = 'INSERT INTO review_tag_relation (review_id, tag_name) VALUES (?, ?)';
                    db.query(insertTagQuery, [reviewId, tag], (err, tagResult) => {
                      if (err) {
                        console.error('Error inserting tag:', err);
                      }
                    });
                  });

                  return res.send({
                    status: 'ok',
                    data: '',
                    message: 'Review submitted successfully'
                  });
                }
              });
            }
          });
        }
      });
    }
  });
}
