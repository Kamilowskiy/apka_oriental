// src/services/projectService.js
import api from '../utils/axios-config';

/**
 * Interfejs reprezentujący projekt (bazujący na tabeli services)
 */
export class Project {
  id;
  client_id;
  service_name;
  description;
  status;
  priority;
  assigned_to;
  estimated_hours;
  category;
  tags;
  price;
  start_date;
  end_date;
  created_at;
}

/**
 * Pobiera wszystkie projekty z systemu
 * @returns {Promise<Project[]>} Lista projektów
 */
export const getAllProjects = async () => {
  try {
    const response = await api.get('/api/projects');
    return response.data.projects;
  } catch (error) {
    console.error('Błąd podczas pobierania projektów:', error);
    throw error;
  }
};

/**
 * Pobiera projekty dla konkretnego klienta
 * @param {number} clientId ID klienta
 * @returns {Promise<Project[]>} Lista projektów klienta
 */
export const getClientProjects = async (clientId) => {
  try {
    const response = await api.get(`/api/projects/client/${clientId}`);
    return response.data.projects;
  } catch (error) {
    console.error(`Błąd podczas pobierania projektów klienta (ID: ${clientId}):`, error);
    throw error;
  }
};

/**
 * Pobiera pojedynczy projekt po ID
 * @param {number} projectId ID projektu
 * @returns {Promise<Project>} Dane projektu
 */
export const getProjectById = async (projectId) => {
  try {
    const response = await api.get(`/api/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error(`Błąd podczas pobierania projektu (ID: ${projectId}):`, error);
    throw error;
  }
};

/**
 * Tworzy nowy projekt
 * @param {Project} projectData Dane projektu do utworzenia
 * @returns {Promise<Project>} Utworzony projekt
 */
export const createProject = async (projectData) => {
  try {
    const response = await api.post('/api/projects', projectData);
    return response.data;
  } catch (error) {
    console.error('Błąd podczas tworzenia projektu:', error);
    throw error;
  }
};

/**
 * Aktualizuje istniejący projekt
 * @param {number} projectId ID projektu do zaktualizowania
 * @param {Partial<Project>} projectData Dane projektu do aktualizacji
 * @returns {Promise<Project>} Zaktualizowany projekt
 */
export const updateProject = async (projectId, projectData) => {
  try {
    const response = await api.put(`/api/projects/${projectId}`, projectData);
    return response.data;
  } catch (error) {
    console.error(`Błąd podczas aktualizacji projektu (ID: ${projectId}):`, error);
    throw error;
  }
};

/**
 * Usuwa projekt
 * @param {number} projectId ID projektu do usunięcia
 * @returns {Promise<void>}
 */
export const deleteProject = async (projectId) => {
  try {
    await api.delete(`/api/projects/${projectId}`);
  } catch (error) {
    console.error(`Błąd podczas usuwania projektu (ID: ${projectId}):`, error);
    throw error;
  }
};

/**
 * Aktualizuje status projektu
 * @param {number} projectId ID projektu
 * @param {string} status Nowy status projektu ('todo', 'in-progress', 'completed')
 * @returns {Promise<Project>} Zaktualizowany projekt
 */
export const updateProjectStatus = async (projectId, status) => {
  try {
    return await updateProject(projectId, { status });
  } catch (error) {
    console.error(`Błąd podczas aktualizacji statusu projektu (ID: ${projectId}):`, error);
    throw error;
  }
};