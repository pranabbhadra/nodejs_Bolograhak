const util = require('util');
const express = require('express');
const db = require('../config');
const mysql = require('mysql2/promise');
const mdlconfig = require('../config-module');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const useragent = require('useragent');
const requestIp = require('request-ip');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const query = util.promisify(db.query).bind(db);
const cookieParser = require('cookie-parser');
const secretKey = 'grahak-secret-key';
const path = require('path');
const multer = require('multer');

const app = express();

const comFunction = require('../common_function');
const axios = require('axios');
//const cookieParser = require('cookie-parser');
app.use(cookieParser());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
      // const originalname = file.originalname;
      // const sanitizedFilename = originalname.replace(/[^a-zA-Z0-9\-\_\.]/g, ''); // Remove symbols and spaces
      // const filename = Date.now() + '-' + sanitizedFilename;
      // cb(null, filename);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix);
  }
});
// Create multer instance
const upload = multer({ storage: storage });

//registration
exports.register = (req, res) => {
  const {
    first_name,
    last_name,
    email,
    phone,
    password,
    register_from,
    external_registration_id,
    confirm_password,
    toc,
  } = req.body;
  console.log(req.body)
  db.query('SELECT email FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) {
      return res.send({
        status: 'err',
        data: '',
        message: 'An error occurred while processing your request' + err,
      });
    }
    if (results.length > 0) {
      return res.send({
        status: 'err',
        data: {
          first_name: first_name,
          last_name: last_name,
          email: email,
        },
        message: 'Email ID already exists',
      });
    }

    let hasPassword = await bcrypt.hash(password, 8);
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');

    const userInsertData = {
      first_name: first_name,
      last_name: last_name,
      email: email,
      phone: phone,
      password: hasPassword,
      user_registered: formattedDate,
      user_status: 1,
      user_type_id: 2,
    };

    if (register_from) {
      userInsertData.register_from = register_from;
    }
    if (external_registration_id) {
      userInsertData.external_registration_id = external_registration_id;
    }

    db.query('INSERT INTO users SET ?', userInsertData, async (err, results) => {
      if (err) {
        return res.send({
          status: 'err',
          data: '',
          message: 'An error occurred while processing your request' + err,
        });
      }

      const user_id = results.insertId;
      console.log(user_id)
      const profilePicFile = req.file;
      console.log(profilePicFile)
      if (profilePicFile) {
        db.query('UPDATE user_customer_meta SET profile_pic = ? WHERE user_id = ?', [profilePicFile.filename, user_id], (err, updateResults) => {
          if (err) {
            console.error('Error updating profile picture:', err);
          }
        });
      }

      const userCustomerMetaInsertData = {
        user_id: user_id,
        address: req.body.address || null,
        country: req.body.country || null,
        state: req.body.state || null,
        city: req.body.city || null,
        zip: req.body.zip || null,
        review_count: 0,
        date_of_birth: req.body.date_of_birth || null,
        occupation: req.body.occupation || null,
        gender: req.body.gender || null,
        alternate_phone: req.body.alternate_phone || null,
        marital_status: req.body.marital_status || null,
        about: req.body.about || null,
        profile_pic: profilePicFile ? profilePicFile.filename : '',
      };
      
      console.log(userCustomerMetaInsertData)
      db.query('INSERT INTO user_customer_meta SET ?', userCustomerMetaInsertData, (err, results) => {
        if (err) {
          console.error('Error inserting into user_customer_meta:', err);
          return res.status(500).json({
            status: 'error',
            message: 'An error occurred while processing your request',
            err,
          });
        }

        const wpUserRegistrationData = {
                  username: req.body.email,
                  email: req.body.email,
                  password: req.body.password,
                  first_name: req.body.first_name,
                  last_name: req.body.last_name,
              };
        axios.post(process.env.BLOG_API_ENDPOINT + '/register', wpUserRegistrationData)
        .then((response) => {
            (async () => {
                //---- Login to Wordpress Blog-----//
                //let wp_user_data;
                try {
                  if(response.data.user_id){
                    return res.json({
                      status: 'success',
                      data: {
                        user_id: user_id,
                        first_name: first_name,
                        last_name: last_name,
                        email: email,
                        phone:phone,
                        user_registered:formattedDate,
                        user_type_id: 2,
                        wp_blog_user_id: response.data.user_id
                      },
                      message: 'User registered',
                    });
                  }else{
                    return res.send(
                        {
                            status: 'err',
                            data: '',
                            message: 'Successfully registerd in node but not in wordpress site'
                        }
                    )
                  }
                } catch (error) {
                    console.error('User login failed. Error:', error);
                    if (error.response && error.response.data) {
                        console.log('Error response data:', error.response.data);
                    }
                }
            })();
        })
        .catch((error) => {
            //console.error('User registration failed:', );
            return res.send(
                {
                    status: 'err',
                    data: '',
                    message: 'Wordpress register issue: '+error.response.data
                }
            )
        });
      });
    });
  });
};


exports.login = (req, res) => {
    console.log(req.body);
    const userAgent = req.headers['user-agent'];
    const agent = useragent.parse(userAgent);
    const payload = {};
    // res.json(deviceInfo);

    const { email, password, device_id, device_token, imei_no, model_name, make_name } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
          return res.status(500).json({
            status: 'error',
            message: 'An error occurred while processing your request '+err,
          });
        }
    
        if (results.length === 0) {
          return res.status(404).json({
            status: 'error',
            message: 'User not found',
          });
        }
        const user = results[0];
        payload.user_id = user.user_id; 
        const isPasswordMatch = await bcrypt.compare(password, user.password);
    
        if (!isPasswordMatch) {
          return res.status(401).json({
            status: 'error',
            message: 'Invalid credentials',
          });
        }
    
        const token = jwt.sign(payload, secretKey, {
          expiresIn: '10h', 
        });
    

        const clientIp = requestIp.getClientIp(req);
        const userAgent = useragent.parse(req.headers['user-agent']);

        db.query('SELECT * FROM user_customer_meta WHERE user_id = ?', [user.user_id], (metaErr, metaResults) => {
          if (metaErr) {
            console.error("An error occurred:", metaErr);
            return res.status(500).json({
                status: 'error',
                message: 'An error occurred while processing your request '+metaErr,
                error: metaErr 
            })
          }

          const meta = metaResults[0];
    
          //--Fetch WP user Data-------//
          db.query('SELECT * FROM bg_users WHERE user_login = ?', [email], (wpuserErr, wpuserResults) => {
            if (wpuserErr) {
              console.error("An error occurred:", metaErr);
              return res.status(500).json({
                  status: 'error',
                  message: 'An error occurred while processing your request',
                  error: metaErr 
              })
            }
            // return res.json({
            //   status: 'success',
            //   data: {
            //     user,
            //     meta,
            //     wp_user: wpuserResults[0].ID,
            //     token: token,
            //   },
            //   message: 'Login successful',
            //   client_ip: clientIp,
            //   user_agent: userAgent.toString(),
            // });
            
            delete user.password;
            //-- check last Login Info-----//
            const device_query = "SELECT * FROM user_device_info WHERE user_id = ?";
            db.query(device_query, [user.user_id], async (err, device_query_results) => {
                const currentDate = new Date();
                const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');

                if (device_query_results.length > 0) {
                    // User exist update info
                    const userDeviceMetaUpdateData = {
                        device_id: req.body.device_id || null,
                        device_token: req.body.device_token || null,
                        imei_no: req.body.imei_no || null,
                        model_name: req.body.model_name || null,
                        make_name: req.body.make_name || null,
                        last_logged_in: formattedDate,
                    };                  
                    const device_update_query = `UPDATE user_device_info SET ? WHERE user_id = ?`;
                    db.query(device_update_query, [userDeviceMetaUpdateData, user.user_id], (err, device_update_query_results) => {
                        if(err){
                          return res.json({
                            status: 'error',
                            data: {
                              user,
                              meta,
                              wp_user: wpuserResults[0].ID,
                              token: token,
                            },
                            message: err,
                            client_ip: clientIp,
                            user_agent: userAgent.toString(),
                          });
                        }else{
                          return res.json({
                            status: 'success',
                            data: {
                              user,
                              meta,
                              wp_user: wpuserResults[0].ID,
                              token: token,
                            },
                            message: 'Login successful',
                            client_ip: clientIp,
                            user_agent: userAgent.toString(),
                          });    
                        }                    
                    })                   

                } else {
                    // User doesnot exist Insert New Row.

                    const userDeviceMetaInsertData = {
                        user_id : user.user_id,
                        device_id: req.body.device_id || null,
                        device_token: req.body.device_token || null,
                        imei_no: req.body.imei_no || null,
                        model_name: req.body.model_name || null,
                        make_name: req.body.make_name || null,
                        last_logged_in: formattedDate,
                        created_date: formattedDate
                    };
                    
                    db.query('INSERT INTO user_device_info SET ?', userDeviceMetaInsertData, async (err, results) => {
                        if(err){
                          return res.json({
                            status: 'error',
                            data: {
                              user,
                              meta,
                              wp_user: wpuserResults[0].ID,
                              token: token,
                            },
                            message: err,
                            client_ip: clientIp,
                            user_agent: userAgent.toString(),
                          });
                        }else{
                          return res.json({
                            status: 'success',
                            data: {
                              user,
                              meta,
                              wp_user: wpuserResults[0].ID,
                              token: token,
                            },
                            message: 'Login successful',
                            client_ip: clientIp,
                            user_agent: userAgent.toString(),
                          }); 
                        }
                    })

                }
            })

          });
      });
    })
}
//edit user
exports.edituser = (req, res) => {
    const authenticatedUserId = parseInt(req.user.user_id);
    console.log('authenticatedUserId: ', authenticatedUserId);
    const ApiuserId=parseInt(req.body.user_id);
    console.log('req.body.user_id: ', parseInt(req.body.user_id));
    const {
        user_id,
        first_name,
        last_name,
        phone,
        address,
        country,
        state,
        city,
        zip,
        date_of_birth,
        occupation,
        gender,
        alternate_phone,
        marital_status,
        about
    } = req.body;
    console.log("user_id from request:", req.body.user_id);
    if (ApiuserId !== authenticatedUserId) {
      return res.status(403).json({
          status: 'error',
          message: 'Access denied: You are not authorized to update this user.',
      });
    }
    const profilePicFile = req.file;
    const userUpdateQuery = 'UPDATE users SET first_name=?, last_name=?, phone=? WHERE user_id=?';
    const userUpdateValues = [first_name, last_name, phone, user_id];

    let userMetaUpdateQuery = 'UPDATE user_customer_meta SET address=?, country=?, state=?, city=?, zip=?, date_of_birth=?, occupation=?, gender=?, alternate_phone=?, marital_status=?, about=?';
    let userMetaUpdateValues = [address, country, state, city, zip, date_of_birth, occupation, gender, alternate_phone, marital_status, about];

    if (profilePicFile) {
        db.query(
            'SELECT profile_pic FROM user_customer_meta WHERE user_id=?',
            [user_id],
            (prevProfilePicErr, prevProfilePicResult) => {
                if (prevProfilePicErr) {
                    console.error('Error fetching previous profile_pic:', prevProfilePicErr);
                    return res.status(500).json({
                        status: 'error',
                        message: 'An error occurred while fetching previous profile_pic'+prevProfilePicErr,
                    });
                }
                if (prevProfilePicResult && prevProfilePicResult.length > 0 ){
                  const previousProfilePicFilename = prevProfilePicResult[0].profile_pic;
                  if (previousProfilePicFilename) {
                    const previousProfilePicPath = 'uploads/' + previousProfilePicFilename
                    console.log(previousProfilePicPath)
                    //const previousProfilePicPath = 'uploads/' + prevProfilePicResult[0].profile_pic;
                    fs.unlink(previousProfilePicPath, (unlinkError) => {
                        if (unlinkError) {
                            console.error('Error deleting previous profile_pic:', unlinkError);
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
                        updateUserInformation();
                    });
                  })
                }
                else {
                    updateUserInformation();
                    console.log('Previous profile picture deleted');
                }
            }
          }
        );
    } else {
        updateUserInformation();
    }

    function updateUserInformation() {
        userMetaUpdateQuery += ' WHERE user_id=?';
        userMetaUpdateValues.push(user_id);

        db.query(userUpdateQuery, userUpdateValues, (err, userUpdateResults) => {
            if (err) {
                return res.status(500).json({
                    status: 'error',
                    message: 'An error occurred while updating user information',
                    err
                });
            }

            db.query(userMetaUpdateQuery, userMetaUpdateValues, (err, userMetaUpdateResults) => {
                if (err) {
                    return res.status(500).json({
                        status: 'error',
                        message: 'An error occurred while updating user information',
                    });
                }

                db.query(
                    'SELECT * FROM users u LEFT JOIN user_customer_meta m ON u.user_id = m.user_id WHERE u.user_id=?',
                    [user_id],
                    (err, updatedUserDetails) => {
                        if (err) {
                            console.error('Error fetching updated user details:', err);
                            return res.status(500).json({
                                status: 'error',
                                message: 'An error occurred while fetching updated user details',
                            });
                        }
                        delete updatedUserDetails[0].password;
                        if (updatedUserDetails && updatedUserDetails.length > 0) {
                            return res.json({
                                status: 'success',
                                data: updatedUserDetails[0], // Return the updated user details
                                message: 'User information updated successfully',
                            });
                        } else {
                            return res.status(404).json({
                                status: 'error',
                                message: 'User not found',
                            });
                        }
                    }
                );
            });
        });
    }
};



// exports.edituser = (req, res) => {
//   const { user_id, first_name, last_name,phone, address, country, state, city, zip, date_of_birth,occupation, gender } = req.body;
//   console.log(req.body)
//   db.query(
//       'UPDATE users SET first_name=?, last_name=?,phone=? WHERE user_id=?',
//       [first_name, last_name, phone,user_id],
//       (err, results) => {
//           if (err) {
//               return res.status(500).json({
//                   status: 'error',
//                   message: 'An error occurred while updating user information',
//               });
//           }

//           db.query(
//               'UPDATE user_customer_meta SET address=?, country=?, state=?, city=?, zip=?, date_of_birth=?, occupation=?, gender=? WHERE user_id=?',
//               [address, country, state, city, zip, date_of_birth, occupation, gender, user_id],
//               (err, results) => {
//                   if (err) {
//                       return res.status(500).json({
//                           status: 'error',
//                           message: 'An error occurred while updating user information',
//                       });
//                   }
//                   const profilePicFile = req.file;
//                   if (!profilePicFile) {
//                       return res.status(400).json({
//                           status: 'error',
//                           message: 'Profile picture file is required',
//                       });
//                   }
//                   db.query(
//                       'SELECT profile_pic FROM user_customer_meta WHERE user_id=?',
//                       [user_id],
//                       (err, result) => {
//                           if (err) {
//                               console.error('Error fetching previous profile picture:', err);
//                           }

//                           if (result && result.length > 0) {
//                               const previousProfilePicFilename = result[0].profile_pic;
//                               if (previousProfilePicFilename) {
//                                   const previousProfilePicPath = 'uploads/' + previousProfilePicFilename;
//                                   fs.unlink(previousProfilePicPath, (err) => {
//                                       if (err) {
//                                           console.error('Error deleting previous profile picture:', err);
//                                       } else {
//                                           console.log('Previous profile picture deleted');
//                                       }
//                                   });
//                               }
//                           }
//                           db.query(
//                               'UPDATE user_customer_meta SET profile_pic=? WHERE user_id=?',
//                               [profilePicFile.filename, user_id],
//                               (err, results) => {
//                                   if (err) {
//                                       return res.status(500).json({
//                                           status: 'error',
//                                           message: 'An error occurred while updating the profile picture',
//                                       });
//                                   }

//                                   return res.json({
//                                       status: 'success',
//                                       data: "",
//                                       message: 'User information updated successfully',
//                                   });
//                               }
//                           );
//                       }
//                   );
//               }
//           );
//       }
//   );
// };



exports.createcategories = (req, res) => {
  console.log('category', req.body);
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
 
  const { comp_email, company_name, comp_phone, comp_registration_id,about_company  } = req.body;
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
    const value = [1, company_name, logo, comp_phone, comp_email, comp_registration_id, formattedDate,formattedDate,status,about_company]; // Include the status value

    const Query = 'INSERT INTO company(user_created_by, company_name, logo, comp_phone, comp_email, comp_registration_id, created_date,updated_date, status,about_company) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?)';
    console.log(Query, value);

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


exports.submitReview = async (req, res) => {

  try {
    const authenticatedUserId = parseInt(req.user.user_id);
    console.log('authenticatedUserId: ', authenticatedUserId);
    const ApiuserId=parseInt(req.body.user_id);
    console.log('req.body.user_id: ', parseInt(req.body.user_id));
    const {
      user_id,
      company_name,
      address,
      rating,
      review_title,
      review_content,
      user_privacy,
      tags
    } = req.body;
    console.log("user_id from request:", req.body.user_id);
    if (ApiuserId !== authenticatedUserId) {
      return res.status(403).json({
          status: 'error',
          message: 'Access denied: You are not authorized to update this user.',
      });
    }
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');

    // Check if the company already exists
    const companyCheckQuery = 'SELECT id FROM company WHERE company_name = ?';
    const [companyCheckResults] = await db.promise().query(companyCheckQuery, [company_name]);

    let companyID;
    let company_location_id;
    // Check if the address already exists
    const addressCheckQuery = 'SELECT ID FROM company_location WHERE address = ?';
    const [addressCheckResults] = await db.promise().query(addressCheckQuery, [address]);

    if (companyCheckResults.length === 0) {
      // Company does not exist, create it
      const createCompanyQuery = 'INSERT INTO company (user_created_by, company_name, status, created_date, updated_date) VALUES (?, ?, ?, ?, ?)';
      const createCompanyValues = [user_id, company_name, '2', formattedDate, formattedDate];

      const [createCompanyResults] = await db.promise().query(createCompanyQuery, createCompanyValues);
      companyID = createCompanyResults.insertId;

      // Create company address
      const createAddressQuery = 'INSERT INTO company_location (company_id, address) VALUES (?, ?)';
      const createAddressValues = [companyID, address];
      const [createAddressResults] = await db.promise().query(createAddressQuery, createAddressValues);

      console.log("createAddressResults:", createAddressResults); 

      company_location_id = createAddressResults.insertId;

    } else {
      companyID = companyCheckResults[0].id;

      if (addressCheckResults.length === 0) {
        // Address does not exist, create it
        const createAddressQuery = 'INSERT INTO company_location (company_id, address) VALUES (?, ?)';
        const createAddressValues = [companyID, address];
        const [createAddressResults] = await db.promise().query(createAddressQuery, createAddressValues);

        console.log("createAddressResults:", createAddressResults); 

        company_location_id = createAddressResults.insertId;
      } else {
        // Address already exists, use the existing ID
        company_location_id = addressCheckResults[0].ID;
      }
    }

    console.log("companyID:", companyID);
    console.log("company_location_id:", company_location_id);
    
    // Create the review
    const create_review_query = `
      INSERT INTO reviews (
        company_id,
        customer_id,
        company_location,
        company_location_id,
        review_title,
        rating,
        review_content,
        user_privacy,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const create_review_values = [
      companyID,
      user_id,
      address,
      company_location_id, 
      review_title,
      rating,
      review_content,
      user_privacy,
      formattedDate,
      formattedDate
    ];

    try {
      const [create_review_results] = await db.promise().query(create_review_query, create_review_values);

      if (create_review_results.insertId) {
        for (const tagItem of tags) {
          const review_tag_relation_query = 'INSERT INTO review_tag_relation (review_id, tag_name) VALUES (?, ?)';
          const review_tag_relation_values = [create_review_results.insertId, tagItem];
          await db.promise().query(review_tag_relation_query, review_tag_relation_values);
        }

        const update_review_count_query = 'UPDATE user_customer_meta SET review_count = review_count + 1 WHERE user_id = ?';
        await db.promise().query(update_review_count_query, [user_id]);

        return res.send({
          status: 'ok',
          data: {
            reviewId: create_review_results.insertId
          },
          message: 'Review posted successfully'
        });
      } else {
        return res.send({
          status: 'error',
          data: '',
          message: 'Error occurred, please try again'
        });
      }
    } catch (error) {
      console.error('Error during create_review_results:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred while posting the review'
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send('An error occurred');
  }
};


// --searchCompany --//
exports.searchCompany = async (req, res) => {
  //console.log(req.body);
  const keyword = req.params.keyword; //Approved Company
  const get_company_query = `
    SELECT ID, company_name, logo, about_company, main_address, main_address_pin_code FROM company
    WHERE company_name LIKE '%${keyword}%'
    ORDER BY created_date DESC
  `;
  try{
    const get_company_results = await query(get_company_query);
    if(get_company_results.length > 0 ){
      res.status(200).json({
          status: 'success',
          data: get_company_results,
          message: get_company_results.length+' company data recived'
      });
      return {status: 'success', data: get_company_results, message: get_company_results.length+' company data recived'};
    }else{
      res.status(200).json({status: 'success', data: '', message: 'No company data found'});
    }
  }catch(error){
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while posting the request: '+error
    });
  } 
}