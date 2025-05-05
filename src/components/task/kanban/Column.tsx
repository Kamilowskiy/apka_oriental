// src/components/task/kanban/Column.tsx
import { useState } from "react";
import { Task } from "./types/types";
import TaskItem from "./TaskItem";
import { HorizontaLDots } from "../../../icons";
import { Dropdown } from "../../ui/dropdown/Dropdown";
import { DropdownItem } from "../../ui/dropdown/DropdownItem";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface ColumnProps {
  title: string;
  tasks: Task[];
  status: string;
  moveTask: (dragIndex: number, hoverIndex: number, status: string) => void;
  changeTaskStatus: (taskId: string, newStatus: string, targetIndex?: number) => void;
  onDropInColumn: (taskId: string, columnStatus: string) => void;
  onDeleteProject?: (taskId: string) => void;
  onProjectUpdate?: () => void;
}

const Column: React.FC<ColumnProps> = ({
  title,
  tasks,
  status,
  moveTask,
  changeTaskStatus,
  onDropInColumn,
  onDeleteProject,
  onProjectUpdate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  // Funkcja otwierająca modal potwierdzenia
  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
    closeDropdown();
  };

  // Funkcja usuwająca wszystkie projekty w kolumnie
  const clearColumn = () => {
    if (onDeleteProject && tasks.length > 0) {
      // Usunięcie wszystkich zadań w kolumnie
      tasks.forEach(task => {
        onDeleteProject(task.id);
      });
      
      // Zamknięcie modalu
      setIsDeleteModalOpen(false);
    }
  };

  // Tłumaczenia statusów na język polski
  const getStatusTitle = (status: string) => {
    switch (status) {
      case "todo": return "Do zrobienia";
      case "inProgress": return "W trakcie";
      case "completed": return "Ukończone";
      default: return status;
    }
  };

  // Obsługa przeciągnięcia projektu nad kolumnę
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Kluczowe dla umożliwienia upuszczenia
    e.stopPropagation(); // Zapobiega propagacji zdarzenia
    e.dataTransfer.dropEffect = "move";
    
    // Dodaj klasę, gdy przeciągamy nad kolumną
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };
  
  // Obsługa opuszczenia obszaru kolumny podczas przeciągania
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Sprawdź, czy kursor faktycznie opuścił kolumnę, a nie jej dziecko
    const relatedTarget = e.relatedTarget as Node;
    if (!e.currentTarget.contains(relatedTarget)) {
      setIsDragOver(false);
    }
  };

  // Obsługa upuszczenia zadania na kolumnę
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    // Pobierz ID zadania z danych transferu
    const taskId = e.dataTransfer.getData("text/plain");
    console.log("Drop event on column", status, "task ID:", taskId);
    
    if (taskId) {
      // Wywołaj funkcję zmiany statusu przekazaną z rodzica
      onDropInColumn(taskId, status);
    }
  };

  return (
    <div 
      className={`flex flex-col gap-5 p-4 swim-lane xl:p-6 ${isDragOver ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="flex items-center gap-3 text-base font-medium text-gray-800 capitalize dark:text-white/90">
          {title}
          <span
            className={`
              inline-flex rounded-full px-2 py-0.5 text-theme-xs font-medium 
              ${
                status === "todo"
                  ? "bg-gray-100 text-gray-700 dark:bg-white/[0.03] dark:text-white/80 "
                  : status === "inProgress"
                  ? "text-warning-700 bg-warning-50 dark:bg-warning-500/15 dark:text-orange-400"
                  : status === "completed"
                  ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500"
                  : ""
              }
            `}
          >
            {tasks.length}
          </span>
        </h3>
        <div className="relative">
          <button onClick={toggleDropdown} className="dropdown-toggle">
            <HorizontaLDots className="text-gray-400 hover:text-gray-700 size-6 dark:hover:text-gray-300" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="absolute right-0 top-full z-40 w-[200px] space-y-1 rounded-2xl border border-gray-200 bg-white p-2 shadow-theme-md dark:border-gray-800 dark:bg-gray-dark"
          >
            <DropdownItem
              onItemClick={() => {
                if (onProjectUpdate) onProjectUpdate(); 
                closeDropdown();
              }}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.8883 13.5C21.1645 18.3113 17.013 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C16.1006 2 19.6248 4.46819 21.1679 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 8H21.4C21.7314 8 22 7.73137 22 7.4V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Odśwież projekty
              </span>
            </DropdownItem>
            {tasks.length > 0 && (
              <DropdownItem
                onItemClick={openDeleteModal}
                className="flex w-full font-normal text-left text-red-500 rounded-lg hover:bg-gray-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-white/5 dark:hover:text-red-300"
              >
                <span className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.5001 6H3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M18.8332 8.5L18.3732 15.3991C18.1962 18.054 18.1077 19.3815 17.2427 20.1907C16.3777 21 15.0473 21 12.3865 21H11.6136C8.95284 21 7.62244 21 6.75743 20.1907C5.89242 19.3815 5.80393 18.054 5.62693 15.3991L5.16675 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M9.5 11L10 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M14.5 11L14 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M6.5 6C6.55588 6 6.58382 6 6.60915 5.99936C7.43259 5.97849 8.15902 5.45491 8.43922 4.68032C8.44784 4.65649 8.45667 4.62999 8.47434 4.57697L8.57143 4.28571C8.65431 4.03708 8.69575 3.91276 8.75071 3.8072C8.97001 3.38607 9.37574 3.09364 9.84461 3.01877C9.96213 3 10.0932 3 10.3553 3H13.6447C13.9068 3 14.0379 3 14.1554 3.01877C14.6243 3.09364 15.03 3.38607 15.2493 3.8072C15.3043 3.91276 15.3457 4.03708 15.4286 4.28571L15.5257 4.57697C15.5433 4.62992 15.5522 4.65651 15.5608 4.68032C15.841 5.45491 16.5674 5.97849 17.3909 5.99936C17.4162 6 17.4441 6 17.5 6" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  Usuń wszystkie projekty
                </span>
              </DropdownItem>
            )}
          </Dropdown>
        </div>
      </div>
      
      {/* Lista projektów */}
      {tasks.map((task, index) => (
        <TaskItem
          key={task.id}
          task={task}
          index={index}
          moveTask={(dragIndex, hoverIndex) => moveTask(dragIndex, hoverIndex, status)}
          changeTaskStatus={changeTaskStatus}
          onDeleteProject={onDeleteProject}
          onProjectUpdate={onProjectUpdate}
        />
      ))}
      
      {/* Placeholder dla pustej kolumny - obszar do upuszczania */}
      {tasks.length === 0 && (
        <div 
          className={`flex flex-col items-center justify-center h-40 border-2 border-dashed ${
            isDragOver 
              ? 'border-brand-400 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/10' 
              : 'border-gray-300 dark:border-gray-700'
          } rounded-xl text-gray-500 dark:text-gray-400 transition-colors duration-200`}
        >
          <p>Przeciągnij projekt tutaj</p>
          <p className="text-sm mt-1">Kolumna {title}</p>
        </div>
      )}

      {/* Modal potwierdzenia usunięcia wszystkich projektów w kolumnie */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={clearColumn}
        title="Usuwanie wszystkich projektów"
        message={`Czy na pewno chcesz usunąć wszystkie projekty ze statusem "${getStatusTitle(status)}"? Ta operacja jest nieodwracalna.`}
      />
    </div>
  );
};

export default Column;