// routes/calendar.cjs
const express = require('express');
const router = express.Router();
const { CalendarEvent } = require('../models/CalendarEvents.cjs');

// Endpoint testowy (bez autoryzacji) - do sprawdzenia, czy router działa
router.get('/test', (req, res) => {
  res.json({ message: 'API kalendarza działa poprawnie' });
});

// Pobierz wszystkie wydarzenia dla zalogowanego użytkownika
router.get('/', async (req, res) => {
  try {
    console.log('Pobieranie wydarzeń dla użytkownika:', req.user.id);
    const events = await CalendarEvent.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    
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
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Dodaj nowe wydarzenie
router.post('/', async (req, res) => {
  try {
    const { title, start, end, extendedProps } = req.body;
    
    // Parsowanie daty i godziny
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Tworzenie nowego wydarzenia
    const newEvent = await CalendarEvent.create({
      title,
      start_date: startDate,
      end_date: endDate,
      calendar_type: extendedProps.calendar,
      start_time: extendedProps.startTime,
      end_time: extendedProps.endTime,
      user_id: req.user.id
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
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Aktualizuj istniejące wydarzenie
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, start, end, extendedProps } = req.body;
    
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
    const endDate = new Date(end);
    
    // Aktualizacja wydarzenia
    await event.update({
      title,
      start_date: startDate,
      end_date: endDate,
      calendar_type: extendedProps.calendar,
      start_time: extendedProps.startTime,
      end_time: extendedProps.endTime
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
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Usuń wydarzenie
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
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
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;