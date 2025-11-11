const Reservation = require("../models/Reservation");

exports.createReservation = async function(req, res) {
  const { terrace, date, timeSlot, guests, totalAmount } = req.body;
  const client = req.user.id; // ✅ CAMBIAR: req.userId → req.user.id

  try {
    const reservation = new Reservation({ 
      client, 
      terrace, 
      date, 
      timeSlot,
      guests,
      totalAmount,
      commissionAmount: totalAmount * 0.05
    });
    await reservation.save();
    res.status(201).json({ message: "Reserva creada", reservation });
  } catch (e) {
    res.status(500).json({ message: "Error al crear la reserva" });
  }
}

exports.confirmReservation = async function(req, res) {
  const { id } = req.params;
  try {
    const reservation = await Reservation.findByIdAndUpdate(id, {
      status: "confirmed",
      paymentStatus: "paid",
    }, { new: true });
    res.json({ message: "Reserva confirmada", reservation });
  } catch (e) {
    res.status(500).json({ message: "Error al confirmar la reserva" });
  }
}