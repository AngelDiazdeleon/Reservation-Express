const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  terrace: { type: mongoose.Schema.Types.ObjectId, ref: "Terrace", required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String },
  guests: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  commissionAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "completed"],
    default: "pending",
  },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid", "refunded"],
    default: "unpaid",
  },
}, { timestamps: true });

module.exports = mongoose.model("Reservation", reservationSchema);