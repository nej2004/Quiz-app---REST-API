const express = require('express');
const multer = require('multer');
const Quiz = require('../models/Quiz');
const auth = require('../middleware/auth');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Create quiz
router.post('/', auth, upload.fields([
  { name: 'option1Image', maxCount: 1 },
  { name: 'option2Image', maxCount: 1 }
]), async (req, res) => {
  try {
    const { question, option1Text, option2Text, correctOption } = req.body;
    const option1Image = req.files['option1Image'] ? '/images/' + req.files['option1Image'][0].filename : null;
    const option2Image = req.files['option2Image'] ? '/images/' + req.files['option2Image'][0].filename : null;

    const quiz = new Quiz({
      question,
      option1: {
        text: option1Text,
        image: option1Image,
        isCorrect: correctOption === 'option1'
      },
      option2: {
        text: option2Text,
        image: option2Image,
        isCorrect: correctOption === 'option2'
      },
      createdBy: req.user.id
    });

    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all quizzes
router.get('/', auth, async (req, res) => {
  try {
    const quizzes = await Quiz.find().populate('createdBy', 'username');
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit answer
router.post('/:id/answer', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const { selectedOption } = req.body;
    const user = req.user;

    if (quiz[selectedOption].isCorrect) {
      user.score += 10;
      await user.save();
      res.json({ correct: true, score: user.score });
    } else {
      res.json({ correct: false, score: user.score });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;