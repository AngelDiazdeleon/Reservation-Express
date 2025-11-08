const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');
const path = require('path');
const fs = require('fs');

let bucket = null;

function initFromMongooseDb(db) {
  if (!db) throw new Error('Se necesita db de mongoose para inicializar GridFS');
  bucket = new GridFSBucket(db, { bucketName: 'uploads' });
  return bucket;
}

function uploadImage(file) {
  return new Promise((resolve, reject) => {
    if (!bucket) return reject(new Error('GridFS bucket no inicializado'));
    const readStream = fs.createReadStream(file.path);
    const uploadStream = bucket.openUploadStream(file.filename, { contentType: file.mimetype });
    readStream
      .pipe(uploadStream)
      .on('error', (err) => {
        try { fs.unlinkSync(file.path); } catch (e) {}
        reject(err);
      })
      .on('finish', () => {
        try { fs.unlinkSync(file.path); } catch (e) {}
        resolve({ fileId: uploadStream.id, filename: uploadStream.filename });
      });
  });
}

function getImageStreamById(id) {
  if (!bucket) throw new Error('GridFS bucket no inicializado');
  return bucket.openDownloadStream(ObjectId(id));
}

function getImageStreamByFilename(filename) {
  if (!bucket) throw new Error('GridFS bucket no inicializado');
  return bucket.openDownloadStreamByName(filename);
}

function deleteImage(id) {
  if (!bucket) throw new Error('GridFS bucket no inicializado');
  return new Promise((resolve, reject) => {
    bucket.delete(ObjectId(id), (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

module.exports = {
  initFromMongooseDb,
  uploadImage,
  getImageStreamById,
  getImageStreamByFilename,
  deleteImage
};