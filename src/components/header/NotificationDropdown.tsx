import { useState, useEffect, useRef } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Link, useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, hasUnread, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [animateNotif, setAnimateNotif] = useState(false);
  const prevUnreadCountRef = useRef(0);
  const navigate = useNavigate();

  // Sprawdzaj czy pojawiły się nowe powiadomienia i animuj kropkę
  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.read).length;
    
    if (unreadCount > prevUnreadCountRef.current && !isOpen) {
      setAnimateNotif(true);
      
      // Zatrzymaj animację po 3 sekundach
      const timer = setTimeout(() => {
        setAnimateNotif(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
    
    prevUnreadCountRef.current = unreadCount;
  }, [notifications, isOpen]);

  // Obsługa przycisku powiadomień
  const handleClick = () => {
    toggleDropdown();
    
    // Gdy otwieramy dropdown, odświeżamy powiadomienia
    if (!isOpen) {
      refreshNotifications();
      setAnimateNotif(false);
    }
  };

  // Odświeżanie powiadomień
  const refreshNotifications = async () => {
    setIsLoading(true);
    await fetchNotifications();
    setIsLoading(false);
  };

  // Przełączanie dropdownu
  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  // Zamykanie dropdownu
  function closeDropdown() {
    setIsOpen(false);
  }

  // Obsługa kliknięcia powiadomienia
  const handleNotificationClick = async (id: number, entityId?: number, type?: string) => {
    await markAsRead(id);
    closeDropdown();
    
    // Nawigacja w zależności od typu powiadomienia
    if (entityId) {
      switch (type) {
        case 'project':
          navigate(`/projects/${entityId}`);
          break;
        case 'task':
          navigate(`/project-tasks/${entityId}`);
          break;
        case 'client':
          navigate(`/clients/${entityId}`);
          break;
        default:
          // Dla powiadomień systemowych nie nawigujemy
          break;
      }
    }
  };
  
  // Formatowanie względnego czasu
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) {
      return 'Przed chwilą';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} min temu`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours} godz. temu`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      return `${days} ${days === 1 ? 'dzień' : 'dni'} temu`;
    }
  };
  
  // Pobieranie tekstu kategorii
  const getCategoryText = (type: string) => {
    switch (type) {
      case 'project':
        return 'Projekt';
      case 'task':
        return 'Zadanie';
      case 'client':
        return 'Klient';
      case 'system':
        return 'System';
      default:
        return 'Powiadomienie';
    }
  };
  
  // Pobieranie koloru kropki statusu
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

  // Zwraca ikonę dla odpowiedniego typu powiadomienia
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'project':
        return (
          <div className="flex items-center justify-center w-10 h-10 bg-brand-100 rounded-full dark:bg-brand-900/20">
            <svg className="w-5 h-5 text-brand-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 17L12 22L22 17M2 12L12 17L22 12M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'task':
        return (
          <div className="flex items-center justify-center w-10 h-10 bg-success-100 rounded-full dark:bg-success-900/20">
            <svg className="w-5 h-5 text-success-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 11L12 14L22 4M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'client':
        return (
          <div className="flex items-center justify-center w-10 h-10 bg-warning-100 rounded-full dark:bg-warning-900/20">
            <svg className="w-5 h-5 text-warning-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'system':
      default:
        return (
          <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full dark:bg-gray-800">
            <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.3246 4.31732C10.751 2.5609 13.249 2.5609 13.6754 4.31732C13.9508 5.45422 15.2507 5.99622 16.2478 5.38968C17.7913 4.44547 19.5539 6.2081 18.6097 7.75163C18.0032 8.74872 18.5452 10.0487 19.6821 10.324C21.4391 10.7504 21.4391 13.2484 19.6821 13.6748C18.5452 13.9502 18.0032 15.2501 18.6097 16.2472C19.5539 17.7907 17.7913 19.5533 16.2478 18.6091C15.2507 18.0026 13.9508 18.5446 13.6754 19.6815C13.249 21.4385 10.751 21.4385 10.3246 19.6815C10.0492 18.5446 8.74932 18.0026 7.75223 18.6091C6.2087 19.5533 4.44607 17.7907 5.39028 16.2472C5.99681 15.2501 5.45481 13.9502 4.31791 13.6748C2.56149 13.2484 2.56149 10.7504 4.31791 10.324C5.45481 10.0487 5.99681 8.74872 5.39028 7.75163C4.44607 6.2081 6.2087 4.44547 7.75223 5.38968C8.74932 5.99622 10.0492 5.45422 10.3246 4.31732Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-red-500 ${
            !hasUnread ? "hidden" : animateNotif ? "flex scale-125" : "flex"
          } transition-all duration-300`}
        >
          {animateNotif && <span className="absolute inline-flex w-full h-full bg-red-500 rounded-full opacity-75 animate-ping"></span>}
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
            {hasUnread && (
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
            {notifications.slice(0, 5).map((notification) => (
              <li key={notification.id}>
                <DropdownItem
                  onItemClick={() => handleNotificationClick(notification.id, notification.entity_id, notification.type)}
                  className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
                    !notification.read ? 'bg-gray-50 dark:bg-white/[0.02]' : ''
                  }`}
                >
                  {getNotificationIcon(notification.type)}

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