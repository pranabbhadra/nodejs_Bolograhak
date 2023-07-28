const util = require('util');
const db = require('./config');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const useragent = require('useragent');
const requestIp = require('request-ip');
const axios = require('axios');

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
            JOIN countries c ON user_meta.country = c.id
            JOIN states s ON user_meta.state = s.id
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
          const userCountryId = result[0].country.toString();
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
    db.query('SELECT * FROM company', (err, result) => {
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

    const userRegistrationData = {
      username: userData.emails[0].value,
      email: userData.emails[0].value,
      password: userData.emails[0].value,
      first_name: userData.name.givenName,
      last_name: userData.name.familyName,
      node_userID: registeredUserID,
      profile_pic: userData.photos[0].value
    };

    try {
      const response = await axios.post(process.env.BLOG_API_ENDPOINT + '/register', userRegistrationData);
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

};

//-------After Facebook Login Save User data Or Check User exist or Not.
const saveUserFacebookLoginDataToDB = (userData) => {
  console.log(userData);
  console.log(userData.id + ' ' + userData.displayName + ' ' + userData.photos[0].value);
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
    const insertQuery = 'INSERT INTO faq_pages (title, content, meta_title, meta_desc, keyword) VALUES (?, ?, ?, ?, ?)';
    const results = await query(insertQuery, data);
    return results.insertId;
    
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
    insertIntoFaqItems
};