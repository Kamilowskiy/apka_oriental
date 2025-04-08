// Fix for the Client model in api/models/Client.cjs
const { DataTypes } = require("sequelize");
const sequelize = require("../../api/config/database.cjs");

const Client = sequelize.define(
  "Client",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    company_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nip: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    contact_first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contact_last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contact_phone: {
      type: DataTypes.STRING,
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
  },
  {
    tableName: "clients",
    timestamps: false, // Ręcznie zarządzamy polami created_at i updated_at
  }
);

module.exports = Client;