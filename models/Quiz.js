const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  option1: {
    text: {
      type: String,
      required: true
    },
    image: {
      type: String
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  },
  option2: {
    text: {
      type: String,
      required: true
    },
    image: {
      type: String
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Quiz', QuizSchema);