const Course = require('../../models/Course');
const CourseAssignment = require('../../models/CourseAssignment');
const ServiceLock = require('../../services/serviceLock');
const User = require('../../models/User');

// Helper to ensure the requester is an admin
const requireAdmin = (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Access denied. Admin only.' });
    return false;
  }
  return true;
};

// Course Management
exports.getCourses = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const courses = await Course.find().sort({ courseCode: 1 });
    
    // Add lock status to each course
    const coursesWithLockStatus = await Promise.all(courses.map(async (course) => {
      const lock = await ServiceLock.isLocked(course._id, 'course');
      let lockUserInfo = null;
      if (lock && lock.userId) {
        const user = await User.findById(lock.userId).select('firstName lastName email');
        lockUserInfo = {
          lockedBy: lock.userId,
          lockedByUsername: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown User',
          acquiredAt: lock.acquiredAt
        };
      }
      return {
        ...course.toObject(),
        isLocked: !!lock,
        lockInfo: lockUserInfo
      };
    }));
    
    res.json(coursesWithLockStatus);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createCourse = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const {
      courseCode,
      courseName,
      description,
      credits,
      department,
      semester,
      maxStudents,
      prerequisites
    } = req.body;

    const existingCourse = await Course.findOne({ courseCode });
    if (existingCourse) {
      return res.status(400).json({ message: 'Course code already exists' });
    }

    const course = new Course({
      courseCode,
      courseName,
      description,
      credits,
      department,
      semester,
      maxStudents,
      prerequisites: prerequisites || []
    });

    await course.save();
    res.status(201).json({ course, message: 'Course created successfully' });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const {
      courseCode,
      courseName,
      description,
      credits,
      department,
      semester,
      maxStudents,
      prerequisites,
      status
    } = req.body;
    
    // Check if the course is locked by someone else
    const lock = await ServiceLock.isLocked(req.params.id, 'course');
    if (lock && lock.userId.toString() !== req.user.id) {
      return res.status(409).json({ 
        message: 'Course is currently being edited by another user',
        lockInfo: {
          lockedByUsername: `${lock.userId.firstName || ''} ${lock.userId.lastName || ''}`.trim(),
          acquiredAt: lock.acquiredAt
        }
      });
    }
    
    // Acquire a lock for this user
    const lockAcquired = await ServiceLock.acquire(
      req.params.id,
      'course',
      req.user.id,
      req.headers['x-session-id'] || req.sessionID || 'default-session'
    );
    
    if (!lockAcquired) {
      return res.status(409).json({ 
        message: 'Failed to acquire lock on course',
        reason: 'Another user has acquired the lock since your request'
      });
    }
    
    // Update the course
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      {
        courseCode,
        courseName,
        description,
        credits,
        department,
        semester,
        maxStudents,
        prerequisites,
        status
      },
      { new: true }
    );

    if (!course) {
      await ServiceLock.release(
        req.params.id,
        'course',
        req.user.id,
        req.headers['x-session-id'] || req.sessionID || 'default-session'
      );
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ course, message: 'Course updated successfully' });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    // Check if the course is locked by someone else
    const lock = await ServiceLock.isLocked(req.params.id, 'course');
    if (lock && lock.userId.toString() !== req.user.id) {
      return res.status(409).json({ 
        message: 'Course is currently being edited by another user'
      });
    }
    
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Course Lock Management
exports.getLockStatus = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const lock = await ServiceLock.isLocked(req.params.id, 'course');
    res.json({ isLocked: !!lock, lockInfo: lock });
  } catch (error) {
    console.error('Error getting lock status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.acquireLock = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const sessionId = req.headers['x-session-id'] || req.sessionID || 'default-session';
    const lockAcquired = await ServiceLock.acquire(
      req.params.id,
      'course',
      req.user.id,
      sessionId
    );

    if (lockAcquired) {
      res.json({ message: 'Lock acquired successfully' });
    } else {
      res.status(409).json({ message: 'Failed to acquire lock' });
    }
  } catch (error) {
    console.error('Error acquiring lock:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.releaseLock = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const sessionId = req.headers['x-session-id'] || req.sessionID || 'default-session';
    const released = await ServiceLock.release(
      req.params.id,
      'course',
      req.user.id,
      sessionId
    );

    if (released) {
      res.json({ message: 'Lock released successfully' });
    } else {
      res.status(404).json({ message: 'Lock not found or not owned by user' });
    }
  } catch (error) {
    console.error('Error releasing lock:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Course Assignments
exports.getAssignments = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const assignments = await CourseAssignment.find()
      .populate('courseId', 'courseCode courseName')
      .populate('facultyId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createAssignment = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { courseId, facultyId, startDate, endDate, status } = req.body;

    const assignment = new CourseAssignment({
      courseId,
      facultyId,
      startDate,
      endDate,
      status: status || 'active'
    });

    await assignment.save();
    res.status(201).json({ assignment, message: 'Assignment created successfully' });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const assignment = await CourseAssignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};