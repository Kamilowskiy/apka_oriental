// models/associations.cjs
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database.cjs');

// Import models
const Client = require('./Client.cjs');
const Hosting = require('./Hosting.cjs');
const Service = require('./Services.cjs');
const { CalendarEvent } = require('./CalendarEvents.cjs');
const User = require('./User.cjs')(sequelize);
const UserSettings = require('./UserSettings.cjs');

// Define associations
Client.hasMany(Hosting, { foreignKey: 'client_id' });
Hosting.belongsTo(Client, { foreignKey: 'client_id' });

// Client can have many services
Client.hasMany(Service, { foreignKey: 'client_id' });
Service.belongsTo(Client, { foreignKey: 'client_id' });

// Usuń asocjację między User i Client, ponieważ nie mamy kolumny user_id
// User.hasMany(Client, { foreignKey: 'user_id', as: 'clients' });
// Client.belongsTo(User, { foreignKey: 'user_id' });

// User settings
User.hasOne(UserSettings, { foreignKey: 'user_id' });
UserSettings.belongsTo(User, { foreignKey: 'user_id' });

// Calendar events belong to a user
User.hasMany(CalendarEvent, { foreignKey: 'user_id' });
CalendarEvent.belongsTo(User, { foreignKey: 'user_id' });

// Export models
module.exports = {
  Client,
  Hosting,
  Service,
  CalendarEvent,
  User,
  UserSettings
};