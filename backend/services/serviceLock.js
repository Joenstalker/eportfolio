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
    enum: ['course'], // Add other resource types as needed
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  acquiredAt: {
    type: Date,
    default: Date.now,
    expires: 300 // 5 minutes auto-expiration
  },
  sessionId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
lockSchema.index({ resourceId: 1, resourceType: 1 });

// Create the Lock model
const Lock = mongoose.model('Lock', lockSchema);

class ServiceLock {
  /**
   * Attempt to acquire a lock on a resource
   * @param {ObjectId} resourceId - ID of the resource to lock
   * @param {string} resourceType - Type of the resource ('course', etc.)
   * @param {ObjectId} userId - ID of the user requesting the lock
   * @param {string} sessionId - Session identifier
   * @returns {Promise<boolean>} - True if lock acquired, false otherwise
   */
  static async acquire(resourceId, resourceType, userId, sessionId) {
    try {
      // Check if the resource is already locked by someone else
      const existingLock = await Lock.findOne({
        resourceId,
        resourceType,
      }).lean();

      if (existingLock) {
        // Check if it's locked by the same user/session
        if (existingLock.userId.toString() === userId.toString() && existingLock.sessionId === sessionId) {
          // Same user, same session - refresh the lock
          await Lock.updateOne(
            { _id: existingLock._id },
            { $set: { acquiredAt: new Date() } }
          );
          return true;
        } else {
          // Locked by another user - check if it's expired
          const lockAge = new Date() - existingLock.acquiredAt;
          const maxLockAge = 5 * 60 * 1000; // 5 minutes in milliseconds

          if (lockAge > maxLockAge) {
            // Lock is expired, acquire it
            await Lock.deleteOne({ _id: existingLock._id });
          } else {
            // Still valid lock by another user
            return false;
          }
        }
      }

      // Create a new lock
      const newLock = new Lock({
        resourceId,
        resourceType,
        userId,
        sessionId
      });

      await newLock.save();
      return true;
    } catch (error) {
      console.error('Error acquiring lock:', error);
      return false;
    }
  }

  /**
   * Release a lock on a resource
   * @param {ObjectId} resourceId - ID of the resource to unlock
   * @param {string} resourceType - Type of the resource ('course', etc.)
   * @param {ObjectId} userId - ID of the user releasing the lock
   * @param {string} sessionId - Session identifier
   * @returns {Promise<boolean>} - True if lock released, false otherwise
   */
  static async release(resourceId, resourceType, userId, sessionId) {
    try {
      const result = await Lock.deleteOne({
        resourceId,
        resourceType,
        userId,
        sessionId
      });

      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error releasing lock:', error);
      return false;
    }
  }

  /**
   * Check if a resource is currently locked
   * @param {ObjectId} resourceId - ID of the resource to check
   * @param {string} resourceType - Type of the resource ('course', etc.)
   * @returns {Promise<Object|null>} - Lock object if locked, null otherwise
   */
  static async isLocked(resourceId, resourceType) {
    try {
      const lock = await Lock.findOne({
        resourceId,
        resourceType,
      }).populate('userId', 'firstName lastName email');

      if (lock) {
        // Check if the lock is expired
        const lockAge = new Date() - lock.acquiredAt;
        const maxLockAge = 5 * 60 * 1000; // 5 minutes in milliseconds

        if (lockAge > maxLockAge) {
          // Lock is expired, remove it
          await Lock.deleteOne({ _id: lock._id });
          return null;
        }
        return lock;
      }
      return null;
    } catch (error) {
      console.error('Error checking lock status:', error);
      return null;
    }
  }

  /**
   * Get all active locks for a specific user
   * @param {ObjectId} userId - ID of the user
   * @returns {Promise<Array>} - Array of active locks
   */
  static async getUserActiveLocks(userId) {
    try {
      // Clean up expired locks first
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      await Lock.deleteMany({
        acquiredAt: { $lt: fiveMinutesAgo }
      });

      return await Lock.find({
        userId: userId
      }).populate('resourceId', '_id name code description');
    } catch (error) {
      console.error('Error getting user active locks:', error);
      return [];
    }
  }

  /**
   * Force release all locks for a user (e.g., on logout)
   * @param {ObjectId} userId - ID of the user
   * @returns {Promise<number>} - Number of locks released
   */
  static async releaseAllUserLocks(userId) {
    try {
      const result = await Lock.deleteMany({
        userId: userId
      });

      return result.deletedCount;
    } catch (error) {
      console.error('Error releasing all user locks:', error);
      return 0;
    }
  }
}

module.exports = ServiceLock;