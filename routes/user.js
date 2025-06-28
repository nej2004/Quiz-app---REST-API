const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Get user profile
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find().sort({ score: -1 }).limit(10);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;