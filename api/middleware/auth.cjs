// middleware/auth.cjs
const jwt = require('jsonwebtoken');
const { User } = require('../models/associations.cjs');

// Middleware uwierzytelniania użytkownika
const authenticateUser = async (req, res, next) => {
  try {
    // Pobierz token z nagłówka Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Brak tokenu uwierzytelniającego' });
    }

    const token = authHeader.split(' ')[1];

    // Weryfikuj token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Sprawdź, czy użytkownik istnieje
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Nieprawidłowy token - użytkownik nie istnieje' });
    }

    // Dodaj informacje o użytkowniku do obiektu żądania
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Błąd uwierzytelniania:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token wygasł', expired: true });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Nieprawidłowy token' });
    }
    
    res.status(500).json({ error: 'Wystąpił błąd podczas uwierzytelniania' });
  }
};

// Middleware sprawdzający uprawnienia administratora
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Brak uprawnień' });
  }
};

module.exports = {
  authenticateUser,
  requireAdmin
};