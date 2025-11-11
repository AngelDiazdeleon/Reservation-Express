const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const controller = new AdminController();

// ✅ Rutas de administración
router.get('/dashboard/stats', requireAuth, requireRole('admin'), controller.getDashboardStats);
router.get('/publication-requests', requireAuth, requireRole('admin'), controller.getAllPublicationRequests);
router.patch('/publication-requests/:id/status', requireAuth, requireRole('admin'), express.json(), controller.updatePublicationRequestStatus);
router.get('/users', requireAuth, requireRole('admin'), controller.getAllUsers);
router.patch('/users/:id/role', requireAuth, requireRole('admin'), express.json(), controller.updateUserRole);

module.exports = router;