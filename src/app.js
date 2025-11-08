const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const terraceRoutes = require('./routes/terrace.routes');
const imageRoutes = require('./routes/image.routes');
const permissionRoutes = require('./routes/permission.routes');

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:4000';

const app = express();

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// servir carpeta uploads (temporal)
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => res.json({ ok: true, name: 'Reservation Express API' }));

app.use('/api/terraces', terraceRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/permissions', permissionRoutes);

module.exports = app;