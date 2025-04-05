// import React from 'react';
// import { Navigate, Outlet, useLocation } from 'react-router-dom';
// import { useAuth } from './AuthContext';

// interface ProtectedRouteProps {
//   requiredRole?: 'admin' | 'user';
// }

// const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
//   const { isAuthenticated, user, loading } = useAuth();
//   const location = useLocation();

//   // Jeśli autentykacja jest w trakcie ładowania, pokazujemy spinner
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center w-full h-screen">
//         <div className="w-12 h-12 border-4 border-t-4 border-gray-200 rounded-full border-t-brand-500 animate-spin"></div>
//       </div>
//     );
//   }

//   // Jeśli użytkownik nie jest zalogowany, przekieruj go do strony logowania
//   if (!isAuthenticated) {
//     return <Navigate to="/signin" state={{ from: location }} replace />;
//   }

//   // Jeśli wymagana jest rola i użytkownik jej nie posiada, przekieruj do strony głównej
//   if (requiredRole && user?.role !== requiredRole) {
//     return <Navigate to="/" replace />;
//   }

//   // Jeśli wszystkie warunki są spełnione, renderuj zawartość chronionej ścieżki
//   return <Outlet />;
// };

// export default ProtectedRoute;