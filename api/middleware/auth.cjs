// api/middleware/auth.cjs
const jwt = require("jsonwebtoken");
const { User } = require("../models/associations.cjs");

// Middleware do weryfikacji tokena JWT
const authenticateUser = (req, res, next) => {
  try {
    // Pobranie tokena z nagłówka Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Brak autoryzacji" });
    }
    
    const token = authHeader.split(" ")[1];
    
    // Weryfikacja tokena
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: "Nieprawidłowy token" });
      }
      
      // Pobranie użytkownika na podstawie ID z tokena
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return res.status(404).json({ error: "Użytkownik nie znaleziony" });
      }
      
      // Dodanie danych użytkownika do obiektu req
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username
      };
      
      next();
    });
  } catch (error) {
    console.error("Błąd autoryzacji:", error);
    res.status(500).json({ error: "Wystąpił błąd podczas autoryzacji" });
  }
};

// Middleware do sprawdzania roli admina
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ error: "Brak uprawnień" });
  }
};

module.exports = { authenticateUser, isAdmin };