// Centralized Admin Controllers Index
const courseController = require('./courseController');
const userController = require('./userController');
const backupController = require('./backupController');
const reportController = require('./reportController');

module.exports = {
  // Course Management
  getCourses: courseController.getCourses,
  createCourse: courseController.createCourse,
  updateCourse: courseController.updateCourse,
  deleteCourse: courseController.deleteCourse,
  getCourseLock: courseController.getLockStatus,
  acquireCourseLock: courseController.acquireLock,
  releaseCourseLock: courseController.releaseLock,

  // Course Assignments
  getCourseAssignments: courseController.getAssignments,
  createCourseAssignment: courseController.createAssignment,
  deleteCourseAssignment: courseController.deleteAssignment,

  // User Management
  getUsers: userController.getAllUsers,
  createUser: userController.createUser,
  updateUser: userController.updateUser,
  deleteUser: userController.deleteUser,
  getUserStats: userController.getUserStats,

  // Backup Management
  getBackups: backupController.listBackups,
  createBackup: backupController.createBackup,
  restoreBackup: backupController.restoreBackup,
  deleteBackup: backupController.deleteBackup,

  // Reporting
  getSystemStats: reportController.getSystemStats,
  getUsageReport: reportController.getUsageReport,
  getPerformanceMetrics: reportController.getPerformanceMetrics,
  exportReport: reportController.exportReport
};