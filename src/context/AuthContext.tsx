import React, { createContext, useContext, useState, useEffect } from "react";

// Define user type
interface User {
  id: number;
  email: string;
  username?: string;
  first_name: string;
  last_name: string;
  role: "user" | "admin";
}

// Define context type
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);

  // Sprawdzenie, czy użytkownik jest zalogowany przy ładowaniu aplikacji
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem("authToken");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        try {
          const userData = JSON.parse(storedUser) as User;
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Błąd parsowania danych użytkownika:", error);
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
        }
      }

      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Funkcja do logowania
  const login = (token: string, userData: User) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Funkcja do wylogowania
  const logout = async (): Promise<void> => {
    // Możesz tutaj dodać wywołanie API do wylogowania na backendzie
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
    
    // Opcjonalnie, możemy zrobić przekierowanie do strony logowania, ale to lepiej obsłużyć w komponencie
    return Promise.resolve();
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};