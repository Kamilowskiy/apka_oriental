// src/components/task/kanban/EditProjectModal.tsx
import { useState, useEffect } from "react";
import Modal from "../../ui/modal";
import Button from "../../ui/button/Button";
import Label from "../../form/Label";
import Input from "../../form/input/InputField";
import TextArea from "../../form/input/TextArea";
import api from "../../../utils/axios-config";
import { updateProject } from "../../../services/projectService";
import { Project } from "../../../services/projectService"; // Dodany import typu Project
import { UIProject, convertToAPIProject } from "../../../utils/projectServiceAdapter";

interface EditProjectModalProps {
  project: UIProject;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSuccess?: () => void;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({ 
  project, 
  isOpen, 
  onClose,
  onUpdateSuccess
}) => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    client_id: "",
    service_name: "",
    description: "",
    status: "todo",
    priority: "medium",
    assigned_to: "",
    estimated_hours: "",
    category: "Development",
    tags: "",
    price: "",
    start_date: "",
    end_date: ""
  });

  // Pobierz listę klientów przy inicjalizacji
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/clients');
        setClients(response.data || []);
      } catch (error) {
        console.error('Błąd podczas pobierania listy klientów:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Zainicjuj formularz danymi projektu
  useEffect(() => {
    if (project) {
      setFormData({
        client_id: project.client_id?.toString() || "",
        service_name: project.title || "",
        description: project.projectDesc || "",
        status: project.status === "inProgress" ? "in-progress" : project.status || "todo",
        priority: project.priority || "medium",
        assigned_to: project.assignee === "/images/user/user-01.jpg" ? "" : project.assignee || "",
        estimated_hours: project.estimatedHours?.toString() || "",
        category: project.category?.name || "Development",
        tags: project.tags || "",
        price: project.price?.toString() || "",
        start_date: project.startDate || new Date().toISOString().split('T')[0],
        end_date: project.endDate || ""
      });
    }
  }, [project]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({...formData, [name]: value});
  };

  const handleDescriptionChange = (value: string) => {
    setFormData({...formData, description: value});
  };

  // Funkcja do aktualizacji projektu
  const handleUpdateProject = async () => {
    try {
      // Walidacja
      if (!formData.client_id || !formData.service_name || !formData.price || !formData.start_date) {
        alert('Proszę wypełnić wszystkie wymagane pola');
        return;
      }
  
      setSaving(true);
      
      // Przygotowanie danych zgodnych z oczekiwanym typem
      const projectData: Partial<Project> = {
        client_id: parseInt(formData.client_id),
        service_name: formData.service_name,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        assigned_to: formData.assigned_to,
        // Konwersja na number | undefined zamiast null
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : undefined,
        category: formData.category,
        tags: formData.tags,
        price: parseFloat(formData.price),
        start_date: formData.start_date,
        end_date: formData.end_date || undefined
      };
  
      // Zaktualizuj projekt w API
      await updateProject(parseInt(project.id), projectData);
      
      // Wywołaj callback sukcesu
      if (onUpdateSuccess) {
        onUpdateSuccess();
      }
      
      // Zamknij modal
      onClose();
    } catch (error) {
      console.error('Błąd podczas aktualizacji projektu:', error);
      alert('Wystąpił błąd podczas aktualizacji projektu. Spróbuj ponownie.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] p-5 lg:p-10 m-4">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      </Modal>
    );
  }
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[700px] p-5 lg:p-10 m-4"
    >
      <div className="px-2">
        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          Edytuj projekt
        </h4>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
          Zaktualizuj informacje o projekcie
        </p>
      </div>

      <form className="flex flex-col">
        <div className="custom-scrollbar h-[500px] overflow-y-auto px-2">
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Nazwa projektu *</Label>
              <Input 
                type="text" 
                name="service_name" 
                value={formData.service_name} 
                onChange={handleInputChange} 
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Klient *</Label>
              <div className="relative z-20 bg-transparent dark:bg-form-input">
                <select 
                  name="client_id" 
                  value={formData.client_id} 
                  onChange={handleInputChange}
                  className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                >
                  <option value="">Wybierz klienta</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.company_name}
                    </option>
                  ))}
                </select>
                <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-4 top-1/2 dark:text-gray-400">
                  <svg
                    className="stroke-current"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
                      stroke=""
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </div>

            <div>
              <Label>Data rozpoczęcia *</Label>
              <div className="relative">
                <Input 
                  type="date" 
                  name="start_date" 
                  value={formData.start_date} 
                  onChange={handleInputChange} 
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <svg
                    className="fill-gray-700 dark:fill-gray-400"
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M4.33317 0.0830078C4.74738 0.0830078 5.08317 0.418794 5.08317 0.833008V1.24967H8.9165V0.833008C8.9165 0.418794 9.25229 0.0830078 9.6665 0.0830078C10.0807 0.0830078 10.4165 0.418794 10.4165 0.833008V1.24967L11.3332 1.24967C12.2997 1.24967 13.0832 2.03318 13.0832 2.99967V4.99967V11.6663C13.0832 12.6328 12.2997 13.4163 11.3332 13.4163H2.6665C1.70001 13.4163 0.916504 12.6328 0.916504 11.6663V4.99967V2.99967C0.916504 2.03318 1.70001 1.24967 2.6665 1.24967L3.58317 1.24967V0.833008C3.58317 0.418794 3.91896 0.0830078 4.33317 0.0830078ZM4.33317 2.74967H2.6665C2.52843 2.74967 2.4165 2.8616 2.4165 2.99967V4.24967H11.5832V2.99967C11.5832 2.8616 11.4712 2.74967 11.3332 2.74967H9.6665H4.33317ZM11.5832 5.74967H2.4165V11.6663C2.4165 11.8044 2.52843 11.9163 2.6665 11.9163H11.3332C11.4712 11.9163 11.5832 11.8044 11.5832 11.6663V5.74967Z"
                      fill=""
                    />
                  </svg>
                </span>
              </div>
            </div>

            <div>
              <Label>Termin zakończenia</Label>
              <div className="relative">
                <Input 
                  type="date" 
                  name="end_date" 
                  value={formData.end_date} 
                  onChange={handleInputChange} 
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <svg
                    className="fill-gray-700 dark:fill-gray-400"
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M4.33317 0.0830078C4.74738 0.0830078 5.08317 0.418794 5.08317 0.833008V1.24967H8.9165V0.833008C8.9165 0.418794 9.25229 0.0830078 9.6665 0.0830078C10.0807 0.0830078 10.4165 0.418794 10.4165 0.833008V1.24967L11.3332 1.24967C12.2997 1.24967 13.0832 2.03318 13.0832 2.99967V4.99967V11.6663C13.0832 12.6328 12.2997 13.4163 11.3332 13.4163H2.6665C1.70001 13.4163 0.916504 12.6328 0.916504 11.6663V4.99967V2.99967C0.916504 2.03318 1.70001 1.24967 2.6665 1.24967L3.58317 1.24967V0.833008C3.58317 0.418794 3.91896 0.0830078 4.33317 0.0830078ZM4.33317 2.74967H2.6665C2.52843 2.74967 2.4165 2.8616 2.4165 2.99967V4.24967H11.5832V2.99967C11.5832 2.8616 11.4712 2.74967 11.3332 2.74967H9.6665H4.33317ZM11.5832 5.74967H2.4165V11.6663C2.4165 11.8044 2.52843 11.9163 2.6665 11.9163H11.3332C11.4712 11.9163 11.5832 11.8044 11.5832 11.6663V5.74967Z"
                      fill=""
                    />
                  </svg>
                </span>
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <div className="relative z-20 bg-transparent dark:bg-form-input">
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleInputChange}
                  className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                >
                  <option value="todo">Do zrobienia</option>
                  <option value="in-progress">W trakcie</option>
                  <option value="completed">Ukończone</option>
                </select>
                <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-4 top-1/2 dark:text-gray-400">
                  <svg
                    className="stroke-current"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
                      stroke=""
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </div>

            <div>
              <Label>Priorytet</Label>
              <div className="relative z-20 bg-transparent dark:bg-form-input">
                <select 
                  name="priority" 
                  value={formData.priority} 
                  onChange={handleInputChange}
                  className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                >
                  <option value="low">Niski</option>
                  <option value="medium">Średni</option>
                  <option value="high">Wysoki</option>
                </select>
                <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-4 top-1/2 dark:text-gray-400">
                  <svg
                    className="stroke-current"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
                      stroke=""
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </div>

            <div>
              <Label>Kategoria</Label>
              <div className="relative z-20 bg-transparent dark:bg-form-input">
                <select 
                  name="category" 
                  value={formData.category} 
                  onChange={handleInputChange}
                  className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                >
                  <option value="Development">Rozwój</option>
                  <option value="Design">Projektowanie</option>
                  <option value="Marketing">Marketing</option>
                  <option value="E-commerce">E-commerce</option>
                </select>
                <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-4 top-1/2 dark:text-gray-400">
                  <svg
                    className="stroke-current"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
                      stroke=""
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </div>

            <div>
              <Label>Przypisany do</Label>
              <Input 
                type="text" 
                name="assigned_to" 
                value={formData.assigned_to} 
                onChange={handleInputChange} 
                placeholder="Imię i nazwisko"
              />
            </div>

            <div>
              <Label>Szacowane godziny</Label>
              <Input 
                type="number" 
                name="estimated_hours" 
                value={formData.estimated_hours} 
                onChange={handleInputChange} 
                placeholder="0"
              />
            </div>

            <div>
              <Label>Tagi (oddzielone przecinkami)</Label>
              <Input 
                type="text" 
                name="tags" 
                value={formData.tags} 
                onChange={handleInputChange} 
                placeholder="np. rozwój, frontend, api"
              />
            </div>

            <div>
              <Label>Cena (PLN) *</Label>
              <Input 
                type="number" 
                name="price" 
                value={formData.price} 
                onChange={handleInputChange} 
                placeholder="0.00"
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Opis projektu</Label>
              <TextArea
                placeholder="Opisz szczegóły projektu..."
                rows={6}
                value={formData.description}
                onChange={handleDescriptionChange}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-6 px-2 mt-6 sm:flex-row sm:justify-between">
          <div className="text-xs text-gray-500">
            * Pola wymagane
          </div>

          <div className="flex items-center w-full gap-3 sm:w-auto">
            <button
              onClick={onClose}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              disabled={saving}
            >
              Anuluj
            </button>
            <button
              onClick={handleUpdateProject}
              type="button"
              className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditProjectModal;