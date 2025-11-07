const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');

let gfs;

const connectDB = async () => {
    const client = await MongoClient.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    const db = client.db(process.env.DB_NAME);
    gfs = Grid(db, mongoose.mongo);
    gfs.collection('uploads');
};

const uploadImage = async (file) => {
    const writestream = gfs.createWriteStream({
        filename: file.filename,
        content_type: file.mimetype,
    });

    fs.createReadStream(file.path).pipe(writestream);

    return new Promise((resolve, reject) => {
        writestream.on('close', (file) => {
            fs.unlinkSync(file.path); // Remove the file from the uploads folder
            resolve(file);
        });

        writestream.on('error', (err) => {
            reject(err);
        });
    });
};

const getImage = async (filename) => {
    return new Promise((resolve, reject) => {
        gfs.files.findOne({ filename }, (err, file) => {
            if (!file || file.length === 0) {
                return reject('No file exists');
            }

            const readstream = gfs.createReadStream(file.filename);
            resolve(readstream);
        });
    });
};

module.exports = {
    connectDB,
    uploadImage,
    getImage,
};