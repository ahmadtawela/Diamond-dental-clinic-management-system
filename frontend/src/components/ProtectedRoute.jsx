import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../context/LocaleContext";

export default function ProtectedRoute({ children, roles }) {
  const { user, role, loading } = useAuth();
  const { t } = useLocale();

  if (loading) {
    return <div className="flex h-full items-center justify-center text-ink-secondary">{t("Loading…")}</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to="/patients" replace />;
  }

  return children;
}
