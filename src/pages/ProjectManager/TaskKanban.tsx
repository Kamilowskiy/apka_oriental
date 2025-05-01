import { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import TaskHeader from "../../components/task/TaskHeader";
import KanbanBoardWithProjects from "../../components/task/kanban/KanbanBoardWithProjects";
// Import zostanie dodany po utworzeniu pliku
// import KanbanBoardWithMockData from "../../components/task/kanban/KanbanBoardWithMockData";
import PageMeta from "../../components/common/PageMeta";
import { updateProjectStatus } from "../../services/projectService";
import { convertStatusToAPI } from "../../utils/projectServiceAdapter";

export default function TaskKanban() {
  const [updateMessage, setUpdateMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  
  // Dane demonstracyjne dla przypadku, gdy nie mamy dostępu do API
  const mockTasks = [
    {
      id: "1",
      title: "Redesign strony głównej",
      dueDate: "Jutro",
      comments: 3,
      assignee: "/images/user/user-01.jpg",
      status: "todo",
      projectDesc: "Kompletny redesign strony głównej z nową identyfikacją wizualną",
      priority: "high" as const,
      estimatedHours: 40,
      tags: "design,frontend,responsive",
      price: 7500,
      category: { 
        name: "Design", 
        color: "orange"
      }
    },
    {
      id: "2",
      title: "Integracja e-commerce",
      dueDate: "20 sty 2025",
      comments: 5,
      assignee: "/images/user/user-03.jpg",
      status: "todo",
      projectDesc: "Implementacja bramki płatności i funkcjonalności koszyka",
      priority: "medium" as const,
      estimatedHours: 35,
      tags: "backend,payment,security",
      price: 8200,
      category: { 
        name: "Development", 
        color: "brand"
      }
    },
    {
      id: "3",
      title: "Rozwój aplikacji mobilnej",
      dueDate: "15 lut 2025",
      comments: 2,
      assignee: "/images/user/user-04.jpg",
      status: "inProgress",
      projectDesc: "Stworzenie wersji iOS i Android naszej głównej aplikacji",
      priority: "high" as const,
      estimatedHours: 120,
      tags: "mobile,ios,android",
      price: 25000,
      category: { 
        name: "Development", 
        color: "brand"
      }
    },
    {
      id: "4",
      title: "Optymalizacja SEO",
      dueDate: "Dzisiaj",
      comments: 1,
      assignee: "/images/user/user-02.jpg",
      status: "inProgress",
      projectDesc: "Poprawa pozycji w wyszukiwarkach i wdrożenie analityki",
      priority: "medium" as const,
      estimatedHours: 20,
      tags: "marketing,analytics,seo",
      price: 3500,
      category: { 
        name: "Marketing", 
        color: "success"
      }
    },
    {
      id: "5",
      title: "Strategia contentu",
      dueDate: "10 sty 2025",
      comments: 4,
      assignee: "/images/user/user-03.jpg",
      status: "completed",
      projectDesc: "Opracowanie kompleksowego planu treści na następny kwartał",
      priority: "low" as const,
      estimatedHours: 15,
      tags: "content,strategy,planning",
      price: 2800,
      category: { 
        name: "Marketing", 
        color: "success"
      }
    },
    {
      id: "6",
      title: "Migracja bazy danych",
      dueDate: "5 sty 2025",
      comments: 7,
      assignee: "/images/user/user-04.jpg",
      status: "completed",
      projectDesc: "Migracja z MySQL do PostgreSQL bez przestojów",
      priority: "high" as const,
      estimatedHours: 30,
      tags: "database,backend,migration",
      price: 6200,
      category: { 
        name: "Development", 
        color: "brand"
      }
    }
  ];

  // Obsługa zmiany statusu
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      // Jeśli używamy danych demonstracyjnych, tylko pokazujemy komunikat
      if (useMockData) {
        const apiStatus = convertStatusToAPI(newStatus);
        setUpdateMessage({ 
          text: `Status projektu zaktualizowany na: ${apiStatus} (tryb demo)`, 
          type: 'success' 
        });
        
        setTimeout(() => {
          setUpdateMessage(null);
        }, 3000);
        return;
      }
      
      // Konwersja statusu UI do formatu API
      const apiStatus = convertStatusToAPI(newStatus);
      
      // Aktualizacja statusu w API
      await updateProjectStatus(parseInt(taskId), apiStatus);
      
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

  // Obsługa błędów API - przełączanie na dane demonstracyjne
  const handleApiError = () => {
    setUseMockData(true);
  };

  return (
    <div>
      <PageMeta
        title="Panel zarządzania projektami | Business Manager"
        description="Zarządzaj projektami przy pomocy tablicy Kanban"
      />
      <PageBreadcrumb pageTitle="Projekty Kanban" />
      
      {/* Przełącznik trybu */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setUseMockData(!useMockData)}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
        >
          {useMockData ? "Spróbuj trybu API" : "Użyj danych demonstracyjnych"}
        </button>
      </div>
      
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
        {useMockData ? (
          // Jeśli używamy danych demonstracyjnych, przekazujemy je bezpośrednio do komponentu
          <KanbanBoardWithProjects 
            initialTasks={mockTasks}
            onStatusChange={handleStatusChange} 
          />
        ) : (
          // W przeciwnym razie próbujemy pobrać dane z API
          <KanbanBoardWithProjects 
            onStatusChange={handleStatusChange} 
          />
        )}
      </div>
    </div>
  );
}