const FILTER_FIELDS = [
  { key: 'size', label: 'Size' },
  { key: 'weight', label: 'Weight' },
  { key: 'color', label: 'Color' },
  { key: 'detailedDescription', label: 'Description' },
  { key: 'numberPlate', label: 'Number Plate' },
  { key: 'conditionFoundIn', label: 'Condition' },
  { key: 'recoveredFromLocation', label: 'Recovered From' },
  { key: 'recoveryTimeAndPlace', label: 'Recovery Time & Place' },
  { key: 'holdingLocation', label: 'Holding Location' },
];

export { FILTER_FIELDS };

export function ItemFilters({ filters, onChange, onSearch, onClear }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Search & Filter</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-emerald-700 hover:underline"
        >
          Clear all
        </button>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
        <select
          value={filters.status}
          onChange={(e) => onChange('status', e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All items</option>
          <option value="available">Available (not returned)</option>
          <option value="returned">Returned to owner</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FILTER_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
            <input
              type="text"
              value={filters[key] || ''}
              onChange={(e) => onChange(key, e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder={`Filter by ${label.toLowerCase()}`}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onSearch}
        className="mt-4 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800"
      >
        Search
      </button>
    </div>
  );
}

export function ItemCard({ item, showStatus = true }) {
  return (
    <div className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900 line-clamp-2">
          {item.detailedDescription}
        </h3>
        {showStatus && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              item.returnedToOwner
                ? 'bg-slate-100 text-slate-600'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {item.returnedToOwner ? 'Returned' : 'Available'}
          </span>
        )}
      </div>
      <div className="grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
        <p><span className="font-medium">Color:</span> {item.color}</p>
        <p><span className="font-medium">Size:</span> {item.size}</p>
        <p><span className="font-medium">Weight:</span> {item.weight}</p>
        {item.numberPlate && (
          <p><span className="font-medium">Plate:</span> {item.numberPlate}</p>
        )}
        <p><span className="font-medium">Holding:</span> {item.holdingLocation}</p>
        <p><span className="font-medium">Logged:</span> {new Date(item.uploadDate).toLocaleDateString()}</p>
      </div>
    </div>
  );
}

export function ItemDetailView({ item, showPoliceFields = false }) {
  const fields = [
    ['Size', item.size],
    ['Weight', item.weight],
    ['Color', item.color],
    ['Description', item.detailedDescription],
    ['Number Plate', item.numberPlate || 'N/A'],
    ['Condition Found In', item.conditionFoundIn],
    ['Recovered From', item.recoveredFromLocation],
    ['Recovery Time & Place', item.recoveryTimeAndPlace],
    ['Holding Location', item.holdingLocation],
    ['Upload Date', new Date(item.uploadDate).toLocaleString()],
    ['Logged By', item.loggedByHQ?.name],
    ['Status', item.returnedToOwner ? 'Returned to Owner' : 'Available'],
  ];

  if (showPoliceFields && item.returnedToOwner) {
    fields.push(['Returned To', item.returnedTo || '—']);
    fields.push(['Returned At', item.returnedAt ? new Date(item.returnedAt).toLocaleString() : '—']);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">Item Details</h2>
      <dl className="grid gap-3 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label} className={label === 'Description' ? 'sm:col-span-2' : ''}>
            <dt className="text-sm font-medium text-slate-500">{label}</dt>
            <dd className="mt-0.5 text-sm text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
