// api/routes/projects.cjs
const express = require('express');
const router = express.Router();
const Project = require('../models/Projects.cjs');
const Client = require('../models/Client.cjs');
const { createNotification } = require('../../src/utils/notificationHelpers.cjs');


// Establish relationship with Client
Project.belongsTo(Client, { foreignKey: 'client_id' });

// Get all projects
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
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'An error occurred while fetching projects', details: error.message });
  }
});

// Get projects for a specific client
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
    console.error('Error fetching client projects:', error);
    res.status(500).json({ error: 'An error occurred while fetching client projects', details: error.message });
  }
});

// Get a single project by ID
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
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'An error occurred while fetching project', details: error.message });
  }
});

// Create a new project
router.post('/', async (req, res) => {
  try {
    const projectData = req.body;
    
    // Check if client exists
    const client = await Client.findByPk(projectData.client_id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Validate required fields
    if (!projectData.service_name || !projectData.client_id || !projectData.price || !projectData.start_date) {
      return res.status(400).json({ error: 'Missing required project data' });
    }
    
    // Add creation date
    projectData.created_at = new Date();
    
    // Create a new project
    const newProject = await Project.create(projectData);
    
    // Utworzenie powiadomienia o nowym projekcie
    try {
      const userId = req.user.id; // ID zalogowanego użytkownika
      
      await createNotification(
        userId,
        'Nowy projekt',
        `Utworzono nowy projekt: "${newProject.service_name}" dla klienta ${client.company_name}`,
        'project',
        newProject.id,
        'project'
      );
    } catch (notifError) {
      // Loguj błąd, ale nie przerywaj wykonania
      console.error('Błąd podczas tworzenia powiadomienia:', notifError);
    }
    
    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'An error occurred while creating project', details: error.message });
  }
});


// Update an existing project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projectData = req.body;
    
    // Find the project
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // If updating client_id, check if client exists
    if (projectData.client_id && projectData.client_id !== project.client_id) {
      const client = await Client.findByPk(projectData.client_id);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
    }
    
    // Update project
    await project.update(projectData);
    
    // Fetch updated project
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
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'An error occurred while updating project', details: error.message });
  }
});

// Delete a project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the project
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Delete the project
    await project.destroy();
    
    res.json({ message: 'Project successfully deleted' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'An error occurred while deleting project', details: error.message });
  }
});

// Update project status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Check if status is valid
    if (!status || !['todo', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid project status' });
    }
    
    // Find the project
    const project = await Project.findByPk(id, {
      include: [
        {
          model: Client,
          attributes: ['id', 'company_name']
        }
      ]
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Zapamiętaj poprzedni status
    const oldStatus = project.status;
    
    // Update status
    await project.update({ status });
    
    // Utworzenie powiadomienia o zmianie statusu projektu
    try {
      const userId = req.user.id; // ID zalogowanego użytkownika
      
      // Pobieranie polskiej nazwy statusu
      const getStatusName = (statusCode) => {
        switch (statusCode) {
          case 'todo': return 'Do zrobienia';
          case 'in-progress': return 'W trakcie';
          case 'completed': return 'Ukończony';
          default: return statusCode;
        }
      };
      
      const oldStatusName = getStatusName(oldStatus);
      const newStatusName = getStatusName(status);
      
      let title, message;
      
      if (status === 'completed') {
        title = 'Projekt ukończony';
        message = `Projekt "${project.service_name}" został oznaczony jako ukończony`;
      } else {
        title = 'Zmiana statusu projektu';
        message = `Status projektu "${project.service_name}" został zmieniony z "${oldStatusName}" na "${newStatusName}"`;
      }
      
      await createNotification(
        userId,
        title,
        message,
        'project',
        project.id,
        'project'
      );
    } catch (notifError) {
      // Loguj błąd, ale nie przerywaj wykonania
      console.error('Błąd podczas tworzenia powiadomienia:', notifError);
    }
    
    res.json({ message: 'Project status updated', status });
  } catch (error) {
    console.error('Error updating project status:', error);
    res.status(500).json({ error: 'An error occurred while updating project status', details: error.message });
  }
});

// Filter projects by status
router.get('/filter/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    
    // Check if status is valid
    if (!['todo', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid project status' });
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
    console.error('Error filtering projects:', error);
    res.status(500).json({ error: 'An error occurred while filtering projects', details: error.message });
  }
});

// Get project statistics
router.get('/stats/overview', async (req, res) => {
  try {
    // Get project counts by status
    const todoCount = await Project.count({ where: { status: 'todo' } });
    const inProgressCount = await Project.count({ where: { status: 'in-progress' } });
    const completedCount = await Project.count({ where: { status: 'completed' } });
    
    // Get the sum of project prices
    const totalValue = await Project.sum('price');
    
    // Get project counts by priority
    const highPriorityCount = await Project.count({ where: { priority: 'high' } });
    const mediumPriorityCount = await Project.count({ where: { priority: 'medium' } });
    const lowPriorityCount = await Project.count({ where: { priority: 'low' } });
    
    // Return statistics
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
    console.error('Error fetching project statistics:', error);
    res.status(500).json({ error: 'An error occurred while fetching project statistics', details: error.message });
  }
});

module.exports = router;