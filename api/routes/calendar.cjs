// routes/calendar.cjs - minimalna wersja
const express = require('express');
const router = express.Router();
const sequelize = require('../config/database.cjs');
const { DataTypes } = require('sequelize');
// Definicja modelu bezpośrednio w pliku route'a
// To zapewni, że model dokładnie odpowiada strukturze tabeli
const CalendarEvent = sequelize.define('CalendarEvent', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  event_status: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  calendar_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'primary'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'calendar_events',
  timestamps: false
});

// Endpoint testowy
router.get('/test', (req, res) => {
  res.json({ message: 'API kalendarza działa poprawnie' });
});

// Pobierz wszystkie wydarzenia - najprościej jak się da
router.get('/', async (req, res) => {
  try {
    // Najprostsze zapytanie bez filtrów
    const events = await CalendarEvent.findAll();
    res.json(events);
  } catch (error) {
    console.error('Błąd pobierania wydarzeń:', error);
    res.status(500).json({ error: 'Błąd serwera', details: error.message });
  }
});

// Dodaj nowe wydarzenie - najprostsza implementacja
router.post('/', async (req, res) => {
  try {
    const { title, start_date, end_date, event_status } = req.body;
    
    if (!title || !start_date) {
      return res.status(400).json({ error: 'Brakujące dane wydarzenia' });
    }
    
    // Dodaj nowe wydarzenie z minimalną liczbą pól
    const newEvent = await CalendarEvent.create({
      title,
      start_date,
      end_date: end_date || start_date,
      event_status: event_status || 'primary',
      calendar_type: 'primary'
    });
    
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Błąd dodawania wydarzenia:', error);
    res.status(500).json({ error: 'Błąd serwera', details: error.message });
  }
});

// Aktualizacja wydarzenia - najprostsza implementacja
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, start_date, end_date, event_status } = req.body;
    
    console.log('Aktualizacja wydarzenia o ID:', id);
    console.log('Dane do aktualizacji:', { title, start_date, end_date, event_status });
    
    if (!title || !start_date) {
      return res.status(400).json({ error: 'Brakujące dane wydarzenia' });
    }
    
    // Znajdź wydarzenie po ID
    const event = await CalendarEvent.findByPk(id);
    
    if (!event) {
      console.log('Wydarzenie nie znalezione dla ID:', id);
      return res.status(404).json({ error: 'Wydarzenie nie znalezione' });
    }
    
    console.log('Znaleziono wydarzenie:', event.toJSON());
    
    // Przygotuj dane do aktualizacji
    const updateData = {
      title,
      start_date,
      end_date: end_date || start_date,
      event_status: event_status || 'primary',
      updated_at: new Date()
    };
    
    console.log('Dane po przygotowaniu do aktualizacji:', updateData);
    
    // Aktualizacja z użyciem try-catch dla lepszego debugowania
    try {
      await event.update(updateData);
      console.log('Wydarzenie zaktualizowane pomyślnie');
    } catch (updateError) {
      console.error('Błąd podczas aktualizacji danych:', updateError);
      throw updateError; // Rzuć błąd dalej, aby został obsłużony w głównym bloku try-catch
    }
    
    // Pobierz zaktualizowane wydarzenie
    const updatedEvent = await CalendarEvent.findByPk(id);
    console.log('Zaktualizowane wydarzenie:', updatedEvent.toJSON());
    
    res.json(updatedEvent);
  } catch (error) {
    console.error('Błąd aktualizacji wydarzenia:', error);
    res.status(500).json({ error: 'Błąd serwera', details: error.message });
  }
});

// Usuwanie wydarzenia - najprostsza implementacja
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await CalendarEvent.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: 'Wydarzenie nie znalezione' });
    }
    
    await event.destroy();
    res.json({ message: 'Wydarzenie usunięte' });
  } catch (error) {
    console.error('Błąd usuwania wydarzenia:', error);
    res.status(500).json({ error: 'Błąd serwera', details: error.message });
  }
});

module.exports = router;