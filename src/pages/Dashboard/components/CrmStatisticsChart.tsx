import { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import { useState, useEffect } from "react";
import api from "../../../utils/axios-config";

// Typy okresów
type PeriodType = 'monthly' | 'quarterly' | 'yearly';

// Interfejs dla obiektu projektu
interface Project {
  id: number | string;
  status: string;
  end_date?: string;
  price: string | number;
  service_name?: string;
  client_id?: number;
  start_date?: string;
  // Można dodać więcej pól, jeśli są potrzebne
}

// Interfejs dla danych wykresu
interface ChartDataState {
  completedProjects: number[];
  revenue: number[];
  totalProjects: number;
  totalRevenue: number;
  avgProjects: number;
  avgRevenue: number;
  projectsGrowth: number;
  revenueGrowth: number;
}

export default function CrmStatisticsChart() {
  // Aktywny okres wykresu
  const [activePeriod, setActivePeriod] = useState<PeriodType>('monthly');
  
  // Dane do wykresu
  const [chartData, setChartData] = useState<ChartDataState>({
    completedProjects: [],
    revenue: [],
    totalProjects: 0,
    totalRevenue: 0,
    avgProjects: 0,
    avgRevenue: 0,
    projectsGrowth: 0,
    revenueGrowth: 0
  });
  
  // Surowe dane projektów (do przetwarzania przy zmianie okresu)
  const [projectsData, setProjectsData] = useState<Project[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjectsData();
  }, []);

  // Efekt do przetwarzania danych po zmianie okresu
  useEffect(() => {
    if (projectsData.length > 0) {
      processProjectsDataByPeriod(projectsData, activePeriod);
    }
  }, [activePeriod, projectsData]);

  // Pobieranie danych o projektach z API
  const fetchProjectsData = async () => {
    try {
      setIsLoading(true);
      
      const response = await api.get("/api/projects");
      
      if (!response?.data?.projects || !Array.isArray(response.data.projects)) {
        throw new Error("Brak danych projektów z API");
      }
      
      const projects: Project[] = response.data.projects;
      
      // Zapisz surowe dane projektów
      setProjectsData(projects);
      
      // Przetwórz dane dla aktywnego okresu
      processProjectsDataByPeriod(projects, activePeriod);
      
    } catch (error) {
      console.error("Błąd podczas pobierania danych projektów:", error);
      setIsLoading(false);
    }
  };

  // Przetwarzanie danych w zależności od wybranego okresu
  const processProjectsDataByPeriod = (projects: Project[], period: PeriodType) => {
    try {
      const currentYear = new Date().getFullYear();
      const currentDate = new Date();
      
      // Filtruj tylko ukończone projekty 
      const completedProjects = projects.filter((project: Project) => {
        if (project.status !== 'completed' || !project.end_date) {
          return false;
        }
        
        return true; // Pobieramy wszystkie projekty, bo mogą być potrzebne do widoku rocznego
      });
      
      let periodLabels: string[] = [];
      let periodProjects: number[] = [];
      let periodRevenue: number[] = [];
      
      switch (period) {
        case 'monthly':
          // 12 miesięcy
          periodLabels = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];
          periodProjects = Array(12).fill(0);
          periodRevenue = Array(12).fill(0);
          
          // Grupuj projekty według miesiąca bieżącego roku
          completedProjects.forEach(project => {
            const endDate = new Date(project.end_date!);
            if (endDate.getFullYear() === currentYear) {
              const month = endDate.getMonth();
              periodProjects[month]++;
              periodRevenue[month] += parseFloat(project.price.toString()) || 0;
            }
          });
          break;
          
        case 'quarterly':
          // 4 kwartały
          periodLabels = ["I kw.", "II kw.", "III kw.", "IV kw."];
          periodProjects = Array(4).fill(0);
          periodRevenue = Array(4).fill(0);
          
          // Grupuj projekty według kwartału bieżącego roku
          completedProjects.forEach(project => {
            const endDate = new Date(project.end_date!);
            if (endDate.getFullYear() === currentYear) {
              const month = endDate.getMonth();
              const quarter = Math.floor(month / 3);
              periodProjects[quarter]++;
              periodRevenue[quarter] += parseFloat(project.price.toString()) || 0;
            }
          });
          break;
          
        case 'yearly':
          // Ostatnie 5 lat
          const startYear = currentYear - 4;
          periodLabels = Array(5).fill(0).map((_, index) => (startYear + index).toString());
          periodProjects = Array(5).fill(0);
          periodRevenue = Array(5).fill(0);
          
          // Grupuj projekty według roku
          completedProjects.forEach(project => {
            const endDate = new Date(project.end_date!);
            const projectYear = endDate.getFullYear();
            const yearIndex = projectYear - startYear;
            
            if (yearIndex >= 0 && yearIndex < 5) {
              periodProjects[yearIndex]++;
              periodRevenue[yearIndex] += parseFloat(project.price.toString()) || 0;
            }
          });
          break;
      }
      
      // Oblicz statystyki
      const totalProjects = periodProjects.reduce((sum, count) => sum + count, 0);
      const totalRevenue = periodRevenue.reduce((sum, revenue) => sum + revenue, 0);
      
      // Obliczenie średnich i trendów (poprawione)
      let avgProjects = 0;
      let avgRevenue = 0;
      let projectsGrowth = 0;
      let revenueGrowth = 0;
      
      // Określ zakres do średniej i wzrostu w zależności od okresu
      let currentPeriodIndex = 0;
      
      switch (period) {
        case 'monthly':
          currentPeriodIndex = currentDate.getMonth();
          break;
        case 'quarterly':
          currentPeriodIndex = Math.floor(currentDate.getMonth() / 3);
          break;
        case 'yearly':
          currentPeriodIndex = 4; // Ostatni rok w 5-letnim zakresie
          break;
      }
      
      // Oblicz średnie tylko dla zakończonych okresów
      const completedPeriods = periodProjects.slice(0, currentPeriodIndex + 1);
      const completedPeriodsRevenue = periodRevenue.slice(0, currentPeriodIndex + 1);
      
      // Oblicz średnią z niezerowych wartości
      const nonZeroProjects = completedPeriods.filter(val => val > 0);
      const nonZeroRevenue = completedPeriodsRevenue.filter(val => val > 0);
      
      avgProjects = nonZeroProjects.length > 0 
        ? nonZeroProjects.reduce((sum, count) => sum + count, 0) / nonZeroProjects.length 
        : 0;
        
      avgRevenue = nonZeroRevenue.length > 0 
        ? nonZeroRevenue.reduce((sum, revenue) => sum + revenue, 0) / nonZeroRevenue.length 
        : 0;
      
      // POPRAWIONE: Obliczanie wzrostu poprzez porównanie z poprzednim okresem
      if (currentPeriodIndex > 0) {
        // Bieżący i poprzedni okres dla projektów
        const currentPeriodProjects = periodProjects[currentPeriodIndex];
        const previousPeriodProjects = periodProjects[currentPeriodIndex - 1];
        
        // Bieżący i poprzedni okres dla przychodów
        const currentPeriodRevenue = periodRevenue[currentPeriodIndex];
        const previousPeriodRevenue = periodRevenue[currentPeriodIndex - 1];
        
        // Oblicz procent wzrostu projektów
        if (previousPeriodProjects > 0) {
          projectsGrowth = ((currentPeriodProjects - previousPeriodProjects) / previousPeriodProjects) * 100;
        } else if (currentPeriodProjects > 0) {
          // Jeśli poprzedni okres był zerowy, ale bieżący ma wartość, to wzrost to 100%
          projectsGrowth = 100;
        }
        
        // Oblicz procent wzrostu przychodów
        if (previousPeriodRevenue > 0) {
          revenueGrowth = ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100;
        } else if (currentPeriodRevenue > 0) {
          // Jeśli poprzedni okres był zerowy, ale bieżący ma wartość, to wzrost to 100%
          revenueGrowth = 100;
        }
      } else if (period === 'yearly' && currentPeriodIndex >= 0) {
        // Dla widoku rocznego, jeśli jesteśmy w pierwszym roku z zakresu (bez poprzedniego roku)
        // możemy porównać z średnią z poprzednich lat (jeśli dostępne)
        const previousYearsProjects = periodProjects.slice(0, currentPeriodIndex);
        const previousYearsRevenue = periodRevenue.slice(0, currentPeriodIndex);
        
        const avgPreviousYearsProjects = previousYearsProjects.length > 0 
          ? previousYearsProjects.reduce((sum, count) => sum + count, 0) / previousYearsProjects.length 
          : 0;
          
        const avgPreviousYearsRevenue = previousYearsRevenue.length > 0 
          ? previousYearsRevenue.reduce((sum, revenue) => sum + revenue, 0) / previousYearsRevenue.length 
          : 0;
          
        // Oblicz procent wzrostu
        if (avgPreviousYearsProjects > 0) {
          projectsGrowth = ((periodProjects[currentPeriodIndex] - avgPreviousYearsProjects) / avgPreviousYearsProjects) * 100;
        }
        
        if (avgPreviousYearsRevenue > 0) {
          revenueGrowth = ((periodRevenue[currentPeriodIndex] - avgPreviousYearsRevenue) / avgPreviousYearsRevenue) * 100;
        }
      }
      
      // Aktualizuj stan wykresów
      setChartData({
        completedProjects: periodProjects,
        revenue: periodRevenue,
        totalProjects,
        totalRevenue,
        avgProjects,
        avgRevenue,
        projectsGrowth,
        revenueGrowth
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error("Błąd podczas przetwarzania danych projektu:", error);
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

  // Uzyskaj etykiety osi X w zależności od aktywnego okresu
  const getXaxisCategories = () => {
    switch (activePeriod) {
      case 'monthly':
        return ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];
      case 'quarterly':
        return ["I kw.", "II kw.", "III kw.", "IV kw."];
      case 'yearly':
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 4;
        return Array(5).fill(0).map((_, index) => (startYear + index).toString());
      default:
        return ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];
    }
  };

  // Pobierz tytuł osi Y w zależności od okresu
  const getYaxisTitle = () => {
    switch (activePeriod) {
      case 'monthly':
        return "Miesięczna liczba projektów";
      case 'quarterly':
        return "Kwartalna liczba projektów";
      case 'yearly':
        return "Roczna liczba projektów";
      default:
        return "Liczba projektów";
    }
  };

  // Pobierz tekst średniej w zależności od okresu
  const getAverageText = () => {
    switch (activePeriod) {
      case 'monthly':
        return "Średni miesięczny";
      case 'quarterly':
        return "Średni kwartalny";
      case 'yearly':
        return "Średni roczny";
      default:
        return "Średni";
    }
  };

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      labels: {
        colors: ["#4F5B67"]
      }
    },
    colors: ["#9CB9FF", "#465FFF"], // Jasna linia dla projektów, ciemna dla przychodów
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 220,
      type: "area",
      toolbar: {
        show: false,
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 220,
          },
        },
      },
      {
        breakpoint: 1600,
        options: {
          chart: {
            height: 220,
          },
        },
      },
      {
        breakpoint: 2600,
        options: {
          chart: {
            height: 250,
          },
        },
      },
    ],
    stroke: {
      curve: "straight",
      width: [2, 2],
    },
    markers: {
      size: 0,
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: function (value: number, { seriesIndex }) {
          if (seriesIndex === 0) {
            return `${value} projektów`;
          }
          return formatCurrency(value);
        }
      }
    },
    xaxis: {
      type: "category",
      categories: getXaxisCategories(),
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: [
      {
        title: {
          text: getYaxisTitle(),
        },
        labels: {
          formatter: function (value: number) {
            return value.toFixed(0);
          }
        }
      },
      {
        opposite: true,
        title: {
          text: "Przychód (PLN)"
        },
        labels: {
          formatter: function (value: number) {
            return formatCurrency(value);
          }
        }
      }
    ],
  };

  const series = [
    {
      name: "Zrealizowane Projekty",
      data: chartData.completedProjects,
    },
    {
      name: "Przychód",
      data: chartData.revenue,
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Statystyki
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Analiza zrealizowanych projektów
          </p>
        </div>
        <div className="flex items-center">
          {/* Przełączniki okresów */}
          <div className="inline-flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              onClick={() => setActivePeriod('monthly')}
              className={`px-3 py-1 text-xs rounded-md ${
                activePeriod === 'monthly'
                  ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Miesięcznie
            </button>
            <button
              onClick={() => setActivePeriod('quarterly')}
              className={`px-3 py-1 text-xs rounded-md ${
                activePeriod === 'quarterly'
                  ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Kwartalnie
            </button>
            <button
              onClick={() => setActivePeriod('yearly')}
              className={`px-3 py-1 text-xs rounded-md ${
                activePeriod === 'yearly'
                  ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Rocznie
            </button>
          </div>
          
          {/* Przycisk odświeżania */}
          <button
            onClick={fetchProjectsData}
            className="ml-3 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Odśwież
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:gap-9">
        <div className="flex items-start gap-2">
          <div>
            <h4 className="text-base font-bold text-gray-800 dark:text-white/90 sm:text-theme-xl">
              {formatCurrency(chartData.avgRevenue)}
            </h4>
            <span className="text-gray-500 text-theme-xs dark:text-gray-400">
              {getAverageText()} przychód
            </span>
          </div>
          <span className={`mt-1.5 flex items-center gap-1 rounded-full ${
            chartData.revenueGrowth >= 0 
              ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500" 
              : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500"
          } px-2 py-0.5 text-theme-xs font-medium`}>
            {chartData.revenueGrowth >= 0 ? "+" : ""}{chartData.revenueGrowth.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-start gap-2">
          <div>
            <h4 className="text-base font-bold text-gray-800 dark:text-white/90 sm:text-theme-xl">
              {chartData.avgProjects.toFixed(1)}
            </h4>
            <span className="text-gray-500 text-theme-xs dark:text-gray-400">
              {getAverageText()} liczba projektów
            </span>
          </div>
          <span className={`mt-1.5 flex items-center gap-1 rounded-full ${
            chartData.projectsGrowth >= 0 
              ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500" 
              : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500"
          } px-2 py-0.5 text-theme-xs font-medium`}>
            {chartData.projectsGrowth >= 0 ? "+" : ""}{chartData.projectsGrowth.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-4 min-w-[650px] xl:min-w-full pl-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-[220px]">
              <div className="w-8 h-8 border-4 border-t-4 border-gray-200 rounded-full border-t-brand-500 animate-spin"></div>
            </div>
          ) : (
            <Chart options={options} series={series} type="area" height={220} />
          )}
        </div>
      </div>
    </div>
  );
}