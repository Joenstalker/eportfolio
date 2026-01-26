const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Helper to ensure the requester is an admin
const requireAdmin = (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Access denied. Admin only.' });
    return false;
  }
  return true;
};

const BACKUP_DIR = path.join(__dirname, '../../backups');

// Ensure backup directory exists
const ensureBackupDir = async () => {
  try {
    await fs.access(BACKUP_DIR);
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }
};

exports.listBackups = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    await ensureBackupDir();
    
    const files = await fs.readdir(BACKUP_DIR);
    const backups = [];

    for (const file of files) {
      if (file.endsWith('.zip')) {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filePath);
        backups.push({
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        });
      }
    }

    // Sort by creation date (newest first)
    backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(backups);
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createBackup = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    await ensureBackupDir();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}.zip`;
    const backupPath = path.join(BACKUP_DIR, backupName);

    // Execute mongodump command
    const { stdout, stderr } = await execPromise(
      `mongodump --uri="${process.env.MONGODB_URI}" --archive=${backupPath} --gzip`
    );

    if (stderr) {
      console.error('Backup stderr:', stderr);
    }

    // Get file info
    const stats = await fs.stat(backupPath);
    
    res.json({
      filename: backupName,
      size: stats.size,
      createdAt: stats.birthtime,
      message: 'Backup created successfully'
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ 
      message: 'Backup failed',
      error: error.message 
    });
  }
};

exports.restoreBackup = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { filename } = req.params;
    const backupPath = path.join(BACKUP_DIR, filename);

    // Verify file exists
    try {
      await fs.access(backupPath);
    } catch {
      return res.status(404).json({ message: 'Backup file not found' });
    }

    // Execute mongorestore command
    const { stdout, stderr } = await execPromise(
      `mongorestore --uri="${process.env.MONGODB_URI}" --archive=${backupPath} --gzip --drop`
    );

    if (stderr) {
      console.error('Restore stderr:', stderr);
    }

    res.json({ message: 'Backup restored successfully' });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ 
      message: 'Restore failed',
      error: error.message 
    });
  }
};

exports.deleteBackup = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { filename } = req.params;
    const backupPath = path.join(BACKUP_DIR, filename);

    // Verify file exists
    try {
      await fs.access(backupPath);
    } catch {
      return res.status(404).json({ message: 'Backup file not found' });
    }

    await fs.unlink(backupPath);
    
    res.json({ message: 'Backup deleted successfully' });
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ message: 'Server error' });
  }
};