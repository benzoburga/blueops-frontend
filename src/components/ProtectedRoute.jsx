// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";

const getSessionUser = () => {
  const raw =
    localStorage.getItem("authUser") ??
    sessionStorage.getItem("authUser") ??
    localStorage.getItem("usuario") ??
    sessionStorage.getItem("usuario") ??
    null;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const location = useLocation();
  const user = getSessionUser();

  // no logueado
  if (!user?.id) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // sin permiso
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
