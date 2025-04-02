const express = require("express");
const cors = require("cors");
const sequelize = require("./config/database");
const clientsRoutes = require("./routes/clients");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/clients", clientsRoutes);

const PORT = process.env.PORT || 5000;

// Połączenie z bazą danych
sequelize.sync().then(() => {
  console.log("Połączono z bazą danych");
  app.listen(PORT, () => console.log(`Serwer działa na porcie ${PORT}`));
});
