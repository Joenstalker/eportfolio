const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// All routes require authentication and admin role
router.use(auth, requireRole('admin'));

// Get all roles
router.get('/roles', async (req, res) => {
  try {
    console.log('🔑 Fetching all roles');
    
    const Role = require('../models/Role');
    const roles = await Role.find({ isActive: true })
      .sort({ level: 1, name: 1 });
    
    console.log('✅ Roles fetched:', roles.length);
    res.json(roles);
    
  } catch (error) {
    console.error('❌ Error fetching roles:', error);
    res.status(500).json({ 
      message: 'Failed to fetch roles',
      error: error.message 
    });
  }
});

// Get all permissions
router.get('/permissions', async (req, res) => {
  try {
    console.log('🔑 Fetching all permissions');
    
    const Permission = require('../models/Permission');
    const permissions = await Permission.find({ isDefault: true })
      .sort({ category: 1, name: 1 });
    
    console.log('✅ Permissions fetched:', permissions.length);
    res.json(permissions);
    
  } catch (error) {
    console.error('❌ Error fetching permissions:', error);
    res.status(500).json({ 
      message: 'Failed to fetch permissions',
      error: error.message 
    });
  }
});

// Create new role
router.post('/roles', async (req, res) => {
  try {
    const { name, description, level, permissions, departmentAccess, canSelfRegister, requiresAdminApproval } = req.body;
    
    console.log('🔑 Creating new role:', { name, description, level });
    
    if (!name || !description || !level) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, description, level' 
      });
    }
    
    const Role = require('../models/Role');
    const Permission = require('../models/Permission');
    
    // Validate permissions if provided
    let validPermissions = [];
    if (permissions && permissions.length > 0) {
      validPermissions = await Permission.find({ _id: { $in: permissions } });
      
      if (validPermissions.length !== permissions.length) {
        return res.status(400).json({ 
          message: 'Invalid permissions provided' 
        });
      }
    }
    
    const newRole = new Role({
      name: name.toUpperCase().replace(/\s+/g, '_'),
      description,
      level: parseInt(level) || 50,
      permissions: validPermissions,
      departmentAccess: departmentAccess || [],
      canSelfRegister: canSelfRegister || false,
      requiresAdminApproval: requiresAdminApproval !== false,
      isActive: true
    });
    
    await newRole.save();
    
    console.log('✅ Role created successfully:', { name: newRole.name, level: newRole.level });
    
    res.status(201).json({
      message: 'Role created successfully',
      role: newRole
    });
    
  } catch (error) {
    console.error('❌ Error creating role:', error);
    res.status(500).json({ 
      message: 'Failed to create role',
      error: error.message 
    });
  }
});

// Update role
router.put('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log('🔑 Updating role:', { id, updates });
    
    const Role = require('../models/Role');
    const role = await Role.findById(id);
    
    if (!role) {
      return res.status(404).json({ 
        message: 'Role not found' 
      });
    }
    
    // Prevent updating SUPER_ADMIN role
    if (role.name === 'SUPER_ADMIN') {
      return res.status(403).json({ 
        message: 'Cannot modify SUPER_ADMIN role' 
      });
    }
    
    // Validate permissions if provided
    if (updates.permissions) {
      const Permission = require('../models/Permission');
      const validPermissions = await Permission.find({ _id: { $in: updates.permissions } });
      
      if (validPermissions.length !== updates.permissions.length) {
        return res.status(400).json({ 
          message: 'Invalid permissions provided' 
        });
      }
    }
    
    Object.assign(role, updates);
    await role.save();
    
    console.log('✅ Role updated successfully:', { name: role.name });
    
    res.json({
      message: 'Role updated successfully',
      role
    });
    
  } catch (error) {
    console.error('❌ Error updating role:', error);
    res.status(500).json({ 
      message: 'Failed to update role',
      error: error.message 
    });
  }
});

// Delete role
router.delete('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Deleting role:', { id });
    
    const Role = require('../models/Role');
    const role = await Role.findById(id);
    
    if (!role) {
      return res.status(404).json({ 
        message: 'Role not found' 
      });
    }
    
    // Prevent deleting SUPER_ADMIN role
    if (role.name === 'SUPER_ADMIN') {
      return res.status(403).json({ 
        message: 'Cannot delete SUPER_ADMIN role' 
      });
    }
    
    await Role.findByIdAndDelete(id);
    
    console.log('✅ Role deleted successfully:', { name: role.name });
    
    res.json({
      message: 'Role deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting role:', error);
    res.status(500).json({ 
      message: 'Failed to delete role',
      error: error.message 
    });
  }
});

// Add permission to role
router.post('/roles/:roleId/permissions', async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissionId } = req.body;
    
    console.log('🔑 Adding permission to role:', { roleId, permissionId });
    
    const Role = require('../models/Role');
    const Permission = require('../models/Permission');
    
    const role = await Role.findById(roleId);
    const permission = await Permission.findById(permissionId);
    
    if (!role || !permission) {
      return res.status(404).json({ 
        message: 'Role or permission not found' 
      });
    }
    
    // Check if permission already exists
    if (role.permissions.includes(permissionId)) {
      return res.status(400).json({ 
        message: 'Permission already assigned to this role' 
      });
    }
    
    role.permissions.push(permissionId);
    await role.save();
    
    console.log('✅ Permission added to role successfully:', { roleId, permissionId });
    
    res.json({
      message: 'Permission added successfully',
      role
    });
    
  } catch (error) {
    console.error('❌ Error adding permission to role:', error);
    res.status(500).json({ 
      message: 'Failed to add permission to role',
      error: error.message 
    });
  }
});

// Remove permission from role
router.delete('/roles/:roleId/permissions', async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissionId } = req.body;
    
    console.log('🗑️ Removing permission from role:', { roleId, permissionId });
    
    const Role = require('../models/Role');
    
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ 
        message: 'Role not found' 
      });
    }
    
    // Check if permission exists
    const permissionIndex = role.permissions.indexOf(permissionId);
    if (permissionIndex === -1) {
      return res.status(400).json({ 
        message: 'Permission not assigned to this role' 
      });
    }
    
    role.permissions.splice(permissionIndex, 1);
    await role.save();
    
    console.log('✅ Permission removed from role successfully:', { roleId, permissionId });
    
    res.json({
      message: 'Permission removed successfully',
      role
    });
    
  } catch (error) {
    console.error('❌ Error removing permission from role:', error);
    res.status(500).json({ 
      message: 'Failed to remove permission from role',
      error: error.message 
    });
  }
});

// Get system settings
router.get('/settings', async (req, res) => {
  try {
    console.log('⚙️ Fetching system settings');
    
    // Return default system settings
    const settings = {
      selfRegistrationEnabled: false,
      adminApprovalRequired: true,
      defaultRole: 'FACULTY',
      maxLoginAttempts: 5,
      sessionTimeout: 30, // minutes
      passwordMinLength: 8,
      require2FA: false,
      maintenanceMode: false
    };
    
    console.log('✅ System settings fetched:', settings);
    res.json(settings);
    
  } catch (error) {
    console.error('❌ Error fetching system settings:', error);
    res.status(500).json({ 
      message: 'Failed to fetch system settings',
      error: error.message 
    });
  }
});

// Update system settings
router.put('/settings', async (req, res) => {
  try {
    const settings = req.body;
    
    console.log('⚙️ Updating system settings:', settings);
    
    // Validate settings
    const allowedSettings = [
      'selfRegistrationEnabled',
      'adminApprovalRequired',
      'defaultRole',
      'maxLoginAttempts',
      'sessionTimeout',
      'passwordMinLength',
      'require2FA',
      'maintenanceMode'
    ];
    
    const invalidSettings = Object.keys(settings).filter(key => !allowedSettings.includes(key));
    if (invalidSettings.length > 0) {
      return res.status(400).json({ 
        message: 'Invalid settings provided',
        invalidSettings 
      });
    }
    
    // In a real implementation, these would be stored in a database or config file
    // For now, we'll just return the updated settings
    console.log('✅ System settings updated successfully:', settings);
    
    res.json({
      message: 'System settings updated successfully',
      settings
    });
    
  } catch (error) {
    console.error('❌ Error updating system settings:', error);
    res.status(500).json({ 
      message: 'Failed to update system settings',
      error: error.message 
    });
  }
});

module.exports = router;
