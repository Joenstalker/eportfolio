// routes/course.js
const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const lockService = require('../services/lockService');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// Must contain at least one letter and one number (e.g., T77, CS101, IT-202)
const COURSE_CODE_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9-]{3,15}$/;

// All course management endpoints are ADMIN-only and require a valid JWT
router.use(auth, requireRole('admin'));

// GET all courses with lock status
router.get('/', async (req, res) => {
  try {
    console.log('📚 Fetching courses for user:', req.user.email);
    
    const courses = await Course.find();
    console.log('📚 Found ' + courses.length + ' courses');
    
    // Add lock status and totalStudents to each course
    const coursesWithDetails = await Promise.all(
      courses.map(async (course) => {
        try {
          const lockStatus = await lockService.checkLock(course._id, 'Course');
          return {
            ...course.toObject(),
            totalStudents: course.totalStudents, // Include totalStudents
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
            totalStudents: course.totalStudents, // Include totalStudents even on error
          };
        }
      })
    );
    
    res.json(coursesWithDetails);
  } catch (error) {
    console.error('❌ Error fetching courses:', error.message);
    res.status(500).json({ message: 'Server error fetching courses', error: error.message });
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
    console.log('🔓 UNLOCK REQUEST - Course ID:', req.params.id, 'User:', req.user.email);
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    try {
      const unlockResult = await lockService.releaseLock(
        course._id,
        'Course',
        req.user.id
      );

      console.log('🔓 Unlock result:', unlockResult);

      if (!unlockResult.success) {
        console.log('🔓 Unlock failed:', unlockResult.message);
        // For better UX, treat "no lock found" as success since the goal is to ensure no lock
        if (unlockResult.message.includes('No lock found')) {
          return res.json({ message: unlockResult.message });
        }
        return res.status(400).json({ message: unlockResult.message });
      }

      res.json({ message: unlockResult.message });
    } catch (lockError) {
      // If lock service fails (MongoDB unreachable), return success anyway
      console.log('⚠️ Lock service error during unlock:', lockError.message);
      res.json({ message: 'Course unlocked (lock service unavailable)' });
    }
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
    
    const normalizedCourseCode = courseCode.trim().toUpperCase();

    if (!COURSE_CODE_PATTERN.test(normalizedCourseCode)) {
      return res.status(400).json({
        message: 'Invalid course code format. Use 3-15 characters with at least one letter and one number.'
      });
    }

    // Check if course code already exists
    const existingCourse = await Course.findOne({ courseCode: normalizedCourseCode });
    if (existingCourse) {
      return res.status(400).json({ 
        message: 'Course with this code already exists' 
      });
    }
    
    // Create new course
    const newCourse = new Course({
      courseCode: normalizedCourseCode,
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
    console.log('📝 Updating course:', req.params.id, 'Body fields:', Object.keys(req.body));
    console.log('📝 Full body:', req.body);
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if course is locked by another user
    let lockStatus = { isLocked: false };
    try {
      lockStatus = await lockService.checkLock(course._id, 'Course');
    } catch (lockError) {
      console.log('⚠️ Lock service unavailable (MongoDB connection issue):', lockError.message);
      // Continue without lock check if MongoDB is unreachable
    }
    
    if (lockStatus.isLocked && lockStatus.lock?.userId !== req.user.id) {
      return res.status(423).json({ 
        message: 'Course is locked by another user',
        lockedBy: lockStatus.lock?.userName || 'Another admin'
      });
    }
    
    const updates = req.body;
    const allowedUpdates = ['courseCode', 'courseName', 'description', 'department', 'credits', 'prerequisites', 'status', 'semester', 'maxStudents'];
    const actualUpdates = {};
    
    allowedUpdates.forEach(field => {
      if (updates[field] === undefined) {
        return;
      }

      if (field === 'courseCode') {
        actualUpdates[field] = String(updates[field]).trim().toUpperCase();
        return;
      }

      if (field === 'courseName' || field === 'description' || field === 'department' || field === 'semester') {
        actualUpdates[field] = typeof updates[field] === 'string' ? updates[field].trim() : updates[field];
        return;
      }

      if (field === 'credits' || field === 'maxStudents') {
        const parsedValue = Number(updates[field]);
        if (!Number.isFinite(parsedValue)) {
          throw new Error(`${field} must be a valid number`);
        }
        actualUpdates[field] = parsedValue;
        return;
      }

      actualUpdates[field] = updates[field];
    });

    if (actualUpdates.courseCode) {
      if (!COURSE_CODE_PATTERN.test(actualUpdates.courseCode)) {
        return res.status(400).json({
          message: 'Invalid course code format. Use 3-15 characters with at least one letter and one number.'
        });
      }

      const duplicateCourse = await Course.findOne({
        courseCode: actualUpdates.courseCode,
        _id: { $ne: req.params.id }
      }).select('_id courseCode');

      if (duplicateCourse) {
        return res.status(400).json({ message: 'Course code already exists' });
      }
    }
    
    console.log('📝 Allowed updates:', allowedUpdates);
    console.log('📝 Actual updates to apply:', actualUpdates);
    
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
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);

    if (error.name === 'ValidationError') {
      const firstValidationMessage = Object.values(error.errors || {})[0]?.message;
      return res.status(400).json({
        message: firstValidationMessage || 'Invalid course data'
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        message: `Invalid value for ${error.path || 'field'}`
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({ message: 'Course code already exists' });
    }

    if (typeof error.message === 'string' && error.message.includes('must be a valid number')) {
      return res.status(400).json({ message: error.message });
    }

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
