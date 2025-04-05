// src/utils/axios-config.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor do dodawania tokenu autoryzacyjnego do każdego żądania
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor do obsługi błędów
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Obsługa błędu 401 (nieautoryzowany) - można dodać automatyczne wylogowanie
    if (error.response && error.response.status === 401) {
      console.log('Sesja wygasła lub użytkownik nie jest zalogowany');
      // Możesz tutaj wywołać funkcję wylogowania z kontekstu autoryzacji
      // np. logout();
    }
    return Promise.reject(error);
  }
);

export default api;