import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import CaseSeal from "../components/CaseSeal";
import { categoryLabel, conditionLabel, formatDateTime } from "../lib/constants";

export default function ItemDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showClaimForm, setShowClaimForm] = useState(false);

  useEffect(() => {
    api
      .getItem(id)
      .then((data) => setItem(data.item))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <div className="py-24 text-center text-sm text-ink/45">Loading record…</div>;
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="font-display text-lg text-ink/70">Record not found</p>
        <p className="mt-1 text-sm text-ink/50">{error || "This item may have been removed."}</p>
        <Link to="/" className="btn-secondary mt-6 inline-flex">Back to search</Link>
      </div>
    );
  }

  const status = item.isReturned ? "returned" : "unclaimed";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-ink/60 hover:text-ink">
        ← Back to search
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
          <Field label="Logged on" value={formatDateTime(item.uploadDate)} />
          {item.isReturned && (
            <Field label="Returned on" value={formatDateTime(item.returnedAt)} />
          )}
        </dl>

        {item.isReturned ? (
          <div className="mt-8 rounded-sm border border-sage/30 bg-sage-light px-5 py-4 text-sm text-sage">
            <p className="font-semibold">This item has already been returned to its owner.</p>
            <p className="mt-1 text-ink/60">
              It is kept on record for audit purposes and can no longer receive claims.
            </p>
          </div>
        ) : (
          <div className="mt-8 border-t border-ink/10 pt-6">
            {!showClaimForm ? (
              <div className="flex items-center justify-between gap-4 rounded-sm bg-seal/5 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-ink">Is this your item?</p>
                  <p className="text-xs text-ink/55">
                    Submit a claim with your contact details and proof of ownership.
                  </p>
                </div>
                <button onClick={() => setShowClaimForm(true)} className="btn-primary shrink-0">
                  File a claim
                </button>
              </div>
            ) : (
              <ClaimForm itemId={item.id} onCancel={() => setShowClaimForm(false)} />
            )}
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

function ClaimForm({ itemId, onCancel }) {
  const [identityType, setIdentityType] = useState("CNIC");
  const [identityValue, setIdentityValue] = useState("");
  const [fullName, setFullName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please attach a proof-of-ownership document.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("itemId", itemId);
      formData.append("identityType", identityType);
      formData.append("identityValue", identityValue);
      formData.append("fullName", fullName);
      formData.append("contactPhone", contactPhone);
      if (contactEmail) formData.append("contactEmail", contactEmail);
      formData.append("proofDocument", file);

      const data = await api.submitClaim(formData);
      setSuccess(data.claim);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-sm border border-sage/30 bg-sage-light px-5 py-5 text-sm">
        <p className="font-semibold text-sage">Claim submitted successfully.</p>
        <p className="mt-1 text-ink/65">
          Police will review your claim and proof of ownership. You have used{" "}
          {success.claimsUsed} of 3 allowed claims on this item
          {success.claimsRemaining > 0
            ? ` (${success.claimsRemaining} remaining if needed).`
            : " (no claims remaining on this item)."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-display text-base font-semibold text-ink">File a claim</h3>

      {error && (
        <div className="rounded-sm border border-maroon/30 bg-maroon/5 px-4 py-2.5 text-sm text-maroon-dark">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Identify yourself by</label>
          <select
            className="field-select"
            value={identityType}
            onChange={(e) => setIdentityType(e.target.value)}
          >
            <option value="CNIC">CNIC</option>
            <option value="EMAIL">Email</option>
          </select>
        </div>
        <div>
          <label className="field-label">{identityType === "CNIC" ? "CNIC number" : "Email address"}</label>
          <input
            required
            type="text"
            className="field-input"
            placeholder={identityType === "CNIC" ? "12345-1234567-1" : "you@example.com"}
            value={identityValue}
            onChange={(e) => setIdentityValue(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Full name</label>
          <input
            required
            type="text"
            className="field-input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Contact phone</label>
          <input
            required
            type="tel"
            className="field-input"
            placeholder="03XX-XXXXXXX"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">Contact email (optional)</label>
          <input
            type="email"
            className="field-input"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">Proof of ownership document</label>
          <input
            required
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            className="field-input file:mr-3 file:rounded-sm file:border-0 file:bg-seal file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-paper"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <p className="mt-1 text-xs text-ink/45">JPG, PNG, WEBP, or PDF — max 5 MB.</p>
        </div>
      </div>

      <p className="text-xs text-ink/45">
        Note: you may submit up to 3 claims on this item. Rejected claims count toward that limit.
      </p>

      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? "Submitting…" : "Submit claim"}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
