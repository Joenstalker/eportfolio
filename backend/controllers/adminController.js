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

// Password Management
exports.resetUserPassword = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { temporaryPassword } = req.body;
    const { id } = req.params;

    if (!temporaryPassword || temporaryPassword.length < 6) {
      return res.status(400).json({ message: 'Temporary password must be at least 6 characters' });
    }

    // Hash the temporary password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

    // Update user password and set reset flags
    const user = await User.findByIdAndUpdate(
      id,
      { 
        password: hashedPassword,
        requirePasswordChange: true,
        passwordChangedAt: new Date()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the password reset action
    console.log(`Admin reset password for user: ${user.email}`);

    res.json({ 
      message: 'Password reset successfully',
      user: {
        id: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      }
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.changeUserPassword = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { newPassword } = req.body;
    const { id } = req.params;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password and clear reset flags
    const user = await User.findByIdAndUpdate(
      id,
      { 
        password: hashedPassword,
        requirePasswordChange: false,
        passwordChangedAt: new Date()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the password change action
    console.log(`Admin changed password for user: ${user.email}`);

    res.json({ 
      message: 'Password changed successfully',
      user: {
        id: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      }
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error' });
  }
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
    console.log('🔍 Create assignment request received');
    console.log('🔍 User:', req.user);
    console.log('🔍 Request body:', req.body);
    
    if (!requireAdmin(req, res)) return;

    const { facultyId, courseId, semester, section } = req.body;
    
    console.log('🔍 Extracted data:', { facultyId, courseId, semester, section });
    
    // Validate required fields
    if (!facultyId || !courseId) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        message: 'Missing required fields: facultyId and courseId are required' 
      });
    }

    console.log('🔍 Looking up faculty...');
    // Check if faculty exists
    const User = require('../models/User');
    const faculty = await User.findById(facultyId);
    if (!faculty) {
      console.log('❌ Faculty not found:', facultyId);
      return res.status(404).json({ message: 'Faculty not found' });
    }
    console.log('✅ Faculty found:', faculty.firstName, faculty.lastName);

    console.log('🔍 Looking up course...');
    // Check if course exists
    const Course = require('../models/Course');
    const course = await Course.findById(courseId);
    if (!course) {
      console.log('❌ Course not found:', courseId);
      return res.status(404).json({ message: 'Course not found' });
    }
    console.log('✅ Course found:', course.courseCode, course.courseName);

    console.log('🔍 Checking for existing assignment...');
    // Check if assignment already exists
    const CourseAssignment = require('../models/CourseAssignment');
    const existingAssignment = await CourseAssignment.findOne({
      facultyId,
      courseId,
      semester: semester || 'First Semester',
      section: section
    });

    if (existingAssignment) {
      console.log('❌ Assignment already exists');
      return res.status(400).json({ 
        message: 'Faculty is already assigned to this course for this semester' 
      });
    }

    console.log('🔍 Creating new assignment...');
    // Create new assignment
    const newAssignment = new CourseAssignment({
      facultyId,
      courseId,
      semester: semester || 'First Semester',
      section: section,
      status: 'active',
      assignedAt: new Date(),
      assignedBy: req.user.id
    });

    await newAssignment.save();
    console.log('✅ Assignment saved to database');

    console.log('🔍 Populating assignment data...');
    // Populate the assignment with faculty and course details for response
    const populatedAssignment = await CourseAssignment.findById(newAssignment._id)
      .populate('facultyId', 'firstName lastName email')
      .populate('courseId', 'courseCode courseName department');

    console.log('✅ Course assignment created:', {
      faculty: faculty.firstName + ' ' + faculty.lastName,
      course: course.courseCode,
      semester: semester || 'First Semester'
    });

    res.status(201).json({
      message: 'Faculty assigned to course successfully',
      assignment: populatedAssignment
    });

  } catch (error) {
    console.error('❌ Create course assignment error:', error);
    console.error('❌ Error stack:', error.stack);
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
