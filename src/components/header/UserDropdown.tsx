import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import UserProfileSettings from "../../pages/SettingsPage/Settings";

const UserDropdown: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/signin");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Generate user initials for avatar
  const getUserInitials = (): string => {
    if (!user) return "";
    
    const firstName = user.first_name || "";
    const lastName = user.last_name || "";
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Get full user name
  const getFullName = (): string => {
    console.log(user);
    if (!user) return "";
    
    const firstName = user.first_name || "";
    const lastName = user.last_name || "";
    
    if (!firstName && !lastName) {
      return user.email || "Użytkownik";
    }
    
    return `${firstName} ${lastName}`.trim();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-3 py-1"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <div className="flex items-center justify-center w-10 h-10 text-white rounded-full bg-brand-500">
          {getUserInitials() || "U"}
        </div>
        <div className="hidden md:block">
          <h6 className="text-sm font-medium text-gray-800 dark:text-white">
            {getFullName()}
          </h6>
          <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || ""}</p>
        </div>
        <span className="text-gray-500 dark:text-gray-400">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.18307 0.811963C1.41227 0.582766 1.78787 0.582766 2.01708 0.811963L6.00008 4.79504L9.98315 0.811963C10.2124 0.582766 10.588 0.582766 10.8172 0.811963C11.0464 1.04116 11.0464 1.41676 10.8172 1.64596L6.41712 6.04599C6.18791 6.27518 5.81232 6.27518 5.58311 6.04599L1.18307 1.64596C0.953876 1.41676 0.953876 1.04116 1.18307 0.811963Z" fill="currentColor"/>
          </svg>
        </span>
      </button>
      
      {isDropdownOpen && (
        <div className="absolute right-0 w-60 p-2 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 z-50">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <h6 className="text-sm font-medium text-gray-800 dark:text-white">
              {getFullName()}
            </h6>
            <p className="text-xs truncate text-gray-500 dark:text-gray-400">
              {user?.email || ""}
            </p>
          </div>
          <div className="py-2">
            <Link 
              to="/profile" 
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={() => setIsDropdownOpen(false)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M9.00008 1.5C6.5146 1.5 4.50008 3.51452 4.50008 6C4.50008 8.48548 6.5146 10.5 9.00008 10.5C11.4856 10.5 13.5001 8.48548 13.5001 6C13.5001 3.51452 11.4856 1.5 9.00008 1.5ZM3.00008 6C3.00008 2.68629 5.6864 0 9.00008 0C12.3138 0 15.0001 2.68629 15.0001 6C15.0001 9.31371 12.3138 12 9.00008 12C5.6864 12 3.00008 9.31371 3.00008 6Z" fill="currentColor"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M4.39879 13.5C2.75937 13.5 1.49879 14.7606 1.49879 16.4C1.49879 16.9523 1.05107 17.4 0.498789 17.4C-0.0534349 17.4 -0.501211 16.9523 -0.501211 16.4C-0.501211 13.9313 1.93007 12 4.39879 12H13.5988C16.0675 12 18.4988 13.9313 18.4988 16.4C18.4988 16.9523 18.051 17.4 17.4988 17.4C16.9465 17.4 16.4988 16.9523 16.4988 16.4C16.4988 14.7606 15.2382 13.5 13.5988 13.5H4.39879Z" fill="currentColor"/>
              </svg>
              <span>Mój profil</span>
            </Link>
            <Link 
              to="/settings" 
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={() => setIsDropdownOpen(false)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M8.25 1.25C8.25 0.835786 8.58579 0.5 9 0.5C9.41421 0.5 9.75 0.835786 9.75 1.25V1.6C10.0881 1.6 10.4207 1.64289 10.7428 1.7249C11.0923 1.81249 11.3072 2.16762 11.2197 2.51714C11.1321 2.86667 10.7769 3.08154 10.4274 2.99395C10.1294 2.9158 9.8198 2.875 9.5 2.875H8.5C7.09987 2.875 6.25 3.93393 6.25 5C6.25 6.06607 7.09987 7.125 8.5 7.125H9.5C11.6601 7.125 13.25 8.93393 13.25 11C13.25 13.0661 11.6601 14.875 9.5 14.875H8.5C8.1802 14.875 7.8706 14.8342 7.57255 14.756C7.22303 14.6685 6.86791 14.8833 6.78031 15.2329C6.69272 15.5824 6.90759 15.9375 7.25712 16.0251C7.57933 16.1071 7.91191 16.15 8.25 16.15V16.5C8.25 16.9142 8.58579 17.25 9 17.25C9.41421 17.25 9.75 16.9142 9.75 16.5V16.15C11.873 16.15 13.75 14.3255 13.75 11C13.75 8.80113 12.8226 7.49772 11.5 6.86028C12.8226 6.22283 13.75 4.91943 13.75 2.72055C13.75 0.51045 11.873 0.5 9.75 0.5V0.85C9.75 0.5 9.41421 0.5 9 0.5C8.58579 0.5 8.25 0.5 8.25 0.85V1.25Z" fill="currentColor"/>
              </svg>
              <span>Ustawienia</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 0.75C9.41421 0.75 9.75 1.08579 9.75 1.5V9C9.75 9.41421 9.41421 9.75 9 9.75C8.58579 9.75 8.25 9.41421 8.25 9V1.5C8.25 1.08579 8.58579 0.75 9 0.75Z" fill="currentColor"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M4.33062 3.40162C5.58752 2.3862 7.21037 1.74997 9 1.74997C10.6589 1.74997 12.1675 2.30403 13.364 3.24997H13C12.5858 3.24997 12.25 3.58576 12.25 3.99997C12.25 4.41418 12.5858 4.74997 13 4.74997H15C15.4142 4.74997 15.75 4.41418 15.75 3.99997V1.99997C15.75 1.58576 15.4142 1.24997 15 1.24997C14.5858 1.24997 14.25 1.58576 14.25 1.99997V2.06975C12.8174 1.02348 10.9817 0.399971 9 0.399971C6.88748 0.399971 4.96436 1.14798 3.5 2.36314C2.03564 3.57831 1 5.33218 1 7.34997C1 9.20168 1.7757 10.9643 3.56168 12.0788C5.00854 13.0046 6.87082 13.5 9 13.5C11.1292 13.5 12.9915 13.0046 14.4383 12.0788C16.2243 10.9643 17 9.20168 17 7.34997C17 6.93576 16.6642 6.59997 16.25 6.59997C15.8358 6.59997 15.5 6.93576 15.5 7.34997C15.5 8.74827 14.9507 9.98569 13.6867 10.771C12.4084 11.5696 10.8708 11.9999 9 11.9999C7.12917 11.9999 5.59146 11.5696 4.31332 10.771C3.04929 9.98569 2.5 8.74827 2.5 7.34997C2.5 5.86776 3.21432 4.51857 4.33062 3.40162Z" fill="currentColor"/>
              </svg>
              <span>Wyloguj się</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;