import { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Link } from "react-router-dom";
import api from "../../utils/axios-config";
import { useNavigate } from "react-router-dom";

// Type definitions for notifications
interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'project' | 'task' | 'client' | 'system';
  read: boolean;
  created_at: string;
  entity_id?: number; // ID of related project, task, or client
  user_avatar?: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load notifications when component mounts
    fetchNotifications();
    
    // Set up polling to check for new notifications
    const interval = setInterval(() => {
      checkNewNotifications();
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  // Fetch all notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      
      // For now, we'll create mock notifications
      // In production, you would fetch from your API
      // const response = await api.get('/api/notifications');
      // const notificationsData = response.data;
      
      const mockNotifications = generateMockNotifications();
      setNotifications(mockNotifications);
      
      // Check if there are unread notifications
      const hasUnread = mockNotifications.some(notification => !notification.read);
      setNotifying(hasUnread);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setIsLoading(false);
    }
  };

  // Check for new notifications (this would call your API in production)
  const checkNewNotifications = async () => {
    try {
      // In production, you would fetch only new notifications since last check
      // const response = await api.get('/api/notifications/new');
      // const newNotificationsCount = response.data.count;
      
      // For demo purposes, randomly add a new notification sometimes
      if (Math.random() > 0.7) {
        const newMockNotification = {
          id: Date.now(),
          title: "New Task Assigned",
          message: "You have been assigned to a new task",
          type: 'task' as const,
          read: false,
          created_at: new Date().toISOString(),
          entity_id: Math.floor(Math.random() * 10) + 1,
          user_avatar: `/images/user/user-0${Math.floor(Math.random() * 5) + 1}.jpg`
        };
        
        setNotifications(prev => [newMockNotification, ...prev]);
        setNotifying(true);
      }
    } catch (error) {
      console.error("Error checking for new notifications:", error);
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
    
    // Generate 8 mock notifications
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

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // In production, you would call your API
      // await api.post('/api/notifications/mark-all-read');
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setNotifying(false);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // Mark a single notification as read
  const markAsRead = async (id: number) => {
    try {
      // In production, you would call your API
      // await api.post(`/api/notifications/${id}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Check if there are still unread notifications
      const hasUnread = notifications.some(notification => 
        notification.id !== id && !notification.read
      );
      setNotifying(hasUnread);
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    closeDropdown();
    
    // Navigate based on notification type
    if (notification.entity_id) {
      switch (notification.type) {
        case 'project':
          navigate(`/projects/${notification.entity_id}`);
          break;
        case 'task':
          navigate(`/project-tasks/${notification.entity_id}`);
          break;
        case 'client':
          navigate(`/clients/${notification.entity_id}`);
          break;
        default:
          // For system notifications, just stay on the current page
          break;
      }
    }
  };

  function toggleDropdown() {
    setIsOpen(!isOpen);
    
    // When opening dropdown, mark notifications as seen (but not necessarily read)
    if (!isOpen) {
      // In a real implementation, you might want to distinguish between
      // "seen" (dropdown opened) and "read" (notification clicked)
    }
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleClick = () => {
    toggleDropdown();
  };
  
  // Format relative time (e.g., "5 min ago", "2 hours ago")
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours} hr ago`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };
  
  // Get category text based on notification type
  const getCategoryText = (type: string) => {
    switch (type) {
      case 'project':
        return 'Project';
      case 'task':
        return 'Task';
      case 'client':
        return 'Client';
      case 'system':
        return 'System';
      default:
        return 'Notification';
    }
  };
  
  // Get status dot color based on notification type
  const getStatusDotColor = (type: string) => {
    switch (type) {
      case 'project':
        return 'bg-brand-500';
      case 'task':
        return 'bg-success-500';
      case 'client':
        return 'bg-warning-500';
      case 'system':
        return 'bg-error-500';
      default:
        return 'bg-success-500';
    }
  };

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
            !notifying ? "hidden" : "flex"
          }`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Powiadomienia
          </h5>
          <div className="flex items-center gap-2">
            {notifying && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Oznacz wszystkie jako przeczytane
              </button>
            )}
            <button
              onClick={closeDropdown}
              className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-t-4 border-gray-200 rounded-full border-t-brand-500 animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <svg
              className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">Nie masz powiadomień</p>
          </div>
        ) : (
          <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <DropdownItem
                  onItemClick={() => handleNotificationClick(notification)}
                  className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
                    !notification.read ? 'bg-gray-50 dark:bg-white/[0.02]' : ''
                  }`}
                >
                  <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
                    <img
                      width={40}
                      height={40}
                      src={notification.user_avatar || "/images/user/user-01.jpg"}
                      alt="User"
                      className="w-full overflow-hidden rounded-full"
                    />
                    <span className={`absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white ${getStatusDotColor(notification.type)} dark:border-gray-900`}></span>
                  </span>

                  <span className="block w-full">
                    <span className="mb-1.5 block text-theme-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {notification.title}
                      </span>
                      <span className="block mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                        {notification.message}
                      </span>
                    </span>

                    <span className="flex items-center justify-between gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                      <span className="flex items-center gap-2">
                        <span>{getCategoryText(notification.type)}</span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        <span>{formatRelativeTime(notification.created_at)}</span>
                      </span>
                      
                      {!notification.read && (
                        <span className="px-2 py-0.5 text-xs font-medium text-brand-500 bg-brand-50 rounded-full dark:bg-brand-500/10 dark:text-brand-400">
                          Nowe
                        </span>
                      )}
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))}
          </ul>
        )}
        
        <Link
          to="/notifications"
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          onClick={closeDropdown}
        >
          Zobacz wszystkie powiadomienia
        </Link>
      </Dropdown>
    </div>
  );
}