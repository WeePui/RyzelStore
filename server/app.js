const express = require('express');
const app = express();

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const dotenv = require('dotenv');
// Set up file config
dotenv.config({ path: 'backend/config/config.env' });

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Import all the routes
const auth = require('./routers/authRouter');

app.use('/api/v1', auth);

// Middleware to handle errors

module.exports = app;
