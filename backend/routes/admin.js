const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const adminController = require('../controllers/adminController');
const BackupUtil = require('../utils/backup');

/**
 * All routes in this file are ADMIN‑ONLY.
 * - We first require a valid JWT (auth)
 * - Then we enforce role === 'admin' with requireRole('admin')
 */
router.use(auth, requireRole('admin'));

// Course routes
router.get('/courses', adminController.getCourses);
router.post('/courses', adminController.createCourse);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

// Course lock management routes
router.get('/courses/:id/lock-status', adminController.getLockStatus);
router.post('/courses/:id/acquire-lock', adminController.acquireLock);
router.post('/courses/:id/release-lock', adminController.releaseLock);

// Course assignment routes
router.get('/course-assignments', adminController.getCourseAssignments);
router.post('/course-assignments', adminController.createCourseAssignment);
router.delete('/course-assignments/:id', adminController.deleteCourseAssignment);

// User management routes
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Recent uploads
router.get('/uploads', adminController.getUploads);

// Backup routes
router.get('/backups', adminController.getBackups);
router.post('/backups/create', adminController.createBackup);
router.post('/backups/restore/:filename', adminController.restoreBackup);

module.exports = router;