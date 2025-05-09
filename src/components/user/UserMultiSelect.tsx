// src/components/user/UserMultiSelect.tsx
import React, { useState, useRef, useEffect } from 'react';
import api from '../../utils/axios-config';

// Interface dla użytkownika z API
interface ApiUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

// Interface dla wybranego użytkownika
export interface SelectedUser {
  id: number | string;
  name: string;
}

interface UserMultiSelectProps {
  selectedUsers: SelectedUser[];
  onChange: (users: SelectedUser[]) => void;
  placeholder?: string;
}

const UserMultiSelect: React.FC<UserMultiSelectProps> = ({ 
  selectedUsers, 
  onChange, 
  placeholder = 'Wybierz użytkowników...' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Pobieranie użytkowników z API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Pobierz użytkowników z nowego endpointu
        const response = await api.get('/api/users/all');
        
        if (Array.isArray(response.data)) {
          setUsers(response.data);
        } else {
          setUsers([]);
          console.error('Nieoczekiwany format danych z API:', response.data);
        }
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError('Nie udało się pobrać listy użytkowników');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Obsługa kliknięcia poza komponentem
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Skup się na polu wyszukiwania po otwarciu dropdown
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Funkcja sprawdzająca, czy użytkownik jest już wybrany
  const isUserSelected = (userId: number): boolean => {
    return selectedUsers.some(selected => Number(selected.id) === userId);
  };

  // Obsługa dodawania użytkownika
  const handleAddUser = (user: ApiUser) => {
    // Sprawdź czy użytkownik nie jest już wybrany
    if (isUserSelected(user.id)) {
      return;
    }
    
    // Dodaj użytkownika do wybranych
    onChange([
      ...selectedUsers, 
      { 
        id: user.id, 
        name: `${user.first_name} ${user.last_name}` 
      }
    ]);
    
    setSearchText('');
    setIsOpen(false);
  };

  // Obsługa usuwania użytkownika
  const handleRemoveUser = (userId: number | string) => {
    onChange(selectedUsers.filter(user => user.id !== userId));
  };

  // Filtrowanie użytkowników na podstawie wyszukiwania
  const filteredUsers = users.filter(user => {
    // Nie pokazuj już wybranych użytkowników
    if (isUserSelected(user.id)) {
      return false;
    }
    
    // Filtruj po wyszukiwanym tekście
    if (searchText) {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const email = user.email.toLowerCase();
      const search = searchText.toLowerCase();
      
      return fullName.includes(search) || email.includes(search);
    }
    
    // Jeśli nie ma tekstu wyszukiwania, pokaż wszystkich użytkowników
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Pole wyboru */}
      <div 
        className="dark:bg-dark-900 min-h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-2">
          {selectedUsers.length === 0 ? (
            <span className="text-gray-400 dark:text-gray-500 py-1">{placeholder}</span>
          ) : (
            selectedUsers.map(user => (
              <div 
                key={user.id} 
                className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
              >
                <span>{user.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveUser(user.id);
                  }}
                  className="text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {/* Pole wyszukiwania */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white/90"
                placeholder="Szukaj użytkownika..."
              />
              {searchText && (
                <button
                  onClick={() => setSearchText('')}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Lista użytkowników */}
          <div className="py-1">
            {loading ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin mr-2"></div>
                Ładowanie użytkowników...
              </div>
            ) : error ? (
              <div className="px-4 py-3 text-sm text-red-500 dark:text-red-400">
                {error}
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleAddUser(user)}
                >
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-300 flex items-center justify-center mr-2">
                    {user.first_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700 dark:text-white/80">
                      {user.first_name} {user.last_name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {searchText 
                  ? `Brak wyników dla "${searchText}"` 
                  : users.length === 0 
                    ? 'Brak użytkowników w systemie'
                    : 'Wszyscy użytkownicy zostali już wybrani'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMultiSelect;