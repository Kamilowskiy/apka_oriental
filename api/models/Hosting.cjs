// // Add this to your models folder - hosting.cjs

// const { DataTypes } = require('sequelize');
// const sequelize = require('../config/database.cjs');
// const Client = require('./routes/client.cjs');

// const Hosting = sequelize.define('Hosting', {
//   id: {
//     type: DataTypes.INTEGER.UNSIGNED,
//     primaryKey: true,
//     autoIncrement: true
//   },
//   client_id: {
//     type: DataTypes.INTEGER.UNSIGNED,
//     allowNull: false,
//     references: {
//       model: 'clients',
//       key: 'id'
//     }
//   },
//   domain_name: {
//     type: DataTypes.STRING(255),
//     allowNull: false,
//     unique: true
//   },
//   annual_price: {
//     type: DataTypes.DECIMAL(10, 2),
//     allowNull: false
//   },
//   start_date: {
//     type: DataTypes.DATEONLY,
//     allowNull: false
//   },
//   end_date: {
//     type: DataTypes.DATEONLY,
//     allowNull: true
//   }
// }, {
//   tableName: 'hosting',
//   timestamps: true,
//   createdAt: 'created_at',
//   updatedAt: false
// });

// // Associate with Client
// Hosting.belongsTo(Client, { foreignKey: 'client_id' });

// module.exports = Hosting;