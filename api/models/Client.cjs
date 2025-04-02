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
  },
  {
    tableName: "clients",
    timestamps: false, // ✅ WYŁĄCZ TIMESTAMPS, BO NIE MA TYCH KOLUMN W BAZIE
  }
);

module.exports = Client;
