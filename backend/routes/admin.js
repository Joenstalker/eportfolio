const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Course routes
router.get('/courses', auth, adminController.getCourses);
router.post('/courses', auth, adminController.createCourse);
router.put('/courses/:id', auth, adminController.updateCourse);
router.delete('/courses/:id', auth, adminController.deleteCourse);

// Course assignment routes
router.get('/course-assignments', auth, adminController.getCourseAssignments);
router.post('/course-assignments', auth, adminController.createCourseAssignment);
router.delete('/course-assignments/:id', auth, adminController.deleteCourseAssignment);

// User management routes
router.get('/users', auth, adminController.getUsers);
router.post('/users', auth, adminController.createUser);
router.put('/users/:id', auth, adminController.updateUser);
router.delete('/users/:id', auth, adminController.deleteUser);

// Recent uploads
router.get('/uploads', auth, adminController.getUploads);

module.exports = router;