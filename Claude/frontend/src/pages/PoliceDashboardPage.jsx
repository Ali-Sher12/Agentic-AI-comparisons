import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import ItemCard from "../components/ItemCard";
import ItemFilterPanel from "../components/ItemFilterPanel";

export default function PoliceDashboardPage() {
  const { police } = useAuth();
  const [items, setItems] = useState([]);
  const [hqs, setHqs] = useState([]);
  const [filters, setFilters] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getHQs().then((data) => setHqs(data.hqs)).catch(() => {});
  }, []);

  const loadItems = useCallback(() => {
    setIsLoading(true);
    setError("");
    api
      .getPoliceItems(filters)
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [filters]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const totalUnclaimed = items.filter((i) => !i.isReturned).length;
  const totalReturned = items.filter((i) => i.isReturned).length;
  const totalPendingClaims = items.reduce((sum, i) => sum + (i.pendingClaimCount || 0), 0);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brass-dark">
            {police.hqName} — Records Dashboard
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
            All recovered items
          </h1>
          <p className="mt-1 text-sm text-ink/55">
            Shared visibility across every HQ. You can view and act on items logged by any station.
          </p>
        </div>
        <div className="flex gap-3">
          <StatPill label="Unclaimed" value={totalUnclaimed} />
          <StatPill label="Returned" value={totalReturned} tone="sage" />
          <StatPill label="Pending claims" value={totalPendingClaims} tone="brass" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
        <div className="lg:sticky lg:top-6 lg:self-start">
          <ItemFilterPanel filters={filters} onChange={setFilters} hqs={hqs} showReturnedFilter />
        </div>

        <div>
          {error && (
            <div className="mb-4 rounded-sm border border-maroon/30 bg-maroon/5 px-4 py-3 text-sm text-maroon-dark">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="py-20 text-center text-sm text-ink/45">Loading records…</div>
          ) : items.length === 0 ? (
            <div className="case-card py-16 text-center">
              <p className="font-display text-lg text-ink/70">No matching records</p>
              <p className="mt-1 text-sm text-ink/50">Adjust your filters, or add a new item.</p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink/40">
                {items.length} record{items.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} policeView basePath="/police/items" />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value, tone = "seal" }) {
  const toneClasses = {
    seal: "border-seal/30 text-seal",
    sage: "border-sage/30 text-sage",
    brass: "border-brass/30 text-brass-dark",
  };
  return (
    <div className={`rounded-sm border bg-paper-card px-4 py-2 text-center ${toneClasses[tone]}`}>
      <div className="font-display text-xl font-semibold">{value}</div>
      <div className="text-[0.65rem] uppercase tracking-wide text-ink/45">{label}</div>
    </div>
  );
}
