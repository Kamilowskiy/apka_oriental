import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// Adjust these paths based on your project structure
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import { formatPhoneNumber, formatFileSize, formatPrice} from "../../components/formatters/index";

interface Client {
  id: number;
  company_name: string;
  nip: string;
  address: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_phone: string;
  email: string;
  files?: ClientFile[];
}

interface ClientFile {
  name: string;
  path: string;
  size: number;
  createdAt: string;
  originalName: string;
}

interface HostingInfo {
  id: number;
  domain_name: string;
  annual_price: number;
  start_date: string;
  end_date?: string;
}

interface ServiceInfo {
  id: number;
  service_name: string;
  price: number;
  start_date: string;
  end_date?: string;
}

export default function ClientDetails() {
  // Add debugging for params
  const params = useParams();
  console.log("Params received:", params);
  
  const { id } = params;
  console.log("Client ID from params:", id);
  
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editableClient, setEditableClient] = useState<Client | null>(null);
  const [alertInfo, setAlertInfo] = useState<{
    show: boolean;
    title: string;
    message: string;
    variant: "success" | "error" | "warning" | "info";
  }>({
    show: false,
    title: "",
    message: "",
    variant: "info"
  });
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const [hostingInfo, setHostingInfo] = useState<HostingInfo[]>([]);
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo[]>([]);
  const [isLoadingHosting, setIsLoadingHosting] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isAddingHosting, setIsAddingHosting] = useState(false);
  const [isEditingHosting, setIsEditingHosting] = useState(false);
  const [isAddingService, setIsAddingService] = useState(false);
  const [isEditingService, setIsEditingService] = useState(false);
  const [hostingForm, setHostingForm] = useState<Omit<HostingInfo, 'id'>>({
    domain_name: '',
    annual_price: 0,
    start_date: '',
    end_date: ''
  });
  const [serviceForm, setServiceForm] = useState<Omit<ServiceInfo, 'id'>>({
    service_name: '',
    price: 0,
    start_date: '',
    end_date: ''
  });
  const [editingHostingId, setEditingHostingId] = useState<number | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);

  // Fetch client data
  useEffect(() => {
    console.log("useEffect running with ID:", id);
    
    if (!id) {
      console.error("No ID provided in params");
      setError("Brak identyfikatora klienta");
      setLoading(false);
      return;
    }
    
    const fetchClient = async () => {
      setLoading(true);
      try {
        // Since your API doesn't have a /clients/:id endpoint,
        // we'll get all clients and filter for the one we need
        console.log("Fetching all clients since no single client endpoint exists");
        const response = await fetch("http://localhost:5000/api/clients");
        
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const allClients = await response.json();
        console.log("All clients received, count:", allClients.length);
        
        // Find the specific client by ID
        const clientData = allClients.find((c: Client) => c.id === parseInt(id));
        console.log("Client found?", !!clientData);
        
        if (!clientData) {
          console.error("Client not found in the received data");
          throw new Error("Client not found");
        }
        
        console.log("Client data found:", clientData);
        
        // Fetch client files
        console.log(`Fetching client files from: http://localhost:5000/api/client-files/${id}`);
        const filesResponse = await fetch(`http://localhost:5000/api/client-files/${id}`);
        
        console.log("Files API response status:", filesResponse.status);
        
        if (!filesResponse.ok) {
          console.warn(`Failed to fetch files. Status: ${filesResponse.status}`);
          // Continue without files instead of throwing
          const clientWithFiles = { ...clientData, files: [] };
          setClient(clientWithFiles);
          setEditableClient(clientWithFiles);
        } else {
          const filesData = await filesResponse.json();
          console.log("Files data received:", filesData);
          
          // Combine client data with files
          const clientWithFiles = { ...clientData, files: filesData.files || [] };
          setClient(clientWithFiles);
          setEditableClient(clientWithFiles);
        }

        // Fetch hosting information
        setIsLoadingHosting(true);
        try {
          const hostingResponse = await fetch(`http://localhost:5000/api/hosting/${id}`);
          if (hostingResponse.ok) {
            const hostingData = await hostingResponse.json();
            setHostingInfo(hostingData.hosting); // FIXED: use hostingData.hosting instead of hostingData
          }
        } catch (error) {
          console.error("Error fetching hosting:", error);
        } finally {
          setIsLoadingHosting(false);
        }

      setIsLoadingServices(true);
      try {
        const servicesResponse = await fetch(`http://localhost:5000/api/services/${id}`);
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          setServiceInfo(servicesData.services); // FIXED: use servicesData.services instead of servicesData
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setIsLoadingServices(false);
      }

      } catch (error) {
        console.error("Error fetching client:", error);
        console.error("Error fetching services:", error);
        setError("Nie udało się załadować danych klienta");
        showAlert("Błąd", "Nie udało się załadować danych klienta", "error");
      } finally {
        setLoading(false);
        setIsLoadingServices(false);
      }
    };

    fetchClient();
  }, [id]);

  // Helper function to show alerts
  const showAlert = (title: string, message: string, variant: "success" | "error" | "warning" | "info") => {
    setAlertInfo({
      show: true,
      title,
      message,
      variant
    });
    
    // Hide alert after 3 seconds
    setTimeout(() => {
      setAlertInfo(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleGoBack = () => {
    navigate("/clients");
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editableClient || !id) return;

    try {
      const response = await fetch(`http://localhost:5000/api/clients/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_name: editableClient.company_name,
          nip: editableClient.nip,
          address: editableClient.address,
          contact_first_name: editableClient.contact_first_name,
          contact_last_name: editableClient.contact_last_name,
          contact_phone: editableClient.contact_phone,
          email: editableClient.email
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update client");
      }

      // Update local client state with edited values
      setClient(editableClient);
      setEditing(false);
      showAlert("Sukces", "Dane klienta zostały zaktualizowane", "success");
    } catch (error) {
      console.error("Error updating client:", error);
      showAlert("Błąd", "Nie udało się zaktualizować danych klienta", "error");
    }
  };

  const handleCancel = () => {
    // Reset editable client to original client data
    setEditableClient(client);
    setEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editableClient) return;
    
    setEditableClient({
      ...editableClient,
      [e.target.name]: e.target.value
    });
  };

  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0 || !id) return;
      
    const file = e.target.files[0];
    
    try {
      // Create a FormData object
      const formData = new FormData();
      formData.append("file", file);
      
      // Upload directly to the client's folder
      const response = await fetch(`http://localhost:5000/api/upload/${id}`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload file");
      }
      
      const data = await response.json();
      
      // Add the new file to client's files list
      if (client) {
        const updatedClient = {
          ...client,
          files: [...(client.files || []), data.file]
        };
        setClient(updatedClient);
        setEditableClient(updatedClient);
      }
      
      // Reset file input
      setFileInputKey(Date.now());

      showAlert("Sukces", "Plik został pomyślnie przesłany", "success");
    } catch (error) {
      console.error("Error uploading file:", error);
      showAlert("Błąd", "Nie udało się przesłać pliku", "error");
    }
  };

  

  const handleDeleteFile = async (filename: string) => {
    if (!id || !client) return;
    
    // Add confirmation dialog
    if (!confirm('Czy na pewno chcesz usunąć ten plik?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/client-files/${id}/${filename}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete file");
      }
      
      // Remove the file from client's files list
      const updatedClient = {
        ...client,
        files: client.files?.filter(file => file.name !== filename) || []
      };
      
      setClient(updatedClient);
      setEditableClient(updatedClient);
      
      showAlert("Sukces", "Plik został pomyślnie usunięty", "success");
    } catch (error) {
      console.error("Error deleting file:", error);
      showAlert("Błąd", "Nie udało się usunąć pliku", "error");
    }
  };

  const handleAddHosting = () => {
    setHostingForm({
      domain_name: '',
      annual_price: 0,
      start_date: '',
      end_date: ''
    });
    setIsAddingHosting(true);
    setIsEditingHosting(false);
    setEditingHostingId(null);
  };
  
  const handleEditHosting = (hosting: HostingInfo) => {
    setHostingForm({
      domain_name: hosting.domain_name,
      annual_price: hosting.annual_price,
      start_date: hosting.start_date,
      end_date: hosting.end_date || ''
    });
    setIsEditingHosting(true);
    setIsAddingHosting(false);
    setEditingHostingId(hosting.id);
  };
  
  const handleHostingInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHostingForm(prev => ({
      ...prev,
      [name]: name === 'annual_price' ? parseFloat(value) : value
    }));
  };
  
  const handleCancelHostingForm = () => {
    setIsAddingHosting(false);
    setIsEditingHosting(false);
  };
  
  const handleSaveHosting = async () => {
    if (!id) return;
  
    try {
      let response;
  
      if (isAddingHosting) {
        response = await fetch(`http://localhost:5000/api/hosting`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...hostingForm,
            client_id: id
          })
        });
      } else if (isEditingHosting && editingHostingId) {
        response = await fetch(`http://localhost:5000/api/hosting/${editingHostingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(hostingForm)
        });
      }
  
      // For handleSaveHosting
      if (response && response.ok) {
        const hostingResponse = await fetch(`http://localhost:5000/api/hosting/${id}`);
        if (hostingResponse.ok) {
          const hostingData = await hostingResponse.json();
          setHostingInfo(hostingData.hosting); // FIXED: use hostingData.hosting
        }
        
        setIsAddingHosting(false);
        setIsEditingHosting(false);
        showAlert('Sukces', 'Informacje o hostingu zostały zaktualizowane', 'success');
      }
    } catch (error) {
      console.error('Error saving hosting:', error);
      showAlert('Błąd', 'Nie udało się zapisać informacji o hostingu', 'error');
    }
  };
  
  const handleDeleteHosting = async (hostingId: number) => {
    if (!id) return;
    
    if (!confirm('Czy na pewno chcesz usunąć ten hosting?')) return;
  
    try {
      const response = await fetch(`http://localhost:5000/api/hosting/${hostingId}`, {
        method: 'DELETE'
      });
  
      if (response.ok) {
        setHostingInfo(prev => prev.filter(hosting => hosting.id !== hostingId));
        showAlert('Sukces', 'Hosting został usunięty', 'success');
      }
    } catch (error) {
      console.error('Error deleting hosting:', error);
      showAlert('Błąd', 'Nie udało się usunąć hostingu', 'error');
    }
  };

  const handleAddService = () => {
    setServiceForm({
      service_name: '',
      price: 0,
      start_date: '',
      end_date: ''
    });
    setIsAddingService(true);
    setIsEditingService(false);
    setEditingServiceId(null);
  };
  
  const handleEditService = (service: ServiceInfo) => {
    setServiceForm({
      service_name: service.service_name,
      price: service.price,
      start_date: service.start_date,
      end_date: service.end_date || ''
    });
    setIsEditingService(true);
    setIsAddingService(false);
    setEditingServiceId(service.id);
  };
  
  const handleServiceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setServiceForm(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) : value
    }));
  };
  
  const handleCancelServiceForm = () => {
    setIsAddingService(false);
    setIsEditingService(false);
  };
  
  const handleSaveService = async () => {
    if (!id) return;
  
    try {
      let response;
  
      if (isAddingService) {
        response = await fetch(`http://localhost:5000/api/services`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...serviceForm,
            client_id: id
          })
        });
      } else if (isEditingService && editingServiceId) {
        response = await fetch(`http://localhost:5000/api/services/${editingServiceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(serviceForm)
        });
      }
  
    if (response && response.ok) {
      const servicesResponse = await fetch(`http://localhost:5000/api/services/${id}`);
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setServiceInfo(servicesData.services); // FIXED: use servicesData.services
      }
      
      setIsAddingService(false);
      setIsEditingService(false);
      showAlert('Sukces', 'Informacje o usłudze zostały zaktualizowane', 'success');
    }
        } catch (error) {
          console.error('Error saving service:', error);
          showAlert('Błąd', 'Nie udało się zapisać informacji o usłudze', 'error');
        }
      };
      
  const handleDeleteService = async (serviceId: number) => {
    if (!id) return;
    
    if (!confirm('Czy na pewno chcesz usunąć tę usługę?')) return;
  
    try {
      const response = await fetch(`http://localhost:5000/api/services/${serviceId}`, {
        method: 'DELETE'
      });
  
      if (response.ok) {
        setServiceInfo(prev => prev.filter(service => service.id !== serviceId));
        showAlert('Sukces', 'Usługa została usunięta', 'success');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      showAlert('Błąd', 'Nie udało się usunąć usługi', 'error');
    }
  };

  
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };
  console.log("ClientDetails rendering state:", { 
    loading, 
    client: client ? "Client data exists" : "No client data",
    error,
    params
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="text-center py-8">
          <p className="text-gray-800 dark:text-white/90">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="text-center py-8">
          <p className="text-gray-800 dark:text-white/90">Błąd: {error}</p>
          <Button 
            size="sm" 
            variant="primary" 
            onClick={handleGoBack}
            className="mt-4"
          >
            Powrót do listy klientów
          </Button>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="text-center py-8">
          <p className="text-gray-800 dark:text-white/90">Nie znaleziono klienta o ID: {id}</p>
          <Button 
            size="sm" 
            variant="primary" 
            onClick={handleGoBack}
            className="mt-4"
          >
            Powrót do listy klientów
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {alertInfo.show && (
        <div className="fixed top-4 right-4 z-50 w-full max-w-sm md:max-w-md">
          <Alert 
            title={alertInfo.title} 
            variant={alertInfo.variant} 
            message={alertInfo.message}
          />
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleGoBack}
        >
          &larr; Powrót
        </Button>
        
        {!editing ? (
          <Button 
            size="sm" 
            variant="primary" 
            onClick={handleEdit}
          >
            Edytuj dane
          </Button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCancel}
            >
              Anuluj
            </Button>
            <Button 
              size="sm" 
              variant="primary" 
              onClick={handleSave}
            >
              Zapisz zmiany
            </Button>
          </div>
        )}
      </div>
      
      <div className="bg-white dark:bg-white/[0.03] p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/[0.05]">
        <h1 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800 dark:text-white/90">
          {editing ? "Edycja danych klienta" : "Szczegóły klienta"}
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white/90">Dane firmy</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Nazwa firmy</label>
                {editing ? (
                  <input
                    type="text"
                    name="company_name"
                    value={editableClient?.company_name || ""}
                    onChange={handleInputChange}
                    className="mt-1 p-2 w-full border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white/90"
                  />
                ) : (
                  <p className="mt-1 text-gray-800 dark:text-white/90">{client.company_name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">NIP</label>
                {editing ? (
                  <input
                    type="text"
                    name="nip"
                    value={editableClient?.nip || ""}
                    onChange={handleInputChange}
                    className="mt-1 p-2 w-full border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white/90"
                  />
                ) : (
                  <p className="mt-1 text-gray-800 dark:text-white/90">{client.nip}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Adres</label>
                {editing ? (
                  <input
                    type="text"
                    name="address"
                    value={editableClient?.address || ""}
                    onChange={handleInputChange}
                    className="mt-1 p-2 w-full border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white/90"
                  />
                ) : (
                  <p className="mt-1 text-gray-800 dark:text-white/90">{client.address}</p>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white/90">Dane kontaktowe</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                {editing ? (
                  <input
                    type="email"
                    name="email"
                    value={editableClient?.email || ""}
                    onChange={handleInputChange}
                    className="mt-1 p-2 w-full border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white/90"
                  />
                ) : (
                  <p className="mt-1 text-gray-800 dark:text-white/90">{client.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Imię i nazwisko</label>
                {editing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      name="contact_first_name"
                      value={editableClient?.contact_first_name || ""}
                      onChange={handleInputChange}
                      className="mt-1 p-2 w-full border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white/90"
                      placeholder="Imię"
                    />
                    <input
                      type="text"
                      name="contact_last_name"
                      value={editableClient?.contact_last_name || ""}
                      onChange={handleInputChange}
                      className="mt-1 p-2 w-full border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white/90"
                      placeholder="Nazwisko"
                    />
                  </div>
                ) : (
                  <p className="mt-1 text-gray-800 dark:text-white/90">
                    {client.contact_first_name} {client.contact_last_name}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Telefon</label>
                {editing ? (
                  <input
                    type="text"
                    name="contact_phone"
                    value={editableClient?.contact_phone || ""}
                    onChange={handleInputChange}
                    className="mt-1 p-2 w-full border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white/90"
                  />
                ) : (
                  <p className="mt-1 text-gray-800 dark:text-white/90 font-semibold">
                    {"+48 "+formatPhoneNumber(client.contact_phone)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hosting Information */}
        <div className="mt-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Informacje o hostingu</h3>
            {!isAddingHosting && !isEditingHosting && (
              <Button size="sm" variant="outline" onClick={handleAddHosting} className="w-full sm:w-auto">
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
                  <thead className="bg-gray-100 dark:bg-gray-700/50">
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
                          <div className="flex flex-wrap gap-4">
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
          <div className="mt-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
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
        <thead className="bg-gray-100 dark:bg-gray-700/50">
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
                <div className="flex flex-wrap gap-4">
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


        
        <div className="mt-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Pliki</h2>
            <div>
            <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                const input = document.getElementById("fileUpload") as HTMLInputElement;
                if (input) input.click();
                }}
            >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Dodaj plik
            </Button>
            <input
                key={fileInputKey}
                type="file"
                id="fileUpload"
                className="hidden"
                onChange={handleFileUpload}
            />
            </div>
          </div>

          
          
          {client.files && client.files.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nazwa pliku
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Rozmiar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Data dodania
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
                  {client.files.map((file, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {file.originalName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(file.createdAt).toLocaleDateString()} {new Date(file.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-wrap gap-4">
                        <a href={`http://localhost:5000/api/view/${client.id}/${file.name}`}
                            className="text-green-500 hover:text-green-600 flex items-center"
                            target="_blank"
                            rel="noopener noreferrer"
                            >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Otwórz
                        </a>
                          <a
                            href={`http://localhost:5000/api/download/${client.id}/${file.name}`}
                            className="text-blue-500 hover:text-blue-600 flex items-center"
                            download
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
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Brak plików dla tego klienta.</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">Kliknij "Dodaj plik" aby dodać pierwszy plik.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}