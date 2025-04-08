// utils/userSettings.js
import { API_URL } from './config';

/**
 * Pobiera ustawienia użytkownika z serwera
 * @returns {Promise<Object>} - Ustawienia użytkownika
 */
export const fetchUserSettings = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Brak uwierzytelnienia');
    }
    
    const response = await fetch(`${API_URL}/api/users/settings`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Wystąpił błąd podczas pobierania ustawień');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user settings:', error);
    throw error;
  }
};

/**
 * Aktualizuje ustawienia powiadomień użytkownika
 * @param {Object} settings - Nowe ustawienia powiadomień
 * @returns {Promise<Object>} - Zaktualizowane ustawienia
 */
export const updateNotificationSettings = async (settings) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Brak uwierzytelnienia');
    }
    
    const response = await fetch(`${API_URL}/api/users/notification-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Wystąpił błąd podczas aktualizacji ustawień');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
};

/**
 * Aktualizuje ustawienia prywatności użytkownika
 * @param {Object} settings - Nowe ustawienia prywatności
 * @returns {Promise<Object>} - Zaktualizowane ustawienia
 */
export const updatePrivacySettings = async (settings) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Brak uwierzytelnienia');
    }
    
    const response = await fetch(`${API_URL}/api/users/privacy-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Wystąpił błąd podczas aktualizacji ustawień');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    throw error;
  }
};