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
  event_status: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  calendar_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'primary'
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