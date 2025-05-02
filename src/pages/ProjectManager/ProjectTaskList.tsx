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
import { HorizontaLDots } from "../../icons";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../components/ui/dropdown/DropdownItem";

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
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  
  // State for task lanes
  const [tasksByStatus, setTasksByStatus] = useState<{
    todo: Task[];
    'in-progress': Task[];
    completed: Task[];
  }>({
    todo: [],
    'in-progress': [],
    completed: []
  });
  
  // State for new task
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assigned_to: '',
    estimated_hours: '',
    due_date: ''
  });

  // Fetch project and its tasks
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        
        // Fetch project data
        const projectResponse = await api.get(`/api/projects/${projectId}`);
        setProject(projectResponse.data);
        
        // Fetch project tasks
        const tasksResponse = await api.get(`/api/project-tasks/project/${projectId}`);
        const tasksData = tasksResponse.data.tasks || [];
        setTasks(tasksData);
        
        // Group tasks by status
        const groupedTasks = {
          todo: tasksData.filter((task: Task) => task.status === 'todo'),
          'in-progress': tasksData.filter((task: Task) => task.status === 'in-progress'),
          completed: tasksData.filter((task: Task) => task.status === 'completed')
        };
        setTasksByStatus(groupedTasks);
        
        setError(null);
      } catch (err: any) {
        console.error("Error fetching project data:", err);
        setError(err.response?.data?.error || "An error occurred while fetching project data");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  // Handle input change for new task
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTask({ ...newTask, [name]: value });
  };

  // Handle description change
  const handleDescriptionChange = (value: string) => {
    setNewTask({ ...newTask, description: value });
  };

  // Add new task
  const handleAddTask = async () => {
    try {
      if (!newTask.title) {
        alert("Task title is required");
        return;
      }

      const taskData = {
        ...newTask,
        project_id: projectId,
        estimated_hours: newTask.estimated_hours ? parseInt(newTask.estimated_hours) : null
      };

      const response = await api.post('/api/project-tasks', taskData);
      const newTaskData = response.data;
      
      // Add new task to tasks array and update grouped tasks
      setTasks(prevTasks => [newTaskData, ...prevTasks]);
      setTasksByStatus(prevGrouped => ({
        ...prevGrouped,
        [newTaskData.status]: [newTaskData, ...prevGrouped[newTaskData.status as keyof typeof prevGrouped]]
      }));
      
      // Reset form and close modal
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
      console.error('Error adding task:', error);
      alert('An error occurred while adding the task');
    }
  };

  // Change task status
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await api.patch(`/api/project-tasks/${taskId}/status`, { status: newStatus });
      
      // Find the task to update
      const taskToUpdate = tasks.find(task => task.id === taskId);
      if (!taskToUpdate) return;
      
      // Update local task list
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus as 'todo' | 'in-progress' | 'completed' } : task
      );
      setTasks(updatedTasks);
      
      // Update grouped tasks
      setTasksByStatus(prevGrouped => {
        // Remove from previous status group
        const oldStatus = taskToUpdate.status;
        const updatedOld = prevGrouped[oldStatus].filter(task => task.id !== taskId);
        
        // Add to new status group with updated status
        const updatedTask = { ...taskToUpdate, status: newStatus as 'todo' | 'in-progress' | 'completed' };
        const updatedNew = [updatedTask, ...prevGrouped[newStatus as keyof typeof prevGrouped]];
        
        return {
          ...prevGrouped,
          [oldStatus]: updatedOld,
          [newStatus]: updatedNew
        };
      });
      
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('An error occurred while updating task status');
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }
    
    try {
      await api.delete(`/api/project-tasks/${taskId}`);
      
      // Find the task to delete
      const taskToDelete = tasks.find(task => task.id === taskId);
      if (!taskToDelete) return;
      
      // Remove task from tasks array
      setTasks(tasks.filter(task => task.id !== taskId));
      
      // Remove task from grouped tasks
      setTasksByStatus(prevGrouped => {
        const status = taskToDelete.status;
        return {
          ...prevGrouped,
          [status]: prevGrouped[status].filter(task => task.id !== taskId)
        };
      });
      
      // Close dropdown if open
      setDropdownOpen(null);
      
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('An error occurred while deleting the task');
    }
  };

  // Toggle task checkbox
  const handleToggleChecked = async (taskId: string) => {
    // Find the task
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Determine new status
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    
    // Update status
    await handleStatusChange(taskId, newStatus);
  };

  // Handle dropdown toggle
  const toggleDropdown = (taskId: string) => {
    setDropdownOpen(dropdownOpen === taskId ? null : taskId);
  };

  // Close dropdown
  const closeDropdown = () => {
    setDropdownOpen(null);
  };

  // Helper function - format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  // Helper function - get status title
  const getStatusTitle = (status: string) => {
    switch (status) {
      case 'todo': return 'To Do';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
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
          Back to Projects
        </Button>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-500 mb-4">Project not found</p>
        <Button onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageMeta
        title={`Project Tasks: ${project.service_name} | Business Manager`}
        description="Manage project tasks"
      />
      <div className="flex justify-between items-center mb-6">
        <PageBreadcrumb pageTitle={`Project Tasks: ${project.service_name}`} />
        <Button onClick={() => navigate('/projects')}>
          ← Wróc do projektów
        </Button>
      </div>
      
      {/* Project Information */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{project.service_name}</h2>
            {project.client && (
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Client: <span className="font-medium">{project.client.company_name}</span>
              </p>
            )}
            <div className="flex flex-wrap gap-2 mb-2">
              {project.status && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  project.status === 'todo' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                  project.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-800/20 dark:text-blue-400' :
                  'bg-green-100 text-green-700 dark:bg-green-800/20 dark:text-green-400'
                }`}>
                  {project.status === 'todo' ? 'To Do' : 
                   project.status === 'in-progress' ? 'In Progress' : 'Completed'}
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-800/20 dark:text-blue-400">
                {project.price ? `${project.price.toLocaleString('pl-PL')} PLN` : 'No price'}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end mt-4 md:mt-0">
            <div className="flex gap-2">
              <span className="text-gray-600 dark:text-gray-300">Start:</span>
              <span className="font-medium text-gray-600 dark:text-gray-300">{formatDate(project.start_date)}</span>
            </div>
            {project.end_date && (
              <div className="flex gap-2">
                <span className="text-gray-600 dark:text-gray-300">Koniec:</span>
                <span className="font-medium text-gray-600 dark:text-gray-300">{formatDate(project.end_date)}</span>
              </div>
            )}
          </div>
        </div>
        {project.description && (
          <div className="mt-4 border-t pt-4 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Opis Projektu</h3>
            <p className="text-gray-600 dark:text-gray-300">{project.description}</p>
          </div>
        )}
      </div>
      
      {/* Task Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Lista Zadań</h3>
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
      
      {/* Task Lanes */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-4 space-y-8 xl:p-6">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <div key={status}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="flex items-center gap-3 text-base font-medium text-gray-800 capitalize dark:text-white/90">
                  {getStatusTitle(status)}
                  <span
                    className={`
                    inline-flex rounded-full px-2 py-0.5 text-theme-xs font-medium 
                    ${
                      status === "todo"
                        ? "bg-gray-100 text-gray-700 dark:bg-white/[0.03] dark:text-white/80 "
                        : status === "in-progress"
                        ? "text-warning-700 bg-warning-50 dark:bg-warning-500/15 dark:text-orange-400"
                        : status === "completed"
                        ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500"
                        : ""
                    }
                  `}
                  >
                    {statusTasks.length}
                  </span>
                </h3>
                <div className="relative">
                  <button onClick={() => toggleDropdown(status)} className="dropdown-toggle">
                    <HorizontaLDots className="text-gray-400 hover:text-gray-700 size-6 dark:hover:text-gray-300" />
                  </button>
                  <Dropdown
                    isOpen={dropdownOpen === status}
                    onClose={closeDropdown}
                    className="absolute right-0 top-full z-40 w-[140px] space-y-1 rounded-2xl border border-gray-200 bg-white p-2 shadow-theme-md dark:border-gray-800 dark:bg-gray-dark"
                  >
                    <DropdownItem
                      onItemClick={closeDropdown}
                      className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                    >
                      Edytuj
                    </DropdownItem>
                    <DropdownItem
                      onItemClick={closeDropdown}
                      className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                    >
                      Wysczyść wszysko
                    </DropdownItem>
                  </Dropdown>
                </div>
              </div>
              
              {statusTasks.length === 0 ? (
                <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                  Brak zadań w tej kategoii
                </div>
              ) : (
                statusTasks.map((task) => (
                  <div
                    key={task.id}
                    id={`task-${task.id}`}
                    className="p-5 mb-4 bg-white border border-gray-200 task rounded-xl shadow-theme-sm dark:border-gray-800 dark:bg-white/5"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex items-start w-full gap-4">
                        <span className="text-gray-400">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M2.43311 5.0001C2.43311 4.50304 2.83605 4.1001 3.33311 4.1001L16.6664 4.1001C17.1635 4.1001 17.5664 4.50304 17.5664 5.0001C17.5664 5.49715 17.1635 5.9001 16.6664 5.9001L3.33311 5.9001C2.83605 5.9001 2.43311 5.49716 2.43311 5.0001ZM2.43311 15.0001C2.43311 14.503 2.83605 14.1001 3.33311 14.1001L16.6664 14.1001C17.1635 14.1001 17.5664 14.503 17.5664 15.0001C17.5664 15.4972 17.1635 15.9001 16.6664 15.9001L3.33311 15.9001C2.83605 15.9001 2.43311 15.4972 2.43311 15.0001ZM3.33311 9.1001C2.83605 9.1001 2.43311 9.50304 2.43311 10.0001C2.43311 10.4972 2.83605 10.9001 3.33311 10.9001L16.6664 10.9001C17.1635 10.9001 17.5664 10.4972 17.5664 10.0001C17.5664 9.50304 17.1635 9.1001 16.6664 9.1001L3.33311 9.1001Z"
                              fill="currentColor"
                            />
                          </svg>
                        </span>

                        <label
                          htmlFor={`taskCheckbox${task.id}`}
                          className="w-full cursor-pointer"
                        >
                          <div className="relative flex items-start">
                            <input
                              type="checkbox"
                              id={`taskCheckbox${task.id}`}
                              className="sr-only taskCheckbox"
                              checked={task.status === 'completed'}
                              onChange={() => handleToggleChecked(task.id)}
                            />
                            <div className="flex items-center justify-center w-full h-5 mr-3 border border-gray-300 rounded-md box max-w-5 dark:border-gray-700">
                              <span className={`opacity-${task.status === 'completed' ? "100" : "0"}`}>
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 14 14"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M11.6668 3.5L5.25016 9.91667L2.3335 7"
                                    stroke="white"
                                    strokeWidth="1.94437"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                            </div>
                            <div>
                              <p className="-mt-0.5 text-base text-gray-800 dark:text-white/90">
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </label>
                      </div>

                      <div className="flex flex-col-reverse items-start justify-end w-full gap-3 xl:flex-row xl:items-center xl:gap-5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-theme-xs font-medium 
                          ${task.priority === 'high' 
                            ? 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400'
                            : task.priority === 'medium'
                            ? 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400'
                            : 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400'
                          }`}
                        >
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>

                        <div className="flex items-center justify-between w-full gap-5 xl:w-auto xl:justify-normal">
                          <div className="flex items-center gap-3">
                            {task.due_date && (
                              <span className="flex items-center gap-1 text-sm text-gray-500 cursor-pointer dark:text-gray-400">
                                <svg
                                  className="fill-current"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M5.33329 1.0835C5.74751 1.0835 6.08329 1.41928 6.08329 1.8335V2.25016L9.91663 2.25016V1.8335C9.91663 1.41928 10.2524 1.0835 10.6666 1.0835C11.0808 1.0835 11.4166 1.41928 11.4166 1.8335V2.25016L12.3333 2.25016C13.2998 2.25016 14.0833 3.03366 14.0833 4.00016V6.00016L14.0833 12.6668C14.0833 13.6333 13.2998 14.4168 12.3333 14.4168L3.66663 14.4168C2.70013 14.4168 1.91663 13.6333 1.91663 12.6668L1.91663 6.00016L1.91663 4.00016C1.91663 3.03366 2.70013 2.25016 3.66663 2.25016L4.58329 2.25016V1.8335C4.58329 1.41928 4.91908 1.0835 5.33329 1.0835ZM5.33329 3.75016L3.66663 3.75016C3.52855 3.75016 3.41663 3.86209 3.41663 4.00016V5.25016L12.5833 5.25016V4.00016C12.5833 3.86209 12.4714 3.75016 12.3333 3.75016L10.6666 3.75016L5.33329 3.75016ZM12.5833 6.75016L3.41663 6.75016L3.41663 12.6668C3.41663 12.8049 3.52855 12.9168 3.66663 12.9168L12.3333 12.9168C12.4714 12.9168 12.5833 12.8049 12.5833 12.6668L12.5833 6.75016Z"
                                    fill=""
                                  />
                                </svg>
                                {formatDate(task.due_date)}
                              </span>
                            )}
                            
                            {task.estimated_hours && (
                              <span className="flex items-center gap-1 text-sm text-gray-500 cursor-pointer dark:text-gray-400">
                                <svg
                                  className="fill-current"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M8 1.33325C4.31811 1.33325 1.33334 4.31802 1.33334 7.99992C1.33334 11.6818 4.31811 14.6666 8 14.6666C11.6819 14.6666 14.6667 11.6818 14.6667 7.99992C14.6667 4.31802 11.6819 1.33325 8 1.33325ZM8 2.83325C10.8535 2.83325 13.1667 5.14642 13.1667 7.99992C13.1667 10.8534 10.8535 13.1666 8 13.1666C5.14651 13.1666 2.83334 10.8534 2.83334 7.99992C2.83334 5.14642 5.14651 2.83325 8 2.83325ZM8 4.33325C8.46024 4.33325 8.83334 4.70635 8.83334 5.16659V7.61631L10.9428 9.72578C11.2682 10.0512 11.2682 10.5721 10.9428 10.8975C10.6173 11.223 10.0964 11.223 9.77097 10.8975L7.41414 8.54067C7.25361 8.38014 7.16667 8.16304 7.16667 7.93742V5.16659C7.16667 4.70635 7.53976 4.33325 8 4.33325Z"
                                    fill=""
                                  />
                                </svg>
                                {task.estimated_hours}h
                              </span>
                            )}
                          </div>

                          <div className="relative">
                            <button onClick={() => toggleDropdown(task.id)} className="dropdown-toggle">
                              <HorizontaLDots className="text-gray-400 hover:text-gray-700 size-6 dark:hover:text-gray-300" />
                            </button>
                            <Dropdown
                              isOpen={dropdownOpen === task.id}
                              onClose={closeDropdown}
                              className="absolute right-0 top-full z-40 w-[140px] space-y-1 rounded-2xl border border-gray-200 bg-white p-2 shadow-theme-md dark:border-gray-800 dark:bg-gray-dark"
                            >
                              <DropdownItem
                                onItemClick={() => {
                                  handleStatusChange(task.id, task.status === 'todo' ? 'in-progress' : task.status === 'in-progress' ? 'completed' : 'todo');
                                  closeDropdown();
                                }}
                                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                              >
                                Change Status
                              </DropdownItem>
                              <DropdownItem
                                onItemClick={() => {
                                  handleDeleteTask(task.id);
                                  closeDropdown();
                                }}
                                className="flex w-full font-normal text-left text-red-500 rounded-lg hover:bg-gray-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-white/5 dark:hover:text-red-300"
                              >
                                Delete
                              </DropdownItem>
                            </Dropdown>
                          </div>
                          
                          {task.assigned_to && (
                            <div className="h-6 w-full max-w-6 flex items-center justify-center rounded-full border-[0.5px] border-gray-200 bg-gray-100 text-xs font-medium dark:border-gray-700 dark:bg-gray-700">
                              {task.assigned_to.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Add Task Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[600px] p-5 lg:p-8 m-4"
      >
        <div className="px-2">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Add New Task
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Enter details for the new project task
          </p>
        </div>

        <form className="flex flex-col">
          <div className="custom-scrollbar max-h-[500px] overflow-y-auto px-2">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Task Title *</Label>
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
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
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
                <Label>Priority</Label>
                <div className="relative z-20 bg-transparent dark:bg-form-input">
                  <select 
                    name="priority" 
                    value={newTask.priority} 
                    onChange={handleInputChange}
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
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
                <Label>Assigned To</Label>
                <Input 
                  type="text" 
                  name="assigned_to" 
                  value={newTask.assigned_to} 
                  onChange={handleInputChange} 
                  placeholder="Name and surname"
                />
              </div>

              <div>
                <Label>Estimated Hours</Label>
                <Input 
                  type="number" 
                  name="estimated_hours" 
                  value={newTask.estimated_hours} 
                  onChange={handleInputChange} 
                  placeholder="0"
                />
              </div>

              <div>
                <Label>Due Date</Label>
                <Input 
                  type="date" 
                  name="due_date" 
                  value={newTask.due_date} 
                  onChange={handleInputChange}
                />
              </div>

              <div className="sm:col-span-2">
                <Label>Task Description</Label>
                <TextArea
                  placeholder="Describe the task details..."
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
              Cancel
            </button>
            <button
              onClick={handleAddTask}
              type="button"
              className="flex w-auto justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Add Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}