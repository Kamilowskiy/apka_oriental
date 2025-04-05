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

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
  };
}

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState("Primary");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const [confirmationModal, setConfirmationModal] = useState(false);

  const calendarsEvents = {
    Danger: "danger",
    Success: "success",
    Primary: "primary",
    Warning: "warning",
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
    setEventStartDate(selectInfo.startStr);
    setEventEndDate(selectInfo.endStr || selectInfo.startStr);
    setEventLevel("Primary"); // Domyślna wartość
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent(event as unknown as CalendarEvent);
    setEventTitle(event.title);
    
    // Formatowanie dat do formatu YYYY-MM-DD
    if (event.start) {
      const startDate = new Date(event.start);
      setEventStartDate(startDate.toISOString().split('T')[0]);
    }
    
    if (event.end) {
      const endDate = new Date(event.end);
      setEventEndDate(endDate.toISOString().split('T')[0]);
    } else if (event.start) {
      // Jeśli brak end_date, używamy start_date
      const startDate = new Date(event.start);
      setEventEndDate(startDate.toISOString().split('T')[0]);
    }
    
    setEventLevel(event.extendedProps.calendar);
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
      
      const eventData = {
        title: eventTitle,
        start: eventStartDate,
        end: eventEndDate,
        extendedProps: { calendar: eventLevel }
      };
      
      console.log("Dane wydarzenia do zapisania:", eventData);
      
      if (selectedEvent) {
        // Aktualizacja istniejącego wydarzenia
        console.log(`Aktualizacja wydarzenia o ID ${selectedEvent.id}`);
        await api.put(`/api/calendar/${selectedEvent.id}`, eventData);
        toast.success("Wydarzenie zaktualizowane");
      } else {
        // Dodanie nowego wydarzenia
        console.log("Dodawanie nowego wydarzenia");
        await api.post('/api/calendar', eventData);
        toast.success("Wydarzenie dodane");
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
      toast.success("Wydarzenie usunięte");
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
    setEventEndDate("");
    setEventLevel("Primary");
    setSelectedEvent(null);
  };

  const openDeleteConfirmation = () => {
    setConfirmationModal(true);
  };

  return (
    <>
      <PageMeta
        title="Oriental Design Client service panel"
        description="Oriental Design Client service panel"
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
            headerToolbar={{
              left: "prev,next addEventButton",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
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
                Zaplanuj swoje następne duże wydarzenie: ustaw lub edytuj wydarzenia,
                aby być na bieżąco
              </p>
            </div>
            <div className="mt-8">
              <div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Tytuł wydarzenia
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
                  Kolor wydarzenia
                </label>
                <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                  {Object.entries(calendarsEvents).map(([key, value]) => (
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

              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Data rozpoczęcia
                </label>
                <div className="relative">
                  <input
                    id="event-start-date"
                    type="date"
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Data zakończenia
                </label>
                <div className="relative">
                  <input
                    id="event-end-date"
                    type="date"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
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