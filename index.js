const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
//const db = require('./config');

dotenv.config({ path: './.env' });

const app = express();
const publicPath = path.join(__dirname, 'public');
const uploadsPath = path.join(__dirname, 'uploads');


app.use(cookieParser());
app.use(express.static(publicPath));
app.use(express.static(uploadsPath));
app.set('view engine', 'ejs');



app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Define Routes

app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));


app.listen(5000);