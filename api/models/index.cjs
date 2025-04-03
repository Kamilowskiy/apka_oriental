// // models/index.cjs

// const Client = require('./routes/client.cjs');
// const Hosting = require('./routes/hosting.cjs');
// const User = require('./user.cjs');
// const ClientDocument = require('./clientDocument.cjs');
// const Service = require('./service.cjs');

// // Define associations
// Client.hasMany(Hosting, { foreignKey: 'client_id' });
// Client.hasMany(ClientDocument, { foreignKey: 'client_id' });
// Client.hasMany(Service, { foreignKey: 'client_id' });

// Hosting.belongsTo(Client, { foreignKey: 'client_id' });
// ClientDocument.belongsTo(Client, { foreignKey: 'client_id' });
// Service.belongsTo(Client, { foreignKey: 'client_id' });

// module.exports = {
//   Client,
//   Hosting,
//   User,
//   ClientDocument,
//   Service
// };