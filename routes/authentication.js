const express = require('express');
const multer = require('multer');
const authenController = require('../controllers/authentication');
const jwt = require('jsonwebtoken');
const jwtsecretKey = 'grahak-secret-key';
const db = require('../config');
const comFunction = require('../common_function_api');
const comFunction2 = require('../common_function2');
const commonFunction = require('../common_function');

const router = express.Router();
//const publicPath = path.join(__dirname,'../public');



// Set up multer storage for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const originalname = file.originalname;
        const sanitizedFilename = originalname.replace(/[^a-zA-Z0-9\-\_\.]/g, ''); // Remove symbols and spaces
        const filename = Date.now() + '-' + sanitizedFilename;
        cb(null, filename);
        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // cb(null, file.fieldname + '-' + uniqueSuffix);
    }
});
// Create multer instance
const upload = multer({ storage: storage });

router.post('/register',upload.single('profile_pic') ,authenController.register);
router.post('/login', authenController.login);
router.put('/edituser', verifyToken, upload.single('profile_pic') ,authenController.edituser);


router.post('/createcategories',verifyToken, upload.single('c_image'),authenController.createcategories);
router.post('/createcompany',verifyToken, upload.single('logo') ,authenController.createcompany);
router.put('/editcompany',verifyToken, upload.single('logo') ,authenController.editcompany);
router.post('/createcompanylocation',verifyToken, authenController.createcompanylocation);
router.post('/submitReview',verifyToken, authenController.submitReview);
//forget password
router.post('/forgotPassword', authenController.forgotPassword);
router.post('/resetPassword',  authenController.resetPassword);
router.post('/changePassword', verifyToken, authenController.changePassword);
//==========================================================================
//Contact us Feedback Email
router.post('/contact-us-email', verifyToken, authenController.contactUsEmail);
//==========================================================================
router.post('/refresh-token',verifyToken, authenController.refreshToken);

//----------Get API Start----------------//
//get user details
router.get('/getUserDetails/:user_id', verifyToken, async (req, res) => {
    const authenticatedUserId = parseInt(req.user.user_id);
    console.log('authenticatedUserId: ', authenticatedUserId);
    
    const ApiuserId = parseInt(req.params.user_id); 
    console.log('req.params.user_id: ', ApiuserId);
    
    const user_ID = req.params.user_id; 
    console.log("user_id from request:", user_ID); 
    
    if (ApiuserId !== authenticatedUserId) {
        return res.status(403).json({
            status: 'error',
            message: 'Access denied: You are not authorized to update this user.',
        });
    }
    const [userBasicInfo, userMetaInfo, userCompany, userReview, userReviewCompany, allCompanyReviewTags] = await Promise.all([
        comFunction.getUser(user_ID),
        comFunction.getUserMeta(user_ID),
        comFunction.getUserCompany(user_ID),
        comFunction.getUserReview(user_ID),
        comFunction.getuserReviewCompany(user_ID),
        comFunction2.getAllReviewTags(),
    ]);
    if(Object.keys(userBasicInfo).length > 0){
        delete userBasicInfo.password;
        let mergedData = {};
        if(Object.keys(userMetaInfo).length > 0){
            mergedData = {
                ...userBasicInfo,
                ...userMetaInfo
            };
        }else{
            mergedData = {
                ...userBasicInfo
            }
        }

        //if(userReview.length > 0){
            const reviewTagsMap = {};
            allCompanyReviewTags.forEach(tag => {
                if (!reviewTagsMap[tag.review_id]) {
                    reviewTagsMap[tag.review_id] = [];
                }
                reviewTagsMap[tag.review_id].push({ review_id: tag.review_id, tag_name: tag.tag_name });
            });
            // Merge allReviews with their associated tags
            const finalCompanyallReviews = userReview.map(review => {
                return {
                    ...review,
                    Tags: reviewTagsMap[review.id] || []
                };
            });
        //}

        return res.status(200).json({
            status: 'success',
            data: {
                ...mergedData,
                userCompany,
                finalCompanyallReviews,
                userReviewCompany,
            },
            message: 'user data successfully recived'
        });
    }else{
        return res.status(404).json({
            status: 'error',
            data: '',
            message: 'Id not exist'
        });
    }
});
//getComapniesDetails by ID
router.get('/getComapniesDetails/:ID', verifyToken, async (req, res) => {
    const companyId = req.params.ID; 
    console.log("companyId from request:", companyId); 
    try {
        const [company, companyreviews, allCompanyReviewTags, userReview,copmanyratings] = await Promise.all([
          comFunction.getCompany(companyId),
          comFunction.getCompanyReviews(companyId),
          comFunction2.getAllReviewTags(),
          comFunction.getUserReview(),
          comFunction.getCompanyRatings(companyId),
        ]);

        if (company) {
            const reviewTagsMap = {};
            allCompanyReviewTags.forEach(tag => {
                if (!reviewTagsMap[tag.review_id]) {
                    reviewTagsMap[tag.review_id] = [];
                }
                reviewTagsMap[tag.review_id].push({ review_id: tag.review_id, tag_name: tag.tag_name });
            });

            const finalCompanyallReviews = companyreviews.map(review => {
                return {
                    ...review,
                    Tags: reviewTagsMap[review.id] || []
                };
            });

            return res.status(200).json({
                status: 'success',
                data: {
                    company,
                    companyreviews: finalCompanyallReviews,
                    copmanyratings
                    //allCompanyReviewTags
                },
                message: 'company data successfully received'
            });
        } else {
            return res.status(404).json({
                status: 'error',
                data: '',
                message: 'Company not found'
            });
        }
    } catch (error) {
        console.error("An error occurred:", error);
    }
});

//get All user details
router.get('/getAllUsersDetails', verifyToken, async (req, res) => {
    const authenticatedUserId = parseInt(req.user.user_id);
    console.log('authenticatedUserId: ', authenticatedUserId);

    const ApiuserId = parseInt(req.params.user_id); 
    console.log('req.params.user_id: ', ApiuserId); 
    
    const user_ID = req.params.user_id; 
    console.log("user_id from request:", user_ID); 
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

//Search Company By Keyword
router.get('/search-company/:keyword', verifyToken, authenController.searchCompany);

router.get('/getAllCompaniesDetails', verifyToken, async (req, res) => {
    const query = `SELECT c.ID, c.user_created_by, c.logo, c.company_name, c.about_company, c.comp_phone, c.comp_email, c.status, c.trending, c.main_address, c.main_address_pin_code, COUNT(r.id) as review_count, AVG(r.rating) as average_rating,
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
                    ID: row.ID,
                    company_name: row.company_name,
                    review_count: row.review_count,
                    average_rating: row.average_rating,
                    user_created_by:row.user_created_by,
                    logo:row.logo,
                    comp_phone:row.comp_phone,
                    comp_email:row.comp_email,
                    about_company:row.about_company,
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


//getAllRatingTags
router.get('/getAllRatingTags', verifyToken, async (req, res) => {
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
router.get('/getcompanyreviewlisting/:company_id', verifyToken, (req, res) => {
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
        res.status(500).json({ error: 'Internal server error',error });
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
router.get('/getuserreviewlisting/:user_id', verifyToken, (req, res) => {
    const authenticatedUserId = parseInt(req.user.user_id);
    console.log('authenticatedUserId: ', authenticatedUserId);
    
    const ApiuserId = parseInt(req.params.user_id); 
    console.log('req.params.user_id: ', ApiuserId);
    
    const user_ID = req.params.user_id; 
    console.log("user_id from request:", user_ID); 
    
    if (ApiuserId !== authenticatedUserId) {
        return res.status(403).json({
            status: 'error',
            message: 'Access denied: You are not authorized to update this user.',
        });
    }
    const userId = req.params.user_id;
  
    const userQuery = `
      SELECT
        u.user_id,
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
        r.rejecting_reason,
        r.parent_review_id,
        r.company_location_id,
        MAX(r.created_at) AS latest_review_date,
        r.created_at AS review_created_at,
        co.ID AS company_id,
        co.company_name,
        co.logo AS company_logo,
        co.trending AS company_trending,
        cl.address AS company_location,
        cl.country AS company_location_country,
        cl.state AS company_location_state,
        cl.city AS company_location_city,
        cl.zip AS company_location_zip,
        cl.status AS company_location_status,
        ucm.profile_pic AS customer_profile_pic,
        GROUP_CONCAT(tr.id) AS tag_ids,
        GROUP_CONCAT(tr.tag_name) AS tag_names
    FROM
        reviews r
    JOIN
        users u ON r.customer_id = u.user_id
    JOIN
        company co ON r.company_id = co.ID
    LEFT JOIN
        user_customer_meta ucm ON u.user_id = ucm.user_id
    LEFT JOIN
        review_tag_relation tr ON r.id = tr.review_id
    LEFT JOIN
        company_location cl ON co.ID = cl.company_id
    WHERE
        u.user_id = ? AND r.review_status = 1
    GROUP BY
        r.id, co.ID;
    `;
    

db.query(userQuery, [userId], (error, userResult) => {
    if (error) {
      console.error('Error executing user query:', error);
      return res.status(500).json({ error: 'Internal server error' });
    } else if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    } else {
      db.query(reviewsQuery, [userId], (error, reviewsResult) => {
        if (error) {
          console.error('Error executing reviews query:', error);
          return res.status(500).json({ error: 'Internal server error' });
        } else  {
            const userInfo = userResult[0];
            const reviews = reviewsResult.map(review => ({
                id: review.review_id,
                company_id: review.company_id,
                company_name: review.company_name,
                company_location_id:review.company_location_id,
                logo: review.company_logo,
                trending: review.company_trending,
                company_location: {
                    address: review.company_location,
                    country: review.company_location_country,
                    state: review.company_location_state,
                    city: review.company_location_city,
                    zip: review.company_location_zip,
                    status: review.company_location_status,
                },
                review_title: review.review_title,
                review_content: review.review_content,
                user_privacy: review.user_privacy,
                review_status: review.review_status,
                rejecting_reason: review.rejecting_reason,
                parent_review_id:review.parent_review_id,
                latest_review_date: review.latest_review_date,
                tags: review.tag_ids
                    ? review.tag_ids.split(',').map((tagId, index) => ({
                        id: parseInt(tagId),
                        tag_name: review.tag_names.split(',')[index]
                    }))
                    : []
            }));
            const reviewCount = reviews.length; 
            const output = {
                user_id: userInfo.user_id,
                first_name: userInfo.first_name,
                last_name: userInfo.last_name,
                email: userInfo.email,
                profile_pic: userInfo.profile_pic,
                reviews: reviews,
                review_count: reviewCount
            };

            res.status(200).json(output);
        }
      });
    }
});
});


//reviewslistofallcompaniesbyuser
router.get('/reviewslistofallcompaniesbyuser/:user_id', verifyToken, (req, res) => {
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

//review listing
  
router.get('/getreviewlisting', verifyToken, async (req, res) => {
    try {
      const [
        allreviews,
        allCompanyReviewTags,
        getAllRatingTags,
        getReviewRatingData,
        getCustomerReviewData,
        getUserReview,
        latestReviews,
        TrendingReviews
      ] = await Promise.all([
        comFunction.getAllReviews(),
        comFunction2.getAllReviewTags(),
        comFunction.getAllRatingTags(),
        comFunction.getReviewRatingData(),
        comFunction.getCustomerReviewData(),
        comFunction.getUserReview(),
        comFunction.getLatestReview(),
        comFunction.getTrendingReviews()   
      ]);
  
  
      let mergedData = {};
      if (allreviews.length > 0) {
        const reviewTagsMap = {};
        allCompanyReviewTags.forEach(tag => {
          if (!reviewTagsMap[tag.review_id]) {
            reviewTagsMap[tag.review_id] = [];
          }
          reviewTagsMap[tag.review_id].push({ review_id: tag.review_id, tag_name: tag.tag_name });
        });
  
        const all = allreviews.map(review => {
          return {
            ...review,
            Tags: reviewTagsMap[review.id] || []
          };
        });
  
        if (latestReviews.length > 0) {
            const reviewTagsMap = {};
            allCompanyReviewTags.forEach(tag => {
                if (!reviewTagsMap[tag.review_id]) {
                  reviewTagsMap[tag.review_id] = [];
                }
                reviewTagsMap[tag.review_id].push({ review_id: tag.review_id, tag_name: tag.tag_name });
              });
        
              const latest_reviews = latestReviews.map(review => {
                return {
                  ...review,
                  Tags: reviewTagsMap[review.id] || []
                };
              });
            
        if (TrendingReviews.length > 0) {
            const reviewTagsMap = {};
            allCompanyReviewTags.forEach(tag => {
                if (!reviewTagsMap[tag.review_id]) {
                    reviewTagsMap[tag.review_id] = [];
                }
                reviewTagsMap[tag.review_id].push({ review_id: tag.review_id, tag_name: tag.tag_name });
                });
            
                const trending_reviews = TrendingReviews.map(review => {
                return {
                    ...review,
                    Tags: reviewTagsMap[review.id] || []
                };
            });
  
        return res.status(200).json({
          status: 'success',
          data: {
            //finalCompanyallReviews,
            all,
            latest_reviews,
            trending_reviews,
            //allCompanyReviewTags,
          },
          message: 'review data successfully received'
        });
      }
    }
    }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  });
  
router.get('/getCountries',verifyToken,async(req,res)=>{
    try{
        const[allcountries]=await Promise.all([
            comFunction.getCountries()
        ]);
        console.log(allcountries);
        if(allcountries.length>0){
            return res.status(200).json({
                status:'success',
                data:{
                    allcountries,
                },
                message:'country data successfully received'
            })
        }
    }
    catch(error){
        (error);
    }
})

router.get('/getstates/:country_id', verifyToken, async (req, res) => {
    try {
        const countryID = req.params.country_id; 
        const [allcountries, allstates] = await Promise.all([
            comFunction.getCountries(),
            comFunction.getStates(countryID)
        ]);

        if (allstates.length > 0) {
            return res.status(200).json({
                status: 'success',
                data: {
                    states: allstates, 
                },
                message: 'states data successfully received'
            });
        } else {
            return res.status(404).json({
                status: 'error',
                data: '',
                message: 'No states found for the given country ID'
            });
        }
    } catch (error) {
        console.error("An error occurred:", error);
        // Handle the error appropriately, e.g., sending an error response
    }
});

//===============================================================================
// Api for home page content
router.get('/app-home',  verifyToken,  async (req, res) => {
    try {
        const [latestReviews,AllReviewTags] = await Promise.all([
            comFunction2.getlatestReviews(20),
            comFunction2.getAllReviewTags()
        ]);
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

                if (latestReviews.length > 0) {
                    const reviewTagsMap = {};
                    AllReviewTags.forEach(tag => {
                        if (!reviewTagsMap[tag.review_id]) {
                          reviewTagsMap[tag.review_id] = [];
                        }
                        reviewTagsMap[tag.review_id].push({ review_id: tag.review_id, tag_name: tag.tag_name });
                    });
                
                    var latest_reviews = latestReviews.map(review => {
                        return {
                            ...review,
                            Tags: reviewTagsMap[review.id] || []
                        };
                    });
                }

                const featured_sql = `SELECT featured_companies.id,featured_companies.company_id,featured_companies.short_desc,featured_companies.link,company.logo,company.company_name FROM featured_companies 
                        JOIN company ON featured_companies.company_id = company.ID 
                        WHERE featured_companies.status = 'active' 
                        ORDER BY featured_companies.ordering ASC `;
                db.query(featured_sql, (featured_err, featured_result) => {
                    var featured_comps = featured_result;
                    return res.status(200).json({
                        status: 'success',
                        data: {
                            meta_values_array:meta_values_array,
                            featured_comps:featured_comps,
                            latestReviews:latest_reviews,
                        },
                        message: 'Home data successfully received'
                    });
                })

            })

        })
    } catch (error) {
        console.error("An error occurred:", error);
        // Handle the error appropriately, e.g., sending an error response
    }
});

// Api for home page customer-rights content
router.get('/app-home-customer-rights',  verifyToken,  async (req, res) => {
    try {
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
                    if(item.page_meta_key == 'app_cus_right_content' || item.page_meta_key == 'app_cus_right_points'|| item.page_meta_key == 'app_cus_right_img') {
                        meta_values_array[item.page_meta_key] = item.page_meta_value;
                    }
                })
                return res.status(200).json({
                    status: 'success',
                    data: {
                        meta_values_array:meta_values_array,
                    },
                    message: 'Home data successfully received'
                });
            })

        })
    } catch (error) {
        console.error("An error occurred:", error);
        // Handle the error appropriately, e.g., sending an error response
    }
});

// Api for home page Organization Responsibility content
router.get('/app-home-org-responsibility',  verifyToken,  async (req, res) => {
    try {
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
                    if(item.page_meta_key == 'app_org_responsibility_content' || item.page_meta_key == 'app_org_responsibility_point'|| item.page_meta_key == 'app_org_responsibility_img') {
                        meta_values_array[item.page_meta_key] = item.page_meta_value;
                    }
                })
                return res.status(200).json({
                    status: 'success',
                    data: {
                        meta_values_array:meta_values_array,
                    },
                    message: 'Home data successfully received'
                });
            })

        })
    } catch (error) {
        console.error("An error occurred:", error);
        // Handle the error appropriately, e.g., sending an error response
    }
});

// Api for home page About Us content
router.get('/app-home-about-us',  verifyToken,  async (req, res) => {
    try {
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
                    if(item.page_meta_key == 'app_about_us_content_1' || item.page_meta_key == 'app_about_us_content_2' || item.page_meta_key == 'app_about_us_button_text') {
                        meta_values_array[item.page_meta_key] = item.page_meta_value;
                    }
                })
                return res.status(200).json({
                    status: 'success',
                    data: {
                        meta_values_array:meta_values_array,
                    },
                    message: 'Home data successfully received'
                });
            })

        })
    } catch (error) {
        console.error("An error occurred:", error);
        // Handle the error appropriately, e.g., sending an error response
    }
});

// Api for business page content
router.get('/app-business', verifyToken, async (req, res) => {
    try {
        const sql = `SELECT * FROM page_info where secret_Key = 'business' `;
        db.query(sql, (err, results, fields) => {
            if (err) throw err;
            const common = results[0];
            const meta_sql = `SELECT * FROM page_meta where page_id = ${common.id}`;
            db.query(meta_sql, async (meta_err, _meta_result) => {
                if (meta_err) throw meta_err;

                const meta_values = _meta_result;
                let meta_values_array = {};
                console.log(meta_values);
                await meta_values.forEach((item) => {
                    if(item.page_meta_key == 'app_bannner_content_title' || item.page_meta_key == 'app_bannner_content_1' || item.page_meta_key == 'app_bannner_content_2'|| item.page_meta_key == 'app_advantage_points' || item.page_meta_key == 'app_dont_forget_content_1_title'|| item.page_meta_key == 'app_dont_forget_content_1' || item.page_meta_key == 'app_dont_forget_content_2_title'|| item.page_meta_key == 'app_dont_forget_content_2' || item.page_meta_key == 'bottom_content'|| item.page_meta_key == 'app_banner_img_1' || item.page_meta_key == 'app_banner_img_2') {
                        meta_values_array[item.page_meta_key] = item.page_meta_value;
                    }
                })

                const UpcomingBusinessFeature = await comFunction2.getUpcomingBusinessFeature();
                const BusinessFeature = await comFunction2.getBusinessFeature();
                //console.log(meta_values_array);
                return res.status(200).json({
                    status: 'success',
                    data: {
                        meta_values_array:meta_values_array,
                        UpcomingBusinessFeature:UpcomingBusinessFeature,
                        BusinessFeature:BusinessFeature,
                    },
                    message: 'Business data successfully received'
                });
            })

        })

    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

// Api for about us page content
router.get('/app-about-us', verifyToken, async (req, res) => {
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
                //console.log(meta_values);
                await meta_values.forEach((item) => {
                    if(item.page_meta_key == 'app_banner_content_1' || item.page_meta_key == 'app_banner_content_2' || item.page_meta_key == 'app_platform_content_1'|| item.page_meta_key == 'app_platform_content_2' || item.page_meta_key == 'app_banner_img_1'|| item.page_meta_key == 'app_banner_img_2' || item.page_meta_key == 'mission_title'|| item.page_meta_key == 'mission_content') {
                        meta_values_array[item.page_meta_key] = item.page_meta_value;
                    }
                })

                return res.status(200).json({
                    status: 'success',
                    data: {
                        meta_values_array:meta_values_array,
                    },
                    message: 'About Us data successfully received'
                });
            })

        })

    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

// Api for fAQ page content
router.get('/app-faq',verifyToken, async (req, res) => {
    try {
        const [faqPageData,faqCategoriesData,faqItemsData] = await Promise.all([
            comFunction2.getFaqPage(),
            comFunction2.getFaqCategories(),
            comFunction2.getFaqItems(),
        ]);
        
        // Create an object to store questions and answers by category
        const faqDataByCategory = {};

        // Iterate through the categories and initialize them in the object
        faqCategoriesData.forEach(category => {
            faqDataByCategory[category.id] = {
                category: category.category,
                faqItems: []
            };
        });

        // Populate the object with questions and answers by category
        faqItemsData.forEach(faqItem => {
            if (faqDataByCategory[faqItem.category_id]) {
                faqDataByCategory[faqItem.category_id].faqItems.push({
                    id: faqItem.id,
                    question: faqItem.question,
                    answer: faqItem.answer
                });
            }
        });

        // Convert the object to an array
        const faqDataArray = Object.values(faqDataByCategory);

        console.log(faqDataArray);
        return res.status(200).json({
            status: 'success',
            data: {
                faqPageContent:faqPageData,
                faqDataArray:faqDataArray
            },
            message: 'FAQ data successfully received'
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});



//================================================================================

function verifyToken(req, res, next){
    let token = req.headers['authorization'];
    if(token){
        token = token.split(' ')[1];
        console.log("Received token:", token);
        jwt.verify(token, jwtsecretKey, (err, valid) => {
            if(err){
                console.error("Token verification error:", err);
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid token',
                });
            } else {
                req.user = valid; 
                console.log("user ccc",req.user) //to store user information
                next();
            }
        })
    } else {
        return res.status(403).json({
            status: 'error',
            message: 'Missing header token',
        });
    }
}



module.exports = router;





