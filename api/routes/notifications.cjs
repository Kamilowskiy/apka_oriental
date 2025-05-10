// api/routes/notifications.cjs
const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/auth.cjs");
const { Notification } = require("../../src/utils/notificationHelpers.cjs");

// Get all notifications for current user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const notifications = await Notification.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: 50 // Limit to last 50 notifications
    });
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Error fetching notifications', details: error.message });
  }
});

// Get unread notifications
router.get('/unread', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const notifications = await Notification.findAll({
      where: { 
        user_id: userId,
        read: false
      },
      order: [['created_at', 'DESC']]
    });
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({ error: 'Error fetching unread notifications', details: error.message });
  }
});

// Get unread count
router.get('/unread/count', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const count = await Notification.count({
      where: { 
        user_id: userId,
        read: false
      }
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    res.status(500).json({ error: 'Error fetching unread notifications count', details: error.message });
  }
});

// Mark a notification as read
router.put('/:id/read', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find the notification and ensure it belongs to the current user
    const notification = await Notification.findOne({
      where: { 
        id,
        user_id: userId
      }
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Update the notification
    await notification.update({
      read: true,
      updated_at: new Date()
    });
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Error marking notification as read', details: error.message });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Update all unread notifications for the user
    await Notification.update(
      {
        read: true,
        updated_at: new Date()
      },
      {
        where: {
          user_id: userId,
          read: false
        }
      }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Error marking all notifications as read', details: error.message });
  }
});

// Create a new notification
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      title,
      message,
      type = 'system',
      entity_id = null,
      entity_type = null,
      user_id = null // If specified, send to a specific user
    } = req.body;
    
    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }
    
    // Create the notification
    const notification = await Notification.create({
      user_id: user_id || req.user.id, // Default to current user if not specified
      title,
      message,
      type,
      read: false,
      entity_id,
      entity_type,
      created_at: new Date()
    });
    
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Error creating notification', details: error.message });
  }
});

// Delete a notification
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find the notification and ensure it belongs to the current user
    const notification = await Notification.findOne({
      where: { 
        id,
        user_id: userId
      }
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Delete the notification
    await notification.destroy();
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Error deleting notification', details: error.message });
  }
});

module.exports = router;