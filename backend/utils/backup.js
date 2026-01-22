const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { exec } = require('child_process');
const moment = require('moment');

// Models to backup
const models = ['User', 'Course', 'CourseAssignment', 'InstructionalMaterial', 'Syllabus', 'SeminarCertificate', 'ClassPortfolio', 'Research', 'Extension'];

class BackupUtil {
    /**
     * Creates a backup of the entire database
     * @returns {Promise<Object>} Result of the backup operation
     */
    static async createBackup() {
        try {
            const timestamp = moment().format('YYYYMMDD_HHmmss');
            const backupDir = path.join(__dirname, '../backups');
            const backupFileName = `backup_${timestamp}.json`;
            const backupPath = path.join(backupDir, backupFileName);

            // Create backups directory if it doesn't exist
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

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

            // Write backup data to file
            fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

            console.log(`✅ Backup created successfully: ${backupPath}`);

            // Keep only recent backups (last 10)
            await this.cleanupOldBackups();

            return {
                success: true,
                message: 'Backup created successfully',
                filePath: backupPath,
                timestamp,
                stats: Object.keys(backupData).reduce((acc, key) => {
                    acc[key] = backupData[key].length;
                    return acc;
                }, {})
            };
        } catch (error) {
            console.error('❌ Backup error:', error);
            return {
                success: false,
                message: `Backup failed: ${error.message}`
            };
        }
    }

    /**
     * Restores the database from a backup file
     * @param {string} backupFilePath - Path to the backup file
     * @returns {Promise<Object>} Result of the restore operation
     */
    static async restoreFromBackup(backupFilePath) {
        try {
            if (!fs.existsSync(backupFilePath)) {
                throw new Error('Backup file does not exist');
            }

            const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

            // Clear existing data and restore from backup
            for (const modelName in backupData) {
                try {
                    const Model = mongoose.model(modelName);
                    
                    // Delete all existing documents
                    await Model.deleteMany({});
                    
                    // Insert backup data
                    if (backupData[modelName].length > 0) {
                        await Model.insertMany(backupData[modelName]);
                    }
                    
                    console.log(`✅ Restored ${backupData[modelName].length} ${modelName} documents`);
                } catch (error) {
                    console.error(`❌ Error restoring ${modelName}:`, error.message);
                    throw error;
                }
            }

            return {
                success: true,
                message: 'Restore completed successfully'
            };
        } catch (error) {
            console.error('❌ Restore error:', error);
            return {
                success: false,
                message: `Restore failed: ${error.message}`
            };
        }
    }

    /**
     * Gets list of available backups
     * @returns {Array} List of backup files with metadata
     */
    static getBackupList() {
        const backupDir = path.join(__dirname, '../backups');
        
        if (!fs.existsSync(backupDir)) {
            return [];
        }

        const files = fs.readdirSync(backupDir);
        const backupFiles = files
            .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
            .map(file => {
                const filePath = path.join(backupDir, file);
                const stat = fs.statSync(filePath);
                const match = file.match(/backup_(\d{8}_\d{6})\.json$/);
                
                return {
                    filename: file,
                    filepath: filePath,
                    size: stat.size,
                    createdAt: stat.birthtime,
                    timestamp: match ? match[1] : null
                };
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return backupFiles;
    }

    /**
     * Cleans up old backups, keeping only the most recent ones
     * @param {number} keepCount - Number of recent backups to keep (default: 10)
     */
    static async cleanupOldBackups(keepCount = 10) {
        try {
            const backups = this.getBackupList();
            
            if (backups.length <= keepCount) {
                return; // Nothing to clean up
            }

            // Sort by creation date (newest first) and get files to delete
            const backupsToDelete = backups.slice(keepCount);

            for (const backup of backupsToDelete) {
                fs.unlinkSync(backup.filepath);
                console.log(`🗑️ Deleted old backup: ${backup.filename}`);
            }

            console.log(`✅ Cleaned up ${backupsToDelete.length} old backups`);
        } catch (error) {
            console.error('❌ Cleanup error:', error);
        }
    }

    /**
     * Schedules automatic backups
     * @param {string} cronExpression - Cron expression for backup schedule
     */
    static scheduleAutomaticBackups(cronExpression = '0 2 * * *') { // Default: daily at 2 AM
        console.log(`📅 Scheduled automatic backups: ${cronExpression}`);
        
        // In a real implementation, you would use a scheduler like node-cron
        // For now, we'll just log the scheduled backup
        setInterval(async () => {
            console.log('🔄 Running scheduled backup...');
            await this.createBackup();
        }, 24 * 60 * 60 * 1000); // Every 24 hours
    }
}

module.exports = BackupUtil;