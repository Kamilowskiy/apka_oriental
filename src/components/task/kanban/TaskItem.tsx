// src/components/task/kanban/TaskItem.tsx - dodanie linku do strony zadań
import { useRef } from "react";
import { Link } from "react-router-dom";
import { useDrag, useDrop } from "react-dnd";
import { Task, DropResult } from "./types/types";

interface TaskItemProps {
  task: Task;
  index: number;
  moveTask: (dragIndex: number, hoverIndex: number) => void;
  changeTaskStatus: (taskId: string, newStatus: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  index,
  moveTask,
  changeTaskStatus,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<
    Task,
    DropResult,
    { handlerId: string | symbol | null }
  >({
    accept: "task",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    drop: () => ({ name: task.status }),
    hover(item: any, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveTask(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag<
    Task,
    DropResult,
    { isDragging: boolean }
  >({
    type: "task",
    item: () => {
      return { ...task, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (dropResult) {
        changeTaskStatus(item.id, dropResult.name);
      }
    },
  });

  const opacity = isDragging ? 0.3 : 1;
  drag(drop(ref));

  // Function to get priority badge style
  const getPriorityBadge = () => {
    if (!task.priority) return null;
    
    const priorityStyles = {
      high: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
      medium: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
      low: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
    };
    
    const priorityText = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    
    return (
      <span className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-theme-xs font-medium ${priorityStyles[task.priority]}`}>
        {priorityText}
      </span>
    );
  };

  return (
    <div
      ref={ref}
      style={{ opacity }}
      className="relative p-5 bg-white border border-gray-200 task rounded-xl shadow-theme-sm dark:border-gray-800 dark:bg-white/5"
      data-handler-id={handlerId}
    >
      <div className="space-y-4">
        <div>
          <div className="flex items-center mb-2">
            <h4 className="mr-2 text-base text-gray-800 dark:text-white/90">
              {task.title}
            </h4>
            {task.priority && getPriorityBadge()}
          </div>
          
          {task.projectDesc && (
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              {task.projectDesc}
            </p>
          )}
          
          {task.projectImg && (
            <div className="my-4">
              <img
                src={task.projectImg}
                alt="task"
                className="overflow-hidden rounded-xl border-[0.5px] border-gray-200 dark:border-gray-800"
              />
            </div>
          )}
          
          {/* Task details */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
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
              {task.dueDate}
            </span>
            
            {task.comments !== undefined && task.comments > 0 && (
              <span className="flex items-center gap-1 text-sm text-gray-500 cursor-pointer dark:text-gray-400">
                <svg
                  className="stroke-current"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 15.6343C12.6244 15.6343 15.5625 12.6961 15.5625 9.07178C15.5625 5.44741 12.6244 2.50928 9 2.50928C5.37563 2.50928 2.4375 5.44741 2.4375 9.07178C2.4375 10.884 3.17203 12.5246 4.35961 13.7122L2.4375 15.6343H9Z"
                    stroke=""
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
                {task.comments}
              </span>
            )}
            
            {task.links !== undefined && task.links > 0 && (
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
                    d="M6.88066 3.10905C8.54039 1.44932 11.2313 1.44933 12.8911 3.10906C14.5508 4.76878 14.5508 7.45973 12.8911 9.11946L12.0657 9.94479L11.0051 8.88413L11.8304 8.0588C12.9043 6.98486 12.9043 5.24366 11.8304 4.16972C10.7565 3.09577 9.01526 3.09577 7.94132 4.16971L7.11599 4.99504L6.05533 3.93438L6.88066 3.10905ZM8.88376 11.0055L9.94442 12.0661L9.11983 12.8907C7.4601 14.5504 4.76915 14.5504 3.10942 12.8907C1.44969 11.231 1.44969 8.54002 3.10942 6.88029L3.93401 6.0557L4.99467 7.11636L4.17008 7.94095C3.09614 9.01489 3.09614 10.7561 4.17008 11.83C5.24402 12.904 6.98522 12.904 8.05917 11.83L8.88376 11.0055ZM9.94458 7.11599C10.2375 6.8231 10.2375 6.34823 9.94458 6.05533C9.65169 5.76244 9.17682 5.76244 8.88392 6.05533L6.0555 8.88376C5.7626 9.17665 5.7626 9.65153 6.0555 9.94442C6.34839 10.2373 6.82326 10.2373 7.11616 9.94442L9.94458 7.11599Z"
                    fill=""
                  />
                </svg>
                {task.links}
              </span>
            )}
            
            {task.estimatedHours && (
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
                {task.estimatedHours}h
              </span>
            )}
          </div>
          
          {/* Project price */}
          {task.price && (
            <div className="flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400 mb-3">
              <svg
                className="fill-current"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 0.5C3.86 0.5 0.5 3.86 0.5 8C0.5 12.14 3.86 15.5 8 15.5C12.14 15.5 15.5 12.14 15.5 8C15.5 3.86 12.14 0.5 8 0.5ZM8 14C4.69 14 2 11.31 2 8C2 4.69 4.69 2 8 2C11.31 2 14 4.69 14 8C14 11.31 11.31 14 8 14ZM9.25 4H7.25V8.52L10.52 10.52L11.25 9.25L8.5 7.61V4H9.25Z"
                  fill="currentColor"
                />
              </svg>
              {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(task.price)}
            </div>
          )}
          
          {/* Category */}
          <span
            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-theme-xs font-medium ${getCategoryStyles(
              task.category.color
            )}`}
          >
            {task.category.name}
          </span>
          
          {/* Tags */}
          {task.tags && (
            <div className="mt-3 flex flex-wrap gap-1">
              {task.tags.split(',').map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex rounded-full px-2 py-0.5 text-theme-xs font-medium bg-gray-100 text-gray-700 dark:bg-white/[0.03] dark:text-white/80"
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}
          
          {/* Link do zadań projektu */}
          <div className="mt-3">
            <Link
              to={`/project-tasks/${task.id}`}
              className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="fill-current"
              >
                <path
                  d="M14.4 0H1.6C0.72 0 0 0.72 0 1.6V14.4C0 15.28 0.72 16 1.6 16H14.4C15.28 16 16 15.28 16 14.4V1.6C16 0.72 15.28 0 14.4 0ZM14.4 14.4H1.6V1.6H14.4V14.4ZM11.2 12H4.8V10.4H11.2V12ZM11.2 8.8H4.8V7.2H11.2V8.8ZM11.2 5.6H4.8V4H11.2V5.6Z"
                />
              </svg>
              Zobacz zadania
            </Link>
          </div>
        </div>
      </div>
      
      {/* Assigned to */}
      <div className="absolute top-5 right-5 h-6 w-full max-w-6 overflow-hidden rounded-full border-[0.5px] border-gray-200 dark:border-gray-800">
        <img src={task.assignee} alt="user" />
      </div>
    </div>
  );
};

const getCategoryStyles = (color: string) => {
  switch (color) {
    case "error":
      return "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400";
    case "success":
      return "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400";
    case "brand":
      return "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400";
    case "orange":
      return "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400";
    case "purple":
      return "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400";
  }
};

export default TaskItem;