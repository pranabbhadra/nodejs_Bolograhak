const db = require('./config');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });
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
    categories.forEach(function(category) {
      html += '<li class="mt-5"><div class="mb-5"><div class="form-check"><input type="checkbox" name="category" class="form-check-input" value="'+ category.id +'"><label class="form-check-label" for="flexCheckDefault">'+ category.name +'</label>';
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
      
      const com_category_array = com_categories.map( (category) => category.category_id );

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
    categories.forEach(function(category) {
      if(com_category_array.includes(category.id)){
        var  inputchecked = 'checked';
      }else{
        var inputchecked = '';
      }
      html += '<li class="mt-5"><div class="mb-5"><div class="form-check"><input type="checkbox" name="category" class="form-check-input" value="'+ category.id +'" '+ inputchecked +'><label class="form-check-label" for="flexCheckDefault">'+ category.name +'</label>';
      if (category.children.length > 0) {
        html += renderCategoryTreeHTMLforCompany(category.children, com_category_array);
      }
      html += '</div></div></li>';
    });
    html += '</ul>';
    return html;
}

//-------After Google Login Save User data Or Check User exist or Not.
const saveUserGoogleDataToDB = (userData) => {
  console.log(userData.name.familyName+' '+userData.name.givenName+' '+userData.emails[0].value+' '+userData.photos[0].value);
};

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
    saveUserGoogleDataToDB
};