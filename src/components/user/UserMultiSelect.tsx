import React, { useState, useEffect } from "react";
import api from "../../utils/axios-config";
// import { SelectedUser, User } from "../../types/user"; // Importujemy oba interfejsy

// Props dla komponentu UserMultiSelect
interface UserMultiSelectProps {
  selectedUsers: SelectedUser[];  // Używamy typu SelectedUser[]
  onChange: (users: SelectedUser[]) => void;
  placeholder?: string;
}

// src/types/user.ts

// Interfejs dla użytkownika wybranego w komponencie multiselect
export interface SelectedUser {
    id: string | number;
    name: string;
  }
  
  // Interfejs dla użytkownika z API
  export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role?: string;
    email_verified?: boolean;
    created_at?: string;
    updated_at?: string | null;
  }

// Komponent multiselect do wyboru wielu użytkowników
const UserMultiSelect: React.FC<UserMultiSelectProps> = ({ 
  selectedUsers = [], 
  onChange, 
  placeholder = "Wybierz użytkowników..." 
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Pobierz użytkowników z bazy danych
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/api/users');
        setUsers(response.data || []);
      } catch (error) {
        console.error('Błąd podczas pobierania listy użytkowników:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Obsługa wyszukiwania użytkowników
  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Sprawdź czy użytkownik jest wybrany
  const isUserSelected = (userId: number | string) => {
    return selectedUsers.some(u => u.id === userId);
  };

  // Obsługa wyboru/usunięcia użytkownika
  const handleUserToggle = (user: User) => {
    let newSelectedUsers: SelectedUser[];
    
    if (isUserSelected(user.id)) {
      // Usuń użytkownika z wybranych
      newSelectedUsers = selectedUsers.filter(u => u.id !== user.id);
    } else {
      // Dodaj użytkownika do wybranych
      newSelectedUsers = [...selectedUsers, {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`
      }];
    }
    
    onChange(newSelectedUsers);
  };

  return (
    <div className="relative">
      {/* Pole wyboru */}
      <div 
        className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-2">
          {selectedUsers.length > 0 ? (
            selectedUsers.map(user => (
              <span 
                key={user.id} 
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300"
              >
                {user.name}
                <button 
                  type="button" 
                  className="ml-1 h-3.5 w-3.5 rounded-full text-gray-500 hover:bg-gray-300 hover:text-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Tworzymy obiekt zgodny z interfejsem User na podstawie SelectedUser
                    const userObj: User = {
                      id: typeof user.id === 'string' ? parseInt(user.id) : user.id,
                      first_name: user.name.split(' ')[0] || '',
                      last_name: user.name.split(' ')[1] || '',
                      email: ''
                    };
                    handleUserToggle(userObj);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </span>
            ))
          ) : (
            <span className="text-gray-400 dark:text-gray-500">{placeholder}</span>
          )}
        </div>
      </div>
      
      {/* Ikona strzałki */}
      <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-4 top-1/2 dark:text-gray-400">
        <svg
          className="stroke-current"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
            stroke=""
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      
      {/* Dropdown z listą użytkowników */}
      {isOpen && (
        <div className="absolute z-40 w-full mt-1 max-h-60 overflow-y-auto bg-white dark:bg-gray-900 rounded-md border border-gray-300 dark:border-gray-700 shadow-lg">
          {/* Pole wyszukiwania */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-800">
            <input
              type="text"
              className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Szukaj użytkowników..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Lista użytkowników */}
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Ładowanie użytkowników...
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="py-2">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className={`flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    isUserSelected(user.id) ? 'bg-gray-100 dark:bg-gray-800' : ''
                  }`}
                  onClick={() => handleUserToggle(user)}
                >
                  <input
                    type="checkbox"
                    className="mr-3 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    checked={isUserSelected(user.id)}
                    readOnly
                  />
                  <div>
                    <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.first_name} {user.last_name}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Nie znaleziono użytkowników
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserMultiSelect;