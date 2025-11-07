const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const terraceRoutes = require('./routes/terraceRoutes');
const { connectDB } = require('./config/db');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/terraces', terraceRoutes);

module.exports = app;