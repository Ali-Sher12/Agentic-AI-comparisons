import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PoliceLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(username, password);
      const redirectTo = location.state?.from || "/police/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-16">
      <div className="case-card p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-brass-dark">
          Restricted Access
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Police Login</h1>
        <p className="mt-2 text-sm text-ink/55">
          One account per HQ. Contact your system administrator if you've lost your credentials.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-sm border border-maroon/30 bg-maroon/5 px-4 py-2.5 text-sm text-maroon-dark">
              {error}
            </div>
          )}
          <div>
            <label className="field-label">Username</label>
            <input
              required
              autoFocus
              type="text"
              className="field-input"
              placeholder="e.g. lahore.hq"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input
              required
              type="password"
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 rounded-sm bg-paper-dark px-4 py-3 text-xs leading-relaxed text-ink/55">
          <p className="font-semibold text-ink/70">Demo credentials (seed data):</p>
          <p className="mt-1 font-mono">lahore.hq / lahore123</p>
          <p className="font-mono">karachi.hq / karachi123</p>
          <p className="font-mono">islamabad.hq / islamabad123</p>
          <p className="font-mono">peshawar.hq / peshawar123</p>
        </div>
      </div>
    </div>
  );
}
