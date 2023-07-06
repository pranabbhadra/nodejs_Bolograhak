const express = require('express');
const multer = require('multer');

const authController = require('../controllers/auth');
//const db = require('../config');


const router = express.Router();
//const publicPath = path.join(__dirname,'../public');

// Set up multer storage for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
// Create multer instance
const upload = multer({ storage: storage });


router.post('/register', authController.register);
router.post('/login', authController.login);



//Create New User--------//
router.post('/create-user', upload.single('profile_pic'), authController.createUser);

//Create New category--------//
router.post('/create-category', upload.single('cat_image'), authController.createCategory);

module.exports = router;