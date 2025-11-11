const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
  createReservation,
  confirmReservation,
} = require("../controllers/Reservation.controller");

const router = express.Router();

router.post("/", requireAuth, createReservation);
router.patch("/:id/confirm", requireAuth, requireRole("admin"), confirmReservation);

module.exports = router;