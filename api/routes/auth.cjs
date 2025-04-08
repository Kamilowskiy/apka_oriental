// api/routes/auth.cjs
const express = require("express");
const router = express.Router();
const { User } = require("../models/associations.cjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const sequelize = require("../config/database.cjs");
const { authenticateUser } = require("../middleware/auth.cjs");
const bcrypt = require("bcrypt");

// Rejestracja użytkownika
router.post("/register", async (req, res) => {
  try {
    const { fname, lname, email, password } = req.body;

    // Walidacja danychs
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

    // Hashowanie hasła
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Utworzenie nowego użytkownika
    const newUser = await User.create({
      first_name: fname,  // Map frontend field to database field
      last_name: lname,   // Map frontend field to database field
      email,
      password: hashedPassword,
      role: "user", // Domyślna rola
      email_verified: 0, // Domyślnie email nie jest zweryfikowany
      created_at: new Date()
    });

    // Zwracamy informację o sukcesie bez danych użytkownika i tokena
    res.status(201).json({ 
      message: "Rejestracja przebiegła pomyślnie"
    });
  } catch (error) {
    console.error("Błąd podczas rejestracji:", error);
    res.status(500).json({ error: "Wystąpił błąd podczas rejestracji", details: error.message });
  }
});

// Logowanie użytkownika
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log("Próba logowania:", { email });  // Nie loguj hasła!
    
    // Walidacja danych
    if (!email || !password) {
      return res.status(400).json({ error: "Email i hasło są wymagane" });
    }

    // Szukaj użytkownika po emailu
    const user = await User.findOne({ where: { email } });

    console.log("Znaleziony użytkownik:", user ? "Tak" : "Nie");

    if (!user) {
      return res.status(401).json({ error: "Nieprawidłowy email lub hasło" });
    }

    // Sprawdzenie hasła przy użyciu bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Nieprawidłowy email lub hasło" });
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
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      email_verified: user.email_verified,
      created_at: user.created_at,
      updated_at: user.updated_at
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

// Endpoint do pobrania danych zalogowanego użytkownika
router.get("/me", authenticateUser, async (req, res) => {
  try {
    // Pobierz dane użytkownika z bazy danych
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'reset_token', 'reset_token_expires'] } // Wykluczamy poufne dane
    });

    if (!user) {
      return res.status(404).json({ error: "Użytkownik nie został znaleziony" });
    }

    res.json(user);
  } catch (error) {
    console.error("Błąd podczas pobierania danych użytkownika:", error);
    res.status(500).json({ error: "Wystąpił błąd podczas pobierania danych użytkownika" });
  }
});

// Wylogowanie użytkownika
router.post("/logout", authenticateUser, (req, res) => {
  // W przypadku autentykacji JWT, wylogowanie jest obsługiwane po stronie klienta
  // poprzez usunięcie tokenu z localStorage
  res.json({ message: "Wylogowano pomyślnie" });
});

module.exports = router;