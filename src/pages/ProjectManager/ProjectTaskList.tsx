import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Modal from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import api from "../../utils/axios-config";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, openModal, closeModal } = useModal();
  
  // Stan dla nowego zadania
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assigned_to: '',
    estimated_hours: '',
    due_date: ''
  });

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
        setTasks(tasksResponse.data.tasks || []);
        
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

  // Obsługa zmiany stanu nowego zadania
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTask({ ...newTask, [name]: value });
  };

  // Obsługa zmiany opisu zadania
  const handleDescriptionChange = (value: string) => {
    setNewTask({ ...newTask, description: value });
  };

  // Dodaj nowe zadanie
  const handleAddTask = async () => {
    try {
      if (!newTask.title) {
        alert("Tytuł zadania jest wymagany");
        return;
      }

      const taskData = {
        ...newTask,
        project_id: projectId,
        estimated_hours: newTask.estimated_hours ? parseInt(newTask.estimated_hours) : null
      };

      const response = await api.post('/api/project-tasks', taskData);
      
      // Dodaj nowe zadanie do listy
      setTasks([response.data, ...tasks]);
      
      // Zresetuj formularz i zamknij modal
      setNewTask({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        assigned_to: '',
        estimated_hours: '',
        due_date: ''
      });
      closeModal();
      
    } catch (error) {
      console.error('Błąd podczas dodawania zadania:', error);
      alert('Wystąpił błąd podczas dodawania zadania');
    }
  };

  // Zmiana statusu zadania
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await api.patch(`/api/project-tasks/${taskId}/status`, { status: newStatus });
      
      // Aktualizuj lokalną listę zadań
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus as 'todo' | 'in-progress' | 'completed' } : task
      ));
      
    } catch (error) {
      console.error('Błąd podczas aktualizacji statusu zadania:', error);
      alert('Wystąpił błąd podczas aktualizacji statusu zadania');
    }
  };

  // Usuwanie zadania
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć to zadanie?')) {
      return;
    }
    
    try {
      await api.delete(`/api/project-tasks/${taskId}`);
      
      // Usuń zadanie z listy
      setTasks(tasks.filter(task => task.id !== taskId));
      
    } catch (error) {
      console.error('Błąd podczas usuwania zadania:', error);
      alert('Wystąpił błąd podczas usuwania zadania');
    }
  };

  // Funkcja pomocnicza - formatowanie daty
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  // Funkcja pomocnicza - kolor priorytetu
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400';
      case 'medium': return 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400';
    }
  };

  // Funkcja pomocnicza - tłumaczenie statusu
  const translateStatus = (status: string) => {
    switch (status) {
      case 'todo': return 'Do zrobienia';
      case 'in-progress': return 'W trakcie';
      case 'completed': return 'Ukończone';
      default: return status;
    }
  };

  // Funkcja pomocnicza - tłumaczenie priorytetu
  const translatePriority = (priority: string) => {
    switch (priority) {
      case 'high': return 'Wysoki';
      case 'medium': return 'Średni';
      case 'low': return 'Niski';
      default: return priority;
    }
  };

  // Funkcja pomocnicza - kolor statusu
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400';
      case 'in-progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400';
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400';
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
      <div className="flex justify-between items-center mb-6">
        <PageBreadcrumb pageTitle={`Zadania projektu: ${project.service_name}`} />
        <Button onClick={() => navigate('/projects')}>
          ← Powrót do projektów
        </Button>
      </div>
      
      {/* Informacje o projekcie */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{project.service_name}</h2>
            {project.client && (
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Klient: <span className="font-medium">{project.client.company_name}</span>
              </p>
            )}
            <div className="flex flex-wrap gap-2 mb-2">
              {project.status && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                  {translateStatus(project.status)}
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
                {project.price ? `${project.price.toLocaleString('pl-PL')} PLN` : 'Brak ceny'}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end mt-4 md:mt-0">
            <div className="flex gap-2">
              <span className="text-gray-600 dark:text-gray-300">Start:</span>
              <span className="font-medium">{formatDate(project.start_date)}</span>
            </div>
            {project.end_date && (
              <div className="flex gap-2">
                <span className="text-gray-600 dark:text-gray-300">Koniec:</span>
                <span className="font-medium">{formatDate(project.end_date)}</span>
              </div>
            )}
          </div>
        </div>
        {project.description && (
          <div className="mt-4 border-t pt-4 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Opis projektu</h3>
            <p className="text-gray-600 dark:text-gray-300">{project.description}</p>
          </div>
        )}
      </div>
      
      {/* Dodaj nowe zadanie */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Lista zadań</h3>
        <Button onClick={openModal}>
          Dodaj zadanie
          <svg
            className="fill-current"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9.2502 4.99951C9.2502 4.5853 9.58599 4.24951 10.0002 4.24951C10.4144 4.24951 10.7502 4.5853 10.7502 4.99951V9.24971H15.0006C15.4148 9.24971 15.7506 9.5855 15.7506 9.99971C15.7506 10.4139 15.4148 10.7497 15.0006 10.7497H10.7502V15.0001C10.7502 15.4143 10.4144 15.7501 10.0002 15.7501C9.58599 15.7501 9.2502 15.4143 9.2502 15.0001V10.7497H5C4.58579 10.7497 4.25 10.4139 4.25 9.99971C4.25 9.5855 4.58579 9.24971 5 9.24971H9.2502V4.99951Z"
              fill=""
            />
          </svg>
        </Button>
      </div>
      
      {/* Lista zadań */}
      {tasks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center">
          <p className="text-gray-500 dark:text-gray-400">Brak zadań dla tego projektu</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map(task => (
            <div 
              key={task.id} 
              className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-l-4 border-l-brand-500"
            >
              <div className="flex flex-col md:flex-row justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-2">{task.title}</h4>
                  {task.description && (
                    <p className="text-gray-600 dark:text-gray-300 mb-3">{task.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(task.status)}`}>
                      {translateStatus(task.status)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${getPriorityColor(task.priority)}`}>
                      {translatePriority(task.priority)}
                    </span>
                    {task.assigned_to && (
                      <span className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400">
                        Przypisane do: {task.assigned_to}
                      </span>
                    )}
                    {task.estimated_hours && (
                      <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
                        {task.estimated_hours}h
                      </span>
                    )}
                    {task.due_date && (
                      <span className="px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                        Termin: {formatDate(task.due_date)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-3 md:mt-0">
                  {/* Status dropdown */}
                  <select 
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  >
                    <option value="todo">Do zrobienia</option>
                    <option value="in-progress">W trakcie</option>
                    <option value="completed">Ukończone</option>
                  </select>
                  
                  {/* Delete button */}
                  <button 
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.5 4.98332C14.725 4.70832 11.9333 4.56665 9.15 4.56665C7.5 4.56665 5.85 4.64998 4.2 4.81665L2.5 4.98332" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M7.08331 4.14166L7.26665 3.05C7.39998 2.25833 7.49998 1.66666 8.90831 1.66666H11.0916C12.5 1.66666 12.6083 2.29166 12.7333 3.05833L12.9166 4.14166" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15.7084 7.61664L15.1667 16.0083C15.075 17.3166 15 18.3333 12.675 18.3333H7.32502C5.00002 18.3333 4.92502 17.3166 4.83335 16.0083L4.29169 7.61664" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8.60834 13.75H11.3833" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M7.91669 10.4167H12.0834" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t dark:border-gray-700">
                <span>Utworzono: {formatDate(task.created_at)}</span>
                {task.completed_at && <span>Ukończono: {formatDate(task.completed_at)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal dodawania zadania */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[600px] p-5 lg:p-8 m-4"
      >
        <div className="px-2">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Dodaj nowe zadanie
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Uzupełnij informacje o nowym zadaniu dla projektu
          </p>
        </div>

        <form className="flex flex-col">
          <div className="custom-scrollbar max-h-[500px] overflow-y-auto px-2">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Tytuł zadania *</Label>
                <Input 
                  type="text" 
                  name="title" 
                  value={newTask.title} 
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label>Status</Label>
                <div className="relative z-20 bg-transparent dark:bg-form-input">
                  <select 
                    name="status" 
                    value={newTask.status} 
                    onChange={handleInputChange}
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  >
                    <option value="todo">Do zrobienia</option>
                    <option value="in-progress">W trakcie</option>
                    <option value="completed">Ukończone</option>
                  </select>
                  <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-4 top-1/2 dark:text-gray-400">
                    <svg
                      className="stroke-current"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
                        stroke=""
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </div>

              <div>
                <Label>Priorytet</Label>
                <div className="relative z-20 bg-transparent dark:bg-form-input">
                  <select 
                    name="priority" 
                    value={newTask.priority} 
                    onChange={handleInputChange}
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  >
                    <option value="low">Niski</option>
                    <option value="medium">Średni</option>
                    <option value="high">Wysoki</option>
                  </select>
                  <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-4 top-1/2 dark:text-gray-400">
                    <svg
                      className="stroke-current"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
                        stroke=""
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </div>

              <div>
                <Label>Przypisane do</Label>
                <Input 
                  type="text" 
                  name="assigned_to" 
                  value={newTask.assigned_to} 
                  onChange={handleInputChange} 
                  placeholder="Imię i nazwisko"
                />
              </div>

              <div>
                <Label>Szacowane godziny</Label>
                <Input 
                  type="number" 
                  name="estimated_hours" 
                  value={newTask.estimated_hours} 
                  onChange={handleInputChange} 
                  placeholder="0"
                />
              </div>

              <div>
                <Label>Termin wykonania</Label>
                <Input 
                  type="date" 
                  name="due_date" 
                  value={newTask.due_date} 
                  onChange={handleInputChange}
                />
              </div>

              <div className="sm:col-span-2">
                <Label>Opis zadania</Label>
                <TextArea
                  placeholder="Opisz szczegóły zadania..."
                  rows={4}
                  value={newTask.description}
                  onChange={handleDescriptionChange}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end w-full gap-3 px-2 mt-6">
            <button
              onClick={closeModal}
              type="button"
              className="flex w-auto justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
            >
              Anuluj
            </button>
            <button
              onClick={handleAddTask}
              type="button"
              className="flex w-auto justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Dodaj zadanie
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}