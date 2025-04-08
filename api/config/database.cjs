// config/database.cjs
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Tworzenie instancji Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME || 'business_manager',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: false, // Domyślnie wyłączamy timestamps, zarządzamy nimi ręcznie
      underscored: true, // Używamy snake_case zamiast camelCase dla nazw kolumn
    },
    pool: {
      max: 5, // Maksymalna liczba połączeń w puli
      min: 0, // Minimalna liczba połączeń w puli
      acquire: 30000, // Maksymalny czas w ms do nawiązania połączenia przed wygenerowaniem błędu
      idle: 10000, // Maksymalny czas w ms, przez który połączenie może być bezczynne przed jego zamknięciem
    },
  }
);

// Testowanie połączenia
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Połączenie z bazą danych nawiązane pomyślnie.');
  } catch (error) {
    console.error('Nie można połączyć się z bazą danych:', error);
  }
};

testConnection();

module.exports = sequelize;