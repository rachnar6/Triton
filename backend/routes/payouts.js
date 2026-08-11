const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Payout = require('../models/Payout');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const COIN_VALUE = 100;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Same aggregation /tasks/earnings uses, so payout numbers always agree
// with what the volunteer sees on their Earnings panel.
async function getMonthlyCoins(volunteerId) {
  const rows = await Task.aggregate([
    { $match: { volunteer: volunteerId, status: 'COMPLETED', completedAt: { $exists: true, $ne: null } } },
    { $group: { _id: { year: { $year: '$completedAt' }, month: { $month: '$completedAt' } }, tasksCompleted: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
  return rows.map((r) => ({
    year: r._id.year,
    month: r._id.month,
    label: `${MONTH_NAMES[r._id.month - 1]} ${r._id.year}`,
    coins: r.tasksCompleted,
  }));
}

/**
 * GET /api/payouts/status
 * Volunteer-only. Past (closed) months with earned coins that haven't
 * been claimed yet, plus this volunteer's full claim history.
 */
router.get('/status', requireAuth, requireRole('VOLUNTEER'), async (req, res) => {
  try {
    const volunteerId = new mongoose.Types.ObjectId(req.user._id);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const [monthlyCoins, claims] = await Promise.all([
      getMonthlyCoins(volunteerId),
      Payout.find({ volunteer: volunteerId }).sort({ year: -1, month: -1 }),
    ]);

    const claimedKeys = new Set(claims.map((c) => `${c.year}-${c.month}`));

    const unclaimed = monthlyCoins.filter((m) => {
      const isPastMonth = m.year < currentYear || (m.year === currentYear && m.month < currentMonth);
      return isPastMonth && m.coins > 0 && !claimedKeys.has(`${m.year}-${m.month}`);
    });

    res.json({ coinValue: COIN_VALUE, unclaimed, claims });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payout status' });
  }
});

/**
 * POST /api/payouts/claim
 * Volunteer requests payout for one closed month. Body: { year, month }
 */
router.post('/claim', requireAuth, requireRole('VOLUNTEER'), async (req, res) => {
  try {
    const { year, month } = req.body;
    if (!year || !month) {
      return res.status(400).json({ error: 'year and month are required' });
    }

    const now = new Date();
    const isPastMonth = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
    if (!isPastMonth) {
      return res.status(400).json({ error: 'Only past, closed months can be claimed' });
    }

    const volunteerId = new mongoose.Types.ObjectId(req.user._id);
    const monthlyCoins = await getMonthlyCoins(volunteerId);
    const monthData = monthlyCoins.find((m) => m.year === Number(year) && m.month === Number(month));

    if (!monthData || monthData.coins <= 0) {
      return res.status(400).json({ error: 'No completed tasks found for that month' });
    }

    const payout = await Payout.create({
      volunteer: volunteerId,
      year: Number(year),
      month: Number(month),
      label: monthData.label,
      coins: monthData.coins,
      amount: monthData.coins * COIN_VALUE,
    });

    res.status(201).json({ payout });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'This month has already been claimed' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to submit claim' });
  }
});
router.get('/admin/pending', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const claims = await Payout.find({ status: 'CLAIM_REQUESTED' })
    .populate('volunteer', 'fullName phone city subRegion')
    .sort({ requestedAt: 1 });
  res.json({ claims });
});

router.patch('/admin/:id/pay', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { paymentRef } = req.body;
  const payout = await Payout.findById(req.params.id);
  if (!payout) return res.status(404).json({ error: 'Payout not found' });
  if (payout.status !== 'CLAIM_REQUESTED') {
    return res.status(400).json({ error: 'Only pending claims can be marked paid' });
  }
  payout.status = 'PAID';
  payout.paidAt = new Date();
  payout.paymentRef = paymentRef || '';
  await payout.save();
  res.json({ payout });
});

router.patch('/admin/:id/reject', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { reason } = req.body;
  const payout = await Payout.findById(req.params.id);
  if (!payout) return res.status(404).json({ error: 'Payout not found' });
  if (payout.status !== 'CLAIM_REQUESTED') {
    return res.status(400).json({ error: 'Only pending claims can be rejected' });
  }
  payout.status = 'REJECTED';
  payout.rejectionReason = reason || '';
  await payout.save();
  res.json({ payout });
});

module.exports = router;