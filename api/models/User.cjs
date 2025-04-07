// api/models/User.cjs
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database.cjs");
const bcrypt = require("bcrypt");

// Model dopasowany do istniejącej struktury bazy danych 'users' bez kolumny username
const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: 0,
    },
    role: {
      type: DataTypes.ENUM("user", "admin"),
      defaultValue: "user",
    },
    reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    reset_token_expires: {
      type: DataTypes.DATE,
      allowNull: true,
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

// Dodajemy wirtualne pole dla username, które zostanie użyte w auth.cjs
Object.defineProperty(User.prototype, 'username', {
  get() {
    const firstName = this.first_name || '';
    const lastName = this.last_name || '';
    const baseUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    
    // Usunięcie polskich znaków i innych znaków specjalnych
    return baseUsername
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")  // Usunięcie znaków diakrytycznych
      .replace(/[^a-z0-9.]/g, "");      // Pozostawienie tylko liter, cyfr i kropek
  }
});

// Metoda statyczna do generowania unikalnej nazwy użytkownika
User.generateUniqueUsername = async function(firstName, lastName) {
  try {
    // Tworzenie podstawowej nazwy użytkownika
    let baseUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    
    // Usunięcie polskich znaków i innych znaków specjalnych
    baseUsername = baseUsername
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")  // Usunięcie znaków diakrytycznych
      .replace(/[^a-z0-9.]/g, "");      // Pozostawienie tylko liter, cyfr i kropek
    
    // Ta wersja nie sprawdza unikalności w bazie, ponieważ nie przechowujemy username
    // Jeśli chcesz sprawdzić unikalność, musisz to zrobić wyszukując po first_name i last_name
    
    return baseUsername;
  } catch (error) {
    console.error("Error generating username:", error);
    return `user${Date.now()}`;
  }
};

module.exports = User;