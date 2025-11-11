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
    this.getOwnerTerraces = this.getOwnerTerraces.bind(this); // ✅ NUEVO
  }

  async createTerrace(req, res) {
    try {
      const { name, description, capacity, location, price, contactPhone, contactEmail, amenities } = req.body;
      const files = req.files || [];
      const ownerId = req.user.id; // ✅ NUEVO - Usuario autenticado

      const uploaded = await Promise.all(files.map(f => this.imageService.uploadImage(f)));
      const images = uploaded.map(u => ({
        fileId: u.fileId,
        filename: u.filename,
        mimetype: u.mimetype,
        isMain: false // Por defecto, luego se puede cambiar
      }));

      // ✅ ACTUALIZADO con nuevos campos
      const terrace = new this.Terrace({
        name, 
        description, 
        capacity, 
        location, 
        price,
        contactPhone,
        contactEmail,
        amenities: amenities ? JSON.parse(amenities) : [],
        images,
        owner: ownerId, // ✅ NUEVO - Relación con dueño
        status: 'draft' // ✅ NUEVO - Estado inicial
      });

      await terrace.save();
      res.status(201).json({ success: true, data: terrace });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error creating terrace', error: err.message });
    }
  }

  // ✅ NUEVO: Obtener terrazas del propietario
  async getOwnerTerraces(req, res) {
    try {
      const ownerId = req.user.id;
      const terraces = await this.Terrace.find({ owner: ownerId });
      res.json({ success: true, data: terraces });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error fetching terraces', error: err.message });
    }
  }

  // Por defecto devuelve solo terrazas publicadas; para obtener todas usar ?all=true
  async getTerraces(req, res) {
    try {
      const showAll = req.query.all === 'true';
      const filter = showAll ? {} : { status: 'published' }; // ✅ ACTUALIZADO
      const terraces = await this.Terrace.find(filter).populate('owner', 'name email');
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
      const terrace = await this.Terrace.findById(id).populate('owner', 'name email phone');
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
      const ownerId = req.user.id; // ✅ NUEVO - Verificación de dueño
      
      if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

      // ✅ NUEVO: Verificar que el usuario es el dueño
      const existingTerrace = await this.Terrace.findById(id);
      if (!existingTerrace) return res.status(404).json({ success: false, message: 'Terraza no encontrada' });
      if (existingTerrace.owner.toString() !== ownerId) return res.status(403).json({ success: false, message: 'No autorizado' });

      const updates = req.body || {};
      const files = req.files || [];

      if (files.length > 0) {
        const uploaded = await Promise.all(files.map(f => this.imageService.uploadImage(f)));
        const newImages = uploaded.map(u => ({
          fileId: u.fileId,
          filename: u.filename,
          mimetype: u.mimetype,
          isMain: false
        }));
        updates.images = (updates.images && Array.isArray(updates.images)) ? updates.images.concat(newImages) : newImages;
      }

      const updated = await this.Terrace.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
      res.json({ success: true, data: updated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error updating terrace', error: err.message });
    }
  }

  async deleteTerrace(req, res) {
    try {
      const { id } = req.params;
      const ownerId = req.user.id; // ✅ NUEVO - Verificación de dueño
      
      if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

      // ✅ NUEVO: Verificar que el usuario es el dueño
      const terrace = await this.Terrace.findById(id);
      if (!terrace) return res.status(404).json({ success: false, message: 'Terraza no encontrada' });
      if (terrace.owner.toString() !== ownerId) return res.status(403).json({ success: false, message: 'No autorizado' });

      const deleted = await this.Terrace.findByIdAndDelete(id);
      
      // Eliminar imágenes de GridFS
      if (deleted.images && deleted.images.length) {
        await Promise.all(deleted.images.map(img => {
          return this.imageService.deleteImage(img.fileId).catch(() => {});
        }));
      }

      res.json({ success: true, message: 'Terraza eliminada' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error deleting terrace', error: err.message });
    }
  }

  // Ruta para publicar (aprobar) una terraza — solo admin
  async publishTerrace(req, res) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

      const updated = await this.Terrace.findByIdAndUpdate(
        id, 
        { status: 'published', isPublished: true }, 
        { new: true }
      );
      if (!updated) return res.status(404).json({ success: false, message: 'Terraza no encontrada' });
      res.json({ success: true, data: updated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error publishing terrace', error: err.message });
    }
  }
}

module.exports = TerraceController;