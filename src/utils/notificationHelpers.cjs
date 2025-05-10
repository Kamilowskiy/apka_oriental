// api/utils/notificationHelpers.cjs
const sequelize = require("../../api/config/database.cjs");
const { DataTypes } = require("sequelize");

// Define the Notification model
const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    // references: {
    //   model: 'users',
    //   key: 'id'
    // }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('project', 'task', 'client', 'system'),
    allowNull: false,
    defaultValue: 'system'
  },
  read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  entity_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  entity_type: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: false
});

// Tworzenie tabeli, jeśli nie istnieje
Notification.sync({ alter: true })
  .then(() => console.log('Notification table synchronized'))
  .catch(err => console.error('Error syncing notification table:', err));

/**
 * Create a new notification for a specific user
 * @param {number} userId - User ID to notify
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type ('project', 'task', 'client', 'system')
 * @param {number|null} entityId - Optional ID of related entity (project, task, etc.)
 * @param {string|null} entityType - Optional type of related entity
 * @returns {Promise<Object>} Created notification
 */
async function createNotification(userId, title, message, type = 'system', entityId = null, entityType = null) {
  try {
    const notification = await Notification.create({
      user_id: userId,
      title,
      message,
      type,
      read: false,
      entity_id: entityId,
      entity_type: entityType,
      created_at: new Date()
    });
    
    console.log(`Notification created for user ${userId}:`, notification.id);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Create a notification for all users
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type ('project', 'task', 'client', 'system')
 * @param {number|null} entityId - Optional ID of related entity
 * @param {string|null} entityType - Optional type of related entity
 * @returns {Promise<Object[]>} Created notifications
 */
async function notifyAllUsers(title, message, type = 'system', entityId = null, entityType = null) {
  try {
    // Próba importu modelu User
    let User;
    try {
      const { User: UserModel } = require('../../api/models/associations.cjs');
      User = UserModel;
    } catch (error) {
      console.warn('Could not import User model from associations, trying direct import');
      try {
        User = require('../models/User.cjs')(sequelize);
      } catch (innerError) {
        console.error('Failed to import User model:', innerError);
        throw new Error('Cannot import User model');
      }
    }
    
    // Get all user IDs
    const users = await User.findAll({
      attributes: ['id']
    });
    
    const notifications = [];
    
    // Create a notification for each user
    for (const user of users) {
      const notification = await createNotification(
        user.id,
        title,
        message,
        type,
        entityId,
        entityType
      );
      
      notifications.push(notification);
    }
    
    return notifications;
  } catch (error) {
    console.error('Error notifying all users:', error);
    throw error;
  }
}

/**
 * Get display text for status
 * @param {string} status - Status value
 * @returns {string} Display text
 */
function getStatusDisplay(status) {
  switch (status) {
    case 'todo':
      return 'Do zrobienia';
    case 'in-progress':
      return 'W trakcie';
    case 'completed':
      return 'Ukończony';
    default:
      return status;
  }
}

module.exports = {
  createNotification,
  notifyAllUsers,
  getStatusDisplay,
  Notification
};