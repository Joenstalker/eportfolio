const mongoose = require('mongoose');

// Define the lock schema
const lockSchema = new mongoose.Schema({
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  resourceType: {
    type: String,
    required: true,
    enum: ['Course', 'course'], // Support both naming conventions
    index: true
  },
  userId: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  lockType: {
    type: String,
    enum: ['READ', 'WRITE'],
    default: 'WRITE'
  },
  acquiredAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
lockSchema.index({ resourceId: 1, resourceType: 1 });

// Create the Lock model
const Lock = mongoose.model('Lock', lockSchema);

class LockService {
  /**
   * Check if a resource is currently locked
   * @param {ObjectId} resourceId - ID of the resource to check
   * @param {string} resourceType - Type of the resource ('Course', etc.)
   * @returns {Promise<Object>} - Lock status object
   */
  static async checkLock(resourceId, resourceType) {
    try {
      const lock = await Lock.findOne({
        resourceId,
        resourceType
      });

      if (lock) {
        // Check if lock is expired
        if (new Date() > lock.expiresAt) {
          await Lock.deleteOne({ _id: lock._id });
          return { isLocked: false };
        }
        
        return {
          isLocked: true,
          lock: {
            userId: lock.userId,
            userEmail: lock.userEmail,
            userName: lock.userName,
            lockType: lock.lockType,
            acquiredAt: lock.acquiredAt,
            expiresAt: lock.expiresAt
          }
        };
      }
      
      return { isLocked: false };
    } catch (error) {
      console.error('Error checking lock:', error);
      return { isLocked: false };
    }
  }

  /**
   * Acquire a lock on a resource
   * @param {ObjectId} resourceId - ID of the resource to lock
   * @param {string} resourceType - Type of the resource ('Course', etc.)
   * @param {string} userId - ID of the user requesting the lock
   * @param {string} userEmail - Email of the user
   * @param {string} userName - Name of the user
   * @param {string} lockType - Type of lock ('READ' or 'WRITE')
   * @param {number} durationMinutes - Duration in minutes (default: 15)
   * @returns {Promise<Object>} - Result object with success status
   */
  static async acquireLock(resourceId, resourceType, userId, userEmail, userName, lockType = 'WRITE', durationMinutes = 15) {
    try {
      // Check if already locked
      const existingLock = await Lock.findOne({
        resourceId,
        resourceType
      });

      if (existingLock) {
        // Check if it's the same user
        if (existingLock.userId === userId) {
          // Refresh the lock
          const newExpiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
          await Lock.updateOne(
            { _id: existingLock._id },
            { 
              $set: { 
                expiresAt: newExpiresAt,
                acquiredAt: new Date()
              }
            }
          );
          
          return {
            success: true,
            message: 'Lock refreshed successfully',
            lock: {
              userId: userId,
              userEmail: userEmail,
              userName: userName,
              lockType: lockType,
              acquiredAt: new Date(),
              expiresAt: newExpiresAt
            }
          };
        } else {
          // Check if existing lock is expired
          if (new Date() > existingLock.expiresAt) {
            await Lock.deleteOne({ _id: existingLock._id });
          } else {
            // Resource is locked by another user
            return {
              success: false,
              message: 'Resource is locked by another user',
              lockedBy: {
                userName: existingLock.userName,
                userEmail: existingLock.userEmail
              }
            };
          }
        }
      }

      // Create new lock
      const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
      const newLock = new Lock({
        resourceId,
        resourceType,
        userId,
        userEmail,
        userName,
        lockType,
        expiresAt
      });

      await newLock.save();

      return {
        success: true,
        message: 'Lock acquired successfully',
        lock: {
          userId: userId,
          userEmail: userEmail,
          userName: userName,
          lockType: lockType,
          acquiredAt: new Date(),
          expiresAt: expiresAt
        }
      };
    } catch (error) {
      console.error('Error acquiring lock:', error);
      return {
        success: false,
        message: 'Failed to acquire lock'
      };
    }
  }

  /**
   * Release a lock on a resource
   * @param {ObjectId} resourceId - ID of the resource to unlock
   * @param {string} resourceType - Type of the resource ('Course', etc.)
   * @param {string} userId - ID of the user releasing the lock
   * @returns {Promise<Object>} - Result object with success status
   */
  static async releaseLock(resourceId, resourceType, userId) {
    try {
      const result = await Lock.deleteOne({
        resourceId,
        resourceType,
        userId
      });

      if (result.deletedCount > 0) {
        return {
          success: true,
          message: 'Lock released successfully'
        };
      } else {
        return {
          success: false,
          message: 'No lock found or lock belongs to another user'
        };
      }
    } catch (error) {
      console.error('Error releasing lock:', error);
      return {
        success: false,
        message: 'Failed to release lock'
      };
    }
  }

  /**
   * Force release a lock (admin only)
   * @param {ObjectId} resourceId - ID of the resource to unlock
   * @param {string} resourceType - Type of the resource ('Course', etc.)
   * @returns {Promise<Object>} - Result object with success status
   */
  static async forceReleaseLock(resourceId, resourceType) {
    try {
      const result = await Lock.deleteOne({
        resourceId,
        resourceType
      });

      if (result.deletedCount > 0) {
        return {
          success: true,
          message: 'Lock force released successfully'
        };
      } else {
        return {
          success: false,
          message: 'No lock found for this resource'
        };
      }
    } catch (error) {
      console.error('Error force releasing lock:', error);
      return {
        success: false,
        message: 'Failed to force release lock'
      };
    }
  }

  /**
   * Clean up expired locks
   * @returns {Promise<number>} - Number of expired locks removed
   */
  static async cleanupExpiredLocks() {
    try {
      const result = await Lock.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired locks:', error);
      return 0;
    }
  }
}

module.exports = LockService;