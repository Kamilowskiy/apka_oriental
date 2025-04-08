// api/models/CalendarEvents.cjs
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.cjs');

const CalendarEvent = sequelize.define('CalendarEvent', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  calendar_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  start_time: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  end_time: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
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
  tableName: 'calendar_events',
  timestamps: false // Ręcznie zarządzamy polami created_at i updated_at
});

module.exports = { CalendarEvent };