/**
 * Moduł adaptera dla projektów - konwertuje dane między API services a formatem projektów w UI
 */

/**
 * Konwertuje dane z API do formatu używanego w komponentach UI
 * @param {Object} apiProject - Projekt z API (tabela services)
 * @returns {Object} - Sformatowany projekt dla UI
 */
export const convertToUIProject = (apiProject) => {
    return {
      id: apiProject.id.toString(),
      title: apiProject.service_name,
      dueDate: formatDate(apiProject.end_date),
      comments: apiProject.comments || 0,
      assignee: apiProject.assigned_to,
      assigneeAvatar: getUserAvatar(apiProject.assigned_to),
      status: convertStatusToUI(apiProject.status || 'todo'),
      projectDesc: apiProject.description || "",
      priority: apiProject.priority || 'medium',
      estimatedHours: apiProject.estimated_hours,
      tags: apiProject.tags,
      price: parseFloat(apiProject.price) || 0,
      startDate: apiProject.start_date,
      endDate: apiProject.end_date,
      createdAt: apiProject.created_at,
      category: { 
        name: apiProject.category || "Development", 
        color: getCategoryColor(apiProject.category || "")
      },
      client: {
        id: apiProject.client_id,
        name: apiProject.client ? apiProject.client.company_name : ""
      }
    };
  };
  
  /**
   * Konwertuje dane z formatu UI do formatu API
   * @param {Object} uiProject - Projekt w formacie UI
   * @returns {Object} - Projekt w formacie wymaganym przez API
   */
  export const convertToAPIProject = (uiProject) => {
    return {
      id: parseInt(uiProject.id),
      client_id: uiProject.client?.id || uiProject.client_id,
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
   * @param {string} dateString - Data w formacie ISO
   * @returns {string} - Sformatowana data
   */
  export const formatDate = (dateString) => {
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
   * @param {string} name - Imię i nazwisko osoby
   * @returns {string} - Ścieżka do pliku avatara
   */
  export const getUserAvatar = (name) => {
    if (!name) return "/images/user/user-01.jpg";
    
    // Mapowanie imion do avatarów
    const nameMap = {
      "Kamil Pagacz": "/images/user/user-01.jpg",
      "Marek Nowak": "/images/user/user-02.jpg",
      "Anna Kowalska": "/images/user/user-03.jpg",
      "Piotr Wiśniewski": "/images/user/user-04.jpg"
    };
    
    return nameMap[name] || "/images/user/user-05.jpg";
  };
  
  /**
   * Konwertuje status z API do formatu UI
   * @param {string} status - Status z API
   * @returns {string} - Status dla UI
   */
  export const convertStatusToUI = (status) => {
    if (status === 'in-progress') return 'inProgress';
    return status;
  };
  
  /**
   * Konwertuje status z UI do formatu API
   * @param {string} status - Status z UI
   * @returns {string} - Status dla API
   */
  export const convertStatusToAPI = (status) => {
    if (status === 'inProgress') return 'in-progress';
    return status;
  };
  
  /**
   * Określa kolor dla danej kategorii
   * @param {string} category - Nazwa kategorii
   * @returns {string} - Nazwa koloru dla kategorii
   */
  export const getCategoryColor = (category) => {
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