const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const { MongoClient } = require('mongodb');

let gfs;

const connectDB = async () => {
    const client = await MongoClient.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    const db = client.db(process.env.DB_NAME);
    gfs = Grid(db, mongoose.mongo);
    gfs.collection('uploads');
};

const uploadFile = (file) => {
    return new Promise((resolve, reject) => {
        const writestream = gfs.createWriteStream({
            filename: file.originalname,
            content_type: file.mimetype,
        });

        writestream.on('close', (file) => {
            resolve(file);
        });

        writestream.on('error', (err) => {
            reject(err);
        });

        writestream.write(file.buffer);
        writestream.end();
    });
};

const getFile = (filename) => {
    return new Promise((resolve, reject) => {
        gfs.files.findOne({ filename }, (err, file) => {
            if (err || !file) {
                return reject(err || new Error('File not found'));
            }
            const readstream = gfs.createReadStream(file);
            resolve(readstream);
        });
    });
};

module.exports = {
    connectDB,
    uploadFile,
    getFile,
};