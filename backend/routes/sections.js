const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/sectionController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(auth, requireRole('faculty', 'admin'));

// Create section under a course
router.post('/', sectionController.createSection);

// Get all sections of a course
router.get('/:courseId', sectionController.getSectionsByCourse);

module.exports = router;
