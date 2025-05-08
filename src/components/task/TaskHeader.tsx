import { useState, useEffect, useRef } from "react";
import Modal from "../ui/modal";
import { useModal } from "../../hooks/useModal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import api from "../../utils/axios-config";
import { createProject } from "../../services/projectService";
import { useAlert } from "../../context/AlertContext";
import UserMultiSelect from "../../components/user/UserMultiSelect"; // Importujemy nasz nowy komponent

// Define filter option types
export type TaskGroupKey = 'All' | 'Todo' | 'InProgress' | 'Completed';

export interface FilterOptions {
  priority: 'all' | 'high' | 'medium' | 'low';
  category: 'all' | 'Development' | 'Design' | 'Marketing' | 'E-commerce';
  sortBy: 'newest' | 'oldest' | 'nameAsc' | 'nameDesc' | 'priceAsc' | 'priceDesc';
}

// Define component props interface
interface TaskHeaderProps {
  onFilterChange?: (filters: FilterOptions) => void;
  onTaskGroupChange?: (groupKey: TaskGroupKey) => void;
  selectedTaskGroup?: TaskGroupKey;
  taskCounts?: {
    All: number;
    Todo: number;
    InProgress: number;
    Completed: number;
  };
}

// Interfejs dla użytkownika wybranego w multiselect
interface SelectedUser {
  id: number | string;
  name: string;
}

export default function TaskHeader({ 
  onFilterChange, 
  onTaskGroupChange, 
  selectedTaskGroup = 'All',
  taskCounts
}: TaskHeaderProps) {
  const { showAlert } = useAlert();
  const [localSelectedTaskGroup, setLocalSelectedTaskGroup] = useState<TaskGroupKey>(selectedTaskGroup);
  const { isOpen, openModal, closeModal } = useModal();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    priority: 'all',
    category: 'all',
    sortBy: 'newest'
  });

  // Nowy stan dla przechowywania wybranych użytkowników
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);

  const defaultTaskGroups = [
    { name: "Wszystkie zadania", key: "All" as TaskGroupKey, count: 0 },
    { name: "Do zrobienia", key: "Todo" as TaskGroupKey, count: 0 },
    { name: "W trakcie", key: "InProgress" as TaskGroupKey, count: 0 },
    { name: "Ukończone", key: "Completed" as TaskGroupKey, count: 0 },
  ];

  const taskGroups = defaultTaskGroups.map(group => ({
    ...group,
    count: taskCounts ? taskCounts[group.key] : group.count
  }));

  /**
   * Funkcja licząca aktywne filtry
   * @returns Liczba aktywnych filtrów
   */
  const countActiveFilters = () => {
    let count = 0;
    
    // Sprawdź czy priorytet jest filtrowany
    if (filterOptions.priority !== 'all') {
      count++;
    }
    
    // Sprawdź czy kategoria jest filtrowana
    if (filterOptions.category !== 'all') {
      count++;
    }
    
    // Sprawdź czy sortowanie jest inne niż domyślne
    if (filterOptions.sortBy !== 'newest') {
      count++;
    }
    
    return count;
  };

  // Refs dla obsługi dropdown
  const filterButtonContainerRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const effectiveTaskGroup = selectedTaskGroup || localSelectedTaskGroup;

  // Obsługa kliknięcia poza dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isFilterOpen &&
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(e.target as Node) &&
        // Sprawdź, czy kliknięcie nie było na przycisku filtru lub jego dzieciach
        !(e.target as HTMLElement).closest('.filter-button-container')
      ) {
        setIsFilterOpen(false);
      }
    };
  
    // Obsługa klawisza ESC
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (isFilterOpen && e.key === 'Escape') {
        setIsFilterOpen(false);
      }
    };
  
    // Dodajemy nasłuchiwanie kliknięcia i klawisza ESC
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
  
    return () => {
      // Usuwamy nasłuchiwanie przy odmontowaniu komponentu
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isFilterOpen]);

  const handleTaskGroupChange = (groupKey: TaskGroupKey) => {
    // Aktualizuj stan lokalny
    setLocalSelectedTaskGroup(groupKey);
    
    // Wywołaj callback jeśli został przekazany
    if (onTaskGroupChange) {
      onTaskGroupChange(groupKey);
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setFormData({...formData, description: value});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({...formData, [name]: value});
  };

  // Obsługa zmiany wybranych użytkowników
  const handleSelectedUsersChange = (users: SelectedUser[]) => {
    setSelectedUsers(users);
  };

  const handleFilterChange = (filterType: keyof FilterOptions, value: any) => {
    const newFilters = { ...filterOptions, [filterType]: value } as FilterOptions;
    setFilterOptions(newFilters);
    
    // Pass filter changes to parent component
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };
  
  // Pobierz listę klientów przy inicjalizacji
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/clients');
        setClients(response.data || []);
      } catch (error) {
        console.error('Błąd podczas pobierania listy klientów:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const [formData, setFormData] = useState({
    client_id: "",
    service_name: "",
    description: "",
    status: "todo",
    priority: "medium",
    assigned_to: "",
    estimated_hours: "",
    category: "Development",
    tags: "",
    price: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: ""
  });

  const handleAddProject = async () => {
    try {
      // Walidacja
      if (!formData.client_id || !formData.service_name || !formData.price || !formData.start_date) {
        showAlert({
          type: 'error',
          title: 'Błąd walidacji',
          message: 'Proszę wypełnić wszystkie wymagane pola'
        });
        return;
      }
    
      setSubmitting(true);
      
      // Przygotuj listę przypisanych użytkowników jako string z przecinkami
      const assignedTo = selectedUsers.map(user => user.name).join(', ');
      
      // Przygotowanie danych projektu
      const projectData = {
        client_id: parseInt(formData.client_id),
        service_name: formData.service_name,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        assigned_to: assignedTo, // Używamy listy wybranych użytkowników
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : undefined,
        category: formData.category,
        tags: formData.tags,
        price: parseFloat(formData.price),
        start_date: formData.start_date,
        end_date: formData.end_date || undefined
      };
    
      console.log('Wysyłane dane projektu:', projectData);
    
      // Używamy projectService do utworzenia projektu
      const newProject = await createProject(projectData);
      
      // Po utworzeniu projektu, możemy utworzyć domyślne zadania
      if (newProject.id) {
        try {
          await api.post('/api/project-tasks/create-defaults', {
            project_id: newProject.id,
            project_name: newProject.service_name
          });
        } catch (taskError) {
          console.warn('Nie udało się utworzyć domyślnych zadań dla projektu:', taskError);
          // Mimo błędu z zadaniami, kontynuujemy - projekt został utworzony
        }
      }
      
      // Zamknij modal i zresetuj formularz
      closeModal();
      
      // Resetujemy formularz
      setFormData({
        client_id: "",
        service_name: "",
        description: "",
        status: "todo",
        priority: "medium",
        assigned_to: "",
        estimated_hours: "",
        category: "Development",
        tags: "",
        price: "",
        start_date: new Date().toISOString().split('T')[0],
        end_date: ""
      });
      setDescription("");
      setSelectedUsers([]); // Resetujemy wybrane użytkowników
      
      // Pokaż alert o sukcesie
      showAlert({
        type: 'success',
        title: 'Projekt utworzony',
        message: 'Nowy projekt został pomyślnie utworzony'
      });
      
      // Odśwież stronę, aby pokazać nowy projekt
      window.location.reload();
    } catch (error) {
      console.error('Błąd podczas dodawania projektu:', error);
      showAlert({
        type: 'error',
        title: 'Błąd',
        message: 'Wystąpił błąd podczas dodawania projektu. Spróbuj ponownie.'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <>
      <div className="flex flex-col items-center px-4 py-5 xl:px-6 xl:py-6">
        <div className="flex flex-col w-full gap-5 sm:justify-between xl:flex-row xl:items-center">
          <div className="grid grid-cols-2 sm:grid-cols-4 items-center gap-x-1 gap-y-2 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
            {taskGroups.map((group) => (
              <button
                key={group.key}
                onClick={() => handleTaskGroupChange(group.key)}
                className={`inline-flex items-center xl:justify-start justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md group hover:text-gray-900 dark:hover:text-white ${
                  selectedTaskGroup === group.key
                    ? "text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {group.name}
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium leading-normal group-hover:bg-brand-50 group-hover:text-brand-500 dark:group-hover:bg-brand-500/15 dark:group-hover:text-brand-400 ${
                    effectiveTaskGroup === group.key
                    ? "text-brand-500 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/15"
                      : "bg-white dark:bg-white/[0.03]"
                  }`}
                >
                  {group.count}
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 xl:justify-end">

            {/* Filter button with dropdown */}
            <div className="relative">
              <div ref={filterButtonContainerRef} className="filter-button-container">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="relative z-20"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12.0826 4.0835C11.0769 4.0835 10.2617 4.89871 10.2617 5.90433C10.2617 6.90995 11.0769 7.72516 12.0826 7.72516C13.0882 7.72516 13.9034 6.90995 13.9034 5.90433C13.9034 4.89871 13.0882 4.0835 12.0826 4.0835ZM2.29004 6.65409H8.84671C9.18662 8.12703 10.5063 9.22516 12.0826 9.22516C13.6588 9.22516 14.9785 8.12703 15.3184 6.65409H17.7067C18.1209 6.65409 18.4567 6.31831 18.4567 5.90409C18.4567 5.48988 18.1209 5.15409 17.7067 5.15409H15.3183C14.9782 3.68139 13.6586 2.5835 12.0826 2.5835C10.5065 2.5835 9.18691 3.68139 8.84682 5.15409H2.29004C1.87583 5.15409 1.54004 5.48988 1.54004 5.90409C1.54004 6.31831 1.87583 6.65409 2.29004 6.65409ZM4.6816 13.3462H2.29085C1.87664 13.3462 1.54085 13.682 1.54085 14.0962C1.54085 14.5104 1.87664 14.8462 2.29085 14.8462H4.68172C5.02181 16.3189 6.34142 17.4168 7.91745 17.4168C9.49348 17.4168 10.8131 16.3189 11.1532 14.8462H17.7075C18.1217 14.8462 18.4575 14.5104 18.4575 14.0962C18.4575 13.682 18.1217 13.3462 17.7075 13.3462H11.1533C10.8134 11.8733 9.49366 10.7752 7.91745 10.7752C6.34124 10.7752 5.02151 11.8733 4.6816 13.3462ZM9.73828 14.096C9.73828 13.0904 8.92307 12.2752 7.91745 12.2752C6.91183 12.2752 6.09662 13.0904 6.09662 14.096C6.09662 15.1016 6.91183 15.9168 7.91745 15.9168C8.92307 15.9168 9.73828 15.1016 9.73828 14.096Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>Filtruj i sortuj</span>
                  {(filterOptions.priority !== 'all' || filterOptions.category !== 'all' || filterOptions.sortBy !== 'newest') && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-semibold text-white">
                      {countActiveFilters()}
                    </span>
                  )}
                </Button>
              </div>
              
              {/* Animowany dropdown filtrowania - poprawiona wersja */}
              <div 
                ref={filterDropdownRef}
                className={`absolute right-0 top-full z-40 w-[320px] max-h-[450px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-md dark:border-gray-800 dark:bg-gray-dark transition-all duration-300 ease-in-out ${
                  isFilterOpen 
                    ? 'opacity-100 translate-y-0 pointer-events-auto' 
                    : 'opacity-0 -translate-y-2 pointer-events-none'
                }`}
              >
                <div className="custom-scrollbar p-4 space-y-4 max-h-[450px] overflow-y-auto">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex justify-between">
                      <span>Priorytet</span>
                      {filterOptions.priority !== 'all' && (
                        <button 
                          onClick={() => handleFilterChange('priority', 'all')}
                          className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
                        >
                          Wyczyść
                        </button>
                      )}
                    </h4>
                    <div className="space-y-2">
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
                        filterOptions.priority === 'all' ? 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.02]'
                      }`}>
                        <input 
                          type="radio" 
                          name="priority" 
                          checked={filterOptions.priority === 'all'} 
                          onChange={() => handleFilterChange('priority', 'all')}
                          className="h-4 w-4 text-brand-500 focus:ring-brand-500 dark:focus:ring-brand-600 border-gray-300 dark:border-gray-700"
                        />
                        <span>Wszystkie</span>
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
                        filterOptions.priority === 'high' ? 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.02]'
                      }`}>
                        <input 
                          type="radio" 
                          name="priority" 
                          checked={filterOptions.priority === 'high'} 
                          onChange={() => handleFilterChange('priority', 'high')} 
                          className="h-4 w-4 text-brand-500 focus:ring-brand-500 dark:focus:ring-brand-600 border-gray-300 dark:border-gray-700"
                        />
                        <span className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-error-500"></span>
                          Wysoki
                        </span>
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
                        filterOptions.priority === 'medium' ? 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.02]'
                      }`}>
                        <input 
                          type="radio" 
                          name="priority" 
                          checked={filterOptions.priority === 'medium'} 
                          onChange={() => handleFilterChange('priority', 'medium')} 
                          className="h-4 w-4 text-brand-500 focus:ring-brand-500 dark:focus:ring-brand-600 border-gray-300 dark:border-gray-700"
                        />
                        <span className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-warning-500"></span>
                          Średni
                        </span>
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
                        filterOptions.priority === 'low' ? 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.02]'
                      }`}>
                        <input 
                          type="radio" 
                          name="priority" 
                          checked={filterOptions.priority === 'low'} 
                          onChange={() => handleFilterChange('priority', 'low')} 
                          className="h-4 w-4 text-brand-500 focus:ring-brand-500 dark:focus:ring-brand-600 border-gray-300 dark:border-gray-700"
                        />
                        <span className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-success-500"></span>
                          Niski
                        </span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex justify-between">
                      <span>Kategoria</span>
                      {filterOptions.category !== 'all' && (
                        <button 
                          onClick={() => handleFilterChange('category', 'all')}
                          className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
                        >
                          Wyczyść
                        </button>
                      )}
                    </h4>
                    <div className="space-y-2">
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
                        filterOptions.category === 'all' ? 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.02]'
                      }`}>
                        <input 
                          type="radio" 
                          name="category" 
                          checked={filterOptions.category === 'all'} 
                          onChange={() => handleFilterChange('category', 'all')} 
                          className="h-4 w-4 text-brand-500 focus:ring-brand-500 dark:focus:ring-brand-600 border-gray-300 dark:border-gray-700"
                        />
                        <span>Wszystkie</span>
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
                        filterOptions.category === 'Development' ? 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.02]'
                      }`}>
                        <input 
                          type="radio" 
                          name="category" 
                          checked={filterOptions.category === 'Development'} 
                          onChange={() => handleFilterChange('category', 'Development')} 
                          className="h-4 w-4 text-brand-500 focus:ring-brand-500 dark:focus:ring-brand-600 border-gray-300 dark:border-gray-700"
                        />
                        <span>Rozwój</span>
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
                        filterOptions.category === 'Design' ? 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.02]'
                      }`}>
                        <input 
                          type="radio" 
                          name="category" 
                          checked={filterOptions.category === 'Design'} 
                          onChange={() => handleFilterChange('category', 'Design')} 
                          className="h-4 w-4 text-brand-500 focus:ring-brand-500 dark:focus:ring-brand-600 border-gray-300 dark:border-gray-700"
                        />
                        <span>Projektowanie</span>
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
                        filterOptions.category === 'Marketing' ? 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.02]'
                      }`}>
                        <input 
                          type="radio" 
                          name="category" 
                          checked={filterOptions.category === 'Marketing'} 
                          onChange={() => handleFilterChange('category', 'Marketing')} 
                          className="h-4 w-4 text-brand-500 focus:ring-brand-500 dark:focus:ring-brand-600 border-gray-300 dark:border-gray-700"
                        />
                        <span>Marketing</span>
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
                        filterOptions.category === 'E-commerce' ? 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.02]'
                      }`}>
                        <input 
                          type="radio" 
                          name="category" 
                          checked={filterOptions.category === 'E-commerce'} 
                          onChange={() => handleFilterChange('category', 'E-commerce')} 
                          className="h-4 w-4 text-brand-500 focus:ring-brand-500 dark:focus:ring-brand-600 border-gray-300 dark:border-gray-700"
                        />
                        <span>E-commerce</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex justify-between">
                      <span>Sortuj według</span>
                      {filterOptions.sortBy !== 'newest' && (
                        <button 
                          onClick={() => handleFilterChange('sortBy', 'newest')}
                          className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
                        >
                          Domyślne
                        </button>
                      )}
                    </h4>
                    <div className="space-y-2">
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
                        filterOptions.sortBy === 'newest' ? 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.02]'
                      }`}>
                        <input 
                          type="radio" 
                          name="sortBy" 
                          checked={filterOptions.sortBy === 'newest'} 
                          onChange={() => handleFilterChange('sortBy', 'newest')} 
                          className="h-4 w-4 text-brand-500 focus:ring-brand-500 dark:focus:ring-brand-600 border-gray-300 dark:border-gray-700"
                        />
                        <span>Najnowsze</span>
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
                        filterOptions.sortBy === 'oldest' ? 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.02]'
                      }`}>
                        <input 
                          type="radio" 
                          name="sortBy" 
                          checked={filterOptions.sortBy === 'oldest'} 
                          onChange={() => handleFilterChange('sortBy', 'oldest')} 
                          className="h-4 w-4 text-brand-500 focus:ring-brand-500 dark:focus:ring-brand-600 border-gray-300 dark:border-gray-700"
                        />
                        <span>Najstarsze</span>
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
                        filterOptions.sortBy === 'nameAsc' ? 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.02]'
                      }`}>
                        <input 
                          type="radio" 
                          name="sortBy" 
                          checked={filterOptions.sortBy === 'nameAsc'} 
                          onChange={() => handleFilterChange('sortBy', 'nameAsc')} 
                          className="h-4 w-4 text-brand-500 focus:ring-brand-500 dark:focus:ring-brand-600 border-gray-300 dark:border-gray-700"
                        />
                        <span>Nazwa (A-Z)</span>
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
                        filterOptions.sortBy === 'nameDesc' ? 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.02]'
                      }`}>
                        <input 
                          type="radio" 
                          name="sortBy" 
                          checked={filterOptions.sortBy === 'nameDesc'} 
                          onChange={() => handleFilterChange('sortBy', 'nameDesc')} 
                          className="h-4 w-4 text-brand-500 focus:ring-brand-500 dark:focus:ring-brand-600 border-gray-300 dark:border-gray-700"
                        />
                        <span>Nazwa (Z-A)</span>
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
                        filterOptions.sortBy === 'priceAsc' ? 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.02]'
                      }`}>
                        <input 
                          type="radio" 
                          name="sortBy" 
                          checked={filterOptions.sortBy === 'priceAsc'} 
                          onChange={() => handleFilterChange('sortBy', 'priceAsc')} 
                          className="h-4 w-4 text-brand-500 focus:ring-brand-500 dark:focus:ring-brand-600 border-gray-300 dark:border-gray-700"
                        />
                        <span>Cena (rosnąco)</span>
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
                        filterOptions.sortBy === 'priceDesc' ? 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.02]'
                      }`}>
                        <input 
                          type="radio" 
                          name="sortBy" 
                          checked={filterOptions.sortBy === 'priceDesc'} 
                          onChange={() => handleFilterChange('sortBy', 'priceDesc')} 
                          className="h-4 w-4 text-brand-500 focus:ring-brand-500 dark:focus:ring-brand-600 border-gray-300 dark:border-gray-700"
                        />
                        <span>Cena (malejąco)</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setFilterOptions({
                          priority: 'all',
                          category: 'all',
                          sortBy: 'newest'
                        });
                        if (onFilterChange) {
                          onFilterChange({
                            priority: 'all',
                            category: 'all',
                            sortBy: 'newest'
                          });
                        }
                      }}
                    >
                      Resetuj filtry
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <Button size="sm" onClick={openModal}>
              Dodaj nowy projekt
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
        </div>
      </div>
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[700px] p-5 lg:p-10 m-4"
      >
        <div className="px-2">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Dodaj nowy projekt
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Wprowadź informacje o nowym projekcie do realizacji
          </p>
        </div>

        <form className="flex flex-col">
          <div className="custom-scrollbar h-[500px] overflow-y-auto px-2">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Nazwa projektu *</Label>
                <Input 
                  type="text" 
                  name="service_name" 
                  value={formData.service_name} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="sm:col-span-2">
                <Label>Klient *</Label>
                <div className="relative z-20 bg-transparent dark:bg-form-input">
                  <select 
                    name="client_id" 
                    value={formData.client_id} 
                    onChange={handleInputChange}
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  >
                    <option value="">Wybierz klienta</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.company_name}
                      </option>
                    ))}
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
                <Label>Data rozpoczęcia *</Label>
                <div className="relative">
                  <Input 
                    type="date" 
                    name="start_date" 
                    value={formData.start_date} 
                    onChange={handleInputChange} 
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <svg
                      className="fill-gray-700 dark:fill-gray-400"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M4.33317 0.0830078C4.74738 0.0830078 5.08317 0.418794 5.08317 0.833008V1.24967H8.9165V0.833008C8.9165 0.418794 9.25229 0.0830078 9.6665 0.0830078C10.0807 0.0830078 10.4165 0.418794 10.4165 0.833008V1.24967L11.3332 1.24967C12.2997 1.24967 13.0832 2.03318 13.0832 2.99967V4.99967V11.6663C13.0832 12.6328 12.2997 13.4163 11.3332 13.4163H2.6665C1.70001 13.4163 0.916504 12.6328 0.916504 11.6663V4.99967V2.99967C0.916504 2.03318 1.70001 1.24967 2.6665 1.24967L3.58317 1.24967V0.833008C3.58317 0.418794 3.91896 0.0830078 4.33317 0.0830078ZM4.33317 2.74967H2.6665C2.52843 2.74967 2.4165 2.8616 2.4165 2.99967V4.24967H11.5832V2.99967C11.5832 2.8616 11.4712 2.74967 11.3332 2.74967H9.6665H4.33317ZM11.5832 5.74967H2.4165V11.6663C2.4165 11.8044 2.52843 11.9163 2.6665 11.9163H11.3332C11.4712 11.9163 11.5832 11.8044 11.5832 11.6663V5.74967Z"
                        fill=""
                      />
                    </svg>
                  </span>
                </div>
              </div>

              <div>
                <Label>Termin zakończenia</Label>
                <div className="relative">
                  <Input 
                    type="date" 
                    name="end_date" 
                    value={formData.end_date} 
                    onChange={handleInputChange} 
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <svg
                      className="fill-gray-700 dark:fill-gray-400"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M4.33317 0.0830078C4.74738 0.0830078 5.08317 0.418794 5.08317 0.833008V1.24967H8.9165V0.833008C8.9165 0.418794 9.25229 0.0830078 9.6665 0.0830078C10.0807 0.0830078 10.4165 0.418794 10.4165 0.833008V1.24967L11.3332 1.24967C12.2997 1.24967 13.0832 2.03318 13.0832 2.99967V4.99967V11.6663C13.0832 12.6328 12.2997 13.4163 11.3332 13.4163H2.6665C1.70001 13.4163 0.916504 12.6328 0.916504 11.6663V4.99967V2.99967C0.916504 2.03318 1.70001 1.24967 2.6665 1.24967L3.58317 1.24967V0.833008C3.58317 0.418794 3.91896 0.0830078 4.33317 0.0830078ZM4.33317 2.74967H2.6665C2.52843 2.74967 2.4165 2.8616 2.4165 2.99967V4.24967H11.5832V2.99967C11.5832 2.8616 11.4712 2.74967 11.3332 2.74967H9.6665H4.33317ZM11.5832 5.74967H2.4165V11.6663C2.4165 11.8044 2.52843 11.9163 2.6665 11.9163H11.3332C11.4712 11.9163 11.5832 11.8044 11.5832 11.6663V5.74967Z"
                        fill=""
                      />
                    </svg>
                  </span>
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <div className="relative z-20 bg-transparent dark:bg-form-input">
                  <select 
                    name="status" 
                    value={formData.status} 
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
                    value={formData.priority} 
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
                <Label>Kategoria</Label>
                <div className="relative z-20 bg-transparent dark:bg-form-input">
                  <select 
                    name="category" 
                    value={formData.category} 
                    onChange={handleInputChange}
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  >
                    <option value="Development">Rozwój</option>
                    <option value="Design">Projektowanie</option>
                    <option value="Marketing">Marketing</option>
                    <option value="E-commerce">E-commerce</option>
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

              {/* Dodajemy nowy komponent do wyboru wielu użytkowników */}
              <div className="sm:col-span-2">
                <Label>Przypisani użytkownicy</Label>
                <UserMultiSelect 
                  selectedUsers={selectedUsers}
                  onChange={handleSelectedUsersChange}
                  placeholder="Wybierz użytkowników do projektu..."
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Możesz przypisać wielu użytkowników do tego projektu
                </p>
              </div>

              <div>
                <Label>Szacowane godziny</Label>
                <Input 
                  type="number" 
                  name="estimated_hours" 
                  value={formData.estimated_hours} 
                  onChange={handleInputChange} 
                  placeholder="0"
                />
              </div>

              <div>
                <Label>Tagi (oddzielone przecinkami)</Label>
                <Input 
                  type="text" 
                  name="tags" 
                  value={formData.tags} 
                  onChange={handleInputChange} 
                  placeholder="np. rozwój, frontend, api"
                />
              </div>

              <div>
                <Label>Cena (PLN) *</Label>
                <Input 
                  type="number" 
                  name="price" 
                  value={formData.price} 
                  onChange={handleInputChange} 
                  placeholder="0.00"
                />
              </div>

              <div className="sm:col-span-2">
                <Label>Opis projektu</Label>
                <TextArea
                  placeholder="Opisz szczegóły projektu..."
                  rows={6}
                  value={description}
                  onChange={handleDescriptionChange}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-6 px-2 mt-6 sm:flex-row sm:justify-between">
            <div className="text-xs text-gray-500">
              * Pola wymagane
            </div>

            <div className="flex items-center w-full gap-3 sm:w-auto">
              <button
                onClick={closeModal}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Anuluj
              </button>
              <button
                onClick={handleAddProject}
                type="button"
                className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
                disabled={submitting}
              >
                {submitting ? 'Tworzenie...' : 'Utwórz projekt'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}