import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import AuthPanel from './components/AuthPanel';
import Stats from './components/Stats';
import AddVehicleForm from './components/AddVehicleForm';
import SearchForm from './components/SearchForm';
import VehicleTable from './components/VehicleTable';
import {
  getStoredUser,
  setAuth,
  clearAuth,
  listVehicles,
  searchVehicles,
} from './services/api';

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [authMessage, setAuthMessage] = useState(
    user ? `Welcome back, ${user.username}!` : 'Please log in to manage inventory.'
  );

  const isAdmin = user?.role === 'admin';

  const loadVehicles = useCallback(async () => {
    if (!user) {
      setVehicles([]);
      return;
    }
    setLoading(true);
    try {
      const data = await listVehicles();
      setVehicles(Array.isArray(data) ? data : []);
      setMessage('');
    } catch (err) {
      setMessage(err.message);
      if (err.message.includes('401') || err.message.toLowerCase().includes('token')) {
        clearAuth();
        setUser(null);
        setAuthMessage('Session expired. Please log in again.');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const handleLogin = (token, username, role) => {
    setAuth(token, username, role);
    setUser({ token, username, role });
    setAuthMessage(`Welcome ${username}! Role: ${role}`);
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setVehicles([]);
    setAuthMessage('You have logged out.');
    setMessage('Please log in to view inventory.');
  };

  const handleSearch = async (filters) => {
    if (!user) {
      setMessage('Please log in first.');
      return;
    }
    setLoading(true);
    try {
      const data = await searchVehicles(filters);
      setVehicles(Array.isArray(data) ? data : []);
      setMessage('Search completed.');
    } catch (err) {
      setMessage(`Search failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSearch = () => {
    loadVehicles();
    setMessage('Showing all vehicles.');
  };

  const totalStock = vehicles.reduce((sum, v) => sum + Number(v.quantity || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <section>
          <h2 className="text-2xl font-bold text-slate-900">Vehicle Inventory</h2>
          <p className="text-slate-500 mt-1">
            Manage, search and update your dealership vehicles.
          </p>
        </section>

        <Stats vehicleCount={vehicles.length} stockCount={totalStock} />

        <AuthPanel
          user={user}
          onLogin={handleLogin}
          onLogout={handleLogout}
          message={authMessage}
          setMessage={setAuthMessage}
        />

        {isAdmin && (
          <AddVehicleForm
            onSuccess={() => {
              loadVehicles();
              setMessage('Vehicle added successfully.');
            }}
          />
        )}

        {user && (
          <>
            <SearchForm onSearch={handleSearch} onReset={handleResetSearch} />

            <section className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Available Vehicles</h2>
                {loading && (
                  <span className="text-sm text-blue-600 animate-pulse">Loading…</span>
                )}
              </div>
              {message && (
                <p className="mb-3 text-sm text-slate-600" role="status">
                  {message}
                </p>
              )}
              <VehicleTable
                vehicles={vehicles}
                isAdmin={isAdmin}
                onRefresh={loadVehicles}
                setMessage={setMessage}
              />
            </section>
          </>
        )}

        {!user && (
          <section className="card text-center py-12 text-slate-500">
            Please log in to view inventory.
          </section>
        )}
      </main>
    </div>
  );
}
