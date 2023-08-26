const express = require('express');
const multer = require('multer');
const authenController = require('../controllers/authentication');
const jwt = require('jsonwebtoken');
const jwtsecretKey = 'grahak-secret-key';
//const db = require('../config');


const router = express.Router();
//const publicPath = path.join(__dirname,'../public');

//get user details
router.get('/getUserDetails/:user_id', async (req, res) => {
    const { user_id } = req.params;
    console.log(user_id);

    const query = 'SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone, u.user_registered, u.register_from, u.external_registration_id, u.user_type_id, u.user_status, m.address, m.country, m.state, m.city, m.zip, m.date_of_birth, m.occupation, m.gender, m.profile_pic, m.alternate_phone, m.marital_status,m.about FROM users u LEFT JOIN user_customer_meta m on u.user_id=m.user_id WHERE u.user_id=?';

    db.query(query, [user_id], (err, results) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: 'An error occurred while fetching user details',
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found',
            });
        }

        const userDetails = results[0];
        const countryQuery = 'SELECT name FROM countries WHERE id=?';
        db.query(countryQuery, [userDetails.country], (countryErr, countryResults) => {
            if (countryErr) {
                return res.status(500).json({
                    status: 'error',
                    message: 'An error occurred while fetching country details',
                });
            }

            if (Array.isArray(countryResults) && countryResults.length > 0) {
                userDetails.countryname = countryResults[0].name;
            } else {
                userDetails.countryname = 'Unknown Country';
            }

            const stateQuery = 'SELECT name FROM states WHERE id=?';
            db.query(stateQuery, [userDetails.state], (stateErr, stateResults) => {
                if (stateErr) {
                    return res.status(500).json({
                        status: 'error',
                        message: 'An error occurred while fetching state details',
                    });
                }

                if (Array.isArray(stateResults) && stateResults.length > 0) {
                    userDetails.statename = stateResults[0].name;
                } else {
                    userDetails.statename = 'Unknown State';
                }

                return res.status(200).json({
                    status: 'success',
                    data: userDetails,
                    message: 'User details fetched successfully',
                });
            });
        });
    });
});

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