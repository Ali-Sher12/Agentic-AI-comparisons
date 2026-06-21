import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import CaseSeal from "../components/CaseSeal";
import { categoryLabel, conditionLabel, formatDateTime } from "../lib/constants";

export default function PoliceItemDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [claims, setClaims] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReturnForm, setShowReturnForm] = useState(false);

  const load = useCallback(() => {
    setIsLoading(true);
    setError("");
    Promise.all([api.getPoliceItem(id), api.getClaimsForItem(id)])
      .then(([itemData, claimsData]) => {
        setItem(itemData.item);
        setClaims(claimsData.claims);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return <div className="py-24 text-center text-sm text-ink/45">Loading record…</div>;
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="font-display text-lg text-ink/70">Record not found</p>
        <p className="mt-1 text-sm text-ink/50">{error}</p>
        <Link to="/police/dashboard" className="btn-secondary mt-6 inline-flex">Back to dashboard</Link>
      </div>
    );
  }

  const status = item.isReturned ? "returned" : "unclaimed";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/police/dashboard" className="mb-6 inline-flex items-center gap-1 text-sm text-ink/60 hover:text-ink">
        ← Back to dashboard
      </Link>

      <div className="case-card p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brass-dark">
              {categoryLabel(item.category)}
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
              Case ref: {item.id.slice(0, 8).toUpperCase()}
            </h1>
          </div>
          <CaseSeal status={status} />
        </div>

        <p className="mt-5 text-sm leading-relaxed text-ink/80">{item.description}</p>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-ink/10 pt-6 text-sm sm:grid-cols-3">
          <Field label="Size" value={item.size} />
          <Field label="Weight" value={item.weight || "—"} />
          <Field label="Color" value={item.color} />
          <Field label="Condition" value={conditionLabel(item.condition)} />
          {item.numberPlate && <Field label="Number plate" value={item.numberPlate} mono />}
          <Field label="Recovered from" value={item.recoveredFrom} />
          <Field label="Recovery place" value={item.recoveryPlace} />
          <Field label="Recovery time" value={formatDateTime(item.recoveryTime)} />
          <Field label="Holding location" value={item.holdingHq?.name || "—"} />
          <Field label="Logged by" value={item.loggedByHq?.name || "—"} />
          <Field label="Logged on" value={formatDateTime(item.uploadDate)} />
        </dl>

        {item.isReturned ? (
          <div className="mt-8 rounded-sm border border-sage/30 bg-sage-light px-5 py-4 text-sm">
            <p className="font-semibold text-sage">Returned to owner — record archived.</p>
            <div className="mt-2 grid grid-cols-2 gap-3 text-ink/70">
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink/40">Returned to</dt>
                <dd className="font-medium">{item.returnedToName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink/40">Contact</dt>
                <dd className="font-medium">{item.returnedToContact}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink/40">Returned on</dt>
                <dd className="font-medium">{formatDateTime(item.returnedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink/40">Processed by</dt>
                <dd className="font-medium">{item.returnedByUser?.username || "—"}</dd>
              </div>
            </div>
            <p className="mt-3 text-xs text-ink/45">
              This information is visible only to police and is never shown to the public.
            </p>
          </div>
        ) : (
          <div className="mt-8 border-t border-ink/10 pt-6">
            {!showReturnForm ? (
              <button onClick={() => setShowReturnForm(true)} className="btn-secondary">
                Mark as returned to owner
              </button>
            ) : (
              <ReturnForm itemId={item.id} onCancel={() => setShowReturnForm(false)} onDone={load} />
            )}
          </div>
        )}
      </div>

      <div className="case-card mt-6 p-8">
        <h2 className="font-display text-lg font-semibold text-ink">
          Claims ({claims.length})
        </h2>
        {claims.length === 0 ? (
          <p className="mt-2 text-sm text-ink/50">No claims have been submitted on this item yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {claims.map((claim) => (
              <ClaimRow key={claim.id} claim={claim} itemReturned={item.isReturned} onDecided={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink/40">{label}</dt>
      <dd className={`mt-0.5 font-medium text-ink/85 ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

function ReturnForm({ itemId, onCancel, onDone }) {
  const [returnedToName, setReturnedToName] = useState("");
  const [returnedToContact, setReturnedToContact] = useState("");
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!confirmChecked) {
      setError("Please confirm — this action cannot be undone.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.markReturned(itemId, { returnedToName, returnedToContact });
      onDone();
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-sm border border-maroon/20 bg-maroon/5 p-5">
      <p className="text-sm font-semibold text-maroon-dark">
        Mark item as returned — this cannot be reversed
      </p>
      {error && <p className="text-sm text-maroon-dark">{error}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Returned to (name)</label>
          <input required type="text" className="field-input" value={returnedToName} onChange={(e) => setReturnedToName(e.target.value)} />
        </div>
        <div>
          <label className="field-label">Contact details</label>
          <input required type="text" className="field-input" placeholder="Phone or CNIC" value={returnedToContact} onChange={(e) => setReturnedToContact(e.target.value)} />
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm text-ink/70">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={confirmChecked}
          onChange={(e) => setConfirmChecked(e.target.checked)}
        />
        I confirm the item has been physically handed over and this record will be permanently
        marked as returned. This visible-to-police-only record cannot be edited afterward.
      </label>
      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting} className="btn-danger">
          {isSubmitting ? "Saving…" : "Confirm — mark returned"}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

const STATUS_STYLES = {
  PENDING: "bg-brass/15 text-brass-dark",
  ACCEPTED: "bg-sage-light text-sage",
  REJECTED: "bg-maroon/10 text-maroon-dark",
};

function ClaimRow({ claim, itemReturned, onDecided }) {
  const [isDeciding, setIsDeciding] = useState(false);
  const [error, setError] = useState("");

  const decide = async (decision) => {
    setError("");
    setIsDeciding(true);
    try {
      await api.decideClaim(claim.id, decision);
      onDecided();
    } catch (err) {
      setError(err.message);
      setIsDeciding(false);
    }
  };

  const viewDocument = async () => {
    try {
      const blob = await api.fetchClaimDocumentBlob(claim.id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="rounded-sm border border-ink/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink">{claim.fullName}</p>
          <p className="text-xs text-ink/50">
            {claim.identityType}: {claim.identityValue} · {claim.contactPhone}
            {claim.contactEmail ? ` · ${claim.contactEmail}` : ""}
          </p>
          <p className="mt-1 text-xs text-ink/40">Submitted {formatDateTime(claim.createdAt)}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide ${STATUS_STYLES[claim.status]}`}>
          {claim.status}
        </span>
      </div>

      {error && <p className="mt-2 text-xs text-maroon-dark">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={viewDocument} className="btn-secondary !px-3 !py-1.5 text-xs">
          View proof document
        </button>
        {claim.status === "PENDING" && !itemReturned && (
          <>
            <button
              onClick={() => decide("ACCEPTED")}
              disabled={isDeciding}
              className="btn-primary !px-3 !py-1.5 text-xs"
            >
              Accept
            </button>
            <button
              onClick={() => decide("REJECTED")}
              disabled={isDeciding}
              className="btn-danger !px-3 !py-1.5 text-xs"
            >
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
}
