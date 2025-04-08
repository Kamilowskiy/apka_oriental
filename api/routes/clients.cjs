// Fix for api/routes/clients.cjs
const express = require("express");
const router = express.Router();
const Client = require("../../api/models/Client.cjs");
const fs = require("fs");
const path = require("path");

// Pobieranie wszystkich klientów dla zalogowanego użytkownika
router.get("/", async (req, res) => {
  try {
    // Pobierz ID zalogowanego użytkownika z tokenu JWT
    const userId = req.user.id;
    
    // Pobierz tylko klientów przypisanych do zalogowanego użytkownika
    const clients = await Client.findAll({
      where: { user_id: userId }
    });
    
    res.json(clients);
  } catch (error) {
    console.error("Błąd pobierania klientów:", error);
    res.status(500).json({ error: "Błąd pobierania klientów" });
  }
});

// Pobieranie jednego klienta po ID
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    
    const client = await Client.findOne({
      where: { 
        id: id,
        user_id: userId
      }
    });
    
    if (!client) {
      return res.status(404).json({ error: "Klient nie istnieje lub nie masz do niego dostępu" });
    }
    
    res.json(client);
  } catch (error) {
    console.error("Błąd pobierania klienta:", error);
    res.status(500).json({ error: "Błąd pobierania klienta" });
  }
});

// Usuwanie klienta
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    
    // Pobierz klienta i sprawdź, czy należy do zalogowanego użytkownika
    const client = await Client.findOne({
      where: { 
        id: id,
        user_id: userId
      }
    });

    if (!client) {
      return res.status(404).json({ error: "Klient nie istnieje lub nie masz do niego dostępu" });
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

    // Walidacja danych
    if (!company_name || !nip || !address || !contact_first_name || !contact_last_name || !contact_phone || !email) {
      return res.status(400).json({ error: "Wszystkie pola są wymagane" });
    }

    // Dodajemy ID zalogowanego użytkownika
    const user_id = req.user.id;

    // Tworzenie nowego klienta w bazie
    const newClient = await Client.create({
      company_name,
      nip,
      address,
      contact_first_name,
      contact_last_name,
      contact_phone,
      email,
      user_id,
      created_at: new Date()
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
    const userId = req.user.id;
    
    // Sprawdź, czy klient należy do zalogowanego użytkownika
    const client = await Client.findOne({
      where: { 
        id: id,
        user_id: userId
      }
    });
    
    if (!client) {
      return res.status(404).json({ error: "Klient nie istnieje lub nie masz do niego dostępu" });
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
    
    // Walidacja danych
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
      updated_at: new Date()
    });
    
    // Pobieranie zaktualizowanego klienta
    const updatedClient = await Client.findByPk(id);
    
    res.status(200).json(updatedClient);
  } catch (error) {
    console.error("Błąd aktualizacji klienta:", error);
    res.status(500).json({ error: "Błąd aktualizacji klienta" });
  }
});

// Funkcja pomocnicza do usuwania katalogów
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

// Endpoint do usuwania folderu klienta
router.delete("/folder/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const userId = req.user.id;
    
    // Sprawdź, czy klient należy do zalogowanego użytkownika
    const client = await Client.findOne({
      where: { 
        id: clientId,
        user_id: userId
      }
    });
    
    if (!client) {
      return res.status(404).json({ error: "Klient nie istnieje lub nie masz do niego dostępu" });
    }
    
    // Ścieżka do katalogu klienta
    const uploadsDir = path.join(__dirname, "../../uploads");
    const clientDir = path.join(uploadsDir, clientId.toString());
    
    if (!fs.existsSync(clientDir)) {
      return res.json({ message: "Folder does not exist or already deleted" });
    }
    
    deleteDirectory(clientDir);
    res.json({ message: "Client folder deleted successfully" });
  } catch (error) {
    console.error("Error deleting client folder:", error);
    res.status(500).json({ error: "Failed to delete client folder", details: error.message });
  }
});

module.exports = router;