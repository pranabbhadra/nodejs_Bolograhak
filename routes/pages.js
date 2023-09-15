const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../config');
var moment = require('moment');
const { error, log, Console } = require('console');
const async = require('async');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const crypto = require('crypto');

const comFunction = require('../common_function');
const comFunction2 = require('../common_function2');

const router = express.Router();
const publicPath = path.join(__dirname, '../public');


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
    let userId = '';
    if (currentUserData) {
        userId = currentUserData.user_id;
    }
    const [allRatingTags,globalPageMeta,latestReviews,AllReviewTags,AllReviewVoting] = await Promise.all([
        comFunction.getAllRatingTags(),
        comFunction2.getPageMetaValues('global'),
        comFunction2.getlatestReviews(20),
        comFunction2.getAllReviewTags(),
        comFunction2.getAllReviewVoting(),
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
                    //     AddressapiKey: process.env.ADDRESS_GOOGLE_API_Key,
                    //     globalPageMeta:globalPageMeta,
                    //     latestReviews: latestReviews,
                    //     AllReviewTags: AllReviewTags,
                    //    AllReviewVoting:AllReviewVoting
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
                        globalPageMeta:globalPageMeta,
                        latestReviews: latestReviews,
                        AllReviewTags: AllReviewTags,
                        AllReviewVoting:AllReviewVoting
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
                        globalPageMeta:globalPageMeta,
                        latestReviews: latestReviews,
                        AllReviewTags: AllReviewTags
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
        //console.log(userId);
        // Fetch all the required data asynchronously
        const [latestReviews, AllReviews, AllTrendingReviews, AllReviewTags, allRatingTags, globalPageMeta, homePageMeta,AllReviewVoting] = await Promise.all([
            comFunction2.getlatestReviews(20),
            comFunction2.getAllReviews(),
            comFunction2.getAllTrendingReviews(),
            comFunction2.getAllReviewTags(),
            comFunction.getAllRatingTags(),
            comFunction2.getPageMetaValues('global'),
            comFunction2.getPageMetaValues('home'),
            comFunction2.getAllReviewVoting(),
        ]);
        //console.log(getPageMetaValues);
        // res.json({
        //     menu_active_id: 'review',
        //     page_title: 'Customer Reviews',
        //     currentUserData,
        //     latestReviews: latestReviews,
        //     AllReviews: AllReviews,
        //     allRatingTags: allRatingTags,
        //     AllReviewTags: AllReviewTags,
        //     AllTrendingReviews: AllTrendingReviews,
        //     globalPageMeta:globalPageMeta,
        //     homePageMeta:homePageMeta
        // });
        res.render('front-end/review', {
            menu_active_id: 'review',
            page_title: 'Customer Reviews',
            currentUserData,
            latestReviews: latestReviews,
            AllReviews: AllReviews,
            allRatingTags: allRatingTags,
            AllReviewTags: AllReviewTags,
            AllTrendingReviews: AllTrendingReviews,
            globalPageMeta:globalPageMeta,
            homePageMeta:homePageMeta,
            AllReviewVoting:AllReviewVoting
        });
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
        // res.render('front-end/faq', {
        //     menu_active_id: 'faq',
        //     page_title: 'FAQ ',
        //     currentUserData,
        //     faqPageData,
        //     faqCategoriesData,
        //     faqItemsData,
        //     globalPageMeta:globalPageMeta
        // });
        res.json( {
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

router.get('/company/:id', checkCookieValue, async (req, res) => {
    const companyID = req.params.id;
    const [allRatingTags, CompanyInfo, companyReviewNumbers, getCompanyReviews, globalPageMeta, PremiumCompanyData] = await Promise.all([
        comFunction.getAllRatingTags(),
        comFunction.getCompany(companyID),
        comFunction.getCompanyReviewNumbers(companyID),
        comFunction.getCompanyReviews(companyID),
        comFunction2.getPageMetaValues('global'),
        comFunction2.getPremiumCompanyData(companyID),
    ]);
    let currentUserData = JSON.parse(req.userData);
    
    let cover_img = '';
    let youtube_iframe = '';
    let gallery_img = [];
    let products = [];
    let promotions = [];
    let facebook_url = '';
    let twitter_url = '';
    let instagram_url = '';
    let linkedin_url = '';
    let youtube_url = '';
    let support_data = {};

    if(typeof PremiumCompanyData !== 'undefined' ){
         cover_img = PremiumCompanyData.cover_img;
         youtube_iframe = PremiumCompanyData.youtube_iframe;
         gallery_img = JSON.parse(PremiumCompanyData.gallery_img);
         products = JSON.parse(PremiumCompanyData.products);
         promotions = JSON.parse(PremiumCompanyData.promotions);
         facebook_url = PremiumCompanyData.facebook_url;
         twitter_url = PremiumCompanyData.twitter_url;
         instagram_url = PremiumCompanyData.instagram_url;
         linkedin_url = PremiumCompanyData.linkedin_url;
         youtube_url = PremiumCompanyData.youtube_url;
         support_data = {support_email:PremiumCompanyData.support_email,	escalation_one:PremiumCompanyData.escalation_one, escalation_two:PremiumCompanyData.escalation_two, escalation_three:PremiumCompanyData.escalation_three}
        
    }

    if(CompanyInfo){
        if(CompanyInfo.paid_status == 'paid'){
            res.render('front-end/category-details-premium',
            {
                menu_active_id: 'company',
                page_title: 'Organization Details',
                currentUserData,
                allRatingTags,
                company:CompanyInfo,
                CompanyInfo,
                companyReviewNumbers,
                getCompanyReviews,
                globalPageMeta:globalPageMeta,
                cover_img:cover_img,
                gallery_img:gallery_img,
                youtube_iframe:youtube_iframe,
                products:products,
                promotions:promotions,
                facebook_url:facebook_url,
                twitter_url:twitter_url,
                instagram_url:instagram_url,
                linkedin_url:linkedin_url,
                youtube_url:youtube_url,
                support_data:support_data,
            });
        }else{
            res.render('front-end/company-details',
            {
                menu_active_id: 'company',
                page_title: 'Organization Details',
                currentUserData,
                allRatingTags,
                company:CompanyInfo,
                CompanyInfo,
                companyReviewNumbers,
                getCompanyReviews,
                globalPageMeta:globalPageMeta
            });
            // res.json(
            // {
            //     menu_active_id: 'company',
            //     page_title: 'Organization Details',
            //     currentUserData,
            //     allRatingTags,
            //     company:CompanyInfo,
            //     CompanyInfo,
            //     companyReviewNumbers,
            //     getCompanyReviews,
            //     globalPageMeta:globalPageMeta
            // });
        }
    }else{
        res.render('front-end/404', {
            menu_active_id: '404',
            page_title: '404',
            currentUserData,
            globalPageMeta:globalPageMeta
        });
    }

});

//-----------------------------------------------------------------//



// Middleware function to check if user is Claimed a Company or not
async function checkClientClaimedCompany(req, res, next) {
    res.locals.globalData = {
        BLOG_URL: process.env.BLOG_URL,
        MAIN_URL: process.env.MAIN_URL,
        // Add other variables as needed
    };    
   
    //const userId = UserJsonData.user_id;
    //try {
        
        if (req.cookies.user) {
            const encodedUserData = req.cookies.user;
            const UserJsonData = JSON.parse(encodedUserData);
            if(UserJsonData && UserJsonData.claimed_comp_id == req.params.compID ){
                next();
            }else{
                res.redirect('/logout');
            }
            
        } else {
            res.redirect('/');
        }
    // } catch (err) {
    //     console.error(err);
    //     res.status(500).send('An error occurred');
    // }
}
//Basic company profile dashboard Page 
router.get('/company-dashboard/:compID', checkClientClaimedCompany, async (req, res) => {
    
    const encodedUserData = req.cookies.user;
    const currentUserData = JSON.parse(encodedUserData);
    //let currentUserData = JSON.parse(req.userData);
    const userId = currentUserData.user_id;
    const companyId = req.params.compID;
    const [globalPageMeta, company, companyReviewNumbers, allRatingTags, allCompanyReviews, allCompanyReviewTags, PremiumCompanyData, reviewTagsCount, TotalReplied] = await Promise.all([
        comFunction2.getPageMetaValues('global'),
        comFunction.getCompany(companyId),
        comFunction.getCompanyReviewNumbers(companyId),
        comFunction.getAllRatingTags(),
        comFunction.getAllReviewsByCompanyID(companyId),
        comFunction2.getAllReviewTags(),
        comFunction2.getPremiumCompanyData(companyId),
        comFunction.reviewTagsCountByCompanyID(companyId),
        comFunction2.TotalReplied(userId),
    ]);
    //console.log('TotalReplied:', currentUserData.user_id);

    let facebook_url = '';
    let twitter_url = '';
    let instagram_url = '';
    let linkedin_url = '';
    let youtube_url = '';

    if(typeof PremiumCompanyData !== 'undefined' ){
            facebook_url = PremiumCompanyData.facebook_url;
            twitter_url = PremiumCompanyData.twitter_url;
            instagram_url = PremiumCompanyData.instagram_url;
            linkedin_url = PremiumCompanyData.linkedin_url;
            youtube_url = PremiumCompanyData.youtube_url;
    }

    const reviewTagsMap = {};
    allCompanyReviewTags.forEach(tag => {
        if (!reviewTagsMap[tag.review_id]) {
            reviewTagsMap[tag.review_id] = [];
        }
        reviewTagsMap[tag.review_id].push({ review_id: tag.review_id, tag_name: tag.tag_name });
    });
    // Merge allReviews with their associated tags
    const finalCompanyallReviews = allCompanyReviews.map(review => {
        return {
            ...review,
            Tags: reviewTagsMap[review.id] || []
        };
    }); 

    const xValues = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
    const reviewReatingChartArray = xValues.map(xValue => {
        const matchingItem = companyReviewNumbers.rewiew_rating_count.find(item => item.rating === xValue);
        const yValue = matchingItem ? matchingItem.cnt_rat : 0;
        return { x: xValue, y: yValue, color: '#F8A401' };
    });

    const companyPaidStatus = company.paid_status;
    //console.log(companyPaidStatus);
    if(companyPaidStatus=='free'){
        res.render('front-end/basic-company-profile-dashboard', 
        { 
            menu_active_id: 'company-dashboard', 
            page_title: 'Company Dashboard', 
            currentUserData, 
            globalPageMeta:globalPageMeta,
            company,
            companyReviewNumbers,
            allRatingTags,
            finalCompanyallReviews,
            reviewReatingChartArray,
            reviewTagsCount,
            TotalReplied:TotalReplied
        });
    }else{
        // res.json( 
        // { 
        //     company,
        //     companyReviewNumbers,
        //     allRatingTags,
        //     finalCompanyallReviews,
        //     reviewReatingChartArray,
        //     facebook_url:facebook_url,
        //     twitter_url:twitter_url,
        //     instagram_url:instagram_url,
        //     linkedin_url:linkedin_url,
        //     youtube_url:youtube_url,
        //     reviewTagsCount
        // });
        res.render('front-end/premium-company-profile-dashboard', 
        { 
            menu_active_id: 'company-dashboard', 
            page_title: 'Company Dashboard', 
            currentUserData, 
            globalPageMeta:globalPageMeta,
            company,
            companyReviewNumbers,
            allRatingTags,
            finalCompanyallReviews,
            reviewReatingChartArray,
            facebook_url:facebook_url,
            twitter_url:twitter_url,
            instagram_url:instagram_url,
            linkedin_url:linkedin_url,
            youtube_url:youtube_url,
            reviewTagsCount,
            TotalReplied:TotalReplied
        });

        // res.json(
        // { 
        //     menu_active_id: 'company-dashboard', 
        //     page_title: 'Company Dashboard', 
        //     currentUserData, 
        //     globalPageMeta:globalPageMeta,
        //     company,
        //     companyReviewNumbers,
        //     allRatingTags,
        //     finalCompanyallReviews,
        //     reviewReatingChartArray,
        //     facebook_url:facebook_url,
        //     twitter_url:twitter_url,
        //     instagram_url:instagram_url,
        //     linkedin_url:linkedin_url,
        //     youtube_url:youtube_url,
        //     reviewTagsCount,
        //     TotalReplied:TotalReplied
        // });
    }
});

//company dashboard management Page 
router.get('/company-profile-management/:compID', checkClientClaimedCompany, async (req, res) => {
    const encodedUserData = req.cookies.user;
    const currentUserData = JSON.parse(encodedUserData);
    const companyId = req.params.compID;

    const [globalPageMeta, company, PremiumCompanyData, companyReviewNumbers, getCompanyReviews, allRatingTags] = await Promise.all([
        comFunction2.getPageMetaValues('global'),
        comFunction.getCompany(companyId),
        comFunction2.getPremiumCompanyData(companyId),
        comFunction.getCompanyReviewNumbers(companyId),
        comFunction.getCompanyReviews(companyId),
        comFunction.getAllRatingTags(),
    ]);

    const companyPaidStatus = company.paid_status;
    if(companyPaidStatus=='free'){
        res.render('front-end/basic-company-profile-management', 
        { 
            menu_active_id: 'company-profile-management', 
            page_title: 'Profile Management', 
            currentUserData, 
            globalPageMeta:globalPageMeta,
            company:company,
            companyReviewNumbers,
            getCompanyReviews,
            allRatingTags
        }); 
    }else{
        let cover_img = '';
        let youtube_iframe = '';
        let gallery_img = [];
        let product = [];
        let promotions = [];
        let facebook_url = '';
        let twitter_url = '';
        let instagram_url = '';
        let linkedin_url = '';
        let youtube_url = '';
        let support_data = {};
    
        if(typeof PremiumCompanyData !== 'undefined' ){
             cover_img = PremiumCompanyData.cover_img;
             youtube_iframe = PremiumCompanyData.youtube_iframe;
             gallery_img = JSON.parse(PremiumCompanyData.gallery_img);
             product = JSON.parse(PremiumCompanyData.products);
             promotions = JSON.parse(PremiumCompanyData.promotions);
             facebook_url = PremiumCompanyData.facebook_url;
             twitter_url = PremiumCompanyData.twitter_url;
             instagram_url = PremiumCompanyData.instagram_url;
             linkedin_url = PremiumCompanyData.linkedin_url;
             youtube_url = PremiumCompanyData.youtube_url;
             support_data = {support_email:PremiumCompanyData.support_email,	escalation_one:PremiumCompanyData.escalation_one, escalation_two:PremiumCompanyData.escalation_two, escalation_three:PremiumCompanyData.escalation_three}
        }
        
        res.render('front-end/premium-company-profile-management', 
        { 
            menu_active_id: 'company-profile-management', 
            page_title: 'Profile Management', 
            currentUserData, 
            globalPageMeta:globalPageMeta,
            company:company,
            cover_img:cover_img,
            gallery_img:gallery_img,
            youtube_iframe:youtube_iframe,
            products:product,
            promotions:promotions,
            facebook_url:facebook_url,
            twitter_url:twitter_url,
            instagram_url:instagram_url,
            linkedin_url:linkedin_url,
            youtube_url:youtube_url,
            support_data:support_data,
            companyReviewNumbers,
            getCompanyReviews,
            allRatingTags
        });  
    }
});

//company dashboard Review listing Page 
router.get('/company-review-listing/:compID', checkClientClaimedCompany, async (req, res) => {
    const encodedUserData = req.cookies.user;
    const currentUserData = JSON.parse(encodedUserData);
    const companyId = req.params.compID;
    const [globalPageMeta, company, allReviews, allReviewTags, companyReviewNumbers, getCompanyReviews, allRatingTags, PremiumCompanyData] = await Promise.all([
        comFunction2.getPageMetaValues('global'),
        comFunction.getCompany(companyId),
        comFunction.getAllReviewsByCompanyID(companyId),
        comFunction2.getAllReviewTags(),
        comFunction.getCompanyReviewNumbers(companyId),
        comFunction.getCompanyReviews(companyId),
        comFunction.getAllRatingTags(),
        comFunction2.getPremiumCompanyData(companyId)
    ]);
    
    const reviewTagsMap = {};
    allReviewTags.forEach(tag => {
        if (!reviewTagsMap[tag.review_id]) {
        reviewTagsMap[tag.review_id] = [];
        }
        reviewTagsMap[tag.review_id].push({ review_id: tag.review_id, tag_name: tag.tag_name });
    });
    // Merge allReviews with their associated tags
    const finalallReviews = allReviews.map(review => {
        return {
            ...review,
            Tags: reviewTagsMap[review.id] || []
        };
    });
    const companyPaidStatus = company.paid_status;
    if(companyPaidStatus=='free'){
        res.render('front-end/basic-company-dashboard-review-listing',
        {
            menu_active_id: 'company-review-listing',
            page_title: 'Review Listing',
            currentUserData,
            globalPageMeta:globalPageMeta,
            company:company,
            finalallReviews,
            companyReviewNumbers,
            getCompanyReviews,
            allRatingTags
        });
    }else{
        let cover_img = '';
        let youtube_iframe = '';
        let gallery_img = [];
        let product = [];
        let promotions = [];
        let facebook_url = '';
        let twitter_url = '';
        let instagram_url = '';
        let linkedin_url = '';
        let youtube_url = '';
    
        if(typeof PremiumCompanyData !== 'undefined' ){
             cover_img = PremiumCompanyData.cover_img;
             youtube_iframe = PremiumCompanyData.youtube_iframe;
             gallery_img = JSON.parse(PremiumCompanyData.gallery_img);
             product = JSON.parse(PremiumCompanyData.products);
             promotions = JSON.parse(PremiumCompanyData.promotions);
             facebook_url = PremiumCompanyData.facebook_url;
             twitter_url = PremiumCompanyData.twitter_url;
             instagram_url = PremiumCompanyData.instagram_url;
             linkedin_url = PremiumCompanyData.linkedin_url;
             youtube_url = PremiumCompanyData.youtube_url;
        }
        res.render('front-end/premium-company-dashboard-review-listing',
        {
            menu_active_id: 'company-review-listing',
            page_title: 'Review Listing',
            currentUserData,
            globalPageMeta:globalPageMeta,
            company:company,
            finalallReviews,
            companyReviewNumbers,
            getCompanyReviews,
            allRatingTags,
            facebook_url:facebook_url,
            twitter_url:twitter_url,
            instagram_url:instagram_url,
            linkedin_url:linkedin_url,
            youtube_url:youtube_url
        });
    }
});

//company dashboard Review replay Page 
router.get('/company-dashboard-review-replay/:compID/:reviewID', checkClientClaimedCompany, async (req, res) => {
    const encodedUserData = req.cookies.user;
    const currentUserData = JSON.parse(encodedUserData);
    //let currentUserData = JSON.parse(req.userData);

    const companyId = req.params.compID;
    const reviewId = req.params.reviewID;
    const [globalPageMeta, company, companyReviewNumbers, allRatingTags, allCompanyReviews, allCompanyReviewTags, singleReviewData, singleReviewReplyData, PremiumCompanyData] = await Promise.all([
        comFunction2.getPageMetaValues('global'),
        comFunction.getCompany(companyId),
        comFunction.getCompanyReviewNumbers(companyId),
        comFunction.getAllRatingTags(),
        comFunction.getAllReviewsByCompanyID(companyId),
        comFunction2.getAllReviewTags(),
        comFunction.getReviewByID(reviewId),
        comFunction.getReviewReplyDataByID(reviewId),
        comFunction2.getPremiumCompanyData(companyId),
    ]);

    const reviewTagsMap = {};
    allCompanyReviewTags.forEach(tag => {
        if (!reviewTagsMap[tag.review_id]) {
            reviewTagsMap[tag.review_id] = [];
        }
        reviewTagsMap[tag.review_id].push({ review_id: tag.review_id, tag_name: tag.tag_name });
    });
    // Merge allReviews with their associated tags
    const finalsingleReviewData = singleReviewData.map(review => {
        return {
            ...review,
            Tags: reviewTagsMap[review.id] || []
        };
    });

    const companyPaidStatus = company.paid_status;
    //console.log(companyPaidStatus);
    if(companyPaidStatus=='free'){
        if(Array.isArray(singleReviewData) && singleReviewData.length>0){
            if(Array.isArray(singleReviewData) && singleReviewData[0].company_owner == currentUserData.user_id && singleReviewData[0].company_id == company.ID){
                res.render('front-end/basic-company-review-replay', 
                { 
                    menu_active_id: 'company-review-listing', 
                    page_title: 'Company Review Replay', 
                    currentUserData, 
                    globalPageMeta:globalPageMeta,
                    company,
                    companyReviewNumbers,
                    allRatingTags,
                    finalsingleReviewData,
                    singleReviewReplyData
                });
                // res.json(
                // { 
                //     menu_active_id: 'company-review-listing', 
                //     page_title: 'Company Review Replay', 
                //     currentUserData, 
                //     globalPageMeta:globalPageMeta,
                //     company,
                //     companyReviewNumbers,
                //     allRatingTags,
                //     finalsingleReviewData,
                //     singleReviewReplyData
                // });
            }else{
                res.redirect('/company-review-listing/'+company.ID);
            }
        }else{
            res.redirect('/company-review-listing/'+company.ID);
        }
    }else{
        let cover_img = '';
        let youtube_iframe = '';
        let gallery_img = [];
        let product = [];
        let promotions = [];
        let facebook_url = '';
        let twitter_url = '';
        let instagram_url = '';
        let linkedin_url = '';
        let youtube_url = '';
    
        if(typeof PremiumCompanyData !== 'undefined' ){
             cover_img = PremiumCompanyData.cover_img;
             youtube_iframe = PremiumCompanyData.youtube_iframe;
             gallery_img = JSON.parse(PremiumCompanyData.gallery_img);
             product = JSON.parse(PremiumCompanyData.products);
             promotions = JSON.parse(PremiumCompanyData.promotions);
             facebook_url = PremiumCompanyData.facebook_url;
             twitter_url = PremiumCompanyData.twitter_url;
             instagram_url = PremiumCompanyData.instagram_url;
             linkedin_url = PremiumCompanyData.linkedin_url;
             youtube_url = PremiumCompanyData.youtube_url;
        }
        if(Array.isArray(singleReviewData) && singleReviewData.length>0){
            if(Array.isArray(singleReviewData) && singleReviewData[0].company_owner == currentUserData.user_id && singleReviewData[0].company_id == company.ID){
                res.render('front-end/premium-company-review-replay', 
                { 
                    menu_active_id: 'company-review-listing', 
                    page_title: 'Company Review Replay', 
                    currentUserData, 
                    globalPageMeta:globalPageMeta,
                    company,
                    companyReviewNumbers,
                    allRatingTags,
                    finalsingleReviewData,
                    singleReviewReplyData,
                    facebook_url:facebook_url,
                    twitter_url:twitter_url,
                    instagram_url:instagram_url,
                    linkedin_url:linkedin_url,
                    youtube_url:youtube_url
                });
                // res.json( 
                // { 
                //     menu_active_id: 'company-review-listing', 
                //     page_title: 'Company Review Replay', 
                //     currentUserData, 
                //     globalPageMeta:globalPageMeta,
                //     company,
                //     companyReviewNumbers,
                //     allRatingTags,
                //     finalsingleReviewData,
                //     singleReviewReplyData,
                //     facebook_url:facebook_url,
                //     twitter_url:twitter_url,
                //     instagram_url:instagram_url,
                //     linkedin_url:linkedin_url,
                //     youtube_url:youtube_url
                // });
            }else{
                res.redirect('/company-review-listing/'+company.ID);
            }
        }else{
            res.redirect('/company-review-listing/'+company.ID);
        }
    }

});


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
// Middleware function to check if user is Administrator or not
async function checkLoggedInAdministrator(req, res, next) {
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
            if( UserJsonData.user_type_id==1){
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

router.get('/users', checkLoggedInAdministrator, (req, res) => {
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
        // res.json({
        //     menu_active_id: 'user',
        //     page_title: 'Edit User',
        //     currentUserData,
        //     user: user,
        //     userMeta: userMeta,
        //     countries: countries,
        //     userRoles: userRoles,
        //     states: states
        // });
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
        //console.log(company);
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
router.get('/add-rating-tag', checkLoggedInAdministrator, async (req, res) => {
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
        const [allReviews,AllReviewTags] = await Promise.all([
            comFunction.getAllReviews(),
            comFunction2.getAllReviewTags(),
        ]);
        //console.log(currentUserData);

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
            allReviews: allReviews,
            AllReviewTags:AllReviewTags
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
        const [reviewData, reviewTagData, allcompany] = await Promise.all([
            comFunction.getCustomerReviewData(review_Id),
            comFunction.getCustomerReviewTagRelationData(review_Id),
            comFunction.getAllCompany()
        ]);
        //console.log(reviewData);
       // Render the 'edit-user' EJS view and pass the data
        // res.json({
        //     reviewData: reviewData,
        //     reviewTagData: reviewTagData,
        //     allcompany      
        // });
        if(reviewData){
            res.render('edit-review', {
                menu_active_id: 'review',
                page_title: 'Edit Review',
                currentUserData,
                reviewData,
                reviewTagData: reviewTagData,
                allcompany            
            });
        }else{
            res.render('front-end/404', {
                menu_active_id: '404',
                page_title: '404',
                currentUserData,
                globalPageMeta:[]
            });
        }
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

//Edit Global Page Management
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
//-----------------------------------------------------------------//



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
        const [user, userMeta, globalPageMeta, AllCompaniesReviews] = await Promise.all([
            comFunction.getUser(userId),
            comFunction.getUserMeta(userId),
            comFunction2.getPageMetaValues('global'),
            comFunction2.getAllCompaniesReviews(userId),
        ]);

        // Render the 'edit-user' EJS view and pass the data
        res.render('front-end/myprofile', {
            menu_active_id: 'myprofile',
            page_title: 'My Profile',
            currentUserData,
            user: user,
            userMeta: userMeta,
            globalPageMeta:globalPageMeta,
            AllCompaniesReviews: AllCompaniesReviews
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
        const [user, userMeta, ReviewedCompanies, AllCompaniesReviews, AllReviewTags, allRatingTags, globalPageMeta,AllReviewVoting] = await Promise.all([
            comFunction.getUser(userId),
            comFunction.getUserMeta(userId),
            comFunction2.getReviewedCompanies(userId),
            comFunction2.getAllCompaniesReviews(userId),
            comFunction2.getAllReviewTags(),
            comFunction.getAllRatingTags(),
            comFunction2.getPageMetaValues('global'),
            comFunction2.getAllReviewVoting(),
        ]);
        //console.log(userMeta);
        // Render the 'edit-user' EJS view and pass the data
        // res.json({
        //     menu_active_id: 'profile-dashboard',
        //     page_title: 'My Dashboard',
        //     currentUserData,
        //     user: user,
        //     userMeta: userMeta,
        //     ReviewedCompanies: ReviewedCompanies,
        //     AllCompaniesReviews: AllCompaniesReviews,
        //     allRatingTags:allRatingTags,
        //     AllReviewTags:AllReviewTags,
        //     globalPageMeta:globalPageMeta
        // });
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
            globalPageMeta:globalPageMeta,
            AllReviewVoting:AllReviewVoting
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
        const [ AllCompaniesReviews, AllReviewTags, allRatingTags,globalPageMeta, AllReviewVoting] = await Promise.all([
            comFunction2.getAllCompaniesReviews(userId),
            comFunction2.getAllReviewTags(),
            comFunction.getAllRatingTags(),
            comFunction2.getPageMetaValues('global'),
            comFunction2.getAllReviewVoting(),
        ]);
        //console.log(AllReviewTags);
        //Render the 'edit-user' EJS view and pass the data
        // res.json( {
        //     menu_active_id: 'profile-dashboard',
        //     page_title: 'My Reviews',
        //     currentUserData,
        //     AllCompaniesReviews: AllCompaniesReviews,
        //     allRatingTags:allRatingTags,
        //     AllReviewTags:AllReviewTags,
        //     globalPageMeta:globalPageMeta,
        //     AllReviewVoting:AllReviewVoting
        // });
        res.render('front-end/user-all-reviews', {
            menu_active_id: 'profile-dashboard',
            page_title: 'My Reviews',
            currentUserData,
            AllCompaniesReviews: AllCompaniesReviews,
            allRatingTags:allRatingTags,
            AllReviewTags:AllReviewTags,
            globalPageMeta:globalPageMeta,
            AllReviewVoting:AllReviewVoting
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
        const [user, userMeta, countries, states, globalPageMeta, AllCompaniesReviews] = await Promise.all([
            comFunction.getUser(userId),
            comFunction.getUserMeta(userId),
            comFunction.getCountries(),
            comFunction.getStatesByUserID(userId),
            comFunction2.getPageMetaValues('global'),
            comFunction2.getAllCompaniesReviews(userId),
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
            globalPageMeta:globalPageMeta,
            AllCompaniesReviews: AllCompaniesReviews
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

//FrontEnd Change Password page
router.get('/change-password', checkFrontEndLoggedIn, async (req, res) => {  
    
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const userId = currentUserData.user_id;
        //console.log('editUserID: ', currentUserData);

        // Fetch all the required data asynchronously
        const [globalPageMeta ] = await Promise.all([
            comFunction2.getPageMetaValues('global'),
        ]);

        // Render the 'edit-user' EJS view and pass the data
        res.render('front-end/change-password', {
            menu_active_id: 'change-password',
            page_title: 'Change Password',
            currentUserData,
            globalPageMeta:globalPageMeta
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

//FrontEnd Edit Review page
router.get('/edit-user-review/:reviewId', checkFrontEndLoggedIn, async (req, res) => {  
    
    try {
        const encodedUserData = req.cookies.user;
        const currentUserData = JSON.parse(encodedUserData);
        const userId = currentUserData.user_id;
        const reviewId = req.params.reviewId;
        //console.log('editUserID: ', currentUserData);
       
        const [allRatingTags,  reviewDataById, AllReviewTags, globalPageMeta ] = await Promise.all([
            comFunction.getAllRatingTags(),
            comFunction2.reviewDataById(reviewId, userId),
            comFunction2.getAllReviewTags(),
            comFunction2.getPageMetaValues('global'),
        ]);

        // Create a mapping of review_id to tags
            const reviewTagsMap = {};

            AllReviewTags.forEach((tag) => {
            const { review_id, tag_name } = tag;
            if (!reviewTagsMap[review_id]) {
                reviewTagsMap[review_id] = [];
            }
            reviewTagsMap[review_id].push(tag_name);
            });

            // Map the tags to reviewDataById by review_id
            const reviewDataWithTags = reviewDataById.map((review) => {
            var tags = reviewTagsMap[review.id] || [];
            return {
                ...review,
                tags,
            };
            });

        //console.log(reviewDataWithTags)
        // Render the 'edit-user' EJS view and pass the data
        
        //  res.json({
        //      menu_active_id: 'edit-review',
        //     page_title: 'Edit Review',
        //     currentUserData,
        //     allRatingTags:allRatingTags,
        //     globalPageMeta:globalPageMeta,
        //     reviewDataById:reviewDataWithTags[0]
        //  });
        if( reviewDataById.length>0 ){
            res.render('front-end/edit-user-review', {
                menu_active_id: 'edit-review',
                page_title: 'Edit Review',
                currentUserData,
                allRatingTags:allRatingTags,
                globalPageMeta:globalPageMeta,
                reviewDataById:reviewDataWithTags[0]
             });
        }else{
            res.redirect('/profile-dashboard');
        }
         
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});
//-----------------------------------------------------------------//



router.get('/reset-password/:email', checkCookieValue, async (req, res) => {

    try {
            let currentUserData = JSON.parse(req.userData);
            
            const encryptEmail = req.params.email;
            //console.log(encryptEmail);
            const passphrase = process.env.ENCRYPT_DECRYPT_SECRET;
             const decipher = crypto.createDecipher('aes-256-cbc', passphrase);
             let decrypted = decipher.update(encryptEmail, 'hex', 'utf8');
             decrypted += decipher.final('utf8');
             const decrypted_email = decrypted;
             //console.log('Decrypted:', decrypted);
            const [globalPageMeta] = await Promise.all([
                comFunction2.getPageMetaValues('global'),
            ]);

        res.render('front-end/reset-password', {
            menu_active_id: 'reset-password',
            page_title: 'Reset Password',
            currentUserData,
            globalPageMeta:globalPageMeta,
            decrypted_email,
            error_message:''
        });
    } catch (err) {
        console.error(err);
        let currentUserData = JSON.parse(req.userData);
            const [globalPageMeta] = await Promise.all([
                comFunction2.getPageMetaValues('global'),
            ]);
        //res.status(500).send('An error occurred');
        res.render('front-end/reset-password', {
            menu_active_id: 'reset-password',
            page_title: 'Reset Password',
            currentUserData,
            globalPageMeta:globalPageMeta,
            error_message:'urlNotCorrect'
        });
    }
    
    //res.sendFile(`${publicPath}/nopage.html`)
});

router.get('/logout', (req, res) => {
    const encodedUserData = req.cookies.user;
    const currentUserData = JSON.parse(encodedUserData);
    //console.log(currentUserData);

    //--WP Logout--//
    (async () => {
        try {
            const wpUserLoginData = {
                email: currentUserData.email,
                user_type: currentUserData.user_type_id
            };
            const response = await axios.post(process.env.BLOG_API_ENDPOINT + '/force-logout', wpUserLoginData);
            //console.log(response);
            const wp_user_data = response.data;
            //console.log(wp_user_data);
            if(wp_user_data.user_nonce!=''){
                if (currentUserData.user_type_id == 2) {
                    res.clearCookie('user');
                    //res.redirect('/');
                    res.redirect(process.env.BLOG_URL+'wp-login.php?action=logout&redirect_to='+process.env.MAIN_URL+'&_wpnonce='+wp_user_data.user_nonce);
                } else {
                    res.clearCookie('user');
                    res.redirect(process.env.BLOG_URL+'wp-login.php?action=logout&redirect_to='+process.env.MAIN_URL+'admin-login&_wpnonce='+wp_user_data.user_nonce);
                }
            }else{
                //Logout Only From Node.
                if (currentUserData.user_type_id == 2) {
                    res.clearCookie('user');
                    res.redirect('/');
                } else {
                    res.clearCookie('user');
                    res.redirect('/admin-login');
                }                
            }
        } catch (error) {
            console.log('Error: ', error);
            // return res.send(
            //     {
            //         status: 'err',
            //         data: '',
            //         message: ''
            //     }
            // )
        }
    })();

});

//-- 404---//
router.get('*',checkCookieValue, async (req, res) => {
    let currentUserData = JSON.parse(req.userData);
    const [globalPageMeta] = await Promise.all([
        comFunction2.getPageMetaValues('global'),
    ]);
    try {
        res.render('front-end/404', {
            menu_active_id: '404',
            page_title: '404',
            currentUserData,
            globalPageMeta:globalPageMeta
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
    //res.sendFile(`${publicPath}/nopage.html`)
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