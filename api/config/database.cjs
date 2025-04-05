// api/config/database.cjs
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql', // lub inny dialekt, jeśli używasz innej bazy
    port: process.env.DB_PORT || 3306,
    logging: console.log, // Włączamy logi SQL dla debugowania
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      underscored: true, // używanie snake_case w bazie danych
    }
  }
);

// Funkcja testująca połączenie z bazą danych
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Połączenie z bazą danych nawiązane pomyślnie.');
  } catch (error) {
    console.error('Nie można połączyć się z bazą danych:', error);
    // Dodajemy więcej szczegółów o błędzie
    console.error('Szczegóły błędu połączenia:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_NAME,
      user: process.env.DB_USER
    });
  }
};

// Wywołanie funkcji testującej
testConnection();

// Eksportujemy zarówno sequelize jak i Sequelize (dla dostępu do operatorów)
module.exports = sequelize;