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

const csv_storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'company-csv/');
    },
    filename: function (req, file, cb) {
        const currentDate = new Date();

        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const hours = String(currentDate.getHours()).padStart(2, '0');
        const minutes = String(currentDate.getMinutes()).padStart(2, '0');
        const seconds = String(currentDate.getSeconds()).padStart(2, '0');

        const formattedDate = `${year}-${month}-${day}-${hours}_${minutes}_${seconds}`;

        const originalname = file.originalname;
        const sanitizedFilename = originalname.replace(/[^a-zA-Z0-9\-\_\.]/g, ''); // Remove symbols and spaces
        const filename = formattedDate + '-' + sanitizedFilename;
        cb(null, filename);
    }
});
// Create multer instance
const csvupload = multer({ storage: csv_storage });


router.post('/register', authController.register);
router.post('/login', authController.login);

router.post('/frontend-user-register', authController.frontendUserRegister);

router.post('/frontend-user-login', authController.frontendUserLogin);

//Create New category--------//
router.post('/create-category', upload.single('cat_image'), authController.createCategory);

//Update category--------//
router.post('/update-category', upload.single('cat_image'), authController.updateCategory);

//Create New User--------//
router.post('/create-user', upload.single('profile_pic'), authController.createUser);
router.put('/edit-user-data', upload.single('profile_pic'), authController.editUserData);

//---Company--------//
router.post('/create-company', upload.single('logo'), authController.createCompany);
router.put('/edit-company-data', upload.single('logo'), authController.editCompany);
router.post('/company-bulk-upload', csvupload.single('company_file'), authController.companyBulkUpload);
router.post('/delete-company', authController.deleteCompany);
// Add FAQ
router.post('/create-faq', authController.createFAQ);

// Update FAQ
router.put('/update-faq', authController.updateFAQ);

// Update FAQ Images
router.post('/faq_images',upload.fields([
    { name: 'banner_img_1', maxCount: 1 },
    { name: 'banner_img_2', maxCount: 1 },
    { name: 'banner_img_3', maxCount: 1 },
    { name: 'banner_img_4', maxCount: 1 },
    { name: 'banner_img_5', maxCount: 1 },
    { name: 'banner_img_6', maxCount: 1 },
    { name: 'banner_img_7', maxCount: 1 },
    { name: 'banner_img_8', maxCount: 1 }
]), authController.updateFAQImages);

// Update Contacts
router.post('/update-contact', authController.updateContacts);

// Contacts Feedback
router.post('/contact-feedback', authController.contactFeedback);

// Home Page
router.post('/update-home', upload.fields([
    { name: 'banner_img_1', maxCount: 1 },
    { name: 'banner_img_2', maxCount: 1 },
    { name: 'banner_img_3', maxCount: 1 },
    { name: 'banner_img_4', maxCount: 1 },
    { name: 'banner_img_5', maxCount: 1 },
    { name: 'banner_img_6', maxCount: 1 },
    
    { name: 'review_img_1', maxCount: 1 },
    { name: 'review_img_2', maxCount: 1 },
    { name: 'review_img_3', maxCount: 1 },
    { name: 'review_img_4', maxCount: 1 },

    { name: 'cus_right_img_1', maxCount: 1 },
    { name: 'cus_right_img_2', maxCount: 1 },
    { name: 'cus_right_img_3', maxCount: 1 },
    { name: 'cus_right_img_4', maxCount: 1 },
    { name: 'cus_right_img_5', maxCount: 1 },
    { name: 'cus_right_img_6', maxCount: 1 },
    { name: 'cus_right_img_7', maxCount: 1 },
    { name: 'cus_right_img_8', maxCount: 1 },

    { name: 'org_responsibility_img_1', maxCount: 1 },
    { name: 'org_responsibility_img_2', maxCount: 1 },
    { name: 'org_responsibility_img_3', maxCount: 1 },
    { name: 'org_responsibility_img_4', maxCount: 1 },
    { name: 'org_responsibility_img_5', maxCount: 1 },
    { name: 'org_responsibility_img_6', maxCount: 1 },
    { name: 'org_responsibility_img_7', maxCount: 1 },
    { name: 'org_responsibility_img_8', maxCount: 1 },

    { name: 'about_us_img', maxCount: 1 },

    { name: 'map_img', maxCount: 1 },

]), authController.updateHome);

// About Page
router.post('/update-about', upload.fields([
    { name: 'banner_img_1', maxCount: 1 },
    { name: 'banner_img_2', maxCount: 1 },
    { name: 'banner_img_3', maxCount: 1 },
    { name: 'banner_img_4', maxCount: 1 },
    { name: 'banner_img_5', maxCount: 1 },
    { name: 'banner_img_6', maxCount: 1 },
    { name: 'banner_img_7', maxCount: 1 },
    { name: 'banner_img_8', maxCount: 1 },

    { name: 'platform_img_1', maxCount: 1 },
    { name: 'platform_img_2', maxCount: 1 },
    { name: 'platform_img_3', maxCount: 1 },
    { name: 'platform_img_4', maxCount: 1 },
    { name: 'platform_img_5', maxCount: 1 },
    { name: 'platform_img_6', maxCount: 1 },
    { name: 'platform_img_7', maxCount: 1 },
    { name: 'platform_img_8', maxCount: 1 },

    { name: 'right_img_1', maxCount: 1 },
    { name: 'right_img_2', maxCount: 1 },

]), authController.updateAbout);

router.post('/add-review', authController.submitReview);
router.post('/delete-review', authController.deleteReview);
//---Rating Tags--------//
router.post('/add-rating-tags', upload.single('rating_image'), authController.createRatingTags);
router.put('/edit-rating-tags', upload.single('rating_image'), authController.editRatingTags);
//---Review--------//
router.put('/edit-review', authController.editCustomerReview);

//Create Featured Company
router.post('/create-featured-company', authController.creatFeaturedCompany);

//Update Featured Company
router.post('/update-featured-company', authController.updateFeaturedCompany);

//Delete Featured Company
router.get('/delete-featured-companies/:id', authController.deleteFeaturedCompany);

// Home Page
router.post('/update-business', upload.fields([
    { name: 'banner_img_1', maxCount: 1 },
    { name: 'banner_img_2', maxCount: 1 },
    { name: 'banner_img_3', maxCount: 1 },
    { name: 'banner_img_4', maxCount: 1 },
    { name: 'banner_img_5', maxCount: 1 },
    { name: 'banner_img_6', maxCount: 1 },
    { name: 'banner_img_7', maxCount: 1 },
    { name: 'banner_img_8', maxCount: 1 },


    { name: 'advantage_img_1', maxCount: 1 },
    { name: 'advantage_img_2', maxCount: 1 },
    { name: 'advantage_img_3', maxCount: 1 },
    { name: 'advantage_img_4', maxCount: 1 },
    { name: 'advantage_img_5', maxCount: 1 },
    { name: 'advantage_img_6', maxCount: 1 },
    { name: 'advantage_img_7', maxCount: 1 },
    { name: 'advantage_img_8', maxCount: 1 },

    { name: 'did_you_know_img', maxCount: 1 },

]), authController.updateBusiness);

//Update Privacy Policy
router.post('/update-privacy', authController.updatePrivacy);

//Update disclaimer
router.post('/update-disclaimer', authController.updateDisclaimer);

//Update terms-of-service
router.post('/update-terms-of-service', authController.updateTermsOfService);

//Update My Profile
router.post('/update-myprofile',upload.single('profile_pic'), authController.updateMyProfile);

//Update Global Content
router.post('/update-global-content', authController.updateGlobalContent);
module.exports = router;