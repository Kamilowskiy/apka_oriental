const express = require("express");
const cors = require("cors");
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Sprawdzenie konfiguracji JWT
const checkJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    console.error('UWAGA: Nie znaleziono JWT_SECRET w zmiennych środowiskowych!');
    console.error('Generowanie tokenów JWT nie będzie działać poprawnie.');
    console.error('Upewnij się, że plik .env zawiera zmienną JWT_SECRET.');
    return false;
  }
  
  if (secret.length < 32) {
    console.warn('OSTRZEŻENIE: JWT_SECRET jest zbyt krótki (mniej niż 32 znaki).');
    console.warn('Dla zapewnienia bezpieczeństwa, użyj dłuższego i bardziej złożonego klucza.');
    return false;
  }
  
  console.log('JWT_SECRET jest poprawnie skonfigurowany.');
  return true;
};

// Sprawdź JWT Secret
checkJWTSecret();

// Import database and models
const sequelize = require("./api/config/database.cjs");
const { Client, Hosting, Service, CalendarEvent, User } = require('./api/models/associations.cjs');

// Import routes
const clientsRoutes = require("./api/routes/clients.cjs");
const hostingRoutes = require("./api/routes/hosting.cjs");
const servicesRoutes = require('./api/routes/services.cjs');
const authRoutes = require('./api/routes/auth.cjs');
const calendarEventsRoutes = require('./api/routes/calendar.cjs');
const { authenticateUser } = require('./api/middleware/auth.cjs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(helmet()); // Bezpieczeństwo - ustawia różne nagłówki HTTP
app.use(morgan('dev')); // Logowanie żądań HTTP

// Request logger middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Modified storage configuration for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // If clientId is provided, create a folder for that client
    const clientId = req.params.clientId || req.body.clientId;
    
    if (clientId) {
      const clientDir = path.join(uploadsDir, clientId.toString());
      if (!fs.existsSync(clientDir)) {
        fs.mkdirSync(clientDir, { recursive: true });
      }
      cb(null, clientDir);
    } else {
      // Fallback to general uploads directory if no clientId is provided
      cb(null, uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    // Create a unique filename
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Middleware to serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Public routes
app.use("/api/auth", authRoutes);

// TEST ROUTE to verify server functionality
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working correctly" });
});

// Protected routes (require authentication)
app.use("/api/clients", authenticateUser, clientsRoutes);
app.use("/api/hosting", authenticateUser, hostingRoutes);
app.use('/api/services', authenticateUser, servicesRoutes);
app.use('/api/calendar', authenticateUser, calendarEventsRoutes);

// Client files routes - protected
app.get("/api/client-files/:clientId", authenticateUser, (req, res) => {
  const clientId = req.params.clientId;
  const clientDir = path.join(uploadsDir, clientId.toString());
  
  if (!fs.existsSync(clientDir)) {
    return res.json({ files: [] }); // Return empty array if directory doesn't exist
  }
  
  try {
    // Read the directory and get file info
    const files = fs.readdirSync(clientDir).map(filename => {
      const filePath = path.join(clientDir, filename);
      const stats = fs.statSync(filePath);
      
      return {
        name: filename,
        path: `/uploads/${clientId}/${filename}`,
        size: stats.size,
        createdAt: stats.birthtime,
        originalName: filename.substring(filename.indexOf('-') + 1).replace(/-/g, ' ') // Extract original name
      };
    });
    
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: "Failed to read client files", details: error.message });
  }
});

// Endpoint to handle file upload for existing clients
app.post("/api/upload/:clientId", authenticateUser, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  const clientId = req.params.clientId;
  const filePath = `/uploads/${clientId}/${req.file.filename}`;
  
  res.json({ 
    message: "File uploaded successfully", 
    filePath: filePath,
    file: {
      name: req.file.filename,
      path: filePath,
      size: req.file.size,
      createdAt: new Date(),
      originalName: req.file.originalname
    }
  });
});

// This endpoint will be used to upload files for a new client
app.post("/api/upload-temp", authenticateUser, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  // Store the file temporarily in the general uploads directory
  const filePath = `/uploads/${req.file.filename}`;
  
  res.json({ 
    message: "File uploaded temporarily", 
    filePath: filePath,
    filename: req.file.filename
  });
});

// Function to move a file from temp location to client folder
app.post("/api/move-file", authenticateUser, (req, res) => {
  const { filename, clientId } = req.body;
  
  if (!filename || !clientId) {
    return res.status(400).json({ error: "Missing filename or clientId" });
  }
  
  const sourceFile = path.join(uploadsDir, filename);
  const clientDir = path.join(uploadsDir, clientId.toString());
  
  // Create client directory if it doesn't exist
  if (!fs.existsSync(clientDir)) {
    fs.mkdirSync(clientDir, { recursive: true });
  }
  
  const destFile = path.join(clientDir, filename);
  
  try {
    // Move the file
    fs.renameSync(sourceFile, destFile);
    res.json({ 
      message: "File moved successfully", 
      filePath: `/uploads/${clientId}/${filename}` 
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to move file", details: error.message });
  }
});

// Endpoint to delete a client file
app.delete("/api/client-files/:clientId/:filename", authenticateUser, (req, res) => {
  const { clientId, filename } = req.params;
  const filePath = path.join(uploadsDir, clientId.toString(), filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }
  
  try {
    fs.unlinkSync(filePath);
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete file", details: error.message });
  }
});

app.delete("/api/:id", authenticateUser, async (req, res) => {
  const id = req.params.id;
  
  try {
    // Find the client
    const client = await Client.findByPk(id);
    
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }
    
    // Delete the client
    await client.destroy();
    
    // Note: We're handling folder deletion separately via the /api/client-folder/:clientId endpoint
    // This ensures separation of concerns and allows for retry mechanisms
    
    res.json({ message: "Client deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting client", details: error.message });
  }
});

const deleteDirectory = (dirPath) => {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursive call for directories
        deleteDirectory(curPath);
      } else {
        // Delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
};

// Add this endpoint to your server.cjs file
app.delete("/api/client-folder/:clientId", authenticateUser, (req, res) => {
  const { clientId } = req.params;
  const clientDir = path.join(uploadsDir, clientId.toString());
  
  if (!fs.existsSync(clientDir)) {
    return res.json({ message: "Folder does not exist or already deleted" });
  }
  
  try {
    deleteDirectory(clientDir);
    res.json({ message: "Client folder deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete client folder", details: error.message });
  }
});

// Add this endpoint to view files in browser
app.get("/api/view/:clientId/:filename", authenticateUser, (req, res) => {
  const { clientId, filename } = req.params;
  const filePath = path.join(uploadsDir, clientId.toString(), filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }
  
  // Send the file without Content-Disposition header
  // This will cause the browser to display it instead of downloading it
  res.sendFile(filePath);
});

// Add a download endpoint if you don't already have one
app.get("/api/download/:clientId/:filename", authenticateUser, (req, res) => {
  const { clientId, filename } = req.params;
  const filePath = path.join(uploadsDir, clientId.toString(), filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }
  
  // Get original filename from the modified filename (remove timestamp)
  const originalFilename = filename.substring(filename.indexOf('-') + 1).replace(/-/g, ' ');
  
  // Set Content-Disposition header to force download
  res.setHeader('Content-Disposition', `attachment; filename="${originalFilename}"`);
  res.sendFile(filePath);
});

// Obsługa błędów 404
app.use((req, res) => {
  console.log(`404 - Nie znaleziono: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Nie znaleziono' });
});

// Globalny handler błędów
app.use((err, req, res, next) => {
  console.error('Globalny błąd:', err);
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Wystąpił błąd serwera', 
    message: err.message,
    path: req.path
  });
});

// Connect to database and start server
sequelize
  .authenticate()
  .then(() => {
    console.log('Połączenie z bazą danych nawiązane pomyślnie.');
    app.listen(PORT, () => {
      console.log(`Serwer uruchomiony na porcie ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}/api`);
    });
  })
  .catch(err => {
    console.error('Nie można połączyć się z bazą danych:', err);
    console.error('Szczegóły błędu połączenia:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_NAME,
      user: process.env.DB_USER
    });
  });

// Obsługa niezłapanych wyjątków
process.on('uncaughtException', (err) => {
  console.error('Nieobsłużony wyjątek:', err);
  console.error(err.stack);
  // Nie zamykamy serwera, ale logujemy błąd
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Nieobsłużona obietnica rejection:', reason);
  // Nie zamykamy serwera, ale logujemy błąd
});