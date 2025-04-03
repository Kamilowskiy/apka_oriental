const express = require("express");
const cors = require("cors");
const sequelize = require("./api/config/database.cjs");
const clientsRoutes = require("./api/routes/clients.cjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const hostingRoutes = require("./api/routes/hosting.cjs");
// In server.cjs, after requiring database but before sync
const { Client, Hosting } = require('./api/models/associations.cjs');


require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

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

// Modified clients routes to handle file uploads
app.use("/api/clients", clientsRoutes);

// NEW ENDPOINT: Get files for a specific client
app.get("/api/client-files/:clientId", (req, res) => {
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
app.post("/api/upload/:clientId", upload.single("file"), (req, res) => {
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

// We'll need to modify the client creation process to handle file uploads
// This endpoint will be used to upload files for a new client
// The client ID will be determined after client creation
app.post("/api/upload-temp", upload.single("file"), (req, res) => {
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
app.post("/api/move-file", (req, res) => {
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
app.delete("/api/client-files/:clientId/:filename", (req, res) => {
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


app.delete("/:id", async (req, res) => {
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
app.delete("/api/client-folder/:clientId", (req, res) => {
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

app.use("/api/hosting", hostingRoutes);


// Connect to database and start server
sequelize.sync().then(() => {
  console.log("Connected to database");
  app.listen(5000, () => console.log(`Server running on port 5000`));
});