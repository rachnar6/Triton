const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    seniorName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    media: { type: [String], default: [] }, // image/video URLs or Base64 strings
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    phone: { type: String, required: true },
    role: { type: String, enum: ['SENIOR', 'VOLUNTEER', 'ADMIN'], required: true },
    city: { type: String, required: true },
    subRegion: { type: String, default: '' }, // e.g. "Palayamkottai", "Vannarpettai", "Melapalayam"
    addressText: { type: String, required: true },
    googleId: { type: String },
    profilePicture: { type: String },

    // Add inside userSchema definition:
    fcmToken: {
      type: String,
    default: '',
    },

    // GeoJSON Point: [longitude, latitude]
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    notificationPreferences: {
      emailAlerts: { type: Boolean, default: true },
      smsAlerts: { type: Boolean, default: true },
      taskUpdates: { type: Boolean, default: true },
    },

    // Volunteer-only fields
    idProofUrl: { type: String },
    aadhaarNumber: { type: String, trim: true },
    verificationStatus: {
      type: String,
      enum: ['NOT_SUBMITTED', 'PENDING', 'VERIFIED', 'REJECTED'],
      default: 'NOT_SUBMITTED',
    },
    isVerified: { type: Boolean, default: false }, // government ID verified by admin
    isBlocked: { type: Boolean, default: false },
    hoursVolunteered: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    badges: { type: [String], default: [] },
    // Reviews left by seniors after a completed task. Without this field
    // declared here, Mongoose's default strict mode silently drops any
    // `volunteer.reviews.push(...)` on save — nothing is persisted, and
    // GET /nearby-volunteers always sees an empty array.
    reviews: { type: [ReviewSchema], default: [] },

    // Senior-only fields
    emergencyContactName: { type: String },
    emergencyContactPhone: { type: String },
  },
  { timestamps: true }
);

UserSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', UserSchema);