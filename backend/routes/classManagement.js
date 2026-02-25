const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const ActivityLogger = require('../services/activityLogger');

// All routes require authentication and faculty role
router.use(auth, requireRole('faculty', 'admin'));

// Get class list for a specific course
router.get('/class-list/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 50, search, year, section } = req.query;
    
    console.log('📋 Fetching class list:', { courseId, page, limit, search, year, section });
    
    const Student = require('../models/Student');
    const Course = require('../models/Course');
    
    // Verify faculty has access to this course
    const course = await Course.findOne({ 
      _id: courseId, 
      facultyId: req.user.id 
    });
    
    if (!course) {
      return res.status(403).json({ 
        message: 'Access denied: You do not have access to this course' 
      });
    }
    
    // Build query
    const query = { courseId, isActive: true };
    
    if (search) {
      query.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (year) {
      query.year = year;
    }
    
    if (section) {
      query.section = { $regex: section, $options: 'i' };
    }
    
    // Get students with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const students = await Student.find(query)
      .populate('addedBy', 'firstName lastName email')
      .sort({ lastName: 1, firstName: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Student.countDocuments(query);
    
    // Calculate class statistics
    const stats = await Student.aggregate([
      { $match: { courseId: mongoose.Types.ObjectId(courseId) } },
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          activeStudents: { $sum: { $cond: ['$isActive', 1, 0] } },
          averageGrade: { $avg: '$averageGrade' },
          attendanceRate: { $avg: '$attendanceRate' }
        }
      }
    ]);
    
    const classStats = stats[0] || {
      totalStudents: 0,
      activeStudents: 0,
      averageGrade: 0,
      attendanceRate: 0
    };
    
    console.log('✅ Class list fetched:', { 
      courseId, 
      total: students.length, 
      totalPages: Math.ceil(total / parseInt(limit)) 
    });
    
    res.json({
      students,
      stats: classStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching class list:', error);
    res.status(500).json({ 
      message: 'Failed to fetch class list',
      error: error.message 
    });
  }
});

// Add student to class
router.post('/class-list/:courseId/students', async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentData = {
      ...req.body,
      courseId,
      facultyId: req.user.id,
      addedBy: req.user.id
    };
    
    console.log('➕ Adding student to class:', { courseId, studentId: studentData.studentId });
    
    const Student = require('../models/Student');
    const Course = require('../models/Course');
    
    // Verify faculty has access to this course
    const course = await Course.findOne({ 
      _id: courseId, 
      facultyId: req.user.id 
    });
    
    if (!course) {
      return res.status(403).json({ 
        message: 'Access denied: You do not have access to this course' 
      });
    }
    
    // Check if student ID already exists in this course
    const existingStudent = await Student.findOne({ 
      courseId, 
      studentId: studentData.studentId 
    });
    
    if (existingStudent) {
      return res.status(400).json({ 
        message: 'Student with this ID already exists in this course' 
      });
    }
    
    const newStudent = new Student(studentData);
    await newStudent.save();
    
    // Log activity
    await ActivityLogger.log(
      req.user.id,
      'STUDENT_ADD',
      `Added student ${studentData.firstName} ${studentData.lastName} to class`,
      {
        resourceType: 'USER',
        resourceId: newStudent._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { 
          courseId, 
          studentId: studentData.studentId,
          studentName: `${studentData.firstName} ${studentData.lastName}`
        }
      }
    );
    
    console.log('✅ Student added successfully:', { 
      studentId: newStudent.studentId, 
      courseId 
    });
    
    res.status(201).json({
      message: 'Student added successfully',
      student: newStudent
    });
    
  } catch (error) {
    console.error('❌ Error adding student:', error);
    res.status(500).json({ 
      message: 'Failed to add student',
      error: error.message 
    });
  }
});

// Update student information
router.put('/class-list/students/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const updates = req.body;
    
    console.log('✏️ Updating student:', { studentId, updates });
    
    const Student = require('../models/Student');
    
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ 
        message: 'Student not found' 
      });
    }
    
    // Verify faculty has access to this student's course
    if (student.facultyId.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Access denied: You do not have access to this student' 
      });
    }
    
    Object.assign(student, updates);
    await student.save();
    
    // Log activity
    await ActivityLogger.log(
      req.user.id,
      'STUDENT_UPDATE',
      `Updated student information for ${student.firstName} ${student.lastName}`,
      {
        resourceType: 'USER',
        resourceId: student._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { 
          studentId: student.studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          updates
        }
      }
    );
    
    console.log('✅ Student updated successfully:', { studentId: student.studentId });
    
    res.json({
      message: 'Student updated successfully',
      student
    });
    
  } catch (error) {
    console.error('❌ Error updating student:', error);
    res.status(500).json({ 
      message: 'Failed to update student',
      error: error.message 
    });
  }
});

// Delete student from class
router.delete('/class-list/students/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    console.log('🗑️ Deleting student:', { studentId });
    
    const Student = require('../models/Student');
    
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ 
        message: 'Student not found' 
      });
    }
    
    // Verify faculty has access to this student's course
    if (student.facultyId.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Access denied: You do not have access to this student' 
      });
    }
    
    // Soft delete by setting isActive to false
    student.isActive = false;
    await student.save();
    
    // Log activity
    await ActivityLogger.log(
      req.user.id,
      'STUDENT_DELETE',
      `Removed student ${student.firstName} ${student.lastName} from class`,
      {
        resourceType: 'USER',
        resourceId: student._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { 
          studentId: student.studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          courseId: student.courseId
        }
      }
    );
    
    console.log('✅ Student deleted successfully:', { studentId: student.studentId });
    
    res.json({
      message: 'Student deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting student:', error);
    res.status(500).json({ 
      message: 'Failed to delete student',
      error: error.message 
    });
  }
});

// Generate class list PDF
router.get('/class-list/:courseId/pdf', async (req, res) => {
  try {
    const { courseId } = req.params;
    
    console.log('📄 Generating class list PDF:', { courseId });
    
    const Student = require('../models/Student');
    const Course = require('../models/Course');
    const puppeteer = require('puppeteer');
    
    // Verify faculty has access to this course
    const course = await Course.findOne({ 
      _id: courseId, 
      facultyId: req.user.id 
    });
    
    if (!course) {
      return res.status(403).json({ 
        message: 'Access denied: You do not have access to this course' 
      });
    }
    
    // Get all students for this course
    const students = await Student.find({ courseId, isActive: true })
      .sort({ lastName: 1, firstName: 1 });
    
    // Generate PDF content
    const pdfContent = generateClassListPDF(course, students);
    
    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    await page.setContent(pdfContent);
    await page.addStyleTag({
      content: `
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          line-height: 1.6;
        }
        h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #1e40af; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
        th { background-color: #f3f4f6; font-weight: bold; }
        .header-info { margin-bottom: 20px; }
        .stats { margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px; }
        @media print { body { margin: 10px; } }
      `
    });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    await browser.close();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="class-list-${course.courseCode}-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Log activity
    await ActivityLogger.log(
      req.user.id,
      'REPORT_GENERATE',
      `Generated class list PDF for ${course.courseCode}`,
      {
        resourceType: 'REPORT',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { 
          courseId,
          courseCode: course.courseCode,
          reportType: 'class-list-pdf'
        }
      }
    );
    
    console.log('✅ Class list PDF generated successfully:', { courseId, courseCode: course.courseCode });
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('❌ Error generating class list PDF:', error);
    res.status(500).json({ 
      message: 'Failed to generate class list PDF',
      error: error.message 
    });
  }
});

// Add grade to student
router.post('/class-list/students/:studentId/grades', async (req, res) => {
  try {
    const { studentId } = req.params;
    const gradeData = req.body;
    
    console.log('📊 Adding grade:', { studentId, gradeData });
    
    const Student = require('../models/Student');
    
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ 
        message: 'Student not found' 
      });
    }
    
    // Verify faculty has access to this student's course
    if (student.facultyId.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Access denied: You do not have access to this student' 
      });
    }
    
    student.grades.push(gradeData);
    await student.save();
    
    // Log activity
    await ActivityLogger.log(
      req.user.id,
      'GRADE_ADD',
      `Added ${gradeData.assessmentType} grade for ${student.firstName} ${student.lastName}`,
      {
        resourceType: 'USER',
        resourceId: student._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { 
          studentId: student.studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          gradeData
        }
      }
    );
    
    console.log('✅ Grade added successfully:', { studentId: student.studentId });
    
    res.status(201).json({
      message: 'Grade added successfully',
      student
    });
    
  } catch (error) {
    console.error('❌ Error adding grade:', error);
    res.status(500).json({ 
      message: 'Failed to add grade',
      error: error.message 
    });
  }
});

// Add attendance record
router.post('/class-list/students/:studentId/attendance', async (req, res) => {
  try {
    const { studentId } = req.params;
    const attendanceData = req.body;
    
    console.log('📅 Adding attendance:', { studentId, attendanceData });
    
    const Student = require('../models/Student');
    
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ 
        message: 'Student not found' 
      });
    }
    
    // Verify faculty has access to this student's course
    if (student.facultyId.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Access denied: You do not have access to this student' 
      });
    }
    
    student.attendance.push(attendanceData);
    await student.save();
    
    // Log activity
    await ActivityLogger.log(
      req.user.id,
      'ATTENDANCE_ADD',
      `Recorded attendance for ${student.firstName} ${student.lastName}`,
      {
        resourceType: 'USER',
        resourceId: student._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { 
          studentId: student.studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          attendanceData
        }
      }
    );
    
    console.log('✅ Attendance added successfully:', { studentId: student.studentId });
    
    res.status(201).json({
      message: 'Attendance recorded successfully',
      student
    });
    
  } catch (error) {
    console.error('❌ Error adding attendance:', error);
    res.status(500).json({ 
      message: 'Failed to record attendance',
      error: error.message 
    });
  }
});

// Helper function to generate PDF content
function generateClassListPDF(course, students) {
  const currentDate = new Date().toLocaleDateString();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Class List - ${course.courseCode}</title>
    </head>
    <body>
      <div class="header-info">
        <h1>Class List</h1>
        <p><strong>Course Code:</strong> ${course.courseCode}</p>
        <p><strong>Course Name:</strong> ${course.courseName}</p>
        <p><strong>Faculty:</strong> ${course.facultyName}</p>
        <p><strong>Generated:</strong> ${currentDate}</p>
      </div>
      
      <div class="stats">
        <h2>Class Statistics</h2>
        <p><strong>Total Students:</strong> ${students.length}</p>
        <p><strong>Active Students:</strong> ${students.filter(s => s.isActive).length}</p>
      </div>
      
      <h2>Student List</h2>
      <table>
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Name</th>
            <th>Year</th>
            <th>Section</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${students.map(student => `
            <tr>
              <td>${student.studentId}</td>
              <td>${student.firstName} ${student.lastName}</td>
              <td>${student.year}</td>
              <td>${student.section}</td>
              <td>${student.email || '-'}</td>
              <td>${student.phone || '-'}</td>
              <td>${student.isActive ? 'Active' : 'Inactive'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

module.exports = router;
