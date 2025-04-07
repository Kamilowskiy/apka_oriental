import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Jeśli użytkownik jest już zalogowany, przekieruj go do dashboardu
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      {/* Panel lewy - formularz */}
      <div className="flex flex-col justify-center w-full p-6 md:max-w-md md:p-10">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {subtitle && <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>}
        </div>
        
        {children}
        
        <div className="absolute right-4 bottom-4">
          <ThemeToggleButton />
        </div>
      </div>
      
      {/* Panel prawy - grafika */}
      <div className="hidden md:flex md:flex-1 md:bg-gradient-to-r from-brand-600 to-brand-800">
        <div className="relative flex flex-col items-center justify-center w-full">
          <div className="p-8 text-center">
            <img 
              src="/images/logo/logo-white.png" 
              alt="Logo" 
              className="w-48 h-auto mx-auto mb-6" 
              onError={(e) => {
                // Fallback w przypadku braku obrazu
                e.currentTarget.src = '/images/logo/logo.svg';
              }}
            />
            <h2 className="mb-4 text-3xl font-bold text-white">Business Management Panel</h2>
            <p className="text-white/80">
              Zarządzaj swoją firmą w jednym miejscu - klienci, usługi, hosting i dokumenty
            </p>
          </div>
          
          <div className="absolute bottom-6 left-0 right-0 text-center text-white/50">
            &copy; {new Date().getFullYear()} Oriental Design. Wszelkie prawa zastrzeżone.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;