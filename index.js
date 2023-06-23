const express = require('express');
const path = require('path');
const mysql = require('mysql');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

dotenv.config({ path: './.env' });

const app = express();
const publicPath = path.join(__dirname,'public');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
})

db.connect( (err)=>{
    if(err){
        console.log(err);
    }else{
        console.log('DB Connected.')
    }
})

app.use(cookieParser());
app.use(express.static(publicPath));
app.set('view engine','ejs');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Define Routes
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));

app.listen(5000);