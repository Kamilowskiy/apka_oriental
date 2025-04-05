// C:\Users\Kamil\Desktop\apka_oriental\api\models\associations.cjs
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database.cjs');

// Import models
const Client = require('./Client.cjs');
const Hosting = require('./Hosting.cjs');
const Service = require('./Services.cjs'); 
// const ClientDocument = require('./ClientDocument.cjs'); // If you have this model
const CalendarEvent = require('./CalendarEvents.cjs'); // Make sure this path is correct

// Define associations
Client.hasMany(Hosting, { foreignKey: 'client_id' });
Hosting.belongsTo(Client, { foreignKey: 'client_id' });

// Klient może mieć wiele usług
Client.hasMany(Service, { foreignKey: 'client_id' });
Service.belongsTo(Client, { foreignKey: 'client_id' });

module.exports = {
  Client,
  Hosting,
  Service,
  CalendarEvent,
};