const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const studentOutputController = require('../controllers/studentOutputController');

// Submit student output
router.post(
  '/',
  upload.single('file'),
  studentOutputController.submitOutput
);

// Get all submissions for an activity
router.get('/:activityId', studentOutputController.getOutputsByActivity);

// --- TEACHING ACTIVITIES FEATURE ---
// Submit student output
router.post(
  '/teaching-output',
  upload.single('file'),
  studentOutputController.submitOutput
);

// Get all submissions for an activity
router.get('/teaching-output/:activityId', studentOutputController.getOutputsByActivity);

module.exports = router;
