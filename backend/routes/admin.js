const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const Payout = require('../models/Payout');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('ADMIN'));

const SUPER_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'ranjithrachna6@gmail.com').toLowerCase();

/** GET /api/admin/users - User Verification & Moderation Table */
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/** PATCH /api/admin/users/:id/verify - verify a volunteer's ID details and assign verified status */
router.patch('/users/:id/verify', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true, verificationStatus: 'VERIFIED' },
      { new: true }
    ).select('-passwordHash');

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to verify user' });
  }
});

/** PATCH /api/admin/users/:id/block - block/unblock a user (Protects Super Admin) */
router.patch('/users/:id/block', async (req, res) => {
  try {
    const { blocked } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (targetUser.email.toLowerCase() === SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ error: 'The primary Super Admin cannot be blocked.' });
    }

    targetUser.isBlocked = !!blocked;
    await targetUser.save();

    const userObj = targetUser.toObject();
    delete userObj.passwordHash;

    res.json({ user: userObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update block status' });
  }
});

/** PATCH /api/admin/users/:id/role - edit a user's role (Protects Super Admin) */
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (targetUser.email.toLowerCase() === SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ error: 'The primary Super Admin role cannot be modified.' });
    }

    if (!['SENIOR', 'VOLUNTEER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    targetUser.role = role;
    await targetUser.save();

    const userObj = targetUser.toObject();
    delete userObj.passwordHash;

    res.json({ user: userObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

/** GET /api/admin/tasks - Live Task Monitor across all cities */
router.get('/tasks', async (req, res) => {
  try {
    const { status, city } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (city) filter.city = city;
    const tasks = await Task.find(filter)
      .populate('senior', 'fullName phone addressText emergencyContactName emergencyContactPhone')
      .populate('volunteer', 'fullName phone')
      .sort({ createdAt: -1 });
    res.json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/** PATCH /api/admin/tasks/:id - override capability to reassign/cancel stuck tasks */
router.patch('/tasks/:id', async (req, res) => {
  try {
    const { status, volunteer } = req.body;
    const update = {};
    if (status) update.status = status;
    if (volunteer !== undefined) update.volunteer = volunteer;
    const task = await Task.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('senior', 'fullName phone addressText')
      .populate('volunteer', 'fullName phone');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

/**
 * GET /api/admin/sos-log
 * Real-time-ish incident log: any HIGH urgency task, surfaced with senior contact
 * details and last known location so admins can respond to emergencies/disputes.
 */
router.get('/sos-log', async (req, res) => {
  try {
    const incidents = await Task.find({ urgency: 'HIGH' })
      .populate('senior', 'fullName phone addressText location emergencyContactName emergencyContactPhone')
      .populate('volunteer', 'fullName phone')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ incidents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch SOS logs' });
  }
});

/** GET /api/admin/payouts - claim queue, optionally filtered by status */
router.get('/payouts', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const payouts = await Payout.find(filter)
      .populate('volunteer', 'fullName phone email city')
      .sort({ requestedAt: -1 });
    res.json({ payouts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

/** PATCH /api/admin/payouts/:id/pay - mark a claim as paid */
router.patch('/payouts/:id/pay', async (req, res) => {
  try {
    const { paymentRef } = req.body;
    const payout = await Payout.findByIdAndUpdate(
      req.params.id,
      { status: 'PAID', paidAt: new Date(), paymentRef: paymentRef || '' },
      { new: true }
    ).populate('volunteer', 'fullName phone email city');
    if (!payout) return res.status(404).json({ error: 'Payout not found' });
    res.json({ payout });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark payout as paid' });
  }
});

/** PATCH /api/admin/payouts/:id/reject - reject a disputed claim */
router.patch('/payouts/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const payout = await Payout.findByIdAndUpdate(
      req.params.id,
      { status: 'REJECTED', rejectionReason: reason || '' },
      { new: true }
    ).populate('volunteer', 'fullName phone email city');
    if (!payout) return res.status(404).json({ error: 'Payout not found' });
    res.json({ payout });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reject payout' });
  }
});

/** GET /api/admin/analytics - System Analytics & City Coverage Stats */
router.get('/analytics', async (req, res) => {
  try {
    const [totalTasks, completedTasks, pendingTasks, totalSeniors, totalVolunteers, verifiedVolunteers] =
      await Promise.all([
        Task.countDocuments({}),
        Task.countDocuments({ status: 'COMPLETED' }),
        Task.countDocuments({ status: 'PENDING' }),
        User.countDocuments({ role: 'SENIOR' }),
        User.countDocuments({ role: 'VOLUNTEER' }),
        User.countDocuments({ role: 'VOLUNTEER', isVerified: true }),
      ]);

    const cityCoverage = await Task.aggregate([
      { $group: { _id: '$city', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } } } },
      { $sort: { total: -1 } },
    ]);

    // Average response time: creation -> assignedAt, in minutes, across assigned/completed tasks.
    const responseTimes = await Task.aggregate([
      { $match: { assignedAt: { $ne: null } } },
      { $project: { minutes: { $divide: [{ $subtract: ['$assignedAt', '$createdAt'] }, 60000] } } },
      { $group: { _id: null, avgMinutes: { $avg: '$minutes' } } },
    ]);

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      totalSeniors,
      totalVolunteers,
      verifiedVolunteers,
      cityCoverage,
      avgResponseMinutes: responseTimes[0] ? Math.round(responseTimes[0].avgMinutes) : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;