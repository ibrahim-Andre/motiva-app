import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AuthGuard from "./components/AuthGuard";
import { GlobalStyle } from "./styles/GlobalStyle";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLayout from "./layouts/AdminLayout";
import VehiclesPage from "./pages/admin/VehiclesPage";
import EarningsPage from "./pages/admin/Earnings/EarningsPage";
import InvoicesPage from "./pages/admin/InvoicesPage";
import StatsPage from "./pages/admin/StatsPage";

import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverLayout from "./layouts/DriverLayout";
import DriversPage from "./pages/admin/DriversPage";
import DriverEarningsPage from "./pages/driver/DriverEarningsPage";
import DriverVehicles from "./pages/driver/DriverVehicles";

function App() {
	
  return (
  <div className="safe-area">
    <BrowserRouter>
	<GlobalStyle />
      <Routes>

        {/* LOGIN */}
        <Route path="/" element={<Login />} />

        {/* ADMIN */}
        <Route
          path="/admin/*"
          element={
            <AuthGuard allowedRoles={["admin"]}>
              <AdminLayout />
            </AuthGuard>
          }
        >
          {/* 🔥 CRITICAL FIX */}
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="drivers" element={<DriversPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
		  <Route path="earnings" element={<EarningsPage />} />
		  <Route path="invoices" element={<InvoicesPage />} />
		  <Route path="stats" element={<StatsPage />} />
        </Route>

        {/* DRIVER */}
        <Route
          path="/driver/*"
          element={
            <AuthGuard allowedRoles={["driver"]}>
              <DriverLayout />
            </AuthGuard>
          }
        >
          {/* 🔥 ZATEN DOĞRU */}
          <Route index element={<DriverDashboard />} />
		  <Route path="earnings" element={<DriverEarningsPage />} />
          <Route path="vehicles" element={<DriverVehicles />} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
	</div>
  );
}

export default App;