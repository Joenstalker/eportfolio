const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Models to backup
const models = [
  'User', 'Course', 'CourseAssignment', 'InstructionalMaterial',
  'Syllabus', 'SeminarCertificate', 'ClassPortfolio', 'Research',
  'TeachingPortfolio', 'ProfileDashboard', 'Login', 'Lock'
];

// Backup directory
const backupDir = path.join(__dirname, '../backups');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

class BackupUtil {
  // Create a backup of all collections
  static async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 15);
      const backupPath = path.join(backupDir, `backup_${timestamp}.json`);

      const backupData = {};

      // Export data from each model
      for (const modelName of models) {
        try {
          const Model = mongoose.model(modelName);
          const documents = await Model.find({});
          backupData[modelName] = documents;
        } catch (error) {
          console.error(`Error backing up ${modelName}:`, error.message);
        }
      }

      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

      console.log(`Backup created successfully: ${backupPath}`);

      // Keep only recent backups (last 10)
      this.cleanupOldBackups();

      return {
        success: true,
        message: 'Backup created successfully',
        filePath: backupPath
      };
    } catch (error) {
      console.error('Backup error:', error);
      return {
        success: false,
        message: `Backup failed: ${error.message}`
      };
    }
  }

  // Restore from a backup file
  static async restoreFromBackup(backupPath) {
    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file does not exist');
      }

      const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

      // Import data into each collection
      for (const [modelName, documents] of Object.entries(backupData)) {
        try {
          const Model = mongoose.model(modelName);
          
          // Clear existing data
          await Model.deleteMany({});
          
          // Insert new data
          if (documents.length > 0) {
            await Model.insertMany(documents);
          }
        } catch (error) {
          console.error(`Error restoring ${modelName}:`, error.message);
        }
      }

      console.log(`Backup restored successfully: ${backupPath}`);
      return {
        success: true,
        message: 'Backup restored successfully'
      };
    } catch (error) {
      console.error('Restore error:', error);
      return {
        success: false,
        message: `Restore failed: ${error.message}`
      };
    }
  }

  // Get list of available backups
  static getBackupList() {
    try {
      if (!fs.existsSync(backupDir)) {
        return [];
      }

      const files = fs.readdirSync(backupDir);
      const backupFiles = files.filter(file => file.startsWith('backup_') && file.endsWith('.json'));
      
      return backupFiles.map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime
        };
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  // Clean up old backups (keep only the last 10)
  static cleanupOldBackups() {
    try {
      if (!fs.existsSync(backupDir)) {
        return;
      }

      const files = fs.readdirSync(backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
        .sort((a, b) => {
          // Sort by creation timestamp in filename
          const timestampA = a.match(/\d{15}/)?.[0] || '';
          const timestampB = b.match(/\d{15}/)?.[0] || '';
          return timestampB.localeCompare(timestampA); // Descending order
        });

      // Keep only the last 10 backups
      const filesToDelete = backupFiles.slice(10);
      
      for (const file of filesToDelete) {
        const filePath = path.join(backupDir, file);
        fs.unlinkSync(filePath);
        console.log('Deleted old backup:', filePath);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

module.exports = BackupUtil;