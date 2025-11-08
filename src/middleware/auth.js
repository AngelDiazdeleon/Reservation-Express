// auth.js
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Normaliza payload: soporta payload.id o payload.sub
    req.user = {
      id: payload.id || payload.sub,
      role: payload.role || payload.userRole || payload.roleName
    };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

function requireRole(roleOrArray) {
  const roles = Array.isArray(roleOrArray) ? roleOrArray : [roleOrArray];
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'No autenticado' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'No autorizado' });
    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
