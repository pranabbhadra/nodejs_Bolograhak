const express = require('express');
const apiController = require('../controllers/api');
const multer = require('multer');

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


router.post('/states', apiController.states );
router.post('/edit-profile', upload.single('profile_pic'), apiController.editProfile );
module.exports = router;