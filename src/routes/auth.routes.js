const { Router } = require("express");
const {
  register,
  login,
  profile
} = require("../controllers/auth.controller.js");
const { requireAuth } = require("../middleware/auth.js");

const router = Router();

// Registro de usuario (client, host, admin)
router.post("/register", register);

// Login y generación de token
router.post("/login", login);

// Perfil del usuario autenticado
router.get("/me", requireAuth, profile);

module.exports = router;
