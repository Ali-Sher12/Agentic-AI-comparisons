import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { ItemFilters, ItemCard } from '../components/ItemComponents';

const EMPTY_FILTERS = {
  status: '',
  size: '',
  weight: '',
  color: '',
  detailedDescription: '',
  numberPlate: '',
  conditionFoundIn: '',
  recoveredFromLocation: '',
  recoveryTimeAndPlace: '',
  holdingLocation: '',
};

export default function HomePage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v.trim()),
      );
      const data = await api.items.publicList(params);
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFilters(EMPTY_FILTERS);
    setItems([]);
    setSearched(false);
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-600 p-8 text-white">
        <h1 className="mb-2 text-3xl font-bold">Find Your Lost Property</h1>
        <p className="max-w-2xl text-emerald-100">
          Search recovered items logged by police headquarters across Pakistan.
          No account required — browse items and submit a claim if you believe something is yours.
        </p>
      </section>

      <ItemFilters
        filters={filters}
        onChange={handleChange}
        onSearch={handleSearch}
        onClear={handleClear}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && <p className="text-center text-slate-500">Searching...</p>}

      {!loading && searched && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">
            {items.length} item{items.length !== 1 ? 's' : ''} found
          </h2>
          {items.length === 0 ? (
            <p className="text-slate-500">No items match your search criteria.</p>
          ) : (
            <div className="grid gap-4">
              {items.map((item) => (
                <Link key={item.id} to={`/items/${item.id}`} className="block">
                  <ItemCard item={item} />
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {!searched && (
        <p className="text-center text-slate-500">
          Use the filters above and click Search to browse lost & found items.
        </p>
      )}
    </div>
  );
}
