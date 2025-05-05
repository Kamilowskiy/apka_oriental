// src/components/task/kanban/KanbanBoardWithProjects.tsx
import { useState, useCallback, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Column from "./Column";
import { Task } from "./types/types";
import api from "../../../utils/axios-config";
import { 
  convertToUIProject, 
  convertStatusToUI, 
  convertStatusToAPI
} from "../../../utils/projectServiceAdapter";
import { deleteProject } from "../../../services/projectService";

interface KanbanBoardProps {
  onStatusChange?: (taskId: string, newStatus: string) => void;
  onNotification?: (message: string, type: 'success' | 'error') => void;
}

const KanbanBoardWithProjects: React.FC<KanbanBoardProps> = ({ 
  onStatusChange,
  onNotification
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Flag to track if we've already attempted to fetch
  const [fetchAttempted, setFetchAttempted] = useState(false);

  // Fetch projects from API
  const fetchProjects = useCallback(async () => {
    // If we've already tried to fetch and got an error, don't try again automatically
    if (fetchAttempted && error) {
      return;
    }

    try {
      setLoading(true);
      setFetchAttempted(true); // Mark that we've attempted to fetch data
      
      const response = await api.get('/api/projects');
      const projectsData = response.data.projects || [];
      
      // Convert to UI project format
      const formattedProjects = projectsData.map((project: any) => convertToUIProject(project));
      
      setTasks(formattedProjects);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      
      // Set error message
      setError("Failed to load projects. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [error, fetchAttempted]);

  // Fetch projects on initial render
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Move tasks within a column (change order)
  const moveTask = useCallback((dragIndex: number, hoverIndex: number, status: string) => {
    setTasks((prevTasks) => {
      // Find all tasks in the given column
      const columnTasks = prevTasks.filter(task => task.status === status);
      // Find all tasks from other columns
      const otherTasks = prevTasks.filter(task => task.status !== status);
      
      // Move task within the column
      const draggedTask = columnTasks[dragIndex];
      
      // Create a new array of tasks for the column, removing the dragged task
      const newColumnTasks = [...columnTasks];
      newColumnTasks.splice(dragIndex, 1);
      
      // Insert the task at the new position
      newColumnTasks.splice(hoverIndex, 0, draggedTask);
      
      // Return combined arrays
      return [...otherTasks, ...newColumnTasks];
    });
  }, []);

  // Change task status (move to another column)
  const changeTaskStatus = useCallback(async (taskId: string, newStatus: string, targetIndex = -1) => {
    setTasks((prevTasks) => {
      const taskToUpdate = prevTasks.find(task => task.id === taskId);
      
      if (!taskToUpdate) {
        return prevTasks;
      }
      
      // Find all tasks from the target column
      const targetColumnTasks = prevTasks.filter(task => task.status === newStatus);
      // Find all other tasks
      const otherTasks = prevTasks.filter(task => task.id !== taskId);
      
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
        const firstTaskIndex = result.findIndex(task => task.status === newStatus);
        
        if (firstTaskIndex !== -1) {
          // Insert at the specified position within the column
          insertionIndex = firstTaskIndex + targetIndex;
        }
      }
      
      // Insert task at the specified position
      result.splice(insertionIndex, 0, updatedTask);
      
      return result;
    });
    
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
      setTasks(prevTasks => 
        prevTasks.map(task => 
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
      setTasks(prevTasks => {
        const originalTask = prevTasks.find(task => task.id === taskId);
        if (!originalTask) return prevTasks;
        
        return prevTasks.map(task => 
          task.id === taskId ? {...originalTask, status: originalTask.status} : task
        );
      });
      
      // Show error notification
      if (onNotification) {
        onNotification("An error occurred while updating project status", 'error');
      }
    }
  }, [onNotification]);

  // Function to delete a project
  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
      // Delete project from API
      await deleteProject(parseInt(projectId));
      
      // Remove project from local state
      setTasks(prevTasks => prevTasks.filter(task => task.id !== projectId));
      
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
    setFetchAttempted(false); // Reset flag to allow re-fetching
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

  if (error && tasks.length === 0) {
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
  if (tasks.length === 0) {
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
          tasks={tasks.filter((task) => task.status === "todo")}
          status="todo"
          moveTask={moveTask}
          changeTaskStatus={changeTaskStatus}
          onDropInColumn={handleDropInColumn}
          onDeleteProject={handleDeleteProject}
          onProjectUpdate={handleRefresh}
        />
        <Column
          title="In Progress"
          tasks={tasks.filter((task) => task.status === "inProgress")}
          status="inProgress"
          moveTask={moveTask}
          changeTaskStatus={changeTaskStatus}
          onDropInColumn={handleDropInColumn}
          onDeleteProject={handleDeleteProject}
          onProjectUpdate={handleRefresh}
        />
        <Column
          title="Completed"
          tasks={tasks.filter((task) => task.status === "completed")}
          status="completed"
          moveTask={moveTask}
          changeTaskStatus={changeTaskStatus}
          onDropInColumn={handleDropInColumn}
          onDeleteProject={handleDeleteProject}
          onProjectUpdate={handleRefresh}
        />
      </div>
    </DndProvider>
  );
};

export default KanbanBoardWithProjects;