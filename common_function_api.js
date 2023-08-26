const util = require('util');
const db = require('./config');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const useragent = require('useragent');
const requestIp = require('request-ip');
const axios = require('axios');
const { cache } = require('ejs');

dotenv.config({ path: './.env' });
const query = util.promisify(db.query).bind(db);
// Fetch user details from the users table
function getUser(userId) {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM users WHERE user_id = ?', [userId], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result[0]);
      }
    });
  });
}

// Function to fetch user metadata from the user_customer_meta table
function getUserMeta(userId) {
  return new Promise((resolve, reject) => {
    const user_meta_query = `
            SELECT user_meta.*, c.name as country_name, s.name as state_name
            FROM user_customer_meta user_meta
            LEFT JOIN countries c ON user_meta.country = c.id
            LEFT JOIN states s ON user_meta.state = s.id
            WHERE user_id = ?
        `;
    db.query(user_meta_query, [userId], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result[0]);
      }
    });
  });
}

async function getUsersByRole(roleID){
  const get_users_query = `
    SELECT *
    FROM users
    WHERE user_type_id = ? AND user_status = "1"`;
  const get_users_value = [roleID];
  try{
    const get_users_result = await query(get_users_query, get_users_value);
    return get_users_result;
  }catch(error){
    return 'Error during user get_company_rewiew_query:'+error;
  }
}

// Fetch all countries
function getCountries() {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM countries', (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

// Fetch user role from user_account_type table data
function getUserRoles() {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM user_account_type', (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

// Fetch user all states by country
function getStatesByUserID(userId) {
  return new Promise((resolve, reject) => {
    db.query('SELECT country FROM user_customer_meta WHERE user_id = ?', [userId], async (err, result) => {
      if (err) {
        reject(err);
      } else {
        //console.log('Result:', result); // Log the result array
        if (result && result.length > 0) {
          console.log(result[0].country);
          let countryID = '';
          if(result[0].country==null){
            countryID = 101;
          }else{
            countryID = result[0].country;
          }
          const userCountryId = countryID.toString();
          db.query('SELECT * FROM states WHERE country_id = ?', [userCountryId], async (err, results) => {
            if (err) {
              reject(err);
            } else {
              resolve(results);
            }
          });
        } else {
          reject(new Error('User country not found'));
        }
      }
    });
  });
}

// Fetch all Company
function getAllCompany() {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT c.*, GROUP_CONCAT(cat.category_name) AS categories
      FROM company c
      LEFT JOIN company_cactgory_relation cr ON c.ID = cr.company_id
      LEFT JOIN category cat ON cr.category_id = cat.ID
      GROUP BY c.ID`,
      async(err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function getCompany(companyId) {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM company WHERE ID = ?', [companyId], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result[0]);
      }
    });
  });
}

async function getCompanyCategory() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE
    });

    const [categories] = await connection.query('SELECT * FROM category');
    //console.log(categories);
    connection.end();
    const nestedCategories = buildCategoryTree(categories);   // This is the Json Format Of All Categories
    const nestedCategoriesHTML = renderCategoryTreeHTML(nestedCategories);

    return nestedCategoriesHTML;
  } catch (error) {
    throw new Error('Error fetching company categories');
  }
}

function buildCategoryTree(categories, parentId = 0) {
  const categoryTree = [];

  categories.forEach((category) => {
    if (category.parent_id === parentId) {
      const children = buildCategoryTree(categories, category.ID);
      const categoryNode = { id: category.ID, name: category.category_name, img: category.category_img, children };
      categoryTree.push(categoryNode);
    }
  });

  return categoryTree;
}

function renderCategoryTreeHTML(categories) {
  let html = '<ul>';
  categories.forEach(function (category) {
    html += '<li class="mt-5"><div class="mb-5"><div class="form-check"><input type="checkbox" name="category" class="form-check-input" value="' + category.id + '"><label class="form-check-label" for="flexCheckDefault">' + category.name + '</label>';
    if (category.children.length > 0) {
      html += renderCategoryTreeHTML(category.children);
    }
    html += '</div></div></li>';
  });
  html += '</ul>';
  return html;
}

async function getCompanyCategoryBuID(compID) {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE
    });

    const [categories] = await connection.query('SELECT * FROM category');

    const [com_categories] = await connection.query('SELECT category_id FROM company_cactgory_relation WHERE company_id = ?', [compID]);

    const com_category_array = com_categories.map((category) => category.category_id);

    //console.log(com_category_array);
    connection.end();
    const nestedCategories = buildCategoryTree(categories);   // This is the Json Format Of All Categories
    const nestedCategoriesHTMLwithChecked = renderCategoryTreeHTMLforCompany(nestedCategories, com_category_array);

    return nestedCategoriesHTMLwithChecked;
  } catch (error) {
    throw new Error('Error fetching company categories');
  }
}

function renderCategoryTreeHTMLforCompany(categories, com_category_array) {
  let html = '<ul>';
  categories.forEach(function (category) {
    if (com_category_array.includes(category.id)) {
      var inputchecked = 'checked';
    } else {
      var inputchecked = '';
    }
    html += '<li class="mt-5"><div class="mb-5"><div class="form-check"><input type="checkbox" name="category" class="form-check-input" value="' + category.id + '" ' + inputchecked + '><label class="form-check-label" for="flexCheckDefault">' + category.name + '</label>';
    if (category.children.length > 0) {
      html += renderCategoryTreeHTMLforCompany(category.children, com_category_array);
    }
    html += '</div></div></li>';
  });
  html += '</ul>';
  return html;
}

//-------After Google Login Save User data Or Check User exist or Not.
const saveUserGoogleLoginDataToDB = async (userData) => {
  //console.log(userData);
  //console.log(userData.name.familyName + ' ' + userData.name.givenName + ' ' + userData.emails[0].value + ' ' + userData.photos[0].value+ ' ' + userData.id);
  
  try {
    // Check if the email already exists in the "users" table
    const emailExists = await new Promise((resolve, reject) => {
    db.query('SELECT email FROM users WHERE email = ?', [userData.emails[0].value], (err, results) => {
        if (err) reject(err);
            resolve(results.length > 0);
        });
    });
    if (emailExists) {
        try {
          const gEmail = userData.emails[0].value;
          const userSearchQuery = 'SELECT * FROM users WHERE email = ?';
          const userResults = await query(userSearchQuery, [gEmail]);
          if (userResults.length > 0) {
            //console.log('Glogin user data', userResults);
            const userMatch = userResults[0];
            try{
              const matchUserID = userMatch.user_id;
              const userMetaSearchQuery = `SELECT user_meta.*, c.name as country_name, s.name as state_name
                                            FROM user_customer_meta user_meta
                                            JOIN countries c ON user_meta.country = c.id
                                            JOIN states s ON user_meta.state = s.id
                                            WHERE user_id = ?`;
              const userMetaResults = await query(userMetaSearchQuery, [matchUserID]);
              let usercookieData = {};
              if (userMetaResults.length > 0) {
                const matchUserMetaData = userMetaResults[0];
                const dateString = matchUserMetaData.date_of_birth;
                const date_of_birth_date = new Date(dateString);
                const formattedDate = date_of_birth_date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
                usercookieData = {
                  user_id: matchUserID,
                  first_name: userMatch.first_name,
                  last_name: userMatch.last_name,
                  email: userMatch.email,
                  phone: userMatch.phone,
                  user_type_id: userMatch.user_type_id,
                  address: matchUserMetaData.address,
                  country: matchUserMetaData.country,
                  country_name: matchUserMetaData.country_name,
                  state: matchUserMetaData.state,
                  state_name: matchUserMetaData.state_name,
                  city: matchUserMetaData.city,
                  zip: matchUserMetaData.zip,
                  review_count: matchUserMetaData.review_count,
                  date_of_birth: formattedDate,
                  occupation: matchUserMetaData.occupation,
                  gender: matchUserMetaData.gender,
                  profile_pic: matchUserMetaData.profile_pic,
                  source: 'gmail'
                };
                console.log(usercookieData, 'Logedin User All Data 111');
              }else{
                usercookieData = {
                  user_id: matchUserID,
                  first_name: userMatch.first_name,
                  last_name: userMatch.last_name,
                  email: userMatch.email,
                  phone: userMatch.phone,
                  user_type_id: userMatch.user_type_id,
                  profile_pic: userData.photos[0].value,
                  source: 'gmail'
                };
                console.log(usercookieData, 'Logedin User All Data 222');
              }

              try{
                const wpUserSearchQuery = 'SELECT ID FROM bg_users WHERE user_login = ?';
                const wpUserResults = await query(wpUserSearchQuery, [gEmail]);
                if (wpUserResults.length > 0) {
                  //console.log(wpUserResults, 'Wp User Query Result');
                  usercookieData.wp_user_id = wpUserResults[0].ID;
                }
                console.log(usercookieData, 'Final Return data');
                return usercookieData;
              }catch(error){
                console.error('Error executing SELECT wpUserSearchQuery:', error);
              }
              

            } catch(error){
              console.error('Error executing SELECT userMetaSearchQuery:', error);
            }
          }
        } catch (error) {
          console.error('Error executing SELECT userSearchQuery:', error);
        }

    }else{
      try {
        // Hash the password asynchronously
        const hashedPassword = await bcrypt.hash(userData.emails[0].value, 8);
        const currentDate = new Date();

        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const hours = String(currentDate.getHours()).padStart(2, '0');
        const minutes = String(currentDate.getMinutes()).padStart(2, '0');
        const seconds = String(currentDate.getSeconds()).padStart(2, '0');

        const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        const insertUser = (query, values) => {
          return new Promise((resolve, reject) => {
            db.query(query, values, (err, results) => {
              if (err) reject(err);
              resolve(results);
            });
          });
        };

        const userInsertQuery = 'INSERT INTO users (first_name, last_name, email, password, register_from, external_registration_id, user_registered, user_status, user_type_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const userResults = await insertUser(userInsertQuery, [userData.name.givenName, userData.name.familyName, userData.emails[0].value, hashedPassword, 'google', userData.id, formattedDate, 1, 2]);

        const registeredUserID = userResults.insertId;

        // Insert the user into the "user_customer_meta" table
        const userMetaInsertQuery = 'INSERT INTO user_customer_meta (user_id, address, country, state, city, zip, review_count, date_of_birth, occupation, gender, profile_pic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        await insertUser(userMetaInsertQuery, [registeredUserID, '', '', '', '', '', 0, '', '', '', userData.photos[0].value]);

        try {
          let userRegistrationData = {
            user_id: registeredUserID,
            username: userData.emails[0].value,
            password: userData.emails[0].value,
            first_name: userData.name.givenName,
            last_name: userData.name.familyName,
            email: userData.emails[0].value,
            profile_pic: userData.photos[0].value,
            source: 'gmail'
          };
          const response = await axios.post(process.env.BLOG_API_ENDPOINT + '/register', userRegistrationData);
          userRegistrationData.wp_user_id = response.data.user_id;
          console.log(userRegistrationData);
          return userRegistrationData;
        } catch (error) {
          console.error('Error during user registration:', error);
          throw error; // Re-throw the error to be caught in the calling function if needed
        }
      } catch (error) {
        console.error('Error during user registration:', error);
        throw error; // Re-throw the error to be caught in the calling function if needed
      }
    }
  }
  catch (error) {
    console.error('Error during user registration:', error);
  }
};

//-------After Facebook Login Save User data Or Check User exist or Not.
async function saveUserFacebookLoginDataToDB(userData) {
  console.log(userData);
  console.log(userData.id + ' ' + userData.displayName + ' ' + userData.photos[0].value);
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');

  //Checking external_registration_id exist or not and register_from facebook or not
  try{
    const user_exist_query = 'SELECT * FROM users WHERE register_from = ? AND external_registration_id = ? AND email = ?';
    const user_exist_values = ["facebook", userData.id, userData.emails[0].value];
    const user_exist_results = await query(user_exist_query, user_exist_values);
    if (user_exist_results.length > 0) {
        //console.log(user_exist_results);
        // checking user status
        if(user_exist_results[0].user_exist_results == 1){
          return {first_name:user_exist_results[0].first_name, last_name:user_exist_results[0].last_name, user_id: user_exist_results[0].user_id, status: 1};
        }else{
          // return to frontend for registering with email ID
          return {first_name:user_exist_results[0].first_name, last_name:user_exist_results[0].last_name, user_id: user_exist_results[0].user_id, status: 0};
        }
    }else{
      //user doesnot exist Insert initial data getting from facebook but user status 0
      const userFullName = userData.displayName;
      const userFullNameArray = userFullName.split(" ");
      const userFirstName = userData.name.givenName;
      const userLastName = userData.name.familyName;
      const userEmail = userData.emails[0].value;
      const user_insert_query = 'INSERT INTO users (first_name, last_name, email, register_from, external_registration_id, user_registered, user_status, user_type_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
      const user_insert_values = [userFirstName, userLastName, userEmail, 'facebook', userData.id, formattedDate, 0, 2];
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
          const user_meta_insert_values = [newuserID, userData.photos[0].value];
          try{
            const user_meta_insert_results = await query(user_meta_insert_query, user_meta_insert_values);
            // return to frontend for registering with email ID
            return {first_name:userFullNameArray[0], last_name:userFullNameArray[1], user_id: newuserID, status: 0};
          }catch(error){
            console.error('Error during user_meta_insert_query:', error);
          }
        }
      }catch(error){
        console.error('Error during user_insert_query:', error);
      }
    }
  }catch(error){
      console.error('Error during user_exist_query:', error);
  }      

};

// Fetch all Review Rating Tags
function getAllRatingTags() {
  return new Promise((resolve, reject) => {
      db.query('SELECT * FROM review_rating_tags', (err, result) => {
          if (err) {
              reject(err);
          } else {
              resolve(result);
          }
      });
  });
}

function getReviewRatingData(review_rating_Id) {
  return new Promise((resolve, reject) => {
      db.query('SELECT * FROM review_rating_tags WHERE id = ?', [review_rating_Id], (err, result) => {
          if (err) {
              reject(err);
          } else {
              resolve(result[0]);
          }
      });
  });
}

async function getAllReviews() {
  const all_review_query = `
    SELECT r.*, c.company_name, c.logo, c.status as company_status, c.verified as verified_status, cl.address, cl.country, cl.state, cl.city, cl.zip, u.first_name, u.last_name, ucm.profile_pic
      FROM reviews r
      JOIN company c ON r.company_id = c.ID
      JOIN company_location cl ON r.company_location_id = cl.ID
      JOIN users u ON r.customer_id = u.user_id
      LEFT JOIN user_customer_meta ucm ON u.user_id = ucm.user_id
      ORDER BY r.created_at DESC;
  `;
  try{
    const all_review_results = await query(all_review_query);
    return all_review_results;
  }
  catch(error){
    console.error('Error during all_review_query:', error);
  }
}
async function getCustomerReviewData(review_Id){
  const select_review_query = `
    SELECT r.*, c.company_name, c.logo, c.status as company_status, c.verified as verified_status, cl.address, cl.country, cl.state, cl.city, cl.zip, u.first_name, u.last_name, ucm.profile_pic
      FROM reviews r
      JOIN company c ON r.company_id = c.ID
      JOIN company_location cl ON r.company_location_id = cl.ID
      JOIN users u ON r.customer_id = u.user_id
      LEFT JOIN user_customer_meta ucm ON u.user_id = ucm.user_id
      WHERE r.id = ?;
  `;
  const select_review_value = [review_Id];
  try{
    const select_review_results = await query(select_review_query, select_review_value);
    return select_review_results[0];
  }
  catch(error){
    console.error('Error during select_review_query:', error);
  }
}

async function getCustomerReviewTagRelationData(review_Id){
  const select_review_tag_query = `
    SELECT r.id as review_id, rtr.id, rtr.tag_name
      FROM reviews r
      JOIN review_tag_relation rtr ON r.id = rtr.review_id
      WHERE r.id = ?;
  `;
  const select_review_tag_value = [review_Id];
  try{
    const select_review_tag_results = await query(select_review_tag_query, select_review_tag_value);
    return select_review_tag_results;
  }
  catch(error){
    console.error('Error during select_review_tag_query:', error);
  }
}

function getMetaValue(pageID, page_meta_key) {
  //console.log(pageID + ' ' + page_meta_key);
  db.query(`SELECT page_meta_value FROM page_meta  WHERE page_id  = ${pageID} AND  page_meta_key  =  '${page_meta_key}' `, async (err, result) => {
    if (err) {
      //reject(err);
      console.log(err)
    } else {
      //console.log('Result:', result); // Log the result array
      if (result && result.length > 0) {
        const meta_values = result[0];
        return result;
      }
    }
  });

}

// Function to insert data into 'faq_pages' table
async function insertIntoFaqPages(data) {
  try {
    const checkQuery = `SELECT * FROM faq_pages WHERE 1`;
    db.query(checkQuery, async (checkErr, checkResult) => {
      if (checkResult.length > 0) {
        const updateQuery = `UPDATE faq_pages SET title=?, content = ?, meta_title = ?, meta_desc = ?, keyword = ? WHERE id = ${checkResult[0].id}`;
        const results = await query(updateQuery, data);
        return checkResult[0].id;
      } else {
        const insertQuery = 'INSERT INTO faq_pages (title, content, meta_title, meta_desc, keyword) VALUES (?, ?, ?, ?, ?)';
        const results = await query(insertQuery, data);
        return results.insertId;
      }
    })


  } catch (error) {
    console.error('Error inserting data into faq_pages table:', error);
    throw error;
  }
}

// Function to insert data into 'faq_categories' table
async function insertIntoFaqCategories(categoryArray) {
  if (Array.isArray(categoryArray) && categoryArray.length > 0) {
    for (const categoryData of categoryArray) {

      try {
        const categoryTitle = Object.keys(categoryData)[0];
        const CatinsertQuery = `INSERT INTO faq_categories (category) VALUES (?)`;
        const Catinsertvalues = [categoryTitle];
        const results = await query(CatinsertQuery, Catinsertvalues);
        const categoryId = results.insertId;
        console.log('Data inserted into faq_categories table:', categoryId);

        // Insert data into 'faq_item' table for the current category
        if (categoryData[categoryTitle].length > 0) {
          await insertIntoFaqItems(categoryData[categoryTitle], categoryId);
        }
      } catch (error) {
        console.error('Error inserting data into faq_categories table:', error);
        throw error;
      }
    }
  }
}

// Function to insert data into 'faq_item' table
async function insertIntoFaqItems(faqItemsArray, categoryId) {
  if (Array.isArray(faqItemsArray) && faqItemsArray.length > 0) {
    for (const faqItemData of faqItemsArray) {
      try {
        const FAQItenInsertquery = `INSERT INTO faq_item (category_id, question, answer) VALUES (?, ?, ?)`;
        const FAQItenInsertvalues = [categoryId, faqItemData.Q, faqItemData.A];

        const results = await query(FAQItenInsertquery, FAQItenInsertvalues);
        console.log('Data inserted into faq_item table:', results.insertId);
      } catch (error) {
        console.error('Error inserting data into faq_item table:', error);
        throw error;
      }
    }
  }
}

//-- Create New Company ----------//
async function createCompany(comInfo, userId) {
  //console.log(comInfo, userId);
  let return_data = {};
  try {
    // Check if the company Name already exists in the "company" table
    const company_name_checking_query = "SELECT ID FROM company WHERE company_name = ?";
    const company_name_checking_results = await query(company_name_checking_query, [comInfo.company_name]);
    if (company_name_checking_results.length > 0) {
        //company exist
        try{
          const company_address_exist_query = 'SELECT * FROM company_location WHERE company_id = ? AND address = ?';
          const company_address_exist_values = [company_name_checking_results[0].ID, comInfo.address];
          const company_address_exist_results = await query(company_address_exist_query, company_address_exist_values);
          if (company_address_exist_results.length > 0) {
            //address exist return location ID
            return_data.companyID = company_name_checking_results[0].ID;
            return_data.companyLocationID = company_address_exist_results[0].ID;
            return return_data;
          }else{
            //create new address for company
            try{
              const create_company_address_query = 'INSERT INTO company_location (company_id, address, country, state, city, zip, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
              const create_company_address_values = [company_name_checking_results[0].ID, comInfo.address, '', '', '', '', '2'];
              const create_company_address_results = await query(create_company_address_query, create_company_address_values);
              if (create_company_address_results.insertId) {
                return_data.companyID = company_name_checking_results[0].ID;
                return_data.companyLocationID = create_company_address_results.insertId;
                return return_data;
              }
            }catch(error){
              console.error('Error during create_company_address_query:', error);
              return error;
            }
                        
          }
        }catch(error){
            console.error('Error during company_address_exist_query:', error);
            return error;
        }        
        //return company_name_checking_results[0].ID;
    }else{
      // Create New Company
      // Get the current date
      const currentDate = new Date();

      // Format the date in 'YYYY-MM-DD HH:mm:ss' format (adjust the format as needed)
      const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');
      try {
        const create_company_query = 'INSERT INTO company (user_created_by, company_name, status, created_date, updated_date, main_address, verified) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const create_company_values = [userId, comInfo.company_name, '2', formattedDate, formattedDate, comInfo.address, '0'];
        const create_company_results = await query(create_company_query, create_company_values);
        // console.log('New Company:', create_company_results);
        // console.log('New Company ID:', create_company_results.insertId);
        if (create_company_results.insertId) {
          //create new address for company
          try{
            const create_company_address_query = 'INSERT INTO company_location (company_id, address, country, state, city, zip, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
            const create_company_address_values = [create_company_results.insertId, comInfo.address, '', '', '', '', '2'];
            const create_company_address_results = await query(create_company_address_query, create_company_address_values);
            if (create_company_address_results.insertId) {
              return_data.companyID = create_company_results.insertId;
              return_data.companyLocationID = create_company_address_results.insertId;
              return return_data;
            }
          }catch(error){
            console.error('Error during create_company_address_query:', error);
            return error;
          }
        }
      }catch(error){
        console.error('Error during user create_company_query:', error);
       return error;
      }
    }
  }
  catch (error) {
    console.error('Error during user company_name_checking_query:', error);
  }
};

async function createReview(reviewIfo, userId, comInfo){
  // console.log('Review Info', reviewIfo);
  // console.log('Company Info', comInfo);
  // reviewIfo['tags[]'].forEach((tag) => {
  //   console.log(tag);
  // });
  if (typeof reviewIfo['tags[]'] === 'string') {
    // Convert it to an array containing a single element
    reviewIfo['tags[]'] = [reviewIfo['tags[]']];
  }
  const currentDate = new Date();
  // Format the date in 'YYYY-MM-DD HH:mm:ss' format (adjust the format as needed)
  const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');

  const create_review_query = 'INSERT INTO reviews (company_id, customer_id, company_location, company_location_id, review_title, rating, review_content, user_privacy, review_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const create_review_values = [comInfo.companyID, userId, reviewIfo.address, comInfo.companyLocationID, reviewIfo.review_title, reviewIfo.rating, reviewIfo.review_content, reviewIfo.user_privacy, '2', formattedDate, formattedDate];
              
  try {
    const create_review_results = await query(create_review_query, create_review_values);
    if(create_review_results.insertId){
      //insert review_tag_relation
      const review_tag_relation_query = 'INSERT INTO review_tag_relation (review_id, tag_name) VALUES (?, ?)';
      try{
        for (const tag of reviewIfo['tags[]']) {
          const review_tag_relation_values = [create_review_results.insertId, tag];
          const review_tag_relation_results = await query(review_tag_relation_query, review_tag_relation_values);
        }

        //-- user review count------//
        const update_review_count_query = 'UPDATE user_customer_meta SET review_count = review_count + 1 WHERE user_id = ?';
        try {
          const [update_review_count_result] = await db.promise().query(update_review_count_query, [userId]);
          return create_review_results.insertId;
        }catch (error) {
          console.error('Error during user update_review_count_query:', error);
        }
        
      }catch(error){
        console.error('Error during user review_tag_relation_results:', error);
      }
    }
  }catch (error) {
    console.error('Error during user create_review_results:', error);
  }
}

async function getlatestReviews(reviewCount){
  const get_latest_review_query = `
    SELECT r.*, c.company_name, c.logo, cl.address, cl.country, cl.state, cl.city, cl.zip
      FROM reviews r
      JOIN company c ON r.company_id = c.ID AND c.status = "1"
      JOIN company_location cl ON r.company_location_id = cl.ID AND cl.status = "1"
      WHERE r.review_status = "1"
      ORDER BY r.created_at DESC
      LIMIT ${reviewCount};
  `;
  try{
    const get_latest_review_results = await query(get_latest_review_query);
    if(get_latest_review_results.length > 0 ){
      //console.log(get_latest_review_results);
      return get_latest_review_results;
    }else{
      return [];
    }
  }catch(error){
    console.error('Error during user get_latest_review_query:', error);
  }
  
}

async function editCustomerReview(req){
  //console.log(req)
  const ratingTagsArray = JSON.parse(req.rating_tags);
  const currentDate = new Date();
  // Format the date in 'YYYY-MM-DD HH:mm:ss' format (adjust the format as needed)
  const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');

  const update_review_query = 'UPDATE reviews SET review_title = ?, rating = ?, review_content = ?, user_privacy = ?, review_status = ?,rejecting_reason = ?, updated_at = ? WHERE id = ?';
  const update_review_values = [req.review_title, req.rating, req.review_content, req.user_privacy, req.review_status, req.review_rejecting_comment, formattedDate, req.review_id];
  try {
    const update_review_result = await query(update_review_query, update_review_values);

      // Remove all tags for the review
      const delete_tag_relation_query = 'DELETE FROM review_tag_relation WHERE review_id = ?';
      const delete_tag_relation_values = [req.review_id];
      try {
        const delete_tag_relation_result = await query(delete_tag_relation_query, delete_tag_relation_values);
        console.log('Review deleted:', delete_tag_relation_result);
      } catch (error) {
        return 'Error during review delete_tag_relation_query:'+error;
      }

      //insert review_tag_relation
      if (ratingTagsArray && ratingTagsArray.length > 0) {
        const insert_tag_relation_query = 'INSERT INTO review_tag_relation (review_id, tag_name) VALUES (?, ?)';
        for (const tag of ratingTagsArray) {
          const insert_tag_relation_values = [req.review_id, tag.value];
          try {
            const insert_tag_relation_result = await query(insert_tag_relation_query, insert_tag_relation_values);
            //console.log('New tag relation inserted:', insert_tag_relation_result);
          } catch (error) {
            return 'Error during insert_tag_relation_query:'+error;
          }
        }
      }
      return true;
  }catch (error) {
    return 'Error during user update_review_query:'+error;
  }  
}

async function searchCompany(keyword){
  const get_company_query = `
    SELECT ID, company_name, logo, about_company, main_address, main_address_pin_code FROM company
    WHERE company_name LIKE '%${keyword}%'
    OR about_company LIKE '%${keyword}%'
    OR heading LIKE '%${keyword}%'
    ORDER BY created_date DESC
  `;
  try{
    const get_company_results = await query(get_company_query);
    if(get_company_results.length > 0 ){
      console.log(get_company_results);
      return {status: 'ok', data: get_company_results, message: get_company_results.length+' company data recived'};
    }else{
      return {status: 'ok', data: '', message: 'No company data found'};
    }
  }catch(error){
    return {status: 'err', data: '', message: 'No company data found'};
  }  
}

async function getCompanyReviewNumbers(companyID){
  const get_company_rewiew_count_query = `
    SELECT COUNT(*) AS total_review_count, AVG(rating) AS total_review_average
    FROM reviews
    WHERE company_id = ? AND review_status = ?`;
  const get_company_rewiew_count_value = [companyID, '1'];
  try{
    const get_company_rewiew_count_result = await query(get_company_rewiew_count_query, get_company_rewiew_count_value);
    const get_company_rewiew_rating_count_query = `
    SELECT rating,count(rating) AS cnt_rat
    FROM reviews
    WHERE company_id = ?
    group by rating ORDER by rating DESC`;
    try{
      const get_company_rewiew_rating_count_result = await query(get_company_rewiew_rating_count_query, get_company_rewiew_count_value);
      return {rewiew_count:get_company_rewiew_count_result[0], rewiew_rating_count: get_company_rewiew_rating_count_result};
    }catch(error){
      return 'Error during user get_company_rewiew_rating_count_query:'+error;
    }
    
  }catch(error){
    return 'Error during user get_company_rewiew_count_query:'+error;
  }
}

async function getCompanyReviews(companyID){
  const get_company_rewiew_query = `
    SELECT r.*, ur.first_name, ur.last_name, ur.last_name, ucm.profile_pic
    FROM reviews r
    JOIN users ur ON r.customer_id = ur.user_id
    JOIN user_customer_meta ucm ON ur.user_id = ucm.user_id
    WHERE r.company_id = ? AND r.review_status = "1"
    ORDER BY r.created_at DESC
    LIMIT 20`;
  const get_company_rewiew_value = [companyID];
  try{
    const get_company_rewiew_result = await query(get_company_rewiew_query, get_company_rewiew_value);
    return get_company_rewiew_result;
  }catch(error){
    return 'Error during user get_company_rewiew_query:'+error;
  }
}

function getUserCompany(user_ID){
    const get_user_company_query = `
    SELECT c.*
    FROM company_claim_request ccr
    LEFT JOIN users ur ON ccr.claimed_by = ur.user_id
    LEFT JOIN company c ON ccr.company_id = c.ID
    WHERE ccr.claimed_by = ?`;
    const get_user_company_value = [user_ID];

    return new Promise((resolve, reject) => {
        db.query(get_user_company_query, get_user_company_value, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result[0]);
          }
        });
    });

}

module.exports = {
    getUser,
    getUserMeta,
    getCountries,
    getUserRoles,
    getStatesByUserID,
    getAllCompany,
    getCompany,
    getCompanyCategory,
    renderCategoryTreeHTML,
    getCompanyCategoryBuID,
    saveUserGoogleLoginDataToDB,
    saveUserFacebookLoginDataToDB,
    getAllRatingTags,
    getReviewRatingData,
    getMetaValue,
    insertIntoFaqPages,
    insertIntoFaqCategories,
    insertIntoFaqItems,
    createCompany,
    createReview,
    getlatestReviews,
    getAllReviews,
    getCustomerReviewData,
    getCustomerReviewTagRelationData,
    editCustomerReview,
    searchCompany,
    getCompanyReviewNumbers,
    getCompanyReviews,
    getUsersByRole,
    getUserCompany
};
