// // api/routes/hosting.cjs

// const express = require('express');
// const router = express.Router();
// const sequelize = require('../config/database.cjs');

// // Define the Hosting model directly in the route file to avoid import issues
// const Hosting = sequelize.define('Hosting', {
//   id: {
//     type: sequelize.DataTypes.INTEGER.UNSIGNED,
//     primaryKey: true,
//     autoIncrement: true
//   },
//   client_id: {
//     type: sequelize.DataTypes.INTEGER.UNSIGNED,
//     allowNull: false,
//     references: {
//       model: 'clients',
//       key: 'id'
//     }
//   },
//   domain_name: {
//     type: sequelize.DataTypes.STRING(255),
//     allowNull: false
//   },
//   annual_price: {
//     type: sequelize.DataTypes.DECIMAL(10, 2),
//     allowNull: false
//   },
//   start_date: {
//     type: sequelize.DataTypes.DATEONLY,
//     allowNull: false
//   },
//   end_date: {
//     type: sequelize.DataTypes.DATEONLY,
//     allowNull: true
//   }
// }, {
//   tableName: 'hosting',
//   timestamps: true,
//   createdAt: 'created_at',
//   updatedAt: false
// });

// // Get all hosting entries for a specific client
// router.get('/:clientId', async (req, res) => {
//   const { clientId } = req.params;
  
//   try {
//     const hostingEntries = await Hosting.findAll({
//       where: { client_id: clientId },
//       order: [['start_date', 'DESC']]
//     });
    
//     res.json({ hosting: hostingEntries });
//   } catch (error) {
//     console.error('Error fetching hosting data:', error);
//     res.status(500).json({ error: 'Failed to retrieve hosting information', details: error.message });
//   }
// });

// // Create a new hosting entry
// router.post('/', async (req, res) => {
//   try {
//     const newHosting = await Hosting.create(req.body);
//     res.status(201).json(newHosting);
//   } catch (error) {
//     console.error('Error creating hosting entry:', error);
//     res.status(500).json({ error: 'Failed to create hosting entry', details: error.message });
//   }
// });

// // Update existing hosting entry
// router.put('/:id', async (req, res) => {
//   const { id } = req.params;
  
//   try {
//     const hosting = await Hosting.findByPk(id);
    
//     if (!hosting) {
//       return res.status(404).json({ error: 'Hosting entry not found' });
//     }
    
//     await hosting.update(req.body);
//     res.json(hosting);
//   } catch (error) {
//     console.error('Error updating hosting entry:', error);
//     res.status(500).json({ error: 'Failed to update hosting entry', details: error.message });
//   }
// });

// // Delete hosting entry
// router.delete('/:id', async (req, res) => {
//   const { id } = req.params;
  
//   try {
//     const hosting = await Hosting.findByPk(id);
    
//     if (!hosting) {
//       return res.status(404).json({ error: 'Hosting entry not found' });
//     }
    
//     await hosting.destroy();
//     res.json({ message: 'Hosting entry deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting hosting entry:', error);
//     res.status(500).json({ error: 'Failed to delete hosting entry', details: error.message });
//   }
// });

// module.exports = router;