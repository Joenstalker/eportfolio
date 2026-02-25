const UserActivity = require('../models/UserActivity');

class ActivityLogger {
  static async log(userId, action, description, additionalData = {}) {
    try {
      const activity = new UserActivity({
        userId,
        action,
        description,
        resourceType: additionalData.resourceType,
        resourceId: additionalData.resourceId,
        ipAddress: additionalData.ipAddress,
        userAgent: additionalData.userAgent,
        metadata: additionalData.metadata || {},
        duration: additionalData.duration || 0,
        success: additionalData.success !== false,
        errorMessage: additionalData.errorMessage
      });

      await activity.save();
      
      console.log('📝 Activity logged:', {
        userId,
        action,
        description,
        timestamp: new Date().toISOString()
      });

      return activity;
    } catch (error) {
      console.error('❌ Failed to log activity:', error);
      // Don't throw error to avoid breaking main functionality
      return null;
    }
  }

  static async logLogin(userId, ipAddress, userAgent, success = true, errorMessage = null) {
    return this.log(userId, 'LOGIN', `User ${success ? 'logged in' : 'failed to login'}`, {
      resourceType: 'USER',
      ipAddress,
      userAgent,
      success,
      errorMessage
    });
  }

  static async logLogout(userId, ipAddress, userAgent) {
    return this.log(userId, 'LOGOUT', 'User logged out', {
      resourceType: 'USER',
      ipAddress,
      userAgent
    });
  }

  static async logProfileUpdate(userId, changes, ipAddress) {
    return this.log(userId, 'PROFILE_UPDATE', `Profile updated: ${Object.keys(changes).join(', ')}`, {
      resourceType: 'USER',
      resourceId: userId,
      ipAddress,
      metadata: { changes }
    });
  }

  static async logCourseAction(userId, action, courseId, courseName, ipAddress) {
    const actionText = {
      'COURSE_CREATE': 'created',
      'COURSE_UPDATE': 'updated',
      'COURSE_DELETE': 'deleted/archived'
    }[action] || 'modified';

    return this.log(userId, action, `Course ${actionText}: ${courseName}`, {
      resourceType: 'COURSE',
      resourceId: courseId,
      ipAddress,
      metadata: { courseName }
    });
  }

  static async logFacultyAction(userId, action, facultyId, facultyName, ipAddress) {
    const actionText = {
      'FACULTY_CREATE': 'created',
      'FACULTY_UPDATE': 'updated',
      'FACULTY_ARCHIVE': 'archived',
      'FACULTY_UNARCHIVE': 'unarchived'
    }[action] || 'modified';

    return this.log(userId, action, `Faculty ${actionText}: ${facultyName}`, {
      resourceType: 'USER',
      resourceId: facultyId,
      ipAddress,
      metadata: { facultyName }
    });
  }

  static async logAssignmentAction(userId, action, assignmentId, details, ipAddress) {
    const actionText = {
      'ASSIGNMENT_CREATE': 'created',
      'ASSIGNMENT_UPDATE': 'updated',
      'ASSIGNMENT_DELETE': 'deleted'
    }[action] || 'modified';

    return this.log(userId, action, `Faculty assignment ${actionText}`, {
      resourceType: 'ASSIGNMENT',
      resourceId: assignmentId,
      ipAddress,
      metadata: details
    });
  }

  static async logFileUpload(userId, fileName, fileType, fileSize, ipAddress) {
    return this.log(userId, 'FILE_UPLOAD', `File uploaded: ${fileName}`, {
      resourceType: 'FILE',
      ipAddress,
      metadata: { fileName, fileType, fileSize }
    });
  }

  static async logReportGeneration(userId, reportType, ipAddress) {
    return this.log(userId, 'REPORT_GENERATE', `Report generated: ${reportType}`, {
      resourceType: 'REPORT',
      ipAddress,
      metadata: { reportType }
    });
  }

  static async logSeminarAction(userId, action, seminarId, seminarTitle, ipAddress) {
    const actionText = {
      'SEMINAR_CREATE': 'created',
      'SEMINAR_UPDATE': 'updated',
      'SEMINAR_DELETE': 'deleted'
    }[action] || 'modified';

    return this.log(userId, action, `Seminar ${actionText}: ${seminarTitle}`, {
      resourceType: 'SEMINAR',
      resourceId: seminarId,
      ipAddress,
      metadata: { seminarTitle }
    });
  }

  static async logResearchAction(userId, action, researchId, researchTitle, ipAddress) {
    const actionText = {
      'RESEARCH_CREATE': 'created',
      'RESEARCH_UPDATE': 'updated',
      'RESEARCH_DELETE': 'deleted'
    }[action] || 'modified';

    return this.log(userId, action, `Research ${actionText}: ${researchTitle}`, {
      resourceType: 'RESEARCH',
      resourceId: researchId,
      ipAddress,
      metadata: { researchTitle }
    });
  }

  static async getActivities(filters = {}) {
    try {
      const query = {};
      
      if (filters.userId) {
        query.userId = filters.userId;
      }
      
      if (filters.action) {
        query.action = filters.action;
      }
      
      if (filters.resourceType) {
        query.resourceType = filters.resourceType;
      }
      
      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) {
          query.timestamp.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.timestamp.$lte = new Date(filters.endDate);
        }
      }
      
      const activities = await UserActivity.find(query)
        .populate('userId', 'firstName lastName email department role')
        .sort({ timestamp: -1 })
        .limit(filters.limit || 1000);
      
      return activities;
    } catch (error) {
      console.error('❌ Error fetching activities:', error);
      throw error;
    }
  }

  static async getActivityStats(startDate, endDate) {
    try {
      const matchStage = {};
      if (startDate || endDate) {
        matchStage.timestamp = {};
        if (startDate) matchStage.timestamp.$gte = new Date(startDate);
        if (endDate) matchStage.timestamp.$lte = new Date(endDate);
      }

      const stats = await UserActivity.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              action: '$action',
              date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
            },
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' }
          }
        },
        {
          $group: {
            _id: '$_id.action',
            totalCount: { $sum: '$count' },
            dailyAverage: { $avg: '$count' },
            uniqueUserCount: { $sum: { $size: '$uniqueUsers' } }
          }
        },
        { $sort: { totalCount: -1 } }
      ]);

      return stats;
    } catch (error) {
      console.error('❌ Error calculating activity stats:', error);
      throw error;
    }
  }
}

module.exports = ActivityLogger;
