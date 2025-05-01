// api/routes/projectTasks.cjs
const express = require('express');
const router = express.Router();
const ProjectTask = require('../models/ProjectTask.cjs');
const Service = require('../models/Services.cjs');

// Pobierz wszystkie zadania dla konkretnego projektu
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Sprawdź, czy projekt istnieje
    const project = await Service.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Projekt nie został znaleziony' });
    }
    
    // Pobierz zadania dla projektu
    const tasks = await ProjectTask.findAll({
      where: { project_id: projectId },
      order: [['created_at', 'DESC']]
    });
    
    res.json({ tasks });
  } catch (error) {
    console.error('Błąd podczas pobierania zadań projektu:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas pobierania zadań projektu', details: error.message });
  }
});

// Pobierz jedno zadanie po ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await ProjectTask.findByPk(id);
    if (!task) {
      return res.status(404).json({ error: 'Zadanie nie zostało znalezione' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Błąd podczas pobierania zadania:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas pobierania zadania', details: error.message });
  }
});

// Dodaj nowe zadanie do projektu
router.post('/', async (req, res) => {
  try {
    const taskData = req.body;
    
    // Sprawdź, czy projekt istnieje
    const project = await Service.findByPk(taskData.project_id);
    if (!project) {
      return res.status(404).json({ error: 'Projekt nie został znaleziony' });
    }
    
    // Walidacja wymaganych pól
    if (!taskData.title || !taskData.project_id) {
      return res.status(400).json({ error: 'Brakujące wymagane dane zadania' });
    }
    
    // Dodaj datę utworzenia
    taskData.created_at = new Date();
    
    // Utwórz nowe zadanie
    const newTask = await ProjectTask.create(taskData);
    
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Błąd podczas dodawania zadania:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas dodawania zadania', details: error.message });
  }
});

// Aktualizacja istniejącego zadania
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const taskData = req.body;
    
    // Sprawdź, czy zadanie istnieje
    const task = await ProjectTask.findByPk(id);
    if (!task) {
      return res.status(404).json({ error: 'Zadanie nie zostało znalezione' });
    }
    
    // Jeśli status zmienił się na 'completed', dodaj datę zakończenia
    if (taskData.status === 'completed' && task.status !== 'completed') {
      taskData.completed_at = new Date();
    } else if (taskData.status !== 'completed') {
      taskData.completed_at = null;
    }
    
    // Dodaj datę aktualizacji
    taskData.updated_at = new Date();
    
    // Aktualizuj zadanie
    await task.update(taskData);
    
    // Pobierz zaktualizowane zadanie
    const updatedTask = await ProjectTask.findByPk(id);
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Błąd podczas aktualizacji zadania:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas aktualizacji zadania', details: error.message });
  }
});

// Usuwanie zadania
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Sprawdź, czy zadanie istnieje
    const task = await ProjectTask.findByPk(id);
    if (!task) {
      return res.status(404).json({ error: 'Zadanie nie zostało znalezione' });
    }
    
    // Usuń zadanie
    await task.destroy();
    
    res.json({ message: 'Zadanie zostało pomyślnie usunięte' });
  } catch (error) {
    console.error('Błąd podczas usuwania zadania:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas usuwania zadania', details: error.message });
  }
});

// Aktualizacja statusu zadania
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Sprawdź, czy status jest poprawny
    if (!status || !['todo', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status zadania' });
    }
    
    // Sprawdź, czy zadanie istnieje
    const task = await ProjectTask.findByPk(id);
    if (!task) {
      return res.status(404).json({ error: 'Zadanie nie zostało znalezione' });
    }
    
    // Przygotuj dane do aktualizacji
    const updateData = { 
      status,
      updated_at: new Date()
    };
    
    // Jeśli status zmienił się na 'completed', dodaj datę zakończenia
    if (status === 'completed' && task.status !== 'completed') {
      updateData.completed_at = new Date();
    } else if (status !== 'completed') {
      updateData.completed_at = null;
    }
    
    // Aktualizuj status
    await task.update(updateData);
    
    res.json({ message: 'Status zadania zaktualizowany', status });
  } catch (error) {
    console.error('Błąd podczas aktualizacji statusu zadania:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas aktualizacji statusu zadania', details: error.message });
  }
});

// Pobierz zadania według statusu
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    
    // Sprawdź, czy status jest poprawny
    if (!['todo', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status zadania' });
    }
    
    const tasks = await ProjectTask.findAll({
      where: { status },
      order: [['created_at', 'DESC']]
    });
    
    res.json({ tasks });
  } catch (error) {
    console.error('Błąd podczas filtrowania zadań:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas filtrowania zadań', details: error.message });
  }
});

// Tworzenie domyślnych zadań dla nowego projektu
router.post('/create-defaults', async (req, res) => {
  try {
    const { project_id, project_name } = req.body;
    
    // Sprawdź, czy projekt istnieje
    const project = await Service.findByPk(project_id);
    if (!project) {
      return res.status(404).json({ error: 'Projekt nie został znaleziony' });
    }
    
    // Domyślne zadania dla każdego projektu
    const defaultTasks = [
      {
        project_id,
        title: `Analiza wymagań dla ${project_name}`,
        description: 'Zebranie i analiza wymagań klienta dotyczących projektu',
        status: 'todo',
        priority: 'high',
        assigned_to: null,
        estimated_hours: 4,
        due_date: null,
        created_at: new Date()
      },
      {
        project_id,
        title: `Projektowanie dla ${project_name}`,
        description: 'Przygotowanie projektu graficznego i funkcjonalnego',
        status: 'todo',
        priority: 'medium',
        assigned_to: null,
        estimated_hours: 8,
        due_date: null,
        created_at: new Date()
      },
      {
        project_id,
        title: `Implementacja dla ${project_name}`,
        description: 'Realizacja projektu zgodnie z wymaganiami',
        status: 'todo',
        priority: 'medium',
        assigned_to: null,
        estimated_hours: 16,
        due_date: null,
        created_at: new Date()
      },
      {
        project_id,
        title: `Testowanie dla ${project_name}`,
        description: 'Testowanie funkcjonalności i poprawności działania',
        status: 'todo',
        priority: 'medium',
        assigned_to: null,
        estimated_hours: 4,
        due_date: null,
        created_at: new Date()
      },
      {
        project_id,
        title: `Wdrożenie dla ${project_name}`,
        description: 'Wdrożenie projektu na serwer produkcyjny',
        status: 'todo',
        priority: 'high',
        assigned_to: null,
        estimated_hours: 2,
        due_date: null,
        created_at: new Date()
      }
    ];
    
    // Utwórz wszystkie domyślne zadania
    const createdTasks = await ProjectTask.bulkCreate(defaultTasks);
    
    res.status(201).json({ 
      message: 'Domyślne zadania dla projektu zostały utworzone',
      tasks: createdTasks
    });
  } catch (error) {
    console.error('Błąd podczas tworzenia domyślnych zadań:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas tworzenia domyślnych zadań', details: error.message });
  }
});

module.exports = router;