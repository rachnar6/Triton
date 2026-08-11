// backend/models/Request.js
const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    senior: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['GROCERIES', 'MEDICINE', 'COMPANIONSHIP', 'TRANSPORT', 'FIX BULBS', 'OTHER'],
      required: true,
    },
    description: { type: String, required: true },
    addressText: { type: String, required: true },
    city: { type: String, required: true },
    urgency: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    status: {
      type: String,
      enum: ['OPEN', 'ACCEPTED', 'COMPLETED', 'CANCELLED'],
      default: 'OPEN',
    },
    assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Request', requestSchema);