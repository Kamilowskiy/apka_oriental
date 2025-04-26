// api/routes/projects.cjs
const express = require('express');
const router = express.Router();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.cjs');
const Client = require('../models/Client.cjs');

// Definicja modelu Project przy użyciu tabeli services
const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  client_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id'
    }
  },
  service_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('todo', 'in-progress', 'completed'),
    defaultValue: 'todo',
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium',
    allowNull: false
  },
  assigned_to: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  estimated_hours: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  tags: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  }
}, {
  tableName: 'services', // Używamy istniejącej tabeli services
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Relacja z klientem
Project.belongsTo(Client, { foreignKey: 'client_id' });

// Pobierz wszystkie projekty
router.get('/', async (req, res) => {
  try {
    const projects = await Project.findAll({
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Client,
          attributes: ['id', 'company_name', 'contact_first_name', 'contact_last_name']
        }
      ]
    });
    
    res.json({ projects });
  } catch (error) {
    console.error('Błąd podczas pobierania projektów:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas pobierania projektów', details: error.message });
  }
});

// Pobierz projekty dla konkretnego klienta
router.get('/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const projects = await Project.findAll({
      where: { client_id: clientId },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Client,
          attributes: ['id', 'company_name', 'contact_first_name', 'contact_last_name']
        }
      ]
    });
    
    res.json({ projects });
  } catch (error) {
    console.error('Błąd podczas pobierania projektów klienta:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas pobierania projektów klienta', details: error.message });
  }
});

// Pobierz pojedynczy projekt po ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findByPk(id, {
      include: [
        {
          model: Client,
          attributes: ['id', 'company_name', 'contact_first_name', 'contact_last_name']
        }
      ]
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projekt nie został znaleziony' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Błąd podczas pobierania projektu:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas pobierania projektu', details: error.message });
  }
});

// Utwórz nowy projekt
router.post('/', async (req, res) => {
  try {
    const projectData = req.body;
    
    // Sprawdź czy klient istnieje
    const client = await Client.findByPk(projectData.client_id);
    if (!client) {
      return res.status(404).json({ error: 'Podany klient nie istnieje' });
    }
    
    // Walidacja wymaganych pól
    if (!projectData.service_name || !projectData.client_id || !projectData.price || !projectData.start_date) {
      return res.status(400).json({ error: 'Brakuje wymaganych danych projektu' });
    }
    
    // Dodaj datę utworzenia
    projectData.created_at = new Date();
    
    // Utwórz nowy projekt
    const newProject = await Project.create(projectData);
    
    res.status(201).json(newProject);
  } catch (error) {
    console.error('Błąd podczas tworzenia projektu:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas tworzenia projektu', details: error.message });
  }
});

// Aktualizuj istniejący projekt
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projectData = req.body;
    
    // Znajdź projekt
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: 'Projekt nie został znaleziony' });
    }
    
    // Jeśli aktualizujemy client_id, sprawdź czy klient istnieje
    if (projectData.client_id && projectData.client_id !== project.client_id) {
      const client = await Client.findByPk(projectData.client_id);
      if (!client) {
        return res.status(404).json({ error: 'Podany klient nie istnieje' });
      }
    }
    
    // Aktualizuj projekt
    await project.update(projectData);
    
    // Pobierz zaktualizowany projekt
    const updatedProject = await Project.findByPk(id, {
      include: [
        {
          model: Client,
          attributes: ['id', 'company_name', 'contact_first_name', 'contact_last_name']
        }
      ]
    });
    
    res.json(updatedProject);
  } catch (error) {
    console.error('Błąd podczas aktualizacji projektu:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas aktualizacji projektu', details: error.message });
  }
});

// Usuń projekt
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Znajdź projekt
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: 'Projekt nie został znaleziony' });
    }
    
    // Usuń projekt
    await project.destroy();
    
    res.json({ message: 'Projekt został pomyślnie usunięty' });
  } catch (error) {
    console.error('Błąd podczas usuwania projektu:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas usuwania projektu', details: error.message });
  }
});

// Endpoint do aktualizacji statusu projektu
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Sprawdź czy status jest poprawny
    if (!status || !['todo', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status projektu' });
    }
    
    // Znajdź projekt
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: 'Projekt nie został znaleziony' });
    }
    
    // Aktualizuj status
    await project.update({ status });
    
    res.json({ message: 'Status projektu został zaktualizowany', status });
  } catch (error) {
    console.error('Błąd podczas aktualizacji statusu projektu:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas aktualizacji statusu projektu', details: error.message });
  }
});

// Endpoint do filtrowania projektów według statusu
router.get('/filter/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    
    // Sprawdź czy status jest poprawny
    if (!['todo', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status projektu' });
    }
    
    const projects = await Project.findAll({
      where: { status },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Client,
          attributes: ['id', 'company_name', 'contact_first_name', 'contact_last_name']
        }
      ]
    });
    
    res.json({ projects });
  } catch (error) {
    console.error('Błąd podczas filtrowania projektów:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas filtrowania projektów', details: error.message });
  }
});

// Endpoint do pobierania statystyk projektów
router.get('/stats/overview', async (req, res) => {
  try {
    // Pobierz liczbę projektów według statusu
    const todoCount = await Project.count({ where: { status: 'todo' } });
    const inProgressCount = await Project.count({ where: { status: 'in-progress' } });
    const completedCount = await Project.count({ where: { status: 'completed' } });
    
    // Pobierz sumę cen projektów
    const totalValue = await Project.sum('price');
    
    // Pobierz liczbę projektów według priorytetów
    const highPriorityCount = await Project.count({ where: { priority: 'high' } });
    const mediumPriorityCount = await Project.count({ where: { priority: 'medium' } });
    const lowPriorityCount = await Project.count({ where: { priority: 'low' } });
    
    // Zwróć statystyki
    res.json({
      totalProjects: todoCount + inProgressCount + completedCount,
      statusCounts: {
        todo: todoCount,
        inProgress: inProgressCount,
        completed: completedCount
      },
      priorityCounts: {
        high: highPriorityCount,
        medium: mediumPriorityCount,
        low: lowPriorityCount
      },
      totalValue
    });
  } catch (error) {
    console.error('Błąd podczas pobierania statystyk projektów:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas pobierania statystyk projektów', details: error.message });
  }
});

module.exports = router;