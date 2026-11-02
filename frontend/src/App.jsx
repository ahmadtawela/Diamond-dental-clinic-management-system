import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LocaleProvider } from "./context/LocaleContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import PatientsList from "./pages/patients/PatientsList";
import PatientDetail from "./pages/patients/PatientDetail";
import AppointmentsPage from "./pages/appointments/AppointmentsPage";
import ReportsPage from "./pages/reports/ReportsPage";
import UsersPage from "./pages/users/UsersPage";
import ReceptionistDashboard from "./pages/ReceptionistDashboard";

function HomeRedirect() {
  const { role } = useAuth();
  return <Navigate to={role === "receptionist" ? "/dashboard" : "/patients"} replace />;
}

export default function App() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<HomeRedirect />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute roles={["receptionist"]}>
                    <ReceptionistDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/patients" element={<PatientsList />} />
              <Route path="/patients/:id" element={<PatientDetail />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LocaleProvider>
  );
}
