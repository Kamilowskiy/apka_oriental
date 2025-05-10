import React, { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import PageMeta from '../components/common/PageMeta';
import { useNavigate } from 'react-router-dom';

const NotificationsPage = () => {
  const { notifications, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    await fetchNotifications();
    setIsLoading(false);
  };

  // Filtrowanie powiadomień na podstawie aktywnej zakładki
  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(notification => !notification.read);

  // Obsługa kliknięcia powiadomienia
  const handleNotificationClick = async (id: number, entityId?: number, type?: string) => {
    await markAsRead(id);
    
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
        // Dla powiadomień systemowych, pozostajemy na stronie
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

  // Formatowanie pełnej daty
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pobieranie ikony na podstawie typu powiadomienia
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
    <>
      <PageMeta
        title="Powiadomienia | Panel zarządzania"
        description="Wszystkie powiadomienia systemowe"
      />
      
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Powiadomienia</h2>
        
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center rounded-md border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'all'
                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50'
              } rounded-l-md`}
              onClick={() => setActiveTab('all')}
            >
              Wszystkie
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'unread'
                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50'
              } rounded-r-md`}
              onClick={() => setActiveTab('unread')}
            >
              Nieprzeczytane
            </button>
          </div>
          
          {notifications.some(n => !n.read) && (
            <button
              onClick={() => markAllAsRead()}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Oznacz wszystkie jako przeczytane
            </button>
          )}
          
          <button
            onClick={loadNotifications}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Odśwież
          </button>
        </div>
      </div>
      
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-t-4 border-gray-200 rounded-full border-t-brand-500 animate-spin"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
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
            <p className="text-lg text-gray-500 dark:text-gray-400">
              {activeTab === 'all' ? 'Brak powiadomień' : 'Brak nieprzeczytanych powiadomień'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`cursor-pointer flex items-start gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  !notification.read ? 'bg-gray-50 dark:bg-gray-800/30' : ''
                }`}
                onClick={() => handleNotificationClick(notification.id, notification.entity_id, notification.type)}
              >
                {/* Ikona */}
                {getNotificationIcon(notification.type)}
                
                {/* Treść */}
                <div className="flex-grow">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-gray-800 dark:text-white mb-1">
                      {notification.title}
                      {!notification.read && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium text-brand-500 bg-brand-50 rounded-full dark:bg-brand-900/20 dark:text-brand-400">
                          Nowe
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">{notification.message}</p>
                  <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="capitalize">{notification.type}</span>
                    <span className="mx-1">•</span>
                    <span>{formatDate(notification.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationsPage;