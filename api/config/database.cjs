const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME, // Nazwa bazy
  process.env.DB_USER, // Użytkownik
  process.env.DB_PASS, // Hasło
  {
    host: process.env.DB_HOST, 
    dialect: "mysql",
    logging: false, // Wyłącza logi SQL
  }
);

module.exports =  sequelize;
