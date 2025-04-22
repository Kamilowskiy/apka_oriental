// api/models/Client.cjs
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database.cjs");

const Client = sequelize.define(
  "Client",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    company_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nip: {
      type: DataTypes.STRING(10),
      unique: true,
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    contact_first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    contact_last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    contact_phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: "clients",
    timestamps: false // Ręcznie zarządzamy polami created_at
  }
);

module.exports = Client;