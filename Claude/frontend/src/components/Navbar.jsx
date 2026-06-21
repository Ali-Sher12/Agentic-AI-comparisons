import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { police, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? "text-seal" : "text-ink/70 hover:text-ink"
    }`;

  return (
    <header className="border-b border-ink/10 bg-paper-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-seal text-seal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
              <path d="M12 2 L4 6 V11 C4 16 7.5 20 12 22 C16.5 20 20 16 20 11 V6 Z" strokeLinejoin="round" />
              <path d="M9 12 L11 14 L15.5 9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-semibold tracking-tight text-ink">
              Lost &amp; Found Registry
            </div>
            <div className="text-[0.65rem] uppercase tracking-wider text-ink/50">
              Police Department — Pakistan
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-6">
          <NavLink to="/" className={navLinkClass} end>
            Search Items
          </NavLink>
          {police ? (
            <>
              <NavLink to="/police/dashboard" className={navLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/police/add-item" className={navLinkClass}>
                Add Item
              </NavLink>
              <div className="flex items-center gap-3 border-l border-ink/15 pl-6">
                <div className="text-right leading-tight">
                  <div className="text-xs font-semibold text-ink">{police.hqName}</div>
                  <div className="text-[0.65rem] text-ink/50">{police.username}</div>
                </div>
                <button onClick={handleLogout} className="btn-secondary !px-3 !py-1.5 text-xs">
                  Log out
                </button>
              </div>
            </>
          ) : (
            <NavLink to="/police/login" className="btn-primary !px-4 !py-2 text-xs">
              Police Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
