export default function Stats({ vehicleCount, stockCount }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="card">
        <span className="text-slate-500 text-sm">Total Vehicles</span>
        <h2 className="text-3xl font-bold text-blue-600 mt-1">{vehicleCount}</h2>
      </div>
      <div className="card">
        <span className="text-slate-500 text-sm">Total Stock</span>
        <h2 className="text-3xl font-bold text-blue-600 mt-1">{stockCount}</h2>
      </div>
    </div>
  );
}
