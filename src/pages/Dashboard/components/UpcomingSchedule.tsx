import Checkbox from "../../../components/form/input/Checkbox";
import { Dropdown } from "../../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../../icons";
import { useState, useEffect } from "react";
import api from "../../../utils/axios-config";

// Interfejs dla wydarzeń z kalendarza
interface CalendarEvent {
  id: number;
  title: string;
  start_date: string;
  end_date?: string;
  event_status: string;
  calendar_type?: string;
  created_at?: string;
  updated_at?: string;
}

// Mapowanie statusów wydarzeń z angielskiego na polski
const calendarTypeToPolish = {
  "danger": "Deadline",
  "success": "Spotkanie",
  "primary": "Informacja",
  "warning": "Inne"
};

export default function UpcomingSchedule() {
  // Stan dla wydarzeń z kalendarza
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stan dla zaznaczonych elementów
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});

  // Pobieranie wydarzeń z kalendarza
  useEffect(() => {
    fetchCalendarEvents();
  }, []);

  const fetchCalendarEvents = async () => {
    try {
      setIsLoading(true);
      
      // Pobierz wydarzenia z kalendarza
      const response = await api.get("/api/calendar");
      
      if (response.data && Array.isArray(response.data)) {
        // Sortuj wydarzenia według daty rozpoczęcia (najbliższe pierwsze)
        const sortedEvents = response.data
          .filter((event: CalendarEvent) => {
            // Filtruj tylko wydarzenia, które się jeszcze nie odbyły
            const eventDate = new Date(event.start_date);
            const now = new Date();
            return eventDate >= now;
          })
          .sort((a: CalendarEvent, b: CalendarEvent) => {
            // Sortuj rosnąco według daty rozpoczęcia
            return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
          })
          .slice(0, 5); // Ogranicz do 5 najbliższych wydarzeń
        
        // Inicjalizuj stan zaznaczonych elementów
        const initialCheckedState: { [key: string]: boolean } = {};
        sortedEvents.forEach((event: CalendarEvent) => {
          initialCheckedState[`event-${event.id}`] = false;
        });
        
        setEvents(sortedEvents);
        setCheckedItems(initialCheckedState);
      } else {
        setEvents([]);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Błąd podczas pobierania wydarzeń z kalendarza:", error);
      setError("Nie udało się załadować wydarzeń z kalendarza");
      setIsLoading(false);
    }
  };

  // Obsługa zaznaczenia elementu
  const handleCheckboxChange = (id: string) => {
    setCheckedItems((prevState) => ({
      ...prevState,
      [id]: !prevState[id], // Przełączanie stanu
    }));
  };

  // Obsługa menu rozwijanego
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  
  // Formatowanie daty dla wydarzeń
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Tablica z nazwami dni tygodnia
    const days = ["Nie", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"];
    
    // Tablica z nazwami miesięcy
    const months = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];
    
    const day = days[date.getDay()];
    const dayOfMonth = date.getDate();
    const month = months[date.getMonth()];
    
    return `${day}, ${dayOfMonth} ${month}`;
  };
  
  // Formatowanie godziny dla wydarzeń
  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    
    // Pobranie godziny i minut
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    // Format 12-godzinny
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Godzina 0 powinna być wyświetlana jako 12
    
    return `${hours}:${minutes} ${ampm}`;
  };

  // Funkcja zwracająca polską nazwę statusu wydarzenia
  const getPolishStatus = (status: string) => {
    return calendarTypeToPolish[status as keyof typeof calendarTypeToPolish] || "Informacja";
  };
  
  // Funkcja zwracająca klasę CSS dla statusu wydarzenia
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'danger':
        return 'text-red-600 dark:text-red-400';
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'primary':
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };
  
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Nadchodzące wydarzenia
        </h3>

        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={() => { closeDropdown(); fetchCalendarEvents(); }}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Odśwież
            </DropdownItem>
            <DropdownItem
              onItemClick={() => { window.location.href = "/calendar"; closeDropdown(); }}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Pełny kalendarz
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[500px] xl:min-w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-t-4 border-gray-200 rounded-full border-t-brand-500 animate-spin"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-24">
              <p className="text-red-500">{error}</p>
            </div>
          ) : events.length === 0 ? (
            <div className="flex items-center justify-center h-24">
              <p className="text-gray-500 dark:text-gray-400">Brak nadchodzących wydarzeń</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4.5">
              {events.map((event) => (
                <div 
                  key={event.id} 
                  className="flex cursor-pointer items-center gap-9 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                >
                  <div className="flex items-start gap-3">
                    <div>
                      <Checkbox
                        className="w-5 h-5 rounded-md"
                        checked={checkedItems[`event-${event.id}`] || false}
                        onChange={() => handleCheckboxChange(`event-${event.id}`)}
                      />
                    </div>
                    <div>
                      <span className="mb-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
                        {formatEventDate(event.start_date)}
                      </span>
                      <span className="font-medium text-gray-700 text-theme-sm dark:text-gray-400">
                        {formatEventTime(event.start_date)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="block mb-1 font-medium text-gray-700 text-theme-sm dark:text-gray-400">
                      {event.title}
                    </span>
                    <span className={`text-theme-xs ${getStatusClass(event.event_status)}`}>
                      {getPolishStatus(event.event_status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}