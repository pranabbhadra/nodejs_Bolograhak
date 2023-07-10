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
      console.log(categories);
      connection.end();
    //   const categories = [
    //     { id: 1, name: 'Electronics', parentId: 0 },
    //     { id: 2, name: 'Mobile Phones', parentId: 1 },
    //     { id: 3, name: 'Laptops', parentId: 1 },
    //     { id: 4, name: 'Clothing', parentId: 0 },
    //     { id: 5, name: 'Men\'s Clothing', parentId: 4 },
    //     { id: 6, name: 'Women\'s Clothing', parentId: 4 },
    //     // Add more categories and subcategories as needed
    //   ];
      const nestedCategories = buildCategoryTree(categories);
      return nestedCategories;
    } catch (error) {
      throw new Error('Error fetching company categories');
    }
}
  
// function constructNestedCategories(categories) {
//     const nestedCategoriesMap = {};
//     const nestedCategories = [];
  
//     categories.forEach((category) => {
//       const categoryId = category.ID;
//       const parentId = category.parent_id;
  
//       const newCategory = {
//         id: categoryId,
//         category_name: category.category_name,
//         category_img: category.category_img,
//         children: [],
//       };
//       console.log(newCategory);

//       if (!parentId || parentId === 0) {
//         nestedCategories.push(newCategory);
//         console.log('aaa');
//       } else {
//         if (!nestedCategoriesMap[parentId]) {
//           nestedCategoriesMap[parentId] = [];
//         }
//         nestedCategoriesMap[parentId].push(newCategory);
//         console.log('kkk',nestedCategoriesMap);
//       }

//       if (nestedCategoriesMap[categoryId]) {
//         newCategory.children = nestedCategoriesMap[categoryId];
//       }
//     });
  
//     categories.forEach((category) => {
//       const categoryId = category.id;
//       const parentId = category.parent_id;
  
//       if (parentId && nestedCategoriesMap[categoryId]) {
//         nestedCategoriesMap[parentId].forEach((parentCategory) => {
//           parentCategory.children.push(...nestedCategoriesMap[categoryId]);
//         });
//       }
//     });
  
//     return nestedCategories;
//   }
  
function buildCategoryTree(categories, parentId = 0) {
    const categoryTree = [];
    
    categories.forEach((category) => {
      if (category.parent_id === parentId) {
        const children = buildCategoryTree(categories, category.ID);
        const categoryNode = { id: category.ID, name: category.category_name, children };
        categoryTree.push(categoryNode);
      }
    });
    
    return categoryTree;
}
  

module.exports = {
    getUser,
    getUserMeta,
    getCountries,
    getUserRoles,
    getStatesByUserID,
    getAllCompany,
    getCompany,
    getCompanyCategory
};