import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";

interface FormData {
  fname: string;
  lname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  fname?: string;
  lname?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  form?: string;
}

export default function SignUpForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fname: "",
    lname: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState("");

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
    
    if (!formData.fname.trim()) {
      newErrors.fname = "Imię jest wymagane";
    }
    
    if (!formData.lname.trim()) {
      newErrors.lname = "Nazwisko jest wymagane";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email jest wymagany";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Podaj prawidłowy adres email";
    }
    
    if (!formData.password) {
      newErrors.password = "Hasło jest wymagane";
    } else if (formData.password.length < 8) {
      newErrors.password = "Hasło musi mieć co najmniej 8 znaków";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Hasła muszą być identyczne";
    }
    
    if (!acceptTerms) {
      newErrors.terms = "Musisz zaakceptować warunki korzystania z serwisu";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fname: formData.fname,
          lname: formData.lname,
          email: formData.email,
          password: formData.password
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas rejestracji");
      }
      
      // Rejestracja udana, zachowaj wygenerowaną nazwę użytkownika i pokaż komunikat sukcesu
      setGeneratedUsername(data.username || "");
      setRegistrationSuccess(true);
      
      // Po 3 sekundach przekieruj do logowania
      setTimeout(() => {
        navigate("/signin", { 
          state: { 
            message: "Rejestracja przebiegła pomyślnie. Możesz się teraz zalogować używając swojego adresu email lub nazwy użytkownika." 
          } 
        });
      }, 3000);
      
    } catch (error) {
      setErrors((prevErrors) => ({ 
        ...prevErrors, 
        form: error instanceof Error ? error.message : "Wystąpił błąd podczas rejestracji" 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {registrationSuccess && (
        <div className="p-4 mb-6 text-sm text-white bg-green-500 rounded">
          <p>Rejestracja przebiegła pomyślnie!</p>
          <p>Twoja nazwa użytkownika to: <strong>{generatedUsername}</strong></p>
          <p>Za chwilę zostaniesz przekierowany do strony logowania.</p>
        </div>
      )}
      
      {errors.form && (
        <div className="p-3 mb-5 text-sm text-white bg-red-500 rounded">
          {errors.form}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <Label>
              Imię <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              name="fname"
              value={formData.fname}
              onChange={handleInputChange}
              placeholder="Wprowadź imię"
              className={errors.fname ? "border-red-500" : ""}
            />
            {errors.fname && <p className="mt-1 text-sm text-red-500">{errors.fname}</p>}
          </div>
          
          <div>
            <Label>
              Nazwisko <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              name="lname"
              value={formData.lname}
              onChange={handleInputChange}
              placeholder="Wprowadź nazwisko"
              className={errors.lname ? "border-red-500" : ""}
            />
            {errors.lname && <p className="mt-1 text-sm text-red-500">{errors.lname}</p>}
          </div>
        </div>
        
        <div>
          <Label>
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Wprowadź adres email"
            className={errors.email ? "border-red-500" : ""}
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
        
        <div>
          <Label>
            Potwierdź hasło <span className="text-red-500">*</span>
          </Label>
          <Input
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Potwierdź hasło"
            className={errors.confirmPassword ? "border-red-500" : ""}
          />
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
        </div>
        
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="w-4 h-4 border-gray-300 rounded text-brand-600 focus:ring-brand-500"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="terms" className="font-medium text-gray-700 dark:text-gray-300">
              Akceptuję <a href="#" className="text-brand-600 hover:underline">warunki korzystania</a> i <a href="#" className="text-brand-600 hover:underline">politykę prywatności</a>
            </label>
            {errors.terms && <p className="mt-1 text-sm text-red-500">{errors.terms}</p>}
          </div>
        </div>
        
        <div>
          <Button
            type="submit"
            disabled={isLoading || registrationSuccess}
            className="w-full py-2.5"
            size="md"
            variant="primary"
          >
            {isLoading ? "Rejestracja..." : "Zarejestruj się"}
          </Button>
        </div>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Masz już konto?{" "}
          <Link
            to="/signin"
            className="font-medium text-brand-600 hover:underline"
          >
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
}