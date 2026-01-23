const bcrypt = require('bcryptjs');

const User = require('../models/User');
const InstructionalMaterial = require('../models/InstructionalMaterial');
const Syllabus = require('../models/Syllabus');
const SeminarCertificate = require('../models/SeminarCertificate');
const ClassPortfolio = require('../models/ClassPortfolio');
const Research = require('../models/Research');
const Course = require('../models/Course');
const CourseAssignment = require('../models/CourseAssignment');

const ServiceLock = require('../services/serviceLock');
const path = require('path');

// Helper to ensure the requester is an admin
const requireAdmin = (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Access denied. Admin only.' });
    return false;
  }
  return true;
};

// ===== Course Management =====

exports.getCourses = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const courses = await Course.find().sort({ courseCode: 1 });
    
    // Add lock status to each course
    const coursesWithLockStatus = await Promise.all(courses.map(async (course) => {
      const lock = await ServiceLock.isLocked(course._id, 'course');
      let lockUserInfo = null;
      if (lock && lock.userId) {
        // Get user info for the lock
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
    
    // Acquire a lock for this user (or refresh existing lock)
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
      // Release the lock if course was not found
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
        message: 'Course is currently being edited by another user',
        lockInfo: {
          lockedByUsername: `${lock.userId.firstName || ''} ${lock.userId.lastName || ''}`.trim(),
          acquiredAt: lock.acquiredAt
        }
      });
    }
    
    // Acquire a lock for this user (or refresh existing lock)
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
    
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      // Release the lock if course was not found
      await ServiceLock.release(
        req.params.id,
        'course',
        req.user.id,
        req.headers['x-session-id'] || req.sessionID || 'default-session'
      );
      return res.status(404).json({ message: 'Course not found' });
    }

    await CourseAssignment.deleteMany({ courseId: req.params.id });
    
    // Release the lock after successful deletion
    await ServiceLock.release(
      req.params.id,
      'course',
      req.user.id,
      req.headers['x-session-id'] || req.sessionID || 'default-session'
    );

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== Course Lock Management =====

exports.getLockStatus = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    
    const lock = await ServiceLock.isLocked(req.params.id, 'course');
    
    if (lock) {
      const user = await User.findById(lock.userId).select('firstName lastName email');
      res.json({ 
        isLocked: true, 
        lockInfo: {
          lockedBy: lock.userId,
          lockedByUsername: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown User',
          acquiredAt: lock.acquiredAt
        }
      });
    } else {
      res.json({ isLocked: false });
    }
  } catch (error) {
    console.error('Error checking lock status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.acquireLock = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    
    const lockAcquired = await ServiceLock.acquire(
      req.params.id,
      'course',
      req.user.id,
      req.headers['x-session-id'] || req.sessionID || 'default-session'
    );
    
    if (lockAcquired) {
      res.json({ success: true, message: 'Lock acquired successfully' });
    } else {
      const lock = await ServiceLock.isLocked(req.params.id, 'course');
      if (lock) {
        const user = await User.findById(lock.userId).select('firstName lastName email');
        res.status(409).json({ 
          success: false, 
          message: 'Course is currently being edited by another user',
          lockInfo: {
            lockedBy: lock.userId,
            lockedByUsername: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown User',
            acquiredAt: lock.acquiredAt
          }
        });
      } else {
        res.status(500).json({ success: false, message: 'Failed to acquire lock' });
      }
    }
  } catch (error) {
    console.error('Error acquiring lock:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.releaseLock = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    
    const released = await ServiceLock.release(
      req.params.id,
      'course',
      req.user.id,
      req.headers['x-session-id'] || req.sessionID || 'default-session'
    );
    
    if (released) {
      res.json({ success: true, message: 'Lock released successfully' });
    } else {
      res.status(400).json({ success: false, message: 'No lock found to release or lock owned by different user' });
    }
  } catch (error) {
    console.error('Error releasing lock:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== Course Assignments =====

exports.getCourseAssignments = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const assignments = await CourseAssignment.find()
      .populate('facultyId', 'name email department')
      .populate('courseId', 'courseCode courseName credits');

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching course assignments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createCourseAssignment = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { facultyId, courseId, semester, section } = req.body;

    const existingAssignment = await CourseAssignment.findOne({
      facultyId,
      courseId,
      semester
    });

    if (existingAssignment) {
      return res.status(400).json({ message: 'Faculty already assigned to this course for the semester' });
    }

    const assignment = new CourseAssignment({
      facultyId,
      courseId,
      semester,
      section: section || 'A'
    });

    await assignment.save();

    await assignment.populate('facultyId', 'name email department');
    await assignment.populate('courseId', 'courseCode courseName credits');

    res.status(201).json({ assignment, message: 'Faculty assigned to course successfully' });
  } catch (error) {
    console.error('Error assigning faculty to course:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCourseAssignment = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const assignment = await CourseAssignment.findByIdAndDelete(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({ message: 'Assignment removed successfully' });
  } catch (error) {
    console.error('Error removing assignment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== User Management =====

exports.getUsers = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const users = await User.find({}, '-password').lean();
    const mapped = users.map(u => {
      const safeFirst = u.firstName || u.name || '';
      const safeLast = u.lastName || '';
      return {
        _id: u._id,
        name: `${safeFirst} ${safeLast}`.trim() || 'User',
        email: u.email || '',
        department: u.department || '',
        role: u.role || 'faculty',
        status: u.isActive === false ? 'inactive' : 'active'
      };
    });

    res.json(mapped);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createUser = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { name, firstName, lastName, email, password, department, role } = req.body;

    const normalizedEmail = (email || '').toLowerCase().trim();
    const normalizedDept = (department || '').trim();
    const normalizedRole = (role || '').toString().toLowerCase() === 'admin' ? 'admin' : 'faculty';

    if (!normalizedEmail || !password || !normalizedDept || (!firstName && !name)) {
      return res.status(400).json({ message: 'Missing required fields (name, email, password, department)' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [fn, ...lnParts] = (name || '').trim().split(' ');
    const newUser = new User({
      firstName: firstName || fn || 'New',
      lastName: lastName || lnParts.join(' ') || 'User',
      email: normalizedEmail,
      password: hashedPassword,
      department: normalizedDept,
      role: normalizedRole,
      isActive: true
    });

    await newUser.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: newUser._id,
        name: `${newUser.firstName} ${newUser.lastName}`.trim(),
        email: newUser.email,
        department: newUser.department,
        role: newUser.role,
        status: newUser.isActive ? 'active' : 'inactive'
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error?.code === 11000) {
      const dupField = Object.keys(error.keyPattern || {})[0] || 'email';
      const dupValue = (error.keyValue && error.keyValue[dupField]) || '';
      return res.status(409).json({ message: `${dupField} already in use`, field: dupField, value: dupValue });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { name, firstName, lastName, email, department, role, status } = req.body;

    const update = {};
    if (email) update.email = email.toLowerCase().trim();
    if (department) update.department = department.trim();
    if (role) update.role = role.toString().toLowerCase() === 'admin' ? 'admin' : 'faculty';
    if (typeof status !== 'undefined') {
      update.isActive = status === 'active' || status === true;
    }
    if (name || firstName || lastName) {
      if (name && !firstName && !lastName) {
        const [fn, ...lnParts] = name.trim().split(' ');
        update.firstName = fn;
        update.lastName = lnParts.join(' ');
      } else {
        if (firstName) update.firstName = firstName;
        if (lastName) update.lastName = lastName;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: {
        _id: updatedUser._id,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
        email: updatedUser.email,
        department: updatedUser.department,
        role: updatedUser.role,
        status: updatedUser.isActive ? 'active' : 'inactive'
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== Backup Management =====

exports.getBackups = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    
    const BackupUtil = require('../utils/backup');
    const backups = BackupUtil.getBackupList();
    res.json({ backups });
  } catch (error) {
    console.error('Error getting backups:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createBackup = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    
    const BackupUtil = require('../utils/backup');
    const result = await BackupUtil.createBackup();
    res.json(result);
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.restoreBackup = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    
    const BackupUtil = require('../utils/backup');
    const backupPath = path.join(__dirname, '../backups', req.params.filename);
    const result = await BackupUtil.restoreFromBackup(backupPath);
    res.json(result);
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== Recent Uploads =====

exports.getUploads = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const [materials, syllabi, seminars, classPortfolios, researches] = await Promise.all([
      InstructionalMaterial.find({}).populate('facultyId', 'firstName lastName').lean(),
      Syllabus.find({}).populate('facultyId', 'firstName lastName').lean(),
      SeminarCertificate.find({}).populate('facultyId', 'firstName lastName').lean(),
      ClassPortfolio.find({}).lean(),
      Research.find({}).populate('facultyId', 'firstName lastName').lean()
    ]);

    const uploads = [];

    materials.forEach(m => {
      if (m.file && (m.file.fileUrl || m.file.filePath || m.file.fileName)) {
        uploads.push({
          source: 'InstructionalMaterial',
          title: m.title || m.subjectName || m.file.fileName || 'Material',
          fileName: m.file.fileName || null,
          fileUrl: m.file.fileUrl || null,
          uploadedAt: m.file.uploadedAt || m.createdAt || m.updatedAt || null,
          faculty: m.facultyId ? `${m.facultyId.firstName || ''} ${m.facultyId.lastName || ''}`.trim() : null,
          raw: m
        });
      }
    });

    syllabi.forEach(s => {
      if (s.syllabusFile && (s.syllabusFile.fileUrl || s.syllabusFile.fileName)) {
        uploads.push({
          source: 'Syllabus',
          title: `${s.subjectCode || ''} ${s.subjectName || ''}`.trim() || s.syllabusFile.fileName || 'Syllabus',
          fileName: s.syllabusFile.fileName || null,
          fileUrl: s.syllabusFile.fileUrl || null,
          uploadedAt: s.syllabusFile.uploadedAt || s.createdAt || s.updatedAt || null,
          faculty: s.facultyId ? `${s.facultyId.firstName || ''} ${s.facultyId.lastName || ''}`.trim() : null,
          raw: s
        });
      }
    });

    seminars.forEach(se => {
      if (se.certificateFile && (se.certificateFile.fileUrl || se.certificateFile.fileName)) {
        uploads.push({
          source: 'SeminarCertificate',
          title: se.title || se.certificateFile.fileName || 'Seminar',
          fileName: se.certificateFile.fileName || null,
          fileUrl: se.certificateFile.fileUrl || null,
          uploadedAt: se.certificateFile.uploadedAt || se.createdAt || se.updatedAt || null,
          faculty: se.facultyId ? `${se.facultyId.firstName || ''} ${se.facultyId.lastName || ''}`.trim() : null,
          raw: se
        });
      }
    });

    classPortfolios.forEach(cp => {
      if (Array.isArray(cp.materials) && cp.materials.length) {
        cp.materials.forEach(mat => {
          if (mat.fileUrl || mat.filePath || mat.title) {
            uploads.push({
              source: 'ClassPortfolio',
              title: mat.title || mat.fileName || 'Class Material',
              fileName: mat.fileName || null,
              fileUrl: mat.fileUrl || null,
              uploadedAt: mat.uploadDate || mat.uploadedAt || cp.createdAt || null,
              faculty: cp.faculty ? (cp.faculty.toString ? cp.faculty.toString() : null) : null,
              raw: mat
            });
          }
        });
      }

      if (cp.file && (cp.file.path || cp.file.filename || cp.file.originalName)) {
        uploads.push({
          source: 'ClassPortfolio',
          title: cp.title || cp.file.originalName || 'Class Material',
          fileName: cp.file.originalName || cp.file.filename || null,
          fileUrl: cp.file.path || null,
          uploadedAt: cp.createdAt || null,
          faculty: cp.faculty ? (cp.faculty.toString ? cp.faculty.toString() : null) : null,
          raw: cp
        });
      }
    });

    researches.forEach(r => {
      if (r.file && (r.file.fileUrl || r.file.fileName)) {
        uploads.push({
          source: 'Research',
          title: r.title || r.file.fileName || 'Research Paper',
          fileName: r.file.fileName || null,
          fileUrl: r.file.fileUrl || null,
          uploadedAt: r.file.uploadedAt || r.createdAt || r.updatedAt || null,
          faculty: r.facultyId ? `${r.facultyId.firstName || ''} ${r.facultyId.lastName || ''}`.trim() : null,
          raw: r
        });
      }
    });

    const sorted = uploads
      .filter(u => u.uploadedAt)
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    const withNulls = uploads.filter(u => !u.uploadedAt);

    const combined = [...sorted, ...withNulls].slice(0, 50);

    res.json({ uploads: combined });
  } catch (error) {
    console.error('Error fetching uploads:', error);
    res.status(500).json({ message: 'Server error' });
  }
};