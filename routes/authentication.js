const express = require('express');
const multer = require('multer');
const authenController = require('../controllers/authentication');
const jwt = require('jsonwebtoken');
const jwtsecretKey = 'grahak-secret-key';
const db = require('../config');
const comFunction = require('../common_function_api');
const comFunction2 = require('../common_function2');

const router = express.Router();
//const publicPath = path.join(__dirname,'../public');



// Set up multer storage for file upload
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

router.post('/register',upload.single('profile_pic') ,authenController.register);
router.post('/login', authenController.login);
router.put('/edituser', verifyToken, upload.single('profile_pic') ,authenController.edituser);
router.post('/createcategories',verifyToken, upload.single('c_image'),authenController.createcategories);
router.post('/createcompany',verifyToken, upload.single('logo') ,authenController.createcompany);
router.put('/editcompany',verifyToken, upload.single('logo') ,authenController.editcompany);
router.post('/createcompanylocation',verifyToken, authenController.createcompanylocation);
router.post('/submitReview',verifyToken, authenController.submitReview);

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

//getComapniesDetails by ID
router.get('/getComapniesDetails/:ID', verifyToken, async (req, res) => {
    const { ID } = req.params;
    const query = `
    SELECT
    c.*,
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
    c.about_company,
    c.trending,
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
    l.zip

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
            about_company:results[0].about_company,
            comp_phone: results[0].comp_phone,
            comp_email: results[0].comp_email,
            comp_registration_id: results[0].comp_registration_id,
            trending:results[0].trending,
            status: results[0].status,
            created_date: results[0].created_date,
            updated_date: results[0].updated_date,
            average_rating: results[0].average_rating,
            review_count: results[0].review_count,
            rating_counts: results[0].rating_count, 
            first_name: results[0].first_name, 
            last_name: results[0].last_name,
            email: results[0].email,
            profile_pic: results[0].profile_pic,
            locations: results[0].location,
            location_id:results[0].location_id,
            main_address:results[0].main_address
        };
       
        const reviewsQuery = `
        SELECT
            r.id as review_id,
            r.review_status,
            r.review_title,
            r.review_content,
            r.user_privacy,
            tr.id as tag_id,
            GROUP_CONCAT(tr.tag_name) as tag_names,
            u.first_name as user_first_name,
            u.last_name as user_last_name,
            u.email as user_email,
            ucm.profile_pic as user_profile_pic
        FROM reviews r
        LEFT JOIN review_tag_relation tr ON r.id = tr.review_id
        LEFT JOIN users u ON r.customer_id = u.user_id   
        LEFT JOIN user_customer_meta ucm ON r.customer_id = ucm.user_id  
        WHERE r.company_id = ? AND r.review_status = 1
        GROUP BY r.id`;
    
    
    
        db.query(reviewsQuery, [ID], (reviewsErr, reviewsResults) => {
            if (reviewsErr) {
                return res.status(500).json({
                    status: 'error',
                    message: 'An error occurred while fetching company reviews',
                    err: reviewsErr
                });
            }
            
            // companyData.reviews = reviewsResults.map(review => ({
            //     first_name:review.first_name,
            //     last_name:review.last_name,
            //     email:review.email,
            //     profile_Pic:review.profile_pic,
            //     tag_names: review.tag_names.split(',')
            // }));
           
    companyData.reviews = reviewsResults.reduce((reviews, review) => {
        const existingReview = reviews.find(r => r.id === review.review_id);
        const tagObj = {
            tag_id: review.tag_id,
            tag_name: review.tag_names
        };
        
        if (existingReview) {
            existingReview.tags.push(tagObj);
        }else {
            reviews.push({
                id: review.review_id,
                review_status: review.review_status,
                review_title: review.review_title,
                review_content: review.review_content,
                user_privacy: review.user_privacy,
                first_name: review.user_first_name,
                last_name: review.user_last_name,
                email: review.user_email,
                profile_pic: review.user_profile_pic,
                tag_names: [tagObj]
            });
        }
        return reviews;
    }, []);

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

// router.get('/getComapniesDetails/:ID', verifyToken, async (req, res) => {
//     const { ID } = req.params;
//     const query = `
//     SELECT
//         c.*,
//         l.id as location_id,
//         l.address,
//         l.country,
//         l.state,
//         l.city,
//         l.zip,
//         COALESCE(AVG(r.rating), 0) as average_rating,
//         COALESCE(COUNT(r.id), 0) as review_count,
//         COALESCE(COUNT(r.rating), 0) as rating_count,
//         u.first_name as user_first_name,
//         u.last_name as user_last_name,
//         u.email as user_email,
//         ucm.profile_pic as user_profile_pic
//     FROM company c
//     LEFT JOIN company_location l ON c.ID = l.company_id
//     LEFT JOIN reviews r ON c.ID = r.company_id
//     LEFT JOIN users u ON c.user_created_by = u.user_id
//     LEFT JOIN user_customer_meta ucm ON c.user_created_by = ucm.user_id
//     WHERE c.ID = ? 
//     GROUP BY
//         c.ID,
//         c.user_created_by,
//         c.company_name,
//         c.logo,
//         c.main_address,
//         c.about_company,
//         c.trending,
//         c.comp_phone,
//         c.comp_email,
//         c.comp_registration_id,
//         c.status,
//         c.created_date,
//         c.updated_date,
//         l.id,
//         l.address,
//         l.country,
//         l.state,
//         l.city,
//         l.zip,
//         u.first_name,
//         u.last_name,
//         u.email,
//         ucm.profile_pic;
// `;



//     console.log('Query Parameters:', [ID]);

//     db.query(query, [ID], (err, results) => {
//         if (err) {
//             return res.status(500).json({
//                 status: 'error',
//                 message: 'An error occurred while fetching company details',
//                 err
//             });
//         }
//         if (results.length === 0) {
//             return res.status(404).json({
//                 status: 'error',
//                 message: 'Company not found'
//             });
//         }
//         const companyData = {
//             company_id: ID,
//             user_created_by: results[0].user_created_by,
//             company_name: results[0].company_name,
//             logo: results[0].logo,
//             about_company: results[0].about_company,
//             comp_phone: results[0].comp_phone,
//             comp_email: results[0].comp_email,
//             comp_registration_id: results[0].comp_registration_id,
//             trending: results[0].trending,
//             status: results[0].status,
//             created_date: results[0].created_date,
//             updated_date: results[0].updated_date,
//             average_rating: results[0].average_rating,
//             review_count: results[0].review_count,
//             rating_counts: results[0].rating_count,
//             first_name: results[0].first_name,
//             last_name: results[0].last_name,
//             email: results[0].email,
//             profile_pic: results[0].profile_pic,
//             location_id: results[0].location_id,
//             main_address:results[0].main_address
//         };

//         const reviewsQuery = `
//             SELECT
//                 r.id,
//                 r.review_status,
//                 r.review_title,
//                 r.review_content,
//                 r.user_privacy,
//                 tr.id,
//                 GROUP_CONCAT(tr.tag_name) as tag_names
//             FROM reviews r
//             LEFT JOIN review_tag_relation tr ON r.id = tr.review_id
//             WHERE r.company_id = ? AND r.review_status = 1
//             GROUP BY r.id;
//         `;

//         db.query(reviewsQuery, [ID], (reviewsErr, reviewsResults) => {
//             if (reviewsErr) {
//                 return res.status(500).json({
//                     status: 'error',
//                     message: 'An error occurred while fetching company reviews',
//                     err: reviewsErr
//                 });
//             }

//             companyData.reviews = reviewsResults.map(review => ({
//                 id: review.id,
//                 review_status: review.review_status,
//                 review_title: review.review_title,
//                 review_content: review.review_content,
//                 user_privacy: review.user_privacy,
//                 tag_names: review.tag_names.split(',')
//                 // ... (include other review properties you need)
//             }));

//             const ratingCountsQuery = 'SELECT rating, COUNT(*) as rating_count FROM reviews WHERE company_id = ? GROUP BY rating';
//             db.query(ratingCountsQuery, [ID], (ratingCountsErr, ratingCountsResults) => {
//                 if (ratingCountsErr) {
//                     return res.status(500).json({
//                         status: 'error',
//                         message: 'An error occurred while fetching rating counts',
//                         err: ratingCountsErr
//                     });
//                 }

//                 companyData.rating_counts = ratingCountsResults;

//                 return res.status(200).json({
//                     status: 'success',
//                     data: [companyData],
//                     message: 'Company details fetched successfully'
//                 });
//             });
//         });
//     });
// });


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


// router.get('/getreviewlisting', verifyToken, async (req, res) => {
//     const allReviewsQuery = `
//     SELECT r.id, r.company_id, r.customer_id, r.company_location, r.company_location_id,
//     c.company_name, c.logo, c.trending, AVG(r.rating) AS average_rating,
//     r.review_title, r.rating AS individual_rating, r.review_content,
//     r.user_privacy, r.review_status, r.created_at AS review_created_at,
//     r.updated_at AS review_updated_at,
//     u.first_name, u.last_name, u.email, ucd.profile_pic,
//     rtr.id AS review_relation_tag_id, rtr.tag_name, GROUP_CONCAT(rtr.id) AS tag_ids,
//     cl.state AS company_state, cl.city AS company_city, cl.country AS company_country
//     FROM reviews r
//     LEFT JOIN review_tag_relation rtr ON r.id = rtr.review_id
//     LEFT JOIN company c ON r.company_id = c.ID
//     LEFT JOIN users u ON r.customer_id = u.user_id
//     LEFT JOIN user_customer_meta ucd ON u.user_id = ucd.user_id
//     LEFT JOIN company_location cl ON c.ID = cl.company_id
//     WHERE r.review_status = 1
//     GROUP BY r.id, r.company_id, r.review_title, r.rating, r.review_content, r.user_privacy,
//     r.review_status, r.created_at, r.updated_at, rtr.id, u.first_name, u.last_name, u.email, ucd.profile_pic`;

//     const trendingReviewsQuery = `
//     SELECT r.id, r.company_id, r.customer_id, r.company_location, r.company_location_id,
//     c.company_name, c.logo, c.trending, AVG(r.rating) AS average_rating,
//     r.review_title, r.rating AS individual_rating, r.review_content,
//     r.user_privacy, r.review_status, r.created_at AS review_created_at,
//     r.updated_at AS review_updated_at,
//     u.first_name, u.last_name, u.email, ucd.profile_pic,
//     rtr.id AS review_relation_tag_id, rtr.tag_name, GROUP_CONCAT(rtr.id) AS tag_ids,
//     cl.state AS company_state, cl.city AS company_city, cl.country AS company_country
//     FROM reviews r
//     LEFT JOIN review_tag_relation rtr ON r.id = rtr.review_id
//     LEFT JOIN company c ON r.company_id = c.ID
//     LEFT JOIN users u ON r.customer_id = u.user_id
//     LEFT JOIN user_customer_meta ucd ON u.user_id = ucd.user_id
//     LEFT JOIN company_location cl ON c.ID = cl.company_id
//     WHERE r.review_status = 1 AND c.trending = 1  
//     GROUP BY r.id, r.company_id, r.review_title, r.rating, r.review_content, r.user_privacy,
//     r.review_status, r.created_at, r.updated_at, rtr.id, u.first_name, u.last_name, u.email, ucd.profile_pic`;
//     console.log(trendingReviewsQuery)

//     const latestReviewsQuery = `
//     SELECT r.id, r.company_id, r.customer_id, r.company_location, r.company_location_id,
//     c.company_name, c.logo, c.trending, AVG(r.rating) AS average_rating,
//     r.review_title, r.rating AS individual_rating, r.review_content,
//     r.user_privacy, r.review_status, r.created_at AS review_created_at,
//     r.updated_at AS review_updated_at,
//     u.first_name, u.last_name, u.email, ucd.profile_pic,
//     rtr.id AS review_relation_tag_id, rtr.tag_name, GROUP_CONCAT(rtr.id) AS tag_ids,
//     cl.state AS company_state, cl.city AS company_city, cl.country AS company_country
//     FROM reviews r
//     LEFT JOIN review_tag_relation rtr ON r.id = rtr.review_id
//     LEFT JOIN company c ON r.company_id = c.ID
//     LEFT JOIN users u ON r.customer_id = u.user_id
//     LEFT JOIN user_customer_meta ucd ON u.user_id = ucd.user_id
//     LEFT JOIN company_location cl ON c.ID = cl.company_id
//     WHERE r.review_status = 1
//     GROUP BY r.id, r.company_id, r.review_title, r.rating, r.review_content, r.user_privacy,
//     r.review_status, r.created_at, r.updated_at, rtr.id, u.first_name, u.last_name, u.email, ucd.profile_pic
//     ORDER BY r.created_at DESC
//     LIMIT 5
//     `;

//     const allReviewsPromise = new Promise((resolve, reject) => {
//         db.query(allReviewsQuery, (err, results) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve(results);
//             }
//         });
//     });

//     const trendingReviewsPromise = new Promise((resolve, reject) => {
//         db.query(trendingReviewsQuery, (err, results) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve(results);
//                 console.log(results);
//             }
//         });
//     });

//     const latestReviewsPromise = new Promise((resolve, reject) => {
//         db.query(latestReviewsQuery, (err, results) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve(results);
//             }
//         });
//     });

//     try {
//         const [allReviews, trendingReviews, latestReviews] = await Promise.all([
//             allReviewsPromise,
//             trendingReviewsPromise,
//             latestReviewsPromise,
//         ]);

//         const reviewsData={};

//         allReviews.forEach(row=>{
//             const reviewId=row.id;

//             if(!reviewsData[reviewId]){
//                 reviewsData[reviewId]={
//                     id: row.id,
//                     company_id: row.company_id,
//                     customer_id: row.customer_id,
//                     company_name: row.company_name,
//                     logo: row.logo,
//                     trending: row.trending,
//                     average_rating: row.average_rating,
//                     company_location: row.company_location,
//                     company_location_id: row.company_location_id,
//                     company_state: row.company_state,
//                     company_city: row.company_city,
//                     company_country: row.company_country,
//                     first_name:row.first_name,
//                     last_name: row.last_name,
//                     email: row.email,
//                     profile_pic: row.profile_pic,
//                     review_title: row.review_title,
//                     individual_rating: row.individual_rating,
//                     review_content: row.review_content,
//                     user_privacy: row.user_privacy,
//                     review_status: row.review_status,
//                     review_created_at: row.review_created_at,
//                     review_updated_at: row.review_updated_at,
//                     tags: [], 
//                 };
//             }

        
//             if (row.tag_ids) {
//                 const tagIds = row.tag_ids.split(',').map(Number);
//                 tagIds.forEach(tagId => {
//                     reviewsData[reviewId].tags.push({
//                         tag_name: row.tag_name,
//                         tag_ids: tagId,
//                 });
//             });
//             }
//         })

//     // Convert reviewsData object into an array of reviews
//     const reviewsArray = Object.values(reviewsData);

//     const trendingReviewsData = {};
//     trendingReviews.forEach(row => {
//         const reviewId = row.id;

//         if (!trendingReviewsData[reviewId]) {
//             trendingReviewsData[reviewId] = {
//                 id: row.id,
//                 company_id: row.company_id,
//                 customer_id: row.customer_id,
//                 company_name: row.company_name,
//                 logo: row.logo,
//                 trending: row.trending,
//                 average_rating: row.average_rating,
//                 company_location: row.company_location,
//                 company_location_id: row.company_location_id,
//                 company_address: row.company_address,
//                 company_state: row.company_state,
//                 company_city: row.company_city,
//                 company_country: row.company_country,
//                 review_title: row.review_title,
//                 individual_rating: row.individual_rating,
//                 review_content: row.review_content,
//                 user_privacy: row.user_privacy,
//                 review_status: row.review_status,
//                 review_created_at: row.review_created_at,
//                 review_updated_at: row.review_updated_at,
//                 first_name: row.first_name,
//                 last_name: row.last_name,
//                 email: row.email,
//                 profile_pic: row.profile_pic,
//                 review_relation_tag_id: row.review_relation_tag_id, 
//                 tags: [], 
//             };
//         }

//         // Extract tag information
//         if (row.tag_ids) {
//             const tagIds = row.tag_ids.split(',').map(Number);
//             tagIds.forEach(tagId => {
//                 if (!trendingReviewsData[reviewId].tags) {
//                     trendingReviewsData[reviewId].tags = []; 
//                 }
//                 trendingReviewsData[reviewId].tags.push({
//                     tag_name: row.tag_name,
//                     tag_ids: tagId,
//                 });
//             });
//         }
//     });
//     const trendingReviewsArray = Object.values(trendingReviewsData);

//     const latestReviewsData = {};
//     latestReviews.forEach(row => {
//         const reviewId = row.id;

//         if (!latestReviewsData[reviewId]) {
//             latestReviewsData[reviewId] = {
//                 id: row.id,
//                 company_id: row.company_id,
//                 customer_id: row.customer_id,
//                 company_name: row.company_name,
//                 logo: row.logo,
//                 trending: row.trending,
//                 average_rating: row.average_rating,
//                 company_location: row.company_location,
//                 company_location_id: row.company_location_id,
//                 company_address: row.company_address,
//                 company_state: row.company_state,
//                 company_city: row.company_city,
//                 company_country: row.company_country,
//                 review_title: row.review_title,
//                 individual_rating: row.individual_rating,
//                 review_content: row.review_content,
//                 user_privacy: row.user_privacy,
//                 review_status: row.review_status,
//                 review_created_at: row.review_created_at,
//                 review_updated_at: row.review_updated_at,
//                 first_name: row.first_name,
//                 last_name: row.last_name,
//                 email: row.email,
//                 profile_pic: row.profile_pic,
//                 review_relation_tag_id: row.review_relation_tag_id,
//                 tags: [], 
//             };
//         }

//         // Extract tag information
//         if (row.tag_ids) {
//             const tagIds = row.tag_ids.split(',').map(Number);
//             tagIds.forEach(tagId => {
//                 latestReviewsData[reviewId].tags.push({
//                     tag_name: row.tag_name,
//                     tag_ids: tagId,
//                 });
//             });
//         }
//     });
//     const latestReviewsArray = Object.values(latestReviewsData);

//     return res.status(200).json({
//         status: 'success',
//         data: {
//             allReviews: reviewsArray,
//             trendingReviews: trendingReviewsArray,
//             latestReviews: latestReviewsArray,
//         },
//         message: 'Company details fetched successfully',
//     });
// } catch (error) {
//     console.error("Error:", error);
//     return res.status(500).json({
//         status: 'error',
//         message: 'An error occurred while fetching details',
//         error,
//     });
// }
// });



// router.get('/getreviewlisting', verifyToken, async (req, res) => {
//     const allReviewsQuery = `
//     SELECT r.id, r.company_id, r.customer_id, r.company_location, r.company_location_id,
//     c.company_name, c.logo, c.trending, AVG(r.rating) AS average_rating,
//     r.review_title, r.rating AS individual_rating, r.review_content,
//     r.user_privacy, r.review_status, r.created_at AS review_created_at,
//     r.updated_at AS review_updated_at,
//     u.first_name, u.last_name, u.email, ucd.profile_pic,
//     rtr.id AS review_relation_tag_id, rtr.tag_name, GROUP_CONCAT(rtr.id) AS tag_ids,
//     cl.state AS company_state, cl.city AS company_city, cl.country AS company_country
//     FROM reviews r
//     LEFT JOIN review_tag_relation rtr ON r.id = rtr.review_id
//     LEFT JOIN company c ON r.company_id = c.ID
//     LEFT JOIN users u ON r.customer_id = u.user_id
//     LEFT JOIN user_customer_meta ucd ON u.user_id = ucd.user_id
//     LEFT JOIN company_location cl ON c.ID = cl.company_id
//     WHERE r.review_status = 1
//     GROUP BY r.id, r.company_id, r.review_title, r.rating, r.review_content, r.user_privacy,
//     r.review_status, r.created_at, r.updated_at, rtr.id, u.first_name, u.last_name, u.email, ucd.profile_pic`;

//     const trendingReviewsQuery = `
//     SELECT r.id, r.company_id, r.customer_id, r.company_location, r.company_location_id,
//     c.company_name, c.logo, c.trending, AVG(r.rating) AS average_rating,
//     r.review_title, r.rating AS individual_rating, r.review_content,
//     r.user_privacy, r.review_status, r.created_at AS review_created_at,
//     r.updated_at AS review_updated_at,
//     u.first_name, u.last_name, u.email, ucd.profile_pic,
//     rtr.id AS review_relation_tag_id, rtr.tag_name, GROUP_CONCAT(rtr.id) AS tag_ids,
//     cl.state AS company_state, cl.city AS company_city, cl.country AS company_country
//     FROM reviews r
//     LEFT JOIN review_tag_relation rtr ON r.id = rtr.review_id
//     LEFT JOIN company c ON r.company_id = c.ID
//     LEFT JOIN users u ON r.customer_id = u.user_id
//     LEFT JOIN user_customer_meta ucd ON u.user_id = ucd.user_id
//     LEFT JOIN company_location cl ON c.ID = cl.company_id
//     WHERE r.review_status = 1 AND c.trending = 1  
//     GROUP BY r.id, r.company_id, r.review_title, r.rating, r.review_content, r.user_privacy,
//     r.review_status, r.created_at, r.updated_at, rtr.id, u.first_name, u.last_name, u.email, ucd.profile_pic`;
//     console.log(trendingReviewsQuery)

//     const latestReviewsQuery = `
//     SELECT r.id, r.company_id, r.customer_id, r.company_location, r.company_location_id,
//     c.company_name, c.logo, c.trending, AVG(r.rating) AS average_rating,
//     r.review_title, r.rating AS individual_rating, r.review_content,
//     r.user_privacy, r.review_status, r.created_at AS review_created_at,
//     r.updated_at AS review_updated_at,
//     u.first_name, u.last_name, u.email, ucd.profile_pic,
//     rtr.id AS review_relation_tag_id, rtr.tag_name, GROUP_CONCAT(rtr.id) AS tag_ids,
//     cl.state AS company_state, cl.city AS company_city, cl.country AS company_country
//     FROM reviews r
//     LEFT JOIN review_tag_relation rtr ON r.id = rtr.review_id
//     LEFT JOIN company c ON r.company_id = c.ID
//     LEFT JOIN users u ON r.customer_id = u.user_id
//     LEFT JOIN user_customer_meta ucd ON u.user_id = ucd.user_id
//     LEFT JOIN company_location cl ON c.ID = cl.company_id
//     WHERE r.review_status = 1
//     GROUP BY r.id, r.company_id, r.review_title, r.rating, r.review_content, r.user_privacy,
//     r.review_status, r.created_at, r.updated_at, rtr.id, u.first_name, u.last_name, u.email, ucd.profile_pic
//     ORDER BY r.created_at DESC
//     LIMIT 5
//     `;

//     const allReviewsPromise = new Promise((resolve, reject) => {
//         db.query(allReviewsQuery, (err, results) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve(results);
//             }
//         });
//     });

//     const trendingReviewsPromise = new Promise((resolve, reject) => {
//         db.query(trendingReviewsQuery, (err, results) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve(results);
//             }
//         });
//     });

//     const latestReviewsPromise = new Promise((resolve, reject) => {
//         db.query(latestReviewsQuery, (err, results) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve(results);
//             }
//         });
//     });

//     try {
//         const [allReviews, trendingReviews, latestReviews] = await Promise.all([
//             allReviewsPromise,
//             trendingReviewsPromise,
//             latestReviewsPromise,
//         ]);

//         const companiesData = {};

//         // Function to add a review to a company's reviews list
//         const addReviewToCompany = (company, review) => {
//             if (!company.reviews) {
//                 company.reviews = [];
//             }
//             company.reviews.push(review);
//         };

//         // Populate companiesData with reviews from allReviews
//         allReviews.forEach(row => {
//             const companyId = row.company_id;

//             if (!companiesData[companyId]) {
//                 companiesData[companyId] = {
//                     id: companyId,
//                     company_name: row.company_name,
//                     logo: row.logo,
//                     trending: row.trending, average_rating: row.average_rating,
//                     company_location: row.company_location,
//                     company_location_id: row.company_location_id,
//                     company_state: row.company_state,
//                     company_city: row.company_city,
//                     company_country: row.company_country,
//                     first_name:row.first_name,
//                     last_name: row.last_name,
//                     email: row.email,
//                     profile_pic: row.profile_pic,
//                     review_title: row.review_title,
//                     individual_rating: row.individual_rating,
//                     review_content: row.review_content,
//                     user_privacy: row.user_privacy,
//                     review_status: row.review_status,
//                     review_created_at: row.review_created_at,
//                     review_updated_at: row.review_updated_at,                   
//                 };
//             }

//             addReviewToCompany(companiesData[companyId], {
//                 id: row.id,
//                 company_name: row.company_name,
//                     logo: row.logo,
//                     trending: row.trending,
//                     average_rating: row.average_rating,
//                     company_location: row.company_location,
//                     company_location_id: row.company_location_id,
//                     company_state: row.company_state,
//                     company_city: row.company_city,
//                     company_country: row.company_country,
//                     first_name:row.first_name,
//                     last_name: row.last_name,
//                     email: row.email,
//                     profile_pic: row.profile_pic,
//                     review_title: row.review_title,
//                     individual_rating: row.individual_rating,
//                     review_content: row.review_content,
//                     user_privacy: row.user_privacy,
//                     review_status: row.review_status,
//                     review_created_at: row.review_created_at,
//                     review_updated_at: row.review_updated_at,
//                    tags: [], 
//             });

//             // Extract tag information
//             if (row.tag_ids) {
//                 const tagIds = row.tag_ids.split(',').map(Number);
//                 tagIds.forEach(tagId => {
//                     companiesData[companyId].reviews[0].tags.push({
//                         tag_name: row.tag_name,
//                         tag_ids: tagId,
//                     });
//                 });
//             }
//         });

//         trendingReviews.forEach(row => {
//             const companyId = row.company_id;
//             if (companiesData[companyId]) {
//                 addReviewToCompany(companiesData[companyId], {
//                     id: row.id,
//                     customer_id: row.customer_id,
//                     // Include other review properties...
//                     tags: [],
//                 });
//             }
//         });

//         latestReviews.forEach(row => {
//             const companyId = row.company_id;
//             if (companiesData[companyId]) {
//                 addReviewToCompany(companiesData[companyId], {
//                     id: row.id,
//                     customer_id: row.customer_id,
//                     // Include other review properties...
//                     tags: [],
//                 });
//             }
//         });

//         // Convert companiesData object into an array of companies
//         const companiesArray = Object.values(companiesData);

//         return res.status(200).json({
//             status: 'success',
//             data: {
//                 companies: companiesArray,
//             },
//             message: 'Company details fetched successfully',
//         });
//     } catch (error) {
//         console.error("Error:", error);
//         return res.status(500).json({
//             status: 'error',
//             message: 'An error occurred while fetching details',
//             error,
//         });
//     }
// });



router.get('/getreviewlisting', verifyToken, async (req, res) => {
      const [ allreviews, allCompanyReviewTags,getAllRatingTags,getReviewRatingData,getCustomerReviewData,getUserReview] = await Promise.all([
        comFunction.getAllReviews(),
        comFunction2.getAllReviewTags(),
        comFunction.getAllRatingTags(),
        comFunction.getReviewRatingData(),
        comFunction.getCustomerReviewData(),
        comFunction.getUserReview(),
      ]);
      console.log(allreviews);
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



    return res.status(200).json({
      status: 'success',
      data: {
        //finalCompanyallReviews,
        all,
        allCompanyReviewTags,
      },
      message: 'user data successfully received'
    });
  }

});

  






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






  