// src/context/NotificationContext.tsx (aktualizacja)
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '../utils/axios-config';

// Type definitions
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'project' | 'task' | 'client' | 'system';
  read: boolean;
  created_at: string;
  entity_id?: number;
  entity_type?: string;
  user_avatar?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  hasUnread: boolean;
  unreadCount: number;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasUnread, setHasUnread] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Funkcja do pobierania powiadomień
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get('/api/notifications');
      const fetchedNotifications = response.data || [];
      setNotifications(fetchedNotifications);
      
      // Oblicz liczbę nieprzeczytanych powiadomień
      const unreadNotifications = fetchedNotifications.filter((n: Notification) => !n.read);
      setUnreadCount(unreadNotifications.length);
      setHasUnread(unreadNotifications.length > 0);
      
      // Ustaw flagę inicjalizacji
      if (!isInitialized) {
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [isInitialized]);

  // Pobierz powiadomienia przy starcie
  useEffect(() => {
    fetchNotifications();
    
    // Sprawdzaj powiadomienia co 1 minutę
    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Funkcja oznaczająca powiadomienie jako przeczytane
  const markAsRead = async (id: number) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      
      // Aktualizacja lokalnego stanu
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Aktualizacja licznika nieprzeczytanych
      setUnreadCount(prev => {
        const newCount = Math.max(0, prev - 1);
        setHasUnread(newCount > 0);
        return newCount;
      });
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
    }
  };

  // Funkcja oznaczająca wszystkie powiadomienia jako przeczytane
  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      
      // Aktualizacja lokalnego stanu
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Zerowanie licznika nieprzeczytanych
      setUnreadCount(0);
      setHasUnread(false);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        hasUnread,
        unreadCount,
        markAsRead,
        markAllAsRead,
        fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;