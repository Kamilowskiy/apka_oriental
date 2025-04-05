// api/models/associations.cjs
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database.cjs');

// Import models
const Client = require('./Client.cjs');
const Hosting = require('./Hosting.cjs');
const Service = require('./Services.cjs'); 
const CalendarEvent = require('./CalendarEvents.cjs');
const User = require('./User.cjs');

// Define associations
Client.hasMany(Hosting, { foreignKey: 'client_id' });
Hosting.belongsTo(Client, { foreignKey: 'client_id' });

// Client can have many services
Client.hasMany(Service, { foreignKey: 'client_id' });
Service.belongsTo(Client, { foreignKey: 'client_id' });

// User can have many clients (optional relationship)
User.hasMany(Client, { foreignKey: 'user_id', as: 'clients' });
Client.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  Client,
  Hosting,
  Service,
  CalendarEvent,
  User
};