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
    this.getMyRequests = this.getMyRequests.bind(this); // ✅ NUEVO
  }

  // owner submits request; req.user must exist (requireAuth) and be host (requireRole)
  async create(req, res) {
    try {
      const ownerId = req.user.id; // ✅ MEJORADO - Siempre del usuario autenticado
      
      // multer fields: photos[] and documents[]
      const files = req.files || {};
      const photosFiles = files.photos || [];
      const docsFiles = files.documents || [];

      const uploadedPhotos = await Promise.all(photosFiles.map(f => this.imageService.uploadImage(f)));
      const uploadedDocs = await Promise.all(docsFiles.map(f => this.imageService.uploadImage(f)));

      // ✅ ACTUALIZADO con documentType
      const photos = uploadedPhotos.map(u => ({ 
        fileId: u.fileId, 
        filename: u.filename, 
        mimetype: u.mimetype || '',
        fileType: 'image'
      }));

      const documents = uploadedDocs.map((u, index) => ({ 
        fileId: u.fileId, 
        filename: u.filename, 
        mimetype: u.mimetype || '',
        fileType: 'document',
        documentType: req.body.documentTypes ? req.body.documentTypes[index] : 'other' // ✅ NUEVO
      }));

      // ✅ ACTUALIZADO con todos los nuevos campos
      const terraceData = {
        name: req.body.name,
        description: req.body.description,
        capacity: parseInt(req.body.capacity),
        location: req.body.location,
        price: parseFloat(req.body.price),
        contactPhone: req.body.contactPhone,
        contactEmail: req.body.contactEmail,
        amenities: req.body.amenities ? JSON.parse(req.body.amenities) : []
      };

      const request = new PublicationRequest({
        owner: ownerId,
        terraceData,
        photos,
        documents,
        userNotes: req.body.userNotes || '' // ✅ NUEVO - Notas opcionales del usuario
      });

      await request.save();
      
      // ✅ NUEVO: Populate para mejor respuesta
      await request.populate('owner', 'name email');
      
      res.status(201).json({ 
        success: true, 
        message: 'Solicitud enviada para revisión',
        data: request 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error creando solicitud', error: err.message });
    }
  }

  // ✅ NUEVO: Obtener mis propias solicitudes
  async getMyRequests(req, res) {
    try {
      const ownerId = req.user.id;
      const requests = await PublicationRequest.find({ owner: ownerId })
        .sort({ createdAt: -1 })
        .populate('reviewedBy', 'name email');
      
      res.json({ success: true, data: requests });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error obteniendo solicitudes', error: err.message });
    }
  }

  // admin lists requests (filter by status optional)
  async list(req, res) {
    try {
      const status = req.query.status;
      const filter = status ? { status } : {};
      const list = await PublicationRequest.find(filter)
        .populate('owner', 'email name phone')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 });
      
      res.json({ success: true, data: list });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error obteniendo lista', error: err.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'ID inválido' });
      }
      
      const reqDoc = await PublicationRequest.findById(id)
        .populate('owner', 'email name phone')
        .populate('reviewedBy', 'name email');
        
      if (!reqDoc) return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
      
      res.json({ success: true, data: reqDoc });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error obteniendo solicitud', error: err.message });
    }
  }

  // approve -> crea la terraza con los datos y fotos (publicada)
  async approve(req, res) {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body; // ✅ NUEVO - Notas del admin
      
      const request = await PublicationRequest.findById(id);
      if (!request) {
        return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
      }
      
      if (request.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Solicitud no está pendiente' });
      }

      const tdata = request.terraceData || {};
      
      // ✅ ACTUALIZADO con nueva estructura de Terrace
      const terrace = new Terrace({
        name: tdata.name,
        description: tdata.description,
        capacity: tdata.capacity,
        location: tdata.location,
        price: tdata.price,
        contactPhone: tdata.contactPhone,
        contactEmail: tdata.contactEmail,
        amenities: tdata.amenities || [],
        images: request.photos.map(p => ({
          fileId: p.fileId,
          filename: p.filename,
          mimetype: p.mimetype,
          isMain: false
        })),
        owner: request.owner,
        status: 'published',
        publicationRequest: request._id
      });

      await terrace.save();

      // ✅ ACTUALIZADO con más campos
      request.status = 'approved';
      request.adminNotes = adminNotes || '';
      request.reviewedBy = req.user.id;
      request.reviewedAt = new Date();
      request.terrace = terrace._id; // ✅ NUEVO - Relación directa
      await request.save();

      // TODO: Enviar notificación al usuario
      // await this.sendApprovalNotification(request, terrace);

      res.json({ 
        success: true, 
        message: 'Solicitud aprobada y terraza publicada',
        data: { request, terrace } 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error aprobando solicitud', error: err.message });
    }
  }

  // reject -> borrar fotos y docs de GridFS y marcar rejected
  async reject(req, res) {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body; // ✅ ACTUALIZADO nombre
      
      const request = await PublicationRequest.findById(id);
      if (!request) {
        return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
      }
      
      if (request.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Solicitud no está pendiente' });
      }

      // ✅ OPCIONAL: Borrar archivos de GridFS (puedes comentar si quieres mantenerlos)
      /*
      const toDelete = [];
      if (request.photos && request.photos.length) toDelete.push(...request.photos.map(p => p.fileId));
      if (request.documents && request.documents.length) toDelete.push(...request.documents.map(d => d.fileId));

      await Promise.all(toDelete.map(fid => this.imageService.deleteImage(fid).catch(() => {})));
      */

      // ✅ ACTUALIZADO con más campos
      request.status = 'rejected';
      request.adminNotes = adminNotes || '';
      request.reviewedBy = req.user.id;
      request.reviewedAt = new Date();
      // ✅ Mantenemos los archivos por si necesitan revisión posterior
      await request.save();

      // TODO: Enviar notificación al usuario
      // await this.sendRejectionNotification(request);

      res.json({ 
        success: true, 
        message: 'Solicitud rechazada',
        data: request 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error rechazando solicitud', error: err.message });
    }
  }
}

module.exports = PublicationRequestController;