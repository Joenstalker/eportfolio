import express from 'express';
import Login from '../models/Login'; // Adjust path as needed
import mongoose from 'mongoose';

const router = express.Router();

// GET /api/logins - Get all login records with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      userId,
      userEmail,
      userType,
      loginMethod,
      success,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (userId) {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        filter.userId = userId;
      } else {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }
    }
    
    if (userEmail) {
      filter.userEmail = { $regex: userEmail, $options: 'i' };
    }
    
    if (userType) {
      filter.userType = userType;
    }
    
    if (loginMethod) {
      filter.loginMethod = loginMethod;
    }
    
    if (success !== undefined) {
      filter.success = success === 'true';
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const logins = await Login.find(filter)
      .populate('userId', 'name email') // Populate user details if needed
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count for pagination
    const total = await Login.countDocuments(filter);

    res.json({
      logins,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalRecords: total
    });
  } catch (error) {
    console.error('Error fetching login records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/logins/:id - Get single login record by ID
router.get('/:id', async (req, res) => {
  try {
    const login = await Login.findById(req.params.id)
      .populate('userId', 'name email department'); // Adjust populated fields as needed

    if (!login) {
      return res.status(404).json({ error: 'Login record not found' });
    }

    res.json(login);
  } catch (error) {
    console.error('Error fetching login record:', error);
    
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ error: 'Invalid login ID format' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/logins - Create a new login record
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      userType,
      loginMethod,
      ipAddress,
      userAgent,
      success,
      failureReason,
      recaptchaVerified,
      deviceInfo
    } = req.body;

    // Validation
    if (!userId || !userEmail || !userType || !loginMethod || !ipAddress || !userAgent || success === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const login = new Login({
      userId,
      userEmail,
      userType,
      loginMethod,
      ipAddress,
      userAgent,
      success,
      failureReason: success ? undefined : failureReason,
      recaptchaVerified: recaptchaVerified || false,
      deviceInfo
    });

    const savedLogin = await login.save();
    res.status(201).json(savedLogin);
  } catch (error) {
    console.error('Error creating login record:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/logins/user/:userId - Get login records for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const logins = await Login.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Login.countDocuments({ userId });

    res.json({
      logins,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalRecords: total
    });
  } catch (error) {
    console.error('Error fetching user login records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/logins/analytics/summary - Get login analytics summary
router.get('/analytics/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const [
      totalLogins,
      successfulLogins,
      failedLogins,
      loginsByMethod,
      loginsByUserType,
      recentLogins
    ] = await Promise.all([
      // Total login attempts
      Login.countDocuments(dateFilter),
      
      // Successful logins
      Login.countDocuments({ ...dateFilter, success: true }),
      
      // Failed logins
      Login.countDocuments({ ...dateFilter, success: false }),
      
      // Logins by method
      Login.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$loginMethod', count: { $sum: 1 } } }
      ]),
      
      // Logins by user type
      Login.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$userType', count: { $sum: 1 } } }
      ]),
      
      // Recent login attempts (last 24 hours)
      Login.countDocuments({
        ...dateFilter,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    ]);

    const successRate = totalLogins > 0 ? (successfulLogins / totalLogins) * 100 : 0;

    res.json({
      summary: {
        totalLogins,
        successfulLogins,
        failedLogins,
        successRate: Math.round(successRate * 100) / 100,
        recent24Hours: recentLogins
      },
      byMethod: loginsByMethod,
      byUserType: loginsByUserType
    });
  } catch (error) {
    console.error('Error generating login analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/logins/:id - Delete a login record (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const login = await Login.findByIdAndDelete(req.params.id);

    if (!login) {
      return res.status(404).json({ error: 'Login record not found' });
    }

    res.json({ message: 'Login record deleted successfully' });
  } catch (error) {
    console.error('Error deleting login record:', error);
    
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ error: 'Invalid login ID format' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;