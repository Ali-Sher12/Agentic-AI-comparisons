import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import ItemCard from "../components/ItemCard";
import ItemFilterPanel from "../components/ItemFilterPanel";

export default function HomePage() {
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
      .getItems(filters)
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [filters]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-brass-dark">
          Public Register
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Search items recovered by police across Pakistan
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/65">
          Every item recovered by any participating HQ is listed here. Search by category,
          color, location, or keyword. If you find your item, you can file a claim directly
          from its record.
        </p>
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
              <p className="mt-1 text-sm text-ink/50">
                Try widening your filters or searching a different keyword.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink/40">
                {items.length} record{items.length !== 1 ? "s" : ""} found
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
