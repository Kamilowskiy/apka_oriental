// routes/calendar.cjs - naprawiona wersja
const express = require('express');
const router = express.Router();
const { CalendarEvent } = require('../models/CalendarEvents.cjs');
const sequelize = require('../config/database.cjs');

// Endpoint testowy (bez autoryzacji) - do sprawdzenia, czy router działa
router.get('/test', (req, res) => {
  res.json({ message: 'API kalendarza działa poprawnie' });
});

// Pobierz wszystkie wydarzenia dla zalogowanego użytkownika
router.get('/', async (req, res) => {
  try {
    // Upewnij się, że mamy ID użytkownika z tokena uwierzytelniającego
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Nieautoryzowany dostęp' });
    }

    console.log('Pobieranie wydarzeń dla użytkownika:', req.user.id);
    
    // Używamy try-catch, aby złapać potencjalne błędy
    let events;
    try {
      events = await CalendarEvent.findAll({
        where: { user_id: req.user.id },
        order: [['start_date', 'ASC']] // Sortuj według daty początkowej
      });
    } catch (dbError) {
      console.error('Błąd bazy danych przy pobieraniu wydarzeń:', dbError);
      return res.status(500).json({ error: 'Błąd bazy danych', details: dbError.message });
    }
    
    // Upewnijmy się, że wydarzenia są tablicą
    if (!Array.isArray(events)) {
      console.error('Nieprawidłowy format danych wydarzeń:', events);
      events = [];
    }
    
    // Formatowanie wydarzeń do formatu FullCalendar
    const formattedEvents = events.map(event => ({
      id: event.id.toString(),
      title: event.title,
      start: event.start_date,
      end: event.end_date,
      extendedProps: {
        calendar: event.calendar_type,
        startTime: event.start_time,
        endTime: event.end_time
      }
    }));
    
    res.json(formattedEvents);
  } catch (error) {
    console.error('Błąd pobierania wydarzeń:', error);
    res.status(500).json({ error: 'Błąd serwera', details: error.message });
  }
});

// Dodaj nowe wydarzenie
router.post('/', async (req, res) => {
  try {
    // Sprawdź czy mamy potrzebne dane
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Nieautoryzowany dostęp' });
    }
    
    const { title, start, end, extendedProps } = req.body;
    
    if (!title || !start || !extendedProps || !extendedProps.calendar) {
      return res.status(400).json({ error: 'Brakujące dane wydarzenia' });
    }
    
    // Parsowanie daty i godziny
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;
    
    // Pobierz godziny z extendedProps lub ustaw domyślne
    const startTime = extendedProps.startTime || startDate.toTimeString().substring(0, 5);
    const endTime = extendedProps.endTime || (endDate ? endDate.toTimeString().substring(0, 5) : '');
    
    // Tworzenie nowego wydarzenia
    const newEvent = await CalendarEvent.create({
      title,
      start_date: startDate,
      end_date: endDate,
      calendar_type: extendedProps.calendar,
      start_time: startTime,
      end_time: endTime,
      user_id: req.user.id,
      created_at: new Date()
    });
    
    res.status(201).json({
      id: newEvent.id.toString(),
      title: newEvent.title,
      start: newEvent.start_date,
      end: newEvent.end_date,
      extendedProps: {
        calendar: newEvent.calendar_type,
        startTime: newEvent.start_time,
        endTime: newEvent.end_time
      }
    });
  } catch (error) {
    console.error('Błąd dodawania wydarzenia:', error);
    res.status(500).json({ error: 'Błąd serwera', details: error.message });
  }
});

// Aktualizuj istniejące wydarzenie
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, start, end, extendedProps } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Nieautoryzowany dostęp' });
    }
    
    // Sprawdź, czy wydarzenie istnieje i należy do zalogowanego użytkownika
    const event = await CalendarEvent.findOne({
      where: { 
        id, 
        user_id: req.user.id 
      }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Wydarzenie nie zostało znalezione' });
    }
    
    // Parsowanie daty i godziny
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;
    
    // Pobierz godziny z extendedProps lub ustaw domyślne
    const startTime = extendedProps.startTime || startDate.toTimeString().substring(0, 5);
    const endTime = extendedProps.endTime || (endDate ? endDate.toTimeString().substring(0, 5) : '');
    
    // Aktualizacja wydarzenia
    await event.update({
      title,
      start_date: startDate,
      end_date: endDate,
      calendar_type: extendedProps.calendar,
      start_time: startTime,
      end_time: endTime,
      updated_at: new Date()
    });
    
    res.json({
      id: event.id.toString(),
      title: event.title,
      start: event.start_date,
      end: event.end_date,
      extendedProps: {
        calendar: event.calendar_type,
        startTime: event.start_time,
        endTime: event.end_time
      }
    });
  } catch (error) {
    console.error('Błąd aktualizacji wydarzenia:', error);
    res.status(500).json({ error: 'Błąd serwera', details: error.message });
  }
});

// Usuń wydarzenie
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Nieautoryzowany dostęp' });
    }
    
    // Sprawdź, czy wydarzenie istnieje i należy do zalogowanego użytkownika
    const event = await CalendarEvent.findOne({
      where: { 
        id, 
        user_id: req.user.id 
      }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Wydarzenie nie zostało znalezione' });
    }
    
    // Usunięcie wydarzenia
    await event.destroy();
    
    res.json({ message: 'Wydarzenie zostało usunięte' });
  } catch (error) {
    console.error('Błąd usuwania wydarzenia:', error);
    res.status(500).json({ error: 'Błąd serwera', details: error.message });
  }
});

module.exports = router;