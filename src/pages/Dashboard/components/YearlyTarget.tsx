import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useState, useEffect } from "react";
import { Dropdown } from "../../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../../icons";
import Modal from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import api from "../../../utils/axios-config";

export default function YearlyTarget() {
  // Stan dla danych rocznego celu
  const [yearlyData, setYearlyData] = useState({
    target: 200000,
    currentRevenue: 0,
    progress: 0,
    todayRevenue: 0
  });
  
  // Stan dla menu rozwijanego i modalu edycji
  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newTarget, setNewTarget] = useState(yearlyData.target.toString());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pobierz dane przy montowaniu komponentu
  useEffect(() => {
    fetchCompletedProjectsRevenue();
  }, []);

  // Pobierz przychody z ukończonych projektów
  const fetchCompletedProjectsRevenue = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Pobierz aktualny rok
      const currentYear = new Date().getFullYear();
      
      // Pobierz wszystkie projekty
      const response = await api.get("/api/projects");
      
      if (!response?.data?.projects) {
        throw new Error("Brak danych projektów z API");
      }
      
      // Filtruj ukończone projekty z bieżącego roku
      const completedProjects = response.data.projects.filter((project: any) => {
        if (project.status !== 'completed' || !project.end_date) {
          return false;
        }
        
        const endDate = new Date(project.end_date);
        return endDate.getFullYear() === currentYear;
      });
      
      // Oblicz całkowity przychód z ukończonych projektów
      const totalRevenue = completedProjects.reduce((sum: number, project: any) => {
        return sum + (parseFloat(project.price) || 0);
      }, 0);
      
      // Oblicz dzisiejszy przychód
      const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
      const todayProjects = completedProjects.filter((project: any) => {
        if (!project.end_date) return false;
        
        const endDate = new Date(project.end_date);
        const endDateStr = endDate.toISOString().split('T')[0];
        return endDateStr === today;
      });
      
      const todayRevenue = todayProjects.reduce((sum: number, project: any) => {
        return sum + (parseFloat(project.price) || 0);
      }, 0);
      
      // Załaduj ustawienie celu
      let target = 200000; // Domyślny cel
      try {
        // Próbuj pobrać cel z lokalnego magazynu
        const savedTarget = localStorage.getItem('yearlyTarget');
        if (savedTarget) {
          target = parseFloat(savedTarget);
        }
      } catch (e) {
        console.warn("Błąd podczas ładowania celu z magazynu", e);
      }
      
      // Oblicz postęp
      const progress = target > 0 ? (totalRevenue / target) * 100 : 0;
      
      // Zaktualizuj stan obliczonymi danymi
      setYearlyData({
        target: target,
        currentRevenue: totalRevenue,
        progress: parseFloat(progress.toFixed(2)),
        todayRevenue: todayRevenue
      });
      
      setIsLoading(false);
    } catch (err) {
      console.error("Błąd podczas pobierania danych projektów:", err);
      setError("Nie udało się załadować danych rocznego przychodu");
      setIsLoading(false);
    }
  };
  
  // Formatuj liczbę jako walutę
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Przełącz menu rozwijane
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Zamknij menu rozwijane
  const closeDropdown = () => {
    setIsOpen(false);
  };
  
  // Otwórz modal edycji celu
  const openEditModal = () => {
    setNewTarget(yearlyData.target.toString());
    setIsEditModalOpen(true);
    closeDropdown();
  };
  
  // Zamknij modal edycji celu
  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };
  
  // Aktualizuj cel
  const handleUpdateTarget = () => {
    const targetValue = parseFloat(newTarget);
    
    if (isNaN(targetValue) || targetValue <= 0) {
      alert('Proszę podać prawidłową kwotę celu większą od 0.');
      return;
    }
    
    // Zapisz do lokalnego magazynu dla trwałości
    try {
      localStorage.setItem('yearlyTarget', targetValue.toString());
    } catch (e) {
      console.warn("Błąd podczas zapisywania celu do magazynu", e);
    }
    
    // Zaktualizuj stan lokalny i przelicz postęp
    const newProgress = (yearlyData.currentRevenue / targetValue) * 100;
    setYearlyData({
      ...yearlyData,
      target: targetValue,
      progress: parseFloat(newProgress.toFixed(2))
    });
    
    closeEditModal();
  };

  // Opcje wykresu
  const series = [yearlyData.progress];
  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: {
          size: "80%",
        },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 5, // margines w pikselach
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            fontSize: "36px",
            fontWeight: "600",
            offsetY: -40,
            color: "#1D2939",
            formatter: function (val) {
              return val + "%";
            },
          },
        },
      },
    },
    fill: {
      type: "solid",
      colors: ["#465FFF"],
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Postęp"],
  };

  // Oblicz procent trendu na podstawie miesiąca
  const calculateTrend = () => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-indeksowany (0 = Styczeń)
    const expectedProgress = ((currentMonth + 1) / 12) * 100; // Oczekiwany % na podstawie bieżącego miesiąca
    
    const actualProgress = yearlyData.progress;
    
    if (actualProgress > expectedProgress) {
      const diff = actualProgress - expectedProgress;
      return `+${Math.round(diff)}%`;
    } else if (actualProgress < expectedProgress) {
      const diff = expectedProgress - actualProgress;
      return `-${Math.round(diff)}%`;
    }
    
    return "0%";
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Roczny Cel
            </h3>
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Docelowy przychód z ukończonych projektów
            </p>
          </div>
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
                onItemClick={openEditModal}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Edytuj Cel
              </DropdownItem>
              <DropdownItem
                onItemClick={() => fetchCompletedProjectsRevenue()}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Odśwież Dane
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-t-4 border-gray-200 rounded-full border-t-brand-500 animate-spin"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <>
            <div className="relative">
              <div className="max-h-[330px]" id="chartDarkStyle">
                <Chart
                  options={options}
                  series={series}
                  type="radialBar"
                  height={330}
                />
              </div>

              {/* Wskaźnik trendu */}
              {(() => {
                const trend = calculateTrend();
                const isPositive = trend.startsWith('+');
                const isNegative = trend.startsWith('-');
                
                return (
                  <span 
                    className={`absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full px-3 py-1 text-xs font-medium
                      ${isPositive 
                        ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500' 
                        : isNegative 
                          ? 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                  >
                    {trend}
                  </span>
                );
              })()}
            </div>
            <p className="mx-auto mt-10 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
              {`Aktualny roczny przychód: ${formatCurrency(yearlyData.currentRevenue)}. ${
                yearlyData.progress >= 100 
                  ? "Cel osiągnięty! Gratulacje!"
                  : yearlyData.progress >= 75 
                    ? "Prawie osiągnięty! Tak trzymaj."
                    : yearlyData.progress >= 50 
                      ? "Połowa celu osiągnięta. Robisz dobre postępy."
                      : yearlyData.progress >= 25 
                        ? "Dobry początek w drodze do rocznego celu."
                        : "Pracujmy nad osiągnięciem tegorocznego celu."
              }`}
            </p>
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Cel
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {formatCurrency(yearlyData.target)}
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Przychód
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {formatCurrency(yearlyData.currentRevenue)}
            {yearlyData.currentRevenue > 0 && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M7.60141 2.33683C7.73885 2.18084 7.9401 2.08243 8.16435 2.08243C8.16475 2.08243 8.16516 2.08243 8.16556 2.08243C8.35773 2.08219 8.54998 2.15535 8.69664 2.30191L12.6968 6.29924C12.9898 6.59203 12.9899 7.0669 12.6971 7.3599C12.4044 7.6529 11.9295 7.65306 11.6365 7.36027L8.91435 4.64004L8.91435 13.5C8.91435 13.9142 8.57856 14.25 8.16435 14.25C7.75013 14.25 7.41435 13.9142 7.41435 13.5L7.41435 4.64442L4.69679 7.36025C4.4038 7.65305 3.92893 7.6529 3.63613 7.35992C3.34333 7.06693 3.34348 6.59206 3.63646 6.29926L7.60141 2.33683Z"
                  fill="#039855"
                />
              </svg>
            )}
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Postęp
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {yearlyData.progress.toFixed(0)}%
          </p>
        </div>
      </div>
      
      {/* Modal edycji celu */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        className="max-w-[507px] p-6 lg:p-10"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleUpdateTarget(); }}>
          <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
            Edytuj Roczny Cel
          </h4>
          
          <div className="mb-6">
            <Label>Kwota Celu (PLN)</Label>
            <Input 
              type="number" 
              placeholder="Wprowadź kwotę celu" 
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              min="1"
              // step="1000"
            />
          </div>
          
          <div className="flex items-center justify-end w-full gap-3">
            <Button size="sm" variant="outline" onClick={closeEditModal} type="button">
              Anuluj
            </Button>
            <Button size="sm" type="submit">
              Zapisz Zmiany
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}