import { ITEM_CATEGORIES, ITEM_CONDITIONS } from "../lib/constants";

export default function ItemFilterPanel({ filters, onChange, hqs = [], showHoldingHq = true, showReturnedFilter = false }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="case-card p-5">
      <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-ink/70">
        Filter Records
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="q">Keyword search</label>
          <input
            id="q"
            type="text"
            placeholder="Description, color, plate, location…"
            className="field-input"
            value={filters.q || ""}
            onChange={(e) => update("q", e.target.value)}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="category">Category</label>
          <select
            id="category"
            className="field-select"
            value={filters.category || ""}
            onChange={(e) => update("category", e.target.value)}
          >
            <option value="">All categories</option>
            {ITEM_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="condition">Condition</label>
          <select
            id="condition"
            className="field-select"
            value={filters.condition || ""}
            onChange={(e) => update("condition", e.target.value)}
          >
            <option value="">Any condition</option>
            {ITEM_CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="color">Color</label>
          <input
            id="color"
            type="text"
            placeholder="e.g. Black, Red…"
            className="field-input"
            value={filters.color || ""}
            onChange={(e) => update("color", e.target.value)}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="numberPlate">Number plate</label>
          <input
            id="numberPlate"
            type="text"
            placeholder="e.g. LEA-19"
            className="field-input"
            value={filters.numberPlate || ""}
            onChange={(e) => update("numberPlate", e.target.value)}
          />
        </div>

        {showHoldingHq && (
          <div>
            <label className="field-label" htmlFor="holdingHqId">Holding location</label>
            <select
              id="holdingHqId"
              className="field-select"
              value={filters.holdingHqId || ""}
              onChange={(e) => update("holdingHqId", e.target.value)}
            >
              <option value="">All HQs</option>
              {hqs.map((hq) => (
                <option key={hq.id} value={hq.id}>{hq.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="field-label" htmlFor="recoveryPlace">Recovery place</label>
          <input
            id="recoveryPlace"
            type="text"
            placeholder="e.g. Liberty Market"
            className="field-input"
            value={filters.recoveryPlace || ""}
            onChange={(e) => update("recoveryPlace", e.target.value)}
          />
        </div>

        {showReturnedFilter && (
          <div>
            <label className="field-label" htmlFor="isReturned">Return status</label>
            <select
              id="isReturned"
              className="field-select"
              value={filters.isReturned ?? ""}
              onChange={(e) => update("isReturned", e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="false">Unclaimed</option>
              <option value="true">Returned</option>
            </select>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange({})}
        className="mt-4 text-xs font-semibold text-seal hover:underline"
      >
        Clear all filters
      </button>
    </div>
  );
}
