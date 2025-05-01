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
  initialTasks?: Task[];
  onStatusChange?: (taskId: string, newStatus: string) => void;
}

const KanbanBoardWithProjects: React.FC<KanbanBoardProps> = ({ 
  initialTasks = [],
  onStatusChange 
}) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [loading, setLoading] = useState(initialTasks.length === 0);
  const [error, setError] = useState<string | null>(null);

  // Pobierz projekty z API
  const fetchProjects = useCallback(async () => {
    if (initialTasks.length > 0) {
      setTasks(initialTasks);
      return;
    }

    try {
      setLoading(true);
      // Używamy API z projects zamiast services dla spójności
      const response = await api.get('/api/projects');
      const projectsData = response.data.projects || [];
      
      // Konwersja do formatu projektów UI
      const formattedProjects = projectsData.map((project: any) => convertToUIProject(project));
      
      setTasks(formattedProjects);
      setError(null);
    } catch (err) {
      console.error("Błąd podczas pobierania projektów:", err);
      setError("Nie udało się załadować projektów. Spróbuj ponownie później.");
    } finally {
      setLoading(false);
    }
  }, [initialTasks]);

  // Pobierz projekty przy inicjalizacji
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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
        await api.put(`/api/projects/${taskId}/status`, { status: apiStatus });
      } catch (error) {
        console.error("Błąd podczas aktualizacji statusu:", error);
        // Przywróć poprzedni stan w przypadku błędu
        fetchProjects();
      }
    }
  }, [onStatusChange, fetchProjects]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-red-500 text-center">{error}</div>
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