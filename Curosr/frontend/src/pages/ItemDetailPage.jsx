import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { ItemDetailView } from '../components/ItemComponents';

export default function ItemDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimError, setClaimError] = useState('');
  const [claimSuccess, setClaimSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [identifierType, setIdentifierType] = useState('email');
  const [identifierValue, setIdentifierValue] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [claimCount, setClaimCount] = useState(null);

  useEffect(() => {
    api.items
      .publicGet(id)
      .then(setItem)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!identifierValue.trim() || !item) return;
    const timer = setTimeout(() => {
      api.claims
        .count(id, identifierType, identifierValue.trim())
        .then(setClaimCount)
        .catch(() => setClaimCount(null));
    }, 400);
    return () => clearTimeout(timer);
  }, [id, identifierType, identifierValue, item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setClaimError('');
    setClaimSuccess('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('identifierType', identifierType);
      formData.append('identifierValue', identifierValue.trim());
      formData.append('contactInfo', contactInfo.trim());
      formData.append('proofDocument', proofFile);

      const result = await api.claims.submit(id, formData);
      setClaimSuccess(result.message);
      setProofFile(null);
      e.target.reset();
      setContactInfo('');
      if (identifierValue.trim()) {
        const count = await api.claims.count(id, identifierType, identifierValue.trim());
        setClaimCount(count);
      }
    } catch (err) {
      setClaimError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-slate-500">Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!item) return null;

  const canClaim = !item.returnedToOwner && (claimCount?.remaining ?? 3) > 0;

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm text-emerald-700 hover:underline">
        ← Back to search
      </Link>

      <ItemDetailView item={item} />

      {item.returnedToOwner ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          This item has been returned to its owner and is no longer available for claims.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Submit a Claim</h2>
          <p className="mb-4 text-sm text-slate-600">
            Provide your contact details and proof of ownership. Maximum 3 claims per email or CNIC per item
            (rejected claims count toward this limit).
          </p>

          {claimCount !== null && (
            <p className="mb-4 text-sm font-medium text-slate-700">
              Claims used: {claimCount.count}/3 — {claimCount.remaining} remaining
            </p>
          )}

          {!canClaim && claimCount !== null && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              You have reached the maximum of 3 claims for this item with this {identifierType}.
            </div>
          )}

          {canClaim && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Identify by</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={identifierType === 'email'}
                      onChange={() => setIdentifierType('email')}
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={identifierType === 'cnic'}
                      onChange={() => setIdentifierType('cnic')}
                    />
                    CNIC
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  {identifierType === 'email' ? 'Email Address' : 'CNIC Number'}
                </label>
                <input
                  type="text"
                  required
                  value={identifierValue}
                  onChange={(e) => setIdentifierValue(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder={identifierType === 'email' ? 'you@example.com' : '12345-1234567-1'}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Contact Info</label>
                <input
                  type="text"
                  required
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Phone number, address, etc."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Proof of Ownership</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                  onChange={(e) => setProofFile(e.target.files[0])}
                  className="w-full text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">PDF, JPG, PNG, WEBP, DOC — max 10MB</p>
              </div>

              {claimError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {claimError}
                </div>
              )}

              {claimSuccess && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {claimSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Claim'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
