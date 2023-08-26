const express = require('express');
const multer = require('multer');
const authenController = require('../controllers/authentication');
const jwt = require('jsonwebtoken');
const jwtsecretKey = 'grahak-secret-key';
const db = require('../config');
const comFunction = require('../common_function_api');

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

    const user_ID = req.params.user_id;
    const [userBasicInfo, userMetaInfo, userCompanyInfo] = await Promise.all([
        comFunction.getUser(user_ID),
        comFunction.getUserMeta(user_ID),
        comFunction.getUserCompany(user_ID),
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

        return res.status(200).json({
            status: 'error',
            data: {
                ...mergedData,
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
router.get('/search-company', verifyToken, authenController.searchCompany);

router.get('/getAllCompaniesDetails', verifyToken, async (req, res) => {
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
router.get('/getComapniesDetails/:ID', verifyToken, async (req, res) => {
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
router.get('/getuserreviewlisting/:user_id', verifyToken, (req, res) => {
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

//getAllReviews
router.get('/getreviewlisting', verifyToken, async (req, res) => {
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
//----------Get API End----------------//

function verifyToken(req, res, next){
    let token = req.headers['authorization'];
    if(token){
        token = token.split(' ')[1];
        jwt.verify(token, jwtsecretKey, (err, valid) =>{
            if(err){
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid token',
                });
            }else{
                next();
            }
        })
    }else{
        return res.status(403).json({
            status: 'error',
            message: 'Missing header token',
        });
    }
}


module.exports = router;