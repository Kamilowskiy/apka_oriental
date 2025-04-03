import React, { useState, useRef, useEffect } from 'react';
import Button from "../button/Button";
import { formatPhoneNumber, formatFileSize } from '../../formatters/index';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poprawiony useEffect - tworzy głęboką kopię obiektu klienta
  useEffect(() => {
    if (client) {
      // Głęboka kopia obiektu klienta
      setEditedClient(JSON.parse(JSON.stringify(client)));
      
      // Dodatkowo pobierz pliki klienta przy każdym otwarciu modalu - tylko jeśli id się zmieniło
      const fetchClientFiles = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/client-files/${client.id}`);
          if (response.ok) {
            const data = await response.json();
            
            // Sprawdź, czy pliki się zmieniły, zanim aktualizujesz stan
            // Zastosowanie typów dla zmiennej f
            const currentFileIds = client.files?.map((f: { name: string }) => f.name).sort().join(',') || '';
            const newFileIds = data.files?.map((f: { name: string }) => f.name).sort().join(',') || '';
            
            // Tylko jeśli pliki się zmieniły, aktualizuj stan
            if (currentFileIds !== newFileIds) {
              // Aktualizuj tylko state lokalny, bez wywoływania onClientUpdate
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
          }
        } catch (error) {
          console.error('Error fetching client files:', error);
        }
      };
      
      fetchClientFiles();
    }
  }, [client]);

  if (!client || !editedClient) return null;

  // Poprawiona funkcja zmiany danych w polach formularza
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (editedClient) {
      setEditedClient({
        ...editedClient,
        [name]: value
      });
    }
  };

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

  // Poprawiona funkcja zapisywania zmian
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
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-gray-100 dark:bg-black bg-opacity-80 dark:bg-opacity-50 flex items-center justify-center z-[999999] client-modal-container modal-backdrop">
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

          {/* Menu akcji */}
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