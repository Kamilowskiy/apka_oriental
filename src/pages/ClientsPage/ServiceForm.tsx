// // Service Form Component for ClientDetails
// import React, { useState, useEffect } from 'react';
// import Button from '../../components/ui/button/Button';
// import UserMultiSelect, { SelectedUser } from '../../components/user/UserMultiSelect';

// interface ServiceFormProps {
//   clientId: number | string;
//   isAdding: boolean;
//   isEditing: boolean;
//   editingServiceId: number | null;
//   onSave: (serviceData: any) => Promise<void>;
//   onCancel: () => void;
//   initialData?: {
//     service_name: string;
//     description?: string;
//     price: number;
//     start_date: string;
//     end_date?: string;
//     status?: string;
//     priority?: string;
//     assigned_to?: string;
//     estimated_hours?: number;
//     category?: string;
//     tags?: string;
//   };
// }

// const ServiceForm: React.FC<ServiceFormProps> = ({
//   clientId,
//   isAdding,
//   isEditing,
//   editingServiceId,
//   onSave,
//   onCancel,
//   initialData
// }) => {
//   // Initialize form state with default values or provided data
//   const [serviceForm, setServiceForm] = useState({
//     service_name: initialData?.service_name || '',
//     description: initialData?.description || '',
//     price: initialData?.price || 0,
//     start_date: initialData?.start_date || '',
//     end_date: initialData?.end_date || '',
//     status: initialData?.status || 'todo',
//     priority: initialData?.priority || 'medium',
//     assigned_to: initialData?.assigned_to || '',
//     estimated_hours: initialData?.estimated_hours || '',
//     category: initialData?.category || 'Development',
//     tags: initialData?.tags || ''
//   });

//   // State for selected users
//   const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);

//   // Initialize selected users from assigned_to string if editing
//   useEffect(() => {
//     if (initialData?.assigned_to) {
//       const assignedNames = initialData.assigned_to.split(',').map(name => name.trim()).filter(Boolean);
//       const users = assignedNames.map((name, index) => ({
//         id: `existing-${index}`,
//         name
//       }));
//       setSelectedUsers(users);
//     }
//   }, [initialData]);

//   // Handle input changes
//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setServiceForm(prev => ({
//       ...prev,
//       [name]: name === 'price' || name === 'estimated_hours' 
//         ? (name === 'estimated_hours' ? (value ? parseInt(value) : '') : parseFloat(value) || 0)
//         : value
//     }));
//   };

//   // Handle user selection changes
//   const handleSelectedUsersChange = (users: SelectedUser[]) => {
//     setSelectedUsers(users);
//     // Update the assigned_to field in the form data
//     setServiceForm(prev => ({
//       ...prev,
//       assigned_to: users.map(user => user.name).join(', ')
//     }));
//   };

//   // Handle form submission
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     // Create the service data object with proper types for API
//     const serviceData = {
//       ...serviceForm,
//       client_id: Number(clientId),
//       price: parseFloat(serviceForm.price.toString()),
//       estimated_hours: serviceForm.estimated_hours ? parseInt(serviceForm.estimated_hours.toString()) : undefined,
//       // Use the comma-separated names of selected users
//       assigned_to: selectedUsers.map(user => user.name).join(', ')
//     };
    
//     await onSave(serviceData);
//   };

//   return (
//     <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
//       <h4 className="text-md font-medium mb-3 text-gray-800 dark:text-white">
//         {isAdding ? 'Dodaj nową usługę' : 'Edytuj usługę'}
//       </h4>
      
//       <form onSubmit={handleSubmit}>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//               Nazwa usługi <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               name="service_name"
//               value={serviceForm.service_name}
//               onChange={handleInputChange}
//               className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
//               placeholder="np. Utrzymanie strony"
//               required
//             />
//           </div>
          
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//               Cena (PLN) <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="number"
//               name="price"
//               value={serviceForm.price}
//               onChange={handleInputChange}
//               className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
//               placeholder="np. 250.00"
//               step="0.01"
//               min="0"
//               required
//             />
//           </div>
          
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//               Status
//             </label>
//             <select
//               name="status"
//               value={serviceForm.status}
//               onChange={handleInputChange}
//               className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="todo">Do zrobienia</option>
//               <option value="in-progress">W trakcie</option>
//               <option value="completed">Ukończone</option>
//             </select>
//           </div>
          
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//               Priorytet
//             </label>
//             <select
//               name="priority"
//               value={serviceForm.priority}
//               onChange={handleInputChange}
//               className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="low">Niski</option>
//               <option value="medium">Średni</option>
//               <option value="high">Wysoki</option>
//             </select>
//           </div>
          
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//               Data rozpoczęcia <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="date"
//               name="start_date"
//               value={serviceForm.start_date}
//               onChange={handleInputChange}
//               className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
//               required
//             />
//           </div>
          
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//               Data zakończenia (opcjonalnie)
//             </label>
//             <input
//               type="date"
//               name="end_date"
//               value={serviceForm.end_date}
//               onChange={handleInputChange}
//               className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
          
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//               Kategoria
//             </label>
//             <select
//               name="category"
//               value={serviceForm.category}
//               onChange={handleInputChange}
//               className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="Development">Rozwój</option>
//               <option value="Design">Projektowanie</option>
//               <option value="Marketing">Marketing</option>
//               <option value="E-commerce">E-commerce</option>
//             </select>
//           </div>
          
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//               Szacowane godziny
//             </label>
//             <input
//               type="number"
//               name="estimated_hours"
//               value={serviceForm.estimated_hours}
//               onChange={handleInputChange}
//               className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
//               placeholder="np. 40"
//               min="0"
//             />
//           </div>
          
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//               Tagi (oddzielone przecinkami)
//             </label>
//             <input
//               type="text"
//               name="tags"
//               value={serviceForm.tags}
//               onChange={handleInputChange}
//               className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
//               placeholder="np. strona, grafika, seo"
//             />
//           </div>
          
//           <div className="md:col-span-2">
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//               Przypisani użytkownicy
//             </label>
//             <UserMultiSelect
//               selectedUsers={selectedUsers}
//               onChange={handleSelectedUsersChange}
//               placeholder="Wybierz użytkowników..."
//             />
//             <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
//               Możesz przypisać wielu użytkowników do tej usługi
//             </p>
//           </div>
          
//           <div className="md:col-span-2">
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//               Opis usługi
//             </label>
//             <textarea
//               name="description"
//               value={serviceForm.description}
//               onChange={handleInputChange}
//               rows={4}
//               className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
//               placeholder="Opisz szczegóły usługi..."
//             />
//           </div>
//         </div>
        
//         <div className="flex justify-end space-x-2">
//           <Button size="sm" variant="outline" onClick={onCancel} type="button">
//             Anuluj
//           </Button>
//           <Button size="sm" variant="primary" type="submit">
//             {isAdding ? 'Dodaj' : 'Zapisz zmiany'}
//           </Button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default ServiceForm;