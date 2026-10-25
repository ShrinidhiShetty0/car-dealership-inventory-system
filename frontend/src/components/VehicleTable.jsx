import { useState } from 'react';
import {
  updateVehicle,
  deleteVehicle,
  purchaseVehicle,
  restockVehicle,
} from '../services/api';

function formatPrice(price) {
  return Number(price).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
  });
}

function AdminActions({ vehicle, onRefresh, setMessage }) {
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [restockQty, setRestockQty] = useState('');
  const [busy, setBusy] = useState(false);

  const handleUpdate = async () => {
    const changes = {};
    if (price !== '') changes.price = Number(price);
    if (quantity !== '') changes.quantity = Number(quantity);

    if (Object.keys(changes).length === 0) {
      setMessage('Enter a new price or quantity.');
      return;
    }

    setBusy(true);
    try {
      await updateVehicle(vehicle.id, changes);
      setPrice('');
      setQuantity('');
      await onRefresh();
      setMessage('Vehicle updated successfully.');
    } catch (err) {
      setMessage(`Update failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${vehicle.make} ${vehicle.model}?`)) return;
    setBusy(true);
    try {
      await deleteVehicle(vehicle.id);
      await onRefresh();
      setMessage('Vehicle deleted successfully.');
    } catch (err) {
      setMessage(`Delete failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleRestock = async () => {
    const qty = Number(restockQty);
    if (!Number.isInteger(qty) || qty <= 0) {
      setMessage('Restock quantity must be a positive whole number.');
      return;
    }
    setBusy(true);
    try {
      await restockVehicle(vehicle.id, qty);
      setRestockQty('');
      await onRefresh();
      setMessage('Vehicle restocked successfully.');
    } catch (err) {
      setMessage(`Restock failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <input
        type="number"
        min="0.01"
        step="0.01"
        placeholder="New price"
        className="input w-24 py-1 text-sm"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        disabled={busy}
      />
      <input
        type="number"
        min="0"
        step="1"
        placeholder="New qty"
        className="input w-20 py-1 text-sm"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        disabled={busy}
      />
      <button
        type="button"
        className="btn-primary text-sm py-1 px-3"
        onClick={handleUpdate}
        disabled={busy}
      >
        Update
      </button>
      <input
        type="number"
        min="1"
        step="1"
        placeholder="Restock"
        className="input w-20 py-1 text-sm"
        value={restockQty}
        onChange={(e) => setRestockQty(e.target.value)}
        disabled={busy}
      />
      <button
        type="button"
        className="btn-secondary text-sm py-1 px-3"
        onClick={handleRestock}
        disabled={busy}
      >
        Restock
      </button>
      <button
        type="button"
        className="btn-danger text-sm py-1 px-3"
        onClick={handleDelete}
        disabled={busy}
      >
        Delete
      </button>
    </div>
  );
}

function UserActions({ vehicle, onRefresh, setMessage }) {
  const [busy, setBusy] = useState(false);
  const outOfStock = Number(vehicle.quantity) <= 0;

  const handlePurchase = async () => {
    setBusy(true);
    try {
      await purchaseVehicle(vehicle.id);
      await onRefresh();
      setMessage('Purchase successful.');
    } catch (err) {
      setMessage(`Purchase failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`text-sm py-1 px-3 ${outOfStock ? 'btn-secondary' : 'btn-primary'}`}
      onClick={handlePurchase}
      disabled={outOfStock || busy}
    >
      {busy ? '…' : outOfStock ? 'Out of stock' : 'Purchase'}
    </button>
  );
}

export default function VehicleTable({ vehicles, isAdmin, onRefresh, setMessage }) {
  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-3 text-sm text-slate-600">ID</th>
              <th className="px-3 py-3 text-sm text-slate-600">Make</th>
              <th className="px-3 py-3 text-sm text-slate-600">Model</th>
              <th className="px-3 py-3 text-sm text-slate-600">Category</th>
              <th className="px-3 py-3 text-sm text-slate-600">Price</th>
              <th className="px-3 py-3 text-sm text-slate-600">Quantity</th>
              <th className="px-3 py-3 text-sm text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                No vehicles found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-3 py-3 text-sm text-slate-600 font-medium">ID</th>
            <th className="px-3 py-3 text-sm text-slate-600 font-medium">Make</th>
            <th className="px-3 py-3 text-sm text-slate-600 font-medium">Model</th>
            <th className="px-3 py-3 text-sm text-slate-600 font-medium">Category</th>
            <th className="px-3 py-3 text-sm text-slate-600 font-medium">Price</th>
            <th className="px-3 py-3 text-sm text-slate-600 font-medium">Quantity</th>
            <th className="px-3 py-3 text-sm text-slate-600 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => (
            <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-3 text-sm">{v.id}</td>
              <td className="px-3 py-3 text-sm font-medium">{v.make}</td>
              <td className="px-3 py-3 text-sm">{v.model}</td>
              <td className="px-3 py-3 text-sm">{v.category}</td>
              <td className="px-3 py-3 text-sm">{formatPrice(v.price)}</td>
              <td className="px-3 py-3 text-sm">
                <span
                  className={
                    Number(v.quantity) <= 0
                      ? 'text-red-600 font-medium'
                      : 'text-slate-800'
                  }
                >
                  {v.quantity}
                </span>
              </td>
              <td className="px-3 py-3">
                {isAdmin ? (
                  <AdminActions
                    vehicle={v}
                    onRefresh={onRefresh}
                    setMessage={setMessage}
                  />
                ) : (
                  <UserActions
                    vehicle={v}
                    onRefresh={onRefresh}
                    setMessage={setMessage}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
