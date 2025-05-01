import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import api from "../../../utils/axios-config";
import TaskHeader from "../../../components/task/TaskHeader";
import TaskLane from "../../../components/task/task-list/TaskLane";
import Button from "../../../components/ui/button/Button";

// Typ zadania z istniejącego komponentu TaskList
interface Task {
  id: string;
  title: string;
  isChecked: boolean;
  dueDate: string;
  commentCount: number;
  category?: string;
  userAvatar: string;
  status: string;
  toggleChecked: () => void;
}

// Typ zadania projektu z API
interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  assigned_to?: string;
  estimated_hours?: number;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
}

interface Project {
  id: number;
  service_name: string;
  client?: {
    company_name: string;
  };
  description?: string;
  price?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
}

export default function ProjectTaskList() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [formattedTasks, setFormattedTasks] = useState<Task[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  // Definiujemy lanes tak samo jak w TaskList
  const lanes = ["todo", "in-progress", "completed"];
  
  // Pobierz projekt i jego zadania
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        
        // Pobierz dane projektu
        const projectResponse = await api.get(`/api/projects/${projectId}`);
        setProject(projectResponse.data);
        
        // Pobierz zadania projektu
        const tasksResponse = await api.get(`/api/project-tasks/project/${projectId}`);
        setProjectTasks(tasksResponse.data.tasks || []);
        
        setError(null);
      } catch (err: any) {
        console.error("Błąd podczas pobierania danych projektu:", err);
        setError(err.response?.data?.error || "Wystąpił błąd podczas pobierania danych projektu");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  // Konwertuj zadania projektu na format kompatybilny z TaskList
  useEffect(() => {
    const tasks = projectTasks.map(task => ({
      id: task.id,
      title: task.title,
      isChecked: task.status === 'completed',
      dueDate: task.due_date ? new Date(task.due_date).toLocaleDateString('pl-PL') : "Brak terminu",
      commentCount: 0,
      category: task.priority === 'high' ? "Wysoki" 
               : task.priority === 'medium' ? "Średni" 
               : task.priority === 'low' ? "Niski" : undefined,
      userAvatar: "/images/user/user-01.jpg", // Domyślny avatar
      status: task.status,
      toggleChecked: () => toggleChecked(task.id)
    }));

    setFormattedTasks(tasks);
  }, [projectTasks]);

  // Zmiana statusu zadania jako zakończone lub nie
  const toggleChecked = async (taskId: string) => {
    const task = projectTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    
    try {
      await api.patch(`/api/project-tasks/${taskId}/status`, { status: newStatus });
      
      // Aktualizuj lokalny stan
      setProjectTasks(prev => prev.map(t => 
        t.id === taskId ? {...t, status: newStatus} : t
      ));
      
    } catch (error) {
      console.error("Błąd podczas aktualizacji statusu zadania:", error);
    }
  };

  // Obsługa przeciągania - z komponentu TaskList
  const handleDragStart = (
    _: React.DragEvent<HTMLDivElement>,
    taskId: string
  ) => {
    setDragging(taskId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, status: string) => {
    e.preventDefault();
    if (dragging === null) return;

    try {
      // Aktualizuj status w API
      await api.patch(`/api/project-tasks/${dragging}/status`, { status });
      
      // Aktualizuj lokalny stan projektTasks
      setProjectTasks(prev => prev.map(task => 
        task.id === dragging ? {...task, status} : task
      ));
      
      // Aktualizuj lokalny stan formattedTasks podobnie jak w TaskList
      const updatedTasks = formattedTasks.map((task) =>
        task.id === dragging ? { ...task, status, isChecked: status === 'completed' } : task
      );

      // Sortowanie zadań w ramach tego samego statusu
      const statusTasks = updatedTasks.filter((task) => task.status === status);
      const otherTasks = updatedTasks.filter((task) => task.status !== status);

      const dropY = e.clientY;
      const droppedIndex = statusTasks.findIndex((task) => {
        const taskElement = document.getElementById(`task-${task.id}`);
        if (!taskElement) return false;
        const rect = taskElement.getBoundingClientRect();
        const taskMiddleY = rect.top + rect.height / 2;
        return dropY < taskMiddleY;
      });

      if (droppedIndex !== -1) {
        const draggedTask = statusTasks.find((task) => task.id === dragging);
        if (draggedTask) {
          statusTasks.splice(statusTasks.indexOf(draggedTask), 1);
          statusTasks.splice(droppedIndex, 0, draggedTask);
        }
      }

      setFormattedTasks([...otherTasks, ...statusTasks]);
      setDragging(null);
      
    } catch (error) {
      console.error("Błąd podczas aktualizacji statusu zadania:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => navigate('/projects')}>
          Powrót do listy projektów
        </Button>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-500 mb-4">Nie znaleziono projektu</p>
        <Button onClick={() => navigate('/projects')}>
          Powrót do listy projektów
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageMeta
        title={`Zadania projektu: ${project.service_name} | Business Manager`}
        description="Zarządzaj zadaniami projektu"
      />
      <div className="flex justify-between items-center mb-4">
        <PageBreadcrumb pageTitle={`Zadania projektu: ${project.service_name}`} />
        <Button onClick={() => navigate('/projects')}>
          ← Powrót do projektów
        </Button>
      </div>
      
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <TaskHeader />

        <div className="p-4 space-y-8 border-t border-gray-200 mt-7 dark:border-gray-800 sm:mt-0 xl:p-6">
          {lanes.map((lane) => (
            <TaskLane
              key={lane}
              lane={lane}
              tasks={formattedTasks.filter((task) => task.status === lane)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, lane)}
              onDragStart={handleDragStart}
            />
          ))}
        </div>
      </div>
    </div>
  );
}