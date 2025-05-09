import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import "./index.css";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import { formatPhoneNumber } from "../../components/formatters/index";
import { useAuth } from "../../context/AuthContext"; // Import the auth context
import DropzoneComponent from "../../components/form/form-elements/DropZone";
import ConfirmationModal from "../../components/ui/confirmation-modal/ConfirmationModal";

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

interface FileUpload {
  file: File;
  tempPath?: string;
  filename?: string;
}

export default function ClientsTable() {
  const { token } = useAuth(); // Get token from auth context
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showForm, setShowForm] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);
  const [clientNameToDelete, setClientNameToDelete] = useState<string>("");
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

  // Fetch clients data
  useEffect(() => {
    if (token) {
      fetchClients();
    }
  }, [token]);

  // Open confirmation modal instead of using window.confirm()
const openDeleteConfirmation = (id: number, name: string) => {
  setClientToDelete(id);
  setClientNameToDelete(name);
  setConfirmModalOpen(true);
};

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      if (!token) {
        showAlert("Błąd", "Nie jesteś zalogowany", "error");
        setIsLoading(false);
        return;
      }
      
      console.log("Fetching clients with token:", token ? "Token exists" : "No token");
      
      const response = await fetch("http://localhost:5000/api/clients", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Nieautoryzowany dostęp - zaloguj się ponownie");
        }
        throw new Error(`Błąd pobierania: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Fetched clients data:", data.length || "No length property");
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      showAlert("Błąd", error instanceof Error ? error.message : "Nie udało się pobrać listy klientów", "error");
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch files for a specific client
  const fetchClientFiles = async (clientId: number) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      if (!token) {
        showAlert("Błąd", "Nie jesteś zalogowany", "error");
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/client-files/${clientId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Błąd pobierania plików: ${response.status}`);
      }
      
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

 const handleDelete = async () => {
  if (!clientToDelete) return;
  
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    if (!token) {
      showAlert("Błąd", "Nie jesteś zalogowany", "error");
      return;
    }
    
    // First delete the client's folder
    const folderResponse = await fetch(`http://localhost:5000/api/clients/folder/${clientToDelete}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!folderResponse.ok) {
      console.error("Error deleting client folder");
      // Continue with client deletion even if folder deletion fails
    } else {
      console.log("Client folder deleted successfully");
    }

    // Then delete the client from the database
    const clientResponse = await fetch(`http://localhost:5000/api/clients/${clientToDelete}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (clientResponse.ok) {
      console.log("Client deleted successfully");
      setClients(clients.filter((client) => client.id !== clientToDelete));
      showAlert("Sukces", "Klient został usunięty", "success");
    } else {
      throw new Error(`Błąd usuwania: ${clientResponse.status}`);
    }
  } catch (error) {
    console.error("Error during client deletion:", error);
    showAlert("Błąd", "Wystąpił błąd podczas usuwania klienta", "error");
  } finally {
    // Close the confirmation modal and reset clientToDelete
    setConfirmModalOpen(false);
    setClientToDelete(null);
    setClientNameToDelete("");
  }
};

  const handleSearch = () => {
    const query = inputRef.current?.value.toLowerCase() || "";
    setSearchQuery(query);
  };

  // Helper function to show alerts
  const showAlert = (title: string, message: string, variant: "success" | "error" | "warning" | "info") => {
    setAlertInfo({
      show: true,
      title,
      message,
      variant
    });

    
    
    // Hide alert after 5 seconds
    setTimeout(() => {
      setAlertInfo(prev => ({ ...prev, show: false }));
    }, 5000);
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

  // Move temporary files to client folder after client creation
  const moveFilesToClientFolder = async (clientId: number) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      if (!token) {
        showAlert("Błąd", "Nie jesteś zalogowany", "error");
        return;
      }
      
      const movePromises = uploadedFiles.map(fileUpload => {
        return fetch("http://localhost:5000/api/move-file", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            filename: fileUpload.filename,
            clientId: clientId
          }),
        });
      });
      
      await Promise.all(movePromises);
      console.log("All files moved successfully");
    } catch (error) {
      console.error("Error moving files:", error);
      showAlert("Błąd", "Nie udało się przenieść plików", "error");
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      if (!token) {
        showAlert("Błąd", "Nie jesteś zalogowany", "error");
        return;
      }
      
      const response = await fetch("http://localhost:5000/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newClient),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Błąd dodawania: ${response.status}`);
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
      showAlert("Sukces", "Klient został dodany", "success");
      
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
      showAlert("Błąd", error instanceof Error ? error.message : "Nie udało się dodać klienta", "error");
    }
  };

  // Remove a file from the list (for new client)
  const handleRemoveFile = (index: number) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
  };


  const handleFileUploadDirect = async (file: File) => {
    setIsUploading(true);
    
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      if (!token) {
        showAlert("Błąd", "Nie jesteś zalogowany", "error");
        setIsUploading(false);
        return;
      }
      
      // Create a FormData object
      const formData = new FormData();
      formData.append("file", file);
      
      // Upload the file to a temporary location
      const response = await fetch("http://localhost:5000/api/upload-temp", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Błąd przesyłania: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add the file to the list of uploaded files
      setUploadedFiles(prev => [...prev, {
        file,
        tempPath: data.filePath,
        filename: data.filename
      }]);
      
      showAlert("Sukces", "Plik został pomyślnie przesłany", "success");
    } catch (error) {
      console.error("Error uploading file:", error);
      showAlert("Błąd", "Nie udało się przesłać pliku", "error");
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {alertInfo.show && (
        <Alert 
          title={alertInfo.title} 
          variant={alertInfo.variant} 
          message={alertInfo.message}
        />
      )}
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleDelete}
        title="Potwierdzenie usunięcia"
        message={`Czy na pewno chcesz usunąć klienta ${clientNameToDelete}? Tej operacji nie można cofnąć.`}
        confirmText="Usuń"
        cancelText="Anuluj"
        variant="danger"
      />

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
                    d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                  />
                </svg>
              </span>
              <input
                ref={inputRef}
                type="text"
                placeholder="Szukaj po wszystkich polach..."
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
                onChange={handleSearch}
              />
            </div>
          </form>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className={`mx-5 flex items-center justify-center gap-2 rounded-lg border bg-transparent px-4 py-2 text-gray-800 shadow-theme-xs transition-all duration-300 dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-white/90 ${
            showForm ? 'bg-gray-100 dark:bg-gray-800/40' : 'hover:bg-gray-50 dark:hover:bg-white/[0.05]'
          }`}
        >
          <span className={`inline-flex h-5 w-5 items-center justify-center transition-transform duration-300 ${showForm ? 'rotate-45' : ''}`}>
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
          </span>
          {showForm ? "Zamknij formularz" : "Dodaj klienta"}
        </button>
      </div>

      
      <div 
  className={`overflow-hidden transition-all duration-500 ease-in-out ${
    showForm 
      ? 'max-h-[2000px] opacity-100 mb-8' 
      : 'max-h-0 opacity-0 mb-0'
  }`}
>
  <div className="mb-8 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700/30 dark:bg-white/[0.03]">
    <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700/30 dark:bg-gray-800/40">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Dodaj nowego klienta
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Wypełnij poniższy formularz, aby dodać nowego klienta do systemu
      </p>
    </div>

    <form onSubmit={handleAddClient} className="p-6">
      {/* Dane firmy - sekcja */}
      <div className="mb-6">
        <h4 className="mb-4 flex items-center text-base font-medium text-gray-700 dark:text-white/80">
          <svg 
            className="mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
          Dane firmy
        </h4>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nazwa firmy <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newClient.company_name}
              onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white/90 dark:focus:border-brand-400"
              placeholder="Wprowadź nazwę firmy"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              NIP <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newClient.nip}
              onChange={(e) => setNewClient({ ...newClient, nip: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white/90 dark:focus:border-brand-400"
              placeholder="np. 1234567890"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Adres <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newClient.address}
              onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white/90 dark:focus:border-brand-400"
              placeholder="ul. Przykładowa 123, 00-000 Miasto"
              required
            />
          </div>
        </div>
      </div>

      {/* Dane kontaktowe - sekcja */}
      <div className="mb-6">
        <h4 className="mb-4 flex items-center text-base font-medium text-gray-700 dark:text-white/80">
          <svg 
            className="mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          Dane kontaktowe
        </h4>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Imię <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newClient.contact_first_name}
              onChange={(e) => setNewClient({ ...newClient, contact_first_name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white/90 dark:focus:border-brand-400"
              placeholder="Imię osoby kontaktowej"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nazwisko <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newClient.contact_last_name}
              onChange={(e) => setNewClient({ ...newClient, contact_last_name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white/90 dark:focus:border-brand-400"
              placeholder="Nazwisko osoby kontaktowej"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={newClient.email}
              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white/90 dark:focus:border-brand-400"
              placeholder="email@przyklad.pl"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Telefon <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newClient.contact_phone}
              onChange={(e) => setNewClient({ ...newClient, contact_phone: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white/90 dark:focus:border-brand-400"
              placeholder="123 456 789"
              required
            />
          </div>
        </div>
      </div>

      {/* Dokumenty - sekcja z DropZone */}
      <div className="mb-6">
  <h4 className="mb-4 flex items-center text-base font-medium text-gray-700 dark:text-white/80">
    <svg 
      className="mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
    </svg>
    Dokumenty
  </h4>
  
  {/* Użyj gotowego komponentu DropzoneComponent */}
  <DropzoneComponent onFileDrop={(file) => handleFileUploadDirect(file)} />

        {/* Lista przesłanych plików */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h5 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Przesłane pliki ({uploadedFiles.length})
            </h5>
            <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800/50">
              {uploadedFiles.map((fileUpload, index) => (
                <li key={index} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center">
                    <svg 
                      className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {fileUpload.file.name}
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="flex items-center text-sm font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Usuń
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Przyciski formularza */}
      <div className="flex items-center justify-end space-x-4 border-t border-gray-200 pt-6 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white/80 dark:hover:bg-gray-600"
        >
          Anuluj
        </button>
        <Button type="submit" size="sm" variant="primary" className="px-3">
          <svg 
            className="h-4 w-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Dodaj klienta
        </Button>
      </div>
    </form>
  </div>
  </div>
  {/* </div> */}



      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="w-10 h-10 border-4 border-t-4 border-gray-200 rounded-full border-t-brand-500 animate-spin"></div>
            </div>
          ) : (
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
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Akcje
                    </TableCell>
                  </TableRow>
                </TableHeader>

                {/* Table Body */}
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
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
                        <TableCell className="px-5 py-4 text-gray-800 text-theme-sm dark:text-white/90 flex space-x-2">
                          <Link to={`/clients/${client.id}`}>
                            <Button size="sm" variant="primary">
                              Szczegóły
                            </Button>
                          </Link>
                          <Button size="sm" variant="outline" onClick={() => openDeleteConfirmation(client.id, client.company_name)}>
                            Usuń
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <td colSpan={7} className="px-5 py-4 text-center text-gray-500 dark:text-gray-400">
                        Nie znaleziono klientów.
                      </td>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}