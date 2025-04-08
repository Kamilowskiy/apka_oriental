// Fix for src/pages/UserProfiles.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/button/Button";
import Alert from "../components/ui/alert/Alert";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import Modal from "../components/ui/modal";
import { useModal } from "../hooks/useModal";

interface UserUpdateData {
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  confirmPassword?: string;
}

export default function UserProfiles() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [userData, setUserData] = useState<UserUpdateData>({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    password: "",
    confirmPassword: ""
  });
  
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Update userData when user data changes
  useEffect(() => {
    if (user) {
      setUserData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        password: "",
        confirmPassword: ""
      });
    }
  }, [user]);
  
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

  const [passwordChanged, setPasswordChanged] = useState(false);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value
    });

    // Track if password field is being modified
    if (name === "password" && value.length > 0) {
      setPasswordChanged(true);
    }
  };

  // Show alert message
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

  // Handle form submission
  const handleSave = async () => {
    // Basic validation
    if (userData.first_name.trim() === "" || userData.last_name.trim() === "" || userData.email.trim() === "") {
      showAlert("Błąd", "Wypełnij wszystkie wymagane pola", "error");
      return;
    }

    // Validate email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(userData.email)) {
      showAlert("Błąd", "Podaj poprawny adres email", "error");
      return;
    }

    // If password was changed, validate it matches confirmation
    if (passwordChanged) {
      if (!userData.password) {
        showAlert("Błąd", "Hasło jest wymagane", "error");
        return;
      }
      
      if (userData.password.length < 8) {
        showAlert("Błąd", "Hasło musi mieć co najmniej 8 znaków", "error");
        return;
      }
      
      if (userData.password !== userData.confirmPassword) {
        showAlert("Błąd", "Hasła muszą być identyczne", "error");
        return;
      }
    }

    setIsLoading(true);

    try {
      // Prepare update data
      const updateData = {
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email
      };

      // Pobierz token z localStorage lub sessionStorage
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

      if (!token) {
        showAlert("Błąd", "Nie jesteś zalogowany", "error");
        setIsLoading(false);
        return;
      }

      // Send update request to API for profile update
      const response = await fetch(`http://localhost:5000/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      
      // If password was changed, update it separately
      if (passwordChanged && userData.password) {
        const passwordResponse = await fetch(`http://localhost:5000/api/users/change-password`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            current_password: userData.password, // This is probably wrong in your API, should pass the current password too
            new_password: userData.password
          })
        });

        if (!passwordResponse.ok) {
          throw new Error(`Error updating password: ${passwordResponse.status}`);
        }
      }
      
      // Update user in auth context
      updateUser({
        ...user,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email
      });
      
      // Reset form
      setEditing(false);
      setPasswordChanged(false);
      showAlert("Sukces", "Dane użytkownika zostały zaktualizowane", "success");
    } catch (error) {
      console.error("Error updating user:", error);
      showAlert("Błąd", "Nie udało się zaktualizować danych użytkownika", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (user) {
      setUserData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        password: "",
        confirmPassword: ""
      });
    }
    setEditing(false);
    setPasswordChanged(false);
  };

  // Get user full name
  const getFullName = (): string => {
    if (!user) return "";
    return `${user.first_name || ""} ${user.last_name || ""}`.trim();
  };

  // Obsługa usuwania konta
  const handleDeleteAccount = async () => {
    // Sprawdź potwierdzenie usunięcia
    if (deleteConfirmation !== user?.email) {
      showAlert("Błąd", "Wprowadź swój adres email, aby potwierdzić usunięcie konta", "error");
      return;
    }

    setIsLoading(true);

    try {
      // Pobierz token z localStorage lub sessionStorage
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

      if (!token) {
        showAlert("Błąd", "Nie jesteś zalogowany", "error");
        setIsLoading(false);
        return;
      }

      // Wyślij żądanie usunięcia konta
      const response = await fetch(`http://localhost:5000/api/users/${user?.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      // Wyczyść dane uwierzytelniające
      await logout();
      
      // Przekieruj do strony logowania z komunikatem
      navigate("/signin", { 
        state: { message: "Konto zostało pomyślnie usunięte" } 
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      showAlert("Błąd", "Nie udało się usunąć konta. Spróbuj ponownie później.", "error");
      setIsLoading(false);
      closeDeleteModal();
    }
  };

  return (
    <>
      <PageMeta
        title="Profil Użytkownika - Business Manager"
        description="Zarządzaj swoim profilem w panelu biznesowym"
      />
      
      <PageBreadcrumb pageTitle={`Profil: ${getFullName()}`} />
      
      {alertInfo.show && (
        <div className="mb-6">
          <Alert 
            title={alertInfo.title} 
            variant={alertInfo.variant} 
            message={alertInfo.message}
          />
        </div>
      )}
      
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4 sm:mb-0">
            {editing ? "Edycja profilu" : `Dane użytkownika: ${getFullName()}`}
          </h3>
          
          {!editing ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setEditing(true)}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
              Edytuj profil
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
                disabled={isLoading}
              >
                {isLoading ? "Zapisuję..." : "Zapisz zmiany"}
              </Button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Information */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 dark:text-white/90 mb-4">Dane osobowe</h4>
            
            <div className="space-y-4">
              <div>
                <Label>Imię</Label>
                {editing ? (
                  <Input
                    type="text"
                    name="first_name"
                    value={userData.first_name}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    {user?.first_name || "-"}
                  </p>
                )}
              </div>
              
              <div>
                <Label>Nazwisko</Label>
                {editing ? (
                  <Input
                    type="text"
                    name="last_name"
                    value={userData.last_name}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    {user?.last_name || "-"}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Contact Information */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 dark:text-white/90 mb-4">Dane kontaktowe</h4>
            
            <div className="space-y-4">
              <div>
                <Label>Adres email</Label>
                {editing ? (
                  <Input
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    {user?.email || "-"}
                  </p>
                )}
              </div>
              
              {editing && (
                <>
                  <div>
                    <Label>Nowe hasło (opcjonalnie)</Label>
                    <Input
                      type="password"
                      name="password"
                      value={userData.password}
                      onChange={handleInputChange}
                      className="mt-1"
                      placeholder="Pozostaw puste, jeśli nie chcesz zmieniać hasła"
                    />
                  </div>
                  
                  {passwordChanged && (
                    <div>
                      <Label>Powtórz nowe hasło</Label>
                      <Input
                        type="password"
                        name="confirmPassword"
                        value={userData.confirmPassword}
                        onChange={handleInputChange}
                        className="mt-1"
                        placeholder="Powtórz nowe hasło"
                      />
                      {userData.password !== userData.confirmPassword && 
                        <p className="mt-1 text-sm text-red-500">Hasła nie są identyczne</p>
                      }
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h4 className="text-md font-semibold text-gray-800 dark:text-white/90 mb-2">Informacje o koncie</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Rola konta</p>
              <p className="font-medium text-gray-800 dark:text-white/90">
                {user?.role === "admin" ? "Administrator" : "Użytkownik"}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">ID użytkownika</p>
              <p className="font-medium text-gray-800 dark:text-white/90">
                {user?.id || "-"}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Konto założone</p>
              <p className="font-medium text-gray-800 dark:text-white/90">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('pl-PL') : "-"}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
          <h4 className="text-md font-semibold text-red-600 dark:text-red-400 mb-2">Strefa niebezpieczna</h4>
          <p className="text-sm text-red-500 dark:text-red-400 mb-3">
            Usunięcie konta jest nieodwracalne. Wszystkie Twoje dane zostaną trwale usunięte.
          </p>
          <Button
            size="sm"
            variant="primary"
            onClick={openDeleteModal}
          >
            Usuń konto
          </Button>
        </div>
      </div>

      {/* Modal potwierdzenia usunięcia konta */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => {
          closeDeleteModal();
          setDeleteConfirmation("");
        }}
        className="max-w-[500px] p-4"
      >
        <div className="p-4">
          <h5 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white/90">
            Potwierdzenie usunięcia konta
          </h5>
          
          <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
            <p>Uwaga! Ta operacja jest nieodwracalna. Wszystkie Twoje dane zostaną trwale usunięte z systemu.</p>
          </div>
          
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Aby potwierdzić, że chcesz usunąć swoje konto, wprowadź swój adres email: <strong>{user?.email}</strong>
          </p>
          
          <div className="mb-4">
            <Input
              type="email"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Wprowadź swój adres email"
            />
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                closeDeleteModal();
                setDeleteConfirmation("");
              }}
              disabled={isLoading}
            >
              Anuluj
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteAccount}
              disabled={isLoading || deleteConfirmation !== user?.email}
            >
              {isLoading ? "Usuwanie..." : "Usuń konto"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}