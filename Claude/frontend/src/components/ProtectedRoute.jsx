import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { police, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-ink/50">
        Loading…
      </div>
    );
  }

  if (!police) {
    return <Navigate to="/police/login" replace />;
  }

  return children;
}
