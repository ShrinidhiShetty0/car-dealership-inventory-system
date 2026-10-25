import { useState } from 'react';
import { register, login } from '../services/api';

export default function AuthPanel({ user, onLogin, onLogout, message, setMessage }) {
  const [mode, setMode] = useState(null); // 'login' | 'register' | null
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(mode === 'login' ? 'Logging in…' : 'Registering…');

    try {
      if (mode === 'register') {
        await register({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
        });
        setMessage(`Registration successful for ${form.username}. Please log in.`);
        setMode('login');
        setForm((prev) => ({ ...prev, password: '' }));
      } else {
        const result = await login({
          username: form.username.trim(),
          password: form.password,
        });
        onLogin(result.access_token, result.username, result.role);
        setMode(null);
        setForm({ username: '', email: '', password: '' });
      }
    } catch (err) {
      setMessage(`${mode === 'login' ? 'Login' : 'Registration'} failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2 className="text-xl font-semibold mb-4">Account</h2>

      {user ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-slate-700">
            Logged in as <strong>{user.username}</strong> ({user.role})
          </span>
          <button type="button" className="btn-secondary" onClick={onLogout}>
            Log out
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setMode('login');
                setMessage('');
              }}
            >
              Log in
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setMode('register');
                setMessage('');
              }}
            >
              Register
            </button>
          </div>

          {mode && (
            <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-sm text-slate-600 mb-1">Username</label>
                <input
                  name="username"
                  className="input"
                  value={form.username}
                  onChange={handleChange}
                  required
                  minLength={3}
                />
              </div>

              {mode === 'register' && (
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-sm text-slate-600 mb-1">Email</label>
                  <input
                    name="email"
                    type="email"
                    className="input"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              <div className="flex-1 min-w-[140px]">
                <label className="block text-sm text-slate-600 mb-1">Password</label>
                <input
                  name="password"
                  type="password"
                  className="input"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Register'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setMode(null)}
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      )}

      {message && (
        <p className="mt-3 text-sm text-slate-600" role="status" aria-live="polite">
          {message}
        </p>
      )}
    </section>
  );
}
