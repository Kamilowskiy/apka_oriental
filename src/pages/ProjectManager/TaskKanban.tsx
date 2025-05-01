import { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import TaskHeader from "../../components/task/TaskHeader";
import KanbanBoardWithProjects from "../../components/task/kanban/KanbanBoardWithProjects";
import PageMeta from "../../components/common/PageMeta";
import api from "../../utils/axios-config";
import { convertStatusToAPI } from "../../utils/projectServiceAdapter";

export default function TaskKanban() {
  const [updateMessage, setUpdateMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Obsługa zmiany statusu
  // Obsługa zmiany statusu
const handleStatusChange = async (taskId: string, newStatus: string) => {
  try {
    // Konwersja statusu komponentu do formatu API
    const apiStatus = convertStatusToAPI(newStatus);
    
    // Aktualizacja statusu w API
    await api.put(`/api/services/${taskId}`, { status: apiStatus });
    
    // Pokaż powiadomienie o sukcesie
    setUpdateMessage({ 
      text: `Status projektu został pomyślnie zaktualizowany na: ${apiStatus}`, 
      type: 'success' 
    });
    
    // Ukryj powiadomienie po 3 sekundach
    setTimeout(() => {
      setUpdateMessage(null);
    }, 3000);
  } catch (error) {
    console.error("Błąd podczas aktualizacji statusu projektu:", error);
    
    // Pokaż powiadomienie o błędzie
    setUpdateMessage({ 
      text: "Wystąpił błąd podczas aktualizacji statusu projektu", 
      type: 'error' 
    });
    
    // Ukryj powiadomienie po 3 sekundach
    setTimeout(() => {
      setUpdateMessage(null);
    }, 3000);
  }
};

  return (
    <div>
      <PageMeta
        title="Panel zarządzania projektami | Business Manager"
        description="Zarządzaj projektami przy pomocy tablicy Kanban"
      />
      <PageBreadcrumb pageTitle="Projekty Kanban" />
      
      {/* Powiadomienie o aktualizacji statusu */}
      {updateMessage && (
        <div className={`mb-4 p-4 rounded-lg ${
          updateMessage.type === 'success' 
            ? 'bg-green-100 text-green-700 dark:bg-green-800/20 dark:text-green-400' 
            : 'bg-red-100 text-red-700 dark:bg-red-800/20 dark:text-red-400'
        }`}>
          {updateMessage.text}
        </div>
      )}
      
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <TaskHeader />
        <KanbanBoardWithProjects onStatusChange={handleStatusChange} />
      </div>
    </div>
  );
}