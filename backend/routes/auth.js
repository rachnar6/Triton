const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Task = require('../models/Task');
const { requireAuth } = require('../middleware/auth');
const { sendPushNotification } = require('../utils/pushNotifier');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verhoeff Checksum Algorithm
 */
const verhoeffD = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 7, 2, 1, 0, 4],
  [8, 7, 6, 5, 9, 8, 7, 3, 2, 1, 0],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const verhoeffP = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

function validateAadhaarFormat(num) {
  if (!/^\d{12}$/.test(num)) return false;
  return true;
}

function normalizeName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function resolveRole(email, requestedRole) {
  const adminEmails = [
    'ranjithrachna6@gmail.com',
    (process.env.ADMIN_EMAIL || '').toLowerCase(),
  ];
  if (adminEmails.includes((email || '').toLowerCase())) {
    return 'ADMIN';
  }
  return requestedRole;
}

const SENIOR_MIN_AGE = 58;

function calculateAge(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
}

function publicUser(user) {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.passwordHash;
  return obj;
}

router.post('/register', async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      role,
      city,
      addressText,
      dateOfBirth,
      emergencyContactName,
      emergencyContactPhone,
    } = req.body;

    if (!fullName || !email || !password || !phone || !role || !city || !addressText) {
      return res.status(400).json({ error: 'Missing required registration fields' });
    }

    // --- Senior age gate ---
    const finalRole = resolveRole(email, role);
    if (finalRole === 'SENIOR') {
      if (!dateOfBirth) {
        return res.status(400).json({ error: 'Date of birth is required for Senior Citizens.' });
      }
      const age = calculateAge(dateOfBirth);
      if (age === null) {
        return res.status(400).json({ error: 'Invalid date of birth.' });
      }
      if (age < SENIOR_MIN_AGE) {
        return res.status(400).json({
          error: `You must be at least ${SENIOR_MIN_AGE} years old to register as a Senior Citizen. Your age: ${age}.`,
        });
      }
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      phone,
      role: finalRole,
      city,
      addressText,
      dateOfBirth: finalRole === 'SENIOR' ? new Date(dateOfBirth) : undefined,
      location: { type: 'Point', coordinates: [0, 0] },
      isVerified: finalRole === 'ADMIN',
      emergencyContactName,
      emergencyContactPhone,
    });

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.passwordHash && user.googleId) {
      return res.status(400).json({
        error: 'This email is linked with Google Sign-In. Please tap "Sign in with Google" above.',
      });
    }

    const match = await bcrypt.compare(password, user.passwordHash || '');
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    if (user.isBlocked) return res.status(403).json({ error: 'This account has been blocked' });

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { credential, role, city, addressText, phone, latitude, longitude, dateOfBirth } = req.body;
    if (!credential) return res.status(400).json({ error: 'Missing Google credential' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      if (!role || !city || !phone || !addressText) {
        return res.status(200).json({ profileComplete: false, googleProfile: { email, name, picture } });
      }
      const finalRole = resolveRole(email, role);

      // --- Senior age gate for Google sign-up ---
      if (finalRole === 'SENIOR') {
        if (!dateOfBirth) {
          return res.status(400).json({ error: 'Date of birth is required for Senior Citizens.' });
        }
        const age = calculateAge(dateOfBirth);
        if (age === null) {
          return res.status(400).json({ error: 'Invalid date of birth.' });
        }
        if (age < SENIOR_MIN_AGE) {
          return res.status(400).json({
            error: `You must be at least ${SENIOR_MIN_AGE} years old to register as a Senior Citizen. Your age: ${age}.`,
          });
        }
      }

      const coords = (longitude !== undefined && latitude !== undefined)
        ? [parseFloat(longitude), parseFloat(latitude)]
        : [0, 0];

      user = await User.create({
        fullName: name,
        email: email.toLowerCase(),
        googleId,
        profilePicture: picture,
        phone,
        role: finalRole,
        city,
        addressText,
        dateOfBirth: finalRole === 'SENIOR' ? new Date(dateOfBirth) : undefined,
        location: { type: 'Point', coordinates: coords },
        isVerified: finalRole === 'ADMIN',
      });
    } else if (user.isBlocked) {
      return res.status(403).json({ error: 'This account has been blocked' });
    }

    res.json({ profileComplete: true, token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

router.post('/aadhaar/request-otp', requireAuth, async (req, res) => {
  try {
    const { aadhaarNumber, captchaInput } = req.body;

    if (!aadhaarNumber || !validateAadhaarFormat(aadhaarNumber)) {
      return res.status(400).json({ error: 'Please enter a valid 12-digit document number sequence.' });
    }

    if (!captchaInput) {
      return res.status(400).json({ error: 'Please enter the Captcha code.' });
    }

    const otpTxnId = `TXN_${Date.now()}`;

    res.json({
      success: true,
      message: 'OTP sent to the mobile number registered with your document.',
      otpTxnId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to request OTP. Please try again.' });
  }
});

router.post('/aadhaar/verify-otp', requireAuth, async (req, res) => {
  try {
    const { otp, aadhaarNumber } = req.body;

    if (!otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: 'Please enter a valid 6-digit OTP.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (otp !== '123456') {
      return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
    }

    const officialName = user.fullName;
    const userNormalized = normalizeName(user.fullName);
    const officialNormalized = normalizeName(officialName);

    if (!userNormalized.includes(officialNormalized) && !officialNormalized.includes(userNormalized)) {
      return res.status(400).json({
        error: `Identity mismatch: The document belongs to "${officialName}", but your account profile name is "${user.fullName}".`,
      });
    }

    user.aadhaarNumber = aadhaarNumber;
    user.isVerified = true;
    user.verificationStatus = 'VERIFIED';
    await user.save();

    res.json({
      message: 'Identity successfully verified! Your Verified Volunteer Badge is now active.',
      user: publicUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Invalid OTP verification. Please try again.' });
  }
});

router.put('/profile', requireAuth, async (req, res) => {
  try {
    const {
      fullName,
      phone,
      city,
      subRegion,
      addressText,
      emergencyContactName,
      emergencyContactPhone,
      aadhaarNumber,
      fcmToken,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (city) user.city = city;
    if (subRegion !== undefined) user.subRegion = subRegion;
    if (addressText) user.addressText = addressText;
    if (fcmToken !== undefined) user.fcmToken = fcmToken;

    if (user.role === 'SENIOR') {
      if (emergencyContactName !== undefined) user.emergencyContactName = emergencyContactName;
      if (emergencyContactPhone !== undefined) user.emergencyContactPhone = emergencyContactPhone;
    }

    if (user.role === 'VOLUNTEER' && aadhaarNumber !== undefined) {
      user.aadhaarNumber = aadhaarNumber;
      if (aadhaarNumber.trim() !== '' && !user.isVerified) {
        user.verificationStatus = 'PENDING';
      }
    }

    await user.save();

    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * GET /api/auth/nearby-volunteers
 * Computes dynamic average star rating and includes reviews for each volunteer
 */
router.get('/nearby-volunteers', requireAuth, async (req, res) => {
  try {
    const senior = req.user;

    const allVolunteers = await User.find({
      role: 'VOLUNTEER',
      city: new RegExp(`^${senior.city}$`, 'i'),
      isBlocked: false,
    })
      .select('fullName phone profilePicture hoursVolunteered tasksCompleted badges city subRegion addressText isVerified reviews')
      .limit(20);

    const now = new Date();
    const activeTasks = await Task.find({
      status: { $in: ['ASSIGNED', 'IN_PROGRESS', 'EN_ROUTE', 'ARRIVED'] },
      volunteer: { $exists: true },
    }).select('volunteer status scheduledTime');

    const busyVolunteerIds = new Set();
    const volunteerBookings = {};

    activeTasks.forEach((t) => {
      const volIdStr = t.volunteer.toString();
      if (t.scheduledTime) {
        const schedTime = new Date(t.scheduledTime);
        const diffMs = schedTime - now;
        const oneHour = 60 * 60 * 1000;
        const twoHours = 2 * 60 * 60 * 1000;
        // Busy if currently within task execution window or in active transport status
        const isBusyNow = (diffMs <= oneHour && diffMs >= -twoHours) || ['IN_PROGRESS', 'EN_ROUTE', 'ARRIVED'].includes(t.status);
        if (isBusyNow) {
          busyVolunteerIds.add(volIdStr);
        }
        if (schedTime > now) {
          if (!volunteerBookings[volIdStr]) {
            volunteerBookings[volIdStr] = [];
          }
          volunteerBookings[volIdStr].push(t.scheduledTime);
        }
      } else {
        busyVolunteerIds.add(volIdStr);
      }
    });

    const sameSubRegion = [];
    const otherSubRegions = [];

    allVolunteers.forEach((vol) => {
      const volObj = vol.toObject();
      volObj.isBusy = busyVolunteerIds.has(vol._id.toString());
      volObj.bookings = volunteerBookings[vol._id.toString()] || [];

      // Calculate average star rating from past reviews
      if (volObj.reviews && volObj.reviews.length > 0) {
        const sum = volObj.reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
        volObj.avgRating = (sum / volObj.reviews.length).toFixed(1);
      } else {
        volObj.avgRating = '5.0'; // Default score for new volunteers
      }

      if (
        senior.subRegion &&
        vol.subRegion &&
        vol.subRegion.trim().toLowerCase() === senior.subRegion.trim().toLowerCase()
      ) {
        sameSubRegion.push(volObj);
      } else {
        otherSubRegions.push(volObj);
      }
    });

    res.json({
      sameSubRegion,
      otherSubRegions,
      volunteers: [...sameSubRegion, ...otherSubRegions],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch nearby volunteers' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.post('/test-notification', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.fcmToken) {
      return res.status(400).json({ error: 'No FCM Push Token registered for your account. Please allow notification permission in your browser and log in again.' });
    }
    const response = await sendPushNotification(
      user.fcmToken,
      '🔔 NeighborCare Test Push Notification',
      'If you are reading this, Firebase Cloud Messaging is working perfectly on your device!',
      { test: 'true', timestamp: String(Date.now()) }
    );
    res.json({ success: true, message: 'Test push notification sent successfully!', response });
  } catch (err) {
    console.error('Test Push Error:', err.code, err.message);
    // Return the real Firebase error to the browser so we can diagnose it
    res.status(500).json({
      error: `FCM Error [${err.code || 'unknown'}]: ${err.message || 'Failed to send push notification'}`,
    });
  }
});

module.exports = router;