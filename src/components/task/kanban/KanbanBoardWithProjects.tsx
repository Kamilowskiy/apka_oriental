import { useState, useCallback, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Column from "./Column";
import { Task } from "./types/types";
import api from "../../../utils/axios-config";
import { 
  convertToUIProject, 
  convertStatusToAPI 
} from "../../../utils/projectServiceAdapter";
import { deleteProject } from "../../../services/projectService";
import { FilterOptions, TaskGroupKey } from "../../../components/task/TaskHeader";

interface KanbanBoardProps {
  onStatusChange?: (taskId: string, newStatus: string) => void;
  onNotification?: (message: string, type: 'success' | 'error') => void;
  filters?: FilterOptions;
  selectedTaskGroup?: TaskGroupKey;
  onTaskCountsChange?: (counts: { [key in TaskGroupKey]: number }) => void;
}

const KanbanBoardWithProjects: React.FC<KanbanBoardProps> = ({ 
  onStatusChange,
  onNotification,
  filters = { priority: 'all', category: 'all', sortBy: 'newest' },
  selectedTaskGroup = 'All',
  onTaskCountsChange
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [taskCounts, setTaskCounts] = useState({
    todo: 0,
    inProgress: 0,
    completed: 0,
    all: 0
  });

  // Fetch projects from API
  const fetchProjects = useCallback(async () => {
    if (fetchAttempted && error) {
      return;
    }

    try {
      setLoading(true);
      setFetchAttempted(true);
      
      const response = await api.get('/api/projects');
      const projectsData = response.data.projects || [];
      
      // Convert to UI project format
      const formattedProjects = projectsData.map((project: any) => convertToUIProject(project));
      
      setTasks(formattedProjects);
      
      // Update task group counts
      const counts = {
        todo: formattedProjects.filter((task: Task) => task.status === 'todo').length,
        inProgress: formattedProjects.filter((task: Task) => task.status === 'inProgress').length,
        completed: formattedProjects.filter((task: Task) => task.status === 'completed').length,
        all: formattedProjects.length
      };
      setTaskCounts(counts);
      
      setError(null);
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [error, fetchAttempted]);

  // Apply filters and group selection when tasks or filters change
  useEffect(() => {
    if (tasks.length === 0) return;
    
    let result = [...tasks];
    
    const counts = {
      All: tasks.length,
      Todo: tasks.filter((task: Task) => task.status === 'todo').length,
      InProgress: tasks.filter((task: Task) => task.status === 'inProgress').length,
      Completed: tasks.filter((task: Task) => task.status === 'completed').length
    };
    
    // Call callback with new counts
    if (onTaskCountsChange) {
      onTaskCountsChange(counts);
    }
    
    // First apply filtering by selected task group
    if (selectedTaskGroup !== 'All') {
      switch (selectedTaskGroup) {
        case 'Todo':
          result = result.filter((task: Task) => task.status === 'todo');
          break;
        case 'InProgress':
          result = result.filter((task: Task) => task.status === 'inProgress');
          break;
        case 'Completed':
          result = result.filter((task: Task) => task.status === 'completed');
          break;
      }
    }
    
    // Then apply detailed filters
    
    // Apply priority filter
    if (filters.priority !== 'all') {
      result = result.filter((task: Task) => task.priority === filters.priority);
    }
    
    // Apply category filter
    if (filters.category !== 'all') {
      result = result.filter((task: Task) => task.category.name === filters.category);
    }
    
    // Apply sorting
    switch (filters.sortBy) {
      case 'newest':
        result = result.sort((a: Task, b: Task) => {
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'oldest':
        result = result.sort((a: Task, b: Task) => {
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
          return dateA - dateB;
        });
        break;
      case 'nameAsc':
        result = result.sort((a: Task, b: Task) => a.title.localeCompare(b.title));
        break;
      case 'nameDesc':
        result = result.sort((a: Task, b: Task) => b.title.localeCompare(a.title));
        break;
      case 'priceAsc':
        result = result.sort((a: Task, b: Task) => (a.price || 0) - (b.price || 0));
        break;
      case 'priceDesc':
        result = result.sort((a: Task, b: Task) => (b.price || 0) - (a.price || 0));
        break;
      default:
        // Default sort by newest
        result = result.sort((a: Task, b: Task) => {
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
          return dateB - dateA;
        });
    }

    setFilteredTasks(result);
  }, [tasks, filters, selectedTaskGroup, onTaskCountsChange]);

  // Fetch projects on initial render
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Implementation of the moveTask function to match Column component's expected signature
  const moveTask = useCallback((dragIndex: number, hoverIndex: number, status: string) => {
    setFilteredTasks(prevTasks => {
      // Get tasks from the specified column
      const columnTasks = prevTasks.filter((task: Task) => task.status === status);
      
      if (dragIndex < 0 || dragIndex >= columnTasks.length || 
          hoverIndex < 0 || hoverIndex >= columnTasks.length) {
        return prevTasks; // Invalid indices
      }
      
      // Get the task being moved
      const dragTask = columnTasks[dragIndex];
      
      // Create a copy of all tasks except the one being moved
      const tasksWithoutDrag = prevTasks.filter((task: Task) => task.id !== dragTask.id);
      
      // Find where to insert the task
      const columnTasksWithoutDrag = tasksWithoutDrag.filter((task: Task) => task.status === status);
      let insertIndex = 0;
      
      if (columnTasksWithoutDrag.length > 0) {
        const firstTaskIndex = tasksWithoutDrag.findIndex((task: Task) => task.status === status);
        if (firstTaskIndex !== -1) {
          insertIndex = firstTaskIndex + Math.min(hoverIndex, columnTasksWithoutDrag.length);
        }
      }
      
      // Create new task array with the task inserted at the correct position
      const result = [...tasksWithoutDrag];
      result.splice(insertIndex, 0, dragTask);
      
      return result;
    });
  }, []);
  
  // Function to handle changing task status (used by changeTaskStatus and other functions)
  const handleTaskStatusChange = useCallback(async (taskId: string, newStatus: string, targetIndex = -1) => {
    // Function to handle changing task status (used by changeTaskStatus and other functions)
  const handleTaskStatusChange = useCallback(async (taskId: string, newStatus: string, targetIndex = -1) => {
    setFilteredTasks((prevTasks) => {
      const taskToUpdate = prevTasks.find((task: Task) => task.id === taskId);
      
      if (!taskToUpdate) {
        return prevTasks;
      }
      
      // Find all tasks from the target column
      const targetColumnTasks = prevTasks.filter((task: Task) => task.status === newStatus);
      // Find all other tasks
      const otherTasks = prevTasks.filter((task: Task) => task.id !== taskId);
      
      // Update task status
      const updatedTask = { ...taskToUpdate, status: newStatus };
      
      // If targetIndex is not specified or is invalid, add to the end
      if (targetIndex < 0 || targetIndex > targetColumnTasks.length) {
        return [...otherTasks, updatedTask];
      }
      
      // Insert task at the specified position in the target column
      const result = [...otherTasks];
      
      // Find the index where to insert the task - at the beginning of the target column
      let insertionIndex = 0;
      
      // If there are already tasks in the target column, find the proper index
      if (targetColumnTasks.length > 0) {
        // Find the index of the first task from the target column
        const firstTaskIndex = result.findIndex((task: Task) => task.status === newStatus);
        
        if (firstTaskIndex !== -1) {
          // Insert at the specified position within the column
          insertionIndex = firstTaskIndex + targetIndex;
        }
      }
      
      // Insert task at the specified position
      result.splice(insertionIndex, 0, updatedTask);
      
      return result;
    });
    
    // Also update the original tasks array
    setTasks(prevTasks => 
      prevTasks.map((task: Task) => 
        task.id === taskId ? {...task, status: newStatus} : task
      )
    );
    
    // Call the callback if provided
    if (onStatusChange) {
      onStatusChange(taskId, newStatus);
    } else {
      // If callback is not provided, update status directly
      try {
        // Convert UI status to API format
        const apiStatus = convertStatusToAPI(newStatus);
        
        // Update status in API
        await api.patch(`/api/projects/${taskId}/status`, { status: apiStatus });
        
        // Show success notification
        if (onNotification) {
          onNotification(`Project status changed to "${newStatus}"`, 'success');
        }
      } catch (error) {
        console.error("Error updating status:", error);
        
        // Show error notification
        if (onNotification) {
          onNotification("An error occurred while updating project status", 'error');
        }
        
        // Manual refresh - but only once
        if (!fetchAttempted) {
          fetchProjects();
        }
      }
    }
  }, [onStatusChange, fetchProjects, fetchAttempted, onNotification]);
  
  // Public changeTaskStatus function that interfaces with Column component
  const changeTaskStatus = useCallback((taskId: string, newStatus: string, targetIndex = -1) => {
    handleTaskStatusChange(taskId, newStatus, targetIndex);
  }, [handleTaskStatusChange]);
    
    // Call the callback if provided
    if (onStatusChange) {
      onStatusChange(taskId, newStatus);
    } else {
      // If callback is not provided, update status directly
      try {
        // Convert UI status to API format
        const apiStatus = convertStatusToAPI(newStatus);
        
        // Update status in API
        await api.patch(`/api/projects/${taskId}/status`, { status: apiStatus });
        
        // Show success notification
        if (onNotification) {
          onNotification(`Project status changed to "${newStatus}"`, 'success');
        }
      } catch (error) {
        console.error("Error updating status:", error);
        
        // Show error notification
        if (onNotification) {
          onNotification("An error occurred while updating project status", 'error');
        }
        
        // Manual refresh - but only once
        if (!fetchAttempted) {
          fetchProjects();
        }
      }
    }
  }, [onStatusChange, fetchProjects, fetchAttempted, onNotification]);

  // Handle dropping onto an empty column
  const handleDropInColumn = useCallback(async (taskId: string, columnStatus: string) => {
    try {
      // First update UI for better UX
      setFilteredTasks(prevTasks => 
        prevTasks.map((task: Task) => 
          task.id === taskId ? {...task, status: columnStatus} : task
        )
      );
      
      // Also update the original tasks array
      setTasks(prevTasks => 
        prevTasks.map((task: Task) => 
          task.id === taskId ? {...task, status: columnStatus} : task
        )
      );
      
      // Convert UI status to API format
      const apiStatus = convertStatusToAPI(columnStatus);
      
      // Then update in API
      await api.patch(`/api/projects/${taskId}/status`, { status: apiStatus });
      
      // Show success notification
      if (onNotification) {
        onNotification(`Project status changed to "${columnStatus}"`, 'success');
      }
    } catch (error) {
      console.error("Error updating status:", error);
      
      // Revert UI change on error
      setFilteredTasks(prevTasks => {
        const originalTask = tasks.find((task: Task) => task.id === taskId);
        if (!originalTask) return prevTasks;
        
        return prevTasks.map((task: Task) => 
          task.id === taskId ? originalTask : task
        );
      });
      
      // Show error notification
      if (onNotification) {
        onNotification("An error occurred while updating project status", 'error');
      }
    }
  }, [onNotification, tasks]);
  
  // We need a way to find the task ID from the index within a column
  const getTaskIdFromColumnIndex = useCallback((index: number, status: string) => {
    const columnTasks = filteredTasks.filter((task: Task) => task.status === status);
    if (index >= 0 && index < columnTasks.length) {
      return columnTasks[index].id;
    }
    return null;
  }, [filteredTasks]);

  // Function to delete a project
  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
      // Delete project from API
      await deleteProject(parseInt(projectId));
      
      // Remove project from local state
      setTasks(prevTasks => prevTasks.filter((task: Task) => task.id !== projectId));
      setFilteredTasks(prevTasks => prevTasks.filter((task: Task) => task.id !== projectId));
      
      // Show notification
      if (onNotification) {
        onNotification('Project was successfully deleted', 'success');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      
      // Show error notification
      if (onNotification) {
        onNotification('An error occurred while deleting the project', 'error');
      }
    }
  }, [onNotification]);

  // Manual data refresh
  const handleRefresh = () => {
    setFetchAttempted(false);
    setError(null);
    fetchProjects();
    
    // Show notification
    if (onNotification) {
      onNotification('Project list has been refreshed', 'success');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error && filteredTasks.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="text-red-500 text-center mb-4">{error}</div>
        <button 
          onClick={handleRefresh}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  // If there are no tasks, show a message
  if (filteredTasks.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-gray-500 text-center">
          <p className="mb-4 text-lg">No projects to display</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 border-t border-gray-200 divide-x divide-gray-200 dark:divide-white/[0.05] mt-7 dark:border-white/[0.05] sm:mt-0 sm:grid-cols-2 xl:grid-cols-3">
        <Column
          title="To Do"
          tasks={filteredTasks.filter((task) => task.status === "todo")}
          status="todo"
          moveTask={moveTask}
          changeTaskStatus={(sourceIndex, targetStatus) => {
            const taskId = getTaskIdFromColumnIndex(sourceIndex, "todo");
            if (taskId) {
              handleTaskStatusChange(taskId, targetStatus);
            }
          }}
          onDropInColumn={handleDropInColumn}
          onDeleteProject={handleDeleteProject}
          onProjectUpdate={handleRefresh}
        />
        <Column
          title="In Progress"
          tasks={filteredTasks.filter((task) => task.status === "inProgress")}
          status="inProgress"
          moveTask={moveTask}
          changeTaskStatus={(sourceIndex, targetStatus) => {
            const taskId = getTaskIdFromColumnIndex(sourceIndex, "inProgress");
            if (taskId) {
              handleTaskStatusChange(taskId, targetStatus);
            }
          }}
          onDropInColumn={handleDropInColumn}
          onDeleteProject={handleDeleteProject}
          onProjectUpdate={handleRefresh}
        />
        <Column
          title="Completed"
          tasks={filteredTasks.filter((task) => task.status === "completed")}
          status="completed"
          moveTask={moveTask}
          changeTaskStatus={(sourceIndex, targetStatus) => {
            const taskId = getTaskIdFromColumnIndex(sourceIndex, "completed");
            if (taskId) {
              handleTaskStatusChange(taskId, targetStatus);
            }
          }}
          onDropInColumn={handleDropInColumn}
          onDeleteProject={handleDeleteProject}
          onProjectUpdate={handleRefresh}
        />
      </div>
    </DndProvider>
  );
};

export default KanbanBoardWithProjects;