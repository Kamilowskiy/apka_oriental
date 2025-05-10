// routes/calendar.cjs - minimalna wersja
const express = require('express');
const router = express.Router();
const sequelize = require('../config/database.cjs');
const { DataTypes } = require('sequelize');
const { createNotification } = require('../../src/utils/notificationHelpers.cjs');

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
    
    // Utworzenie powiadomienia o nowym wydarzeniu
    try {
      const userId = req.user.id; // ID zalogowanego użytkownika
      
      // Formatowanie daty w czytelnym formacie
      const formattedDate = new Date(start_date).toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      await createNotification(
        userId,
        'Nowe wydarzenie w kalendarzu',
        `Dodano nowe wydarzenie: "${title}" na ${formattedDate}`,
        'system', // Typ powiadomienia
        newEvent.id, // ID powiązanego wydarzenia
        'calendar_event' // Typ powiązanego obiektu
      );
    } catch (notifError) {
      // Loguj błąd, ale nie przerywaj wykonania
      console.error('Błąd podczas tworzenia powiadomienia:', notifError);
    }
    
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
    
    if (!title || !start_date) {
      return res.status(400).json({ error: 'Brakujące dane wydarzenia' });
    }
    
    // Znajdź wydarzenie po ID
    const event = await CalendarEvent.findByPk(id);
    
    if (!event) {
      console.log('Wydarzenie nie znalezione dla ID:', id);
      return res.status(404).json({ error: 'Wydarzenie nie znalezione' });
    }
    
    // Przygotuj dane do aktualizacji
    const updateData = {
      title,
      start_date,
      end_date: end_date || start_date,
      event_status: event_status || 'primary',
      updated_at: new Date()
    };
    
    // Aktualizacja wydarzenia
    await event.update(updateData);
    
    // Pobierz zaktualizowane wydarzenie
    const updatedEvent = await CalendarEvent.findByPk(id);
    
    // Utworzenie powiadomienia o aktualizacji wydarzenia
    try {
      const userId = req.user.id; // ID zalogowanego użytkownika
      
      // Formatowanie daty w czytelnym formacie
      const formattedDate = new Date(updatedEvent.start_date).toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      await createNotification(
        userId,
        'Aktualizacja wydarzenia w kalendarzu',
        `Zaktualizowano wydarzenie: "${updatedEvent.title}" na ${formattedDate}`,
        'system',
        updatedEvent.id,
        'calendar_event'
      );
    } catch (notifError) {
      // Loguj błąd, ale nie przerywaj wykonania
      console.error('Błąd podczas tworzenia powiadomienia:', notifError);
    }
    
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
    
    // Zapisz dane wydarzenia przed usunięciem
    const eventTitle = event.title;
    
    await event.destroy();
    
    // Utworzenie powiadomienia o usunięciu wydarzenia
    try {
      const userId = req.user.id; // ID zalogowanego użytkownika
      
      await createNotification(
        userId,
        'Usunięcie wydarzenia z kalendarza',
        `Usunięto wydarzenie: "${eventTitle}"`,
        'system',
        null, // Brak ID powiązanego wydarzenia (zostało usunięte)
        'calendar_event'
      );
    } catch (notifError) {
      // Loguj błąd, ale nie przerywaj wykonania
      console.error('Błąd podczas tworzenia powiadomienia:', notifError);
    }
    
    res.json({ message: 'Wydarzenie usunięte' });
  } catch (error) {
    console.error('Błąd usuwania wydarzenia:', error);
    res.status(500).json({ error: 'Błąd serwera', details: error.message });
  }
});

module.exports = router;