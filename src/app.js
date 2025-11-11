const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const terraceRoutes = require('./routes/terrace.routes');
const imageRoutes = require('./routes/image.routes');
const permissionRoutes = require('./routes/permission.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// servir carpeta uploads (temporal)
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => res.json({ ok: true, name: 'Reservation Express API' }));

app.use('/api/auth', authRoutes);
app.use('/api/terraces', terraceRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/permissions', permissionRoutes);

module.exports = app;