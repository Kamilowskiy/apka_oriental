// Dodaj poniższy hook do pliku src/hooks/useDropdown.ts (lub utwórz ten plik jeśli nie istnieje)

import { useState, useRef, useEffect } from 'react';

/**
 * Hook dla lepszego zarządzania dropdownami
 * @param initialState Początkowy stan dropdowna (otwarty/zamknięty)
 * @returns Dane i funkcje do zarządzania dropdownem
 */
export const useDropdown = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // Otwiera dropdown
  const openDropdown = () => setIsOpen(true);
  
  // Zamyka dropdown
  const closeDropdown = () => setIsOpen(false);
  
  // Przełącza stan dropdowna
  const toggleDropdown = () => setIsOpen(prevState => !prevState);

  // Obsługa kliknięcia poza dropdownem
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen &&
          dropdownRef.current && 
          !dropdownRef.current.contains(event.target as Node) &&
          toggleButtonRef.current && 
          !toggleButtonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Obsługa naciśnięcia klawisza Escape
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    // Dodaj nasłuchiwanie na wydarzenia
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    // Funkcja czyszcząca
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  return {
    isOpen,
    openDropdown,
    closeDropdown,
    toggleDropdown,
    dropdownRef,
    toggleButtonRef
  };
};

export default useDropdown;