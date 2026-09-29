import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { AuthUser } from "../services/auth.service";

export default function RoleRoute({
  roles,
  children,
}: {
  roles: AuthUser["role"][];
  children: ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="p-8">Loading session...</p>;
  }

  if (!user) {
    return <Navigate to="/connexion" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/espace" replace />;
  }

  return <>{children}</>;
}