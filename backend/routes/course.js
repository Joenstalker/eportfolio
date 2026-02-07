// routes/course.js
const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const lockService = require('../services/lockService');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// All course management endpoints are ADMIN-only and require a valid JWT
router.use(auth, requireRole('admin'));

// GET all courses with lock status
router.get('/', async (req, res) => {
  try {
    console.log(' Fetching courses for user:', req.user.email);
    
    const courses = await Course.find();
    console.log(' Found ' + courses.length + ' courses');
    
    // Add lock status to each course
    const coursesWithLocks = await Promise.all(
      courses.map(async (course) => {
        try {
          const lockStatus = await lockService.checkLock(course._id, 'Course');
          return {
            ...course.toObject(),
            lockStatus: lockStatus.isLocked ? {
              isLocked: true,
              lockedBy: lockStatus.lock?.userName || 'Another user',
              lockedByEmail: lockStatus.lock?.userEmail || 'unknown',
              expiresAt: lockStatus.lock?.expiresAt,
              isLockedByMe: lockStatus.lock?.userId === req.user.id
            } : {
              isLocked: false
            }
          };
        } catch (lockError) {
          console.error(' Error checking lock for course ' + course._id + ':', lockError.message);
          return {
            ...course.toObject(),
            lockStatus: { isLocked: false }
          };
        }
      })
    );
    
    console.log(' Returning ' + coursesWithLocks.length + ' courses');
    res.json(coursesWithLocks);
  } catch (error) {
    console.error(' Get courses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
