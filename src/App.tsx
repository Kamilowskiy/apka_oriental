import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AlertProvider } from "./context/AlertContext"; // Add this import


// Lazy-loading dla stron, które będą potrzebne dopiero po zalogowaniu
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar/Calendar";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import Home from "./pages/Dashboard/Home";
import Settings from "./pages/SettingsPage/Settings";
import TaskKanban from "./pages/ProjectManager/TaskKanban";
import TaskList from "./pages/ProjectManager/TaskList";
import ProjectTaskList from "./pages/ProjectManager/ProjectTaskList"; // Dodano import dla nowej strony zadań projektu
import FileManager from "./pages/FileManager";
import EmailInbox from "./pages/Email/EmailInbox";
import EmailDetails from "./pages/Email/EmailDetails";
import Chats from "./pages/Chat/Chats";
import Invoices from "./pages/Invoices";
import Stocks from "./pages/Dashboard/Stocks";
import Crm from "./pages/Dashboard/Crm";
import Marketing from "./pages/Dashboard/Marketing";
import Analytics from "./pages/Dashboard/Analytics";
import Saas from "./pages/Dashboard/Saas";
import { NotificationProvider } from "./context/NotificationContext"; // Dodaj ten impo
import Clients from "./pages/ClientsPage/Clients";
import ClientDetail from "./pages/ClientsPage/ClientsDetail";
import NotificationsPage from "./pages/NotificationPage";


export default function App() {
  return (
    <AuthProvider>
         <NotificationProvider>
       <AlertProvider>
        <Router>
          <ScrollToTop />
          
          <Routes>
            {/* Publiczne ścieżki */}
            <Route path="/signin" element={<SignIn />} />
            {/* <Route path="/signup" element={<SignUp />} /> */}
            
            {/* Przekierowanie z głównej strony na logowanie lub dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            
            {/* Chronione ścieżki - wymagają zalogowania */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/marketing" element={<Marketing />} />
                <Route path="/crm" element={<Crm />} />
                <Route path="/stocks" element={<Stocks />} />
                <Route path="/saas" element={<Saas />} />
                <Route path="/notifications" element={<NotificationsPage />} />


                <Route path="/dashboard" element={<Home />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/clients/:id" element={<ClientDetail />} />
                <Route path="/projects" element={<TaskKanban />} />
                <Route path="/project-tasks/:projectId" element={<ProjectTaskList />} />
                <Route path="/file-manager" element={<FileManager />} />

                <Route path="/inbox" element={<EmailInbox />} />
                <Route path="/inbox-details" element={<EmailDetails />} />
                <Route path="/chat" element={<Chats />} />
                <Route path="/invoice" element={<Invoices />} />

                {/* Nowa ścieżka do wyświetlania zadań dla konkretnego projektu */}
                <Route path="/project-tasks/:projectId" element={<ProjectTaskList />} />

                <Route path="/kanban" element={<TaskKanban />} />
                <Route path="/task-list" element={<TaskList />} />
                
                {/* Pozostałe chronione ścieżki */}
                <Route path="/profile" element={<UserProfiles />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/blank" element={<Blank />} />
                <Route path="/form-elements" element={<FormElements />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/avatars" element={<Avatars />} />
                <Route path="/badge" element={<Badges />} />
                <Route path="/buttons" element={<Buttons />} />
                <Route path="/images" element={<Images />} />
                <Route path="/videos" element={<Videos />} />
                <Route path="/line-chart" element={<LineChart />} />
                <Route path="/bar-chart" element={<BarChart />} />
              </Route>
            </Route>

            {/* Strona 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AlertProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}