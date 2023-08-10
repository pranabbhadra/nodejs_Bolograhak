const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../config');
var moment = require('moment');
const { error } = require('console');
const async = require('async');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const comFunction = require('../common_function');
const comFunction2 = require('../common_function2');

const router = express.Router();
const publicPath = path.join(__dirname, '../public');

router.get('/register-user', async (req, res) => {
    console.log(req.query);
    const userResponse = JSON.parse(req.query.userResponse);
    res.json({
        menu_active_id: req.query.menu_active_id,
        page_title: req.query.page_title,
        userResponse: userResponse
    });
});

// Middleware function to check if user CookieValue Exist
const checkCookieValue = (req, res, next) => {
    // Check if the 'userData' cookie exists and has a value
    res.locals.globalData = {
        BLOG_URL: process.env.BLOG_URL,
        // Add other variables as needed
    };
    if (req.cookies.user) {
        // If it exists, set the 'userData' property on the request object to the cookie value
        req.userData = req.cookies.user;
    } else {
        // If the cookie doesn't exist or has no value, set 'userData' to null
        req.userData = null;
    }
    // Call the next middleware or route handler
    next();
};

router.get('', checkCookieValue, async (req, res) => {
    let currentUserData = JSON.parse(req.userData);

    const [allRatingTags] = await Promise.all([
        comFunction.getAllRatingTags(),
    ]);
    const rangeTexts = {};

    try {
        // Make API request to fetch blog posts
        const apiUrl = process.env.BLOG_API_ENDPOINT + '/home-blog';
        const response = await axios.get(apiUrl);
        const blogPosts = response.data;
        const sql = `SELECT * FROM page_info where secret_Key = 'home' `;
        db.query(sql, (err, results, fields) => {
            if (err) throw err;
            const home = results[0];
            const meta_sql = `SELECT * FROM page_meta where page_id = ${home.id}`;
            db.query(meta_sql, async (meta_err, _meta_result) => {
                if (meta_err) throw meta_err;

                const meta_values = _meta_result;
                let meta_values_array = {};
                await meta_values.forEach((item) => {
                    meta_values_array[item.page_meta_key] = item.page_meta_value;
                })

                const featured_sql = `SELECT featured_companies.id,featured_companies.company_id,featured_companies.short_desc,featured_companies.link,company.logo,company.company_name FROM featured_companies 
                        JOIN company ON featured_companies.company_id = company.ID 
                        WHERE featured_companies.status = 'active' 
                        ORDER BY featured_companies.ordering ASC `;
                db.query(featured_sql, (featured_err, featured_result) => {
                    var featured_comps = featured_result;
                    res.render('front-end/landing', {
                        menu_active_id: 'landing',
                        page_title: home.title,
                        currentUserData: currentUserData,
                        homePosts: blogPosts.status === 'ok' ? blogPosts.data : [],
                        home,
                        meta_values_array,
                        featured_comps,
                        allRatingTags: allRatingTags,
                        AddressapiKey: process.env.ADDRESS_GOOGLE_API_Key
                    });
                })

            })

        })
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        const sql = `SELECT * FROM page_info where secret_Key = 'home' `;
        db.query(sql, (err, results, fields) => {
            if (err) throw err;
            const home = results[0];
            const meta_sql = `SELECT * FROM page_meta where page_id = ${home.id}`;
            db.query(meta_sql, async (meta_err, _meta_result) => {
                if (meta_err) throw meta_err;

                const meta_values = _meta_result;
                let meta_values_array = {};
                await meta_values.forEach((item) => {
                    meta_values_array[item.page_meta_key] = item.page_meta_value;
                })

                const featured_sql = `SELECT featured_companies.id,featured_companies.company_id,featured_companies.short_desc,featured_companies.link,company.logo,company.company_name FROM featured_companies 
                        JOIN company ON featured_companies.company_id = company.ID 
                        WHERE featured_companies.status = 'active' 
                        ORDER BY featured_companies.ordering ASC `;
                db.query(featured_sql, (featured_err, featured_result) => {
                    var featured_comps = featured_result;
                    res.render('front-end/landing', {
                        menu_active_id: 'landing',
                        page_title: home.title,
                        currentUserData: currentUserData,
                        homePosts: [],
                        home,
                        meta_values_array,
                        featured_comps,
                        AddressapiKey: process.env.ADDRESS_GOOGLE_API_Key
                    });
                })

            })

        })
    }
});
//view Contact Us Page
router.get('/contact-us', checkCookieValue, (req, res) => {
    //resp.sendFile(`${publicPath}/index.html`)
    let currentUserData = JSON.parse(req.userData);

    const sql = `SELECT * FROM contacts`;
    db.query(sql, (err, results, fields) => {
        if (err) throw err;
        const social_sql = `SELECT * FROM socials`;
        db.query(social_sql, (error, social_results, fields) => {
            //console.log(results[0], social_results[0]);
            const contacts = results[0];
            const page_title = results[0].title;
            const socials = social_results[0];
            res.render('front-end/contact', { menu_active_id: 'contact', page_title: page_title, currentUserData, contacts, socials });

        })
    })

});

//View About us Page
router.get('/about-us', checkCookieValue, async (req, res) => {
    let currentUserData = JSON.parse(req.userData);
    try {
        const sql = `SELECT * FROM page_info where secret_Key = 'about' `;
        db.query(sql, (err, results, fields) => {
            if (err) throw err;
            const common = results[0];
            const meta_sql = `SELECT * FROM page_meta where page_id = ${common.id}`;
            db.query(meta_sql, async (meta_err, _meta_result) => {
                if (meta_err) throw meta_err;

                const meta_values = _meta_result;
                let meta_values_array = {};
                await meta_values.forEach((item) => {
                    meta_values_array[item.page_meta_key] = item.page_meta_value;
                })
                res.render('front-end/about', {
                    menu_active_id: 'about',
                    page_title: common.title,
                    currentUserData: currentUserData,
                    common,
                    meta_values_array
                });
            })

        })
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        res.render('front-end/about', {
            menu_active_id: 'about',
            page_title: common.title,
            currentUserData: currentUserData,
            common,
            meta_values_array
        });
    }
    //res.render('front-end/about', { menu_active_id: 'about', page_title: 'About Us', currentUserData });
});

router.get('/review', checkCookieValue, async (req, res) => {
    try {
        let currentUserData = JSON.parse(req.userData);

        // Fetch all the required data asynchronously
        const [latestReviews] = await Promise.all([
            comFunction.getlatestReviews(15),
        ]);

        res.render('front-end/review', {
            menu_active_id: 'review',
            page_title: 'Customer Reviews',
            currentUserData,
            latestReviews: latestReviews
        });
        // res.json({
        //     menu_active_id: 'review',
        //     page_title: 'Customer Reviews',
        //     currentUserData,
        //     latestReviews: latestReviews
        // });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

router.get('/faq', checkCookieValue, async (req, res) => {
    let currentUserData = JSON.parse(req.userData);
    res.render('front-end/faq', { menu_active_id: 'faq', page_title: 'FAQ', currentUserData });
});

router.get('/contact', checkCookieValue, async (req, res) => {
    let currentUserData = JSON.parse(req.userData);
    res.render('front-end/contact', { menu_active_id: 'contact', page_title: 'Contact Us', currentUserData });
});

router.get('/business', checkCookieValue, async (req, res) => {
    let currentUserData = JSON.parse(req.userData);
    res.render('front-end/business', { menu_active_id: 'business', page_title: 'Business', currentUserData });
});

router.get('/myprofile', checkCookieValue, async (req, res) => {
    let currentUserData = JSON.parse(req.userData);
    res.render('front-end/myprofile', { menu_active_id: 'myprofile', page_title: 'My Profile', currentUserData });
});

router.get('/profile-dashboard', checkCookieValue, async (req, res) => {
    let currentUserData = JSON.parse(req.userData);
    res.render('front-end/profile-dashboard', { menu_active_id: 'profile-dashboard', page_title: 'My Dashboard', currentUserData });
});

router.get('/privacy-policy', checkCookieValue, async (req, res) => {
    let currentUserData = JSON.parse(req.userData);
    res.render('front-end/privacy-policy', { menu_active_id: 'privacy-policy', page_title: 'Privacy Policy', currentUserData });
});

router.get('/terms-conditions', checkCookieValue, async (req, res) => {
    let currentUserData = JSON.parse(req.userData);
    res.render('front-end/terms-conditions', { menu_active_id: 'terms-conditions', page_title: 'Terms of Service', currentUserData });
});
router.get('/category-details-free', checkCookieValue, async (req, res) => {
    const [allRatingTags] = await Promise.all([
        comFunction.getAllRatingTags(),
    ]);
    let currentUserData = JSON.parse(req.userData);
    res.render('front-end/category-details-free', { menu_active_id: 'category-details-free', page_title: 'Categories Details', currentUserData, allRatingTags });
});

router.get('/category-details-premium', checkCookieValue, async (req, res) => {
    let currentUserData = JSON.parse(req.userData);
    res.render('front-end/category-details-premium', { menu_active_id: 'category-details-premium', page_title: 'Categories Details', currentUserData });
});
// Front-End Page Routes End--------------------//


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
    const encodedUserData = req.cookies.user;
    const currentUserData = JSON.parse(encodedUserData);
    if (currentUserData.user_type_id == 2) {
        res.clearCookie('user');
        res.redirect('/');
    } else {
        res.clearCookie('user');
        res.redirect('/sign-in');
    }

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

//---Review Rating Tag--//
router.get('/add-rating-tag', checkLoggedIn, async (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        res.render('add-rating-tag', {
            menu_active_id: 'review-rating',
            page_title: 'Add Tag',
            currentUserData
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

router.get('/review-rating-tags', checkLoggedIn, async (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);

        // Fetch all the required data asynchronously
        const [allRatingTags] = await Promise.all([
            comFunction.getAllRatingTags(),
        ]);

        res.render('review-rating-tags', {
            menu_active_id: 'review-rating',
            page_title: 'All Tags',
            currentUserData,
            allRatingTags: allRatingTags
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

router.get('/edit-rating-tag/:id', checkLoggedIn, async (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const review_rating_Id = req.params.id;

        // Fetch all the required data asynchronously
        const [reviewRatingData] = await Promise.all([
            comFunction.getReviewRatingData(review_rating_Id),
            //comFunction.getCompanyCategoryBuID(companyId)
            //comFunction.getCompanyMeta(userId),
        ]);

        // Render the 'edit-user' EJS view and pass the data
        // res.json({
        //     menu_active_id: 'review-rating',
        //     page_title: 'Edit Rating Tag',
        //     currentUserData,
        //     reviewRatingData: reviewRatingData          
        // });
        res.render('edit-rating-tag', {
            menu_active_id: 'review-rating',
            page_title: 'Edit Rating Tag',
            currentUserData,
            reviewRatingData: reviewRatingData
            //countries: countries,
            //states: states            
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});



//Add FAQ Page
router.get('/add-faq', checkLoggedIn, async (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const faqPageData = await comFunction2.getFaqPage();
        // Render the 'add-page' EJS view and pass the data
        res.render('faq/add-faq', {
            menu_active_id: 'faq',
            page_title: 'FAQs ',
            currentUserData,
            faqPageData
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

//Edit FAQ Page
router.get('/edit-faq', checkLoggedIn, async (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);

        const faqPageData = await comFunction2.getFaqPage();
        const faqCategoriesData = await comFunction2.getFaqCategories();
        const faqItemsData = await comFunction2.getFaqItems();
        // console.log(faqPageData);
        // console.log(faqCategoriesData);
        // console.log(faqItemsData);
        // Render the 'add-page' EJS view and pass the data
        res.render('faq/edit-faq', {
            menu_active_id: 'faq',
            page_title: 'Edit FAQs ',
            currentUserData,
            faqPageData,
            faqCategoriesData,
            faqItemsData
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

//Edit Contact Page
router.get('/edit-contacts', checkLoggedIn, (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const sql = `SELECT * FROM contacts`;
        db.query(sql, (err, results, fields) => {
            if (err) throw err;
            const social_sql = `SELECT * FROM socials`;
            db.query(social_sql, (error, social_results, fields) => {
                const contacts = results[0];
                const socials = social_results[0];
                //Render the 'update-contact' EJS view and pass the data
                res.render('pages/update-contact', {
                    menu_active_id: 'pages',
                    page_title: 'Update Contacts',
                    currentUserData,
                    contacts,
                    socials
                });
            })
        })

    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

//Edit Home Page
router.get('/edit-home', checkLoggedIn, (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const sql = `SELECT * FROM page_info where secret_Key = 'home' `;
        db.query(sql, (err, results, fields) => {
            if (err) throw err;
            const home = results[0];
            const meta_sql = `SELECT * FROM page_meta where page_id = ${home.id}`;
            db.query(meta_sql, async (meta_err, _meta_result) => {
                if (meta_err) throw meta_err;

                const meta_values = _meta_result;
                let meta_values_array = {};
                await meta_values.forEach((item) => {
                    meta_values_array[item.page_meta_key] = item.page_meta_value;
                })
                //console.log(meta_values_array);
                res.render('pages/update-home', {
                    menu_active_id: 'pages',
                    page_title: 'Update Home',
                    currentUserData,
                    home,
                    meta_values_array
                });
            })

        })

    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

//Edit About Page
router.get('/edit-about', checkLoggedIn, (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const sql = `SELECT * FROM page_info where secret_Key = 'about' `;
        db.query(sql, (err, results, fields) => {
            if (err) throw err;
            const about_info = results[0];
            const meta_sql = `SELECT * FROM page_meta where page_id = ${about_info.id}`;
            db.query(meta_sql, async (meta_err, _meta_result) => {
                if (meta_err) throw meta_err;

                const meta_values = _meta_result;
                let meta_values_array = {};
                await meta_values.forEach((item) => {
                    meta_values_array[item.page_meta_key] = item.page_meta_value;
                })
                //console.log(meta_values_array);
                res.render('pages/update-about', {
                    menu_active_id: 'pages',
                    page_title: 'Update About',
                    currentUserData,
                    about_info,
                    meta_values_array
                });
                //comFunction.getMetaValue(home.id, 'about_us_button_link');

                // res.json({
                //     menu_active_id: 'pages',
                //     page_title: 'Update Home',
                //     currentUserData,
                //     home,
                //     meta_values_array
                // });
            })

        })

    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

//---Add Featured Company--//
router.get('/add-featured-company', checkLoggedIn, async (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const sql = `SELECT * FROM company where 1 `;
        db.query(sql, (err, companies, fields) => {
            // Render the 'edit-user' EJS view and pass the data
            //console.log(companies);
            res.render('pages/add-featured-company', {
                menu_active_id: 'pages',
                page_title: 'Add Featured Company',
                currentUserData,
                companies
            });
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

//---Edit Featured Company--//
router.get('/edit-featured-company/:id', checkLoggedIn, async (req, res) => {
    try {
        const comp_id = req.params.id;
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const sql = `SELECT featured_companies.id,featured_companies.company_id,featured_companies.status,featured_companies.ordering,featured_companies.short_desc,featured_companies.link,company.logo,company.company_name FROM featured_companies 
                        JOIN company ON featured_companies.company_id = company.ID 
                        WHERE featured_companies.id = ${comp_id} `;
        db.query(sql, (err, company, fields) => {
            // Render the 'edit-user' EJS view and pass the data
            //console.log(company);
            const f_company = company[0];
            res.render('pages/edit-featured-company', {
                menu_active_id: 'pages',
                page_title: 'Update Featured Company',
                currentUserData,
                f_company
            });
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

//---Edit Featured Company--//
router.get('/delete-featured-companies/:id', checkLoggedIn, async (req, res) => {
    try {
        const comp_id = req.params.id;
        sql = `DELETE FROM featured_companies WHERE id = ?`;
        const data = [comp_id];
        db.query(sql, data, (err, result) => {
            if (err) {
                return res.send({
                    status: 'not ok',
                    message: 'Something went wrong'
                });
            } else {
                return res.send({
                    status: 'ok',
                    message: 'Featured Company Deleted Successfully'
                });
            }

        })

    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});


//---View Featured Company--//
router.get('/view-featured-companies', checkLoggedIn, async (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const featured_sql = `SELECT featured_companies.id,featured_companies.company_id,featured_companies.status,featured_companies.ordering,featured_companies.short_desc,featured_companies.link,company.logo,company.company_name FROM featured_companies 
                        JOIN company ON featured_companies.company_id = company.ID 
                        ORDER BY featured_companies.ordering ASC `;

        db.query(featured_sql, (err, companies, fields) => {
            res.render('pages/view-featured-companies', {
                menu_active_id: 'pages',
                page_title: 'Featured Companies',
                currentUserData,
                companies
            });
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

//Edit Businesss Page
router.get('/edit-business', checkLoggedIn, (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const sql = `SELECT * FROM page_info where secret_Key = 'business' `;
        db.query(sql, (err, results, fields) => {
            if (err) throw err;
            const common = results[0];
            const meta_sql = `SELECT * FROM page_meta where page_id = ${common.id}`;
            db.query(meta_sql, async (meta_err, _meta_result) => {
                if (meta_err) throw meta_err;

                const meta_values = _meta_result;
                let meta_values_array = {};
                await meta_values.forEach((item) => {
                    meta_values_array[item.page_meta_key] = item.page_meta_value;
                })
                //console.log(meta_values_array);
                res.render('pages/update-business', {
                    menu_active_id: 'pages',
                    page_title: 'Update Business',
                    currentUserData,
                    common,
                    meta_values_array
                });
            })

        })

    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

router.get('/help/:id', (_, resp) => {
    resp.sendFile(`${publicPath}/help.html`)
});

//-- 404---//
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