import React, { useState, useRef, useEffect } from 'react';
import Button from "../button/Button";
import { formatPhoneNumber, formatFileSize, formatDate, formatPrice } from '../../formatters/index';
import Alert from '../alert/Alert';
import "./index.css";

interface Client {
  id: number;
  company_name: string;
  nip: string;
  address: string;
  email: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_phone: string;
  files?: {
    name: string;
    originalName: string;
    size: number;
    path: string;
    createdAt: string;
  }[];
}

interface HostingInfo {
  id: number;
  domain_name: string;
  annual_price: number;
  start_date: string;
  end_date: string | null;
}

interface ServiceInfo {
  id: number;
  service_name: string;
  price: number;
  start_date: string;
  end_date: string | null;
}

interface ClientDetailsModalProps {
  client: Client | null;
  onClose: () => void;
  onClientUpdate: (updatedClient: Client) => void;
}




const ClientDetailsModal = ({ client, onClose, onClientUpdate }: ClientDetailsModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editedClient, setEditedClient] = useState<Client | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertVariant, setAlertVariant] = useState<'success' | 'error' | 'warning' | 'info'>('error');
  const [alertTitle, setAlertTitle] = useState<string>('Błąd');
  const [hostingInfo, setHostingInfo] = useState<HostingInfo[]>([]);
  const [isLoadingHosting, setIsLoadingHosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Add hosting state variables
  const [isAddingHosting, setIsAddingHosting] = useState(false);
  const [isEditingHosting, setIsEditingHosting] = useState(false);
  const [editingHostingId, setEditingHostingId] = useState<number | null>(null);
  const [hostingForm, setHostingForm] = useState({
    domain_name: '',
    annual_price: '',
    start_date: new Date().toISOString().split('T')[0], // Today as default
    end_date: ''
  });

  // Alert function defined early so we can use it in useEffect
  const showAlert = (message: string, variant: 'success' | 'error' | 'warning' | 'info' = 'error', title: string = 'Błąd') => {
    setAlertMessage(message);
    setAlertVariant(variant);
    setAlertTitle(title);
    
    // Auto-hide success alerts after 3 seconds
    if (variant === 'success') {
      setTimeout(() => {
        setAlertMessage(null);
      }, 3000);
    }
  };
  
  // Reset hosting form to defaults
  const resetHostingForm = () => {
    setHostingForm({
      domain_name: '',
      annual_price: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: ''
    });
  };

  // Handle adding a new hosting entry
  const handleAddHosting = () => {
    setIsAddingHosting(true);
    setIsEditingHosting(false);
    resetHostingForm();
  };

  // Handle editing an existing hosting entry
  const handleEditHosting = (hosting: HostingInfo) => {
    setIsEditingHosting(true);
    setIsAddingHosting(false);
    setEditingHostingId(hosting.id);
    
    // Format the date properly
    const formatDateForInput = (dateString: string | null) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };
    
    setHostingForm({
      domain_name: hosting.domain_name,
      annual_price: hosting.annual_price.toString(),
      start_date: formatDateForInput(hosting.start_date),
      end_date: formatDateForInput(hosting.end_date)
    });
  };

  // Handle canceling the hosting form
  const handleCancelHostingForm = () => {
    setIsAddingHosting(false);
    setIsEditingHosting(false);
    setEditingHostingId(null);
    resetHostingForm();
  };

  // Handle input changes in the hosting form
  const handleHostingInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHostingForm({
      ...hostingForm,
      [name]: value
    });
  };
  
  // Fetch hosting information function
  const fetchHostingInfo = async () => {
    if (!client || !client.id) return;
    
    setIsLoadingHosting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/hosting/${client.id}`);
      if (!response.ok) {
        throw new Error('Nie udało się pobrać informacji o hostingu');
      }
      
      const data = await response.json();
      setHostingInfo(Array.isArray(data.hosting) ? data.hosting : []);
    } catch (error) {
      console.error('Error fetching hosting info:', error);
      setHostingInfo([]);
      if (error instanceof Error && error.message !== 'Nie udało się pobrać informacji o hostingu') {
        showAlert('Wystąpił problem podczas ładowania danych hostingu', 'warning');
      }
    } finally {
      setIsLoadingHosting(false);
    }
  };

  // Handle saving a new hosting entry
  const handleSaveHosting = async () => {
    if (!client || !client.id) return;
    
    try {
      const formData = {
        ...hostingForm,
        client_id: client.id,
        // Make sure price is a number
        annual_price: parseFloat(hostingForm.annual_price)
      };
      
      // If end_date is empty, set it to null
      if (!formData.end_date) {
        formData.end_date = "null";
      }
      
      const url = isEditingHosting && editingHostingId
        ? `http://localhost:5000/api/hosting/${editingHostingId}`
        : 'http://localhost:5000/api/hosting';
      
      const method = isEditingHosting ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to save hosting information');
      }
      
      // Refresh hosting data
      fetchHostingInfo();
      
      // Reset form state
      handleCancelHostingForm();
      
      // Show success message
      showAlert(
        isEditingHosting 
          ? 'Informacje o hostingu zostały zaktualizowane' 
          : 'Hosting został dodany pomyślnie',
        'success',
        'Sukces'
      );
    } catch (error) {
      console.error('Error saving hosting:', error);
      showAlert(error instanceof Error ? error.message : 'Nie udało się zapisać informacji o hostingu', 'error', 'Błąd');
    }
  };

  // Handle deleting a hosting entry
  const handleDeleteHosting = async (hostingId: number) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę informację o hostingu?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/hosting/${hostingId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to delete hosting information');
      }
      
      // Refresh hosting data
      fetchHostingInfo();
      
      // Show success message
      showAlert('Informacja o hostingu została usunięta', 'success', 'Sukces');
    } catch (error) {
      console.error('Error deleting hosting:', error);
      showAlert(error instanceof Error ? error.message : 'Nie udało się usunąć informacji o hostingu', 'error', 'Błąd');
    }
  };

  const [serviceInfo, setServiceInfo] = useState<ServiceInfo[]>([]);
const [isLoadingServices, setIsLoadingServices] = useState(false);
const [isAddingService, setIsAddingService] = useState(false);
const [isEditingService, setIsEditingService] = useState(false);
const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
const [serviceForm, setServiceForm] = useState({
  service_name: '',
  price: '',
  start_date: new Date().toISOString().split('T')[0], // Today as default
  end_date: ''
});

// Add these service management functions

// Reset service form to defaults
const resetServiceForm = () => {
  setServiceForm({
    service_name: '',
    price: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });
};

// Handle adding a new service entry
const handleAddService = () => {
  setIsAddingService(true);
  setIsEditingService(false);
  resetServiceForm();
};

// Handle editing an existing service entry
const handleEditService = (service: ServiceInfo) => {
  setIsEditingService(true);
  setIsAddingService(false);
  setEditingServiceId(service.id);
  
  // Format the date properly
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };
  
  setServiceForm({
    service_name: service.service_name,
    price: service.price.toString(),
    start_date: formatDateForInput(service.start_date),
    end_date: formatDateForInput(service.end_date)
  });
};

// Handle canceling the service form
const handleCancelServiceForm = () => {
  setIsAddingService(false);
  setIsEditingService(false);
  setEditingServiceId(null);
  resetServiceForm();
};

// Handle input changes in the service form
const handleServiceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setServiceForm({
    ...serviceForm,
    [name]: value
  });
};

// Fetch service information function
const fetchServiceInfo = async () => {
  if (!client || !client.id) return;
  
  setIsLoadingServices(true);
  try {
    const response = await fetch(`http://localhost:5000/api/services/${client.id}`);
    if (!response.ok) {
      throw new Error('Nie udało się pobrać informacji o usługach');
    }
    
    const data = await response.json();
    setServiceInfo(Array.isArray(data.services) ? data.services : []);
  } catch (error) {
    console.error('Error fetching service info:', error);
    setServiceInfo([]);
    if (error instanceof Error && error.message !== 'Nie udało się pobrać informacji o usługach') {
      showAlert('Wystąpił problem podczas ładowania danych usług', 'warning');
    }
  } finally {
    setIsLoadingServices(false);
  }
};

// Handle saving a new service entry
const handleSaveService = async () => {
  if (!client || !client.id) return;
  
  try {
    const formData = {
      ...serviceForm,
      client_id: client.id,
      // Make sure price is a number
      price: parseFloat(serviceForm.price)
    };
    
    // If end_date is empty, set it to null
    if (!formData.end_date || formData.end_date.trim() === '') {
      formData.end_date = "";
    }
    
    const url = isEditingService && editingServiceId
      ? `http://localhost:5000/api/services/${editingServiceId}`
      : 'http://localhost:5000/api/services';
    
    const method = isEditingService ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || 'Failed to save service information');
    }
    
    // Refresh service data
    fetchServiceInfo();
    
    // Reset form state
    handleCancelServiceForm();
    
    // Show success message
    showAlert(
      isEditingService 
        ? 'Informacje o usłudze zostały zaktualizowane' 
        : 'Usługa została dodana pomyślnie',
      'success',
      'Sukces'
    );
  } catch (error) {
    console.error('Error saving service:', error);
    showAlert(error instanceof Error ? error.message : 'Nie udało się zapisać informacji o usłudze', 'error', 'Błąd');
  }
};

// Handle deleting a service entry
const handleDeleteService = async (serviceId: number) => {
  if (!window.confirm('Czy na pewno chcesz usunąć tę usługę?')) {
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:5000/api/services/${serviceId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || 'Failed to delete service information');
    }
    
    // Refresh service data
    fetchServiceInfo();
    
    // Show success message
    showAlert('Usługa została usunięta', 'success', 'Sukces');
  } catch (error) {
    console.error('Error deleting service:', error);
    showAlert(error instanceof Error ? error.message : 'Nie udało się usunąć usługi', 'error', 'Błąd');
  }
};


  useEffect(() => {
    if (!client || !client.id) return;
    
    // Deep copy of client object
    setEditedClient(JSON.parse(JSON.stringify(client)));
    
    // Additionally fetch client files each time the modal opens
    const fetchClientFiles = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/client-files/${client.id}`);
        if (!response.ok) {
          throw new Error('Nie udało się pobrać plików klienta');
        }
        
        const data = await response.json();
        
        // Check if files have changed before updating the state
        const currentFileIds = client.files?.map((f: { name: string }) => f.name).sort().join(',') || '';
        const newFileIds = data.files?.map((f: { name: string }) => f.name).sort().join(',') || '';
        
        // Only update state if files have changed
        if (currentFileIds !== newFileIds) {
          // Update only local state, without calling onClientUpdate
          setEditedClient(prev => {
            if (prev) {
              return {
                ...prev,
                files: data.files
              };
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Error fetching client files:', error);
        // Don't show alert for files error to avoid disrupting UX
      }
    };
    
    fetchClientFiles();
    fetchHostingInfo();
    fetchServiceInfo();
  }, [client?.id]); // Depend on client.id, not client object

  if (!client || !client.id || !editedClient) return null;

  // Handle input change in form fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (editedClient) {
      setEditedClient({
        ...editedClient,
        [name]: value
      });
    }
  };

  // Save changes function
  const handleSaveChanges = async () => {
    if (!editedClient) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/clients/${client.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedClient),
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Nie udało się zaktualizować klienta');
      }
  
      let updatedClient = await response.json();
      
      // Make sure we preserve files if they exist
      if (client.files && (!updatedClient.files || updatedClient.files.length === 0)) {
        updatedClient = {
          ...updatedClient,
          files: client.files
        };
      }
      
      onClientUpdate(updatedClient);
      setIsEditing(false);
      showAlert('Informacje o kliencie zostały zaktualizowane', 'success', 'Sukces');
    } catch (error) {
      console.error('Error updating client:', error);
      showAlert(error instanceof Error ? error.message : 'Nie udało się zaktualizować informacji o kliencie');
    }
  };

  const handleCancelEdit = () => {
    if (client) {
      setEditedClient(JSON.parse(JSON.stringify(client)));
    }
    setIsEditing(false);
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !client) return;
  
    setIsUploading(true);
    setUploadProgress(0);
    setAlertMessage(null);
  
    const formData = new FormData();
    formData.append('file', files[0]);
  
    try {
      // Create progress tracker
      let progressCounter = 0;
      const progressInterval = setInterval(() => {
        progressCounter += 5;
        if (progressCounter >= 90) {
          clearInterval(progressInterval);
          setUploadProgress(90);
        } else {
          setUploadProgress(progressCounter);
        }
      }, 200);
  
      const response = await fetch(`http://localhost:5000/api/upload/${client.id}`, {
        method: 'POST',
        body: formData,
      });
  
      clearInterval(progressInterval);
      setUploadProgress(100);
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Przesyłanie nie powiodło się');
      }
  
      const responseData = await response.json();
      
      // Get the new file from the response
      const newFile = responseData.file;
      
      // Update client with new file added to files array
      const updatedFiles = client.files ? [...client.files, newFile] : [newFile];
      const updatedClient = {
        ...client,
        files: updatedFiles
      };
      
      onClientUpdate(updatedClient);
      showAlert('Plik został pomyślnie przesłany', 'success', 'Sukces');
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 500);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setIsUploading(false);
      setUploadProgress(0);
      showAlert(error instanceof Error ? error.message : 'Nie udało się przesłać pliku');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten plik?')) return;
  
    try {
      const response = await fetch(`http://localhost:5000/api/client-files/${client.id}/${fileName}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Usunięcie nie powiodło się');
      }
  
      // Update client files after deletion
      const updatedFiles = client.files?.filter(file => file.name !== fileName) || [];
      const updatedClient = {
        ...client,
        files: updatedFiles
      };
      
      onClientUpdate(updatedClient);
      showAlert('Plik został pomyślnie usunięty', 'success', 'Sukces');
      
    } catch (error) {
      console.error('Error deleting file:', error);
      showAlert(error instanceof Error ? error.message : 'Nie udało się usunąć pliku');
    }
  };


  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-gray-100 dark:bg-black bg-opacity-20 dark:bg-opacity-20 flex items-center justify-center z-[999999] client-modal-container modal-backdrop">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto client-modal-content">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            {isEditing ? (
              <input
                type="text"
                name="company_name"
                value={editedClient.company_name}
                onChange={handleInputChange}
                className="text-2xl font-bold border-b border-gray-300 dark:border-gray-600 bg-transparent text-gray-800 dark:text-white w-full focus:outline-none focus:border-blue-500"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{client.company_name}</h2>
            )}
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          {/* Alert component */}
          {alertMessage && (
            <div className="mb-4">
              <Alert 
                variant={alertVariant} 
                message={alertMessage} 
                title={alertTitle} 
              />
            </div>
          )}

          {/* Action Menu */}
          <div className="mb-6 flex flex-wrap gap-2">
            {isEditing ? (
              <>
                <Button size="sm" variant="primary" onClick={handleSaveChanges}>
                  <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Zapisz zmiany
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Anuluj
                </Button>
              </>
            ) : (
              <Button size="sm" variant="primary" onClick={() => setIsEditing(true)}>
                <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edytuj
              </Button>
            )}
            <Button size="sm" variant="outline">
              <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Wyślij email
            </Button>
            <Button size="sm" variant="outline">
              <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Zadzwoń
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </div>

          {isUploading && (
            <div className="mb-6 w-full">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{uploadProgress}% Przesyłanie...</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Informacje podstawowe</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">NIP:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="nip"
                      value={editedClient.nip}
                      onChange={handleInputChange}
                      className="font-medium border border-gray-300 dark:border-gray-600 bg-transparent text-gray-800 dark:text-white rounded px-2 py-1 w-2/3 text-right focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <span className="font-medium text-gray-800 dark:text-white">{client.nip}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Adres:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address"
                      value={editedClient.address}
                      onChange={handleInputChange}
                      className="font-medium border border-gray-300 dark:border-gray-600 bg-transparent text-gray-800 dark:text-white rounded px-2 py-1 w-2/3 text-right focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <span className="font-medium text-gray-800 dark:text-white">{client.address}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Email:</span>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={editedClient.email}
                      onChange={handleInputChange}
                      className="font-medium border border-gray-300 dark:border-gray-600 bg-transparent text-gray-800 dark:text-white rounded px-2 py-1 w-2/3 text-right focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <span className="font-medium text-gray-800 dark:text-white">{client.email}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Kontakt</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Imię:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="contact_first_name"
                      value={editedClient.contact_first_name}
                      onChange={handleInputChange}
                      className="font-medium border border-gray-300 dark:border-gray-600 bg-transparent text-gray-800 dark:text-white rounded px-2 py-1 w-2/3 text-right focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <span className="font-medium text-gray-800 dark:text-white">{client.contact_first_name}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Nazwisko:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="contact_last_name"
                      value={editedClient.contact_last_name}
                      onChange={handleInputChange}
                      className="font-medium border border-gray-300 dark:border-gray-600 bg-transparent text-gray-800 dark:text-white rounded px-2 py-1 w-2/3 text-right focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <span className="font-medium text-gray-800 dark:text-white">{client.contact_last_name}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Telefon:</span>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="contact_phone"
                      value={editedClient.contact_phone}
                      onChange={handleInputChange}
                      className="font-medium border border-gray-300 dark:border-gray-600 bg-transparent text-gray-800 dark:text-white rounded px-2 py-1 w-2/3 text-right focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <span className="font-medium text-lime-500">{formatPhoneNumber(client.contact_phone)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Hosting Information */}
          <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Informacje o hostingu</h3>
              {!isAddingHosting && !isEditingHosting && (
                <Button size="sm" variant="outline" onClick={handleAddHosting}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Dodaj hosting
                </Button>
              )}
            </div>
            
            {/* Hosting Form */}
            {(isAddingHosting || isEditingHosting) && (
              <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="text-md font-medium mb-3 text-gray-800 dark:text-white">
                  {isAddingHosting ? 'Dodaj nowy hosting' : 'Edytuj hosting'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nazwa domeny
                    </label>
                    <input
                      type="text"
                      name="domain_name"
                      value={hostingForm.domain_name}
                      onChange={handleHostingInputChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="np. domena.pl"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cena roczna (PLN)
                    </label>
                    <input
                      type="number"
                      name="annual_price"
                      value={hostingForm.annual_price}
                      onChange={handleHostingInputChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="np. 120.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data rozpoczęcia
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={hostingForm.start_date}
                      onChange={handleHostingInputChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data zakończenia (opcjonalnie)
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={hostingForm.end_date}
                      onChange={handleHostingInputChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button size="sm" variant="outline" onClick={handleCancelHostingForm}>
                    Anuluj
                  </Button>
                  <Button size="sm" variant="primary" onClick={handleSaveHosting}>
                    {isAddingHosting ? 'Dodaj' : 'Zapisz zmiany'}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Hosting List */}
            {isLoadingHosting ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : hostingInfo.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-transparent">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Domena</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cena roczna</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data rozpoczęcia</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data zakończenia</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Akcje</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
                    {hostingInfo.map((hosting) => (
                      <tr key={hosting.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <td className="px-4 py-2 text-sm text-gray-800 dark:text-white/90 font-medium">{hosting.domain_name}</td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{formatPrice(hosting.annual_price)}</td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{formatDate(hosting.start_date)}</td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{hosting.end_date ? formatDate(hosting.end_date) : '-'}</td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex space-x-4">
                            <button 
                              className="text-blue-500 hover:text-blue-600 flex items-center"
                              onClick={() => handleEditHosting(hosting)}
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              Edytuj
                            </button>
                            <button 
                              className="text-red-500 hover:text-red-600 flex items-center"
                              onClick={() => handleDeleteHosting(hosting.id)}
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Usuń
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2">Brak informacji o hostingu dla tego klienta</p>
              </div>
            )}
          </div>

          {/* Services Section - Add this after the Hosting Information section */}
<div className="mt-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
  <div className="flex justify-between items-center mb-3">
    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Usługi</h3>
    {!isAddingService && !isEditingService && (
      <Button size="sm" variant="outline" onClick={handleAddService}>
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Dodaj usługę
      </Button>
    )}
  </div>
  
  {/* Service Form */}
  {(isAddingService || isEditingService) && (
    <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <h4 className="text-md font-medium mb-3 text-gray-800 dark:text-white">
        {isAddingService ? 'Dodaj nową usługę' : 'Edytuj usługę'}
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nazwa usługi
          </label>
          <input
            type="text"
            name="service_name"
            value={serviceForm.service_name}
            onChange={handleServiceInputChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="np. Utrzymanie strony"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cena (PLN)
          </label>
          <input
            type="number"
            name="price"
            value={serviceForm.price}
            onChange={handleServiceInputChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="np. 250.00"
            step="0.01"
            min="0"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Data rozpoczęcia
          </label>
          <input
            type="date"
            name="start_date"
            value={serviceForm.start_date}
            onChange={handleServiceInputChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Data zakończenia (opcjonalnie)
          </label>
          <input
            type="date"
            name="end_date"
            value={serviceForm.end_date}
            onChange={handleServiceInputChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button size="sm" variant="outline" onClick={handleCancelServiceForm}>
          Anuluj
        </Button>
        <Button size="sm" variant="primary" onClick={handleSaveService}>
          {isAddingService ? 'Dodaj' : 'Zapisz zmiany'}
        </Button>
      </div>
    </div>
  )}
  
  {/* Services List */}
  {isLoadingServices ? (
    <div className="flex justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  ) : serviceInfo.length > 0 ? (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-transparent">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nazwa usługi</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cena</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data rozpoczęcia</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data zakończenia</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Akcje</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
          {serviceInfo.map((service) => (
            <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
              <td className="px-4 py-2 text-sm text-gray-800 dark:text-white/90 font-medium">{service.service_name}</td>
              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{formatPrice(service.price)}</td>
              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{formatDate(service.start_date)}</td>
              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{service.end_date ? formatDate(service.end_date) : '-'}</td>
              <td className="px-4 py-2 text-sm">
                <div className="flex space-x-4">
                  <button 
                    className="text-blue-500 hover:text-blue-600 flex items-center"
                    onClick={() => handleEditService(service)}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edytuj
                  </button>
                  <button 
                    className="text-red-500 hover:text-red-600 flex items-center"
                    onClick={() => handleDeleteService(service.id)}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Usuń
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="mt-2">Brak usług dla tego klienta</p>
    </div>
  )}
</div>

          <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Pliki klienta</h3>
              <Button size="sm" variant="outline" onClick={triggerFileUpload}>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Dodaj plik
              </Button>
            </div>
            {client.files && client.files.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-transparent">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nazwa pliku</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rozmiar</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data dodania</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Akcje</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
                    {client.files.map((file, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <td className="px-4 py-2 text-sm text-gray-800 dark:text-white/90 font-medium">{file.originalName}</td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{formatFileSize(file.size)}</td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(file.createdAt).toLocaleDateString()} {new Date(file.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex space-x-4">
                            <a
                              href={`http://localhost:5000${file.path}`}
                              className="text-blue-500 hover:text-blue-600 flex items-center"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Otwórz
                            </a>
                            <a
                              href={`http://localhost:5000${file.path}`}
                              className="text-blue-500 hover:text-blue-600 flex items-center"
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Pobierz
                            </a>
                            <button
                              onClick={() => handleDeleteFile(file.name)}
                              className="text-red-500 hover:text-red-600 flex items-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Usuń
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-2">Brak plików dla tego klienta</p>
              </div>
            )}
          </div>

          <div className="mt-6 text-right">
            <Button size="sm" variant="outline" onClick={onClose}>
              Zamknij
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailsModal;