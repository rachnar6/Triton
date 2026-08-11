const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');

const router = express.Router();

/**
 * GET /api/public/stats
 * Powers the Landing Page's "Live Community Impact Bar":
 * Tasks Completed, Active Neighborhood Volunteers, Average Response Time.
 * No auth required.
 */
router.get('/stats', async (req, res) => {
  const [tasksCompleted, activeVolunteers] = await Promise.all([
    Task.countDocuments({ status: 'COMPLETED' }),
    User.countDocuments({ role: 'VOLUNTEER', isVerified: true, isBlocked: false }),
  ]);

  const responseTimes = await Task.aggregate([
    { $match: { assignedAt: { $ne: null } } },
    { $project: { minutes: { $divide: [{ $subtract: ['$assignedAt', '$createdAt'] }, 60000] } } },
    { $group: { _id: null, avgMinutes: { $avg: '$minutes' } } },
  ]);

  res.json({
    tasksCompleted,
    activeVolunteers,
    avgResponseMinutes: responseTimes[0] ? Math.round(responseTimes[0].avgMinutes) : 0,
  });
});

module.exports = router;
