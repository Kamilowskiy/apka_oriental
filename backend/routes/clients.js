const express = require("express");
const router = express.Router();
const Client = require("../models/Client");

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

module.exports = router;
