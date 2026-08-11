const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendPushNotification } = require('../utils/pushNotifier');

const router = express.Router();

// 1 completed task = 1 coin. Coin value in rupees — change here if it
// ever changes, everything downstream (totals, monthly chart) follows.
const COIN_VALUE = 100;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

router.post('/', requireAuth, requireRole('SENIOR'), async (req, res) => {
  try {
    const { category, description, urgency, streetHint, latitude, longitude, invitedVolunteer } = req.body;
    if (!category || !description) {
      return res.status(400).json({ error: 'category and description are required' });
    }

    const senior = req.user;
    let taskCoordinates = senior.location?.coordinates || [0, 0];

    if (latitude !== undefined && longitude !== undefined) {
      taskCoordinates = [parseFloat(longitude), parseFloat(latitude)];
      await User.findByIdAndUpdate(senior._id, {
        location: { type: 'Point', coordinates: taskCoordinates },
      });
    }

    const taskData = {
      senior: senior._id,
      category,
      description,
      urgency: urgency || 'MEDIUM',
      city: senior.city,
      subRegion: senior.subRegion || '',
      addressText: senior.addressText,
      streetHint: streetHint || senior.addressText.split(',')[0],
      location: { type: 'Point', coordinates: taskCoordinates },
      verificationPin: generatePin(),
      messages: [],
    };

    if (invitedVolunteer) {
      taskData.invitedVolunteer = invitedVolunteer;
    }

    const task = await Task.create(taskData);

    // If a volunteer was directly targeted during task creation, send Push Notification
    if (invitedVolunteer) {
      const vol = await User.findById(invitedVolunteer);
      if (vol && vol.fcmToken) {
        sendPushNotification(
          vol.fcmToken,
          '⭐ Direct Request Received!',
          `${senior.fullName} specifically requested your help for ${category.replace('_', ' ')}!`,
          { taskId: task._id.toString() }
        );
      }
    }

    res.status(201).json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.get('/mine', requireAuth, requireRole('SENIOR'), async (req, res) => {
  try {
    const task = await Task.findOne({ senior: req.user._id, status: { $ne: 'CANCELLED' } })
      .sort({ createdAt: -1 })
      .populate('volunteer', 'fullName phone profilePicture hoursVolunteered badges subRegion city')
      .populate('invitedVolunteer', 'fullName phone profilePicture subRegion city');
    res.json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

/**
 * GET /api/tasks/history
 * Fetch past completed and cancelled tasks for both Seniors and Volunteers
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    let filter = {
      status: { $in: ['COMPLETED', 'CANCELLED'] } // Only return finished tasks
    };

    if (req.user.role === 'SENIOR') {
      filter.senior = req.user._id;
    } else if (req.user.role === 'VOLUNTEER') {
      filter.volunteer = req.user._id;
    }

    const tasks = await Task.find(filter)
      .populate('senior', 'fullName phone addressText city subRegion')
      .populate('volunteer', 'fullName phone profilePicture subRegion city')
      .sort({ createdAt: -1 });

    res.json({ tasks: tasks || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch task history' });
  }
});

/**
 * GET /api/tasks/earnings
 * Volunteer-only. Aggregates the volunteer's COMPLETED tasks by month.
 */
router.get('/earnings', requireAuth, requireRole('VOLUNTEER'), async (req, res) => {
  try {
    const volunteerId = new mongoose.Types.ObjectId(req.user._id);

    const monthly = await Task.aggregate([
      {
        $match: {
          volunteer: volunteerId,
          status: 'COMPLETED',
          completedAt: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: { year: { $year: '$completedAt' }, month: { $month: '$completedAt' } },
          tasksCompleted: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthlyStats = monthly.map((m) => {
      const coins = m.tasksCompleted;
      return {
        year: m._id.year,
        month: m._id.month,
        label: `${MONTH_NAMES[m._id.month - 1]} ${m._id.year}`,
        tasksCompleted: m.tasksCompleted,
        coins,
        revenue: coins * COIN_VALUE,
      };
    });

    const totalCoins = monthlyStats.reduce((sum, m) => sum + m.coins, 0);
    const totalRevenue = totalCoins * COIN_VALUE;

    const now = new Date();
    const currentLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
    const currentMonth =
      monthlyStats.find((m) => m.label === currentLabel) || {
        label: currentLabel,
        tasksCompleted: 0,
        coins: 0,
        revenue: 0,
      };

    res.json({
      coinValue: COIN_VALUE,
      totalCoins,
      totalRevenue,
      currentMonth,
      monthlyStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to calculate earnings' });
  }
});

router.delete('/:id', requireAuth, requireRole('SENIOR'), async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, senior: req.user._id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending requests can be cancelled' });
    }
    task.status = 'CANCELLED';
    await task.save();
    res.json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel task' });
  }
});

router.get('/feed', requireAuth, async (req, res) => {
  try {
    const filter = {
      status: 'PENDING',
      city: new RegExp(`^${req.user.city}$`, 'i'),
    };

    const allTasks = await Task.find(filter)
      .populate('senior', 'fullName phone addressText city subRegion')
      .sort({ createdAt: -1 });

    const sameSubRegion = [];
    const otherSubRegions = [];

    const volSubRegion = (req.user.subRegion || '').trim().toLowerCase();

    allTasks.forEach((t) => {
      const taskSubRegion = (t.subRegion || t.senior?.subRegion || '').trim().toLowerCase();
      if (volSubRegion && taskSubRegion && volSubRegion === taskSubRegion) {
        sameSubRegion.push(t);
      } else {
        otherSubRegions.push(t);
      }
    });

    res.json({
      sameSubRegion,
      otherSubRegions,
      tasks: allTasks || [],
    });
  } catch (err) {
    console.error('Task Feed Error:', err);
    res.json({ sameSubRegion: [], otherSubRegions: [], tasks: [] });
  }
});

router.post('/:id/claim', requireAuth, requireRole('VOLUNTEER'), async (req, res) => {
  try {
    if (!req.user.isVerified) {
      return res.status(403).json({ error: 'Your volunteer ID must be verified before claiming tasks' });
    }
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, status: 'PENDING' },
      { status: 'ASSIGNED', volunteer: req.user._id, assignedAt: new Date() },
      { new: true }
    ).populate('senior', 'fullName phone addressText profilePicture fcmToken');

    if (!task) return res.status(409).json({ error: 'This task has already been claimed' });

    // Send Push Notification to Senior that a Volunteer claimed their request
    if (task.senior && task.senior.fcmToken) {
      sendPushNotification(
        task.senior.fcmToken,
        '🎉 Helper Found!',
        `${req.user.fullName} accepted your request and is on their way!`,
        { taskId: task._id.toString() }
      );
    }

    res.json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to claim task' });
  }
});

/**
 * GET /api/tasks/active
 * Fetch active task currently assigned to the volunteer across all 4 operational stages.
 */
router.get('/active', requireAuth, requireRole('VOLUNTEER'), async (req, res) => {
  try {
    const task = await Task.findOne({
      volunteer: req.user._id,
      status: { $in: ['ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'] },
    })
      .populate('senior', 'fullName phone addressText profilePicture location')
      .populate('invitedVolunteer', 'fullName phone profilePicture');

    res.json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch active task' });
  }
});

/**
 * POST /api/tasks/:id/verify-pin
 * Volunteer enters 4-digit door PIN to verify arrival and complete the task.
 */
router.post('/:id/verify-pin', requireAuth, requireRole('VOLUNTEER'), async (req, res) => {
  try {
    const { pin } = req.body;
    const task = await Task.findOne({ _id: req.params.id, volunteer: req.user._id });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const validActiveStatuses = ['ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'];
    if (!validActiveStatuses.includes(task.status)) {
      return res.status(400).json({ error: 'Task is not awaiting PIN verification' });
    }

    if (pin !== task.verificationPin) {
      return res.status(400).json({ error: 'Incorrect PIN. Please confirm with the senior.' });
    }

    task.status = 'COMPLETED';
    task.pinVerifiedAt = new Date();
    task.completedAt = new Date();
    await task.save();

    const volunteer = await User.findById(req.user._id);
    if (volunteer) {
      volunteer.tasksCompleted = (volunteer.tasksCompleted || 0) + 1;
      volunteer.hoursVolunteered = (volunteer.hoursVolunteered || 0) + 1;
      if (volunteer.tasksCompleted >= 10 && !volunteer.badges.includes('Top Neighborhood Helper')) {
        volunteer.badges.push('Top Neighborhood Helper');
      }
      await volunteer.save();
    }

    res.json({
      task,
      volunteer: {
        tasksCompleted: volunteer?.tasksCompleted || 0,
        hoursVolunteered: volunteer?.hoursVolunteered || 0,
        badges: volunteer?.badges || [],
      },
      coinEarned: 1,
      coinValue: COIN_VALUE,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PIN verification failed' });
  }
});

router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ messages: task.messages || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/:id/messages', requireAuth, async (req, res) => {
  try {
    const { text, type, audioUrl } = req.body;
    const task = await Task.findById(req.params.id)
      .populate('senior', 'fullName fcmToken')
      .populate('volunteer', 'fullName fcmToken');
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const newMsg = {
      sender: req.user._id,
      senderName: req.user.fullName,
      text: text || '',
      type: type || 'TEXT',
      audioUrl: audioUrl || '',
      createdAt: new Date(),
    };

    task.messages = task.messages || [];
    task.messages.push(newMsg);
    await task.save();

    // ── Push notification to the OTHER party ──────────────────────────
    const senderId = req.user._id.toString();
    const seniorId = task.senior?._id?.toString();
    const volunteerId = task.volunteer?._id?.toString();

    const notifTitle = `💬 New message from ${req.user.fullName}`;
    const notifBody = type === 'VOICE' ? '🎤 Voice message received' : (text || '').slice(0, 80);

    if (senderId === seniorId && task.volunteer?.fcmToken) {
      // Senior sent → notify volunteer
      sendPushNotification(
        task.volunteer.fcmToken,
        notifTitle,
        notifBody,
        { taskId: task._id.toString(), type: 'CHAT' }
      ).catch(() => {});
    } else if (senderId === volunteerId && task.senior?.fcmToken) {
      // Volunteer sent → notify senior
      sendPushNotification(
        task.senior.fcmToken,
        notifTitle,
        notifBody,
        { taskId: task._id.toString(), type: 'CHAT' }
      ).catch(() => {});
    }
    // ──────────────────────────────────────────────────────────────────

    res.status(201).json({ message: newMsg, messages: task.messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * POST /api/tasks/:id/rate
 * Senior submits or edits rating, review text, and media attachments.
 */
router.post('/:id/rate', requireAuth, requireRole('SENIOR'), async (req, res) => {
  try {
    const { rating, reviewText, reviewMedia } = req.body;
    const task = await Task.findOne({ _id: req.params.id, senior: req.user._id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Ratings can only be submitted for completed tasks' });
    }

    task.rating = rating || 5;
    task.reviewText = reviewText || '';
    task.reviewMedia = reviewMedia || [];
    await task.save();

    if (task.volunteer) {
      const volunteer = await User.findById(task.volunteer);
      if (volunteer) {
        volunteer.reviews = volunteer.reviews || [];
        const existingRevIdx = volunteer.reviews.findIndex(
          (r) => r.taskId && r.taskId.toString() === task._id.toString()
        );

        const revObj = {
          taskId: task._id,
          seniorName: req.user.fullName,
          rating: rating || 5,
          comment: reviewText || '',
          media: reviewMedia || [],
          date: new Date(),
        };

        if (existingRevIdx >= 0) {
          volunteer.reviews[existingRevIdx] = revObj;
        } else {
          volunteer.reviews.push(revObj);
        }
        await volunteer.save();
      }
    }

    res.json({ message: 'Rating updated successfully', task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

/**
 * PUT /api/tasks/:id/invite
 * Senior directly targets/invites a specific volunteer for an open task
 */
router.put('/:id/invite', requireAuth, requireRole('SENIOR'), async (req, res) => {
  try {
    const { volunteerId } = req.body;
    const task = await Task.findOne({ _id: req.params.id, senior: req.user._id });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.invitedVolunteer = volunteerId;
    await task.save();

    const volunteer = await User.findById(volunteerId);
    if (volunteer && volunteer.fcmToken) {
      sendPushNotification(
        volunteer.fcmToken,
        '⭐ Direct Request Received!',
        `${req.user.fullName} specifically requested your assistance!`,
        { taskId: task._id.toString() }
      );
    }

    const updatedTask = await Task.findById(task._id).populate('invitedVolunteer', 'fullName phone profilePicture');
    res.json({ task: updatedTask });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to invite volunteer' });
  }
});

/**
 * PATCH /api/tasks/:id/status
 * Volunteer updates progressive operational status (EN_ROUTE, ARRIVED, IN_PROGRESS)
 */
router.patch('/:id/status', requireAuth, requireRole('VOLUNTEER'), async (req, res) => {
  try {
    const { status, latitude, longitude } = req.body;

    const ALLOWED_STATUSES = ['EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'];
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const task = await Task.findOne({ _id: req.params.id, volunteer: req.user._id }).populate('senior', 'fcmToken fullName');
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.status = status;
    if (latitude !== undefined && longitude !== undefined) {
      task.volunteerLocation = { latitude: parseFloat(latitude), longitude: parseFloat(longitude), updatedAt: new Date() };
    }
    await task.save();

    // Trigger push notification to senior when volunteer changes status
    if (task.senior && task.senior.fcmToken) {
      if (status === 'EN_ROUTE') {
        sendPushNotification(
          task.senior.fcmToken,
          '🚗 Helper En Route!',
          `${req.user.fullName} is on their way to your location!`,
          { taskId: task._id.toString() }
        );
      } else if (status === 'ARRIVED') {
        sendPushNotification(
          task.senior.fcmToken,
          '📍 Helper at Your Door!',
          `${req.user.fullName} has arrived! Please share your 4-digit Door PIN code.`,
          { taskId: task._id.toString() }
        );
      }
    }

    res.json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

/**
 * PUT /api/tasks/:id/location
 * Periodically updates volunteer's live coordinates while en route
 */
router.put('/:id/location', requireAuth, requireRole('VOLUNTEER'), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const task = await Task.findOne({ _id: req.params.id, volunteer: req.user._id });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.volunteerLocation = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      updatedAt: new Date(),
    };
    await task.save();

    res.json({ success: true, volunteerLocation: task.volunteerLocation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

module.exports = router;