import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Komponent ProtectedRoute zapewnia, że tylko zalogowani użytkownicy
 * mają dostęp do określonych tras. Niezalogowani użytkownicy są 
 * przekierowywani do strony logowania z parametrem lokalizacji,
 * co umożliwia powrót do zamierzonej strony po zalogowaniu.
 */
const ProtectedRoute = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Zapisujemy próbę uzyskania dostępu w session storage
  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/signin' && location.pathname !== '/signup') {
      sessionStorage.setItem('intendedRoute', location.pathname);
    }
  }, [isAuthenticated, location]);

  // Jeśli użytkownik nie jest zalogowany, przekieruj go do strony logowania
  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Jeśli użytkownik jest zalogowany, kontynuuj renderowanie chronionej trasy
  return <Outlet />;
};

export default ProtectedRoute;