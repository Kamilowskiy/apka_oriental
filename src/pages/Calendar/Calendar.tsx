import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import PageMeta from "../../components/common/PageMeta";
import api from "../../utils/axios-config.ts"; 
import { toast } from "react-hot-toast";
import plLocale from '@fullcalendar/core/locales/pl';
import './index.css'; // Zakładając, że dodałeś tam style CSS

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    startTime?: string;
    endTime?: string;
  };
}

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("00:00");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventEndTime, setEventEndTime] = useState("00:00");
  const [eventLevel, setEventLevel] = useState("Standardowe");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const [confirmationModal, setConfirmationModal] = useState(false);

  // Mapowanie typów wydarzeń na polskie nazwy
  const calendarsEventsPolish = {
    "Deadline": "danger",
    "Spotkanie": "success",
    "Informacja": "primary",
    "Inne": "warning",
  };

  // Mapowanie angielskich typów na polskie nazwy (do wyświetlania)
  const calendarTypeToPolish = {
    "danger": "Deadline",
    "success": "Spotkanie",
    "primary": "Informacja",
    "warning": "Inne"
  };

  // Funkcja do ładowania wydarzeń z API
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      console.log("Pobieranie wydarzeń z API...");
      const response = await api.get('/api/calendar');
      console.log("Otrzymane wydarzenia:", response.data);
      setEvents(response.data);
    } catch (error) {
      console.error("Błąd podczas pobierania wydarzeń:", error);
      toast.error("Nie udało się załadować wydarzeń");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    
    // Pobierz datę z selekcji
    const selectedDate = selectInfo.startStr.split('T')[0];
    setEventStartDate(selectedDate);
    
    // Ustaw godzinę, jeśli jest dostępna w selekcji
    if (selectInfo.startStr.includes('T')) {
      const timeString = selectInfo.startStr.split('T')[1].substring(0, 5);
      setEventStartTime(timeString);
    } else {
      setEventStartTime("08:00"); // Domyślna godzina początkowa
    }
    
    // Ustaw datę końcową zawsze na ten sam dzień co początkowa
    setEventEndDate(selectedDate);
    
    // Ustaw domyślną godzinę końcową godzinę później niż początkowa
    const startHour = parseInt(eventStartTime.split(':')[0] || "8");
    const startMin = parseInt(eventStartTime.split(':')[1] || "0");
    
    let endHour = startHour + 1;
    if (endHour >= 24) endHour = 23;
    
    setEventEndTime(`${endHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`);
    
    setEventLevel("Standardowe"); // Domyślna wartość
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent(event as unknown as CalendarEvent);
    setEventTitle(event.title);
    
    // Formatowanie dat i godzin
    if (event.start) {
      const startDate = new Date(event.start);
      setEventStartDate(startDate.toISOString().split('T')[0]);
      
      // Jeśli mamy zapisaną godzinę w extendedProps, używamy jej
      if (event.extendedProps.startTime) {
        setEventStartTime(event.extendedProps.startTime);
      } else {
        // Inaczej formatujemy z obiektu daty
        const hours = startDate.getHours().toString().padStart(2, '0');
        const minutes = startDate.getMinutes().toString().padStart(2, '0');
        setEventStartTime(`${hours}:${minutes}`);
      }
    }
    
    if (event.end) {
      const endDate = new Date(event.end);
      setEventEndDate(endDate.toISOString().split('T')[0]);
      
      // Jeśli mamy zapisaną godzinę w extendedProps, używamy jej
      if (event.extendedProps.endTime) {
        setEventEndTime(event.extendedProps.endTime);
      } else {
        // Inaczej formatujemy z obiektu daty
        const hours = endDate.getHours().toString().padStart(2, '0');
        const minutes = endDate.getMinutes().toString().padStart(2, '0');
        setEventEndTime(`${hours}:${minutes}`);
      }
    } else if (event.start) {
      // Jeśli brak end_date, używamy start_date
      const startDate = new Date(event.start);
      setEventEndDate(startDate.toISOString().split('T')[0]);
      
      // Domyślnie ustawiamy godzinę końcową godzinę później
      const endTime = event.extendedProps.endTime || event.extendedProps.startTime;
      if (endTime) {
        setEventEndTime(endTime);
      } else {
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 1);
        const hours = endDate.getHours().toString().padStart(2, '0');
        const minutes = endDate.getMinutes().toString().padStart(2, '0');
        setEventEndTime(`${hours}:${minutes}`);
      }
    }
    
    // Mapowanie z angielskich na polskie nazwy kolorów
    const calendarType = event.extendedProps.calendar;
    const polishEventLevel = calendarTypeToPolish[calendarType as keyof typeof calendarTypeToPolish] || "Standardowe";
    
    setEventLevel(polishEventLevel);
    openModal();
  };

  const handleAddOrUpdateEvent = async () => {
    // Walidacja
    if (!eventTitle.trim()) {
      toast.error("Tytuł wydarzenia jest wymagany");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Przygotowanie pełnych dat ze składowych daty i godziny
      const startDateTime = `${eventStartDate}T${eventStartTime}:00`;
      const endDateTime = `${eventEndDate}T${eventEndTime}:00`;
      
      const calendarType = calendarsEventsPolish[eventLevel as keyof typeof calendarsEventsPolish];
      
      const eventData = {
        title: eventTitle,
        start: startDateTime,
        end: endDateTime,
        extendedProps: { 
          calendar: calendarType,
          startTime: eventStartTime,
          endTime: eventEndTime
        }
      };
      
      console.log("Dane wydarzenia do zapisania:", eventData);
      
      if (selectedEvent) {
        // Aktualizacja istniejącego wydarzenia
        console.log(`Aktualizacja wydarzenia o ID ${selectedEvent.id}`);
        await api.put(`/api/calendar/${selectedEvent.id}`, eventData);
        toast.success("Wydarzenie zostało zaktualizowane");
      } else {
        // Dodanie nowego wydarzenia
        console.log("Dodawanie nowego wydarzenia");
        await api.post('/api/calendar', eventData);
        toast.success("Wydarzenie zostało dodane");
      }
      
      // Odświeżenie listy wydarzeń
      await fetchEvents();
      closeModal();
      resetModalFields();
    } catch (error) {
      console.error("Błąd podczas zapisywania wydarzenia:", error);
      toast.error("Nie udało się zapisać wydarzenia");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      setIsLoading(true);
      console.log(`Usuwanie wydarzenia o ID ${selectedEvent.id}`);
      await api.delete(`/api/calendar/${selectedEvent.id}`);
      
      // Odświeżenie listy wydarzeń
      await fetchEvents();
      setConfirmationModal(false);
      closeModal();
      resetModalFields();
      toast.success("Wydarzenie zostało usunięte");
    } catch (error) {
      console.error("Błąd podczas usuwania wydarzenia:", error);
      toast.error("Nie udało się usunąć wydarzenia");
    } finally {
      setIsLoading(false);
    }
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventStartTime("00:00");
    setEventEndDate("");
    setEventEndTime("00:00");
    setEventLevel("Standardowe");
    setSelectedEvent(null);
  };

  const openDeleteConfirmation = () => {
    setConfirmationModal(true);
  };

  // Klasa dla natywnych inputów daty/czasu (bez appearance-none)
  const dateTimeInputClass = "dark:bg-dark-900 h-11 w-full appearance-auto rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

  return (
    <>
      <PageMeta
        title="Oriental Design Panel klienta"
        description="Oriental Design Panel klienta"
      />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="custom-calendar">
          {isLoading && (
            <div className="text-center py-4">
              <p>Ładowanie kalendarza...</p>
            </div>
          )}
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={plLocale}
            headerToolbar={{
              left: "prev,next addEventButton",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            buttonText={{
              today: 'Dzisiaj',
              month: 'Miesiąc',
              week: 'Tydzień',
              day: 'Dzień',
              list: 'Lista'
            }}
            events={events}
            selectable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            customButtons={{
              addEventButton: {
                text: "Dodaj wydarzenie +",
                click: openModal,
              },
            }}
            // Usunięcie podświetlenia dnia z wydarzeniem
            dayCellClassNames="no-highlight"
          />
        </div>
        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          className="max-w-[700px] p-6 lg:p-10"
        >
          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
            <div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                {selectedEvent ? "Edytuj wydarzenie" : "Dodaj wydarzenie"}
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Zaplanuj swoje następne ważne wydarzenie: ustaw lub edytuj wydarzenia,
                aby być na bieżąco
              </p>
            </div>
            <div className="mt-8">
              <div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Nazwa wydarzenia
                  </label>
                  <input
                    id="event-title"
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>
              <div className="mt-6">
                <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Typ wydarzenia
                </label>
                <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                  {Object.entries(calendarsEventsPolish).map(([key, value]) => (
                    <div key={key} className="n-chk">
                      <div
                        className={`form-check form-check-${value} form-check-inline`}
                      >
                        <label
                          className="flex items-center text-sm text-gray-700 form-check-label dark:text-gray-400"
                          htmlFor={`modal${key}`}
                        >
                          <span className="relative">
                            <input
                              className="sr-only form-check-input"
                              type="radio"
                              name="event-level"
                              value={key}
                              id={`modal${key}`}
                              checked={eventLevel === key}
                              onChange={() => setEventLevel(key)}
                            />
                            <span className="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full box dark:border-gray-700">
                              <span
                                className={`h-2 w-2 rounded-full bg-white ${
                                  eventLevel === key ? "block" : "hidden"
                                }`}
                              ></span>
                            </span>
                          </span>
                          {key}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Data rozpoczęcia
                  </label>
                  <div className="relative">
                    <input
                      id="event-start-date"
                      type="date"
                      value={eventStartDate}
                      onChange={(e) => setEventStartDate(e.target.value)}
                      className={dateTimeInputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Godzina rozpoczęcia
                  </label>
                  <div className="relative">
                    <input
                      id="event-start-time"
                      type="time"
                      value={eventStartTime}
                      onChange={(e) => setEventStartTime(e.target.value)}
                      className={dateTimeInputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Data zakończenia
                  </label>
                  <div className="relative">
                    <input
                      id="event-end-date"
                      type="date"
                      value={eventEndDate}
                      onChange={(e) => setEventEndDate(e.target.value)}
                      className={dateTimeInputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Godzina zakończenia
                  </label>
                  <div className="relative">
                    <input
                      id="event-end-time"
                      type="time"
                      value={eventEndTime}
                      onChange={(e) => setEventEndTime(e.target.value)}
                      className={dateTimeInputClass}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
              {selectedEvent && (
                <button
                  onClick={openDeleteConfirmation}
                  type="button"
                  className="flex w-full justify-center rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 sm:w-auto"
                >
                  Usuń
                </button>
              )}
              <button
                onClick={closeModal}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Anuluj
              </button>
              <button
                onClick={handleAddOrUpdateEvent}
                type="button"
                disabled={isLoading}
                className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto disabled:opacity-50"
              >
                {isLoading ? "Zapisywanie..." : selectedEvent ? "Zapisz zmiany" : "Dodaj wydarzenie"}
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal potwierdzenia usunięcia */}
        <Modal
          isOpen={confirmationModal}
          onClose={() => setConfirmationModal(false)}
          className="max-w-[500px] p-6"
        >
          <div className="flex flex-col px-2">
            <h5 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
              Potwierdź usunięcie
            </h5>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Czy na pewno chcesz usunąć to wydarzenie? Tej operacji nie można cofnąć.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmationModal(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              >
                Anuluj
              </button>
              <button
                onClick={handleDeleteEvent}
                disabled={isLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? "Usuwanie..." : "Usuń"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

const renderEventContent = (eventInfo: any) => {
  const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar.toLowerCase()}`;
  return (
    <div
      className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}
    >
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};

export default Calendar;