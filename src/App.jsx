import { Routes, Route } from "react-router-dom";
import LoginForm from "@components/LoginForm/LoginForm";
import AdminDashboard from "@modulos/AdministradorBlueOps/AdminDashboard";
import ClienteAdminDashboard from "@modulos/ClienteAdministrador/ClienteAdminDashboard";
import ClienteUsuarioDashboard from "@modulos/ClienteUsuario/ClienteUsuarioDashboard";
import MedicoDashboard from "@modulos/Medico/MedicoDashboard";
import ProtectedRoute from "@components/ProtectedRoute";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginForm />} />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cliente-admin/*"
        element={
          <ProtectedRoute allowedRoles={["cliente_admin"]}>
            <ClienteAdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cliente-usuario/*"
        element={
          <ProtectedRoute allowedRoles={["cliente_usuario"]}>
            <ClienteUsuarioDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/medico/*"
        element={
          <ProtectedRoute allowedRoles={["medico"]}>
            <MedicoDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
