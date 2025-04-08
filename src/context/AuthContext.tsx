// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';

// Define the User interface based on the database schema
interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'user' | 'admin';
  email_verified: boolean;
  created_at: string;
  updated_at: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: async () => {},
  updateUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const initAuth = async () => {
      // Sprawdź czy token istnieje w localStorage (Zapamiętaj mnie) lub sessionStorage
      const savedToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      if (savedToken) {
        try {
          // Fetch user data with the token
          const response = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              Authorization: `Bearer ${savedToken}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setToken(savedToken);
          } else {
            // Invalid token, clear storage
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            // Dodatkowo wyczyść informacje o "Zapamiętaj mnie" jeśli token jest nieważny
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('rememberedEmail');
          }
        } catch (error) {
          console.error('Error during auth initialization:', error);
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('authToken');
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('rememberedEmail');
        }
      }
      
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  // Login user
  const login = (newToken: string, userData: User) => {
    // Token jest już zapisywany w localStorage lub sessionStorage w komponencie formularza
    // w zależności od opcji "Zapamiętaj mnie"
    setToken(newToken);
    setUser(userData);
  };

  // Logout user
  const logout = async (): Promise<void> => {
    try {
      // Call logout API if needed
      if (token) {
        await fetch('http://localhost:5000/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear storage and state
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      // Opcjonalnie: Jeśli chcemy całkowicie wyczyścić "Zapamiętaj mnie"
      // localStorage.removeItem('rememberMe');
      // localStorage.removeItem('rememberedEmail');
      
      // Jeśli chcemy zachować zapamiętany email dla następnego logowania,
      // usuwamy tylko token ale zostawiamy rememberMe i rememberedEmail
      
      setUser(null);
      setToken(null);
    }
  };

  // Update user data
  const updateUser = (userData: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      return { ...prev, ...userData };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};