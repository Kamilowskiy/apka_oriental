// api/routes/calendar_events.cjs
const express = require('express');
const router = express.Router();
const { CalendarEvent } = require('../models/CalendarEvents.cjs');
const { Op } = require('sequelize');

// Middleware do logowania zapytań - pomoże w debugowaniu
router.use((req, res, next) => {
  console.log(`Calendar API: ${req.method} ${req.originalUrl}`);
  next();
});

// Pobierz wszystkie wydarzenia
router.get('/', async (req, res) => {
  try {
    console.log('Pobieranie wszystkich wydarzeń kalendarza...');
    const events = await CalendarEvent.findAll();
    console.log(`Znaleziono ${events.length} wydarzeń`);
    
    // Formatowanie dat do formatu kompatybilnego z FullCalendar
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start_date,
      end: event.end_date,
      extendedProps: {
        calendar: event.event_status
      }
    }));
    
    res.json(formattedEvents);
  } catch (error) {
    console.error('Błąd pobierania wydarzeń:', error);
    res.status(500).json({ error: 'Błąd pobierania wydarzeń', details: error.message });
  }
});

// Pobierz pojedyncze wydarzenie
router.get('/:id', async (req, res) => {
  try {
    const event = await CalendarEvent.findByPk(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Wydarzenie nie znalezione' });
    }
    
    res.json({
      id: event.id,
      title: event.title,
      start: event.start_date,
      end: event.end_date,
      extendedProps: {
        calendar: event.event_status
      }
    });
  } catch (error) {
    console.error('Błąd pobierania wydarzenia:', error);
    res.status(500).json({ error: 'Błąd pobierania wydarzenia', details: error.message });
  }
});

// Dodaj nowe wydarzenie
router.post('/', async (req, res) => {
  try {
    console.log('Próba utworzenia nowego wydarzenia:', req.body);
    const { title, start, end, extendedProps } = req.body;
    
    // Walidacja wymaganych pól
    if (!title || !start || !extendedProps || !extendedProps.calendar) {
      return res.status(400).json({ error: 'Brakujące wymagane pola' });
    }
    
    console.log('Tworzenie wydarzenia z danymi:', {
      title,
      start_date: new Date(start),
      end_date: end ? new Date(end) : null,
      event_status: extendedProps.calendar
    });
    
    const newEvent = await CalendarEvent.create({
      title,
      start_date: new Date(start),
      end_date: end ? new Date(end) : null,
      event_status: extendedProps.calendar
    });
    
    console.log('Wydarzenie utworzone:', newEvent.id);
    
    res.status(201).json({
      id: newEvent.id,
      title: newEvent.title,
      start: newEvent.start_date,
      end: newEvent.end_date,
      extendedProps: {
        calendar: newEvent.event_status
      }
    });
  } catch (error) {
    console.error('Błąd tworzenia wydarzenia:', error);
    res.status(500).json({ error: 'Błąd tworzenia wydarzenia', details: error.message });
  }
});

// Aktualizuj wydarzenie
router.put('/:id', async (req, res) => {
  try {
    console.log(`Aktualizacja wydarzenia ${req.params.id}:`, req.body);
    const { title, start, end, extendedProps } = req.body;
    const eventId = req.params.id;
    
    // Walidacja wymaganych pól
    if (!title || !start || !extendedProps || !extendedProps.calendar) {
      return res.status(400).json({ error: 'Brakujące wymagane pola' });
    }
    
    const event = await CalendarEvent.findByPk(eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Wydarzenie nie znalezione' });
    }
    
    // Aktualizacja wydarzenia
    await event.update({
      title,
      start_date: new Date(start),
      end_date: end ? new Date(end) : null,
      event_status: extendedProps.calendar,
      updated_at: new Date()
    });
    
    console.log('Wydarzenie zaktualizowane');
    
    res.json({
      id: event.id,
      title: event.title,
      start: event.start_date,
      end: event.end_date,
      extendedProps: {
        calendar: event.event_status
      }
    });
  } catch (error) {
    console.error('Błąd aktualizacji wydarzenia:', error);
    res.status(500).json({ error: 'Błąd aktualizacji wydarzenia', details: error.message });
  }
});

// Usuń wydarzenie
router.delete('/:id', async (req, res) => {
  try {
    console.log(`Usuwanie wydarzenia ${req.params.id}`);
    const eventId = req.params.id;
    const event = await CalendarEvent.findByPk(eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Wydarzenie nie znalezione' });
    }
    
    await event.destroy();
    console.log('Wydarzenie usunięte');
    res.json({ message: 'Wydarzenie usunięte pomyślnie' });
  } catch (error) {
    console.error('Błąd usuwania wydarzenia:', error);
    res.status(500).json({ error: 'Błąd usuwania wydarzenia', details: error.message });
  }
});

module.exports = router;