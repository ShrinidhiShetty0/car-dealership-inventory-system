import { useState } from 'react';

const initial = {
  make: '',
  model: '',
  category: '',
  min_price: '',
  max_price: '',
};

export default function SearchForm({ onSearch, onReset }) {
  const [filters, setFilters] = useState(initial);

  const handleChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters(initial);
    onReset();
  };

  return (
    <section className="card">
      <h2 className="text-xl font-semibold mb-4">Search Inventory</h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3">
        <input
          name="make"
          className="input flex-1 min-w-[120px]"
          placeholder="Make"
          value={filters.make}
          onChange={handleChange}
        />
        <input
          name="model"
          className="input flex-1 min-w-[120px]"
          placeholder="Model"
          value={filters.model}
          onChange={handleChange}
        />
        <input
          name="category"
          className="input flex-1 min-w-[120px]"
          placeholder="Category"
          value={filters.category}
          onChange={handleChange}
        />
        <input
          name="min_price"
          type="number"
          min="0"
          step="0.01"
          className="input flex-1 min-w-[120px]"
          placeholder="Min price"
          value={filters.min_price}
          onChange={handleChange}
        />
        <input
          name="max_price"
          type="number"
          min="0"
          step="0.01"
          className="input flex-1 min-w-[120px]"
          placeholder="Max price"
          value={filters.max_price}
          onChange={handleChange}
        />
        <button type="submit" className="btn-primary">
          Search
        </button>
        <button type="button" className="btn-secondary" onClick={handleReset}>
          Show All
        </button>
      </form>
    </section>
  );
}
