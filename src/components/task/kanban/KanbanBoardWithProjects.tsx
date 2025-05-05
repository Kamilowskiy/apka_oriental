// src/components/task/kanban/KanbanBoardWithProjects.tsx
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
import { deleteProject } from "../../../services/projectService";

interface KanbanBoardProps {
  onStatusChange?: (taskId: string, newStatus: string) => void;
  onNotification?: (message: string, type: 'success' | 'error') => void;
}

const KanbanBoardWithProjects: React.FC<KanbanBoardProps> = ({ 
  onStatusChange,
  onNotification
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
  }, [fetchProjects]);

  // Przenoszenie zadań w obrębie kolumny (zmiana kolejności)
  const moveTask = useCallback((dragIndex: number, hoverIndex: number, status: string) => {
    setTasks((prevTasks) => {
      // Znajdź wszystkie zadania w danej kolumnie
      const columnTasks = prevTasks.filter(task => task.status === status);
      // Znajdź wszystkie zadania z innych kolumn
      const otherTasks = prevTasks.filter(task => task.status !== status);
      
      // Przenieś zadanie w obrębie kolumny
      const draggedTask = columnTasks[dragIndex];
      
      // Utwórz nową tablicę zadań dla kolumny, usuwając przeciągane zadanie
      const newColumnTasks = [...columnTasks];
      newColumnTasks.splice(dragIndex, 1);
      
      // Wstaw zadanie na nową pozycję
      newColumnTasks.splice(hoverIndex, 0, draggedTask);
      
      // Zwróć połączone tablice
      return [...otherTasks, ...newColumnTasks];
    });
  }, []);

  // Zmiana statusu zadania (przeniesienie do innej kolumny)
  const changeTaskStatus = useCallback(async (taskId: string, newStatus: string, targetIndex = -1) => {
    setTasks((prevTasks) => {
      const taskToUpdate = prevTasks.find(task => task.id === taskId);
      
      if (!taskToUpdate) {
        return prevTasks;
      }
      
      // Znajdź wszystkie zadania z docelowej kolumny
      const targetColumnTasks = prevTasks.filter(task => task.status === newStatus);
      // Znajdź wszystkie pozostałe zadania
      const otherTasks = prevTasks.filter(task => task.id !== taskId);
      
      // Zaktualizuj status zadania
      const updatedTask = { ...taskToUpdate, status: newStatus };
      
      // Jeśli targetIndex nie jest określony lub jest nieprawidłowy, dodaj na koniec
      if (targetIndex < 0 || targetIndex > targetColumnTasks.length) {
        return [...otherTasks, updatedTask];
      }
      
      // Wstaw zadanie na określonej pozycji w docelowej kolumnie
      const result = [...otherTasks];
      
      // Znajdź indeks, gdzie wstawić zadanie - na początku kolumny docelowej
      let insertionIndex = 0;
      
      // Jeśli w kolumnie docelowej są już zadania, znajdź właściwy indeks
      if (targetColumnTasks.length > 0) {
        // Znajdź indeks pierwszego zadania z kolumny docelowej
        const firstTaskIndex = result.findIndex(task => task.status === newStatus);
        
        if (firstTaskIndex !== -1) {
          // Wstaw na określonej pozycji wewnątrz kolumny
          insertionIndex = firstTaskIndex + targetIndex;
        }
      }
      
      // Wstaw zadanie na określonej pozycji
      result.splice(insertionIndex, 0, updatedTask);
      
      return result;
    });
    
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
        
        // Wyświetl powiadomienie o sukcesie
        if (onNotification) {
          onNotification(`Status projektu został zmieniony na "${newStatus}"`, 'success');
        }
      } catch (error) {
        console.error("Błąd podczas aktualizacji statusu:", error);
        
        // Wyświetl powiadomienie o błędzie
        if (onNotification) {
          onNotification("Wystąpił błąd podczas aktualizacji statusu projektu", 'error');
        }
        
        // Ręczne odświeżenie - ale tylko raz
        if (!fetchAttempted) {
          fetchProjects();
        }
      }
    }
  }, [onStatusChange, fetchProjects, fetchAttempted, onNotification]);

  // Obsługa przeciągnięcia do pustej kolumny
  const handleDropInColumn = useCallback((taskId: string, columnStatus: string) => {
    changeTaskStatus(taskId, columnStatus);
  }, [changeTaskStatus]);

  // Funkcja do usuwania projektu
  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
      // Usunięcie projektu z API
      await deleteProject(parseInt(projectId));
      
      // Usunięcie projektu z lokalnego stanu
      setTasks(prevTasks => prevTasks.filter(task => task.id !== projectId));
      
      // Wyświetl powiadomienie
      if (onNotification) {
        onNotification('Projekt został pomyślnie usunięty', 'success');
      }
    } catch (error) {
      console.error('Błąd podczas usuwania projektu:', error);
      
      // Wyświetl powiadomienie o błędzie
      if (onNotification) {
        onNotification('Wystąpił błąd podczas usuwania projektu', 'error');
      }
    }
  }, [onNotification]);

  // Ręczne odświeżanie danych
  const handleRefresh = () => {
    setFetchAttempted(false); // Resetuj flagę, aby umożliwić ponowne pobranie
    setError(null);
    fetchProjects();
    
    // Wyświetl powiadomienie
    if (onNotification) {
      onNotification('Lista projektów została odświeżona', 'success');
    }
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
          onDropInColumn={handleDropInColumn}
          onDeleteProject={handleDeleteProject}
          onProjectUpdate={handleRefresh}
        />
        <Column
          title="W trakcie"
          tasks={tasks.filter((task) => task.status === "inProgress")}
          status="inProgress"
          moveTask={moveTask}
          changeTaskStatus={changeTaskStatus}
          onDropInColumn={handleDropInColumn}
          onDeleteProject={handleDeleteProject}
          onProjectUpdate={handleRefresh}
        />
        <Column
          title="Ukończone"
          tasks={tasks.filter((task) => task.status === "completed")}
          status="completed"
          moveTask={moveTask}
          changeTaskStatus={changeTaskStatus}
          onDropInColumn={handleDropInColumn}
          onDeleteProject={handleDeleteProject}
          onProjectUpdate={handleRefresh}
        />
      </div>
    </DndProvider>
  );
};

export default KanbanBoardWithProjects;