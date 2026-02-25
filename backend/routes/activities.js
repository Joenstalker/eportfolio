const express = require('express');
const router = express.Router();
const ActivityLogger = require('../services/activityLogger');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// All routes require authentication and admin role
router.use(auth, requireRole('admin'));

// Get user activities with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      resourceType,
      startDate,
      endDate,
      search,
      export: exportFlag
    } = req.query;

    console.log('📋 Fetching user activities:', {
      page, limit, userId, action, resourceType, startDate, endDate, search, exportFlag
    });

    // Build filters
    const filters = {};
    if (userId && userId !== 'all') {
      filters.userId = userId;
    }
    if (action && action !== 'all') {
      filters.action = action;
    }
    if (resourceType && resourceType !== 'all') {
      filters.resourceType = resourceType;
    }
    if (startDate || endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }

    // Handle export request
    if (exportFlag === 'true') {
      const activities = await ActivityLogger.getActivities({
        ...filters,
        limit: 10000 // Large limit for export
      });

      const csv = generateActivitiesCSV(activities);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="user-activities-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
      return;
    }

    // Get paginated activities
    const activities = await ActivityLogger.getActivities({
      ...filters,
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    // Get total count for pagination
    const UserActivity = require('../models/UserActivity');
    const query = {};
    
    if (filters.userId) query.userId = filters.userId;
    if (filters.action) query.action = filters.action;
    if (filters.resourceType) query.resourceType = filters.resourceType;
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    const total = await UserActivity.countDocuments(query);

    // Apply search filter if provided
    let filteredActivities = activities;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredActivities = activities.filter(activity => {
        const user = activity.userId;
        const userName = user ? `${user.firstName} ${user.lastName}`.toLowerCase() : '';
        const userEmail = user ? user.email.toLowerCase() : '';
        const description = activity.description.toLowerCase();
        
        return userName.includes(searchLower) || 
               userEmail.includes(searchLower) || 
               description.includes(searchLower);
      });
    }

    console.log('✅ Activities fetched:', {
      total: filteredActivities.length,
      page,
      totalPages: Math.ceil(total / parseInt(limit))
    });

    res.json({
      activities: filteredActivities,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });

  } catch (error) {
    console.error('❌ Error fetching activities:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user activities',
      error: error.message 
    });
  }
});

// Get activity statistics
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    console.log('📊 Fetching activity stats:', { startDate, endDate });

    const stats = await ActivityLogger.getActivityStats(startDate, endDate);
    
    res.json({
      stats,
      period: { startDate, endDate },
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('❌ Error fetching activity stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch activity statistics',
      error: error.message 
    });
  }
});

// Clear all activity logs
router.delete('/clear', async (req, res) => {
  try {
    console.log('🗑️ Clearing all activity logs');
    
    const UserActivity = require('../models/UserActivity');
    const result = await UserActivity.deleteMany({});
    
    console.log('✅ Activity logs cleared:', { deletedCount: result.deletedCount });
    
    res.json({
      message: 'Activity logs cleared successfully',
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('❌ Error clearing activity logs:', error);
    res.status(500).json({ 
      message: 'Failed to clear activity logs',
      error: error.message 
    });
  }
});

// Get activities for specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    console.log('👤 Fetching activities for user:', { userId, page, limit });

    const activities = await ActivityLogger.getActivities({
      userId,
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    const UserActivity = require('../models/UserActivity');
    const total = await UserActivity.countDocuments({ userId });

    res.json({
      activities,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });

  } catch (error) {
    console.error('❌ Error fetching user activities:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user activities',
      error: error.message 
    });
  }
});

// ==================== HELPER FUNCTIONS ====================

function generateActivitiesCSV(activities) {
  const headers = [
    'Timestamp',
    'User Name',
    'User Email',
    'Action',
    'Description',
    'Resource Type',
    'IP Address',
    'User Agent',
    'Duration',
    'Status',
    'Error Message'
  ];

  const rows = activities.map(activity => [
    new Date(activity.timestamp).toISOString(),
    activity.userId ? `${activity.userId.firstName} ${activity.userId.lastName}` : 'Unknown',
    activity.userId ? activity.userId.email : 'Unknown',
    activity.action,
    activity.description,
    activity.resourceType || '',
    activity.ipAddress || '',
    activity.userAgent || '',
    activity.duration || 0,
    activity.success ? 'Success' : 'Failed',
    activity.errorMessage || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    )
  ].join('\n');

  return csvContent;
}

module.exports = router;
