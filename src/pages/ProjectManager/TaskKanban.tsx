import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import TaskHeader from "../../components/task/TaskHeader";
import KanbanBoardWithProjects from "../../components/task/kanban/KanbanBoardWithProjects";
import PageMeta from "../../components/common/PageMeta";
import { updateProjectStatus } from "../../services/projectService";
import { convertStatusToAPI } from "../../utils/projectServiceAdapter";
import { useAlert } from "../../context/AlertContext";
import Alert from "../../components/ui/alert/Alert";
import { FilterOptions } from "../../components/task/TaskHeader"; // Import the type

export default function TaskKanban() {
  const { alert, showAlert, hideAlert } = useAlert();
  const [filters, setFilters] = useState<FilterOptions>({
    priority: 'all',
    category: 'all',
    sortBy: 'newest'
  });

  // Handle filter changes from TaskHeader
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    
    // You can show an alert to indicate filter changes if desired
    showAlert({
      type: 'info',
      title: 'Filtry zaktualizowane',
      message: `Zastosowano nowe filtry i sortowanie.`
    });
  };

  // Obsługa zmiany statusu
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      // Konwersja statusu UI do formatu API
      const apiStatus = convertStatusToAPI(newStatus);
      
      // Aktualizacja statusu w API
      await updateProjectStatus(parseInt(taskId), apiStatus);
      
      // Pokaż powiadomienie o sukcesie
      showAlert({
        type: 'success',
        title: 'Status zaktualizowany',
        message: `Status projektu został pomyślnie zmieniony na: ${
          apiStatus === 'todo' ? 'Do zrobienia' : 
          apiStatus === 'in-progress' ? 'W trakcie' : 'Ukończone'
        }`
      });
    } catch (error) {
      console.error("Błąd podczas aktualizacji statusu projektu:", error);
      
      // Pokaż powiadomienie o błędzie
      showAlert({
        type: 'error',
        title: 'Błąd aktualizacji',
        message: "Wystąpił błąd podczas aktualizacji statusu projektu. Spróbuj ponownie."
      });
    }
  };

  // Funkcja pomocnicza dla powiadomień
  const handleNotification = (message: string, type: 'success' | 'error') => {
    showAlert({
      type: type,
      title: type === 'success' ? 'Sukces' : 'Błąd',
      message: message
    });
  };

  return (
    <div>
      <PageMeta
        title="Panel zarządzania projektami | Business Manager"
        description="Zarządzaj projektami przy pomocy tablicy Kanban"
      />
      <PageBreadcrumb pageTitle="Zarządzanie Projektami" />
      
      {/* Wyświetlamy alert, jeśli istnieje */}
      {alert && (
        <div className="mb-4">
          <Alert 
            variant={alert.type}
            title={alert.title}
            message={alert.message}
            showLink={alert.showLink}
            linkHref={alert.linkHref}
            linkText={alert.linkText}
          />
        </div>
      )}
      
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Pass onFilterChange handler to TaskHeader */}
        <TaskHeader onFilterChange={handleFilterChange} />
        <KanbanBoardWithProjects 
          onStatusChange={handleStatusChange} 
          onNotification={handleNotification}
          filters={filters} // Pass filters to KanbanBoard
        />
      </div>
    </div>
  );
}