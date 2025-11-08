const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const imageService = require('../services/image.service');
const PublicationRequestController = require('../controllers/publicationRequest.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const controller = new PublicationRequestController(imageService);

// Owner (host) crea solicitud — formulario multipart:
// campos: name, description, capacity, price, contact, etc.
// archivos: photos[] (hasta 5) y documents[] (hasta 5)
router.post(
  '/',
  requireAuth,
  requireRole('host'),
  upload.fields([
    { name: 'photos', maxCount: 5 },
    { name: 'documents', maxCount: 5 }
  ]),
  controller.create
);

// Admin routes
router.get('/', requireAuth, requireRole('admin'), controller.list);
router.get('/:id', requireAuth, requireRole('admin'), controller.getById);
router.patch('/:id/approve', requireAuth, requireRole('admin'), controller.approve);
router.patch('/:id/reject', requireAuth, requireRole('admin'), express.json(), controller.reject);

module.exports = router;