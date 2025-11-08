const mongoose = require('mongoose');

class TerraceController {
  constructor(TerraceModel, imageService) {
    this.Terrace = TerraceModel;
    this.imageService = imageService;
    this.createTerrace = this.createTerrace.bind(this);
    this.getTerraces = this.getTerraces.bind(this);
    this.getTerraceById = this.getTerraceById.bind(this);
    this.updateTerrace = this.updateTerrace.bind(this);
    this.deleteTerrace = this.deleteTerrace.bind(this);
    this.publishTerrace = this.publishTerrace.bind(this);
  }

  async createTerrace(req, res) {
    try {
      const { name, description, capacity, location } = req.body;
      const files = req.files || [];

      const uploaded = await Promise.all(files.map(f => this.imageService.uploadImage(f)));
      const imageIds = uploaded.map(u => u.fileId);

      // isPublished por defecto es false (revisión pendiente)
      const terrace = new this.Terrace({
        name, description, capacity, location, images: imageIds
      });

      await terrace.save();
      res.status(201).json({ success: true, data: terrace });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error creating terrace', error: err.message });
    }
  }

  // Por defecto devuelve solo terrazas publicadas; para obtener todas usar ?all=true
  async getTerraces(req, res) {
    try {
      const showAll = req.query.all === 'true';
      const filter = showAll ? {} : { isPublished: true };
      const terraces = await this.Terrace.find(filter);
      res.json({ success: true, data: terraces });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error fetching terraces', error: err.message });
    }
  }

  async getTerraceById(req, res) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
      const terrace = await this.Terrace.findById(id);
      if (!terrace) return res.status(404).json({ success: false, message: 'Terraza no encontrada' });
      res.json({ success: true, data: terrace });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error', error: err.message });
    }
  }

  async updateTerrace(req, res) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

      const updates = req.body || {};
      const files = req.files || [];

      if (files.length > 0) {
        const uploaded = await Promise.all(files.map(f => this.imageService.uploadImage(f)));
        const newImageIds = uploaded.map(u => u.fileId);
        updates.images = (updates.images && Array.isArray(updates.images)) ? updates.images.concat(newImageIds) : newImageIds;
      }

      const updated = await this.Terrace.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
      if (!updated) return res.status(404).json({ success: false, message: 'Terraza no encontrada' });
      res.json({ success: true, data: updated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error updating terrace', error: err.message });
    }
  }

  async deleteTerrace(req, res) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

      const terrace = await this.Terrace.findByIdAndDelete(id);
      if (!terrace) return res.status(404).json({ success: false, message: 'Terraza no encontrada' });

      if (terrace.images && terrace.images.length) {
        await Promise.all(terrace.images.map(imgId => {
          return this.imageService.deleteImage(imgId).catch(() => {});
        }));
      }

      res.json({ success: true, message: 'Terraza eliminada' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error deleting terrace', error: err.message });
    }
  }

  // Ruta para publicar (aprobar) una terraza — ajustar para requerir auth/admin si quieres
  async publishTerrace(req, res) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

      const updated = await this.Terrace.findByIdAndUpdate(id, { isPublished: true }, { new: true });
      if (!updated) return res.status(404).json({ success: false, message: 'Terraza no encontrada' });
      res.json({ success: true, data: updated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error publishing terrace', error: err.message });
    }
  }
}

module.exports = TerraceController;