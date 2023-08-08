const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
    // host:'',
    // user: 'root',
    // password: '',
    // database: 'bolograhak'
})

const util = require('util');
const query = util.promisify(db.query).bind(db);
db.connect((err) => {
    if (err) {
        console.log(err);
    } else {
        const company_name_checking_query = "SELECT * FROM company";
        const company_name_checking_results = query(company_name_checking_query);
        console.log(company_name_checking_results);
        console.log('DB Connected.')
    }
})

module.exports = db;