import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setPoliceSession } from '../lib/api';

export default function PoliceLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, police } = await api.auth.login(username, password);
      setPoliceSession(token, police);
      navigate('/police/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Police Login</h1>
        <p className="mb-6 text-sm text-slate-600">
          One account per headquarters. All HQs share visibility of all logged items.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="e.g. lahore_police"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-700 py-2.5 font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 rounded-lg bg-slate-50 p-4 text-xs text-slate-600">
          <p className="mb-1 font-medium">Demo credentials (after seed):</p>
          <p>lahore_police / lahore123</p>
          <p>karachi_police / karachi123</p>
          <p>islamabad_police / islamabad123</p>
          <p>peshawar_police / peshawar123</p>
        </div>
      </div>
    </div>
  );
}
