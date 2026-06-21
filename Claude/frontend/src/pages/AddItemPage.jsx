import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { ITEM_CATEGORIES, ITEM_CONDITIONS } from "../lib/constants";

const initialForm = {
  category: "",
  size: "",
  weight: "",
  color: "",
  description: "",
  numberPlate: "",
  condition: "",
  recoveredFrom: "",
  recoveryTime: "",
  recoveryPlace: "",
  holdingHqId: "",
};

export default function AddItemPage() {
  const { police } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [hqs, setHqs] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.getHQs().then((data) => {
      setHqs(data.hqs);
      // Default the holding location to the logged-in officer's own HQ.
      setForm((f) => ({ ...f, holdingHqId: data.hqs.find((h) => h.name === police.hqName)?.id || "" }));
    }).catch(() => {});
  }, [police.hqName]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const isVehicle = form.category === "VEHICLE";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isVehicle && !form.numberPlate.trim()) {
      setError("Number plate is required for vehicle/transport items.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { item } = await api.createItem({
        ...form,
        weight: form.weight || null,
        numberPlate: form.numberPlate || null,
      });
      navigate(`/police/items/${item.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-widest text-brass-dark">New Entry</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">Add a found item</h1>
      <p className="mt-1 text-sm text-ink/55">
        The upload date is recorded automatically. This item will be visible to civilians once saved.
      </p>

      <form onSubmit={handleSubmit} className="case-card mt-6 space-y-6 p-8">
        {error && (
          <div className="rounded-sm border border-maroon/30 bg-maroon/5 px-4 py-2.5 text-sm text-maroon-dark">
            {error}
          </div>
        )}

        <section>
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-ink/60">
            Identification
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Category</label>
              <select required className="field-select" value={form.category} onChange={(e) => update("category", e.target.value)}>
                <option value="">Select a category</option>
                {ITEM_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Condition found in</label>
              <select required className="field-select" value={form.condition} onChange={(e) => update("condition", e.target.value)}>
                <option value="">Select condition</option>
                {ITEM_CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Size</label>
              <input required type="text" className="field-input" placeholder='e.g. Medium (30x20cm)' value={form.size} onChange={(e) => update("size", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Weight (optional)</label>
              <input type="text" className="field-input" placeholder="e.g. 1.2 kg" value={form.weight} onChange={(e) => update("weight", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Color</label>
              <input required type="text" className="field-input" value={form.color} onChange={(e) => update("color", e.target.value)} />
            </div>
            {isVehicle && (
              <div>
                <label className="field-label">Number plate</label>
                <input required type="text" className="field-input" placeholder="e.g. LEA-19-4471" value={form.numberPlate} onChange={(e) => update("numberPlate", e.target.value)} />
              </div>
            )}
          </div>
          <div className="mt-4">
            <label className="field-label">Detailed description</label>
            <textarea required rows={4} className="field-input" value={form.description} onChange={(e) => update("description", e.target.value)} />
          </div>
        </section>

        <section className="border-t border-ink/10 pt-6">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-ink/60">
            Recovery details
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Recovered from</label>
              <input required type="text" className="field-input" placeholder="e.g. Liberty Market parking area" value={form.recoveredFrom} onChange={(e) => update("recoveredFrom", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Recovery place</label>
              <input required type="text" className="field-input" placeholder="e.g. Gulberg, Lahore" value={form.recoveryPlace} onChange={(e) => update("recoveryPlace", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Recovery time</label>
              <input required type="datetime-local" className="field-input" value={form.recoveryTime} onChange={(e) => update("recoveryTime", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Holding location (HQ)</label>
              <select required className="field-select" value={form.holdingHqId} onChange={(e) => update("holdingHqId", e.target.value)}>
                <option value="">Select HQ</option>
                {hqs.map((hq) => (
                  <option key={hq.id} value={hq.id}>{hq.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <div className="flex gap-3 border-t border-ink/10 pt-6">
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? "Saving…" : "Save item"}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
