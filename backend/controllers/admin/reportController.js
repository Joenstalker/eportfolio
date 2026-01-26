const User = require('../../models/User');
const Course = require('../../models/Course');
const TeachingPortfolio = require('../../models/TeachingPortfolio');
const ClassPortfolio = require('../../models/ClassPortfolio');
const Research = require('../../models/Research');
const SeminarCertificate = require('../../models/SeminarCertificate');

// Helper to ensure the requester is an admin
const requireAdmin = (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Access denied. Admin only.' });
    return false;
  }
  return true;
};

exports.getSystemStats = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    // User Statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const facultyCount = await User.countDocuments({ role: 'faculty' });
    const adminCount = await User.countDocuments({ role: 'admin' });

    // Content Statistics
    const totalCourses = await Course.countDocuments();
    const activeCourses = await Course.countDocuments({ status: 'active' });
    
    const teachingPortfolios = await TeachingPortfolio.countDocuments();
    const classPortfolios = await ClassPortfolio.countDocuments();
    const researchPapers = await Research.countDocuments();
    const seminarCertificates = await SeminarCertificate.countDocuments();

    // Department Distribution
    const departmentStats = await User.aggregate([
      { $match: { role: 'faculty' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        faculty: facultyCount,
        admins: adminCount
      },
      content: {
        courses: {
          total: totalCourses,
          active: activeCourses
        },
        portfolios: {
          teaching: teachingPortfolios,
          class: classPortfolios
        },
        research: researchPapers,
        seminars: seminarCertificates
      },
      departments: departmentStats
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUsageReport = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // User activity
    const newUsers = await User.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });

    // Content creation
    const newCourses = await Course.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });

    const newTeachingPortfolios = await TeachingPortfolio.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });

    // Login activity (would need login tracking)
    const activeUsersLast30Days = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      period: { start, end },
      newUserRegistrations: newUsers,
      newCoursesCreated: newCourses,
      newTeachingPortfolios: newTeachingPortfolios,
      activeUsersLast30Days: activeUsersLast30Days
    });
  } catch (error) {
    console.error('Error generating usage report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPerformanceMetrics = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    // Average content per user
    const facultyUsers = await User.find({ role: 'faculty' }).select('_id');
    const facultyIds = facultyUsers.map(user => user._id);

    const avgTeachingPortfolios = await TeachingPortfolio.countDocuments({
      facultyId: { $in: facultyIds }
    }) / facultyUsers.length;

    const avgClassPortfolios = await ClassPortfolio.countDocuments({
      facultyId: { $in: facultyIds }
    }) / facultyUsers.length;

    const avgResearchPapers = await Research.countDocuments({
      facultyId: { $in: facultyIds }
    }) / facultyUsers.length;

    // System uptime (would need monitoring)
    const systemUptime = "99.9%"; // Placeholder

    res.json({
      contentPerUser: {
        averageTeachingPortfolios: Math.round(avgTeachingPortfolios),
        averageClassPortfolios: Math.round(avgClassPortfolios),
        averageResearchPapers: Math.round(avgResearchPapers)
      },
      systemPerformance: {
        uptime: systemUptime,
        responseTime: "150ms" // Placeholder
      }
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.exportReport = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { type } = req.params; // 'csv', 'pdf', 'json'
    const { startDate, endDate } = req.query;

    // Generate report data based on type
    let reportData;
    
    switch (type) {
      case 'users':
        reportData = await User.find({}, '-password').sort({ createdAt: -1 });
        break;
      case 'courses':
        reportData = await Course.find().sort({ createdAt: -1 });
        break;
      case 'activity':
        // Would need activity tracking implementation
        reportData = { message: 'Activity tracking not implemented' };
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=report-${type}-${Date.now()}.json`);
    
    res.json(reportData);
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};