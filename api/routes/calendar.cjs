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

// Funkcja pomocnicza do formatowania daty ISO do czytelnego formatu
const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return null;
  
  const date = new Date(dateTimeString);
  return {
    date: date.toISOString().split('T')[0],
    time: date.toTimeString().split(' ')[0].substring(0, 5), // Format HH:MM
    fullDateTime: date.toISOString() // Pełny format ISO dla integracji z FullCalendar
  };
};

// Pobierz wszystkie wydarzenia
router.get('/', async (req, res) => {
  try {
    console.log('Pobieranie wszystkich wydarzeń kalendarza...');
    const events = await CalendarEvent.findAll();
    console.log(`Znaleziono ${events.length} wydarzeń`);
    
    // Formatowanie dat do formatu kompatybilnego z FullCalendar
    const formattedEvents = events.map(event => {
      const startDateTime = formatDateTime(event.start_date);
      const endDateTime = formatDateTime(event.end_date);
      
      return {
        id: event.id,
        title: event.title,
        start: event.start_date, // Pełna data i godzina
        end: event.end_date,     // Pełna data i godzina
        extendedProps: {
          calendar: event.event_status,
          startTime: startDateTime ? startDateTime.time : null,
          endTime: endDateTime ? endDateTime.time : null
        }
      };
    });
    
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
    
    const startDateTime = formatDateTime(event.start_date);
    const endDateTime = formatDateTime(event.end_date);
    
    res.json({
      id: event.id,
      title: event.title,
      start: event.start_date,
      end: event.end_date,
      extendedProps: {
        calendar: event.event_status,
        startTime: startDateTime ? startDateTime.time : null,
        endTime: endDateTime ? endDateTime.time : null
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
    
    // Sprawdzenie czy start i end zawierają datę i godzinę
    // Jeśli nie zawierają litery 'T', która rozdziela datę i godzinę w formacie ISO,
    // dodajemy domyślną godzinę
    let startDateTime = start;
    let endDateTime = end;
    
    if (start && !start.includes('T')) {
      // Brak określonej godziny, domyślnie 00:00
      startDateTime = `${start}T00:00:00`;
    }
    
    if (end && !end.includes('T')) {
      // Brak określonej godziny, domyślnie 23:59
      endDateTime = `${end}T23:59:59`;
    }
    
    console.log('Tworzenie wydarzenia z danymi:', {
      title,
      start_date: new Date(startDateTime),
      end_date: endDateTime ? new Date(endDateTime) : null,
      event_status: extendedProps.calendar
    });
    
    const newEvent = await CalendarEvent.create({
      title,
      start_date: new Date(startDateTime),
      end_date: endDateTime ? new Date(endDateTime) : null,
      event_status: extendedProps.calendar
    });
    
    console.log('Wydarzenie utworzone:', newEvent.id);
    
    const formattedStartDate = formatDateTime(newEvent.start_date);
    const formattedEndDate = formatDateTime(newEvent.end_date);
    
    res.status(201).json({
      id: newEvent.id,
      title: newEvent.title,
      start: newEvent.start_date,
      end: newEvent.end_date,
      extendedProps: {
        calendar: newEvent.event_status,
        startTime: formattedStartDate ? formattedStartDate.time : null,
        endTime: formattedEndDate ? formattedEndDate.time : null
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
    
    // Sprawdzenie czy start i end zawierają datę i godzinę
    let startDateTime = start;
    let endDateTime = end;
    
    if (start && !start.includes('T')) {
      // Brak określonej godziny, domyślnie 00:00
      startDateTime = `${start}T00:00:00`;
    }
    
    if (end && !end.includes('T')) {
      // Brak określonej godziny, domyślnie 23:59
      endDateTime = `${end}T23:59:59`;
    }
    
    // Aktualizacja wydarzenia
    await event.update({
      title,
      start_date: new Date(startDateTime),
      end_date: endDateTime ? new Date(endDateTime) : null,
      event_status: extendedProps.calendar,
      updated_at: new Date()
    });
    
    console.log('Wydarzenie zaktualizowane');
    
    const formattedStartDate = formatDateTime(event.start_date);
    const formattedEndDate = formatDateTime(event.end_date);
    
    res.json({
      id: event.id,
      title: event.title,
      start: event.start_date,
      end: event.end_date,
      extendedProps: {
        calendar: event.event_status,
        startTime: formattedStartDate ? formattedStartDate.time : null,
        endTime: formattedEndDate ? formattedEndDate.time : null
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