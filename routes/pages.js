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
        MAIN_URL: process.env.MAIN_URL,
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

    const [allRatingTags,globalPageMeta] = await Promise.all([
        comFunction.getAllRatingTags(),
        comFunction2.getPageMetaValues('global'),
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
                //console.log(allRatingTags);
                const featured_sql = `SELECT featured_companies.id,featured_companies.company_id,featured_companies.short_desc,featured_companies.link,company.logo,company.company_name FROM featured_companies 
                        JOIN company ON featured_companies.company_id = company.ID 
                        WHERE featured_companies.status = 'active' 
                        ORDER BY featured_companies.ordering ASC `;
                db.query(featured_sql, (featured_err, featured_result) => {
                    var featured_comps = featured_result;
                    // res.json({
                    //     menu_active_id: 'landing',
                    //     page_title: home.title,
                    //     currentUserData: currentUserData,
                    //     homePosts: blogPosts.status === 'ok' ? blogPosts.data : [],
                    //     home,
                    //     meta_values_array,
                    //     featured_comps,
                    //     allRatingTags: allRatingTags,
                    //     AddressapiKey: process.env.ADDRESS_GOOGLE_API_Key
                    // });
                    res.render('front-end/landing', {
                        menu_active_id: 'landing',
                        page_title: home.title,
                        currentUserData: currentUserData,
                        homePosts: blogPosts.status === 'ok' ? blogPosts.data : [],
                        home,
                        meta_values_array,
                        featured_comps,
                        allRatingTags: allRatingTags,
                        AddressapiKey: process.env.ADDRESS_GOOGLE_API_Key,
                        globalPageMeta:globalPageMeta
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
                        allRatingTags: allRatingTags,
                        AddressapiKey: process.env.ADDRESS_GOOGLE_API_Key,
                        globalPageMeta:globalPageMeta
                    });
                })

            })

        })
    }
});
//view Contact Us Page
router.get('/contact-us', checkCookieValue,async (req, res) => {
    //resp.sendFile(`${publicPath}/index.html`)
    let currentUserData = JSON.parse(req.userData);
    const [globalPageMeta] = await Promise.all([
        comFunction2.getPageMetaValues('global'),
    ]);
    const sql = `SELECT * FROM contacts`;
    db.query(sql, (err, results, fields) => {
        if (err) throw err;
        const social_sql = `SELECT * FROM socials`;
        db.query(social_sql, (error, social_results, fields) => {
            //console.log(results[0], social_results[0]);
            const contacts = results[0];
            const page_title = results[0].title;
            const socials = social_results[0];
            res.render('front-end/contact', { menu_active_id: 'contact', page_title: page_title, currentUserData, contacts, socials,
            globalPageMeta:globalPageMeta });

        })
    })

});

//View About us Page
router.get('/about-us', checkCookieValue, async (req, res) => {
    let currentUserData = JSON.parse(req.userData);
    try {
        // const sql = `SELECT * FROM page_info where secret_Key = 'about' `;
        // db.query(sql, (err, results, fields) => {
        //     if (err) throw err;
        //     const common = results[0];
        //     const meta_sql = `SELECT * FROM page_meta where page_id = ${common.id}`;
        //     db.query(meta_sql, async (meta_err, _meta_result) => {
        //         if (meta_err) throw meta_err;

        //         const meta_values = _meta_result;
        //         let meta_values_array = {};
        //         await meta_values.forEach((item) => {
        //             meta_values_array[item.page_meta_key] = item.page_meta_value;
        //         })

                
        //         /*res.json({
        //             menu_active_id: 'about',
        //             page_title: common.title,
        //             currentUserData: currentUserData,
        //             common,
        //             meta_values_array
        //         });*/
        //         res.render('front-end/about', {
        //              menu_active_id: 'about',
        //              page_title: common.title,
        //              currentUserData: currentUserData,
        //              common,
        //              meta_values_array
        //          });
        //     })

        // })
        const [PageInfo,PageMetaValues,globalPageMeta] = await Promise.all([
            comFunction2.getPageInfo('about'),
            comFunction2.getPageMetaValues('about'),
            comFunction2.getPageMetaValues('global'),
        ]);
        //console.log(globalPageMeta)
        res.render('front-end/about', {
            menu_active_id: 'about',
            page_title: PageInfo.title,
            currentUserData: currentUserData,
            common:PageInfo,
            meta_values_array:PageMetaValues,
            globalPageMeta:globalPageMeta
        });
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
        const [latestReviews, AllReviews, AllTrendingReviews, AllReviewTags, allRatingTags, globalPageMeta] = await Promise.all([
            comFunction2.getlatestReviews(20),
            comFunction2.getAllReviews(),
            comFunction2.getAllTrendingReviews(),
            comFunction2.getAllReviewTags(),
            comFunction.getAllRatingTags(),
            comFunction2.getPageMetaValues('global'),
        ]);
        //console.log(getPageMetaValues);
        res.render('front-end/review', {
            menu_active_id: 'review',
            page_title: 'Customer Reviews',
            currentUserData,
            latestReviews: latestReviews,
            AllReviews: AllReviews,
            allRatingTags: allRatingTags,
            AllReviewTags: AllReviewTags,
            AllTrendingReviews: AllTrendingReviews,
            globalPageMeta:globalPageMeta
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
    try {
        let currentUserData = JSON.parse(req.userData);
        // const faqPageData = await comFunction2.getFaqPage();
        // const faqCategoriesData = await comFunction2.getFaqCategories();
        // const faqItemsData = await comFunction2.getFaqItems();
        const [faqPageData,faqCategoriesData,faqItemsData,globalPageMeta] = await Promise.all([
            comFunction2.getFaqPage(),
            comFunction2.getFaqCategories(),
            comFunction2.getFaqItems(),
            comFunction2.getPageMetaValues('global'),
        ]);
        // Render the 'add-page' EJS view and pass the data
        res.render('front-end/faq', {
            menu_active_id: 'faq',
            page_title: 'FAQ ',
            currentUserData,
            faqPageData,
            faqCategoriesData,
            faqItemsData,
            globalPageMeta:globalPageMeta
        });
    } catch (error) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
    
    //res.render('front-end/faq', { menu_active_id: 'faq', page_title: 'FAQ', currentUserData });
});



router.get('/business', checkCookieValue, async (req, res) => {
    
    const [globalPageMeta] = await Promise.all([
        comFunction2.getPageMetaValues('global'),
    ]);

    try {
        let currentUserData = JSON.parse(req.userData);
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

                const UpcomingBusinessFeature = await comFunction2.getUpcomingBusinessFeature();
                const BusinessFeature = await comFunction2.getBusinessFeature();
                //console.log(meta_values_array);
                res.render('front-end/business', {
                    menu_active_id: 'business',
                    page_title: common.title,
                    currentUserData,
                    common,
                    meta_values_array,
                    UpcomingBusinessFeature,
                    BusinessFeature,
                    globalPageMeta:globalPageMeta
                });
            })

        })

    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});


router.get('/company/:id', checkCookieValue, async (req, res) => {
    const companyID = req.params.id;
    const [allRatingTags, CompanyInfo, companyReviewNumbers, getCompanyReviews,globalPageMeta] = await Promise.all([
        comFunction.getAllRatingTags(),
        comFunction.getCompany(companyID),
        comFunction.getCompanyReviewNumbers(companyID),
        comFunction.getCompanyReviews(companyID),
        comFunction2.getPageMetaValues('global'),
    ]);
    let currentUserData = JSON.parse(req.userData);
    // res.json({
    //     allRatingTags,
    //     CompanyInfo,
    //     companyReviewNumbers,
    //     getCompanyReviews
    // });
    res.render('front-end/company-details',
    {
        menu_active_id: 'company',
        page_title: 'Organization Details',
        currentUserData,
        allRatingTags,
        CompanyInfo,
        companyReviewNumbers,
        getCompanyReviews,
        globalPageMeta:globalPageMeta
    });
});

router.get('/category-details-premium', checkCookieValue, async (req, res) => {
    let currentUserData = JSON.parse(req.userData);
    const [globalPageMeta] = await Promise.all([
        comFunction2.getPageMetaValues('global'),
    ]);

    res.render('front-end/category-details-premium', { menu_active_id: 'category-details-premium', page_title: 'Categories Details', currentUserData, globalPageMeta:globalPageMeta });
});

//Basic company profile dashboard Page 
router.get('/basic-company-profile-dashboard', checkCookieValue, async (req, res) => {
    let currentUserData = JSON.parse(req.userData);
    const [globalPageMeta] = await Promise.all([
        comFunction2.getPageMetaValues('global'),
    ]);

    res.render('front-end/basic-company-profile-dashboard', { menu_active_id: 'company-dashboard', page_title: 'Company Dashboard', currentUserData, globalPageMeta:globalPageMeta });
});

//Premium company profile dashboard Page 
router.get('/premium-company-profile-dashboard', checkCookieValue, async (req, res) => {
    let currentUserData = JSON.parse(req.userData);
    const [globalPageMeta] = await Promise.all([
        comFunction2.getPageMetaValues('global'),
    ]);

    res.render('front-end/premium-company-profile-dashboard', { menu_active_id: 'company-dashboard', page_title: 'Company Dashboard', currentUserData, globalPageMeta:globalPageMeta });
});

router.get('/privacy-policy', checkCookieValue, async (req, res) => {
    let currentUserData = JSON.parse(req.userData);
    const [globalPageMeta] = await Promise.all([
        comFunction2.getPageMetaValues('global'),
    ]);
    try {
        const sql = `SELECT * FROM page_info where secret_Key = 'privacy' `;
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
                res.render('front-end/privacy-policy', {
                    menu_active_id: 'privacy-policy',
                    page_title: common.title,
                    currentUserData,
                    common,
                    meta_values_array,
                    globalPageMeta:globalPageMeta
                });
            })

        })
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

router.get('/disclaimer', checkCookieValue, async (req, res) => {
    let currentUserData = JSON.parse(req.userData);
    const [globalPageMeta] = await Promise.all([
        comFunction2.getPageMetaValues('global'),
    ]);
    try {
        const sql = `SELECT * FROM page_info where secret_Key = 'disclaimer' `;
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
                console.log(meta_values_array);
                res.render('front-end/disclaimer', {
                    menu_active_id: 'disclaimer',
                    page_title: common.title,
                    currentUserData,
                    common,
                    meta_values_array,
                    globalPageMeta:globalPageMeta
                });
            })

        })
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
    //res.render('front-end/disclaimer', { menu_active_id: 'disclaimer', page_title: 'Disclaimer', currentUserData });
});

router.get('/terms-of-service', checkCookieValue, async (req, res) => {
    let currentUserData = JSON.parse(req.userData);
    const [globalPageMeta] = await Promise.all([
        comFunction2.getPageMetaValues('global'),
    ]);
    try {
        const sql = `SELECT * FROM page_info where secret_Key = 'terms_of_service' `;
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
                console.log(meta_values_array);
                res.render('front-end/terms-of-service', {
                    menu_active_id: 'terms-of-service',
                    page_title: common.title,
                    currentUserData,
                    common,
                    meta_values_array,
                    globalPageMeta:globalPageMeta
                });
            })

        })
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
    //res.render('front-end/terms-of-service', { menu_active_id: 'terms-of-service', page_title: 'Terms Of Service', currentUserData });
});

//FrontEnd profile-dashboard page
router.get('/users-all-reviews', checkFrontEndLoggedIn, async (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const userId = currentUserData.user_id;
        console.log('editUserID: ', userId);

        // Fetch all the required data asynchronously
        const [ AllCompaniesReviews, AllReviewTags, allRatingTags,globalPageMeta] = await Promise.all([
            comFunction2.getAllCompaniesReviews(userId),
            comFunction2.getAllReviewTags(),
            comFunction.getAllRatingTags(),
            comFunction2.getPageMetaValues('global'),
        ]);
        //console.log(AllReviewTags);
        // Render the 'edit-user' EJS view and pass the data
        res.render('front-end/user-all-reviews', {
            menu_active_id: 'profile-dashboard',
            page_title: 'My Reviews',
            currentUserData,
            AllCompaniesReviews: AllCompaniesReviews,
            allRatingTags:allRatingTags,
            AllReviewTags:AllReviewTags,
            globalPageMeta:globalPageMeta
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
    //res.render('front-end/profile-dashboard', { menu_active_id: 'profile-dashboard', page_title: 'My Dashboard', currentUserData });
});

//FrontEnd myprofile page
router.get('/edit-myprofile', checkFrontEndLoggedIn, async (req, res) => {  
    
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const userId = currentUserData.user_id;
        console.log('editUserID: ', userId);

        // Fetch all the required data asynchronously
        const [user, userMeta, countries, states, globalPageMeta] = await Promise.all([
            comFunction.getUser(userId),
            comFunction.getUserMeta(userId),
            comFunction.getCountries(),
            comFunction.getStatesByUserID(userId),
            comFunction2.getPageMetaValues('global'),
        ]);

        // Render the 'edit-user' EJS view and pass the data
        res.render('front-end/update-myprofile', {
            menu_active_id: 'edit-myprofile',
            page_title: 'Update My Profile',
            currentUserData,
            user: user,
            userMeta: userMeta,
            countries: countries,
            states: states,
            globalPageMeta:globalPageMeta
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
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

router.get('/admin-login', (req, res) => {
    const encodedUserData = req.cookies.user;
    if (encodedUserData) {
        res.redirect('dashboard');
    } else {
        res.render('sign-in', { message: '' })
    }
});

// router.get('/sign-up', (req, res) => {
//     res.render('sign-up', { message: '' })
// });

router.get('/logout', (req, res) => {
    const encodedUserData = req.cookies.user;
    const currentUserData = JSON.parse(encodedUserData);
    if (currentUserData.user_type_id == 2) {
        res.clearCookie('user');
        res.redirect('/');
    } else {
        res.clearCookie('user');
        res.redirect('/admin-login');
    }

});


// Protected route example

// Middleware function to check if user is logged in
async function checkLoggedIn(req, res, next) {
    res.locals.globalData = {
        BLOG_URL: process.env.BLOG_URL,
        MAIN_URL: process.env.MAIN_URL,
        // Add other variables as needed
    };    
    const encodedUserData = req.cookies.user;
    try {
        if (encodedUserData) {
            const UserJsonData = JSON.parse(encodedUserData);
            console.log(UserJsonData.user_type_id);
            // User is logged in, proceed to the next middleware or route handler
            if( UserJsonData.user_type_id==1 || UserJsonData.user_type_id==3 ){
                next();
            }else{
                res.redirect('/');
            }
            
        } else {
            res.redirect('admin-login');
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
                                res.render('edit-category', { menu_active_id: 'company', page_title: 'Account Settings', currentUserData, country_response, state_response });
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
                //res.json({ currentUserData, 'allusers': users });
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
            res.render('categories', { menu_active_id: 'company', page_title: 'Categories', currentUserData, 'categories': categories });
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
                            res.render('add-category', { menu_active_id: 'company', page_title: 'Add New Category', currentUserData, country_response, cat_data });

                        } else {
                            res.render('add-category', { menu_active_id: 'company', page_title: 'Add New Category', currentUserData, country_response, cat_data });
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
                                    res.render('edit-category', { menu_active_id: 'company', page_title: 'Add New Category', currentUserData, country_response, cat_data, edit_data, country_arr, country_id });
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
        // res.json({
        //     allcompany: allcompany
        // });
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
        const [company, company_all_categories, users] = await Promise.all([
            comFunction.getCompany(companyId),
            comFunction.getCompanyCategoryBuID(companyId),
            comFunction.getUsersByRole(2)
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
        //     company_all_categories: company_all_categories,
        //     users: users
        //     //countries: countries,
        //     //states: states            
        // });
        res.render('edit-company', {
            menu_active_id: 'company',
            page_title: 'Edit Company',
            currentUserData,
            company: company,
            company_all_categories: company_all_categories,
            Allusers: users
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
            menu_active_id: 'rating-tag',
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
            menu_active_id: 'rating-tag',
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
        //     menu_active_id: 'rating-tag',
        //     page_title: 'Edit Rating Tag',
        //     currentUserData,
        //     reviewRatingData: reviewRatingData          
        // });
        res.render('edit-rating-tag', {
            menu_active_id: 'rating-tag',
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

router.get('/all-review', checkLoggedIn, async (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);

        // Fetch all the required data asynchronously
        const [allReviews] = await Promise.all([
            comFunction.getAllReviews(),
        ]);

        // res.json({
        //     menu_active_id: 'review',
        //     page_title: 'All Review',
        //     currentUserData,
        //     allReviews: allReviews
        // });
        res.render('all-review', {
            menu_active_id: 'review',
            page_title: 'All Review',
            currentUserData,
            allReviews: allReviews
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

router.get('/edit-review/:id', checkLoggedIn, async (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const review_Id = req.params.id;

        // Fetch all the required data asynchronously
        const [reviewData, reviewTagData] = await Promise.all([
            comFunction.getCustomerReviewData(review_Id),
            comFunction.getCustomerReviewTagRelationData(review_Id),
        ]);

        // Render the 'edit-user' EJS view and pass the data
        // res.json({
        //     reviewData: reviewData,
        //     reviewTagData: reviewTagData,        
        // });
        res.render('edit-review', {
            menu_active_id: 'review',
            page_title: 'Edit Review',
            currentUserData,
            reviewData,
            reviewTagData: reviewTagData,            
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
            menu_active_id: 'pages',
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
        // Render the 'add-page' EJS view and pass the data
        res.render('faq/edit-faq', {
            menu_active_id: 'pages',
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
                menu_active_id: 'company',
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
                menu_active_id: 'company',
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
                menu_active_id: 'company',
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

                const UpcomingBusinessFeature = await comFunction2.getUpcomingBusinessFeature();
                const BusinessFeature = await comFunction2.getBusinessFeature();
                //console.log(meta_values_array);
                res.render('pages/update-business', {
                    menu_active_id: 'pages',
                    page_title: 'Update Business',
                    currentUserData,
                    common,
                    meta_values_array,
                    UpcomingBusinessFeature,
                    BusinessFeature
                });
            })

        })

    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

//Edit privacy-policy Page
router.get('/edit-privacy-policy', checkLoggedIn, (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const sql = `SELECT * FROM page_info where secret_Key = 'privacy' `;
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
                console.log(meta_values_array);
                res.render('pages/update-privacy-policy', {
                    menu_active_id: 'pages',
                    page_title: 'Update Privacy Policy',
                    currentUserData,
                    common,
                    meta_values_array,
                });
            })

        })
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});
//Edit disclaimer Page
router.get('/edit-disclaimer', checkLoggedIn, (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const sql = `SELECT * FROM page_info where secret_Key = 'disclaimer' `;
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
                console.log(meta_values_array);
                res.render('pages/update-disclaimer', {
                    menu_active_id: 'pages',
                    page_title: 'Update Disclaimer',
                    currentUserData,
                    common,
                    meta_values_array,
                });
            })

        })
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});
//Edit terms-of-service Page
router.get('/edit-terms-of-service', checkLoggedIn, (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const sql = `SELECT * FROM page_info where secret_Key = 'terms_of_service' `;
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
                console.log(meta_values_array);
                res.render('pages/update-terms-of-service', {
                    menu_active_id: 'pages',
                    page_title: 'Update Terms of Service',
                    currentUserData,
                    common,
                    meta_values_array,
                });
            })

        })
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

// Middleware function to check if user is logged in Frontend
async function checkFrontEndLoggedIn(req, res, next) {

    res.locals.globalData = {
        BLOG_URL: process.env.BLOG_URL,
        MAIN_URL: process.env.MAIN_URL,
        // Add other variables as needed
    };
    const encodedUserData = req.cookies.user;
    //const currentUserData = JSON.parse(encodedUserData);

    try {
        if (encodedUserData) {
            // User is logged in, proceed to the next middleware or route handler
            next();
        } else {
            res.redirect('/');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
}

router.get('/myprofile', checkFrontEndLoggedIn, async (req, res) => {  
    
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const userId = currentUserData.user_id;
        //console.log('editUserID: ', currentUserData);

        // Fetch all the required data asynchronously
        const [user, userMeta, globalPageMeta] = await Promise.all([
            comFunction.getUser(userId),
            comFunction.getUserMeta(userId),
            comFunction2.getPageMetaValues('global'),
        ]);

        // Render the 'edit-user' EJS view and pass the data
        res.render('front-end/myprofile', {
            menu_active_id: 'myprofile',
            page_title: 'My Profile',
            currentUserData,
            user: user,
            userMeta: userMeta,
            globalPageMeta:globalPageMeta
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

//FrontEnd profile-dashboard page
router.get('/profile-dashboard', checkFrontEndLoggedIn, async (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const userId = currentUserData.user_id;
        console.log('editUserID: ', userId);

        // Fetch all the required data asynchronously
        const [user, userMeta, ReviewedCompanies, AllCompaniesReviews, AllReviewTags, allRatingTags,globalPageMeta] = await Promise.all([
            comFunction.getUser(userId),
            comFunction.getUserMeta(userId),
            comFunction2.getReviewedCompanies(userId),
            comFunction2.getAllCompaniesReviews(userId),
            comFunction2.getAllReviewTags(),
            comFunction.getAllRatingTags(),
            comFunction2.getPageMetaValues('global'),
        ]);
        //console.log(AllReviewTags);
        // Render the 'edit-user' EJS view and pass the data
        res.render('front-end/profile-dashboard', {
            menu_active_id: 'profile-dashboard',
            page_title: 'My Dashboard',
            currentUserData,
            user: user,
            userMeta: userMeta,
            ReviewedCompanies: ReviewedCompanies,
            AllCompaniesReviews: AllCompaniesReviews,
            allRatingTags:allRatingTags,
            AllReviewTags:AllReviewTags,
            globalPageMeta:globalPageMeta
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
    //res.render('front-end/profile-dashboard', { menu_active_id: 'profile-dashboard', page_title: 'My Dashboard', currentUserData });
});

//FrontEnd profile-dashboard page
router.get('/my-reviews', checkFrontEndLoggedIn, async (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const userId = currentUserData.user_id;
        console.log('editUserID: ', userId);

        // Fetch all the required data asynchronously
        const [ AllCompaniesReviews, AllReviewTags, allRatingTags,globalPageMeta] = await Promise.all([
            comFunction2.getAllCompaniesReviews(userId),
            comFunction2.getAllReviewTags(),
            comFunction.getAllRatingTags(),
            comFunction2.getPageMetaValues('global'),
        ]);
        //console.log(AllReviewTags);
        // Render the 'edit-user' EJS view and pass the data
        res.render('front-end/user-all-reviews', {
            menu_active_id: 'profile-dashboard',
            page_title: 'My Reviews',
            currentUserData,
            AllCompaniesReviews: AllCompaniesReviews,
            allRatingTags:allRatingTags,
            AllReviewTags:AllReviewTags,
            globalPageMeta:globalPageMeta
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
    //res.render('front-end/profile-dashboard', { menu_active_id: 'profile-dashboard', page_title: 'My Dashboard', currentUserData });
});


//Edit terms-of-service Page
router.get('/edit-global', checkLoggedIn, (req, res) => {
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const sql = `SELECT * FROM page_info where secret_Key = 'global' `;
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
                res.render('pages/update-global', {
                    menu_active_id: 'pages',
                    page_title: 'Global Content',
                    currentUserData,
                    common,
                    meta_values_array,
                });
            })

        })
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});


//-----------------APP API---------------------------//



//get All user details
router.get('/getAllUsersDetails', async (req, res) => {
    const {user_type_id}=req.query;
    if(!user_type_id){
        const userTypeToExclude=1;
            const query = 'SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone, u.user_registered, u.register_from, u.external_registration_id, u.user_type_id , u.user_status, m.address, m.country, m.state, m.city, m.zip, m.date_of_birth, m.occupation, m.gender, m.profile_pic,  m.alternate_phone, m.marital_status,m.about, c.name AS countryname, s.name AS statename FROM users u LEFT JOIN user_customer_meta m ON u.user_id = m.user_id LEFT JOIN countries c ON m.country = c.id LEFT JOIN states s ON m.state = s.id WHERE u.user_type_id != ?';
            db.query(query, [userTypeToExclude], (err, results) => {
            if (err) {
                return res.status(500).json({
                    status: "error",
                    message: 'An error occurred while fetching user details ' + err,
                });
            }
            if (results.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'No users found',
                });
            }
            return res.status(200).json({
                status: 'success',
                data: results,
                message: 'User details fetched successfully',
            });
        });
    }else{
        const query='SELECT u.user_id,u.first_name,u.last_name,u.email, u.phone, u.user_type_id , u.user_status, m.address, m.country, m.state, m.city, m.zip, m.date_of_birth, m.occupation, m.gender, m.profile_pic, c.name AS countryname, s.name AS statename FROM users u LEFT JOIN user_customer_meta m ON u.user_id = m.user_id LEFT JOIN countries c ON m.country = c.id LEFT JOIN states s ON m.state = s.id WHERE u.user_type_id = ?';
        db.query(query,[user_type_id],(err,results)=>{
        if(err){
            return res.status(200).json({
                status:'success',
                data:results,
                message:'An error ocurred while processing',
                });
            }
            if(results.length===0){
                return res.status(404).json({
                    status:'err',
                    message:'No users found with this user_id '
                });
            }
            return res.status(200).json({
                status: 'success',
                data: results,
                message: 'User details fetched successfully',
            });
        })
    }
});


router.get('/getAllCompaniesDetails', async (req, res) => {
    const query = `SELECT c.ID, c.user_created_by, c.logo, c.company_name, c.comp_phone, c.comp_email, c.status, c.trending, c.main_address, c.main_address_pin_code, COUNT(r.id) as review_count, AVG(r.rating) as average_rating,
    l.id as location_id, l.address, l.country, l.state, l.city, l.zip
    FROM company c
    JOIN company_location l ON c.ID = l.company_id
    LEFT JOIN reviews r ON c.ID = r.company_id
    GROUP BY c.ID, c.company_name, l.id, l.address, l.country, l.state, l.city, l.zip`;
    

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: 'An error occurred while fetching company details',
                err
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No companies found'
            });
        }

        const companiesData = {};

        results.forEach(row => {
            const companyId = row.ID;

            if (!companiesData[companyId]) {
                companiesData[companyId] = {
                    company_name: row.company_name,
                    review_count: row.review_count,
                    average_rating: row.average_rating,
                    user_created_by:row.user_created_by,
                    logo:row.logo,
                    comp_phone:row.comp_phone,
                    comp_email:row.comp_email,
                    status:row.status,
                    trending:row.trending,
                    main_address:row.main_address,
                    main_address_pin_code:row.main_address_pin_code,
                    locations: []
                };
            }

            companiesData[companyId].locations.push({
                id: row.location_id,
                address: row.address,
                country: row.country,
                state: row.state,
                city: row.city,
                zip: row.zip
            });
        });

        const formattedCompaniesData = Object.values(companiesData);

        return res.status(200).json({
            status: 'success',
            data: formattedCompaniesData,
            message: 'Company details fetched successfully'
        });
    });
});

//getComapniesDetails by ID
router.get('/getComapniesDetails/:ID', async (req, res) => {
    const { ID } = req.params;
    const query = `
        SELECT
            c.user_created_by,
            c.company_name,
            c.logo,
            c.comp_phone,
            c.comp_email,
            c.comp_registration_id,
            c.status,
            c.created_date,
            c.updated_date,
            l.id as location_id,
            l.address,
            l.country,
            l.state,
            l.city,
            l.zip,
            COALESCE(AVG(r.rating), 0) as average_rating,
            COALESCE(COUNT(r.id), 0) as review_count,
            COALESCE(COUNT(r.rating), 0) as rating_count
        FROM company c
        LEFT JOIN company_location l ON c.ID = l.company_id
        LEFT JOIN reviews r ON c.ID = r.company_id
        WHERE c.ID = ? 
        GROUP BY
            c.ID,
            c.user_created_by,
            c.company_name,
            c.logo,
            c.comp_phone,
            c.comp_email,
            c.comp_registration_id,
            c.status,
            c.created_date,
            c.updated_date,
            l.id,
            l.address,
            l.country,
            l.state,
            l.city,
            l.zip;
    `;
    
    console.log('Query Parameters:', [ID]);

    db.query(query, [ID], (err, results) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: 'An error occurred while fetching company details',
                err
            });
        }
        if (results.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Company not found'
            });
        }
        const companyData = {
            company_id: ID,
            user_created_by: results[0].user_created_by,
            company_name: results[0].company_name,
            logo: results[0].logo,
            comp_phone: results[0].comp_phone,
            comp_email: results[0].comp_email,
            comp_registration_id: results[0].comp_registration_id,
            status: results[0].status,
            created_date: results[0].created_date,
            updated_date: results[0].updated_date,
            average_rating: results[0].average_rating,
            review_count: results[0].review_count,
            rating_counts: results[0].rating_count, 
            locations: results.map(location => ({
                id: location.location_id,
                address: location.address,
                country: location.country,
                state: location.state,
                city: location.city,
                zip: location.zip
            }))
        };
       
        const reviewsQuery = 'SELECT * FROM reviews WHERE company_id = ? AND review_status = 1';
        db.query(reviewsQuery, [ID], (reviewsErr, reviewsResults) => {
            if (reviewsErr) {
                return res.status(500).json({
                    status: 'error',
                    message: 'An error occurred while fetching company reviews',
                    err: reviewsErr
                });
            }
            
            companyData.reviews = reviewsResults;

            const ratingCountsQuery = 'SELECT rating, COUNT(*) as rating_count FROM reviews WHERE company_id = ? GROUP BY rating';
            db.query(ratingCountsQuery, [ID], (ratingCountsErr, ratingCountsResults) => {
                if (ratingCountsErr) {
                    return res.status(500).json({
                        status: 'error',
                        message: 'An error occurred while fetching rating counts',
                        err: ratingCountsErr
                    });
                }

                companyData.rating_counts = ratingCountsResults;

                return res.status(200).json({
                    status: 'success',
                    data: [companyData],
                    message: 'Company details fetched successfully'
                });
            });
        });
    });
});

//getAllRatingTags
router.get('/getAllRatingTags', async (req, res) => {
    const query = 'SELECT * FROM review_rating_tags';

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: 'An error occurred while fetching rating tags',
                err
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Rating tags not found'
            });
        }

        const ratingTags = results.map(tag => ({
            id: tag.id,
            review_rating_value: tag.review_rating_value,
            review_rating_name: tag.review_rating_name,
            rating_image: tag.rating_image,
            rating_tags: tag.rating_tags.split('|')
        }));

        return res.status(200).json({
            status: 'success',
            data: ratingTags,
            message: 'Rating tags fetched successfully'
        });
    });
});

//getcompanyreviewlisting
router.get('/getcompanyreviewlisting/:company_id', (req, res) => {
    const companyId = req.params.company_id;
  
    const companyQuery = `
      SELECT
        c.company_name,
        c.logo,
        c.heading,
        c.comp_registration_id,
        c.main_address
      FROM
        company c
      WHERE
        c.ID = ?;
    `;
  
    const reviewsQuery = `
    SELECT
    r.id AS review_id,
    r.review_title,
    r.rating,
    r.review_content,
    r.created_at AS review_created_at,
    c.created_date AS company_created_date
  FROM
    reviews r
  JOIN
    company c ON r.company_id = c.ID
  WHERE
    c.ID = ?
  ORDER BY
    r.created_at ASC
`;
  
    db.query(companyQuery, [companyId], (error, companyResult) => {
      if (error) {
        console.error('Error executing company query:', error);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        db.query(reviewsQuery, [companyId], (error, reviewsResult) => {
          if (error) {
            console.error('Error executing reviews query:', error);
            res.status(500).json({ error: 'Internal server error' });
          } else {
            const companyInfo = companyResult[0];
            const reviews = reviewsResult;
  
            const output = {
              company_name: companyInfo.company_name,
              logo: companyInfo.logo,
              heading: companyInfo.heading,
              comp_registration_id: companyInfo.comp_registration_id,
              main_address: companyInfo.main_address,
              reviews: reviews
            };
  
            res.status(200).json(output);
          }
        });
      }
    });
  });

//getuserreviewlisting
router.get('/getuserreviewlisting/:user_id', (req, res) => {
    const userId = req.params.user_id;
  
    const userQuery = `
      SELECT
        u.first_name,
        u.last_name,
        u.email,
        m.profile_pic
      FROM
        users u
      LEFT JOIN
        user_customer_meta m ON u.user_id = m.user_id
      WHERE
        u.user_id = ?;
    `;
  
    const reviewsQuery = `
      SELECT
        r.id AS review_id,
        r.review_title,
        r.rating,
        r.review_content,
        r.review_status,
        r.created_at AS review_created_at,
        co.company_name,
        co.logo AS company_logo
      FROM
        reviews r
      JOIN
        users c ON r.customer_id = c.user_id
      JOIN
        company co ON r.company_id = co.ID
      WHERE
        c.user_id = ? AND r.review_status=1
      ORDER BY
        r.created_at ASC;
    `;
  
    db.query(userQuery, [userId], (error, userResult) => {
      if (error) {
        console.error('Error executing user query:', error);
        res.status(500).json({ error: 'Internal server error' });
      } else if (userResult.length === 0) {
        res.status(404).json({ error: 'User not found' });
      } else {
        db.query(reviewsQuery, [userId], (error, reviewsResult) => {
          if (error) {
            console.error('Error executing reviews query:', error);
            res.status(500).json({ error: 'Internal server error' });
          } else {
            const userInfo = userResult[0];
            const reviews = reviewsResult;
  
            const output = {
              first_name: userInfo.first_name,
              last_name: userInfo.last_name,
              email: userInfo.email,
              profile_pic: userInfo.profile_pic,
              reviews: reviews
            };
  
            res.status(200).json(output);
          }
        });
      }
    });
});
 
//reviewslistofallcompaniesbyuser
router.get('/reviewslistofallcompaniesbyuser/:user_id', (req, res) => {
    const userId = req.params.user_id;
    console.log(userId)
       const query = `SELECT c.id AS company_id,MAX(r.created_at) AS latest_review_date,c.company_name,c.logo, COUNT(r.id) AS review_count FROM reviews r JOIN company c ON r.company_id = c.id WHERE r.customer_id = ? GROUP BY c.id, c.company_name ORDER BY latest_review_date DESC`;

      db.query(query, [userId], (queryErr, rows) => {
        if (queryErr) {
          console.error('Error fetching user reviews:', queryErr.message);
          res.status(500).json({ error: 'An error occurred while fetching user reviews' });
          return;
        }
  
        res.status(200).json(rows);
    });
});

//getAllReviews
router.get('/getreviewlisting', async (req, res) => {
    const query = `
    SELECT r.id, r.company_id, r.customer_id, r.company_location, r.company_location_id,
    c.company_name, c.logo, c.trending, AVG(r.rating) AS average_rating,
    r.review_title, r.rating AS individual_rating, r.review_content,
    r.user_privacy, r.review_status, r.created_at AS review_created_at,
    r.updated_at AS review_updated_at,
    u.first_name, u.last_name, u.email, ucd.profile_pic,
    rtr.id AS review_relation_tag_id, rtr.tag_name, GROUP_CONCAT(rtr.id) AS tag_ids
    FROM reviews r
    LEFT JOIN review_tag_relation rtr ON r.id = rtr.review_id
    LEFT JOIN company c ON r.company_id = c.ID
    LEFT JOIN users u ON r.customer_id = u.user_id
    LEFT JOIN user_customer_meta ucd ON u.user_id = ucd.user_id
    WHERE r.review_status = 1 
    GROUP BY r.id, r.company_id, r.review_title, r.rating, r.review_content, r.user_privacy,
    r.review_status, r.created_at, r.updated_at, rtr.id, u.first_name, u.last_name, u.email, ucd.profile_pic`;
    
      
    db.query(query, async (err, results) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: 'An error occurred while fetching details',
                err
            });
        }
        if(results.length===0){
            return res.status(404).json({
                status:'error',
                message:'No reviews found'
            })
        }
        const reviewsData={};

        results.forEach(row=>{
            const reviewId=row.id;

            if(!reviewsData[reviewId]){
                reviewsData[reviewId]={
                    id: row.id,
                    company_id: row.company_id,
                    customer_id: row.customer_id,
                    company_name: row.company_name,
                    logo: row.logo,
                    trending: row.trending,
                    company_location: row.company_location,
                    review_title:row.review_title,
                    rating:row.rating,
                    review_content:row.review_content,
                    user_privacy:row.user_privacy,
                    review_status:row.review_status,
                    created_at:row.created_at,
                    updated_at:row.updated_at,
                    reviewrelation_id:row.reviewrelation_id,
                    first_name:row.first_name,
                    last_name:row.last_name,
                    email:row.email,    
                    profile_pic:row.profile_pic,
                    tags:[],
            };
        }
            reviewsData[reviewId].tags.push({
                id:row.review_relation_tag_id,
                tag_name:row.tag_name
            });
        });
     const formattedreviewesData = Object.values(reviewsData);

        return res.status(200).json({
            status: 'success',
            data: formattedreviewesData,
            message: 'Company details fetched successfully'
        });
    });
});
//-----------------------APP API END----------------------//

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
