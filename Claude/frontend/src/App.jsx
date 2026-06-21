import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import HomePage from "./pages/HomePage";
import ItemDetailPage from "./pages/ItemDetailPage";
import PoliceLoginPage from "./pages/PoliceLoginPage";
import PoliceDashboardPage from "./pages/PoliceDashboardPage";
import AddItemPage from "./pages/AddItemPage";
import PoliceItemDetailPage from "./pages/PoliceItemDetailPage";

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-paper">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/items/:id" element={<ItemDetailPage />} />
            <Route path="/police/login" element={<PoliceLoginPage />} />
            <Route
              path="/police/dashboard"
              element={
                <ProtectedRoute>
                  <PoliceDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/police/add-item"
              element={
                <ProtectedRoute>
                  <AddItemPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/police/items/:id"
              element={
                <ProtectedRoute>
                  <PoliceItemDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="*"
              element={
                <div className="mx-auto max-w-2xl px-6 py-24 text-center">
                  <p className="font-display text-2xl text-ink/70">Page not found</p>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
