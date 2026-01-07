import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getCurrentSession } from "@/services/auth/authService";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const session = getCurrentSession();

  if (!session) {
    // Redirect to login page, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
