const express = require('express');
const path = require('path');
const fs = require('fs');
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