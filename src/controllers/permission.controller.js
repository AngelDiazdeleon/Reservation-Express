const mongoose = require('mongoose');
const Permission = require('../models/permission.model'); // Ajusta la ruta si tu modelo está en otra ubicación

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const handleError = (res, err) => {
    console.error(err);
    if (err.code === 11000) {
        return res.status(409).json({ success: false, message: 'Recurso duplicado', error: err.message });
    }
    return res.status(500).json({ success: false, message: 'Error del servidor', error: err.message });
};

// Crear permiso
exports.createPermission = async (req, res) => {
    try {
        const data = req.body;
        const permission = new Permission(data);
        await permission.save();
        return res.status(201).json({ success: true, data: permission });
    } catch (err) {
        return handleError(res, err);
    }
};

// Obtener lista de permisos
exports.getPermissions = async (req, res) => {
    try {
        const permissions = await Permission.find({});
        return res.status(200).json({ success: true, data: permissions });
    } catch (err) {
        return handleError(res, err);
    }
};

// Obtener permiso por id
exports.getPermissionById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
        const permission = await Permission.findById(id);
        if (!permission) return res.status(404).json({ success: false, message: 'Permiso no encontrado' });
        return res.status(200).json({ success: true, data: permission });
    } catch (err) {
        return handleError(res, err);
    }
};

// Actualizar permiso
exports.updatePermission = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
        const updates = req.body;
        const permission = await Permission.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!permission) return res.status(404).json({ success: false, message: 'Permiso no encontrado' });
        return res.status(200).json({ success: true, data: permission });
    } catch (err) {
        return handleError(res, err);
    }
};

// Eliminar permiso
exports.deletePermission = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
        const permission = await Permission.findByIdAndDelete(id);
        if (!permission) return res.status(404).json({ success: false, message: 'Permiso no encontrado' });
        return res.status(200).json({ success: true, message: 'Permiso eliminado' });
    } catch (err) {
        return handleError(res, err);
    }
};