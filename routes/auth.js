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
        const originalname = file.originalname;
        const sanitizedFilename = originalname.replace(/[^a-zA-Z0-9\-\_\.]/g, ''); // Remove symbols and spaces
        const filename = Date.now() + '-' + sanitizedFilename;
        cb(null, filename);
    }
});
// Create multer instance
const upload = multer({ storage: storage });


router.post('/register', authController.register);
router.post('/login', authController.login);

router.post('/frontend-user-register', authController.frontendUserRegister);

router.post('/frontend-user-login', authController.frontendUserLogin);

//Create New category--------//
router.post('/create-category', upload.single('cat_image'), authController.createCategory);

//Update category--------//
router.post('/update-category', upload.single('cat_image'), authController.updateCategory);

//Create New User--------//
router.post('/create-user', upload.single('profile_pic'), authController.createUser );
router.put('/edit-user-data', upload.single('profile_pic'), authController.editUserData );

//---Company--------//
router.post('/create-company', upload.single('logo'), authController.createCompany );
router.put('/edit-company-data', upload.single('logo'), authController.editCompany );

module.exports = router;