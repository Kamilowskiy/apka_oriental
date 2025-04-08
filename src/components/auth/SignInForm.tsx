import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  form?: string;
}

interface LocationState {
  message?: string;
  from?: Location;
}

export default function SignInForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const { login: authLogin, isAuthenticated } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(state?.message || "");

  // Sprawdź, czy użytkownik jest już zalogowany
  useEffect(() => {
    if (isAuthenticated) {
      // Sprawdzamy, czy jest zapisana zamierzona trasa
      const intendedRoute = sessionStorage.getItem('intendedRoute');
      
      // Przekierowanie do zapisanej trasy lub dashboardu
      const destination = intendedRoute || '/Dashboard';
      navigate(destination, { replace: true });
      
      // Czyszczenie zapisanej trasy
      sessionStorage.removeItem('intendedRoute');
    }
  }, [isAuthenticated, navigate]);

  // Sprawdzanie, czy jest zapisane "Zapamiętaj mnie" w localStorage
  useEffect(() => {
    const remembered = localStorage.getItem("rememberMe");
    if (remembered) {
      setIsChecked(true);
      
      // Sprawdzamy, czy istnieje zapisany email
      const savedEmail = localStorage.getItem("rememberedEmail");
      if (savedEmail) {
        setFormData(prev => ({ ...prev, email: savedEmail }));
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    
    // Czyścimy błędy po zmianie wartości pola
    if (errors[name as keyof typeof errors]) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = "Email jest wymagany";
    } else {
      // Validate email format
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Podaj poprawny adres email";
      }
    }
    
    if (!formData.password) {
      newErrors.password = "Hasło jest wymagane";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Ukrywamy komunikat sukcesu jeśli był wcześniej
    setSuccessMessage("");
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Wysyłanie danych logowania:", {
        email: formData.email,
        password: "***" // Nie logujemy hasła
      });
      
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error("Błąd logowania:", data);
        throw new Error(data.error || "Wystąpił błąd podczas logowania");
      }
      
      console.log("Logowanie pomyślne", data);
      
      // Obsługa "Zapamiętaj mnie"
      if (isChecked) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("rememberedEmail", formData.email);
        
        // Opcjonalnie: można ustawić dłuższy czas ważności tokenu
        // Zapisujemy token w localStorage
        localStorage.setItem("authToken", data.token);
      } else {
        // Czyścimy zapamiętane dane
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("rememberedEmail");
        
        // W przypadku niezaznaczonej opcji używamy sessionStorage
        // Token będzie dostępny tylko do zamknięcia karty/przeglądarki
        sessionStorage.setItem("authToken", data.token);
        localStorage.removeItem("authToken");
      }
      
      // Używamy funkcji login z kontekstu autoryzacji
      authLogin(data.token, data.user);
      
      // Ustawiamy komunikat sukcesu
      setSuccessMessage("Logowanie pomyślne! Przekierowywanie...");
      
      // Sprawdzamy, czy jest zapisana zamierzona trasa
      const intendedRoute = sessionStorage.getItem('intendedRoute');
      
      // Przekierowanie do zapisanej trasy, poprzedniej strony lub do strony głównej
      const destination = intendedRoute || (state?.from ? state.from.pathname : '/Dashboard');
      
      // Przekierowanie z małym opóźnieniem, żeby użytkownik zobaczył komunikat sukcesu
      setTimeout(() => {
        // Czyszczenie zapisanej trasy po przekierowaniu
        sessionStorage.removeItem('intendedRoute');
        
        navigate(destination, { replace: true });
      }, 1000);
      
    } catch (error) {
      console.error("Błąd logowania:", error);
      setErrors((prevErrors) => ({ 
        ...prevErrors, 
        form: error instanceof Error ? error.message : "Wystąpił błąd podczas logowania" 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {successMessage && (
        <div className="p-3 mb-5 text-sm text-white bg-green-500 rounded">
          {successMessage}
        </div>
      )}
      
      {errors.form && (
        <div className="p-3 mb-5 text-sm text-white bg-red-500 rounded">
          {errors.form}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label>
            Email <span className="text-red-500">*</span>
          </Label>
          <Input 
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Wprowadź adres email" 
            className={errors.email ? "border-red-500" : ""}
            autoComplete="email"
          />
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
        </div>
        
        <div>
          <Label>
            Hasło <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Wprowadź hasło"
              className={errors.password ? "border-red-500" : ""}
              autoComplete="current-password"
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
          {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
            />
            <label htmlFor="remember-me" className="block ml-2 text-sm text-gray-900 dark:text-gray-300">
              Zapamiętaj mnie
            </label>
          </div>
          
          <div className="text-sm">
            <Link to="/forgot-password" className="font-medium text-brand-600 hover:text-brand-500">
              Zapomniałeś hasła?
            </Link>
          </div>
        </div>
        
        <div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5"
            size="md"
            variant="primary"
          >
            {isLoading ? "Logowanie..." : "Zaloguj się"}
          </Button>
        </div>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Nie masz jeszcze konta?{" "}
          <Link
            to="/signup"
            className="font-medium text-brand-600 hover:underline"
          >
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  );
}