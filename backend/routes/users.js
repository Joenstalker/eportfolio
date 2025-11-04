import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get all users (admin only)
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching all users from database...');
    
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${users.length} users`);
    
    res.json({
      success: true,
      users: users,
      count: users.length,
      message: `Successfully retrieved ${users.length} users`
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch users from database',
      message: error.message 
    });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`🔍 Fetching user with ID: ${req.params.id}`);
    
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      console.log('❌ User not found:', req.params.id);
      return res.status(404).json({ 
        success: false,
        error: 'User not found',
        message: 'User with the specified ID was not found in the database'
      });
    }

    console.log('✅ User found:', user.email);
    
    res.json({
      success: true,
      user: user,
      message: 'User retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid user ID',
        message: 'The provided user ID is not valid'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user',
      message: error.message 
    });
  }
});

// Create new user (admin only)
router.post('/', async (req, res) => {
  try {
    const { name, email, password, userType, role, department } = req.body;

    console.log('➕ Creating new user:', email);

    // Validate required fields
    if (!name || !email || !password || !userType || !department) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields',
        message: 'Name, email, password, userType, and department are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(409).json({ 
        success: false,
        error: 'User already exists',
        message: 'A user with this email already exists in the database'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      userType: userType,
      role: role || 'faculty',
      department: department.trim(),
      status: 'active'
    });

    await user.save();
    console.log('✅ User created successfully:', user.email);

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        error: 'Validation error',
        message: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to create user',
      message: error.message 
    });
  }
});

// Update user (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { name, email, userType, role, department, status } = req.body;

    console.log(`✏️ Updating user: ${req.params.id}`);

    // Build update object with only provided fields
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (userType) updateData.userType = userType;
    if (role) updateData.role = role;
    if (department) updateData.department = department.trim();
    if (status) updateData.status = status;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      console.log('❌ User not found for update:', req.params.id);
      return res.status(404).json({ 
        success: false,
        error: 'User not found',
        message: 'User with the specified ID was not found in the database'
      });
    }

    console.log('✅ User updated successfully:', user.email);

    res.json({
      success: true,
      message: 'User updated successfully',
      user: user
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid user ID',
        message: 'The provided user ID is not valid'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        error: 'Validation error',
        message: error.message 
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to update user',
      message: error.message 
    });
  }
});

// Delete user (admin only)
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🗑️ Deleting user: ${req.params.id}`);

    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      console.log('❌ User not found for deletion:', req.params.id);
      return res.status(404).json({ 
        success: false,
        error: 'User not found',
        message: 'User with the specified ID was not found in the database'
      });
    }

    console.log('✅ User deleted successfully:', user.email);

    res.json({
      success: true,
      message: 'User deleted successfully',
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid user ID',
        message: 'The provided user ID is not valid'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete user',
      message: error.message 
    });
  }
});

// Get users by department
router.get('/department/:department', async (req, res) => {
  try {
    const { department } = req.params;
    
    console.log(`🏫 Fetching users for department: ${department}`);
    
    const users = await User.find({ 
      department: new RegExp(department, 'i') 
    }).select('-password').sort({ name: 1 });

    console.log(`✅ Found ${users.length} users in department: ${department}`);
    
    res.json({
      success: true,
      users: users,
      count: users.length,
      department: department,
      message: `Found ${users.length} users in ${department} department`
    });
  } catch (error) {
    console.error('❌ Error fetching users by department:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch users by department',
      message: error.message 
    });
  }
});

// Search users
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    console.log(`🔍 Searching users for: ${query}`);
    
    const users = await User.find({
      $or: [
        { name: new RegExp(query, 'i') },
        { email: new RegExp(query, 'i') },
        { department: new RegExp(query, 'i') }
      ]
    }).select('-password').sort({ name: 1 });

    console.log(`✅ Found ${users.length} users matching: ${query}`);
    
    res.json({
      success: true,
      users: users,
      count: users.length,
      query: query,
      message: `Found ${users.length} users matching "${query}"`
    });
  } catch (error) {
    console.error('❌ Error searching users:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to search users',
      message: error.message 
    });
  }
});

export default router;