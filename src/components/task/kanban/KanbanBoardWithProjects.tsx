import { useState, useCallback, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Column from "./Column";
import { Task } from "./types/types";
import api from "../../../utils/axios-config";
import { 
  convertToUIProject, 
  convertStatusToUI, 
  convertStatusToAPI
} from "../../../utils/projectServiceAdapter";

interface KanbanBoardProps {
  onStatusChange?: (taskId: string, newStatus: string) => void;
}

const KanbanBoardWithProjects: React.FC<KanbanBoardProps> = ({ 
  onStatusChange
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Flaga do śledzenia, czy już wykonaliśmy zapytanie
  const [fetchAttempted, setFetchAttempted] = useState(false);

  // Pobierz projekty z API
  const fetchProjects = useCallback(async () => {
    // Jeśli już próbowaliśmy pobierać i wystąpił błąd, nie próbuj ponownie automatycznie
    if (fetchAttempted && error) {
      return;
    }

    try {
      setLoading(true);
      setFetchAttempted(true); // Oznacz, że próbowaliśmy pobierać dane
      
      const response = await api.get('/api/projects');
      const projectsData = response.data.projects || [];
      
      // Konwersja do formatu projektów UI
      const formattedProjects = projectsData.map((project: any) => convertToUIProject(project));
      
      setTasks(formattedProjects);
      setError(null);
    } catch (err: any) {
      console.error("Błąd podczas pobierania projektów:", err);
      
      // Ustawienie błędu
      setError("Nie udało się załadować projektów. Spróbuj ponownie później.");
    } finally {
      setLoading(false);
    }
  }, [error, fetchAttempted]);

  // Pobierz projekty tylko przy pierwszym renderowaniu
  useEffect(() => {
    fetchProjects();
  }, []);  // Pusta tablica zależności - wywołaj tylko raz przy montowaniu

  // Przenoszenie zadań
  const moveTask = useCallback((dragIndex: number, hoverIndex: number) => {
    setTasks((prevTasks) => {
      const newTasks = [...prevTasks];
      const draggedTask = newTasks[dragIndex];
      newTasks.splice(dragIndex, 1);
      newTasks.splice(hoverIndex, 0, draggedTask);
      return newTasks;
    });
  }, []);

  // Zmiana statusu zadania
  const changeTaskStatus = useCallback(async (taskId: string, newStatus: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
    
    // Wywołaj callback, jeśli został przekazany
    if (onStatusChange) {
      onStatusChange(taskId, newStatus);
    } else {
      // Jeśli callback nie został przekazany, aktualizuj status bezpośrednio
      try {
        // Konwersja statusu UI na format API
        const apiStatus = convertStatusToAPI(newStatus);
        
        // Aktualizuj status w API
        await api.patch(`/api/projects/${taskId}/status`, { status: apiStatus });
      } catch (error) {
        console.error("Błąd podczas aktualizacji statusu:", error);
        
        // Ręczne odświeżenie - ale tylko raz
        if (!fetchAttempted) {
          fetchProjects();
        }
      }
    }
  }, [onStatusChange, fetchProjects, fetchAttempted]);

  // Ręczne odświeżanie danych
  const handleRefresh = () => {
    setFetchAttempted(false); // Resetuj flagę, aby umożliwić ponowne pobranie
    setError(null);
    fetchProjects();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="text-red-500 text-center mb-4">{error}</div>
        <button 
          onClick={handleRefresh}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  // Jeśli nie ma żadnych zadań, pokaż komunikat
  if (tasks.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-gray-500 text-center">
          <p className="mb-4 text-lg">Brak projektów do wyświetlenia</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
          >
            Odśwież
          </button>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 border-t border-gray-200 divide-x divide-gray-200 dark:divide-white/[0.05] mt-7 dark:border-white/[0.05] sm:mt-0 sm:grid-cols-2 xl:grid-cols-3">
        <Column
          title="Do zrobienia"
          tasks={tasks.filter((task) => task.status === "todo")}
          status="todo"
          moveTask={moveTask}
          changeTaskStatus={changeTaskStatus}
        />
        <Column
          title="W trakcie"
          tasks={tasks.filter((task) => task.status === "inProgress")}
          status="inProgress"
          moveTask={moveTask}
          changeTaskStatus={changeTaskStatus}
        />
        <Column
          title="Ukończone"
          tasks={tasks.filter((task) => task.status === "completed")}
          status="completed"
          moveTask={moveTask}
          changeTaskStatus={changeTaskStatus}
        />
      </div>
    </DndProvider>
  );
};

export default KanbanBoardWithProjects;