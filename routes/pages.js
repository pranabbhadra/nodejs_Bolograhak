const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../config');
var moment = require('moment');
const { error } = require('console');
const async = require('async');
const axios = require('axios');
const comFunction = require('../common_function');

const router = express.Router();
const publicPath = path.join(__dirname, '../public');

// Front-End Page Routes
router.get('', async (req, res) => {
    //resp.sendFile(`${publicPath}/index.html`)
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);

        // Make API request to fetch blog posts
        const apiUrl = 'http://localhost/bolo-grahak/blog/api/home-blog-api.php';
        const response = await axios.get(apiUrl);
        const blogPosts = response.data;
        if(blogPosts.status == 'ok'){
            res.render('front-end/landing', { 
                menu_active_id: 'landing', 
                page_title: 'Home', 
                currentUserData,
                homePosts: blogPosts.data  // Pass the blogPosts data to the view
            });
        }else{
            res.render('front-end/landing', { 
                menu_active_id: 'landing', 
                page_title: 'Home', 
                currentUserData,
                homePosts:[]  // Pass the blogPosts data to the view
            });
        }
    } catch {
        console.error('Error fetching blog posts:', error);
        res.render('front-end/landing', {
            menu_active_id: 'landing',
            page_title: 'Home',
            currentUserData,
            homePosts:[]  // Provide empty array if API request fails
        });
    }

});

router.get('/contact-us', (req, res) => {
    //resp.sendFile(`${publicPath}/index.html`)
    const encodedUserData = req.cookies.user;
    const currentUserData = JSON.parse(encodedUserData);
    res.render('front-end/contact', { menu_active_id: 'contact', page_title: 'Contact Us', currentUserData });
});

router.get('/faq', (req, res) => {
    //resp.sendFile(`${publicPath}/index.html`)
    const encodedUserData = req.cookies.user;
    const currentUserData = JSON.parse(encodedUserData);
    res.render('front-end/faq', { menu_active_id: 'faq', page_title: 'FAQ', currentUserData });
});



router.get('/countries', (req, res) => {
    db.query('SELECT * FROM countries', (err, results) => {
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
                return res.status(200).json({
                    status: 'ok',
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
async function checkLoggedIn(req, res, next) {
    const encodedUserData = req.cookies.user;

    try {
        if (encodedUserData) {
            // User is logged in, proceed to the next middleware or route handler
            next();
        } else {
            res.redirect('sign-in');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
}

router.get('/dashboard', checkLoggedIn, (req, res) => {
    const encodedUserData = req.cookies.user;
    const currentUserData = JSON.parse(encodedUserData);
    res.render('dashboard', { menu_active_id: 'dashboard', page_title: 'Dashboard', currentUserData });
});

router.get('/profile', checkLoggedIn, (req, res) => {
    const encodedUserData = req.cookies.user;
    const currentUserData = JSON.parse(encodedUserData);
    res.render('profile', { menu_active_id: 'profile', page_title: 'User Profile', currentUserData });
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
                if (!currentUserData.country) {
                    res.render('edit-profile', { page_title: 'Account Settings', currentUserData, country_response });
                } else {
                    // -- send state list --//
                    db.query('SELECT * FROM states WHERE country_id=?', [currentUserData.country], (err, state_results) => {
                        if (err) {
                            console.log(err);
                        } else {
                            if (state_results.length > 0) {
                                state_response = state_results;
                                res.render('edit-profile', { menu_active_id: 'profile', page_title: 'Account Settings', currentUserData, country_response, state_response });
                            }
                        }
                    })
                }

            }
        }
    })
});

router.get('/edit-category/:id/:kk', checkLoggedIn, (req, res) => {
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
                if (!currentUserData.country) {
                    res.render('edit-profile', { page_title: 'Account Settings', currentUserData, country_response });
                } else {
                    // -- send state list --//
                    db.query('SELECT * FROM states WHERE country_id=?', [currentUserData.country], (err, state_results) => {
                        if (err) {
                            console.log(err);
                        } else {
                            if (state_results.length > 0) {
                                state_response = state_results;
                                res.render('edit-category', { menu_active_id: 'profile', page_title: 'Account Settings', currentUserData, country_response, state_response });
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
    //res.render('users', { menu_active_id: 'user', page_title: 'Users', currentUserData });

    const user_query = `
                    SELECT users.*, user_customer_meta.*, user_account_type.role_name, user_device_info.last_logged_in
                    FROM users
                    JOIN user_customer_meta ON users.user_id = user_customer_meta.user_id
                    JOIN user_account_type ON users.user_type_id = user_account_type.ID
                    LEFT JOIN user_device_info ON users.user_id = user_device_info.user_id
                    `;
    db.query(user_query, (err, results) => {
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
                const users = results.map((user) => ({
                    ...user,
                    registered_date: moment(user.last_logged_in).format('Do MMMM YYYY, h:mm:ss a'),
                }));
                res.render('users', { menu_active_id: 'user', page_title: 'Users', currentUserData, 'allusers': users });
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
                            res.render('add-user', { menu_active_id: 'user', page_title: 'Add New User', currentUserData, country_response, accounts_response, auto_password });

                        }
                    }
                })

            }
        }
    })
});


//View Categories
router.get('/categories', checkLoggedIn, (req, res) => {
    const encodedUserData = req.cookies.user;
    const currentUserData = JSON.parse(encodedUserData);
    //res.render('users', { menu_active_id: 'user', page_title: 'Users', currentUserData });

    const cat_query = `
                        SELECT category.ID AS category_id,category.category_name AS category_name, category.category_img AS category_img, c.category_name AS parent_name, GROUP_CONCAT(countries.name) AS country_names
                        FROM category
                        JOIN category_country_relation ON category.id = category_country_relation.cat_id
                        JOIN countries ON category_country_relation.country_id = countries.id
                        LEFT JOIN category AS c ON c.ID = category.parent_id 
                        GROUP BY category.category_name `;
    db.query(cat_query, (err, results) => {
        if (err) {
            return res.send(
                {
                    status: 'err',
                    data: '',
                    message: 'An error occurred while processing your request' + err
                }
            )
        } else {
            const categories = results.map((row) => ({
                categoryId: row.category_id,
                categoryName: row.category_name,
                parentName: row.parent_name,
                categoryImage: row.category_img,
                countryNames: row.country_names.split(','),
            }));
            //console.log(categories);
            //res.json({ menu_active_id: 'category', page_title: 'Categories', currentUserData, 'categories': categories });
            res.render('categories', { menu_active_id: 'category', page_title: 'Categories', currentUserData, 'categories': categories });
        }
    })
});

//Add Category
router.get('/add-category', checkLoggedIn, (req, res) => {
    const encodedUserData = req.cookies.user;
    const currentUserData = JSON.parse(encodedUserData);
    let country_response = [];
    let accounts_response = [];
    //-- Get Country List --/
    db.query('SELECT * FROM countries', (err, results) => {
        if (err) {
            console.log(err);
        } else {
            if (results.length > 0) {
                //console.log(results);
                country_response = results;
                let cat_data = [];
                const sql = "SELECT * FROM category"
                db.query(sql, (error, cat_result) => {
                    if (error) {
                        console.log(error);
                    } else {
                        if (cat_result.length > 0) {
                            cat_data = cat_result;
                            res.render('add-category', { menu_active_id: 'category', page_title: 'Add New Category', currentUserData, country_response, cat_data });

                        } else {
                            res.render('add-category', { menu_active_id: 'category', page_title: 'Add New Category', currentUserData, country_response, cat_data });
                        }
                    }
                })

            }
        }
    })
});

//Edit Category
router.get('/edit-category', checkLoggedIn, (req, res, next) => {

    console.log(req.query.id);
    const cat_id = req.query.id;
    const encodedUserData = req.cookies.user;
    const currentUserData = JSON.parse(encodedUserData);
    let country_response = [];
    let accounts_response = [];
    let cat_data = [];
    let edit_data = [];
    //-- Get Country List --/
    db.query('SELECT * FROM countries', (err, results) => {

        if (err) {
            console.log(err);
        } else {
            if (results.length > 0) {
                //console.log(results);
                country_response = results;
                const sql = "SELECT * FROM category"
                db.query(sql, (cat_err, cat_res) => {

                    if (cat_err) {
                        console.log(cat_err);
                    } else {
                        cat_data = cat_res;
                        const cat_query = `SELECT category.ID AS category_id,category.category_name AS category_name, category.category_img AS category_img, category.parent_id AS parent_id, c.category_name AS parent_name,GROUP_CONCAT(countries.id) AS country_id, GROUP_CONCAT(countries.name) AS country_names
                        FROM category
                        JOIN category_country_relation ON category.id = category_country_relation.cat_id
                        JOIN countries ON category_country_relation.country_id = countries.id
                        LEFT JOIN category AS c ON c.ID = category.parent_id   WHERE category.ID = ${req.query.id}`;
                        db.query(cat_query, (cat_error, cat_result) => {

                            if (cat_error) {
                                console.log(cat_error);
                            } else {
                                if (cat_result.length > 0) {
                                    edit_data = cat_result[0];
                                    const country = edit_data.country_names.split(',');
                                    const country_id = edit_data.country_id.split(',');
                                    const country_arr = country;
                                    //console.log(edit_data);
                                    //console.log(country, country_id);
                                    res.render('edit-category', { menu_active_id: 'category', page_title: 'Add New Category', currentUserData, country_response, cat_data, edit_data, country_arr, country_id });
                                    //res.render('edit-category', { menu_active_id: 'category', page_title: 'Add New Category', currentUserData, 'ids': req.params.id });
                                }
                            }
                        })

                    }
                })
            }
        }
    })

});

//Delete Category
router.get('/delete-category', checkLoggedIn, (req, res, next) => {

    const file_query = `SELECT category_img FROM category WHERE ID = ${req.query.id}`;
    db.query(file_query, async function (img_err, img_res) {
        //console.log(img_res);
        if (img_res[0].category_img != 'NULL') {
            const filename = img_res[0].category_img;
            const filePath = `uploads/${filename}`;
            //console.log(filePath);

            fs.unlink(filePath, await function () {
                console.log('file deleted');
            })
            const sql = `DELETE FROM category WHERE ID = ${req.query.id}`;
            db.query(sql, (err, result) => {
                const country_sql = `DELETE FROM category_country_relation WHERE cat_id = ${req.query.id}`;
                db.query(country_sql, (country_err, country_res) => {
                    if (err) {
                        console.log(err);
                    } else {
                        return res.send(
                            {
                                status: 'ok',
                                data: result,
                                message: 'Category deleted'
                            }
                        )
                    }
                })

            })
        } else {
            //console.log("no file");
            const sql = `DELETE FROM category WHERE ID = ${req.query.id}`;
            db.query(sql, (err, result) => {
                const country_sql = `DELETE FROM category_country_relation WHERE cat_id = ${req.query.id}`;
                db.query(country_sql, (country_err, country_res) => {
                    if (err) {
                        console.log(err);
                    } else {
                        return res.send(
                            {
                                status: 'ok',
                                data: result,
                                message: 'Category deleted'
                            }
                        )
                    }
                })
            })
        }
    })

});


//edit user details 
// router.get('/edit-user/:id', checkLoggedIn, (req, res) => {
//     const encodedUserData = req.cookies.user;
//     const currentUserData = JSON.parse(encodedUserData);

//     const userId = req.params.id;

//     async.parallel(
//     {
//         user: function(callback) {
//         // Fetch user details from the users table
//         db.query('SELECT * FROM users WHERE user_id = ?', [userId], (err, result) => {
//             if (err) {
//             callback(err);
//             } else {
//             callback(null, result[0]);
//             }
//         });
//         },
//         userMeta: function(callback) {
//         const user_meta_query = `
//             SELECT user_meta.*, c.name as country_name, s.name as state_name
//             FROM user_customer_meta user_meta
//             JOIN countries c ON user_meta.country = c.id
//             JOIN states s ON user_meta.state = s.id
//             WHERE user_id = ?
//         `;
//         // Fetch user metadata from the user_customer_meta table
//         db.query(user_meta_query, [userId], (err, result) => {
//             if (err) {
//             callback(err);
//             } else {
//             callback(null, result[0]);
//             }
//         });
//         },
//         countries: function(callback) {
//         // Fetch countries table data
//         db.query('SELECT * FROM countries', (err, result) => {
//             if (err) {
//                 callback(err);
//             } else {
//                 callback(null, result);
//             }
//         });
//         },
//         userRoles: function(callback) {
//         // Fetch user role from user_account_type table data
//         db.query('SELECT * FROM user_account_type', (err, result) => {
//             if (err) {
//             callback(err);
//             } else {
//             callback(null, result);
//             }
//         });
//         }
//     },
//     function(err, results) {
//         if (err) {
//         // Handle error
//             console.error(err);
//             res.status(500).send('An error occurred');
//         } else {
//             // Render the 'edit-user' EJS view and pass the data
//             res.json({
//                 menu_active_id: 'user',
//                 page_title: 'Edit User',
//                 currentUserData,
//                 user: results.user,
//                 userMeta: results.userMeta,
//                 countries: results.countries,
//                 userRoles: results.userRoles
//             });
//             // res.render('edit-user', {
//             //     menu_active_id: 'user',
//             //     page_title: 'Edit User',
//             //     currentUserData,
//             //     user: results.user,
//             //     userMeta: results.userMeta,
//             //     country_response: results.countries,
//             //     state_response: results.states,
//             //     userRoles: results.userRoles
//             // });
//         }
//     }
//     );
// });

// router.get('/edit-user/:id', checkLoggedIn, (req, res) => {
//     const encodedUserData = req.cookies.user;
//     const currentUserData = JSON.parse(encodedUserData);

//     const userId = req.params.id;

//     async.waterfall(
//     [
//         function(callback) {
//             // Fetch user details from the users table
//             db.query('SELECT * FROM users WHERE user_id = ?', [userId], (err, result) => {
//                 if (err) {
//                     callback(err);
//                 } else {
//                     callback(null, result[0]);
//                 }
//             });
//         },
//         function(user, callback) {
//             const user_meta_query = `
//                 SELECT user_meta.*, c.name as country_name, s.name as state_name
//                 FROM user_customer_meta user_meta
//                 JOIN countries c ON user_meta.country = c.id
//                 JOIN states s ON user_meta.state = s.id
//                 WHERE user_id = ?
//             `;
//             // Fetch user metadata from the user_customer_meta table
//             db.query(user_meta_query, [userId], (err, result) => {
//                 if (err) {
//                 callback(err);
//                 } else {
//                 callback(null, user, result[0]);
//                 }
//             });
//         },
//         function(user, userMeta, callback) {
//             // Fetch countries table data
//             db.query('SELECT * FROM countries', (err, result) => {
//                 if (err) {
//                     callback(err);
//                 } else {
//                     callback(null, user, userMeta, result);
//                 }
//             });
//         },
//         function(user, userMeta, countries, callback) {
//             // Fetch user role from user_account_type table data
//             db.query('SELECT * FROM user_account_type', (err, result) => {
//                 if (err) {
//                 callback(err);
//                 } else {
//                 callback(null, user, userMeta, countries, result);
//                 }
//             });
//         },
//         function(user, userMeta, countries, userRoles, callback) {
//             // Fetch user country all states data
//             const userCountryId = userMeta && userMeta.country.toString();
//             console.log('Value of userCountryId:', userCountryId);
//             db.query('SELECT * FROM states WHERE country_id = ?', [userCountryId], async (err, result) => {
//                 if (err) {
//                     callback(err);
//                 } else {
//                     callback(null, user, userMeta, countries, userRoles, result);
//                 }
//             });
//         },
//     ],
//     function(err, user, userMeta, countries, userRoles, states) {
//         if (err) {
//         // Handle error
//             console.error(err);
//             res.status(500).send('An error occurred');
//         } else {
//             // Render the 'edit-user' EJS view and pass the data
//             // res.json({
//             //     menu_active_id: 'user',
//             //     page_title: 'Edit User',
//             //     currentUserData,
//             //     user: user,
//             //     userMeta: userMeta,
//             //     countries: countries,
//             //     userRoles: userRoles,
//             //     states: states
//             // });
//             console.log('Data successfully retrieved:');
//             console.log('User:', user);
//             console.log('User Meta:', userMeta);
//             console.log('States:', states);
//             res.render('edit-user', {
//                 menu_active_id: 'user',
//                 page_title: 'Edit User',
//                 currentUserData,
//                 user: user,
//                 userMeta: userMeta,
//                 countries: countries,
//                 userRoles: userRoles,
//                 states: states
//             });
//         }
//     }
//     );
// });


router.get('/edit-user/:id', checkLoggedIn, async (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const userId = req.params.id;
        console.log('editUserID: ', userId);

        // Fetch all the required data asynchronously
        const [user, userMeta, countries, userRoles, states] = await Promise.all([
            comFunction.getUser(userId),
            comFunction.getUserMeta(userId),
            comFunction.getCountries(),
            comFunction.getUserRoles(),
            comFunction.getStatesByUserID(userId)
        ]);

        // Render the 'edit-user' EJS view and pass the data
        res.render('edit-user', {
            menu_active_id: 'user',
            page_title: 'Edit User',
            currentUserData,
            user: user,
            userMeta: userMeta,
            countries: countries,
            userRoles: userRoles,
            states: states
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});


//---Company--//
router.get('/add-company', checkLoggedIn, async (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);

        // Fetch all the required data asynchronously
        const [company_all_categories] = await Promise.all([
            comFunction.getCompanyCategory()
        ]);

        // Render the 'edit-user' EJS view and pass the data
        res.render('add-company', {
            menu_active_id: 'company',
            page_title: 'Add Company',
            currentUserData,
            company_categories: company_all_categories,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

router.get('/companies', checkLoggedIn, async (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);

        // Fetch all the required data asynchronously
        const [allcompany] = await Promise.all([
            comFunction.getAllCompany(),
        ]);

        // Render the 'edit-user' EJS view and pass the data
        res.render('companies', {
            menu_active_id: 'company',
            page_title: 'Companies',
            currentUserData,
            allcompany: allcompany
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

router.get('/edit-company/:id', checkLoggedIn, async (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const companyId = req.params.id;

        // Fetch all the required data asynchronously
        const [company, company_all_categories] = await Promise.all([
            comFunction.getCompany(companyId),
            comFunction.getCompanyCategoryBuID(companyId)
            //comFunction.getCompanyMeta(userId),
            //comFunction.getCountries(),
            //comFunction.getStatesByUserID(userId)
        ]);

        // Render the 'edit-user' EJS view and pass the data
        // res.json({
        //     menu_active_id: 'company',
        //     page_title: 'Edit Company',
        //     currentUserData,
        //     company: company,
        //     company_all_categories : company_all_categories,
        //     //countries: countries,
        //     //states: states            
        // });
        res.render('edit-company', {
            menu_active_id: 'company',
            page_title: 'Edit Company',
            currentUserData,
            company: company,
            company_all_categories: company_all_categories,
            //countries: countries,
            //states: states            
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});



router.get('/help/:id', (_, resp) => {
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