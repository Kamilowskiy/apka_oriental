// api/routes/auth.cjs
const express = require("express");
const router = express.Router();
const { User } = require("../models/associations.cjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize"); // Properly import the Op object
const sequelize = require("../config/database.cjs");
const { authenticateUser } = require("../middleware/auth.cjs");

// Rejestracja użytkownika
router.post("/register", async (req, res) => {
  try {
    const { fname, lname, email, password } = req.body;

    // Walidacja danych
    if (!fname || !lname || !email || !password) {
      return res.status(400).json({ error: "Wszystkie pola są wymagane" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Hasło musi mieć co najmniej 8 znaków" });
    }

    // Sprawdzenie, czy użytkownik o podanym adresie email już istnieje
    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail) {
      return res.status(400).json({ error: "Użytkownik o podanym adresie email już istnieje" });
    }

    // Generowanie nazwy użytkownika (username) z imienia i nazwiska
    let username = `${fname.toLowerCase()}.${lname.toLowerCase()}`;
    
    // Usunięcie polskich znaków i innych znaków specjalnych z nazwy użytkownika
    username = username
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")  // Usunięcie znaków diakrytycznych
      .replace(/[^a-z0-9.]/g, "");      // Pozostawienie tylko liter, cyfr i kropek
    
    // Sprawdzenie, czy username jest już zajęty
    const existingUserByUsername = await User.findOne({ where: { username } });
    if (existingUserByUsername) {
      // Dodanie losowego numeru do username
      username = `${username}${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Utworzenie nowego użytkownika
    const newUser = await User.create({
      username,
      email,
      password,
      role: "user", // Domyślna rola
      created_at: new Date()
    });

    // Zwracamy informację o sukcesie bez danych użytkownika i tokena
    res.status(201).json({ 
      message: "Rejestracja przebiegła pomyślnie",
      username: username // Zwracamy wygenerowaną nazwę użytkownika, żeby użytkownik wiedział jak się logować
    });
  } catch (error) {
    console.error("Błąd podczas rejestracji:", error);
    res.status(500).json({ error: "Wystąpił błąd podczas rejestracji" });
  }
});

// Logowanie użytkownika
router.post("/login", async (req, res) => {
  try {
    const { login, password } = req.body;
    
    console.log("Próba logowania:", { login });  // Nie loguj hasła!
    
    // Walidacja danych
    if (!login || !password) {
      return res.status(400).json({ error: "Login/email i hasło są wymagane" });
    }

    // Sprawdzenie, czy użytkownik istnieje (po emailu lub nazwie użytkownika)
    // Użycie operatora OR z poprawnym importem
    const user = await User.findOne({ 
      where: {
        [Op.or]: [    // Używamy bezpośrednio zaimportowanego Op
          { email: login },
          { username: login }
        ]
      } 
    });

    console.log("Znaleziony użytkownik:", user ? "Tak" : "Nie");

    if (!user) {
      return res.status(401).json({ error: "Nieprawidłowy login lub hasło" });
    }

    // Sprawdzenie hasła
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Nieprawidłowy login lub hasło" });
    }

    // Generowanie tokenu JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // Token ważny przez 7 dni
    );

    // Przygotowanie danych użytkownika (bez hasła)
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    // Zwracamy token JWT i dane użytkownika
    res.json({
      token,
      user: userData,
      message: "Logowanie pomyślne"
    });
  } catch (error) {
    console.error("Szczegółowy błąd logowania:", error);
    res.status(500).json({ error: "Wystąpił błąd podczas logowania", details: error.message });
  }
});

module.exports = router;