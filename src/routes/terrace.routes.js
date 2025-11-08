const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const Terrace = require('../models/Terrace');
const TerraceController = require('../controllers/terrace.controller');
const imageService = require('../services/image.service');

const controller = new TerraceController(Terrace, imageService);

// POST multipart/form-data con campo 'images' (hasta 5 archivos)
router.post('/', upload.array('images', 5), controller.createTerrace);
router.get('/', controller.getTerraces);
router.get('/:id', controller.getTerraceById);
router.put('/:id', upload.array('images', 5), controller.updateTerrace);
router.delete('/:id', controller.deleteTerrace);

module.exports = router;