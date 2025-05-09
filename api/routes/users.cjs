// api/routes/users.cjs
const express = require("express");
const router = express.Router();
const { User, UserSettings } = require("../models/associations.cjs");
const { authenticateUser } = require("../middleware/auth.cjs");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const sequelize = require("../config/database.cjs");

// Aktualizacja profilu użytkownika
router.put("/profile", authenticateUser, async (req, res) => {
  try {
    const { first_name, last_name, email } = req.body;
    const userId = req.user.id;

    // Walidacja danych
    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: "Wszystkie pola są wymagane" });
    }

    // Sprawdzenie, czy email jest już zajęty (pomijając bieżącego użytkownika)
    if (email !== req.user.email) {
      const existingUserWithEmail = await User.findOne({
        where: {
          email,
          id: { [Op.ne]: userId }
        }
      });

      if (existingUserWithEmail) {
        return res.status(400).json({ error: "Ten adres email jest już zajęty" });
      }
    }

    // Aktualizacja danych użytkownika
    await User.update({
      first_name,
      last_name,
      email,
      updated_at: new Date()
    }, {
      where: { id: userId }
    });

    res.json({ 
      message: "Profil został zaktualizowany pomyślnie",
      user: {
        first_name,
        last_name,
        email
      }
    });
  } catch (error) {
    console.error("Błąd podczas aktualizacji profilu:", error);
    res.status(500).json({ error: "Wystąpił błąd podczas aktualizacji profilu", details: error.message });
  }
});

// Zmiana hasła użytkownika
router.put("/change-password", authenticateUser, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;

    // Walidacja danych
    if (!current_password || !new_password) {
      return res.status(400).json({ error: "Wszystkie pola są wymagane" });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: "Nowe hasło musi mieć co najmniej 8 znaków" });
    }

    // Pobierz użytkownika z bazy danych
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Użytkownik nie został znaleziony" });
    }
    
    // Sprawdź czy aktualne hasło jest poprawne
    const isPasswordValid = await bcrypt.compare(current_password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Aktualne hasło jest nieprawidłowe" });
    }
    
    // Hashowanie nowego hasła
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);
    
    // Aktualizacja hasła
    await User.update({
      password: hashedPassword,
      updated_at: new Date()
    }, {
      where: { id: userId }
    });
    
    res.json({ message: "Hasło zostało zmienione pomyślnie" });
  } catch (error) {
    console.error("Błąd podczas zmiany hasła:", error);
    res.status(500).json({ error: "Wystąpił błąd podczas zmiany hasła", details: error.message });
  }
});

// Aktualizacja ustawień powiadomień
router.put("/notification-settings", authenticateUser, async (req, res) => {
  try {
    const { email_notifications, app_notifications } = req.body;
    const userId = req.user.id;
    
    // Sprawdź, czy użytkownik ma już ustawienia
    let userSettings = await UserSettings.findOne({
      where: { user_id: userId }
    });
    
    if (userSettings) {
      // Aktualizuj istniejące ustawienia
      await UserSettings.update({
        email_notifications: !!email_notifications,
        app_notifications: !!app_notifications,
        updated_at: new Date()
      }, {
        where: { user_id: userId }
      });
    } else {
      // Utwórz nowe ustawienia
      await UserSettings.create({
        user_id: userId,
        email_notifications: !!email_notifications,
        app_notifications: !!app_notifications,
        profile_visibility: "public", // Domyślna wartość
        created_at: new Date()
      });
    }
    
    res.json({ 
      message: "Ustawienia powiadomień zostały zaktualizowane",
      settings: {
        email_notifications: !!email_notifications,
        app_notifications: !!app_notifications
      }
    });
  } catch (error) {
    console.error("Błąd podczas aktualizacji ustawień powiadomień:", error);
    res.status(500).json({ error: "Wystąpił błąd podczas aktualizacji ustawień powiadomień", details: error.message });
  }
});

// Aktualizacja ustawień prywatności
router.put("/privacy-settings", authenticateUser, async (req, res) => {
  try {
    const { profile_visibility } = req.body;
    const userId = req.user.id;
    
    // Walidacja danych
    if (!profile_visibility || !["public", "friends", "private"].includes(profile_visibility)) {
      return res.status(400).json({ error: "Nieprawidłowa wartość widoczności profilu" });
    }
    
    // Sprawdź, czy użytkownik ma już ustawienia
    let userSettings = await UserSettings.findOne({
      where: { user_id: userId }
    });
    
    if (userSettings) {
      // Aktualizuj istniejące ustawienia
      await UserSettings.update({
        profile_visibility,
        updated_at: new Date()
      }, {
        where: { user_id: userId }
      });
    } else {
      // Utwórz nowe ustawienia
      await UserSettings.create({
        user_id: userId,
        profile_visibility,
        email_notifications: true, // Domyślne wartości
        app_notifications: true,
        created_at: new Date()
      });
    }
    
    res.json({ 
      message: "Ustawienia prywatności zostały zaktualizowane",
      settings: {
        profile_visibility
      }
    });
  } catch (error) {
    console.error("Błąd podczas aktualizacji ustawień prywatności:", error);
    res.status(500).json({ error: "Wystąpił błąd podczas aktualizacji ustawień prywatności", details: error.message });
  }
});

// Pobierz ustawienia użytkownika
router.get("/settings", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Pobierz ustawienia użytkownika
    const userSettings = await UserSettings.findOne({
      where: { user_id: userId }
    });
    
    if (!userSettings) {
      // Jeśli nie ma ustawień, zwróć domyślne wartości
      return res.json({
        profile_visibility: "public",
        email_notifications: true,
        app_notifications: true
      });
    }
    
    res.json({
      profile_visibility: userSettings.profile_visibility,
      email_notifications: userSettings.email_notifications,
      app_notifications: userSettings.app_notifications
    });
  } catch (error) {
    console.error("Błąd podczas pobierania ustawień użytkownika:", error);
    res.status(500).json({ error: "Wystąpił błąd podczas pobierania ustawień użytkownika", details: error.message });
  }
});

router.get("/all", authenticateUser, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'first_name', 'last_name', 'email', 'role'],
      order: [['first_name', 'ASC'], ['last_name', 'ASC']]
    });

    res.json(users);
  } catch (error) {
    console.error("Błąd podczas pobierania listy użytkowników:", error);
    res.status(500).json({ error: "Wystąpił błąd podczas pobierania listy użytkowników" });
  }
});

module.exports = router;