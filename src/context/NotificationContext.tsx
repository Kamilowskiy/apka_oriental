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
  addNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => Promise<void>;
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
    
    // Poll for new notifications every minute
    const interval = setInterval(() => {
      checkNewNotifications();
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
      // In production, this would be an API call
      // const response = await api.get('/api/notifications');
      // const data = response.data;
      
      // For now, we'll use mock data
      const mockNotifications = generateMockNotifications();
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Check for new notifications
  const checkNewNotifications = async () => {
    try {
      // In production, this would be an API call
      // const response = await api.get('/api/notifications/new');
      // const newNotifications = response.data;
      
      // For demo purposes, occasionally add a new notification
      if (Math.random() > 0.7) {
        const newNotification: Notification = {
          id: Date.now(),
          title: 'New Update',
          message: 'Something important has been updated',
          type: 'system',
          read: false,
          created_at: new Date().toISOString(),
          entity_id: Math.floor(Math.random() * 10) + 1
        };
        
        setNotifications(prev => [newNotification, ...prev]);
      }
    } catch (error) {
      console.error('Error checking for new notifications:', error);
    }
  };

  // Add a new notification
  const addNotification = async (notification: Omit<Notification, 'id' | 'created_at'>) => {
    try {
      // In production, this would be an API call
      // const response = await api.post('/api/notifications', notification);
      // const newNotification = response.data;
      
      // For now, we'll create a notification locally
      const newNotification: Notification = {
        ...notification,
        id: Date.now(),
        created_at: new Date().toISOString()
      };
      
      setNotifications(prev => [newNotification, ...prev]);
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  // Mark a notification as read
  const markAsRead = async (id: number) => {
    try {
      // In production, this would be an API call
      // await api.put(`/api/notifications/${id}/read`);
      
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
      // In production, this would be an API call
      // await api.put('/api/notifications/read-all');
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Generate mock notifications for development
  const generateMockNotifications = (): Notification[] => {
    const projectNames = [
      "Website Redesign", 
      "Mobile App Development", 
      "E-commerce Platform", 
      "Marketing Dashboard", 
      "Client Portal"
    ];
    
    const types: ('project' | 'task' | 'client' | 'system')[] = ['project', 'task', 'client', 'system'];
    const mockData: Notification[] = [];
    
    // Generate mock notifications
    for (let i = 0; i < 8; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const isRead = Math.random() > 0.3; // 30% chance of being unread
      const createdAt = new Date();
      createdAt.setMinutes(createdAt.getMinutes() - (i * 15)); // Each notification is 15 minutes apart
      
      const projectName = projectNames[Math.floor(Math.random() * projectNames.length)];
      
      let title, message;
      
      switch (type) {
        case 'project':
          title = "Project Update";
          message = `Project ${projectName} has been updated`;
          break;
        case 'task':
          title = "Task Assigned";
          message = `You have been assigned to a new task in ${projectName}`;
          break;
        case 'client':
          title = "New Client";
          message = "A new client has been added to the system";
          break;
        case 'system':
          title = "System Notification";
          message = "The system has been updated successfully";
          break;
      }
      
      mockData.push({
        id: i + 1,
        title,
        message,
        type,
        read: isRead,
        created_at: createdAt.toISOString(),
        entity_id: Math.floor(Math.random() * 10) + 1,
        user_avatar: `/images/user/user-0${Math.floor(Math.random() * 5) + 1}.jpg`
      });
    }
    
    return mockData;
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        hasUnread,
        addNotification,
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