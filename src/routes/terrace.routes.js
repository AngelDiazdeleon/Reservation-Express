const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const Terrace = require('../models/Terrace');
const TerraceController = require('../controllers/terrace.controller');
const imageService = require('../services/image.service');
const { requireAuth, requireRole } = require('../middleware/auth'); // ✅ NUEVO

const controller = new TerraceController(Terrace, imageService);

// ✅ NUEVO: Ruta para terrazas del propietario
router.get('/my/terraces', requireAuth, controller.getOwnerTerraces);

// POST multipart/form-data con campo 'images' (hasta 5 archivos)
router.post('/', requireAuth, requireRole('host'), upload.array('images', 5), controller.createTerrace); // ✅ AGREGADO requireAuth
router.get('/', controller.getTerraces);
router.get('/:id', controller.getTerraceById);
router.put('/:id', requireAuth, upload.array('images', 5), controller.updateTerrace); // ✅ AGREGADO requireAuth
router.delete('/:id', requireAuth, controller.deleteTerrace); // ✅ AGREGADO requireAuth

// Ruta para publicar/activar la terraza (solo admin)
router.patch('/:id/publish', requireAuth, requireRole('admin'), controller.publishTerrace);

module.exports = router;