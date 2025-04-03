// You can add this in a separate file like api/models/associations.cjs
const Client = require('./Client.cjs');
const Hosting = require('./Hosting.cjs');

// Set up associations
Hosting.belongsTo(Client, { foreignKey: 'client_id' });
Client.hasMany(Hosting, { foreignKey: 'client_id' });

module.exports = { Client, Hosting };