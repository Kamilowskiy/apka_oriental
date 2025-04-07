import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {ThemeToggleButton} from "../common/ThemeToggleButton";
import LogoutButton from "./LogoutButton";

// Import icons from the existing icon list
import { MenuIcon, UserIcon, BellIcon, SearchIcon, SettingsIcon } from "../../icons/index";

const Header = () => {
  const { user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 bg-white py-6 dark:bg-gray-900">
      {/* Burger Menu for Mobile */}
      <button className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 lg:hidden dark:bg-gray-800">
        <MenuIcon className="fill-current text-gray-700 dark:text-white" />
      </button>

      {/* Search */}
      <div className="hidden lg:block lg:w-84">
        <form>
          <div className="relative">
            <input
              type="text"
              placeholder="Szukaj..."
              className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <SearchIcon className="fill-gray-500 dark:fill-gray-400" />
            </span>
          </div>
        </form>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3 md:gap-6">
        <div className="flex items-center gap-3">
          <ThemeToggleButton />

          {/* Notifications */}
          <button className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700">
            <BellIcon className="fill-gray-600 dark:fill-gray-400" />
            <span className="absolute right-1 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-error-500 text-xs font-semibold text-white dark:border-gray-900">
              2
            </span>
          </button>

          {/* User profile dropdown */}
          <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700"
            >
              <UserIcon className="fill-gray-600 dark:fill-gray-400" />
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                    <p className="font-medium">{user?.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Twój profil
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Ustawienia
                  </Link>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <div className="px-4 py-1">
                    <LogoutButton />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;