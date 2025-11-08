require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const imageService = require('./services/image.service');

const PORT = process.env.PORT || 4001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'reservationExpress';

async function start() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: DB_NAME, useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB conectado via mongoose:', mongoose.connection.name);

    imageService.initFromMongooseDb(mongoose.connection.db);
    console.log('GridFS inicializado');

    app.listen(PORT, () => console.log(`API corriendo en http://localhost:${PORT} — CORS -> ${process.env.FRONTEND_ORIGIN || 'http://localhost:4000'}`));
  } catch (err) {
    console.error('Error arrancando server:', err);
    process.exit(1);
  }
}

start();
