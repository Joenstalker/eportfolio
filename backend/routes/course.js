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
    console.log(`📚 Found ${courses.length} courses`);
    
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
          console.error(`❌ Error checking lock for course ${course._id}:`, lockError.message);
          return {
            ...course.toObject(),
            lockStatus: { isLocked: false }
          };
        }
      })
    );
    
    console.log(`✅ Returning ${coursesWithLocks.length} courses`);
    res.json(coursesWithLocks);
  } catch (error) {
    console.error('❌ Get courses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET single course with lock status
router.get('/:id', async (req, res) => {
    try {
        console.log('📝 Getting single course:', req.params.id);
        const course = await Course.findById(req.params.id);
        if (!course) {
      return res.status(404).json({ message: 'Course not found' });
        }

        const lockStatus = await lockService.checkLock(course._id, 'Course');
        
        res.json({
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
        });
    } catch (error) {
        console.error('❌ Get course error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// LOCK COURSE (Phase 1: Growing Phase)
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

        const userName =
          req.user.name ||
          (req.user.email
            ? req.user.email.split('@')[0].charAt(0).toUpperCase() +
              req.user.email.split('@')[0].slice(1)
            : 'Admin');

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

// UNLOCK COURSE (Phase 2: Shrinking Phase - Release)
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

// UPDATE COURSE (Only allowed with lock)
router.patch('/:id', async (req, res) => {
    try {
        console.log('📝 UPDATE COURSE:', req.params.id);
        
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if user has lock
        const lockStatus = await lockService.checkLock(course._id, 'Course');
        console.log('🔒 Lock status for update:', lockStatus);
        
        if (!lockStatus.isLocked || lockStatus.lock.userId !== req.user.id) {
            return res.status(423).json({
                message: 'You must acquire a lock before editing',
                lockedBy: lockStatus.lock?.userName || 'Another user'
            });
        }

        // Update course
        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            message: 'Course updated successfully',
            course: updatedCourse
        });
    } catch (error) {
        console.error('❌ Update course error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// CREATE course (no lock needed for creation)
router.post('/', async (req, res) => {
    try {
        console.log('➕ CREATE COURSE:', req.body.courseCode);
        const course = new Course(req.body);
        const newCourse = await course.save();
        res.status(201).json(newCourse);
    } catch (error) {
        console.error('❌ Create course error:', error);
        res.status(400).json({ message: error.message });
    }
});

// DELETE course (requires lock)
router.delete('/:id', async (req, res) => {
    try {
        console.log('🗑️ DELETE COURSE:', req.params.id);
        
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if user has lock
        const lockStatus = await lockService.checkLock(course._id, 'Course');
        if (!lockStatus.isLocked || lockStatus.lock.userId !== req.user.id) {
            return res.status(423).json({
                message: 'You must acquire a lock before deleting',
                lockedBy: lockStatus.lock?.userName || 'Another user'
            });
        }

        await Course.findByIdAndDelete(req.params.id);
        
        // Release lock after deletion
        await lockService.releaseLock(course._id, 'Course', req.user.id);
        
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('❌ Delete course error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// CHECK LOCK STATUS
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

// ADMIN: Force unlock (for admins only)
router.post('/:id/force-unlock', async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const result = await lockService.forceReleaseLock(course._id, 'Course');
        
        res.json({
            message: result.message,
            courseId: course._id
        });
    } catch (error) {
        console.error('❌ Force unlock error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// TEST ROUTE - to verify authentication
router.get('/test/auth-info', (req, res) => {
    res.json({
        message: 'Authentication test',
        user: req.user,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;