const express = require('express');
const router = express.Router();
const terraceController = require('../controllers/terraceController');
const upload = require('../middleware/upload');

// Route to create a new terrace
router.post('/', upload.single('image'), terraceController.createTerrace);

// Route to get all terraces
router.get('/', terraceController.getAllTerraces);

// Route to get a specific terrace by ID
router.get('/:id', terraceController.getTerraceById);

// Route to update a terrace by ID
router.put('/:id', upload.single('image'), terraceController.updateTerrace);

// Route to delete a terrace by ID
router.delete('/:id', terraceController.deleteTerrace);

module.exports = router;