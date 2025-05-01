// import { useState } from "react";
// import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
// import TaskHeader from "../TaskHeader";
// import KanbanBoardWithProjects from "./KanbanBoardWithProjects";
// import KanbanBoardWithMockData from "./";
// import PageMeta from "../../../components/common/PageMeta";
// import { updateProjectStatus } from "../../../services/projectService";
// import { convertStatusToAPI } from "../../../utils/projectServiceAdapter";

// export default function TaskKanban() {
//   const [updateMessage, setUpdateMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
//   const [useMockData, setUseMockData] = useState(false);

//   Handle status change
//   const handleStatusChange = async (taskId: string, newStatus: string) => {
//     try {
//       If using mock data, just show success message without API call
//       if (useMockData) {
//         const apiStatus = convertStatusToAPI(newStatus);
//         setUpdateMessage({ 
//           text: `Project status updated to: ${apiStatus} (demo mode)`, 
//           type: 'success' 
//         });
        
//         setTimeout(() => {
//           setUpdateMessage(null);
//         }, 3000);
//         return;
//       }
      
//       Convert UI status back to API format
//       const apiStatus = convertStatusToAPI(newStatus);
      
//       Update status in API
//       await updateProjectStatus(parseInt(taskId), apiStatus);
      
//       Show success notification
//       setUpdateMessage({ 
//         text: `Project status successfully updated to: ${apiStatus}`, 
//         type: 'success' 
//       });
      
//       Hide notification after 3 seconds
//       setTimeout(() => {
//         setUpdateMessage(null);
//       }, 3000);
//     } catch (error) {
//       console.error("Error updating project status:", error);
      
//       Show error notification
//       setUpdateMessage({ 
//         text: "An error occurred while updating project status", 
//         type: 'error' 
//       });
      
//       Hide notification after 3 seconds
//       setTimeout(() => {
//         setUpdateMessage(null);
//       }, 3000);
//     }
//   };

//   return (
//     <div>
//       <PageMeta
//         title="Project Management Dashboard | Business Manager"
//         description="Manage projects with Kanban board"
//       />
//       <PageBreadcrumb pageTitle="Kanban Projects" />
      
//       {/* Mode toggle */}
//       <div className="mb-4 flex justify-end">
//         <button
//           onClick={() => setUseMockData(!useMockData)}
//           className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
//         >
//           {useMockData ? "Try API Mode" : "Use Demo Data"}
//         </button>
//       </div>
      
//       {/* Status update notification */}
//       {updateMessage && (
//         <div className={`mb-4 p-4 rounded-lg ${
//           updateMessage.type === 'success' 
//             ? 'bg-green-100 text-green-700 dark:bg-green-800/20 dark:text-green-400' 
//             : 'bg-red-100 text-red-700 dark:bg-red-800/20 dark:text-red-400'
//         }`}>
//           {updateMessage.text}
//         </div>
//       )}
      
//       <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
//         <TaskHeader />
//         {useMockData ? (
//           <KanbanBoardWithMockData onStatusChange={handleStatusChange} />
//         ) : (
//           <KanbanBoardWithProjects 
//             onStatusChange={handleStatusChange} 
//             onError={() => setUseMockData(true)}
//           />
//         )}
//       </div>
//     </div>
//   );
// }