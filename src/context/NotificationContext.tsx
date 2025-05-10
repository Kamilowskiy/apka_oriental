import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  user_avatar?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  hasUnread: boolean;
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
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    fetchNotifications();
    
    // Sprawdź powiadomienia co 1 minutę
    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Calculate if there are unread notifications
  useEffect(() => {
    const unreadExists = notifications.some(notification => !notification.read);
    setHasUnread(unreadExists);
  }, [notifications]);

  // Fetch all notifications
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications');
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Mark a notification as read
  const markAsRead = async (id: number) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        hasUnread,
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