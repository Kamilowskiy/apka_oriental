import api from '../utils/axios-config';
import { 
  convertToAPIProject, 
  convertToUIProject, 
  APIProject,
  UIProject
} from '../utils/projectServiceAdapter';

/**
 * Interface representing a project (based on services table)
 */
export class Project implements APIProject {
  id?: number;
  client_id: number = 0;
  service_name: string = '';
  description?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  estimated_hours?: number;
  category?: string;
  tags?: string;
  price: number = 0;
  start_date: string = '';
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetches all projects from the system
 * @returns Promise with list of projects
 */
export const getAllProjects = async (): Promise<Project[]> => {
  try {
    const response = await api.get('/api/services');
    return response.data.services || [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

/**
 * Fetches projects for a specific client
 * @param clientId Client ID
 * @returns Promise with list of client's projects
 */
export const getClientProjects = async (clientId: number): Promise<Project[]> => {
  try {
    const response = await api.get(`/api/services/client/${clientId}`);
    return response.data.services || [];
  } catch (error) {
    console.error(`Error fetching client projects (ID: ${clientId}):`, error);
    throw error;
  }
};

/**
 * Fetches a single project by ID
 * @param projectId Project ID
 * @returns Promise with project data
 */
export const getProjectById = async (projectId: number): Promise<Project> => {
  try {
    const response = await api.get(`/api/services/${projectId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching project (ID: ${projectId}):`, error);
    throw error;
  }
};

/**
 * Creates a new project
 * @param projectData Project data to create
 * @returns Promise with created project
 */
export const createProject = async (projectData: Project | UIProject | any): Promise<Project> => {
  try {
    // Dodajmy logowanie, aby lepiej zrozumieć, co jest przekazywane
    console.log('createProject otrzymał dane:', projectData);
    
    // Sprawdź, czy dane są już w formacie API
    const alreadyAPIFormat = 'service_name' in projectData && !('title' in projectData);
    
    // Przygotuj dane do wysyłki
    let apiData;
    
    if (alreadyAPIFormat) {
      // Dane są już w formacie API
      apiData = projectData;
      console.log('Dane już w formacie API, wysyłam bezpośrednio:', apiData);
    } else {
      // Konwersja danych UI do formatu API
      apiData = convertToAPIProject(projectData);
      console.log('Skonwertowane dane do formatu API:', apiData);
    }
    
    // Upewnij się, że liczby są w poprawnym formacie
    if (typeof apiData.client_id === 'string') {
      apiData.client_id = parseInt(apiData.client_id);
    }
    
    if (typeof apiData.price === 'string') {
      apiData.price = parseFloat(apiData.price);
    }
    
    if (apiData.estimated_hours && typeof apiData.estimated_hours === 'string') {
      apiData.estimated_hours = parseInt(apiData.estimated_hours);
    }
    
    // Wyślij żądanie do API - używaj /api/projects zamiast /api/services
    const response = await api.post('/api/projects', apiData);
    console.log('Odpowiedź z API po utworzeniu projektu:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

/**
 * Updates an existing project
 * @param projectId Project ID to update
 * @param projectData Project data to update
 * @returns Promise with updated project
 */
export const updateProject = async (
  projectId: number, 
  projectData: Partial<Project> | Partial<UIProject> | any
): Promise<Project> => {
  try {
    console.log('updateProject został wywołany z danymi:', projectData, 'dla ID:', projectId);
    
    // Sprawdź, czy dane są już w formacie API
    const alreadyAPIFormat = 'service_name' in projectData && !('title' in projectData);
    
    // Przygotuj dane do wysyłki
    let apiData;
    
    if (alreadyAPIFormat) {
      // Dane są już w formacie API
      apiData = projectData;
      console.log('Dane już w formacie API, wysyłam bezpośrednio:', apiData);
    } else {
      // Konwersja danych UI do formatu API
      apiData = convertToAPIProject({...projectData as UIProject, id: projectId.toString()});
      console.log('Skonwertowane dane do formatu API:', apiData);
    }
    
    // Upewnij się, że liczby są w poprawnym formacie
    if (typeof apiData.client_id === 'string') {
      apiData.client_id = parseInt(apiData.client_id);
    }
    
    if (typeof apiData.price === 'string') {
      apiData.price = parseFloat(apiData.price);
    }
    
    if (apiData.estimated_hours && typeof apiData.estimated_hours === 'string') {
      apiData.estimated_hours = parseInt(apiData.estimated_hours);
    }
    
    // Wyślij żądanie do API - używaj /api/projects zamiast /api/services
    const response = await api.put(`/api/projects/${projectId}`, apiData);
    console.log('Odpowiedź z API po aktualizacji projektu:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating project (ID: ${projectId}):`, error);
    throw error;
  }
};

/**
 * Deletes a project
 * @param projectId Project ID to delete
 */
export const deleteProject = async (projectId: number): Promise<void> => {
  try {
    await api.delete(`/api/services/${projectId}`);
  } catch (error) {
    console.error(`Error deleting project (ID: ${projectId}):`, error);
    throw error;
  }
};

/**
 * Updates project status
 * @param projectId Project ID
 * @param status New project status ('todo', 'in-progress', 'completed')
 * @returns Promise with updated project
 */
export const updateProjectStatus = async (
  projectId: number, 
  status: string
): Promise<Project> => {
  try {
    // If the status is in UI format, convert it to API format
    const apiStatus = status === 'inProgress' ? 'in-progress' : status;
    
    // Użyj dedykowanego endpointa do aktualizacji statusu
    const response = await api.patch(`/api/projects/${projectId}/status`, { status: apiStatus });
    return response.data;
  } catch (error) {
    console.error(`Error updating project status (ID: ${projectId}):`, error);
    throw error;
  }
};