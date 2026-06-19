import { Routes, Route, Link, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ItemDetailPage from './pages/ItemDetailPage';
import PoliceLoginPage from './pages/PoliceLoginPage';
import PoliceDashboard from './pages/PoliceDashboard';

function Nav() {
  const location = useLocation();
  const isPolice = location.pathname.startsWith('/police');

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-700 text-lg font-bold text-white">
            LF
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">Pakistan Lost & Found</p>
            <p className="text-xs text-slate-500">Police Coordination System</p>
          </div>
        </Link>
        <nav className="flex gap-3">
          {!isPolice && (
            <Link
              to="/"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Search Items
            </Link>
          )}
          <Link
            to={isPolice ? '/' : '/police/login'}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            {isPolice ? 'Public Portal' : 'Police Login'}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/items/:id" element={<ItemDetailPage />} />
          <Route path="/police/login" element={<PoliceLoginPage />} />
          <Route path="/police/dashboard" element={<PoliceDashboard />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        Pakistan Lost & Found — Local Police System
      </footer>
    </div>
  );
}
