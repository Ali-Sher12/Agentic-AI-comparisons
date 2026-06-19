import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearPoliceSession, getPoliceUser } from '../lib/api';
import { ItemFilters, ItemDetailView } from '../components/ItemComponents';

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

const EMPTY_ITEM = {
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

export default function PoliceDashboard() {
  const navigate = useNavigate();
  const police = getPoliceUser();
  const [tab, setTab] = useState('items');
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newItem, setNewItem] = useState(EMPTY_ITEM);
  const [returnedTo, setReturnedTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!police) {
      navigate('/police/login');
      return;
    }
    loadItems();
    loadClaims();
  }, []);

  const loadItems = async (params = {}) => {
    setLoading(true);
    try {
      const data = await api.items.list(params);
      setItems(data);
    } catch (err) {
      if (err.message.includes('Authentication') || err.message.includes('token')) {
        clearPoliceSession();
        navigate('/police/login');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadClaims = async () => {
    try {
      const data = await api.claims.pending();
      setClaims(data);
    } catch {
      /* ignore */
    }
  };

  const handleSearch = () => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v.trim()),
    );
    loadItems(params);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = { ...newItem, numberPlate: newItem.numberPlate || null };
      await api.items.create(payload);
      setNewItem(EMPTY_ITEM);
      setSuccess('Item logged successfully.');
      loadItems();
      setTab('items');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMarkReturned = async (itemId) => {
    if (!returnedTo.trim()) {
      setError('Please enter who the item was returned to.');
      return;
    }
    if (!confirm('Mark this item as returned? This action is irreversible.')) return;

    setError('');
    try {
      const updated = await api.items.markReturned(itemId, returnedTo);
      setSelectedItem(updated);
      setReturnedTo('');
      setSuccess('Item marked as returned to owner.');
      loadItems();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClaimAction = async (claimId, action) => {
    setError('');
    try {
      if (action === 'accept') await api.claims.accept(claimId);
      else await api.claims.reject(claimId);
      setSuccess(`Claim ${action}ed.`);
      loadClaims();
      if (selectedItem) {
        const updated = await api.items.get(selectedItem.id);
        setSelectedItem(updated);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    clearPoliceSession();
    navigate('/police/login');
  };

  if (!police) return null;

  const canReviewItem = (item) => item?.loggedByHQId === police.id;

  const tabs = [
    { id: 'items', label: 'All Items' },
    { id: 'add', label: 'Add Item' },
    { id: 'claims', label: `Claims (${claims.length})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Police Dashboard</h1>
          <p className="text-sm text-slate-600">Logged in as {police.hqName}</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Logout
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSuccess(''); setError(''); }}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t.id
                ? 'border-b-2 border-emerald-700 text-emerald-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'items' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <ItemFilters
              filters={filters}
              onChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
              onSearch={handleSearch}
              onClear={() => { setFilters(EMPTY_FILTERS); loadItems(); }}
            />

            {loading ? (
              <p className="text-slate-500">Loading...</p>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setSelectedItem(item); setReturnedTo(''); setSuccess(''); }}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedItem?.id === item.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex justify-between gap-2">
                      <p className="font-medium line-clamp-1">{item.detailedDescription}</p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                          item.returnedToOwner
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.returnedToOwner ? 'Returned' : 'Available'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.holdingLocation} · {item.color} · {new Date(item.uploadDate).toLocaleDateString()}
                    </p>
                    {canReviewItem(item) &&
                      item.claims?.filter((c) => c.status === 'pending').length > 0 && (
                      <p className="mt-1 text-xs font-medium text-amber-700">
                        {item.claims.filter((c) => c.status === 'pending').length} pending claim(s)
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {selectedItem ? (
              <div className="space-y-4">
                <ItemDetailView item={selectedItem} showPoliceFields />

                {!selectedItem.returnedToOwner && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="mb-3 font-semibold">Mark as Returned to Owner</h3>
                    <p className="mb-3 text-sm text-slate-600">
                      This action is irreversible. Record who received the item (visible to police only).
                    </p>
                    <input
                      type="text"
                      value={returnedTo}
                      onChange={(e) => setReturnedTo(e.target.value)}
                      placeholder="Full name and CNIC of recipient"
                      className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => handleMarkReturned(selectedItem.id)}
                      className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
                    >
                      Mark Returned
                    </button>
                  </div>
                )}

                {selectedItem.claims?.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="mb-3 font-semibold">Claims for This Item</h3>
                    {!canReviewItem(selectedItem) && (
                      <p className="mb-3 text-sm text-slate-600">
                        Only {selectedItem.loggedByHQ?.name} can accept or reject claims for this item.
                      </p>
                    )}
                    <div className="space-y-3">
                      {selectedItem.claims.map((claim) => (
                        <div key={claim.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium capitalize">{claim.identifierType}: {claim.identifierValue}</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                              claim.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                              claim.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {claim.status}
                            </span>
                          </div>
                          <p className="mt-1 text-slate-600">Contact: {claim.contactInfo}</p>
                          <a
                            href={`/uploads/${claim.proofDocumentPath}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-emerald-700 hover:underline"
                          >
                            View proof document
                          </a>
                          {claim.status === 'pending' &&
                            !selectedItem.returnedToOwner &&
                            canReviewItem(selectedItem) && (
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => handleClaimAction(claim.id, 'accept')}
                                className="rounded bg-emerald-700 px-3 py-1 text-xs text-white hover:bg-emerald-800"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleClaimAction(claim.id, 'reject')}
                                className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500">Select an item to view details and manage claims.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'add' && (
        <form onSubmit={handleAddItem} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Log New Lost & Found Item</h2>
          <p className="mb-4 text-sm text-slate-600">
            Upload date is set automatically. All headquarters will see this item.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['size', 'Size', 'e.g. Small, Medium, Large'],
              ['weight', 'Weight', 'e.g. 1.2 kg'],
              ['color', 'Color', 'e.g. Black'],
              ['numberPlate', 'Number Plate (vehicles only)', 'e.g. LEA-4521 — leave blank if N/A'],
              ['conditionFoundIn', 'Condition Found In', 'Describe condition'],
              ['recoveredFromLocation', 'Recovered From Location', 'Address or area'],
              ['recoveryTimeAndPlace', 'Recovery Time & Place', 'Date, time, and place details'],
              ['holdingLocation', 'Holding Location (HQ)', 'e.g. Lahore HQ'],
            ].map(([key, label, placeholder]) => (
              <div key={key} className={key === 'detailedDescription' ? 'sm:col-span-2' : ''}>
                <label className="mb-1 block text-sm font-medium">{label}</label>
                <input
                  type="text"
                  required={key !== 'numberPlate'}
                  value={newItem[key]}
                  onChange={(e) => setNewItem((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Detailed Description</label>
              <textarea
                required
                rows={3}
                value={newItem.detailedDescription}
                onChange={(e) => setNewItem((p) => ({ ...p, detailedDescription: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Full description of the item"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Log Item
          </button>
        </form>
      )}

      {tab === 'claims' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Pending claims on items logged by {police.hqName}.
          </p>
          {claims.length === 0 ? (
            <p className="text-slate-500">No pending claims.</p>
          ) : (
            claims.map((claim) => (
              <div key={claim.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-semibold">{claim.item.detailedDescription}</p>
                    <p className="text-sm text-slate-600">
                      Holding: {claim.item.holdingLocation} · Logged by {claim.item.loggedByHQ?.name}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                    Pending
                  </span>
                </div>
                <div className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                  <p><span className="font-medium capitalize">{claim.identifierType}:</span> {claim.identifierValue}</p>
                  <p><span className="font-medium">Contact:</span> {claim.contactInfo}</p>
                  <p><span className="font-medium">Submitted:</span> {new Date(claim.createdAt).toLocaleString()}</p>
                  <a
                    href={`/uploads/${claim.proofDocumentPath}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 hover:underline"
                  >
                    View proof document
                  </a>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleClaimAction(claim.id, 'accept')}
                    className="rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-800"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleClaimAction(claim.id, 'reject')}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
