// Utwórz ten plik jako src/utils/api.js lub podobnej lokalizacji
import axios from 'axios';

// Konfiguracja bazowa dla axios
const api = axios.create({
  baseURL: 'http://localhost:5000', // Dostosuj do adresu Twojego backendu
  headers: {
    'Content-Type': 'application/json',
  }
});

export default api;