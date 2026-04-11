const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const sectionActivityController = require('../controllers/sectionActivityController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(auth, requireRole('faculty', 'admin'));

// Add activity to a section (with file upload)
router.post(
  '/',
  upload.single('instructionsFile'),
  sectionActivityController.createActivity
);

// Get activities per section
router.get('/:sectionId', sectionActivityController.getActivitiesBySection);

module.exports = router;
