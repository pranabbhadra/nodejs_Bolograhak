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

db.connect((err) => {
    if (err) {
        console.log(err);
    } else {
        console.log('DB Connected.')
    }
})

module.exports = db;