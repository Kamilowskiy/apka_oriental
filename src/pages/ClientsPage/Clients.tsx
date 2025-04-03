import { useEffect, useState, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import "./index.css";
import Button from "../../components/ui/button/Button";
import { useSubmit } from "react-router";
import ClientDetailsModal  from "../../components/ui/clientsModal/clientsDetail";
import Alert from "../../components/ui/alert/Alert";
import {formatPhoneNumber, formatFileSize} from "../../components/formatters/index";

interface Client {
  id: number;
  company_name: string;
  nip: string;
  address: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_phone: string;
  email: string;
  files?: ClientFile[]; // Added files property
}

interface ClientFile {
  name: string;
  path: string;
  size: number;
  createdAt: string;
  originalName: string;
}

interface FileUpload {
  file: File;
  tempPath?: string;
  filename?: string;
}

// Modal component for client details
const ClientManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/clients');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientFiles = async (clientId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/client-files/${clientId}`);
      const data = await response.json();
      return data.files;
    } catch (error) {
      console.error('Error fetching client files:', error);
      return [];
    }
  };

  const handleClientClick = async (client: Client) => {
    // Fetch client files before opening modal
    const files = await fetchClientFiles(client.id);
    setSelectedClient({ ...client, files });
  };

  const handleClientUpdate = (updatedClient: Client) => {
    // Update client in the local state
    setClients(prevClients => 
      prevClients.map(client => 
        client.id === updatedClient.id ? updatedClient : client
      )
    );
    
    // Update the selected client state
    setSelectedClient(updatedClient);
  };

  const handleDeleteClient = async (id: number) => {
    try {
      // First delete the client's folder
      const folderResponse = await fetch(`http://localhost:5000/api/client-folder/${id}`, {
        method: "DELETE",
      });
      
      if (!folderResponse.ok) {
        console.error("Error deleting client folder");
        // Continue with client deletion even if folder deletion fails
      }
  
      // Then delete the client
      const clientResponse = await fetch(`http://localhost:5000/api/clients/${id}`, {
        method: "DELETE",
      });
      
      if (clientResponse.ok) {
        setClients(clients.filter((client) => client.id !== id));
        // Close modal if the deleted client was selected
        if (selectedClient && selectedClient.id === id) {
          setSelectedClient(null);
        }
      } else {
        console.error("Error deleting client");
        // Show error message
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      // Show error message
    }
  };

  const closeModal = () => {
    setSelectedClient(null);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Zarządzanie klientami</h1>
      
      {loading ? (
        <p>Ładowanie...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(client => (
            <div 
              key={client.id} 
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md cursor-pointer transition-shadow"
              onClick={() => handleClientClick(client)}
            >
              <h2 className="text-xl font-semibold">{client.company_name}</h2>
              <p className="text-gray-600 dark:text-gray-400">NIP: {client.nip}</p>
              <p className="text-gray-600 dark:text-gray-400">
                Kontakt: {client.contact_first_name} {client.contact_last_name}
              </p>
            </div>
          ))}
        </div>
      )}
      
      {selectedClient && (
  <ClientDetailsModal 
    client={selectedClient} 
    onClose={closeModal} 
    onClientUpdate={handleClientUpdate} // To jest prawidłowa funkcja aktualizacji
  />
)}
    </div>
  );
};



export default function ClientsTable() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showForm, setShowForm] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [expandedClient, setExpandedClient] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState<Client>({
    id: 0,
    company_name: "",
    nip: "",
    address: "",
    contact_first_name: "",
    contact_last_name: "",
    contact_phone: "",
    email: "",
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clientFileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const handleClientUpdate = (updatedClient: Client) => {
    // Aktualizuj klienta w lokalnym stanie
    setClients(prevClients => 
      prevClients.map(client => 
        client.id === updatedClient.id ? updatedClient : client
      )
    );
    
    // Aktualizuj wybranego klienta
    setSelectedClient(updatedClient);
  };

  // Fetch clients data
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/clients");
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  // Fetch files for a specific client
  const fetchClientFiles = async (clientId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/client-files/${clientId}`);
      const data = await response.json();
      
      // Update the clients state with the files
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === clientId ? { ...client, files: data.files } : client
        )
      );
    } catch (error) {
      console.error(`Error fetching files for client ${clientId}:`, error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      // First delete the client's folder
      const folderResponse = await fetch(`http://localhost:5000/api/client-folder/${id}`, {
        method: "DELETE",
      });
      
      if (!folderResponse.ok) {
        console.error("Error deleting client folder");
        // Continue with client deletion even if folder deletion fails
      } else {
        console.log("Client folder deleted successfully");
      }
  
      // Then delete the client from the database
      const clientResponse = await fetch(`http://localhost:5000/api/clients/${id}`, {
        method: "DELETE",
      });
      
      if (clientResponse.ok) {
        console.log("Client deleted successfully");
        setClients(clients.filter((client) => client.id !== id));
      } else {
        console.error("Error deleting client");
        // You can use your Alert component here
        // <Alert title="Error" variant="error" message="Nie udało się usunąć klienta"></Alert>
        // Or you can implement a proper alert system later
      }
    } catch (error) {
      console.error("Error during client deletion:", error);
      // <Alert title="Error" variant="error" message="Wystąpił błąd podczas usuwania klienta"></Alert>
    }
  };

  const handleDeleteFile = async (clientId: number, filename: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/client-files/${clientId}/${filename}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete file");
      }
      
      // Update the client's files list
      setClients(prevClients => 
        prevClients.map(client => {
          if (client.id === clientId && client.files) {
            return {
              ...client,
              files: client.files.filter(file => file.name !== filename)
            };
          }
          return client;
        })
      );
      
    } catch (error) {
      console.error("Error deleting file:", error);
      // lert("Failed to delete file");
      <Alert title="xd" variant="error" message="Error deleting file"></Alert>
    }
  };

  const handleSearch = () => {
    const query = inputRef.current?.value.toLowerCase() || "";
    setSearchQuery(query);
  };

  // Handle client selection for details modal
  const handleSelectClient = async (client: Client) => {
    try {
      // Pobierz pliki przed otwarciem modalu
      const response = await fetch(`http://localhost:5000/api/client-files/${client.id}`);
      if (response.ok) {
        const data = await response.json();
        // Ustaw klienta z pobranymi plikami
        setSelectedClient({
          ...client,
          files: data.files
        });
      } else {
        setSelectedClient(client);
      }
    } catch (error) {
      console.error('Error fetching client files:', error);
      setSelectedClient(client);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setSelectedClient(null);
  };

  // Modified filtered clients function to search across all client fields
  const filteredClients = clients.filter((client) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Search in all relevant client fields
    return (
      client.company_name.toLowerCase().includes(query) ||
      client.nip.toLowerCase().includes(query) ||
      client.address.toLowerCase().includes(query) ||
      client.contact_first_name.toLowerCase().includes(query) ||
      client.contact_last_name.toLowerCase().includes(query) ||
      client.contact_phone.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      `${client.contact_first_name} ${client.contact_last_name}`.toLowerCase().includes(query)
    );
  });

  // Handle file upload for new client
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsUploading(true);
    
    try {
      // Create a FormData object
      const formData = new FormData();
      formData.append("file", file);
      
      // Upload the file to a temporary location
      const response = await fetch("http://localhost:5000/api/upload-temp", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        // throw new Error("Failed to upload file");
        <Alert title="xd" variant="error" message="Failed to upload file"></Alert>

      }
      
      const data = await response.json();
      
      // Add the file to the list of uploaded files
      setUploadedFiles([...uploadedFiles, {
        file,
        tempPath: data.filePath,
        filename: data.filename
      }]);
      
    } catch (error) {
      console.error("Error uploading file:", error);
      // alert("Failed to upload file");
      <Alert title="xd" variant="error" message="Nie przeslano pliku"></Alert>

    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle file upload for existing client
  const handleExistingClientFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, clientId: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    try {
      // Create a FormData object
      const formData = new FormData();
      formData.append("file", file);
      
      // Upload directly to the client's folder
      const response = await fetch(`http://localhost:5000/api/upload/${clientId}`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload file");
      }
      
      const data = await response.json();
      
      // Update the client's files list
      setClients(prevClients => 
        prevClients.map(client => {
          if (client.id === clientId) {
            const updatedFiles = client.files ? [...client.files, data.file] : [data.file];
            return { ...client, files: updatedFiles };
          }
          return client;
        })
      );
      
      // Update the selected client if the modal is open for this client
      if (selectedClient && selectedClient.id === clientId) {
        setSelectedClient(prevClient => {
          if (prevClient) {
            const updatedFiles = prevClient.files ? [...prevClient.files, data.file] : [data.file];
            return { ...prevClient, files: updatedFiles };
          }
          return prevClient;
        });
      }
      
    } catch (error) {
      console.error("Error uploading file:", error);
      // alert("Failed to upload file");
      <Alert title="xd" variant="error" message="Nie załadowano pliku"></Alert>

    } finally {
      // Reset the file input
      if (clientFileInputRefs.current[clientId]) {
        clientFileInputRefs.current[clientId]!.value = "";
      }
    }
  };

  // Move temporary files to client folder after client creation
  const moveFilesToClientFolder = async (clientId: number) => {
    const movePromises = uploadedFiles.map(fileUpload => {
      return fetch("http://localhost:5000/api/move-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: fileUpload.filename,
          clientId: clientId
        }),
      });
    });
    
    try {
      await Promise.all(movePromises);
      console.log("All files moved successfully");
    } catch (error) {
      console.error("Error moving files:", error);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("http://localhost:5000/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newClient),
      });
      
      if (!response.ok) {
        throw new Error("Failed to add client");
      }
      
      const data = await response.json();
      
      // Move files to client folder
      if (uploadedFiles.length > 0) {
        await moveFilesToClientFolder(data.id);
      }
      
      // Fetch client files after moving them
      await fetchClientFiles(data.id);
      
      // Update clients list
      setClients(prevClients => [...prevClients, data]);
      
      // Reset form
      setShowForm(false);
      setNewClient({
        id: 0,
        company_name: "",
        nip: "",
        address: "",
        contact_first_name: "",
        contact_last_name: "",
        contact_phone: "",
        email: "",
      });
      setUploadedFiles([]);
      
    } catch (error) {
      console.error("Error adding client:", error);
      // alert("Failed to add client");
      <Alert title="xd" variant="error" message="Nie dodano klienta"></Alert>

    }
  };

  // Toggle expanded client to show files
  const toggleClientExpansion = (clientId: number) => {
    if (expandedClient === clientId) {
      setExpandedClient(null);
    } else {
      setExpandedClient(clientId);
      // Fetch files if not already loaded
      const client = clients.find(c => c.id === clientId);
      if (!client?.files) {
        fetchClientFiles(clientId);
      }
    }
  };

  // Remove a file from the list (for new client)
  const handleRemoveFile = (index: number) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
  };

  return (
    <div>
      <div className="flex justify-start items-center my-5">
        <div className="hidden lg:block">
          <form>
            <div className="relative">
              <span className="absolute -translate-y-1/2 pointer-events-none left-4 top-1/2">
                <svg
                  className="fill-gray-500 dark:fill-gray-400"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 
                    9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 
                    9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 
                    9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 
                    18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 
                    17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                  />
                </svg>
              </span>
              <input
                ref={inputRef}
                type="text"
                placeholder="Szukaj po wszystkich polach..."
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
                onChange={handleSearch}
              />
            </div>
          </form>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="mx-5 bg-dark-900 dark:bg-dark-900 bg-transparent shadow-theme-xs border dark:border-white/[0.05] dark:bg-white/[0.03] text-gray-800 dark:text-white/90 px-4 py-2 rounded-md">
          +
        </button>
      </div>

      {showForm && (
        <div className="form-container mb-5 p-5 border dark:border-white/[0.05] rounded-xl bg-gray-50 dark:bg-white/[0.03] text-gray-800 text-theme-sm dark:text-white/90">
          <h3 className="text-lg font-semibold mb-4">Dodaj klienta</h3>
          <form onSubmit={handleAddClient}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block  font-medium  text-gray-800 text-theme-sm dark:text-white/90">Nazwa firmy</label>
                <input
                  type="text"
                  value={newClient.company_name}
                  onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })}
                  className="mt-1 p-2 border border-black/[0.5] rounded-md w-full dark:border-white/[0.5]"
                  required
                />
              </div>
              <div>
                <label className="block  font-medium  text-gray-800 text-theme-sm dark:text-white/90">NIP</label>
                <input
                  type="text"
                  value={newClient.nip}
                  onChange={(e) => setNewClient({ ...newClient, nip: e.target.value })}
                  className="mt-1 p-2 border border-black/[0.5] rounded-md w-full dark:border-white/[0.5]"
                  required
                />
              </div>
              <div>
                <label className="block font-medium  text-gray-800 text-theme-sm dark:text-white/90">Adres</label>
                <input
                  type="text"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                  className="mt-1 p-2 border border-black/[0.5] rounded-md w-full dark:border-white/[0.5]"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">Email</label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  className="mt-1 p-2 border border-black/[0.5] rounded-md w-full dark:border-white/[0.5]"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">Imię</label>
                <input
                  type="text"
                  value={newClient.contact_first_name}
                  onChange={(e) => setNewClient({ ...newClient, contact_first_name: e.target.value })}
                  className="mt-1 p-2 border border-black/[0.5] rounded-md w-full dark:border-white/[0.5]"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">Telefon</label>
                <input
                  type="text"
                  value={newClient.contact_phone}
                  onChange={(e) => setNewClient({ ...newClient, contact_phone: e.target.value })}
                  className="mt-1 p-2 border border-black/[0.5] rounded-md w-full dark:border-white/[0.5]"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">Nazwisko</label>
                <input
                  type="text"
                  value={newClient.contact_last_name}
                  onChange={(e) => setNewClient({ ...newClient, contact_last_name: e.target.value })}
                  className="mt-1 p-2 border border-black/[0.5] rounded-md w-full dark:border-white/[0.5]"
                  required
                />
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-md font-semibold mb-2">Dodaj dokumenty</h4>
              <input 
                ref={fileInputRef}
                type="file" 
                className="mb-2 p-2 border border-black/[0.5] rounded-md w-full dark:border-white/[0.5]" 
                onChange={handleFileChange}
                disabled={isUploading}
              />
              
              {isUploading && (
                <div className="mt-2 text-blue-400">
                  Uploading file...
                </div>
              )}
              
              {uploadedFiles.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium mb-2">Przesłane pliki:</h5>
                  <ul className="space-y-1">
                    {uploadedFiles.map((fileUpload, index) => (
                      <li key={index} className="flex justify-between items-center p-2 bg-white/[0.03] rounded">
                        <span className="text-sm truncate max-w-md">{fileUpload.file.name}</span>
                        <button 
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-red-500 hover:text-red-600 text-sm"
                        >
                          Usuń
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="mt-4 text-right">
              <Button size="sm" variant="primary" onClick={useSubmit}>
                Dodaj klienta
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1102px]">
            <Table>
              {/* Table Header */}
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    ID
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Firma
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    NIP
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Adres
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Kontakt
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Email
                  </TableCell>
                  {/* <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Pliki
                  </TableCell> */}
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Akcje
                  </TableCell>
                </TableRow>
              </TableHeader>



              {/* Table Body */}
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {filteredClients.map((client) => (
                  <>
                    <TableRow key={client.id}>
                      <TableCell className="px-5 py-4 text-gray-800 text-theme-sm dark:text-white/90">
                        {client.id}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-800 text-theme-sm dark:text-white/90">
                        {client.company_name}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-800 text-theme-sm dark:text-white/90">
                        {client.nip}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-800 text-theme-sm dark:text-white/90">
                        {client.address}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-800 text-theme-sm dark:text-white/90">
                        {client.contact_first_name} {client.contact_last_name} 
                        <br /><span className="font-medium">Telefon: </span><span className="font-semibold text-lime-500">
                          {formatPhoneNumber(client.contact_phone)}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-800 text-theme-sm dark:text-white/90">
                        {client.email}
                      </TableCell>
                     
                      {/* <TableCell className="px-5 py-4 text-gray-800 text-theme-sm dark:text-white/90">
                        <Button size="sm" variant="primary" onClick={() => toggleClientExpansion(client.id)}>
                          {expandedClient === client.id ? "Ukryj pliki" : "Pokaż pliki"}
                        </Button>
                        </TableCell> */}

                        <TableCell className="px-5 py-4 text-gray-800 text-theme-sm dark:text-white/90">
                        <Button size="sm" variant="primary" onClick={() => handleSelectClient(client)}>
                          Szczegóły
                        </Button>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-800 text-theme-sm dark:text-white/90">
                        <Button size="sm" variant="outline" onClick={() => handleDelete(client.id)}>
                          Usuń
                        </Button>
                      </TableCell>
                    </TableRow>
                    
                    {/* Client Details Modal */}
                    {selectedClient && (
                      <ClientDetailsModal 
                        client={selectedClient} 
                        onClose={handleCloseModal} 
                        onClientUpdate={handleClientUpdate} // To jest prawidłowa funkcja aktualizacji
                      />
                    )}

                    {/* Expanded files section */}
                    {expandedClient === client.id && (
                      <TableRow key={`${client.id}-files`} className="bg-gray-50 dark:bg-gray-900/30">
                        <td colSpan={9} className="px-5 py-4">
                          <div className="files-container border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-white/[0.02]">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-medium text-gray-800 dark:text-white/90 text-lg">Pliki klienta</h4>
                              <div>
                                <input
                                  type="file"
                                  className="hidden"
                                  ref={(el) => {
                                    if (client.id) {
                                      clientFileInputRefs.current[client.id] = el;
                                    }
                                  }}
                                  onChange={(e) => handleExistingClientFileUpload(e, client.id)}
                                />
                                <button
                                  onClick={() => clientFileInputRefs.current[client.id]?.click()}
                                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 text-sm"
                                >
                                  Dodaj plik
                                </button>
                              </div>
                            </div>
                            
                            {client.files && client.files.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full bg-transparent">
                                  <thead className="bg-gray-100 dark:bg-gray-800">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nazwa pliku</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rozmiar</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data dodania</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Akcje</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
                                    {client.files.map((file, idx) => (
                                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                        <td className="px-4 py-3 text-sm text-gray-800 dark:text-white/90 font-medium">{file.originalName}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatFileSize(file.size)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                          {new Date(file.createdAt).toLocaleDateString()} {new Date(file.createdAt).toLocaleTimeString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                          <div className="flex space-x-4">
                                            <a
                                              href={`http://localhost:5000/api/download/${client.id}/${file.name}`}
                                              className="text-blue-500 hover:text-blue-600 flex items-center"
                                              download>

                                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                              </svg>
                                              Pobierz
                                            </a>
                                            <button
                                              onClick={() => handleDeleteFile(client.id, file.name)}
                                              className="text-red-500 hover:text-red-600 flex items-center">
                                                
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
                              <div className="text-center py-8">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                </svg>
                                <p className="mt-2 text-gray-500 dark:text-gray-400">Brak plików dla tego klienta.</p>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">Kliknij "Dodaj plik" aby dodać pierwszy plik.</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </TableRow>
                    )}
                  </>
                ))}
                {filteredClients.length === 0 && (
                  <TableRow>
                    <TableCell  className="px-5 py-4 text-center text-gray-500 dark:text-gray-400">
                      Nie znaleziono klientów.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}