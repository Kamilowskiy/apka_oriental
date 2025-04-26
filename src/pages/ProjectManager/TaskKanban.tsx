import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import TaskHeader from "../../components/task/TaskHeader";
import KanbanBoard from "../../components/task/kanban/KanbanBoard";
import PageMeta from "../../components/common/PageMeta";
import { getAllProjects, updateProjectStatus } from "../../services/projectService";
import { Task } from "../../components/task/kanban/types/types";
import axios from "axios";

export default function TaskKanban() {
  const [projects, setProjects] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        // Ponieważ projectService.js jest nowy, używamy bezpośrednio Axios
        const response = await axios.get('http://localhost:5000/api/services');
        const projectsData = response.data.services || [];
        
        // Konwersja danych z API do formatu wymaganego przez komponent KanbanBoard
        const formattedProjects = projectsData.map((project: any) => ({
          id: project.id.toString(),
          title: project.service_name,
          dueDate: formatDate(project.end_date),
          comments: Math.floor(Math.random() * 5), // Losowa liczba komentarzy na potrzeby demo
          assignee: getUserAvatar(project.assigned_to),
          status: convertStatus(project.status || 'todo'),
          projectDesc: project.description || "",
          priority: project.priority || 'medium',
          estimatedHours: project.estimated_hours,
          tags: project.tags,
          price: parseFloat(project.price) || 0,
          category: { 
            name: project.category || "Development", 
            color: getCategoryColor(project.category || "")
          }
        }));
        
        setProjects(formattedProjects);
      } catch (err) {
        console.error("Błąd podczas pobierania projektów:", err);
        setError("Nie udało się załadować projektów. Spróbuj ponownie później.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Funkcja pomocnicza do formatowania dat
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "Brak terminu";
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return "Dzisiaj";
    if (date.toDateString() === tomorrow.toDateString()) return "Jutro";
    
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Funkcja pomocnicza do określania avatara na podstawie imienia
  const getUserAvatar = (name: string | null): string => {
    if (!name) return "/images/user/user-01.jpg";
    
    // Proste mapowanie imion do avatarów
    const nameMap: Record<string, string> = {
      "Kamil Pagacz": "/images/user/user-01.jpg",
      "Marek Nowak": "/images/user/user-02.jpg",
      "Anna Kowalska": "/images/user/user-03.jpg",
      "Piotr Wiśniewski": "/images/user/user-04.jpg"
    };
    
    return nameMap[name] || "/images/user/user-05.jpg";
  };

  // Funkcja pomocnicza do konwersji statusu z API do formatu komponentu
  const convertStatus = (status: string): string => {
    if (status === 'in-progress') return 'inProgress';
    return status;
  };

  // Funkcja pomocnicza do określania koloru kategorii
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case "Development":
        return "brand";
      case "Design":
        return "orange";
      case "Marketing":
        return "success";
      case "E-commerce":
        return "purple";
      default:
        return "default";
    }
  };

  // Obsługa zmiany statusu
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      // Konwersja statusu komponentu z powrotem do formatu API
      let apiStatus = newStatus;
      if (newStatus === 'inProgress') apiStatus = 'in-progress';
      
      // Aktualizacja statusu w API
      await axios.put(`http://localhost:5000/api/services/${taskId}`, { 
        status: apiStatus 
      });
      
      // Status zostanie zaktualizowany w UI przez komponent KanbanBoard
    } catch (error) {
      console.error("Błąd podczas aktualizacji statusu zadania:", error);
      // Tutaj można dodać obsługę błędów/powiadomień
    }
  };

  return (
    <div>
      <PageMeta
        title="Panel projektów | Business Manager"
        description="Przeglądaj i zarządzaj swoimi projektami w widoku tablicy Kanban"
      />
      <PageBreadcrumb pageTitle="Projekty" />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <TaskHeader />
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
          </div>
        )}
        
        {error && (
          <div className="flex justify-center items-center h-64">
            <div className="text-red-500 text-center">{error}</div>
          </div>
        )}
        
        {!loading && !error && (
          <KanbanBoard 
            initialTasks={projects} 
            onStatusChange={handleStatusChange}
          />
        )}
      </div>
    </div>
  );
}