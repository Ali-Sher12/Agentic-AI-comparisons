import React, { useState, useEffect } from 'react';
import { 
  Shield, Search, Lock, Unlock, FileText, PlusCircle, LogOut, 
  LogIn, CheckCircle, XCircle, MapPin, Calendar, User, Phone, 
  Upload, Tag, Filter, Check, AlertCircle, Info, Car, FileQuestion 
} from 'lucide-react';
import { api } from './api';

function App() {
  // Navigation & Auth States
  const [currentView, setCurrentView] = useState('civilian'); // 'civilian' or 'police'
  const [user, setUser] = useState(api.getCurrentUser());
  const [hqs, setHQs] = useState([]);
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Items State
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    holdingLocationId: '',
    color: '',
  });

  // Claim Modal State
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimItemId, setClaimItemId] = useState('');
  const [claimEmailOrCnic, setClaimEmailOrCnic] = useState('');
  const [claimContactInfo, setClaimContactInfo] = useState('');
  const [claimFile, setClaimFile] = useState(null);
  const [claimError, setClaimError] = useState('');
  const [claimSuccess, setClaimSuccess] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Return Modal State
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnItemId, setReturnItemId] = useState('');
  const [returnedToName, setReturnedToName] = useState('');
  const [returnedToCnic, setReturnedToCnic] = useState('');
  const [returnedToContact, setReturnedToContact] = useState('');
  const [returnError, setReturnError] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Police Section Tabs
  const [policeTab, setPoliceTab] = useState('items'); // 'items', 'add', 'claims'
  const [claims, setClaims] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [claimsError, setClaimsError] = useState('');

  // Add Item State
  const [isVehicle, setIsVehicle] = useState(false);
  const [newItem, setNewItem] = useState({
    size: 'Medium',
    weight: '',
    color: '',
    description: '',
    numberPlate: '',
    condition: 'Good',
    recoveredLocation: '',
    recoveryTime: '',
    holdingLocationId: '',
  });
  const [addItemError, setAddItemError] = useState('');
  const [addItemSuccess, setAddItemSuccess] = useState('');
  const [submittingItem, setSubmittingItem] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchHQs();
    fetchItems();
  }, []);

  // Fetch items whenever filters change (or user logs in/out to reveal private data)
  useEffect(() => {
    fetchItems();
  }, [filters, user]);

  // Fetch claims when police changes to claims tab
  useEffect(() => {
    if (user && policeTab === 'claims') {
      fetchClaims();
    }
  }, [policeTab, user]);

  const fetchHQs = async () => {
    try {
      const data = await api.getHQs();
      setHQs(data);
      if (data.length > 0) {
        setNewItem(prev => ({ ...prev, holdingLocationId: data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching HQs:', err);
    }
  };

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const data = await api.getItems(filters);
      setItems(data);
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchClaims = async () => {
    setLoadingClaims(true);
    setClaimsError('');
    try {
      const data = await api.getClaims();
      setClaims(data);
    } catch (err) {
      setClaimsError(err.message || 'Failed to load claims.');
    } finally {
      setLoadingClaims(false);
    }
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const data = await api.login(username, password);
      setUser(data.user);
      setPoliceTab('items');
      fetchItems();
    } catch (err) {
      setLoginError(err.message || 'Invalid username or password.');
    }
  };

  // Logout handler
  const handleLogout = () => {
    api.logout();
    setUser(null);
    setUsername('');
    setPassword('');
    fetchItems();
  };

  // Add item handler
  const handleAddItem = async (e) => {
    e.preventDefault();
    setAddItemError('');
    setAddItemSuccess('');
    setSubmittingItem(true);

    const payload = { ...newItem };
    if (!isVehicle) {
      payload.numberPlate = '';
    }

    try {
      await api.addItem(payload);
      setAddItemSuccess('Lost & found item successfully logged in the database!');
      // Reset form
      setNewItem({
        size: 'Medium',
        weight: '',
        color: '',
        description: '',
        numberPlate: '',
        condition: 'Good',
        recoveredLocation: '',
        recoveryTime: '',
        holdingLocationId: hqs[0]?.id || '',
      });
      setIsVehicle(false);
      fetchItems();
    } catch (err) {
      setAddItemError(err.message || 'Failed to log the item.');
    } finally {
      setSubmittingItem(false);
    }
  };

  // Mark item as returned handler
  const handleReturnItem = async (e) => {
    e.preventDefault();
    setReturnError('');
    setSubmittingReturn(true);

    try {
      await api.returnItem(returnItemId, {
        returnedToName,
        returnedToCnic,
        returnedToContact
      });
      setReturnModalOpen(false);
      // Reset return form
      setReturnedToName('');
      setReturnedToCnic('');
      setReturnedToContact('');
      fetchItems();
    } catch (err) {
      setReturnError(err.message || 'Failed to register returned status.');
    } finally {
      setSubmittingReturn(false);
    }
  };

  // Submit claim handler
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setClaimError('');
    setClaimSuccess('');
    setSubmittingClaim(true);

    if (!claimFile) {
      setClaimError('Proof of ownership document is required.');
      setSubmittingClaim(false);
      return;
    }

    try {
      await api.submitClaim(claimItemId, claimEmailOrCnic, claimContactInfo, claimFile);
      setClaimSuccess('Claim submitted successfully! The uploading Police HQ will review your proof.');
      // Reset form
      setClaimEmailOrCnic('');
      setClaimContactInfo('');
      setClaimFile(null);
      fetchItems();
    } catch (err) {
      setClaimError(err.message || 'Failed to submit ownership claim.');
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Accept claim handler
  const handleAcceptClaim = async (claimId) => {
    if (!window.confirm('Are you sure you want to ACCEPT this claim?')) return;
    try {
      await api.acceptClaim(claimId);
      fetchClaims();
    } catch (err) {
      alert(err.message || 'Failed to accept claim.');
    }
  };

  // Reject claim handler
  const handleRejectClaim = async (claimId) => {
    if (!window.confirm('Are you sure you want to REJECT this claim?')) return;
    try {
      await api.rejectClaim(claimId);
      fetchClaims();
    } catch (err) {
      alert(err.message || 'Failed to reject claim.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-police-900 text-slate-100">
      
      {/* 1. HEADER */}
      <header className="glass-panel border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-police-crimson p-2.5 rounded-lg shadow-lg flex items-center justify-center">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide text-white flex items-center">
                PAKISTAN POLICE
                <span className="ml-2 text-xs bg-amber-500/20 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded font-medium">
                  LOST & FOUND REGISTRY
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-urdu mt-0.5">مفقودہ اور یافتہ اشیاء کا قومی ڈیٹا بیس</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentView('civilian')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                currentView === 'civilian'
                  ? 'bg-police-crimson text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Civilian Portal
            </button>
            <button
              onClick={() => setCurrentView('police')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 flex items-center space-x-1.5 ${
                currentView === 'police'
                  ? 'bg-police-crimson text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Lock className="h-4 w-4" />
              <span>Police HQ Panel</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. BODY CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* =========================================
            CIVILIAN VIEW
           ========================================= */}
        {currentView === 'civilian' && (
          <div className="space-y-6">
            
            {/* Banner */}
            <div className="relative rounded-2xl overflow-hidden glass-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
              <div className="space-y-3 max-w-2xl">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Have you lost something valuable?
                </h2>
                <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
                  Search across verified items recovered by police departments nationwide. 
                  If you identify your belonging, file a formal ownership claim with matching proof. 
                  Our station managers will review the documents and coordinate returns securely.
                </p>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl max-w-xs text-center">
                <Shield className="h-10 w-10 text-amber-500 mb-2" />
                <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Official Citizen Portal</span>
                <span className="text-xs text-slate-500 mt-1">Shared visibility across all provinces</span>
              </div>
            </div>

            {/* Civilian Content: Search & Filters + Results */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Sidebar Filters */}
              <div className="lg:col-span-1 glass-card p-5 rounded-xl border border-slate-800 h-fit space-y-4">
                <div className="flex items-center space-x-2 pb-3 border-b border-slate-850">
                  <Filter className="h-4 w-4 text-amber-500" />
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">Search & Filters</h3>
                </div>

                <div className="space-y-3.5">
                  {/* Search Term */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Keywords</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        placeholder="Search wallet, plate, phone..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-police-crimson placeholder-slate-500"
                      />
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Registry Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-police-crimson"
                    >
                      <option value="">All Items</option>
                      <option value="AVAILABLE">Available for Claim</option>
                      <option value="RETURNED">Returned to Owner</option>
                    </select>
                  </div>

                  {/* Holding Location */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Holding Station HQ</label>
                    <select
                      value={filters.holdingLocationId}
                      onChange={(e) => setFilters(prev => ({ ...prev, holdingLocationId: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-police-crimson"
                    >
                      <option value="">All Stations</option>
                      {hqs.map(hq => (
                        <option key={hq.id} value={hq.id}>{hq.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Color Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Color</label>
                    <input
                      type="text"
                      value={filters.color}
                      onChange={(e) => setFilters(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="e.g. Red, Black, Gold"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-police-crimson placeholder-slate-500"
                    />
                  </div>

                  <button
                    onClick={() => setFilters({ search: '', status: '', holdingLocationId: '', color: '' })}
                    className="w-full py-1.5 text-xs text-center border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 rounded-lg font-medium transition duration-150"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Items Grid */}
              <div className="lg:col-span-3 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg text-white">Registered Items ({items.length})</h3>
                  {loadingItems && <div className="text-xs text-amber-500 animate-pulse">Updating list...</div>}
                </div>

                {items.length === 0 ? (
                  <div className="glass-card p-12 text-center rounded-xl border border-slate-800 flex flex-col items-center">
                    <FileQuestion className="h-12 w-12 text-slate-600 mb-3" />
                    <p className="text-slate-400 font-medium">No lost & found records match your current filters.</p>
                    <p className="text-xs text-slate-500 mt-1">Try resetting search keywords or location criteria.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item) => (
                      <div key={item.id} className="glass-card p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
                        
                        {/* Status + Metadata Headers */}
                        <div className="flex justify-between items-start">
                          <span className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                            item.status === 'AVAILABLE'
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-950/80 text-red-400 border border-red-500/20'
                          }`}>
                            {item.status === 'AVAILABLE' ? 'Available for Claim' : 'Returned / Closed'}
                          </span>
                          <span className="text-slate-500 text-[10px] flex items-center space-x-1">
                            <Calendar className="h-3 w-3 mr-0.5" />
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Description & Specifics */}
                        <div className="space-y-3">
                          <p className="text-sm text-slate-200 line-clamp-3 leading-relaxed">{item.description}</p>
                          
                          {item.numberPlate && (
                            <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700/50 w-fit">
                              <Car className="h-4 w-4 text-amber-500" />
                              <span className="text-xs text-amber-400 font-mono font-bold tracking-widest">{item.numberPlate}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                            <div className="bg-slate-900/50 px-2 py-1.5 rounded border border-slate-800">
                              <span className="block text-slate-500 uppercase font-semibold">Size</span>
                              <span className="text-slate-300 font-medium">{item.size}</span>
                            </div>
                            <div className="bg-slate-900/50 px-2 py-1.5 rounded border border-slate-800">
                              <span className="block text-slate-500 uppercase font-semibold">Weight</span>
                              <span className="text-slate-300 font-medium">{item.weight}</span>
                            </div>
                            <div className="bg-slate-900/50 px-2 py-1.5 rounded border border-slate-800">
                              <span className="block text-slate-500 uppercase font-semibold">Color</span>
                              <span className="text-slate-300 font-medium">{item.color}</span>
                            </div>
                          </div>
                        </div>

                        {/* Location Details */}
                        <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs text-slate-400">
                          <div className="flex items-start space-x-1.5">
                            <MapPin className="h-3.5 w-3.5 text-police-crimson shrink-0 mt-0.5" />
                            <span>Recovered: <strong className="text-slate-300">{item.recoveredLocation}</strong></span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <Shield className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span>Holding Station: <strong className="text-slate-300">{item.holdingLocation?.name || 'Unknown HQ'}</strong></span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2">
                          {item.status === 'AVAILABLE' ? (
                            <button
                              onClick={() => {
                                setClaimItemId(item.id);
                                setClaimError('');
                                setClaimSuccess('');
                                setClaimModalOpen(true);
                              }}
                              className="w-full py-2 bg-police-crimson hover:bg-red-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow-md hover:shadow-red-800/25 transition duration-150"
                            >
                              Submit Ownership Claim
                            </button>
                          ) : (
                            <div className="flex items-center justify-center space-x-1 bg-slate-900/50 py-2 rounded-lg text-xs border border-slate-850 text-slate-500 font-semibold uppercase">
                              <Lock className="h-3.5 w-3.5" />
                              <span>Permanently Archived</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* =========================================
            POLICE PORTAL
           ========================================= */}
        {currentView === 'police' && (
          <div>
            
            {/* Case 1: NOT LOGGED IN - Show Login Interface */}
            {!user ? (
              <div className="max-w-md mx-auto my-12 glass-card p-8 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Shield className="h-48 w-48 text-white" />
                </div>

                <div className="text-center mb-6 relative">
                  <div className="bg-police-crimson w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-950">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-extrabold text-white">POLICE STATION PORTAL</h2>
                  <p className="text-xs text-slate-400 mt-1">Provide credentials assigned to your HQ building</p>
                </div>

                {loginError && (
                  <div className="bg-red-950/60 border border-red-800 text-red-200 px-3 py-2.5 rounded-lg text-xs flex items-start space-x-2 mb-4">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4 relative">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">HQ Username</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. lahore_police"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-police-crimson placeholder-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Secure Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-police-crimson"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-police-crimson hover:bg-red-800 text-white rounded-lg text-sm font-semibold uppercase tracking-wider shadow-lg hover:shadow-red-950 transition duration-150 mt-2"
                  >
                    Authenticate
                  </button>
                </form>

                <div className="mt-6 border-t border-slate-800 pt-4 text-[11px] text-slate-500 text-center space-y-1">
                  <p>Registered districts: Lahore, Karachi, Islamabad, Peshawar</p>
                  <p>Contact provincial HQ admin to reset credentials.</p>
                </div>
              </div>
            ) : (
              
              /* Case 2: LOGGED IN - Show Police Dashboard */
              <div className="space-y-6">
                
                {/* Active Station Banner */}
                <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-emerald-950 text-emerald-400 p-2 rounded-lg border border-emerald-500/20">
                      <Unlock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white tracking-wide">{user.name} Active Portal</h3>
                      <p className="text-xs text-slate-400 font-medium">Logged in: <strong className="text-slate-300">{user.username}</strong> — Shared Provincial Registry Mode</p>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold uppercase flex items-center space-x-1.5 transition duration-150"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </button>
                </div>

                {/* Dashboard Tabs */}
                <div className="flex border-b border-slate-800">
                  <button
                    onClick={() => setPoliceTab('items')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition duration-150 ${
                      policeTab === 'items'
                        ? 'border-police-crimson text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All Lost & Found Items
                  </button>
                  <button
                    onClick={() => setPoliceTab('add')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition duration-150 flex items-center space-x-1.5 ${
                      policeTab === 'add'
                        ? 'border-police-crimson text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <PlusCircle className="h-4 w-4 text-emerald-500" />
                    <span>Log New Item</span>
                  </button>
                  <button
                    onClick={() => setPoliceTab('claims')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition duration-150 flex items-center space-x-1.5 ${
                      policeTab === 'claims'
                        ? 'border-police-crimson text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="h-4 w-4 text-amber-500" />
                    <span>Incoming Claims Review</span>
                  </button>
                </div>

                {/* TAB CONTROLS */}

                {/* TAB 1: ALL REGISTRY ITEMS (POLICE) */}
                {policeTab === 'items' && (
                  <div className="space-y-4">
                    
                    {/* Filtering Panel */}
                    <div className="glass-card p-4 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Keywords</label>
                        <input
                          type="text"
                          value={filters.search}
                          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                          placeholder="Search text..."
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-police-crimson"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Station HQ Location</label>
                        <select
                          value={filters.holdingLocationId}
                          onChange={(e) => setFilters(prev => ({ ...prev, holdingLocationId: e.target.value }))}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-police-crimson"
                        >
                          <option value="">All HQs</option>
                          {hqs.map(hq => (
                            <option key={hq.id} value={hq.id}>{hq.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
                        <select
                          value={filters.status}
                          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-police-crimson"
                        >
                          <option value="">All Statuses</option>
                          <option value="AVAILABLE">Available</option>
                          <option value="RETURNED">Returned</option>
                        </select>
                      </div>
                      <button
                        onClick={() => setFilters({ search: '', status: '', holdingLocationId: '', color: '' })}
                        className="py-1.5 text-xs bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-lg font-semibold"
                      >
                        Reset filters
                      </button>
                    </div>

                    {/* Table View of items */}
                    <div className="glass-card rounded-xl border border-slate-800 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                              <th className="p-3">Item Details</th>
                              <th className="p-3">Specs (S/W/C)</th>
                              <th className="p-3">Recovery Metadata</th>
                              <th className="p-3">Audit (Uploader / Holder)</th>
                              <th className="p-3">Recipient Audit (Police-Only)</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {items.length === 0 ? (
                              <tr>
                                <td colSpan="6" className="p-8 text-center text-slate-500 font-medium">No items registered in database.</td>
                              </tr>
                            ) : (
                              items.map(item => (
                                <tr key={item.id} className="hover:bg-slate-800/30 transition">
                                  <td className="p-3 max-w-xs">
                                    <div className="space-y-1">
                                      <p className="text-slate-200 font-semibold line-clamp-2">{item.description}</p>
                                      {item.numberPlate && (
                                        <span className="inline-block bg-slate-900 border border-slate-750 text-amber-500 font-mono font-bold px-1.5 py-0.5 rounded text-[10px]">
                                          {item.numberPlate}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-300">
                                    <div className="space-y-0.5">
                                      <p>Size: {item.size}</p>
                                      <p>Wt: {item.weight}</p>
                                      <p>Color: {item.color}</p>
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-350">
                                    <div className="space-y-0.5">
                                      <p className="font-semibold text-slate-300">{item.recoveredLocation}</p>
                                      <p>{item.recoveryTime}</p>
                                      <p className="text-[10px] text-slate-500">Logged: {new Date(item.createdAt).toLocaleDateString()}</p>
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-300">
                                    <div className="space-y-0.5 text-[10px]">
                                      <p>Uploader: <strong className="text-slate-400">{item.uploader?.name}</strong></p>
                                      <p>Current Hold: <strong className="text-amber-500">{item.holdingLocation?.name}</strong></p>
                                    </div>
                                  </td>
                                  <td className="p-3 max-w-[200px]">
                                    {item.status === 'RETURNED' ? (
                                      <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80 text-[10px] text-slate-400 space-y-0.5">
                                        <p>Given to: <strong className="text-slate-200">{item.returnedToName}</strong></p>
                                        <p>CNIC: <strong className="text-slate-200">{item.returnedToCnic}</strong></p>
                                        <p>Contact: <strong className="text-slate-200">{item.returnedToContact}</strong></p>
                                        <p>Date: <strong className="text-amber-500">{new Date(item.returnedAt).toLocaleDateString()}</strong></p>
                                      </div>
                                    ) : (
                                      <span className="text-slate-500 italic">Not returned yet</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right">
                                    {item.status === 'AVAILABLE' ? (
                                      <button
                                        onClick={() => {
                                          setReturnItemId(item.id);
                                          setReturnError('');
                                          setReturnModalOpen(true);
                                        }}
                                        className="px-2.5 py-1 bg-police-crimson hover:bg-red-800 text-white rounded text-[11px] font-bold uppercase transition"
                                      >
                                        Return to Owner
                                      </button>
                                    ) : (
                                      <span className="inline-flex items-center text-emerald-400 bg-emerald-950/60 border border-emerald-900 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                        <Check className="h-3 w-3 mr-0.5" />
                                        Returned
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                )}

                {/* TAB 2: LOG NEW ITEM */}
                {policeTab === 'add' && (
                  <div className="max-w-2xl mx-auto glass-card p-6 rounded-xl border border-slate-800 shadow-xl">
                    <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-5">
                      <PlusCircle className="h-5 w-5 text-emerald-500" />
                      <h3 className="font-extrabold text-white text-base">LOG RECOVERED PROPERTY</h3>
                    </div>

                    {addItemError && (
                      <div className="bg-red-950/60 border border-red-800 text-red-200 px-3 py-2.5 rounded-lg text-xs flex items-start space-x-2 mb-4">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                        <span>{addItemError}</span>
                      </div>
                    )}

                    {addItemSuccess && (
                      <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-200 px-3 py-2.5 rounded-lg text-xs flex items-start space-x-2 mb-4">
                        <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                        <span>{addItemSuccess}</span>
                      </div>
                    )}

                    <form onSubmit={handleAddItem} className="space-y-4 text-xs">
                      
                      {/* Description (Text area) */}
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Detailed Description of Item *</label>
                        <textarea
                          required
                          rows="3"
                          value={newItem.description}
                          onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="e.g. Gold necklace with a heart shape pendant, containing 3 emerald diamonds on outer ring..."
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-police-crimson text-xs"
                        ></textarea>
                      </div>

                      {/* Flex grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">Approximate Size *</label>
                          <select
                            value={newItem.size}
                            onChange={(e) => setNewItem(prev => ({ ...prev, size: e.target.value }))}
                            className="w-full px-2 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-police-crimson"
                          >
                            <option value="Small">Small (e.g. Ring, Key, Mobile)</option>
                            <option value="Medium">Medium (e.g. Wallet, Bag, Laptop)</option>
                            <option value="Large">Large (e.g. Bicycle, TV, Suitcase)</option>
                            <option value="Extra Large">Extra Large (e.g. Car, Bike, Machinery)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">Weight / Mass *</label>
                          <input
                            type="text"
                            required
                            value={newItem.weight}
                            onChange={(e) => setNewItem(prev => ({ ...prev, weight: e.target.value }))}
                            placeholder="e.g. 150g, 4.5kg"
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-police-crimson"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">Color *</label>
                          <input
                            type="text"
                            required
                            value={newItem.color}
                            onChange={(e) => setNewItem(prev => ({ ...prev, color: e.target.value }))}
                            placeholder="e.g. Matte Black"
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-police-crimson"
                          />
                        </div>
                      </div>

                      {/* Condition & Holding HQ */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">Condition Found In *</label>
                          <input
                            type="text"
                            required
                            value={newItem.condition}
                            onChange={(e) => setNewItem(prev => ({ ...prev, condition: e.target.value }))}
                            placeholder="e.g. Mint, Damaged screen, Scratched"
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-police-crimson"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">Holding Location (HQ) *</label>
                          <select
                            value={newItem.holdingLocationId}
                            onChange={(e) => setNewItem(prev => ({ ...prev, holdingLocationId: e.target.value }))}
                            className="w-full px-2 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-police-crimson"
                          >
                            {hqs.map(hq => (
                              <option key={hq.id} value={hq.id}>{hq.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center space-x-2 pt-5">
                          <input
                            type="checkbox"
                            id="vehicleCheckbox"
                            checked={isVehicle}
                            onChange={(e) => setIsVehicle(e.target.checked)}
                            className="rounded border-slate-700 text-police-crimson focus:ring-police-crimson bg-slate-900 h-4.5 w-4.5"
                          />
                          <label htmlFor="vehicleCheckbox" className="font-semibold text-slate-350 cursor-pointer select-none">
                            Is Transport / Vehicle
                          </label>
                        </div>
                      </div>

                      {/* Conditional Vehicle Registration */}
                      {isVehicle && (
                        <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800 space-y-2 animate-fadeIn">
                          <label className="block text-amber-500 font-bold uppercase tracking-wider">Number Plate *</label>
                          <input
                            type="text"
                            required={isVehicle}
                            value={newItem.numberPlate}
                            onChange={(e) => setNewItem(prev => ({ ...prev, numberPlate: e.target.value }))}
                            placeholder="e.g. LE-2026-4321 or ICT-987-AB"
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-amber-400 font-mono font-bold tracking-widest focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      )}

                      {/* Recovered Location & Time */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">Recovered From Location *</label>
                          <input
                            type="text"
                            required
                            value={newItem.recoveredLocation}
                            onChange={(e) => setNewItem(prev => ({ ...prev, recoveredLocation: e.target.value }))}
                            placeholder="e.g. Near Metro Station, Ichhra, Lahore"
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-police-crimson"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">Recovery Time & Details *</label>
                          <input
                            type="text"
                            required
                            value={newItem.recoveryTime}
                            onChange={(e) => setNewItem(prev => ({ ...prev, recoveryTime: e.target.value }))}
                            placeholder="e.g. Recovered on 2026-06-18 at 09:15"
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-police-crimson"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingItem}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold uppercase tracking-wider shadow-lg hover:shadow-emerald-950 transition duration-150 mt-4 disabled:opacity-50"
                      >
                        {submittingItem ? 'Saving to Database...' : 'Register Item into System'}
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 3: INCOMING CLAIMS */}
                {policeTab === 'claims' && (
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-white text-base">INCOMING OWNERSHIP CLAIMS ({claims.length})</h3>

                    {loadingClaims ? (
                      <div className="text-center py-12 text-slate-400 font-medium animate-pulse">Loading claims history database...</div>
                    ) : claimsError ? (
                      <div className="bg-red-950/60 border border-red-800 text-red-200 px-3 py-2.5 rounded-lg text-xs flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />
                        <span>{claimsError}</span>
                      </div>
                    ) : claims.length === 0 ? (
                      <div className="glass-card p-12 text-center rounded-xl border border-slate-800 flex flex-col items-center">
                        <CheckCircle className="h-10 w-10 text-slate-600 mb-3" />
                        <p className="text-slate-400 font-medium">All clear! No incoming claims logged for any items.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {claims.map((claim) => {
                          // Check if current user is authorized to action this claim (must be uploader)
                          const isAuthorizedUploader = claim.item.uploaderId === user.id;

                          return (
                            <div key={claim.id} className="glass-card p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between gap-6">
                              
                              {/* Claim Info */}
                              <div className="space-y-3 max-w-xl">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                    claim.status === 'PENDING'
                                      ? 'bg-amber-950 text-amber-400 border-amber-500/20'
                                      : claim.status === 'ACCEPTED'
                                      ? 'bg-emerald-950 text-emerald-400 border-emerald-500/20'
                                      : 'bg-red-950 text-red-400 border-red-500/20'
                                  }`}>
                                    {claim.status}
                                  </span>
                                  <span className="text-[10px] text-slate-500">Submitted: {new Date(claim.createdAt).toLocaleString()}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  <div>
                                    <span className="block text-slate-500 uppercase font-semibold text-[10px]">Claimant ID (Email/CNIC)</span>
                                    <span className="text-slate-200 font-bold">{claim.emailOrCnic}</span>
                                  </div>
                                  <div>
                                    <span className="block text-slate-500 uppercase font-semibold text-[10px]">Contact Info</span>
                                    <span className="text-slate-200 font-medium">{claim.contactInfo}</span>
                                  </div>
                                </div>

                                <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 space-y-1.5 text-xs">
                                  <span className="block text-[10px] text-slate-500 font-bold uppercase">Associated Lost Item</span>
                                  <p className="text-slate-300 leading-normal">{claim.item.description}</p>
                                  <div className="flex flex-wrap gap-x-4 text-[10px] text-slate-400">
                                    <span>Holding HQ: <strong>{claim.item.holdingLocation?.name}</strong></span>
                                    <span>Uploaded By: <strong className="text-amber-500">{claim.item.uploader?.name}</strong></span>
                                  </div>
                                </div>
                              </div>

                              {/* Document & Decision Operations */}
                              <div className="flex flex-col justify-between items-end gap-4 md:min-w-[200px] shrink-0 border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
                                
                                {/* Link to Proof Document */}
                                <a
                                  href={`http://localhost:3001/${claim.proofPath}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full text-center px-4 py-2 bg-slate-900 hover:bg-slate-850 text-amber-500 hover:text-amber-400 border border-slate-700/60 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition"
                                >
                                  <FileText className="h-4 w-4" />
                                  <span>View Proof Document</span>
                                </a>

                                {/* Actions */}
                                {claim.status === 'PENDING' ? (
                                  isAuthorizedUploader ? (
                                    <div className="flex space-x-2 w-full">
                                      <button
                                        onClick={() => handleRejectClaim(claim.id)}
                                        className="flex-1 py-1.5 bg-red-950/40 hover:bg-red-900 border border-red-800 text-red-200 hover:text-white rounded text-xs font-bold uppercase transition"
                                      >
                                        Reject
                                      </button>
                                      <button
                                        onClick={() => handleAcceptClaim(claim.id)}
                                        className="flex-1 py-1.5 bg-emerald-950/40 hover:bg-emerald-800 border border-emerald-800 text-emerald-200 hover:text-white rounded text-xs font-bold uppercase transition"
                                      >
                                        Accept
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="bg-slate-900/80 p-2.5 rounded border border-slate-850 text-[10px] text-slate-500 flex items-start space-x-1.5 w-full">
                                      <Info className="h-4.5 w-4.5 shrink-0 text-slate-600" />
                                      <span>Read-Only. Action is restricted to the uploading station: <strong>{claim.item.uploader?.name}</strong>.</span>
                                    </div>
                                  )
                                ) : (
                                  <div className="text-xs text-slate-500 italic font-semibold uppercase">
                                    Evaluated by Station
                                  </div>
                                )}

                              </div>

                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="glass-panel border-t border-slate-800 py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p>© 2026 Pakistan Police. Internal Use Only — Distributed System.</p>
          <p>Running entirely locally on localhost port 3001 (Server) and 5173 (Client).</p>
        </div>
      </footer>

      {/* =========================================
          MODAL: SUBMIT CIVILIAN CLAIM
         ========================================= */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-200 animate-fadeIn">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setClaimModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>

            <div className="flex items-center space-x-2 pb-3 border-b border-slate-850 mb-4">
              <FileText className="h-5 w-5 text-police-crimson" />
              <h3 className="font-extrabold text-white text-base">FILE PROPERTY CLAIM</h3>
            </div>

            {claimError && (
              <div className="bg-red-950/60 border border-red-800 text-red-200 px-3 py-2 rounded-lg text-xs flex items-start space-x-2 mb-4">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                <span>{claimError}</span>
              </div>
            )}

            {claimSuccess ? (
              <div className="space-y-4 text-center py-4">
                <div className="bg-emerald-950 text-emerald-400 p-3 rounded-full border border-emerald-500/20 w-12 h-12 flex items-center justify-center mx-auto">
                  <Check className="h-6 w-6" />
                </div>
                <p className="text-xs text-slate-350">{claimSuccess}</p>
                <button
                  onClick={() => setClaimModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-semibold uppercase"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-4 text-xs">
                
                <p className="text-[11px] text-slate-400 leading-normal bg-slate-900/60 p-3 rounded-lg border border-slate-850/80">
                  <strong className="text-amber-500">Notice:</strong> Under Pakistan Police codes, each citizen is restricted to a maximum of 3 claims per item. File paths are audited. Proof document must establish direct ownership (receipt, photo, serial number match, etc.)
                </p>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Your Identity ID (Email or CNIC) *</label>
                  <input
                    type="text"
                    required
                    value={claimEmailOrCnic}
                    onChange={(e) => setClaimEmailOrCnic(e.target.value)}
                    placeholder="e.g. 35201-1234567-8 or ahmed@example.com"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-police-crimson text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Contact Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={claimContactInfo}
                    onChange={(e) => setClaimContactInfo(e.target.value)}
                    placeholder="e.g. +92 300 1234567"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-police-crimson text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Proof of Ownership (Upload File) *</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-700 border-dashed rounded-lg bg-slate-900/40 hover:bg-slate-900/60 transition">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-8 w-8 text-slate-500" />
                      <div className="flex text-slate-400">
                        <label className="relative cursor-pointer rounded-md font-semibold text-police-crimson hover:underline focus-within:outline-none">
                          <span>Upload a file</span>
                          <input
                            type="file"
                            required
                            onChange={(e) => setClaimFile(e.target.files[0])}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-[10px] text-slate-500">PNG, JPG, PDF up to 5MB</p>
                      {claimFile && (
                        <p className="text-xs text-amber-500 font-bold mt-2">Selected: {claimFile.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setClaimModalOpen(false)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg font-semibold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingClaim}
                    className="flex-1 py-2 bg-police-crimson hover:bg-red-800 text-white rounded-lg font-semibold uppercase shadow-md disabled:opacity-50 animate-pulse"
                  >
                    {submittingClaim ? 'Filing Claim...' : 'File Ownership Claim'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* =========================================
          MODAL: POLICE MARK ITEM AS RETURNED
         ========================================= */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-200 animate-fadeIn">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setReturnModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>

            <div className="flex items-center space-x-2 pb-3 border-b border-slate-850 mb-4">
              <Unlock className="h-5 w-5 text-emerald-500" />
              <h3 className="font-extrabold text-white text-base">RETURNED PROPERTY AUDIT</h3>
            </div>

            {returnError && (
              <div className="bg-red-950/60 border border-red-800 text-red-200 px-3 py-2 rounded-lg text-xs flex items-start space-x-2 mb-4">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                <span>{returnError}</span>
              </div>
            )}

            <form onSubmit={handleReturnItem} className="space-y-4 text-xs">
              
              <div className="bg-amber-950/40 p-3 rounded-lg border border-amber-900/60 text-[11px] text-amber-400 leading-normal flex items-start space-x-2">
                <Info className="h-5 w-5 shrink-0 mt-0.5" />
                <span>
                  <strong>CRITICAL AUDIT:</strong> Marking this item as returned is **irreversible**. The recipient's details are saved in the audit log and will be visible *only* to police officers. It will never be shown to the public.
                </span>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 font-urdu text-[13px]">وصول کنندہ کا پورا نام / Recipient Full Name *</label>
                <input
                  type="text"
                  required
                  value={returnedToName}
                  onChange={(e) => setReturnedToName(e.target.value)}
                  placeholder="e.g. Ahmed Ali"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-police-crimson text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 font-urdu text-[13px]">شناختی کارڈ نمبر / Recipient CNIC *</label>
                <input
                  type="text"
                  required
                  value={returnedToCnic}
                  onChange={(e) => setReturnedToCnic(e.target.value)}
                  placeholder="e.g. 35202-9876543-1"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-police-crimson text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 font-urdu text-[13px]">فون نمبر / Recipient Phone Number *</label>
                <input
                  type="text"
                  required
                  value={returnedToContact}
                  onChange={(e) => setReturnedToContact(e.target.value)}
                  placeholder="e.g. 0321-7654321"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-police-crimson text-xs"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg font-semibold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold uppercase shadow-md disabled:opacity-50"
                >
                  {submittingReturn ? 'Archiving...' : 'Confirm Return'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default App;
