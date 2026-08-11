const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    senior: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    invitedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category: { type: String, required: true },
    description: { type: String, required: true },
    urgency: { type: String, default: 'MEDIUM' },
    streetHint: String,
    status: {
      type: String,
      enum: ['PENDING', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
    city: String,
    subRegion: String,
    addressText: String,
    verificationPin: String,
    rating: Number,
    reviewText: String,
    reviewMedia: [String],

    // Lifecycle timestamps — these were being set in routes but silently
    // dropped by Mongoose strict mode because they weren't declared here.
    assignedAt: Date,
    pinVerifiedAt: Date,
    completedAt: Date,

    location: {
      type: { type: String, default: 'Point' },
      coordinates: [Number], // [longitude, latitude]
    },
    volunteerLocation: {
      latitude: Number,
      longitude: Number,
      updatedAt: Date,
    },
    messages: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        senderName: String,
        text: String,
        type: { type: String, enum: ['TEXT', 'VOICE'], default: 'TEXT' },
        audioUrl: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true } // adds createdAt + updatedAt automatically, keeps them in sync
);

// Powers the $near query in requests.js /feed
taskSchema.index({ location: '2dsphere' });

// Belt-and-suspenders: completedAt can never drift from status now that
// the field actually persists.
taskSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'COMPLETED' && !this.completedAt) {
      this.completedAt = new Date();
    }
    if (this.status !== 'COMPLETED') {
      this.completedAt = undefined;
    }
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);