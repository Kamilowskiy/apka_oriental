// models/UserSettings.cjs
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.cjs');

const UserSettings = sequelize.define('user_settings', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  profile_visibility: {
    type: DataTypes.ENUM('public', 'friends', 'private'),
    allowNull: false,
    defaultValue: 'public'
  },
  email_notifications: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  app_notifications: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: false
});

module.exports = UserSettings;