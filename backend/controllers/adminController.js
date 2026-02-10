const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Course = require('../models/Course');
const path = require('path');

// Helper to ensure the requester is an admin
const requireAdmin = (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Access denied. Admin only.' });
    return false;
  }
  return true;
};

// User Management
exports.getUsers = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const users = await User.find({}, '-password')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createUser = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { firstName, lastName, email, password, role, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || 'faculty',
      department,
      isActive: true
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { id } = req.params;
    const updates = req.body;

    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Course Management (basic implementations)
exports.getCourses = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createCourse = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const course = new Course(req.body);
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { id } = req.params;
    const course = await Course.findByIdAndUpdate(id, req.body, { new: true });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ message: 'Course updated successfully', course });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { id } = req.params;
    const course = await Course.findByIdAndDelete(id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Placeholder implementations for other required methods
exports.getLockStatus = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    res.json({ message: 'Lock status endpoint - not implemented' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.acquireLock = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    res.json({ message: 'Acquire lock endpoint - not implemented' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.releaseLock = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    res.json({ message: 'Release lock endpoint - not implemented' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUploads = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    res.json({ message: 'Uploads endpoint - not implemented' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Placeholder for assignment methods
exports.getCourseAssignments = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const CourseAssignment = require('../models/CourseAssignment');
    
    // Get all assignments with populated faculty and course details
    const assignments = await CourseAssignment.find()
      .populate('facultyId', 'firstName lastName email department')
      .populate('courseId', 'courseCode courseName department')
      .sort({ assignedAt: -1 });

    console.log('✅ Retrieved course assignments:', assignments.length);

    res.json(assignments);
  } catch (error) {
    console.error('❌ Get course assignments error:', error);
    res.status(500).json({ 
      message: 'Server error fetching assignments',
      error: error.message 
    });
  }
};

exports.createCourseAssignment = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { facultyId, courseId, semester, section } = req.body;
    
    // Validate required fields
    if (!facultyId || !courseId) {
      return res.status(400).json({ 
        message: 'Missing required fields: facultyId and courseId are required' 
      });
    }

    // Check if faculty exists
    const User = require('../models/User');
    const faculty = await User.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    // Check if course exists
    const Course = require('../models/Course');
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if assignment already exists
    const CourseAssignment = require('../models/CourseAssignment');
    const existingAssignment = await CourseAssignment.findOne({
      facultyId,
      courseId,
      semester: semester || 'Fall 2025',
      section: section || 'A'
    });

    if (existingAssignment) {
      return res.status(400).json({ 
        message: 'Faculty is already assigned to this course for this semester' 
      });
    }

    // Create new assignment
    const newAssignment = new CourseAssignment({
      facultyId,
      courseId,
      semester: semester || 'Fall 2025',
      section: section || 'A',
      status: 'active',
      assignedAt: new Date(),
      assignedBy: req.user.id
    });

    await newAssignment.save();

    // Populate the assignment with faculty and course details for response
    const populatedAssignment = await CourseAssignment.findById(newAssignment._id)
      .populate('facultyId', 'firstName lastName email')
      .populate('courseId', 'courseCode courseName department');

    console.log('✅ Course assignment created:', {
      faculty: faculty.firstName + ' ' + faculty.lastName,
      course: course.courseCode,
      semester: semester || 'Fall 2025'
    });

    res.status(201).json({
      message: 'Faculty assigned to course successfully',
      assignment: populatedAssignment
    });

  } catch (error) {
    console.error('❌ Create course assignment error:', error);
    res.status(500).json({ 
      message: 'Server error creating assignment',
      error: error.message 
    });
  }
};

exports.deleteCourseAssignment = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    res.json({ message: 'Delete course assignment endpoint - not implemented' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Placeholder for backup methods
exports.getBackups = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    res.json({ message: 'Backups endpoint - not implemented' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createBackup = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    res.json({ message: 'Create backup endpoint - not implemented' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.restoreBackup = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    res.json({ message: 'Restore backup endpoint - not implemented' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
