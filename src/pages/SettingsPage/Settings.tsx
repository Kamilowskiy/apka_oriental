import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
// import { authenticateUser } from "../../utils/auth";

interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  email_verified: number;
  role: string;
  created_at: string;
  updated_at: string;
}

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
}

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  current_password?: string;
  new_password?: string;
  confirm_password?: string;
  form?: string;
}

export default function UserProfileSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile"); // "profile", "password", "notifications", "privacy"
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profileFormData, setProfileFormData] = useState<ProfileFormData>({
    first_name: "",
    last_name: "",
    email: ""
  });
  const [passwordFormData, setPasswordFormData] = useState<PasswordFormData>({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appNotifications, setAppNotifications] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState("public"); // "public", "friends", "private"

  // Fetch user data when component loads
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          navigate("/signin");
          return;
        }
        
        const response = await fetch("http://localhost:5000/api/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            navigate("/signin");
            return;
          }
          throw new Error("Wystąpił błąd podczas pobierania danych użytkownika");
        }
        
        const data = await response.json();
        setUserData(data);
        
        // Initialize form data
        setProfileFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || ""
        });
        
      } catch (error) {
        console.error("Error fetching user data:", error);
        setErrors({ form: error instanceof Error ? error.message : "Wystąpił błąd" });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate]);

  // Handle input change for profile form
  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for the changed field
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle input change for password form
  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for the changed field
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Validate profile form
  const validateProfileForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!profileFormData.first_name.trim()) {
      newErrors.first_name = "Imię jest wymagane";
    }
    
    if (!profileFormData.last_name.trim()) {
      newErrors.last_name = "Nazwisko jest wymagane";
    }
    
    if (!profileFormData.email.trim()) {
      newErrors.email = "Email jest wymagany";
    } else if (!/\S+@\S+\.\S+/.test(profileFormData.email)) {
      newErrors.email = "Podaj prawidłowy adres email";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate password form
  const validatePasswordForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!passwordFormData.current_password) {
      newErrors.current_password = "Aktualne hasło jest wymagane";
    }
    
    if (!passwordFormData.new_password) {
      newErrors.new_password = "Nowe hasło jest wymagane";
    } else if (passwordFormData.new_password.length < 8) {
      newErrors.new_password = "Hasło musi mieć co najmniej 8 znaków";
    }
    
    if (passwordFormData.new_password !== passwordFormData.confirm_password) {
      newErrors.confirm_password = "Hasła muszą być identyczne";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle profile form submission
  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }
    
    setIsLoading(true);
    setSuccessMessage("");
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        navigate("/signin");
        return;
      }
      
      const response = await fetch("http://localhost:5000/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: profileFormData.first_name,
          last_name: profileFormData.last_name,
          email: profileFormData.email
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas aktualizacji profilu");
      }
      
      // Update local user data
      if (userData) {
        setUserData({
          ...userData,
          first_name: profileFormData.first_name,
          last_name: profileFormData.last_name,
          email: profileFormData.email
        });
      }
      
      setSuccessMessage("Profil został zaktualizowany pomyślnie");
      
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrors({ form: error instanceof Error ? error.message : "Wystąpił błąd podczas aktualizacji profilu" });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    setIsLoading(true);
    setSuccessMessage("");
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        navigate("/signin");
        return;
      }
      
      const response = await fetch("http://localhost:5000/api/users/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordFormData.current_password,
          new_password: passwordFormData.new_password
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas zmiany hasła");
      }
      
      // Reset password form
      setPasswordFormData({
        current_password: "",
        new_password: "",
        confirm_password: ""
      });
      
      setSuccessMessage("Hasło zostało zmienione pomyślnie");
      
    } catch (error) {
      console.error("Error changing password:", error);
      setErrors({ form: error instanceof Error ? error.message : "Wystąpił błąd podczas zmiany hasła" });
    } finally {
      setIsLoading(false);
    }
  };

  // Save notification settings
  const handleNotificationSave = async () => {
    setIsLoading(true);
    setSuccessMessage("");
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        navigate("/signin");
        return;
      }
      
      const response = await fetch("http://localhost:5000/api/users/notification-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email_notifications: emailNotifications,
          app_notifications: appNotifications
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas zapisywania ustawień powiadomień");
      }
      
      setSuccessMessage("Ustawienia powiadomień zostały zaktualizowane");
      
    } catch (error) {
      console.error("Error saving notification settings:", error);
      setErrors({ form: error instanceof Error ? error.message : "Wystąpił błąd" });
    } finally {
      setIsLoading(false);
    }
  };

  // Save privacy settings
  const handlePrivacySave = async () => {
    setIsLoading(true);
    setSuccessMessage("");
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        navigate("/signin");
        return;
      }
      
      const response = await fetch("http://localhost:5000/api/users/privacy-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          profile_visibility: profileVisibility
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas zapisywania ustawień prywatności");
      }
      
      setSuccessMessage("Ustawienia prywatności zostały zaktualizowane");
      
    } catch (error) {
      console.error("Error saving privacy settings:", error);
      setErrors({ form: error instanceof Error ? error.message : "Wystąpił błąd" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !userData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Ustawienia profilu</h1>
      
      {/* Success message */}
      {successMessage && (
        <div className="p-4 mb-6 text-sm text-white bg-green-500 rounded">
          <p>{successMessage}</p>
        </div>
      )}
      
      {/* Form error */}
      {errors.form && (
        <div className="p-3 mb-5 text-sm text-white bg-red-500 rounded">
          {errors.form}
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex mb-6 border-b">
        <button 
          className={`py-2 px-4 font-medium ${activeTab === "profile" ? "border-b-2 border-brand-600 text-brand-600" : "text-gray-500"}`}
          onClick={() => setActiveTab("profile")}
        >
          Dane osobowe
        </button>
        <button 
          className={`py-2 px-4 font-medium ${activeTab === "password" ? "border-b-2 border-brand-600 text-brand-600" : "text-gray-500"}`}
          onClick={() => setActiveTab("password")}
        >
          Zmiana hasła
        </button>
        <button 
          className={`py-2 px-4 font-medium ${activeTab === "notifications" ? "border-b-2 border-brand-600 text-brand-600" : "text-gray-500"}`}
          onClick={() => setActiveTab("notifications")}
        >
          Powiadomienia
        </button>
        <button 
          className={`py-2 px-4 font-medium ${activeTab === "privacy" ? "border-b-2 border-brand-600 text-brand-600" : "text-gray-500"}`}
          onClick={() => setActiveTab("privacy")}
        >
          Prywatność
        </button>
      </div>
      
      {/* Profile Settings */}
      {activeTab === "profile" && (
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <Label>
                Imię <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                name="first_name"
                value={profileFormData.first_name}
                onChange={handleProfileInputChange}
                placeholder="Wprowadź imię"
                className={errors.first_name ? "border-red-500" : ""}
              />
              {errors.first_name && <p className="mt-1 text-sm text-red-500">{errors.first_name}</p>}
            </div>
            
            <div>
              <Label>
                Nazwisko <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                name="last_name"
                value={profileFormData.last_name}
                onChange={handleProfileInputChange}
                placeholder="Wprowadź nazwisko"
                className={errors.last_name ? "border-red-500" : ""}
              />
              {errors.last_name && <p className="mt-1 text-sm text-red-500">{errors.last_name}</p>}
            </div>
          </div>
          
          <div>
            <Label>
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              name="email"
              value={profileFormData.email}
              onChange={handleProfileInputChange}
              placeholder="Wprowadź adres email"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
          </div>
          
          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="py-2.5"
              size="md"
              variant="primary"
            >
              {isLoading ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </div>
        </form>
      )}
      
      {/* Password Settings */}
      {activeTab === "password" && (
        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          <div>
            <Label>
              Aktualne hasło <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="current_password"
                value={passwordFormData.current_password}
                onChange={handlePasswordInputChange}
                placeholder="Wprowadź aktualne hasło"
                className={errors.current_password ? "border-red-500" : ""}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showPassword ? (
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.current_password && <p className="mt-1 text-sm text-red-500">{errors.current_password}</p>}
          </div>
          
          <div>
            <Label>
              Nowe hasło <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="new_password"
                value={passwordFormData.new_password}
                onChange={handlePasswordInputChange}
                placeholder="Wprowadź nowe hasło"
                className={errors.new_password ? "border-red-500" : ""}
              />
            </div>
            {errors.new_password && <p className="mt-1 text-sm text-red-500">{errors.new_password}</p>}
            <p className="mt-1 text-sm text-gray-500">Hasło musi mieć co najmniej 8 znaków</p>
          </div>
          
          <div>
            <Label>
              Potwierdź nowe hasło <span className="text-red-500">*</span>
            </Label>
            <Input
              type={showPassword ? "text" : "password"}
              name="confirm_password"
              value={passwordFormData.confirm_password}
              onChange={handlePasswordInputChange}
              placeholder="Potwierdź nowe hasło"
              className={errors.confirm_password ? "border-red-500" : ""}
            />
            {errors.confirm_password && <p className="mt-1 text-sm text-red-500">{errors.confirm_password}</p>}
          </div>
          
          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="py-2.5"
              size="md"
              variant="primary"
            >
              {isLoading ? "Zmienianie hasła..." : "Zmień hasło"}
            </Button>
          </div>
        </form>
      )}
      
      {/* Notification Settings */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
            <h3 className="font-medium mb-4">Preferencje powiadomień</h3>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="email_notifications"
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="w-4 h-4 border-gray-300 rounded text-brand-600 focus:ring-brand-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="email_notifications" className="font-medium text-gray-700 dark:text-gray-300">
                    Powiadomienia email
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">Otrzymuj powiadomienia na adres email.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="app_notifications"
                    type="checkbox"
                    checked={appNotifications}
                    onChange={(e) => setAppNotifications(e.target.checked)}
                    className="w-4 h-4 border-gray-300 rounded text-brand-600 focus:ring-brand-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="app_notifications" className="font-medium text-gray-700 dark:text-gray-300">
                    Powiadomienia w aplikacji
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">Otrzymuj powiadomienia wewnątrz aplikacji.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Button
                type="button"
                onClick={handleNotificationSave}
                disabled={isLoading}
                className="py-2.5"
                size="md"
                variant="primary"
              >
                {isLoading ? "Zapisywanie..." : "Zapisz ustawienia"}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Privacy Settings */}
      {activeTab === "privacy" && (
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
            <h3 className="font-medium mb-4">Ustawienia prywatności</h3>
            
            <div className="space-y-4">
              <div>
                <Label>Widoczność profilu</Label>
                <div className="mt-2">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        id="public"
                        name="visibility"
                        type="radio"
                        value="public"
                        checked={profileVisibility === "public"}
                        onChange={(e) => setProfileVisibility(e.target.value)}
                        className="h-4 w-4 border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <label htmlFor="public" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Publiczny
                        <span className="block text-sm text-gray-500 dark:text-gray-400">Twój profil będzie widoczny dla wszystkich.</span>
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="friends"
                        name="visibility"
                        type="radio"
                        value="friends"
                        checked={profileVisibility === "friends"}
                        onChange={(e) => setProfileVisibility(e.target.value)}
                        className="h-4 w-4 border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <label htmlFor="friends" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tylko znajomi
                        <span className="block text-sm text-gray-500 dark:text-gray-400">Twój profil będzie widoczny tylko dla Twoich znajomych.</span>
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="private"
                        name="visibility"
                        type="radio"
                        value="private"
                        checked={profileVisibility === "private"}
                        onChange={(e) => setProfileVisibility(e.target.value)}
                        className="h-4 w-4 border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <label htmlFor="private" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Prywatny
                        <span className="block text-sm text-gray-500 dark:text-gray-400">Twój profil będzie widoczny tylko dla Ciebie.</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Button
                type="button"
                onClick={handlePrivacySave}
                disabled={isLoading}
                className="py-2.5"
                size="md"
                variant="primary"
              >
                {isLoading ? "Zapisywanie..." : "Zapisz ustawienia"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}