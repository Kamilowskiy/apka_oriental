/**
 * Moduł adaptera dla projektów - konwertuje dane między API services a formatem projektów w UI
 */

/**
 * Interfejs reprezentujący projekt z API
 */
interface ApiProject {
  id?: number;
  name?: string;
  service_name?: string;
  description?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  estimated_hours?: number;
  category?: string;
  tags?: string;
  price?: string | number;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  client_id?: number;
  comments?: number;
}

/**
 * Interfejs reprezentujący projekt w UI
 */
interface UiProject {
  id: string;
  title: string;
  dueDate: string;
  comments?: number;
  assignee: string;
  status: string;
  projectDesc?: string;
  priority?: string;
  estimatedHours?: number;
  tags?: string;
  price?: number;
  category: {
    name: string;
    color: string;
  };
  client_id?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * Konwertuje dane z API do formatu używanego w komponentach UI
 * @param apiProject - Projekt z API (tabela services)
 * @returns - Sformatowany projekt dla UI
 */
export const convertToUIProject = (apiProject: ApiProject): UiProject | null => {
  if (!apiProject) return null;
  
  return {
    id: apiProject.id?.toString() || '',
    title: apiProject.name || apiProject.service_name || '',
    dueDate: formatDate(apiProject.end_date),
    comments: apiProject.comments || Math.floor(Math.random() * 3), // Dla celów testowych
    assignee: getUserAvatar(apiProject.assigned_to),
    status: convertStatusToUI(apiProject.status || 'todo'),
    projectDesc: apiProject.description || "",
    priority: apiProject.priority || 'medium',
    estimatedHours: apiProject.estimated_hours,
    tags: apiProject.tags,
    price: parseFloat(apiProject.price?.toString() || '0') || 0,
    category: { 
      name: apiProject.category || "Development", 
      color: getCategoryColor(apiProject.category || "")
    },
    client_id: apiProject.client_id
  };
};

/**
 * Konwertuje dane z formatu UI do formatu API
 * @param uiProject - Projekt w formacie UI
 * @returns - Projekt w formacie wymaganym przez API
 */
export const convertToAPIProject = (uiProject: UiProject | null): ApiProject | null => {
  if (!uiProject) return null;
  
  return {
    id: parseInt(uiProject.id),
    client_id: uiProject.client_id,
    service_name: uiProject.title,
    description: uiProject.projectDesc,
    status: convertStatusToAPI(uiProject.status),
    priority: uiProject.priority,
    assigned_to: uiProject.assignee,
    estimated_hours: uiProject.estimatedHours,
    category: uiProject.category?.name,
    tags: uiProject.tags,
    price: uiProject.price,
    start_date: uiProject.startDate,
    end_date: uiProject.endDate
  };
};

/**
 * Formatuje datę do przyjaznego formatu
 * @param dateString - Data w formacie ISO
 * @returns - Sformatowana data
 */
export const formatDate = (dateString?: string): string => {
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

/**
 * Zwraca ścieżkę do avatara na podstawie imienia
 * @param name - Imię i nazwisko osoby
 * @returns - Ścieżka do pliku avatara
 */
export const getUserAvatar = (name?: string): string => {
  if (!name) return "/images/user/user-01.jpg";
  
  // Mapowanie imion do avatarów
  const nameMap: Record<string, string> = {
    "Kamil Pagacz": "/images/user/user-01.jpg",
    "Marek Nowak": "/images/user/user-02.jpg",
    "Anna Kowalska": "/images/user/user-03.jpg",
    "Piotr Wiśniewski": "/images/user/user-04.jpg"
  };
  
  return nameMap[name] || "/images/user/user-05.jpg";
};

/**
 * Konwertuje status z API do formatu UI
 * @param status - Status z API
 * @returns - Status dla UI
 */
export const convertStatusToUI = (status: string): string => {
  if (status === 'in-progress') return 'inProgress';
  return status;
};

/**
 * Konwertuje status z UI do formatu API
 * @param status - Status z UI
 * @returns - Status dla API
 */
export const convertStatusToAPI = (status: string): string => {
  if (status === 'inProgress') return 'in-progress';
  return status;
};

/**
 * Określa kolor dla danej kategorii
 * @param category - Nazwa kategorii
 * @returns - Nazwa koloru dla kategorii
 */
export const getCategoryColor = (category: string): string => {
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