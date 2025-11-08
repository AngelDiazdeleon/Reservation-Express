const mongoose = require('mongoose');
const PublicationRequest = require('../models/PublicationRequest');
const Terrace = require('../models/Terrace');

class PublicationRequestController {
  constructor(imageService) {
    this.imageService = imageService;
    this.create = this.create.bind(this);
    this.list = this.list.bind(this);
    this.getById = this.getById.bind(this);
    this.approve = this.approve.bind(this);
    this.reject = this.reject.bind(this);
  }

  // owner submits request; req.user must exist (requireAuth) and be host (requireRole)
  async create(req, res) {
    try {
      const ownerId = req.user && req.user.id ? req.user.id : req.body.owner;
      if (!ownerId) return res.status(400).json({ message: 'owner required' });

      // multer fields: photos[] and documents[]
      const files = req.files || {};
      const photosFiles = files.photos || [];
      const docsFiles = files.documents || [];

      const uploadedPhotos = await Promise.all(photosFiles.map(f => this.imageService.uploadImage(f)));
      const uploadedDocs = await Promise.all(docsFiles.map(f => this.imageService.uploadImage(f)));

      const photos = uploadedPhotos.map(u => ({ fileId: u.fileId, filename: u.filename, mimetype: u.mimetype || '' }));
      const documents = uploadedDocs.map(u => ({ fileId: u.fileId, filename: u.filename, mimetype: u.mimetype || '' }));

      const terraceData = {
        name: req.body.name,
        description: req.body.description,
        capacity: req.body.capacity,
        location: req.body.location,
        price: req.body.price,
        contact: req.body.contact,
        // any other fields from form
      };

      const request = new PublicationRequest({
        owner: ownerId,
        terraceData,
        photos,
        documents
      });

      await request.save();
      res.status(201).json({ success: true, data: request });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // admin lists requests (filter by status optional)
  async list(req, res) {
    try {
      const status = req.query.status;
      const filter = status ? { status } : {};
      const list = await PublicationRequest.find(filter).populate('owner', 'email name');
      res.json({ success: true, data: list });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'ID inválido' });
      const reqDoc = await PublicationRequest.findById(id).populate('owner', 'email name');
      if (!reqDoc) return res.status(404).json({ message: 'No encontrado' });
      res.json({ success: true, data: reqDoc });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  // approve -> crea la terraza con los datos y fotos (publicada)
  async approve(req, res) {
    try {
      const { id } = req.params;
      const request = await PublicationRequest.findById(id);
      if (!request) return res.status(404).json({ message: 'Solicitud no encontrada' });
      if (request.status !== 'pending') return res.status(400).json({ message: 'Solicitud no está en estado pending' });

      const tdata = request.terraceData || {};
      const terrace = new Terrace({
        name: tdata.name,
        description: tdata.description,
        capacity: tdata.capacity,
        location: tdata.location,
        price: tdata.price,
        contact: tdata.contact,
        images: request.photos.map(p => p.fileId),
        isPublished: true
      });

      await terrace.save();

      request.status = 'approved';
      request.reviewedBy = req.user && req.user.id;
      request.reviewedAt = new Date();
      await request.save();

      res.json({ success: true, data: { request, terrace } });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  // reject -> borrar fotos y docs de GridFS y marcar rejected
  async reject(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const request = await PublicationRequest.findById(id);
      if (!request) return res.status(404).json({ message: 'Solicitud no encontrada' });
      if (request.status !== 'pending') return res.status(400).json({ message: 'Solicitud no está en estado pending' });

      // borrar fotos y documentos de GridFS
      const toDelete = [];
      if (request.photos && request.photos.length) toDelete.push(...request.photos.map(p => p.fileId));
      if (request.documents && request.documents.length) toDelete.push(...request.documents.map(d => d.fileId));

      await Promise.all(toDelete.map(fid => this.imageService.deleteImage(fid).catch(() => {})));

      request.status = 'rejected';
      request.notes = notes || '';
      request.reviewedBy = req.user && req.user.id;
      request.reviewedAt = new Date();
      request.photos = [];
      request.documents = [];
      await request.save();

      res.json({ success: true, data: request });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = PublicationRequestController;