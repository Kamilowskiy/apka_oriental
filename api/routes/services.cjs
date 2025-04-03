// api/routes/services.cjs
const express = require('express');
const router = express.Router();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.cjs');

// Define the Service model directly in the route file for simplicity
const Service = sequelize.define('Service', {
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
  tableName: 'services',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Get all services for a specific client
router.get('/:clientId', async (req, res) => {
  const { clientId } = req.params;
  
  try {
    const serviceEntries = await Service.findAll({
      where: { client_id: clientId },
      order: [['start_date', 'DESC']]
    });
    
    res.json({ services: serviceEntries });
  } catch (error) {
    console.error('Error fetching services data:', error);
    res.status(500).json({ error: 'Failed to retrieve services information', details: error.message });
  }
});

// Create a new service entry
router.post('/', async (req, res) => {
  try {
    const newService = await Service.create(req.body);
    res.status(201).json(newService);
  } catch (error) {
    console.error('Error creating service entry:', error);
    res.status(500).json({ error: 'Failed to create service entry', details: error.message });
  }
});

// Update existing service entry
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const service = await Service.findByPk(id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service entry not found' });
    }
    
    await service.update(req.body);
    res.json(service);
  } catch (error) {
    console.error('Error updating service entry:', error);
    res.status(500).json({ error: 'Failed to update service entry', details: error.message });
  }
});

// Delete service entry
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const service = await Service.findByPk(id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service entry not found' });
    }
    
    await service.destroy();
    res.json({ message: 'Service entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting service entry:', error);
    res.status(500).json({ error: 'Failed to delete service entry', details: error.message });
  }
});

module.exports = router;