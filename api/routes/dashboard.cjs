// api/routes/dashboard.cjs
const express = require('express');
const router = express.Router();
const sequelize = require('../config/database.cjs');
const { DataTypes, Op } = require('sequelize');
const { authenticateUser } = require('../middleware/auth.cjs');
const { Service } = require('../models/associations.cjs');

// Define a model for dashboard settings (if you don't already have one)
const DashboardSetting = sequelize.define('DashboardSetting', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  setting_key: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  setting_value: {
    type: DataTypes.TEXT,
    allowNull: false
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
  tableName: 'dashboard_settings',
  timestamps: false
});

// Create the table if it doesn't exist
DashboardSetting.sync({ alter: true })
  .then(() => console.log('Dashboard settings table synchronized'))
  .catch(err => console.error('Error syncing dashboard settings table:', err));

// Get yearly target value
router.get('/yearly-target', authenticateUser, async (req, res) => {
  try {
    // Find yearly target setting
    let targetSetting = await DashboardSetting.findOne({
      where: { setting_key: 'yearly_target' }
    });
    
    // If not found, create a default setting
    if (!targetSetting) {
      targetSetting = await DashboardSetting.create({
        setting_key: 'yearly_target',
        setting_value: '200000', // Default value
        created_at: new Date()
      });
    }
    
    res.json({ target: parseFloat(targetSetting.setting_value) });
  } catch (error) {
    console.error('Error fetching yearly target:', error);
    res.status(500).json({ 
      error: 'Error fetching yearly target', 
      details: error.message 
    });
  }
});

// Update yearly target value
router.post('/yearly-target', authenticateUser, async (req, res) => {
  try {
    const { target } = req.body;
    
    if (!target || isNaN(parseFloat(target)) || parseFloat(target) <= 0) {
      return res.status(400).json({ error: 'Invalid target value' });
    }
    
    // Find or create the target setting
    let targetSetting = await DashboardSetting.findOne({
      where: { setting_key: 'yearly_target' }
    });
    
    if (targetSetting) {
      // Update existing setting
      await targetSetting.update({
        setting_value: target.toString(),
        updated_at: new Date()
      });
    } else {
      // Create new setting
      targetSetting = await DashboardSetting.create({
        setting_key: 'yearly_target',
        setting_value: target.toString(),
        created_at: new Date()
      });
    }
    
    res.json({ 
      message: 'Yearly target updated successfully',
      target: parseFloat(targetSetting.setting_value)
    });
  } catch (error) {
    console.error('Error updating yearly target:', error);
    res.status(500).json({ 
      error: 'Error updating yearly target', 
      details: error.message 
    });
  }
});

// Get yearly revenue from completed projects
router.get('/yearly-revenue', authenticateUser, async (req, res) => {
  try {
    // Get current year
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Generate date range for current year
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;
    
    // Query for completed projects in current year
    const completedProjects = await Service.findAll({
      where: {
        status: 'completed',
        end_date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });
    
    // Calculate total revenue for the year
    const totalRevenue = completedProjects.reduce((sum, project) => {
      return sum + parseFloat(project.price || 0);
    }, 0);
    
    // Calculate today's revenue
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const todayProjects = completedProjects.filter(project => {
      const projectDate = new Date(project.end_date);
      const projectDateString = projectDate.toISOString().split('T')[0];
      return projectDateString === today;
    });
    
    const todayRevenue = todayProjects.reduce((sum, project) => {
      return sum + parseFloat(project.price || 0);
    }, 0);
    
    res.json({
      yearlyRevenue: totalRevenue,
      todayRevenue: todayRevenue,
      completedProjects: completedProjects.length
    });
  } catch (error) {
    console.error('Error calculating yearly revenue:', error);
    res.status(500).json({ 
      error: 'Error calculating yearly revenue', 
      details: error.message 
    });
  }
});

// Get dashboard stats (combining yearly target and revenue)
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    // Get yearly target
    let targetSetting = await DashboardSetting.findOne({
      where: { setting_key: 'yearly_target' }
    });
    
    const target = targetSetting ? parseFloat(targetSetting.setting_value) : 200000;
    
    // Get current year
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Generate date range for current year
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;
    
    // Query for all projects in current year
    const allProjects = await Service.findAll({
      where: {
        [Op.or]: [
          {
            start_date: {
              [Op.between]: [startDate, endDate]
            }
          },
          {
            end_date: {
              [Op.between]: [startDate, endDate]
            }
          }
        ]
      }
    });
    
    // Filter completed projects
    const completedProjects = allProjects.filter(project => project.status === 'completed');
    
    // Calculate total revenue from completed projects for the year
    const yearlyRevenue = completedProjects.reduce((sum, project) => {
      return sum + parseFloat(project.price || 0);
    }, 0);
    
    // Calculate today's revenue
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const todayProjects = completedProjects.filter(project => {
      const projectDate = new Date(project.end_date);
      const projectDateString = projectDate.toISOString().split('T')[0];
      return projectDateString === today;
    });
    
    const todayRevenue = todayProjects.reduce((sum, project) => {
      return sum + parseFloat(project.price || 0);
    }, 0);
    
    // Calculate progress percentage
    const progress = target > 0 ? (yearlyRevenue / target) * 100 : 0;
    
    res.json({
      target,
      monthlyRevenue: yearlyRevenue, // Return yearly revenue as monthlyRevenue for compatibility
      todayRevenue,
      progress: parseFloat(progress.toFixed(2)),
      completedProjects: completedProjects.length,
      allProjects: allProjects.length
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      error: 'Error fetching dashboard statistics', 
      details: error.message 
    });
  }
});

module.exports = router;