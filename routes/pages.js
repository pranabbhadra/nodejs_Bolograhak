const express = require('express');
const path = require('path');
const db = require('../config');
var moment = require('moment');
const { error } = require('console');

const router = express.Router();
const publicPath = path.join(__dirname, '../public');


router.get('', (_, resp) => {
    resp.sendFile(`${publicPath}/index.html`)
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

    const cat_query = `SELECT * FROM category `;
    db.query(cat_query, async (err, results) => {
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
                var countries_details = [];
                results.forEach((item) => {
                    const country_sql = `SELECT countries.name FROM category_country_relation 
                    LEFT JOIN countries ON category_country_relation.country_id = countries.id
                    WHERE category_country_relation.cat_id = ${item.ID}
                    `;
                    db.query(country_sql, async (error, country_res) => {
                        if (error) {
                            console.log(error);
                        }
                        //var cnt_name = country_res;
                        //console.log(cnt_name);
                        // var countries_arr = {
                        //     category_name: item.category_name,
                        //     category_img: item.category_img,
                        //     parent_id: item.parent_id,
                        //     country_name: cnt_name,
                        // }
                        const parent_query = `SELECT category_name FROM category WHERE ID = ${item.parent_id}`;
                        db.query(parent_query, (parent_err, parent_res) => {
                            //console.log(parent_res);
                            var mergedData = {
                                categoryData: item,
                                parent_name: parent_res,
                                countryData: country_res,
                            };
                            //console.log(mergedData);
                        })
                        //await countries_details.push(countries_arr);
                    })
                })

                const categories = results.map((category) => ({
                    ...category,
                }));
                //console.log(categories);
                res.render('categories', { menu_active_id: 'user', page_title: 'Categories', currentUserData, 'categories': categories });
            }
        }
    })
});
// router.get('/categories', checkLoggedIn, (req, res) => {
//     const encodedUserData = req.cookies.user;
//     const currentUserData = JSON.parse(encodedUserData);
//     //res.render('users', { menu_active_id: 'user', page_title: 'Users', currentUserData });

//     const cat_query = `
//                         SELECT category.category_name AS category_name, GROUP_CONCAT(countries.name) AS country_names
//                         FROM category
//                         JOIN category_country_relation ON category.id = category_country_relation.cat_id
//                         JOIN countries ON category_country_relation.country_id = countries.id
//                         GROUP BY category.category_name `;
//     db.query(cat_query, (err, results) => {
//         if (err) {
//             return res.send(
//                 {
//                     status: 'err',
//                     data: '',
//                     message: 'An error occurred while processing your request' + err
//                 }
//             )
//         } else {
//             const categories = results.map((row) => ({
//                 categoryName: row.category_name,
//                 countryNames: row.country_names.split(','),
//             }));
//             console.log(categories);
//             res.render('categories', { categories });
//         }
//     })
// });

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
                db.query('SELECT * FROM user_account_type', (err, accountresults) => {
                    if (err) {
                        console.log(err);
                    } else {
                        if (accountresults.length > 0) {
                            accounts_response = accountresults;
                            let cat_data = [];

                            const sql = "SELECT * FROM category"
                            db.query(sql, (error, cat_result) => {
                                if (error) {
                                    console.log(error);
                                } else {
                                    if (cat_result.length > 0) {
                                        cat_data = cat_result;
                                        res.render('add-category', { menu_active_id: 'category', page_title: 'Add New Category', currentUserData, country_response, accounts_response, cat_data });

                                    } else {
                                        res.render('add-category', { menu_active_id: 'category', page_title: 'Add New Category', currentUserData, country_response, accounts_response, cat_data });
                                    }
                                }
                            })

                        }
                    }
                })

            }
        }
    })
});

//Edit Category
router.get('/edit-category/:id?', checkLoggedIn, (req, res, next) => {
    console.log(req.params.id);
    // const cat_id = req.params.cat_id;
    const encodedUserData = req.cookies.user;
    const currentUserData = JSON.parse(encodedUserData);
    // let country_response = [];
    // let accounts_response = [];
    // let cat_data = [];
    // //-- Get Country List --/
    // db.query('SELECT * FROM countries', (err, results) => {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         if (results.length > 0) {
    //             //console.log(results);
    //             country_response = results;
    //             db.query('SELECT * FROM user_account_type', (err, accountresults) => {
    //                 if (err) {
    //                     console.log(err);
    //                 } else {
    //                     if (accountresults.length > 0) {
    //                         accounts_response = accountresults;
    //                         let cat_data = [];

    //                         const sql = "SELECT * FROM category"
    //                         db.query(sql, (error, cat_result) => {
    //                             if (error) {
    //                                 console.log(error);
    //                             } else {
    //                                 console.log(cat_data);
    //                                 if (cat_result.length > 0) {
    //                                     cat_data = cat_result;
    //                                     res.render('edit-category', { menu_active_id: 'category', page_title: 'Add New Category', currentUserData, country_response, accounts_response, cat_data });

    //                                 } else {
    //                                     res.render('edit-category', { menu_active_id: 'category', page_title: 'Add New Category', currentUserData, country_response, accounts_response, cat_data });
    //                                 }
    //                             }
    //                         })

    //                     }
    //                 }
    //             })

    //         }
    //     }
    // })
    res.render('edit-category', { menu_active_id: 'category', page_title: 'Add New Category', currentUserData, 'ids': req.params.id });
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