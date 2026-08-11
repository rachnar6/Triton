const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema(
  {
    volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true }, // 1-12
    label: { type: String, required: true }, // e.g. "Jul 2026"
    coins: { type: Number, required: true },
    amount: { type: Number, required: true }, // coins * coin value, snapshotted at claim time
    status: {
      type: String,
      enum: ['CLAIM_REQUESTED', 'PAID', 'REJECTED'],
      default: 'CLAIM_REQUESTED',
    },
    requestedAt: { type: Date, default: Date.now },
    paidAt: { type: Date },
    paymentRef: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },
  },
  { timestamps: true }
);

// Hard stop against double-claiming the same month — enforced at the DB
// level, not just in route logic.
payoutSchema.index(
  { volunteer: 1, year: 1, month: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'REJECTED' } } }
);

module.exports = mongoose.model('Payout', payoutSchema);