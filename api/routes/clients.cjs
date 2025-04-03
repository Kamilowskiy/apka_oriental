const express = require("express");
const router = express.Router();
const Client = require("../../api/models/Client.cjs");
const { Route } = require("react-router");

// Pobieranie wszystkich klientów
router.get("/", async (req, res) => {
  try {
    const clients = await Client.findAll();
    res.json(clients);
  } catch (error) {
    console.error("Błąd pobierania klientów:", error);
    res.status(500).json({ error: "Błąd pobierania klientów" });
  }
});

// Usuwanie klienta
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const client = await Client.findByPk(id);

    if (!client) {
      return res.status(404).json({ error: "Klient nie istnieje" });
    }

    await client.destroy();
    res.status(200).json({ message: "Klient usunięty" });
  } catch (error) {
    console.error("Błąd usuwania klienta:", error);
    res.status(500).json({ error: "Błąd usuwania klienta" });
  }
});

// Dodawanie nowego klienta
router.post("/", async (req, res) => {
  try {
    const {
      company_name,
      nip,
      address,
      contact_first_name,
      contact_last_name,
      contact_phone,
      email,
    } = req.body;

    // Walidacja danych (np. czy wymagane pola nie są puste)
    if (!company_name || !nip || !address || !contact_first_name || !contact_last_name || !contact_phone || !email) {
      return res.status(400).json({ error: "Wszystkie pola są wymagane" });
    }

    // Tworzenie nowego klienta w bazie
    const newClient = await Client.create({
      company_name,
      nip,
      address,
      contact_first_name,
      contact_last_name,
      contact_phone,
      email,
    });

    res.status(201).json(newClient); // Zwracamy nowego klienta
  } catch (error) {
    console.error("Błąd dodawania klienta:", error);
    res.status(500).json({ error: "Błąd dodawania klienta" });
  }
});


// Aktualizacja danych klienta
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const client = await Client.findByPk(id);
    
    if (!client) {
      return res.status(404).json({ error: "Klient nie istnieje" });
    }
    
    const {
      company_name,
      nip,
      address,
      contact_first_name,
      contact_last_name,
      contact_phone,
      email,
    } = req.body;
    
    // Walidacja danych (np. czy wymagane pola nie są puste)
    if (!company_name || !nip || !address || !contact_first_name || !contact_last_name || !contact_phone || !email) {
      return res.status(400).json({ error: "Wszystkie pola są wymagane" });
    }
    
    // Aktualizacja danych klienta
    await client.update({
      company_name,
      nip,
      address,
      contact_first_name,
      contact_last_name,
      contact_phone,
      email,
    });
    
    // Pobieranie zaktualizowanego klienta
    const updatedClient = await Client.findByPk(id);
    
    res.status(200).json(updatedClient);
  } catch (error) {
    console.error("Błąd aktualizacji klienta:", error);
    res.status(500).json({ error: "Błąd aktualizacji klienta" });
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

// Endpoint to delete a client's folder when client is deleted
router.delete("/api/client-folder/:clientId", (req, res) => {
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
module.exports = router;
