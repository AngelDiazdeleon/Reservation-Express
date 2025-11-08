const express = require('express');
const router = express.Router();
const imageService = require('../services/image.service');
const Terrace = require('../models/Terrace');
const mongoose = require('mongoose');

// GET /api/images/id/:id  -> solo si la terraza que referencia la imagen está publicada
router.get('/id/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(fileId)) return res.status(400).json({ message: 'ID inválido' });

    // buscar una terraza publicada que referencie esta imagen
    const terrace = await Terrace.findOne({ images: mongoose.Types.ObjectId(fileId), isPublished: true });
    if (!terrace) return res.status(404).json({ message: 'Image not available' });

    const stream = imageService.getImageStreamById(fileId);
    stream.on('error', () => res.status(404).end());
    stream.pipe(res);
  } catch (err) {
    res.status(404).json({ message: 'Image not found', error: err.message });
  }
});

// mantener ruta por filename si la necesitas (igual control)
router.get('/name/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    // encontrar terraza publicada que use este filename (opcional)
    const terrace = await Terrace.findOne({ isPublished: true, /* no es exacto si guardas solo ids */ });
    // si no guardas filename en Terrace, puedes omitir la comprobación por ahora
    const stream = imageService.getImageStreamByFilename(filename);
    stream.on('error', () => res.status(404).end());
    stream.pipe(res);
  } catch (err) {
    res.status(404).json({ message: 'Image not found', error: err.message });
  }
});

module.exports = router;