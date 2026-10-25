import { useState } from 'react';
import { addVehicle } from '../services/api';

const initial = { make: '', model: '', category: '', price: '', quantity: '' };

export default function AddVehicleForm({ onSuccess }) {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('Submitting vehicle…');

    const payload = {
      make: form.make.trim(),
      model: form.model.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      quantity: Number(form.quantity),
    };

    if (!payload.make || !payload.model || !payload.category) {
      setMessage('Please fill in all vehicle details.');
      setLoading(false);
      return;
    }
    if (!Number.isFinite(payload.price) || payload.price <= 0) {
      setMessage('Price must be greater than zero.');
      setLoading(false);
      return;
    }
    if (!Number.isInteger(payload.quantity) || payload.quantity < 0) {
      setMessage('Quantity must be zero or a positive whole number.');
      setLoading(false);
      return;
    }

    try {
      await addVehicle(payload);
      setForm(initial);
      setMessage('Vehicle added successfully!');
      onSuccess?.();
    } catch (err) {
      setMessage(`Could not add vehicle: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2 className="text-xl font-semibold mb-4">Add Vehicle (Admin)</h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3">
        <input
          name="make"
          className="input flex-1 min-w-[140px]"
          placeholder="Make (e.g. Toyota)"
          value={form.make}
          onChange={handleChange}
          required
        />
        <input
          name="model"
          className="input flex-1 min-w-[140px]"
          placeholder="Model (e.g. Camry)"
          value={form.model}
          onChange={handleChange}
          required
        />
        <input
          name="category"
          className="input flex-1 min-w-[140px]"
          placeholder="Category (e.g. Sedan)"
          value={form.category}
          onChange={handleChange}
          required
        />
        <input
          name="price"
          type="number"
          min="0.01"
          step="0.01"
          className="input flex-1 min-w-[120px]"
          placeholder="Price (INR)"
          value={form.price}
          onChange={handleChange}
          required
        />
        <input
          name="quantity"
          type="number"
          min="0"
          step="1"
          className="input flex-1 min-w-[100px]"
          placeholder="Quantity"
          value={form.quantity}
          onChange={handleChange}
          required
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Adding…' : 'Add Vehicle'}
        </button>
      </form>
      {message && (
        <p className="mt-3 text-sm text-slate-600" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
