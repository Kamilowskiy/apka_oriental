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

function formatPhoneNumber(number: string) {
  const cleaned = number.replace(/\D/g, "");
  const formatted = cleaned.replace(/(\d{3})(?=\d)/g, "$1 ");
  return formatted;
}

// Format file size to be human readable
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function ClientsTable() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showForm, setShowForm] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [expandedClient, setExpandedClient] = useState<number | null>(null);
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

  const handleDelete = (id: number) => {
    fetch(`http://localhost:5000/api/clients/${id}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (response.ok) {
          setClients(clients.filter((client) => client.id !== id));
        } else {
          console.error("Error deleting client");
        }
      })
      .catch((error) => console.error("Error deleting client:", error));
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
      alert("Failed to delete file");
    }
  };

  const handleSearch = () => {
    const query = inputRef.current?.value.toLowerCase() || "";
    setSearchQuery(query);
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
        throw new Error("Failed to upload file");
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
      alert("Failed to upload file");
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
      
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
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
      alert("Failed to add client");
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
          className="focus:ring-[0.5px] ring-white mx-5 bg-dark-900 dark:bg-dark-900 bg-transparent shadow-theme-xs dark:bg-white/[0.03] text-white px-4 py-2 rounded-md">
          +
        </button>
      </div>

      {showForm && (
        <div className="form-container mb-5 p-5 border border-white/[0.05] rounded-xl bg-[#171f2f] text-[#dcdfdf]">
          <h3 className="text-lg font-semibold mb-4">Dodaj klienta</h3>
          <form onSubmit={handleAddClient}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#dcdfdf]">Nazwa firmy</label>
                <input
                  type="text"
                  value={newClient.company_name}
                  onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })}
                  className="mt-1 p-2 border border-white/[0.5] rounded-md w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#dcdfdf]">NIP</label>
                <input
                  type="text"
                  value={newClient.nip}
                  onChange={(e) => setNewClient({ ...newClient, nip: e.target.value })}
                  className="mt-1 p-2 border border-white/[0.5] rounded-md w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#dcdfdf]">Adres</label>
                <input
                  type="text"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                  className="mt-1 p-2 border border-white/[0.5] rounded-md w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#dcdfdf]">Email</label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  className="mt-1 p-2 border border-white/[0.5] rounded-md w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#dcdfdf]">Imię</label>
                <input
                  type="text"
                  value={newClient.contact_first_name}
                  onChange={(e) => setNewClient({ ...newClient, contact_first_name: e.target.value })}
                  className="mt-1 p-2 border border-white/[0.5] rounded-md w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#dcdfdf]">Telefon</label>
                <input
                  type="text"
                  value={newClient.contact_phone}
                  onChange={(e) => setNewClient({ ...newClient, contact_phone: e.target.value })}
                  className="mt-1 p-2 border border-white/[0.5] rounded-md w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#dcdfdf]">Nazwisko</label>
                <input
                  type="text"
                  value={newClient.contact_last_name}
                  onChange={(e) => setNewClient({ ...newClient, contact_last_name: e.target.value })}
                  className="mt-1 p-2 border border-white/[0.5] rounded-md w-full"
                  required
                />
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-md font-semibold mb-2">Dodaj dokumenty</h4>
              <input 
                ref={fileInputRef}
                type="file" 
                className="mb-2 p-2 border border-white/[0.5] rounded-md w-full" 
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
              <button
                type="submit" 
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                disabled={isUploading}
              >
                Dodaj klienta
              </button>
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
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Pliki
                  </TableCell>
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
                     
                      <TableCell className="px-5 py-4 text-gray-800 text-theme-sm dark:text-white/90">
                        <Button size="sm" variant="primary" onClick={() => toggleClientExpansion(client.id)}>
                          {expandedClient === client.id ? "Ukryj pliki" : "Pokaż pliki"}
                        </Button>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-800 text-theme-sm dark:text-white/90">
                        <Button size="sm" variant="outline" onClick={() => handleDelete(client.id)}>
                          Usuń
                        </Button>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded files section */}
                    {expandedClient === client.id && (
                      <TableRow key={`${client.id}-files`} className="bg-gray-50 dark:bg-gray-900/30">
                        <td colSpan={8} className="px-5 py-4">
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