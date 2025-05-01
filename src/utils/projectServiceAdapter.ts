/**
 * Project adapter module - converts data between services API and UI project format
 */

// Define TypeScript interfaces
export interface UIProject {
  id: string;
  title: string;
  dueDate: string;
  comments?: number;
  assignee: string;
  status: string;
  projectDesc?: string;
  priority?: 'high' | 'medium' | 'low';
  estimatedHours?: number;
  tags?: string;
  price?: number;
  category: {
    name: string;
    color: string;
  };
  links?: number;
  projectImg?: string;
  client_id?: number;
  startDate?: string;
  endDate?: string;
}

export interface APIProject {
  id?: number;
  client_id: number;
  service_name: string;
  description?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  estimated_hours?: number;
  category?: string;
  tags?: string;
  price: number;
  start_date: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Converts API data to the format used in UI components
 * @param apiProject - Project from API (services table)
 * @returns Formatted project for UI
 */
export const convertToUIProject = (apiProject: APIProject | null): UIProject | null => {
  if (!apiProject) return null;
  
  return {
    id: apiProject.id?.toString() || '',
    title: apiProject.service_name || '',
    dueDate: formatDate(apiProject.end_date || null),
    comments: 0, // Default value
    assignee: getUserAvatar(apiProject.assigned_to),
    status: convertStatusToUI(apiProject.status || 'todo'),
    projectDesc: apiProject.description || "",
    priority: (apiProject.priority as 'high' | 'medium' | 'low') || 'medium',
    estimatedHours: apiProject.estimated_hours,
    tags: apiProject.tags,
    price: parseFloat(apiProject.price?.toString() || '0'),
    category: { 
      name: apiProject.category || "Development", 
      color: getCategoryColor(apiProject.category || "")
    },
    client_id: apiProject.client_id
  };
};

/**
 * Converts data from UI format to API format
 * @param uiProject - Project in UI format
 * @returns Project in API format
 */
export const convertToAPIProject = (uiProject: UIProject | null): APIProject | null => {
  if (!uiProject) return null;
  
  return {
    id: parseInt(uiProject.id),
    client_id: uiProject.client_id || 0,
    service_name: uiProject.title,
    description: uiProject.projectDesc,
    status: convertStatusToAPI(uiProject.status),
    priority: uiProject.priority,
    assigned_to: uiProject.assignee,
    estimated_hours: uiProject.estimatedHours,
    category: uiProject.category?.name,
    tags: uiProject.tags,
    price: uiProject.price || 0,
    start_date: uiProject.startDate || new Date().toISOString().split('T')[0],
    end_date: uiProject.endDate
  };
};

/**
 * Formats date to a friendly format
 * @param dateString - Date in ISO format
 * @returns Formatted date
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return "No deadline";
  
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  
  return date.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Returns avatar path based on name
 * @param name - Person's name
 * @returns Avatar file path
 */
export const getUserAvatar = (name: string | null | undefined): string => {
  if (!name) return "/images/user/user-01.jpg";
  
  // Name to avatar mapping
  const nameMap: Record<string, string> = {
    "Kamil Pagacz": "/images/user/user-01.jpg",
    "Marek Nowak": "/images/user/user-02.jpg",
    "Anna Kowalska": "/images/user/user-03.jpg",
    "Piotr Wiśniewski": "/images/user/user-04.jpg"
  };
  
  return nameMap[name] || "/images/user/user-05.jpg";
};

/**
 * Converts status from API to UI format
 * @param status - Status from API
 * @returns Status for UI
 */
export const convertStatusToUI = (status: string): string => {
  if (status === 'in-progress') return 'inProgress';
  return status;
};

/**
 * Converts status from UI to API format
 * @param status - Status from UI
 * @returns Status for API
 */
export const convertStatusToAPI = (status: string): string => {
  if (status === 'inProgress') return 'in-progress';
  return status;
};

/**
 * Determines color for a given category
 * @param category - Category name
 * @returns Color name for the category
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