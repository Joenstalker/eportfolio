// Admin routes
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// All routes require authentication and admin role
router.use(auth, role(['admin']));

// Course routes
router.get('/courses', adminController.getCourses);
router.post('/courses', adminController.createCourse);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

// Course lock routes
router.get('/courses/:id/lock', adminController.getLockStatus);
router.post('/courses/:id/lock', adminController.acquireLock);
router.delete('/courses/:id/lock', adminController.releaseLock);

// Course assignment routes
router.get('/assignments', adminController.getCourseAssignments);
router.post('/assignments', adminController.createCourseAssignment);
router.delete('/assignments/:id', adminController.deleteCourseAssignment);

// User routes
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Backup routes
router.get('/backups', adminController.getBackups);
router.post('/backups', adminController.createBackup);
router.post('/backups/restore/:filename', adminController.restoreBackup);

// Upload routes
router.get('/uploads', adminController.getUploads);

module.exports = router;