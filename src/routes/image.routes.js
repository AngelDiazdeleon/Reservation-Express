const express = require('express');
const router = express.Router();
const imageService = require('../services/image.service');

// GET /api/images/id/:id
router.get('/id/:id', (req, res) => {
  try {
    const stream = imageService.getImageStreamById(req.params.id);
    stream.on('error', () => res.status(404).end());
    stream.pipe(res);
  } catch (err) {
    res.status(404).json({ message: 'Image not found', error: err.message });
  }
});

// GET /api/images/name/:filename
router.get('/name/:filename', (req, res) => {
  try {
    const stream = imageService.getImageStreamByFilename(req.params.filename);
    stream.on('error', () => res.status(404).end());
    stream.pipe(res);
  } catch (err) {
    res.status(404).json({ message: 'Image not found', error: err.message });
  }
});

module.exports = router;