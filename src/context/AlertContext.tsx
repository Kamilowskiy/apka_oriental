import React, { createContext, useContext, useState, ReactNode } from 'react';

// Definiujemy typy alertów
export type AlertType = 'success' | 'error' | 'warning' | 'info';

// Interfejs alertu
export interface AlertInfo {
  type: AlertType;
  title: string;
  message: string;
  showLink?: boolean;
  linkHref?: string;
  linkText?: string;
}

// Interfejs kontekstu alertów
interface AlertContextType {
  alert: AlertInfo | null;
  showAlert: (alertInfo: AlertInfo, autoHideTime?: number) => void;
  hideAlert: () => void;
}

// Tworzymy kontekst
const AlertContext = createContext<AlertContextType | undefined>(undefined);

// Hook do używania alertów
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

// Provider komponent
export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alert, setAlert] = useState<AlertInfo | null>(null);
  
  // Pokaż alert
  const showAlert = (alertInfo: AlertInfo, autoHideTime: number = 3000) => {
    setAlert(alertInfo);
    
    // Auto-hide alert after specified time
    if (autoHideTime > 0) {
      setTimeout(() => {
        setAlert(null);
      }, autoHideTime);
    }
  };
  
  // Ukryj alert
  const hideAlert = () => {
    setAlert(null);
  };
  
  return (
    <AlertContext.Provider value={{ alert, showAlert, hideAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export default AlertContext;