const mysql = require('mysql2/promise');
const dotenv = require('dotenv');


dotenv.config({ path: './.env' });
// Create a MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

async function buildCategoryTree() {
  const connection = await pool.getConnection();

  try {
    // Fetch categories from the database
    const [categories] = await connection.query('SELECT * FROM category');

    // Recursive function to build the category tree
    function buildTree(parentId = 0) {
      const categoryTree = [];

      categories.forEach((category) => {
        if (category.parent_id === parentId) {
          const children = buildTree(category.ID);
          const categoryNode = { id: category.ID, name: category.category_name, children };
          categoryTree.push(categoryNode);
        }
      });

      return categoryTree;
    }

    // Build the category tree
    const categoryTree = buildTree();

    return categoryTree;
  } finally {
    // Release the database connection
    connection.release();
  }
}

// Usage example
buildCategoryTree()
  .then((categoryTree) => {
    console.log(categoryTree);
  })
  .catch((error) => {
    console.error('Error building category tree:', error);
  });
