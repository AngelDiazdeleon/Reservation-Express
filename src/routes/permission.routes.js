// ...existing code...
const express = require('express');
const router = express.Router();
const controller = require('../controllers/permission.controller');

// Rutas CRUD para permisos (montar este router en /api/permissions)
router.post('/', controller.createPermission);
router.get('/', controller.getPermissions);
router.get('/:id', controller.getPermissionById);
router.put('/:id', controller.updatePermission);
router.delete('/:id', controller.deletePermission);

module.exports = router;
// ...existing code...