// services/serviceLock.js
const Lock = require('../models/Lock');

class LockService {
    // Acquire a lock for a resource
    async acquireLock(resourceId, resourceType, userId, userEmail, userName, lockType = 'WRITE', durationMinutes = 15) {
        try {
            console.log('🔒 Acquiring lock for:', { resourceId, userId, userEmail });

            // Clean up expired locks first
            await this.cleanupExpiredLocks(resourceId, resourceType);

            // Check if there's an active lock
            const existingLock = await Lock.findOne({
                resourceId,
                resourceType,
                isActive: true
            });

            console.log('🔍 Existing lock:', existingLock ? 'Found' : 'Not found');

            if (existingLock) {
                // Check if it's the same user
                if (existingLock.userId === userId) { // CHANGED: No need for toString()
                    // Extend the lock
                    existingLock.expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
                    await existingLock.save();
                    console.log('⏱️ Lock extended');
                    return {
                        success: true,
                        lock: existingLock,
                        message: 'Lock extended'
                    };
                } else {
                    // Someone else has the lock
                    console.log('🚫 Locked by another user:', existingLock.userEmail);
                    return {
                        success: false,
                        message: 'Resource is locked by another user',
                        lockedBy: {
                            name: existingLock.userName,
                            email: existingLock.userEmail,
                            expiresAt: existingLock.expiresAt
                        }
                    };
                }
            }

            // Create new lock
            const lock = new Lock({
                resourceId,
                resourceType,
                userId, // This is now a String
                userEmail,
                userName,
                lockType,
                expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000)
            });

            await lock.save();
            console.log('✅ New lock created:', lock._id);
            
            return {
                success: true,
                lock,
                message: 'Lock acquired successfully'
            };
        } catch (error) {
            console.error('❌ Lock acquisition error:', error);
            throw error;
        }
    }

    // Release a lock
    async releaseLock(resourceId, resourceType, userId) {
        try {
            console.log('🔓 Releasing lock:', { resourceId, userId });
            
            const lock = await Lock.findOne({
                resourceId,
                resourceType,
                userId, // CHANGED: Direct comparison since userId is String
                isActive: true
            });

            if (!lock) {
                console.log('⚠️ No active lock found');
                return {
                    success: false,
                    message: 'No active lock found'
                };
            }

            // Use the release method
            lock.isActive = false;
            await lock.save();
            
            console.log('✅ Lock released');
            return {
                success: true,
                message: 'Lock released successfully'
            };
        } catch (error) {
            console.error('❌ Lock release error:', error);
            throw error;
        }
    }

    // Force release lock (admin only)
    async forceReleaseLock(resourceId, resourceType) {
        try {
            const result = await Lock.updateMany(
                {
                    resourceId,
                    resourceType,
                    isActive: true
                },
                {
                    $set: { isActive: false }
                }
            );

            return {
                success: true,
                message: `Released ${result.modifiedCount} lock(s)`
            };
        } catch (error) {
            console.error('Force release error:', error);
            throw error;
        }
    }

    // Check lock status
    async checkLock(resourceId, resourceType) {
        try {
            const lock = await Lock.findOne({
                resourceId,
                resourceType,
                isActive: true,
                expiresAt: { $gt: new Date() }
            });

            if (!lock) {
                return {
                    isLocked: false,
                    message: 'Resource is available'
                };
            }

            return {
                isLocked: true,
                lock,
                message: 'Resource is locked'
            };
        } catch (error) {
            console.error('Lock check error:', error);
            throw error;
        }
    }

    // Clean up expired locks
    async cleanupExpiredLocks(resourceId = null, resourceType = null) {
        try {
            const filter = {
                isActive: true,
                expiresAt: { $lt: new Date() }
            };

            if (resourceId) filter.resourceId = resourceId;
            if (resourceType) filter.resourceType = resourceType;

            const result = await Lock.updateMany(
                filter,
                { $set: { isActive: false } }
            );

            if (result.modifiedCount > 0) {
                console.log(`🧹 Cleaned up ${result.modifiedCount} expired lock(s)`);
            }

            return result;
        } catch (error) {
            console.error('Cleanup error:', error);
            throw error;
        }
    }

    // Get all locks for a user
    async getUserLocks(userId) {
        try {
            return await Lock.find({
                userId, // CHANGED: Direct comparison
                isActive: true,
                expiresAt: { $gt: new Date() }
            });
        } catch (error) {
            console.error('Get user locks error:', error);
            throw error;
        }
    }
}

module.exports = new LockService();