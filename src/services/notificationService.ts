import api from '../utils/axios-config';
import { Notification } from '../context/NotificationContext';

/**
 * Serwis do zarządzania powiadomieniami - łączy się z API
 */
class NotificationService {
  /**
   * Pobieranie wszystkich powiadomień dla bieżącego użytkownika
   */
  async getAll(): Promise<Notification[]> {
    try {
      const response = await api.get('/api/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }
  
  /**
   * Pobieranie nieprzeczytanych powiadomień
   */
  async getUnread(): Promise<Notification[]> {
    try {
      const response = await api.get('/api/notifications/unread');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }
  }
  
  /**
   * Pobieranie liczby nieprzeczytanych powiadomień
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/api/notifications/unread/count');
      return response.data.count;
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
      throw error;
    }
  }
  
  /**
   * Oznaczanie powiadomienia jako przeczytane
   */
  async markAsRead(id: number): Promise<void> {
    try {
      await api.put(`/api/notifications/${id}/read`);
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      throw error;
    }
  }
  
  /**
   * Oznaczanie wszystkich powiadomień jako przeczytane
   */
  async markAllAsRead(): Promise<void> {
    try {
      await api.put('/api/notifications/read-all');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
  
  /**
   * Usuwanie powiadomienia
   */
  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/api/notifications/${id}`);
    } catch (error) {
      console.error(`Error deleting notification ${id}:`, error);
      throw error;
    }
  }
}

// Eksportowanie instancji singletona
const notificationService = new NotificationService();
export default notificationService;