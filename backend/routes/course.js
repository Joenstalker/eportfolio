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
    console.log('📚 Fetching courses for user:', req.user.email);
    
    const courses = await Course.find();
    console.log('📚 Found ' + courses.length + ' courses');
    
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
          console.error('❌ Error checking lock for course ' + course._id + ':', lockError.message);
          return {
            ...course.toObject(),
            lockStatus: { isLocked: false }
          };
        }
      })
    );
    
    console.log('✅ Returning ' + coursesWithLocks.length + ' courses');
    res.json(coursesWithLocks);
  } catch (error) {
    console.error('❌ Get courses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// LOCK COURSE endpoint
router.post('/:id/lock', async (req, res) => {
  try {
    console.log('🔒 LOCK REQUEST:', {
      courseId: req.params.id,
      user: req.user,
      body: req.body
    });

    const course = await Course.findById(req.params.id);
    if (!course) {
      console.log('❌ Course not found:', req.params.id);
      return res.status(404).json({ message: 'Course not found' });
    }

    console.log('✅ Course found:', course.courseCode);

    const userName = req.user.firstName + ' ' + req.user.lastName;

    const lockResult = await lockService.acquireLock(
      course._id,
      'Course',
      req.user.id,
      req.user.email,
      userName,
      'WRITE',
      req.body.durationMinutes || 15
    );

    console.log('🔒 Lock acquisition result:', lockResult);

    if (!lockResult.success) {
      return res.status(423).json({ // 423 = Locked
        message: lockResult.message,
        lockedBy: lockResult.lockedBy
      });
    }

    res.json({
      message: lockResult.message,
      lock: lockResult.lock,
      expiresAt: lockResult.lock.expiresAt
    });
  } catch (error) {
    console.error('❌ Lock course error:', error);
    console.error('❌ Error details:', error.message);
    res.status(500).json({ 
      message: 'Server error acquiring lock',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// UNLOCK COURSE endpoint
router.post('/:id/unlock', async (req, res) => {
  try {
    console.log('🔓 UNLOCK REQUEST - Course ID:', req.params.id);
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const unlockResult = await lockService.releaseLock(
      course._id,
      'Course',
      req.user.id
    );

    console.log('🔓 Unlock result:', unlockResult);

    if (!unlockResult.success) {
      return res.status(400).json({ message: unlockResult.message });
    }

    res.json({ message: unlockResult.message });
  } catch (error) {
    console.error('❌ Unlock course error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST create new course
router.post('/', async (req, res) => {
  try {
    console.log('➕ Creating new course:', req.body);
    
    const { courseCode, courseName, description, department, credits, prerequisites, semester, maxStudents } = req.body;
    
    // Validate required fields
    if (!courseCode || !courseName || !department || !semester) {
      return res.status(400).json({ 
        message: 'Missing required fields: courseCode, courseName, department, and semester are required' 
      });
    }
    
    // Check if course code already exists
    const existingCourse = await Course.findOne({ courseCode: courseCode.trim().toUpperCase() });
    if (existingCourse) {
      return res.status(400).json({ 
        message: 'Course with this code already exists' 
      });
    }
    
    // Create new course
    const newCourse = new Course({
      courseCode: courseCode.trim().toUpperCase(),
      courseName: courseName.trim(),
      description: description?.trim() || '',
      department: department.trim(),
      credits: credits || 3,
      prerequisites: prerequisites || [],
      semester: semester.trim(),
      maxStudents: maxStudents || 30,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await newCourse.save();
    
    console.log('✅ Course created successfully:', newCourse.courseCode);
    
    res.status(201).json({
      message: 'Course created successfully',
      course: newCourse
    });
    
  } catch (error) {
    console.error('❌ Create course error:', error);
    res.status(500).json({ 
      message: 'Server error creating course',
      error: error.message 
    });
  }
});

// PUT update course
router.put('/:id', async (req, res) => {
  try {
    console.log('📝 Updating course:', req.params.id, req.body);
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if course is locked by another user
    const lockStatus = await lockService.checkLock(course._id, 'Course');
    if (lockStatus.isLocked && lockStatus.lock.userId !== req.user.id) {
      return res.status(423).json({ 
        message: 'Course is locked by another user',
        lockedBy: lockStatus.lock.userName 
      });
    }
    
    const updates = req.body;
    const allowedUpdates = ['courseCode', 'courseName', 'description', 'department', 'credits', 'prerequisites', 'status'];
    const actualUpdates = {};
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        actualUpdates[field] = field === 'courseCode' ? updates[field].trim().toUpperCase() : updates[field];
      }
    });
    
    actualUpdates.updatedAt = new Date();
    
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id, 
      actualUpdates, 
      { new: true, runValidators: true }
    );
    
    console.log('✅ Course updated successfully:', updatedCourse.courseCode);
    
    res.json({
      message: 'Course updated successfully',
      course: updatedCourse
    });
    
  } catch (error) {
    console.error('❌ Update course error:', error);
    res.status(500).json({ 
      message: 'Server error updating course',
      error: error.message 
    });
  }
});

// DELETE/archive course
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ Deleting course:', req.params.id);
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if course is locked by another user
    const lockStatus = await lockService.checkLock(course._id, 'Course');
    if (lockStatus.isLocked && lockStatus.lock.userId !== req.user.id) {
      return res.status(423).json({ 
        message: 'Course is locked by another user',
        lockedBy: lockStatus.lock.userName 
      });
    }
    
    await Course.findByIdAndDelete(req.params.id);
    
    console.log('✅ Course deleted successfully:', course.courseCode);
    
    res.json({
      message: 'Course deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Delete course error:', error);
    res.status(500).json({ 
      message: 'Server error deleting course',
      error: error.message 
    });
  }
});

// GET lock status endpoint
router.get('/:id/lock-status', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const lockStatus = await lockService.checkLock(course._id, 'Course');
    
    res.json({
      isLocked: lockStatus.isLocked,
      lock: lockStatus.lock ? {
        lockedBy: lockStatus.lock.userName,
        lockedByEmail: lockStatus.lock.userEmail,
        expiresAt: lockStatus.lock.expiresAt,
        isLockedByMe: lockStatus.lock.userId === req.user.id
      } : null
    });
  } catch (error) {
    console.error('❌ Check lock status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
