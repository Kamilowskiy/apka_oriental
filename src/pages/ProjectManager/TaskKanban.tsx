import { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import TaskHeader from "../../components/task/TaskHeader";
import KanbanBoardWithProjects from "../../components/task/kanban/KanbanBoardWithProjects";
import PageMeta from "../../components/common/PageMeta";
import { updateProjectStatus } from "../../services/projectService";
import { convertStatusToAPI } from "../../utils/projectServiceAdapter";

export default function TaskKanban() {
  const [notification, setNotification] = useState<{ 
    text: string; 
    type: 'success' | 'error' 
  } | null>(null);

  // Obsługa zmiany statusu
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      // Konwersja statusu UI do formatu API
      const apiStatus = convertStatusToAPI(newStatus);
      
      // Aktualizacja statusu w API
      await updateProjectStatus(parseInt(taskId), apiStatus);
      
      // Pokaż powiadomienie o sukcesie
      showNotification(`Status projektu został pomyślnie zaktualizowany na: ${apiStatus}`, 'success');
    } catch (error) {
      console.error("Błąd podczas aktualizacji statusu projektu:", error);
      
      // Pokaż powiadomienie o błędzie
      showNotification("Wystąpił błąd podczas aktualizacji statusu projektu", 'error');
    }
  };

  // Funkcja pomocnicza do wyświetlania powiadomień
  const showNotification = (text: string, type: 'success' | 'error') => {
    setNotification({ text, type });
    
    // Ukryj powiadomienie po 3 sekundach
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  return (
    <div>
      <PageMeta
        title="Panel zarządzania projektami | Business Manager"
        description="Zarządzaj projektami przy pomocy tablicy Kanban"
      />
      <PageBreadcrumb pageTitle="Zarządzanie Projektami" />
      
      {/* Powiadomienie o aktualizacji statusu lub innych operacjach */}
      {notification && (
        <div className={`mb-4 p-4 rounded-lg ${
          notification.type === 'success' 
            ? 'bg-green-100 text-green-700 dark:bg-green-800/20 dark:text-green-400' 
            : 'bg-red-100 text-red-700 dark:bg-red-800/20 dark:text-red-400'
        }`}>
          {notification.text}
        </div>
      )}
      
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <TaskHeader />
        <KanbanBoardWithProjects 
          onStatusChange={handleStatusChange} 
          onNotification={showNotification}
        />
      </div>
    </div>
  );
}