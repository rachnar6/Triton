// backend/routes/requests.js
const express = require('express');
const Request = require('../models/Request');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();


/**
 * POST /api/requests
 * Senior posts a new help request
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'SENIOR') {
      return res.status(403).json({ error: 'Only Senior accounts can post assistance requests.' });
    }

    const { title, category, description, urgency } = req.body;
    if (!title || !category || !description) {
      return res.status(400).json({ error: 'Please provide title, category, and description.' });
    }

    const newRequest = await Request.create({
      senior: req.user._id,
      title,
      category,
      description,
      urgency: urgency || 'MEDIUM',
      city: req.user.city,
      addressText: req.user.addressText,
    });

    res.status(201).json({ request: newRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create request.' });
  }
});

/**
 * GET /api/requests/active
 * Gets active open request for logged-in Senior
 */
router.get('/active', requireAuth, async (req, res) => {
  try {
    const active = await Request.findOne({ senior: req.user._id, status: 'OPEN' }).sort({ createdAt: -1 });
    res.json({ request: active });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch active request.' });
  }
});

/**
 * DELETE /api/requests/:id
 * Senior cancels their open request
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const requestItem = await Request.findById(req.params.id);
    if (!requestItem) return res.status(404).json({ error: 'Request not found.' });

    if (requestItem.senior.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized to cancel this request.' });
    }

    requestItem.status = 'CANCELLED';
    await requestItem.save();

    res.json({ message: 'Request cancelled successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel request.' });
  }
});

/**
 * GET /api/requests/feed
 * Volunteers view open requests in their city
 */
/**
 * GET /api/requests/feed (or /api/tasks/feed)
 * Fetches open requests within the requested radius (in km) from the volunteer's coordinates
 */
router.get('/feed', requireAuth, async (req, res) => {
  try {
    // 1. Get radius from query param (defaults to 3 km)
    const radiusKm = parseFloat(req.query.radius) || 3;
    const maxDistanceMeters = radiusKm * 1000;

    // 2. Extract volunteer coordinates [longitude, latitude]
    const volunteerCoords = req.user.location?.coordinates || [0, 0];

    // 3. Query open requests using 2dsphere spatial index
    const tasks = await Request.find({
      status: 'OPEN',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: volunteerCoords,
          },
          $maxDistance: maxDistanceMeters,
        },
      },
    }).populate('senior', 'fullName phone addressText city');

    res.json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch nearby task feed.' });
  }
});

/**
 * PATCH /api/requests/:id/accept
 * Verified volunteer accepts a request
 */
router.patch('/:id/accept', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'VOLUNTEER') {
      return res.status(403).json({ error: 'Only volunteers can accept requests.' });
    }

    if (!req.user.isVerified) {
      return res.status(403).json({ error: 'You must verify your identity badge before accepting senior requests.' });
    }

    const requestItem = await Request.findById(req.params.id);
    if (!requestItem) return res.status(404).json({ error: 'Request not found.' });

    if (requestItem.status !== 'OPEN') {
      return res.status(400).json({ error: 'This request has already been claimed or completed.' });
    }

    requestItem.assignedVolunteer = req.user._id;
    requestItem.status = 'ACCEPTED';
    await requestItem.save();

    res.json({ message: 'Request accepted successfully!', request: requestItem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to accept request.' });
  }
});

module.exports = router;