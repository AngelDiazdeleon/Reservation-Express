const mongoose = require('mongoose');
const PublicationRequest = require('../models/PublicationRequest');
const Terrace = require('../models/Terrace');
const User = require('../models/User');

class AdminController {
  constructor() {
    this.getDashboardStats = this.getDashboardStats.bind(this);
    this.getAllPublicationRequests = this.getAllPublicationRequests.bind(this);
    this.updatePublicationRequestStatus = this.updatePublicationRequestStatus.bind(this);
    this.getAllUsers = this.getAllUsers.bind(this);
    this.updateUserRole = this.updateUserRole.bind(this);
  }

  // ✅ Estadísticas del dashboard
  async getDashboardStats(req, res) {
    try {
      const [
        totalTerraces,
        publishedTerraces,
        pendingRequests,
        totalUsers,
        recentRequests
      ] = await Promise.all([
        Terrace.countDocuments(),
        Terrace.countDocuments({ status: 'published' }),
        PublicationRequest.countDocuments({ status: 'pending' }),
        User.countDocuments(),
        PublicationRequest.find({ status: 'pending' })
          .populate('owner', 'name email')
          .sort({ createdAt: -1 })
          .limit(5)
      ]);

      res.json({
        success: true,
        data: {
          totalTerraces,
          publishedTerraces,
          pendingRequests,
          totalUsers,
          recentRequests
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error fetching stats', error: err.message });
    }
  }

  // ✅ Todas las solicitudes de publicación con filtros
  async getAllPublicationRequests(req, res) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const filter = status ? { status } : {};
      
      const requests = await PublicationRequest.find(filter)
        .populate('owner', 'name email phone')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await PublicationRequest.countDocuments(filter);

      res.json({
        success: true,
        data: requests,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          totalRecords: total
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error fetching requests', error: err.message });
    }
  }

  // ✅ Aprobar/rechazar solicitud con notificación
  async updatePublicationRequestStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      const adminId = req.user.id;

      if (!['approved', 'rejected', 'under_review'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Estado inválido' });
      }

      const request = await PublicationRequest.findById(id);
      if (!request) {
        return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
      }

      // Si se aprueba, crear la terraza
      if (status === 'approved') {
        const terrace = new Terrace({
          ...request.terraceData,
          images: request.photos.map(p => p.fileId),
          owner: request.owner,
          status: 'published',
          publicationRequest: request._id
        });

        await terrace.save();
        
        // Actualizar la solicitud con referencia a la terraza
        request.terrace = terrace._id;
      }

      // Si se rechaza, limpiar archivos
      if (status === 'rejected') {
        // Opcional: eliminar archivos de GridFS
        // await this.cleanupRequestFiles(request);
      }

      // Actualizar estado de la solicitud
      request.status = status;
      request.adminNotes = adminNotes;
      request.reviewedBy = adminId;
      request.reviewedAt = new Date();
      request.notificationSent = false; // Para enviar notificación después

      await request.save();

      // TODO: Enviar notificación al usuario
      // await this.sendStatusNotification(request);

      res.json({ success: true, data: request });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error updating request', error: err.message });
    }
  }

  // ✅ Gestión de usuarios
  async getAllUsers(req, res) {
    try {
      const { role, page = 1, limit = 10 } = req.query;
      const filter = role ? { role } : {};
      
      const users = await User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await User.countDocuments(filter);

      res.json({
        success: true,
        data: users,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          totalRecords: total
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error fetching users', error: err.message });
    }
  }

  // ✅ Cambiar rol de usuario
  async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['client', 'host', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Rol inválido' });
      }

      const user = await User.findByIdAndUpdate(
        id,
        { role },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }

      res.json({ success: true, data: user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error updating user role', error: err.message });
    }
  }
}

module.exports = AdminController;