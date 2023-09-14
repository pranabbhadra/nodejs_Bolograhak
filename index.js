const util = require('util');
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const db = require('./config');
const passport = require('passport');
const session = require('express-session');
const axios = require('axios');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const useragent = require('useragent');
const requestIp = require('request-ip');
const FacebookStrategy = require('passport-facebook').Strategy;
const querystring = require('querystring');
const bodyParser = require('body-parser');
const comFunction = require('./common_function');
const mdlconfig = require('./config-module');

dotenv.config({ path: './.env' });
const query = util.promisify(db.query).bind(db);

const app = express();
const publicPath = path.join(__dirname, 'public');
const uploadsPath = path.join(__dirname, 'uploads');


app.use(cookieParser());
app.use(express.static(publicPath));
app.use(express.static(uploadsPath));
app.set('view engine', 'ejs');



app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Set up express-session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

// Include the Passport configuration from passport-setup.js
require('./passport-setup');
// Serialize and deserialize user data
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Set up express-session middleware
// app.use(session({
//     secret: 'your-secret-key',
//     resave: false,
//     saveUninitialized: false
// }));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Google login route
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/facebook', passport.authenticate('facebook',{scope:'email'}));

// Google login callback
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    async (req, res) => {
        // After successful login, redirect to the home page or any other page
        //res.redirect('/profile');
        
        const user = req.user;
        //res.json({ user });
        try {
            const UserResponse = await comFunction.saveUserGoogleLoginDataToDB(user);
            console.log('aaaa',UserResponse);
            // Set a cookie
            let userCookieData = {
                user_id: UserResponse.user_id,
                first_name: UserResponse.first_name,
                last_name: UserResponse.last_name,
                email: UserResponse.email,
                user_type_id: 2,
                profile_pic: UserResponse.profile_pic,
                source: 'gmail'
            };
            const encodedUserData = JSON.stringify(userCookieData);
            res.cookie('user', encodedUserData);
            try{
                //-- check last Login Info-----//
                const device_query = "SELECT * FROM user_device_info WHERE user_id = ?";
                const device_queryResults = await query(device_query, [UserResponse.user_id]);
                const userAgent = req.headers['user-agent'];
                const agent = useragent.parse(userAgent);
                const currentDate = new Date();
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const day = String(currentDate.getDate()).padStart(2, '0');
                const hours = String(currentDate.getHours()).padStart(2, '0');
                const minutes = String(currentDate.getMinutes()).padStart(2, '0');
                const seconds = String(currentDate.getSeconds()).padStart(2, '0');
                const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

                if (device_queryResults.length > 0) {
                    try{
                        const device_update_query = 'UPDATE user_device_info SET device_id = ?, IP_address = ?, last_logged_in = ? WHERE user_id = ?';
                        const values = [agent.toAgent() + ' ' + agent.os.toString(), requestIp.getClientIp(req), formattedDate, UserResponse.user_id];
                        const device_update_query_results = await query(device_update_query, values);
                    }catch(error){
                        console.error('Error during device_update_query:', error);
                    }
                } else {
                    // User doesnot exist Insert New Row.
                    try {
                        const device_insert_query = 'INSERT INTO user_device_info (user_id, device_id, device_token, imei_no, model_name, make_name, IP_address, last_logged_in, created_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
                        const values = [UserResponse.user_id, agent.toAgent() + ' ' + agent.os.toString(), '', '', '', '', requestIp.getClientIp(req), formattedDate, formattedDate];
                    
                        const device_insert_query_results = await query(device_insert_query, values);
                    
                        // Continue with any other code you need after the insert
                        console.log('Device info inserted successfully.');
                    } catch (error) {
                        console.error('Error executing device_insert_query:', error);
                    }

                }
            }catch (error) {
                console.error('Error during device_queryResults:', error);
            }

            res.redirect(process.env.BLOG_URL+"?login_check="+UserResponse.wp_user_id);
            
        } catch (error) {
            console.error('Error during google login:', error);
            res.redirect('/');
        }
    }
);

// FB Login Callback
app.get(
    '/auth/facebook/callback',
    passport.authenticate('facebook', {
      successRedirect: '/facebook-user-data',
      failureRedirect: '/fail',
    })
);
app.get('/fail', async (req, res) => {
    res.send("Failed attempt");
});

app.get('/facebook-user-data', async(req, res) => {
        const user = req.user;
        //res.json(user);
        try {
            const UserResponse = await comFunction.saveUserFacebookLoginDataToDB(user);
            //console.log('FB Login User Response',UserResponse);
            //res.json(UserResponse);
            if(UserResponse.status == 0){

                //Register Code
                const userFirstName = UserResponse.first_name;
                const userLastName = UserResponse.last_name;
                const userEmail = UserResponse.email;
                const userPicture = UserResponse.profile_pic;
                const external_id = UserResponse.external_registration_id;

                const currentDate = new Date();
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const day = String(currentDate.getDate()).padStart(2, '0');
                const hours = String(currentDate.getHours()).padStart(2, '0');
                const minutes = String(currentDate.getMinutes()).padStart(2, '0');
                const seconds = String(currentDate.getSeconds()).padStart(2, '0');

                const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            
                const user_insert_query = 'INSERT INTO users (first_name, last_name, email, register_from, external_registration_id, user_registered, user_status, user_type_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                const user_insert_values = [userFirstName, userLastName, userEmail, 'facebook', external_id, formattedDate, 1, 2];
                if(userEmail){
                    user_insert_values[6] = 1;
                }else{
                    user_insert_values[6] = 0;
                }
                try{
                    const user_insert_results = await query(user_insert_query, user_insert_values);
                    if (user_insert_results.insertId) {
                        const newuserID = user_insert_results.insertId;
                        const user_meta_insert_query = 'INSERT INTO user_customer_meta (user_id, profile_pic) VALUES (?, ?)';
                        const user_meta_insert_values = [newuserID, userPicture];
                        try{
                            const user_meta_insert_results = await query(user_meta_insert_query, user_meta_insert_values);
                            //**Send Welcome Email to User**/
                
                            //--- WP User Register-------//
                            const userRegistrationData = {
                                username: userEmail,
                                email: userEmail,
                                password: userEmail,
                                first_name: userFirstName,
                                last_name: userLastName,
                            };
                
                            axios.post(process.env.BLOG_API_ENDPOINT + '/register', userRegistrationData)
                            .then((response) => {
                                //console.log('User registration successful. User ID:', response.data.user_id);
                
                                //-------User Auto Login --------------//
                                const userAgent = req.headers['user-agent'];
                                const agent = useragent.parse(userAgent);
                
                                // Set a cookie
                                const userData = {
                                    user_id: newuserID,
                                    first_name: userFirstName,
                                    last_name: userLastName,
                                    email: userEmail,
                                    user_type_id: 2,
                                    profile_pic: userPicture
                                };
                                const encodedUserData = JSON.stringify(userData);
                                res.cookie('user', encodedUserData);
                
                                (async () => {
                                    //---- Login to Wordpress Blog-----//
                                    //let wp_user_data;
                                    try {
                                        const userLoginData = {
                                            email: userEmail,
                                            password: userEmail,
                                        };
                                        const response = await axios.post(process.env.BLOG_API_ENDPOINT + '/login', userLoginData);
                                        const wp_user_data = response.data.data;
                
                                        //-- check last Login Info-----//
                                        const device_query = "SELECT * FROM user_device_info WHERE user_id = ?";
                                        db.query(device_query, [newuserID], async (err, device_query_results) => {
                                            const currentDate = new Date();
                                            const year = currentDate.getFullYear();
                                            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                                            const day = String(currentDate.getDate()).padStart(2, '0');
                                            const hours = String(currentDate.getHours()).padStart(2, '0');
                                            const minutes = String(currentDate.getMinutes()).padStart(2, '0');
                                            const seconds = String(currentDate.getSeconds()).padStart(2, '0');
                                            const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                
                                            if (device_query_results.length > 0) {
                                                // User exist update info
                                                const device_update_query = 'UPDATE user_device_info SET device_id = ?, IP_address = ?, last_logged_in = ? WHERE user_id = ?';
                                                const values = [agent.toAgent() + ' ' + agent.os.toString(), requestIp.getClientIp(req), formattedDate, newuserID];
                                                db.query(device_update_query, values, (err, device_update_query_results) => {
                                                    //   return res.send(
                                                    //       {
                                                    //           status: 'ok',
                                                    //           data: userData,
                                                    //           wp_user: wp_user_data,
                                                    //           currentUrlPath: '/',
                                                    //           message: 'Registration successful you are automatically login to your dashboard'
                                                    //       }
                                                    //   )
                                                    if(wp_user_data){
                                                        res.redirect(process.env.BLOG_URL+"?login_check="+wp_user_data+"&currentUrlPath=");
                                                    }
                                                })
                                            } else {
                                                // User doesnot exist Insert New Row.
                
                                                const device_insert_query = 'INSERT INTO user_device_info (user_id, device_id, device_token, imei_no, model_name, make_name, IP_address, last_logged_in, created_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
                                                const values = [newuserID, agent.toAgent() + ' ' + agent.os.toString(), '', '', '', '', requestIp.getClientIp(req), formattedDate, formattedDate];
                
                                                db.query(device_insert_query, values, (err, device_insert_query_results) => {
                                                    //   return res.send(
                                                    //       {
                                                    //           status: 'ok',
                                                    //           data: userData,
                                                    //           wp_user: wp_user_data,
                                                    //           currentUrlPath: req.body.currentUrlPath,
                                                    //           message: 'Registration successful you are automatically login to your dashboard'
                                                    //       }
                                                    //   )
                                                    if(wp_user_data){
                                                        res.redirect(process.env.BLOG_URL+"?login_check="+wp_user_data+"&currentUrlPath=");
                                                    }
                                                })
                
                                            }
                                        })
                                    } catch (error) {
                                        // console.error('User login failed. Error:', error);
                                        // if (error.response && error.response.data) {
                                        //     console.log('Error response data:', error.response.data);
                                        // }
                                        res.json(error);
                                    }
                                })();
                            })
                            .catch((error) => {
                                //console.error('User registration failed:', );
                                res.json(error.response.data);
                                // return res.send(
                                //     {
                                //         status: 'err',
                                //         data: '',
                                //         message: error.response.data
                                //     }
                                // )
                            });
            
                        //return {first_name:userFullNameArray[0], last_name:userFullNameArray[1], user_id: newuserID, status: 0};
                        }catch(error){
                            res.json(error);
                            //console.error('Error during user_meta_insert_query:', error);
                        }
                    }
                }catch(error){
                    res.json(error);
                    //console.error('Error during user_insert_query:', error);
                }


            }            
        } catch (error) {
            console.error('Error saving user data:', error);
            return res.redirect('/error');
        }
});

// Define Routes
app.use('/authentication', require('./routes/authentication'));
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));


app.listen(5000);