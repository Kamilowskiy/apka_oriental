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
export const createProject = async (projectData: Project | UIProject): Promise<Project> => {
  try {
    // Convert UI project data to API format if needed
    const apiData = 'title' in projectData
      ? convertToAPIProject(projectData as UIProject)
      : projectData;
        
    const response = await api.post('/api/services', apiData);
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
  projectData: Partial<Project> | Partial<UIProject>
): Promise<Project> => {
  try {
    // Convert UI project data to API format if needed
    const apiData = 'title' in projectData
      ? convertToAPIProject({...projectData as UIProject, id: projectId.toString()})
      : projectData;
        
    const response = await api.put(`/api/services/${projectId}`, apiData);
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
    return await updateProject(projectId, { status: apiStatus });
  } catch (error) {
    console.error(`Error updating project status (ID: ${projectId}):`, error);
    throw error;
  }
};