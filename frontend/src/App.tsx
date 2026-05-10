import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ReportsPage } from "./pages/reports/ReportsPage";
import { AuditLogPage } from "./pages/audit/AuditLogPage";
import { UsersPage } from "./pages/users/UsersPage";
import { UploadHistoryPage } from "./pages/upload/UploadHistoryPage";
import { SettingsPage } from "./pages/settings/SettingsPage";
import { TenurePage } from "./pages/tenure/TenurePage";
import { MpsPage } from "./pages/mp/MpsPage";
import { StaffPage } from "./pages/staff/StaffPage";
import { OfficesPage } from "./pages/office/OfficesPage";
import { FlatsPage } from "./pages/flat/FlatsPage";
import { QuartersPage } from "./pages/quarter/QuartersPage";
import { AllocationsPage } from "./pages/allocation/AllocationsPage";
import { LookupsPage } from "./pages/lookups/LookupsPage";

const theme = {
  token: {
    colorPrimary: "#1a4b8c",
    borderRadius: 6,
    fontFamily: "'Noto Sans Bengali', 'Roboto', sans-serif",
  },
};

export default function App() {
  return (
    <ConfigProvider theme={theme}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="tenure"      element={<TenurePage />} />
              <Route path="mps"         element={<MpsPage />} />
              <Route path="offices"     element={<OfficesPage />} />
              <Route path="flats"       element={<FlatsPage />} />
              <Route path="staff"       element={<StaffPage />} />
              <Route path="quarters"    element={<QuartersPage />} />
              <Route path="allocations" element={<AllocationsPage />} />
              <Route path="lookups"     element={<LookupsPage />} />
              <Route path="reports"        element={<ReportsPage />} />
              <Route path="upload-history" element={<UploadHistoryPage />} />
              <Route path="settings"       element={<SettingsPage />} />

              <Route
                path="audit"
                element={
                  <ProtectedRoute superAdminOnly>
                    <AuditLogPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute superAdminOnly>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}
