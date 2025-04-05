// api/models/User.cjs
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database.cjs");
const bcrypt = require("bcrypt");

// Model dopasowany do istniejącej struktury bazy danych 'users'
const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("admin", "user"),
      defaultValue: "user",
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'users',
    timestamps: false, // Wyłączamy automatyczne timestampy Sequelize
    hooks: {
      beforeCreate: async (user) => {
        // Haszowanie hasła przed zapisaniem do bazy
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
        user.created_at = new Date();
      },
      beforeUpdate: async (user) => {
        // Haszowanie hasła przed aktualizacją
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
        user.updated_at = new Date();
      },
    },
  }
);

// Metoda instancji do porównywania hasła
User.prototype.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = User;