import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";

const LayoutContent: React.FC = () => {
  // Pobierz stan paska bocznego z useSidebar, a nie z useAuth
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  
  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Przekierowanie do strony logowania, jeśli użytkownik nie jest zalogowany
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/signin", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Podczas ładowania, pokazujemy wskaźnik ładowania
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Jeśli użytkownik nie jest zalogowany, nie renderujemy zawartości
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;