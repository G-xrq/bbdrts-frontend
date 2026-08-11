import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CampaignCard, { shortAddr, formatCampaignTitle, getOrgDisplayName } from '../components/CampaignCard';
import LocationMapPicker from '../components/LocationMapPicker';
import { ROLES } from '../roleConfig';
import SettingsPanel from '../components/SettingsPanel';
import './ReferenceDashboard.css';

export default function OrganizationView({ 
  contract, 
  walletAddress, 
  campaigns, 
  fetchCampaigns, 
  fetchingCampaigns, 
  currentUser, 
  handleConnectWallet, 
  handleLogout, 
  updateDbWallet 
}) {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Filter & Sort States for "All Campaigns"
  const [categoryFilterAll, setCategoryFilterAll] = useState('ALL');
  const [campaignSortAll, setCampaignSortAll] = useState('NEWEST');
  const [searchQueryAll, setSearchQueryAll] = useState('');
  const [currentPageAll, setCurrentPageAll] = useState(1);

  // Filter & Sort States for "My Campaigns"
  const [categoryFilterMy, setCategoryFilterMy] = useState('ALL');
  const [campaignSortMy, setCampaignSortMy] = useState('NEWEST');
  const [searchQueryMy, setSearchQueryMy] = useState('');
  const [currentPageMy, setCurrentPageMy] = useState(1);

  // Filter & Sort States for "Ledger"
  const [ledgerFilter, setLedgerFilter] = useState('ALL');
  const [ledgerSort, setLedgerSort] = useState('NEWEST');
  const [searchQueryLedger, setSearchQueryLedger] = useState('');
  const [currentPageLedger, setCurrentPageLedger] = useState(1);

  const campaignsPerPage = 4;

  // Create campaign form state
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [category, setCategory] = useState('DR');
  const [locationRegion, setLocationRegion] = useState('');
  const [street, setStreet] = useState('');
  const [barangay, setBarangay] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [country, setCountry] = useState('Philippines');
  const [gpsCoordinates, setGpsCoordinates] = useState('');
  const [beneficiariesImpact, setBeneficiariesImpact] = useState('');
  const [urgency, setUrgency] = useState('HIGH (EMERGENCY AID)');
  const [targetDate, setTargetDate] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [foodPct, setFoodPct] = useState(40);
  const [medicalPct, setMedicalPct] = useState(30);
  const [shelterPct, setShelterPct] = useState(20);
  const [logisticsPct, setLogisticsPct] = useState(10);
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [txModal, setTxModal] = useState({ show: false, step: 0, hash: '', type: '', error: '' });

  // Organization Ledger / Donations State
  const [orgDonations, setOrgDonations] = useState(null);
  const [loadingOrgDonations, setLoadingOrgDonations] = useState(false);

  const myCampaigns = campaigns.filter(
    (c) => c.orgAddress?.toLowerCase() === walletAddress?.toLowerCase()
  );

  const totalRaisedByMe = myCampaigns
    .reduce((s, c) => s + parseFloat(c.currentAmount || 0), 0);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPageAll(1);
  }, [categoryFilterAll, campaignSortAll, searchQueryAll]);

  useEffect(() => {
    setCurrentPageMy(1);
  }, [categoryFilterMy, campaignSortMy, searchQueryMy]);

  const handleGranularAddressFromMap = ({ street: s, barangay: b, city: c, province: p, country: cnt, fullAddress }) => {
    if (s) setStreet(s);
    if (b) setBarangay(b);
    if (c) setCity(c);
    if (p) setProvince(p);
    if (cnt) setCountry(cnt);
    setLocationRegion(fullAddress || [s, b, c, p, cnt].filter(Boolean).join(', '));
  };

  // Fetch Organization Received Donations
  const fetchOrgDonations = async () => {
    try {
      setLoadingOrgDonations(true);
      const token = localStorage.getItem('bbdrts_token');
      if (!token) return;
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/donations/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrgDonations(data);
      }
    } catch (err) {
      console.error('Failed to fetch org donations:', err);
    } finally {
      setLoadingOrgDonations(false);
    }
  };

  useEffect(() => {
    fetchOrgDonations();
  }, []);

  // Filter & Sort All Campaigns
  const filteredAllCampaigns = campaigns
    .filter(c => {
      if (categoryFilterAll !== 'ALL') {
        const displayTitle = formatCampaignTitle(c.title, c.id);
        const isCharity = /charity|school|orphan|food|feed|community|aid|blood|medical/i.test(displayTitle);
        if (categoryFilterAll === 'DR' && isCharity) return false;
        if (categoryFilterAll === 'CD' && !isCharity) return false;
      }
      if (searchQueryAll.trim()) {
        const q = searchQueryAll.toLowerCase().trim();
        const displayTitle = formatCampaignTitle(c.title, c.id).toLowerCase();
        const rawTitle = (c.title || '').toLowerCase();
        const orgName = (c.orgName || '').toLowerCase();
        return displayTitle.includes(q) || rawTitle.includes(q) || orgName.includes(q) || String(c.id).includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (campaignSortAll === 'GOAL_HIGH') return (parseFloat(b.targetAmount) || 0) - (parseFloat(a.targetAmount) || 0);
      if (campaignSortAll === 'GOAL_LOW') return (parseFloat(a.targetAmount) || 0) - (parseFloat(b.targetAmount) || 0);
      if (campaignSortAll === 'RAISED_HIGH') return (parseFloat(b.currentAmount) || 0) - (parseFloat(a.currentAmount) || 0);
      return b.id - a.id;
    });

  const totalPagesAll = Math.ceil(filteredAllCampaigns.length / campaignsPerPage);
  const paginatedAllCampaigns = filteredAllCampaigns.slice(
    (currentPageAll - 1) * campaignsPerPage,
    currentPageAll * campaignsPerPage
  );

  // Filter & Sort My Campaigns
  const filteredMyCampaigns = myCampaigns
    .filter(c => {
      if (categoryFilterMy !== 'ALL') {
        const displayTitle = formatCampaignTitle(c.title, c.id);
        const isCharity = /charity|school|orphan|food|feed|community|aid|blood|medical/i.test(displayTitle);
        if (categoryFilterMy === 'DR' && isCharity) return false;
        if (categoryFilterMy === 'CD' && !isCharity) return false;
      }
      if (searchQueryMy.trim()) {
        const q = searchQueryMy.toLowerCase().trim();
        const displayTitle = formatCampaignTitle(c.title, c.id).toLowerCase();
        const rawTitle = (c.title || '').toLowerCase();
        return displayTitle.includes(q) || rawTitle.includes(q) || String(c.id).includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (campaignSortMy === 'GOAL_HIGH') return (parseFloat(b.targetAmount) || 0) - (parseFloat(a.targetAmount) || 0);
      if (campaignSortMy === 'GOAL_LOW') return (parseFloat(a.targetAmount) || 0) - (parseFloat(b.targetAmount) || 0);
      if (campaignSortMy === 'RAISED_HIGH') return (parseFloat(b.currentAmount) || 0) - (parseFloat(a.currentAmount) || 0);
      return b.id - a.id;
    });

  const totalPagesMy = Math.ceil(filteredMyCampaigns.length / campaignsPerPage);
  const paginatedMyCampaigns = filteredMyCampaigns.slice(
    (currentPageMy - 1) * campaignsPerPage,
    currentPageMy * campaignsPerPage
  );

  // Filter & Sort Ledger Transactions
  const filteredLedger = (orgDonations || [])
    .filter(d => {
      if (ledgerFilter !== 'ALL') {
        const matchCamp = campaigns.find(c => String(c.id) === String(d.campaignId));
        const campTitle = matchCamp ? formatCampaignTitle(matchCamp.title, matchCamp.id) : '';
        const isCharity = /charity|school|orphan|food|feed|community|aid|blood|medical/i.test(campTitle);
        if (ledgerFilter === 'DR' && isCharity) return false;
        if (ledgerFilter === 'CD' && !isCharity) return false;
      }
      if (searchQueryLedger.trim()) {
        const q = searchQueryLedger.toLowerCase().trim();
        const txHash = (d.txHash || '').toLowerCase();
        const matchCamp = campaigns.find(c => String(c.id) === String(d.campaignId));
        const campTitle = matchCamp ? formatCampaignTitle(matchCamp.title, matchCamp.id).toLowerCase() : '';
        return txHash.includes(q) || campTitle.includes(q) || String(d.campaignId).includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (ledgerSort === 'AMOUNT_HIGH') return (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0);
      if (ledgerSort === 'AMOUNT_LOW') return (parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0);
      return (b.id || 0) - (a.id || 0);
    });

  const totalPagesLedger = Math.ceil(filteredLedger.length / campaignsPerPage);
  const paginatedLedger = filteredLedger.slice(
    (currentPageLedger - 1) * campaignsPerPage,
    currentPageLedger * campaignsPerPage
  );

  // Deploy Campaign Logic
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) return setTxModal({ show: true, step: 0, error: 'Please enter a campaign title.' });
    const parsed = parseFloat(targetAmount);
    if (isNaN(parsed) || parsed <= 0)
      return setTxModal({ show: true, step: 0, error: 'Please enter a valid target amount greater than 0 ETH.' });
    if (!contract)
      return setTxModal({ show: true, step: 0, error: 'ACTION BLOCKED: You are not actively connected to MetaMask on this specific wallet address. Please go to Profile & Settings and click Connect MetaMask.' });
    
    try {
      setCreating(true);
      const targetInWei = ethers.parseEther(targetAmount);
      
      setTxModal({ show: true, step: 1, hash: '', type: 'CREATE', error: '' });
      const tx = await contract.createCampaign(title.trim(), targetInWei);
      
      setTxModal({ show: true, step: 2, hash: tx.hash, type: 'CREATE', error: '' });
      await tx.wait();

      try {
        const token = localStorage.getItem('bbdrts_token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        
        const allocations = [
          { label: '🍲 Emergency Food Packs & Clean Water', pct: Number(foodPct) || 40, icon: 'rice_bowl' },
          { label: '🏥 Medical Aid & First-Aid Kits', pct: Number(medicalPct) || 30, icon: 'medical_services' },
          { label: '⛺ Emergency Shelter & Tarpaulins', pct: Number(shelterPct) || 20, icon: 'roofing' },
          { label: '🚚 Logistics & Evacuation Fuel', pct: Number(logisticsPct) || 10, icon: 'local_shipping' }
        ];

        await fetch(`${apiUrl}/api/campaigns`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: title.trim(),
            target_amount: targetAmount,
            contract_address: Object(contract).target || 'Pending',
            category: category,
            location_region: locationRegion.trim() || 'Visayas Relief Region',
            gps_coordinates: gpsCoordinates.trim() || '10.1333° N, 124.8667° E',
            beneficiaries_impact: beneficiariesImpact.trim() || '~2,500 Displaced Families',
            allocations_json: allocations,
            contact_info: contactInfo.trim() || `${currentUser?.username || 'ngo'}@bbdrts.org`,
            description: description.trim() || 'Disaster relief operation deployed on Sepolia EVM protocol.',
            urgency: urgency,
            target_date: targetDate,
            document_url: documentUrl.trim()
          })
        });
      } catch (err) {
        console.error("Failed to sync campaign to backend:", err);
      }

      setTxModal({ show: true, step: 3, hash: tx.hash, type: 'CREATE', error: '' });
      setTitle('');
      setTargetAmount('');
      setLocationRegion('');
      setGpsCoordinates('');
      setBeneficiariesImpact('');
      setContactInfo('');
      setDescription('');
      setTargetDate('');
      setDocumentUrl('');
      setUrgency('HIGH (EMERGENCY AID)');
      fetchCampaigns();
      fetchOrgDonations();
    } catch (err) {
      console.error(err);
      if (err.code !== 'ACTION_REJECTED') {
        let errMsg = err.reason || err.shortMessage || err.message || 'Please check MetaMask.';
        if (typeof errMsg === 'string' && (errMsg.includes('missing revert data') || errMsg.includes('CALL_EXCEPTION'))) {
          errMsg = 'Transaction reverted by the network. Ensure you have sufficient SepoliaETH to deploy this contract.';
        }
        setTxModal({ show: true, step: 0, error: `Transaction failed: ${errMsg}` });
      } else {
        setTxModal({ show: false, step: 0, hash: '', type: '', error: '' });
      }
    } finally {
      setCreating(false);
    }
  };

  const orgDisplayName = getOrgDisplayName(walletAddress, currentUser?.name, 1);
  const orgInitials = orgDisplayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <main className="dashboard container" style={{ paddingTop: '16px' }}>
      {/* ── Reference Dashboard Grid Architecture (Matching DonorView Layout) ── */}
      <div className="ref-dashboard-grid" style={{ marginTop: '0' }}>

        {/* ── Left Sidebar Navigation (Maasin Reference Style) ── */}
        <aside className="ref-sidebar">
          <div>
            <div className="ref-sidebar-user">
              <div className="ref-sidebar-avatar">{orgInitials}</div>
              <div>
                <div className="ref-sidebar-name">{orgDisplayName}</div>
                <div className="ref-sidebar-id">BBDRTS-NGO-2026-0001</div>
              </div>
            </div>

            <nav className="ref-sidebar-menu" style={{ marginTop: '16px' }}>
              <button 
                className={`ref-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <span className="material-symbols-outlined">space_dashboard</span>
                <span>Dashboard Overview</span>
              </button>

              <button 
                className={`ref-nav-item ${activeTab === 'all-campaigns' ? 'active' : ''}`}
                onClick={() => setActiveTab('all-campaigns')}
              >
                <span className="material-symbols-outlined">list_alt</span>
                <span>All Campaigns</span>
              </button>

              <button 
                className={`ref-nav-item ${activeTab === 'my-campaigns' ? 'active' : ''}`}
                onClick={() => setActiveTab('my-campaigns')}
              >
                <span className="material-symbols-outlined">account_balance</span>
                <span>My Campaigns</span>
              </button>

              <button 
                className={`ref-nav-item ${activeTab === 'create' ? 'active' : ''}`}
                onClick={() => setActiveTab('create')}
              >
                <span className="material-symbols-outlined">rocket_launch</span>
                <span>Deploy Campaign</span>
              </button>

              <button 
                className={`ref-nav-item ${activeTab === 'ledger' ? 'active' : ''}`}
                onClick={() => setActiveTab('ledger')}
              >
                <span className="material-symbols-outlined">receipt_long</span>
                <span>Donation Ledger</span>
              </button>

              <button 
                className={`ref-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <span className="material-symbols-outlined">account_circle</span>
                <span>Profile & Settings</span>
              </button>
            </nav>
          </div>

          {/* ── Web3 Sepolia Live Protocol Widget ── */}
          <div className="ref-sidebar-widget" style={{ marginTop: '20px' }}>
            <div className="ref-widget-header">
              <span className="ref-status-dot"></span>
              <span className="ref-widget-title">Sepolia EVM Protocol</span>
            </div>
            <div className="ref-widget-detail">
              <div className="ref-widget-row">
                <span>Verification</span>
                <span className="ref-widget-value green">
                  {currentUser?.verification_status === 'Approved' ? 'Approved NGO' : 'Pending Verification'}
                </span>
              </div>
              <div className="ref-widget-row">
                <span>Contract Health</span>
                <span className="ref-widget-value">100% Immutable</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Content Area ── */}
        <section className="ref-main-content">

          {/* Sleek Inline Testnet Banner */}
          <div className="ref-inline-testnet-banner">
            <span>🔬</span>
            <span>
              <strong>Sepolia Testnet Protocol Active</strong> — Verified Smart Contract Operations.{' '}
              <a href="https://sepoliafaucet.com/" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>
                Get Sepolia ETH →
              </a>
            </span>
          </div>

          {/* ── 1. DASHBOARD OVERVIEW TAB ONLY ── */}
          {activeTab === 'dashboard' && (
            <>
              {/* Top Welcome Hero Banner */}
              <div className="ref-welcome-card">
                <div className="ref-welcome-header">
                  <div className="ref-welcome-avatar">{orgInitials}</div>
                  <div className="ref-welcome-text">
                    <h1>Welcome, {orgDisplayName}!</h1>
                    <p>NGO ID: BBDRTS-NGO-2026-0001 | Verified Sepolia EVM Protocol</p>
                  </div>
                </div>

                <div className="ref-action-btns">
                  <button className="ref-btn-pill-primary" onClick={() => setActiveTab('create')}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>rocket_launch</span>
                    <span>Deploy Campaign</span>
                  </button>
                  <a href="https://sepolia.etherscan.io" target="_blank" rel="noreferrer" className="ref-btn-pill-primary" style={{ textDecoration: 'none' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>analytics</span>
                    <span>Public Ledger</span>
                  </a>
                </div>
              </div>

              {/* 4-Metric Stat Cards Grid */}
              <div className="ref-metrics-grid">
                <div className="ref-metric-card">
                  <div className="ref-metric-icon-circle">
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#0284c7' }}>account_balance_wallet</span>
                  </div>
                  <div className="ref-metric-title">Total Raised</div>
                  <div className="ref-metric-value">{totalRaisedByMe.toFixed(4)} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>ETH</span></div>
                  <div className="ref-metric-sub">≈ ₱{(totalRaisedByMe * 170000).toLocaleString('en-US', {maximumFractionDigits: 0})} PHP</div>
                </div>

                <div className="ref-metric-card">
                  <div className="ref-metric-icon-circle">
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#22c55e' }}>account_balance</span>
                  </div>
                  <div className="ref-metric-title">My Deployed Campaigns</div>
                  <div className="ref-metric-value">{myCampaigns.length}</div>
                  <div className="ref-metric-sub">{myCampaigns.filter(c => c.isActive).length} Active Operations</div>
                </div>

                <div className="ref-metric-card">
                  <div className="ref-metric-icon-circle">
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#0284c7' }}>receipt_long</span>
                  </div>
                  <div className="ref-metric-title">Received Donations</div>
                  <div className="ref-metric-value">{orgDonations ? orgDonations.length : 0}</div>
                  <div className="ref-metric-sub">Verified On-Chain Ledger</div>
                </div>

                <div className="ref-metric-card">
                  <div className="ref-metric-icon-circle">
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#38bdf8' }}>verified</span>
                  </div>
                  <div className="ref-metric-title">Verification Status</div>
                  <div className="ref-metric-value" style={{ fontSize: '1rem', color: currentUser?.verification_status === 'Approved' ? '#22c55e' : '#f59e0b' }}>
                    {currentUser?.verification_status === 'Approved' ? '✓ Approved NGO' : '⌛ Pending'}
                  </div>
                  <div className="ref-metric-sub">Admin Managed Access</div>
                </div>
              </div>

              {/* My Deployed Campaigns Preview Section */}
              <div style={{ marginTop: '28px' }}>
                <div className="section-header">
                  <h2 className="section-title">
                    <span className="material-symbols-outlined section-title-icon" style={{marginRight: '8px'}}>account_balance</span> My Relief Operations
                  </h2>
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('my-campaigns')}>
                    View All {myCampaigns.length} Campaigns →
                  </button>
                </div>

                {fetchingCampaigns && myCampaigns.length === 0 ? (
                  <div className="empty-state">
                    <div className="spinner spinner-light" style={{ width: 28, height: 28 }} />
                    <div className="empty-title">Reading from blockchain…</div>
                  </div>
                ) : myCampaigns.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🚀</div>
                    <div className="empty-title">You haven't deployed any campaigns yet</div>
                    <div className="empty-desc">Click "Deploy Campaign" to start your first relief operation.</div>
                  </div>
                ) : (
                  <div className="campaigns-list">
                    {myCampaigns.slice(0, 2).map((camp) => (
                      <CampaignCard
                        key={camp.id}
                        camp={camp}
                        contract={contract}
                        role={ROLES.ORGANIZATION}
                        walletAddress={walletAddress}
                        onDonated={fetchCampaigns}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── 2. ALL CAMPAIGNS TAB ── */}
          {activeTab === 'all-campaigns' && (
            <div style={{ marginTop: '8px' }}>
              <div className="section-header">
                <div>
                  <h2 className="section-title" style={{ fontSize: '1.4rem' }}>
                    <span className="material-symbols-outlined section-title-icon" style={{marginRight: '8px', color: '#0284c7'}}>list_alt</span> All Relief Campaigns
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>
                    Public ledger view of all active disaster relief and charitable aid campaigns across the network.
                  </p>
                </div>

                <button
                  className="btn btn-ghost btn-sm"
                  onClick={fetchCampaigns}
                  disabled={fetchingCampaigns}
                >
                  {fetchingCampaigns
                    ? <div className="spinner spinner-light" />
                    : '↻ Refresh'}
                </button>
              </div>

              {/* Filter & Sort Toolbar */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                gap: '12px', 
                marginTop: '16px', 
                marginBottom: '20px',
                flexWrap: 'wrap',
                background: 'rgba(15, 23, 42, 0.4)',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                {/* Search Input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px', minWidth: '220px' }}>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1.1rem', pointerEvents: 'none' }}>
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Search campaign, NGO, or cause..."
                      value={searchQueryAll}
                      onChange={(e) => setSearchQueryAll(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(30, 41, 59, 0.9)',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '7px 30px 7px 34px',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                    {searchQueryAll && (
                      <button
                        onClick={() => setSearchQueryAll('')}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Filter Category:</span>
                  <select
                    value={categoryFilterAll}
                    onChange={(e) => setCategoryFilterAll(e.target.value)}
                    style={{
                      background: 'rgba(30, 41, 59, 0.9)',
                      color: '#fff',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '0.85rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="ALL">All Categories ({campaigns.length})</option>
                    <option value="DR">🌊 Disaster Relief (DR-00X)</option>
                    <option value="CD">🤝 Charitable Aid (CD-00X)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Sort By:</span>
                  <select
                    value={campaignSortAll}
                    onChange={(e) => setCampaignSortAll(e.target.value)}
                    style={{
                      background: 'rgba(30, 41, 59, 0.9)',
                      color: '#fff',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '0.85rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="NEWEST">Newest First</option>
                    <option value="GOAL_HIGH">Target Goal: High to Low</option>
                    <option value="GOAL_LOW">Target Goal: Low to High</option>
                    <option value="RAISED_HIGH">Highest Raised</option>
                  </select>
                </div>
              </div>

              {filteredAllCampaigns.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <div className="empty-title">No campaigns match this category</div>
                  <div className="empty-desc">
                    Try selecting a different category from the dropdown above.
                  </div>
                </div>
              ) : (
                <>
                  <div className="campaigns-list">
                    {paginatedAllCampaigns.map((camp) => (
                      <CampaignCard key={camp.id} camp={camp} contract={contract}
                        role={ROLES.ORGANIZATION} walletAddress={walletAddress} onDonated={fetchCampaigns} />
                    ))}
                  </div>

                  {/* Centered Pagination Controls */}
                  {totalPagesAll > 1 && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginTop: '24px',
                      padding: '12px 0'
                    }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setCurrentPageAll(p => Math.max(1, p - 1))}
                        disabled={currentPageAll === 1}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>chevron_left</span> Previous
                      </button>

                      {Array.from({ length: totalPagesAll }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          className={`btn btn-sm ${currentPageAll === pageNum ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => setCurrentPageAll(pageNum)}
                          style={{ minWidth: '36px', height: '36px', borderRadius: '8px', fontWeight: currentPageAll === pageNum ? 700 : 400 }}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setCurrentPageAll(p => Math.min(totalPagesAll, p + 1))}
                        disabled={currentPageAll === totalPagesAll}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        Next <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>chevron_right</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── 3. MY CAMPAIGNS TAB ── */}
          {activeTab === 'my-campaigns' && (
            <div style={{ marginTop: '8px' }}>
              <div className="section-header">
                <div>
                  <h2 className="section-title" style={{ fontSize: '1.4rem' }}>
                    <span className="material-symbols-outlined section-title-icon" style={{marginRight: '8px', color: '#0284c7'}}>account_balance</span> My Campaigns
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>
                    Relief operations deployed under {orgDisplayName} ({shortAddr(walletAddress)}).
                  </p>
                </div>

                <button
                  className="btn btn-ghost btn-sm"
                  onClick={fetchCampaigns}
                  disabled={fetchingCampaigns}
                >
                  {fetchingCampaigns
                    ? <div className="spinner spinner-light" />
                    : '↻ Refresh'}
                </button>
              </div>

              {/* Filter & Sort Toolbar */}
              {myCampaigns.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  gap: '12px', 
                  marginTop: '16px', 
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  background: 'rgba(15, 23, 42, 0.4)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  {/* Search Input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px', minWidth: '220px' }}>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1.1rem', pointerEvents: 'none' }}>
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="Search my campaigns..."
                        value={searchQueryMy}
                        onChange={(e) => setSearchQueryMy(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(30, 41, 59, 0.9)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          padding: '7px 30px 7px 34px',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      />
                      {searchQueryMy && (
                        <button
                          onClick={() => setSearchQueryMy('')}
                          style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Filter Category:</span>
                    <select
                      value={categoryFilterMy}
                      onChange={(e) => setCategoryFilterMy(e.target.value)}
                      style={{
                        background: 'rgba(30, 41, 59, 0.9)',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '0.85rem',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="ALL">All Categories ({myCampaigns.length})</option>
                      <option value="DR">🌊 Disaster Relief (DR-00X)</option>
                      <option value="CD">🤝 Charitable Aid (CD-00X)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Sort By:</span>
                    <select
                      value={campaignSortMy}
                      onChange={(e) => setCampaignSortMy(e.target.value)}
                      style={{
                        background: 'rgba(30, 41, 59, 0.9)',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '0.85rem',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="NEWEST">Newest First</option>
                      <option value="GOAL_HIGH">Target Goal: High to Low</option>
                      <option value="GOAL_LOW">Target Goal: Low to High</option>
                      <option value="RAISED_HIGH">Highest Raised</option>
                    </select>
                  </div>
                </div>
              )}

              {myCampaigns.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🚀</div>
                  <div className="empty-title">You haven't created any campaigns yet</div>
                  <div className="empty-desc">
                    Switch to the "Deploy Campaign" tab to publish your first relief operation onto the blockchain.
                  </div>
                </div>
              ) : filteredMyCampaigns.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <div className="empty-title">No campaigns match this category</div>
                  <div className="empty-desc">
                    Try selecting a different category from the dropdown above.
                  </div>
                </div>
              ) : (
                <>
                  <div className="campaigns-list">
                    {paginatedMyCampaigns.map((camp) => (
                      <CampaignCard key={camp.id} camp={camp} contract={contract}
                        role={ROLES.ORGANIZATION} walletAddress={walletAddress} onDonated={fetchCampaigns} />
                    ))}
                  </div>

                  {/* Centered Pagination Controls */}
                  {totalPagesMy > 1 && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginTop: '24px',
                      padding: '12px 0'
                    }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setCurrentPageMy(p => Math.max(1, p - 1))}
                        disabled={currentPageMy === 1}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>chevron_left</span> Previous
                      </button>

                      {Array.from({ length: totalPagesMy }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          className={`btn btn-sm ${currentPageMy === pageNum ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => setCurrentPageMy(pageNum)}
                          style={{ minWidth: '36px', height: '36px', borderRadius: '8px', fontWeight: currentPageMy === pageNum ? 700 : 400 }}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setCurrentPageMy(p => Math.min(totalPagesMy, p + 1))}
                        disabled={currentPageMy === totalPagesMy}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        Next <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>chevron_right</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── 4. DEPLOY CAMPAIGN TAB ── */}
          {activeTab === 'create' && (
            <div style={{ marginTop: '8px' }}>
              {currentUser?.verification_status !== 'Approved' ? (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', textAlign: 'center', border: '1px solid rgba(255, 60, 60, 0.4)', background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255, 60, 60, 0.05) 100%)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '56px', color: 'var(--danger)', marginBottom: '16px' }}>gpp_bad</span>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)', marginBottom: '12px' }}>Action Blocked: Pending Verification</h2>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '550px', lineHeight: '1.6', fontSize: '1.05rem' }}>
                    Your Organization account must be manually verified and <strong>Approved by an Admin</strong> before you are allowed to deploy relief campaigns permanently onto the blockchain.
                  </p>
                  <div style={{ marginTop: '24px', padding: '12px 24px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      Please check back later or contact the system administrator to expedite your approval.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="card glow fade-in" style={{ padding: '28px', borderRadius: '16px' }}>
                  <div className="section-header" style={{ marginBottom: '16px' }}>
                    <h2 className="section-title">
                  <span className="material-symbols-outlined section-title-icon" style={{marginRight: '8px'}}>rocket_launch</span> Deploy Relief Campaign
                    </h2>
                    <span className="badge badge-info">NGO Organization Portal</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginBottom: '22px', lineHeight: 1.5 }}>
                    Deploy a new relief operation under your official organization name (<strong>{orgDisplayName}</strong>). This action creates a smart contract instance linked directly to your wallet address (<code style={{ fontSize: '0.82rem', color: 'var(--accent)' }}>{shortAddr(walletAddress)}</code>).
                  </p>

                  <form className="create-form" onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Section 1: Campaign Essentials */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '20px' }}>
                      <h3 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>campaign</span> 1. Basic Campaign Information
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600, marginBottom: '6px' }}>
                            Campaign Title *
                          </label>
                          <input className="input" type="text" required
                            placeholder="e.g., Super Typhoon Emergency Relief Operation"
                            value={title} onChange={(e) => setTitle(e.target.value)} disabled={creating} />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600, marginBottom: '6px' }}>
                            Relief Category *
                          </label>
                          <select
                            className="input"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            disabled={creating}
                            style={{ background: 'rgba(30, 41, 59, 0.9)', color: '#fff' }}
                          >
                            <option value="DR">🌊 Disaster Relief (DR)</option>
                            <option value="CD">🤝 Charitable Aid (CD)</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600, marginBottom: '6px' }}>
                            Fundraising Target (ETH) *
                          </label>
                          <input className="input" type="number" step="0.001" min="0" required
                            placeholder="e.g., 0.5 ETH"
                            value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} disabled={creating} />
                          {targetAmount && !isNaN(parseFloat(targetAmount)) && (
                            <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#38bdf8', fontWeight: 500 }}>
                              ≈ Target Goal: ₱{(parseFloat(targetAmount) * 170000).toLocaleString('en-US', {maximumFractionDigits: 2})} PHP
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600, marginBottom: '6px' }}>
                              Urgency Status
                            </label>
                            <select className="input" value={urgency} onChange={(e) => setUrgency(e.target.value)} disabled={creating} style={{ fontSize: '0.82rem' }}>
                              <option value="HIGH (EMERGENCY AID)">🔴 Emergency High Aid</option>
                              <option value="MEDIUM (URGENT REHABILITATION)">🟡 Urgent Medium Rehabilitation</option>
                              <option value="STABLE (CHARITABLE AID)">🟢 Standard Aid Operation</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600, marginBottom: '6px' }}>
                              Target Relief Delivery Date
                            </label>
                            <input className="input" type="date"
                              value={targetDate} onChange={(e) => setTargetDate(e.target.value)} disabled={creating} style={{ fontSize: '0.82rem' }} />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600, marginBottom: '6px' }}>
                            Estimated Beneficiaries
                          </label>
                          <input className="input" type="text"
                            placeholder="e.g., ~3,500 Displaced Families"
                            value={beneficiariesImpact} onChange={(e) => setBeneficiariesImpact(e.target.value)} disabled={creating} />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Interactive Location Map & Geocoding (2-Column Grid) */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '14px', padding: '20px' }}>
                      <h3 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>map</span> 2. Target Location & Interactive Pin Map
                      </h3>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '20px', alignItems: 'start' }}>
                        {/* Left Column (50%): Granular Address Fields */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: '#ef4444' }}>location_on</span> Granular Address Details
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-xs"
                                onClick={() => {
                                  const fullAddr = [street, barangay, city, province, country].filter(Boolean).join(', ');
                                  if (fullAddr) setLocationRegion(fullAddr);
                                }}
                                disabled={creating}
                                style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(56, 189, 248, 0.4)' }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>search</span>
                                Find / Sync Location
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs"
                                onClick={() => {
                                  setStreet('');
                                  setBarangay('');
                                  setCity('');
                                  setProvince('');
                                  setCountry('Philippines');
                                  setLocationRegion('');
                                  setGpsCoordinates('');
                                }}
                                disabled={creating}
                                style={{ fontSize: '0.72rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 8px', borderRadius: '6px' }}
                              >
                                🧹 Clear
                              </button>
                            </div>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>
                              Street / Building / House No.
                            </label>
                            <input
                              className="input"
                              type="text"
                              placeholder="e.g., Rizal Street, Block 4"
                              value={street}
                              onChange={(e) => {
                                setStreet(e.target.value);
                                setLocationRegion([e.target.value, barangay, city, province, country].filter(Boolean).join(', '));
                              }}
                              disabled={creating}
                              style={{ fontSize: '0.85rem' }}
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>
                                Barangay / Village
                              </label>
                              <input
                                className="input"
                                type="text"
                                placeholder="e.g., Barangay Abgao"
                                value={barangay}
                                onChange={(e) => {
                                  setBarangay(e.target.value);
                                  setLocationRegion([street, e.target.value, city, province, country].filter(Boolean).join(', '));
                                }}
                                disabled={creating}
                                style={{ fontSize: '0.85rem' }}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>
                                Municipality / City *
                              </label>
                              <input
                                className="input"
                                type="text"
                                required
                                placeholder="e.g., Maasin City"
                                value={city}
                                onChange={(e) => {
                                  setCity(e.target.value);
                                  setLocationRegion([street, barangay, e.target.value, province, country].filter(Boolean).join(', '));
                                }}
                                disabled={creating}
                                style={{ fontSize: '0.85rem' }}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>
                                Province / State *
                              </label>
                              <input
                                className="input"
                                type="text"
                                required
                                placeholder="e.g., Southern Leyte"
                                value={province}
                                onChange={(e) => {
                                  setProvince(e.target.value);
                                  setLocationRegion([street, barangay, city, e.target.value, country].filter(Boolean).join(', '));
                                }}
                                disabled={creating}
                                style={{ fontSize: '0.85rem' }}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>
                                Country
                              </label>
                              <input
                                className="input"
                                type="text"
                                placeholder="e.g., Philippines"
                                value={country}
                                onChange={(e) => {
                                  setCountry(e.target.value);
                                  setLocationRegion([street, barangay, city, province, e.target.value].filter(Boolean).join(', '));
                                }}
                                disabled={creating}
                                style={{ fontSize: '0.85rem' }}
                              />
                            </div>
                          </div>

                          {/* Combined Address Preview */}
                          <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px', padding: '10px 12px' }}>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              📍 Formatted Full Address:
                            </div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8', marginTop: '2px', wordBreak: 'break-word' }}>
                              {locationRegion || 'Fill inputs above or select a point on the map →'}
                            </div>
                          </div>
                        </div>

                        {/* Right Column (50%): Square Leaflet Map View */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: '#38bdf8' }}>pin_drop</span> Square Map View
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                              Auto-Sync Pin
                            </span>
                          </div>

                          <div style={{
                            width: '100%',
                            height: '320px',
                            borderRadius: '14px',
                            overflow: 'hidden',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            background: '#0f172a'
                          }}>
                            <LocationMapPicker
                              address={locationRegion}
                              gps={gpsCoordinates}
                              onChangeAddress={(addr) => setLocationRegion(addr)}
                              onChangeGranularAddress={handleGranularAddressFromMap}
                              onChangeGps={(coords) => setGpsCoordinates(coords)}
                              height="320px"
                              hideTip={true}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Purpose & Contact */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '20px' }}>
                      <h3 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>contact_support</span> 3. Mission Purpose & Emergency Contact
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600, marginBottom: '6px' }}>
                            Emergency Contact Hotline / Email
                          </label>
                          <input className="input" type="text"
                            placeholder="e.g., relief@redcross.org.ph • (053) 570-8899"
                            value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} disabled={creating} />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600, marginBottom: '6px' }}>
                            Official Document / Verification Link (Optional)
                          </label>
                          <input className="input" type="url"
                            placeholder="e.g., https://redcross.org.ph/press-release-102"
                            value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} disabled={creating} />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600, marginBottom: '6px' }}>
                          Mission & Campaign Description
                        </label>
                        <textarea
                          className="input"
                          rows="3"
                          placeholder="Provide mission background, emergency relief scope, and on-ground deployment plan..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          disabled={creating}
                          style={{ width: '100%', resize: 'none' }}
                        />
                      </div>
                    </div>

                    {/* Submit Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <button type="submit" className="btn btn-primary pulse" disabled={creating} style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
                        {creating ? <><div className="spinner" /> Deploying to Blockchain…</> : '🚀 Confirm & Deploy Campaign'}
                      </button>

                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', background: 'rgba(15, 23, 42, 0.5)', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        ⚡ Gas Fee Notice: Transaction mined on Sepolia EVM Protocol.
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ── 5. DONATION LEDGER TAB ── */}
          {activeTab === 'ledger' && (
            <div style={{ marginTop: '8px' }}>
              <div className="section-header">
                <div>
                  <h2 className="section-title" style={{ fontSize: '1.4rem' }}>
                    <span className="material-symbols-outlined section-title-icon" style={{marginRight: '8px', color: '#0284c7'}}>receipt_long</span> Organization Donation Ledger
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>
                    Real-time transaction receipts for contributions received by {orgDisplayName}.
                  </p>
                </div>

                <button className="btn btn-ghost btn-sm" onClick={fetchOrgDonations} disabled={loadingOrgDonations}>
                  {loadingOrgDonations ? <div className="spinner spinner-light" /> : '↻ Sync Ledger'}
                </button>
              </div>

              {/* Filter & Sort Toolbar */}
              {orgDonations && orgDonations.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  gap: '12px', 
                  marginTop: '16px', 
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  background: 'rgba(15, 23, 42, 0.4)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  {/* Search Input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px', minWidth: '220px' }}>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1.1rem', pointerEvents: 'none' }}>
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="Search tx hash or campaign..."
                        value={searchQueryLedger}
                        onChange={(e) => setSearchQueryLedger(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(30, 41, 59, 0.9)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          padding: '7px 30px 7px 34px',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      />
                      {searchQueryLedger && (
                        <button
                          onClick={() => setSearchQueryLedger('')}
                          style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Filter Category:</span>
                    <select
                      value={ledgerFilter}
                      onChange={(e) => setLedgerFilter(e.target.value)}
                      style={{
                        background: 'rgba(30, 41, 59, 0.9)',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '0.85rem',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="ALL">All Transactions ({orgDonations.length})</option>
                      <option value="DR">🌊 Disaster Relief (DR)</option>
                      <option value="CD">🤝 Charitable Aid (CD)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Sort Amount:</span>
                    <select
                      value={ledgerSort}
                      onChange={(e) => setLedgerSort(e.target.value)}
                      style={{
                        background: 'rgba(30, 41, 59, 0.9)',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '0.85rem',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="NEWEST">Newest First</option>
                      <option value="AMOUNT_HIGH">Amount: High to Low</option>
                      <option value="AMOUNT_LOW">Amount: Low to High</option>
                    </select>
                  </div>
                </div>
              )}

              {!orgDonations || orgDonations.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📜</div>
                  <div className="empty-title">No transactions recorded yet</div>
                  <div className="empty-desc">
                    When donors contribute to your relief campaigns, immutable receipts will appear here in real time.
                  </div>
                </div>
              ) : filteredLedger.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <div className="empty-title">No transactions match this category</div>
                  <div className="empty-desc">
                    Try selecting a different category from the dropdown above.
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {paginatedLedger.map((d, idx) => {
                      const matchCamp = campaigns.find(c => String(c.id) === String(d.campaignId));
                      const rawTitle  = matchCamp ? matchCamp.title : `Disaster Relief Campaign #${d.campaignId}`;
                      const campTitle = formatCampaignTitle(rawTitle, d.campaignId);
                      const isCharity = /charity|school|orphan|food|feed|community|aid|blood|medical/i.test(campTitle);
                      const catCode   = isCharity ? `CD-00${d.campaignId}` : `DR-00${d.campaignId}`;
                      const catLabel  = isCharity ? 'Charitable Aid' : 'Disaster Relief';

                      return (
                        <div 
                          key={idx} 
                          className="card glow fade-in" 
                          style={{ 
                            padding: '18px 22px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '12px',
                            background: 'rgba(15, 23, 42, 0.65)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '14px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <span className={`badge ${isCharity ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                                  {catCode} • {catLabel}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>
                                  ✓ Verified On-Chain
                                </span>
                              </div>
                              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff', fontWeight: 600 }}>
                                {campTitle}
                              </h3>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--success)' }}>
                                +{d.amount} <span style={{ fontSize: '0.85rem' }}>ETH</span>
                              </div>
                              <div style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: 500, marginTop: '2px' }}>
                                ≈ ₱{(parseFloat(d.amount) * 170000).toLocaleString('en-US', {maximumFractionDigits: 2})} PHP
                              </div>
                            </div>
                          </div>

                          <div style={{ 
                            paddingTop: '10px', 
                            borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
                            display: 'flex', 
                            justify: 'space-between', 
                            alignItems: 'center', 
                            flexWrap: 'wrap', 
                            gap: '8px',
                            fontSize: '0.78rem' 
                          }}>
                            <div style={{ fontFamily: 'monospace', color: '#94a3b8' }}>
                              <span style={{ color: '#cbd5e1' }}>Tx Hash:</span> {d.txHash.slice(0, 18)}…{d.txHash.slice(-8)}
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(d.txHash);
                                  alert('Transaction hash copied to clipboard!');
                                }}
                                style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                              >
                                📋 Copy
                              </button>
                              <a
                                href={`https://sepolia.etherscan.io/tx/${d.txHash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-outline btn-sm"
                                style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                              >
                                ↗ Etherscan
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Centered Pagination Controls */}
                  {totalPagesLedger > 1 && (
                    <div style={{ 
                      display: 'flex', 
                      justify: 'center', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginTop: '24px',
                      padding: '12px 0'
                    }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setCurrentPageLedger(p => Math.max(1, p - 1))}
                        disabled={currentPageLedger === 1}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>chevron_left</span> Previous
                      </button>

                      {Array.from({ length: totalPagesLedger }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          className={`btn btn-sm ${currentPageLedger === pageNum ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => setCurrentPageLedger(pageNum)}
                          style={{ minWidth: '36px', height: '36px', borderRadius: '8px', fontWeight: currentPageLedger === pageNum ? 700 : 400 }}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setCurrentPageLedger(p => Math.min(totalPagesLedger, p + 1))}
                        disabled={currentPageLedger === totalPagesLedger}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        Next <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>chevron_right</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── 6. PROFILE & SETTINGS TAB ── */}
          {activeTab === 'settings' && (
            <div style={{ marginTop: '8px' }}>
              <SettingsPanel 
                contract={contract}
                currentUser={currentUser} 
                walletAddress={walletAddress} 
                handleConnectWallet={handleConnectWallet} 
                handleLogout={handleLogout} 
                updateDbWallet={updateDbWallet}
              />
            </div>
          )}

        </section>
      </div>

      {/* ── Web3 Deployment Modal ── */}
      {txModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(5, 7, 12, 0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
        }} className="fade-in">
          <div className="card bounce-in" style={{ width: '420px', padding: '24px', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', borderRadius: '16px' }}>
            
            {txModal.step === 0 && (
              <div className="fade-in">
                <h2 style={{marginTop:0, marginBottom:'20px', display:'flex', alignItems:'center', fontSize: '1.2rem', color: 'var(--text)'}}>
                  <span className="material-symbols-outlined" style={{marginRight:'8px', color: 'var(--danger)'}}>error</span> 
                  Action Blocked
                </h2>
                <p style={{color:'var(--text-secondary)', fontSize:'0.9rem', marginBottom:'24px', lineHeight:'1.5'}}>
                  {txModal.error}
                </p>
                <button className="btn btn-primary btn-full pulse" onClick={() => setTxModal({ show: false, step: 0, hash: '', type: '', error: '' })}>Understood</button>
              </div>
            )}

            {txModal.step === 1 && (
              <div className="fade-in" style={{textAlign:'center', padding:'40px 0'}}>
                 <div className="spinner" style={{width:'40px', height:'40px', margin:'0 auto 20px', borderColor:'var(--primary)', borderRightColor:'transparent'}}></div>
                 <h3 style={{marginBottom:'8px', color: 'var(--text)'}}>Awaiting Signature</h3>
                 <p style={{color:'var(--text-muted)', fontSize:'0.85rem'}}>Please open MetaMask and securely sign the transaction to deploy your new campaign.</p>
              </div>
            )}

            {txModal.step === 2 && (
              <div className="fade-in" style={{textAlign:'center', padding:'40px 0'}}>
                 <div className="spinner" style={{width:'40px', height:'40px', margin:'0 auto 20px', borderColor:'var(--secondary)', borderRightColor:'transparent'}}></div>
                 <h3 style={{marginBottom:'8px', color: 'var(--text)'}}>Deploying Campaign</h3>
                 <p style={{color:'var(--text-muted)', fontSize:'0.85rem', marginBottom: '20px'}}>Mining your structural contract across the Sepolia network.</p>
                 <div style={{padding:'10px', background:'rgba(0,0,0,0.3)', borderRadius:'8px', fontSize:'0.75rem', wordBreak:'break-all', border: '1px solid rgba(255,255,255,0.05)'}}>
                   <span style={{color:'var(--text-secondary)', display:'block', marginBottom:'4px'}}>Transaction Hash:</span> 
                   {txModal.hash}
                 </div>
              </div>
            )}

            {txModal.step === 3 && (
              <div className="fade-in" style={{textAlign:'center', padding:'20px 0 10px'}}>
                 <div className="success-circle-container">
                    <span className="material-symbols-outlined check-icon-pop" style={{fontSize: '2.5rem', color: 'var(--success)'}}>check</span>
                 </div>
                 <h3 style={{marginBottom:'8px', color: 'var(--text)'}}>Deployment Successful!</h3>
                 <p style={{color:'var(--text-muted)', fontSize:'0.85rem'}}>
                   Your relief campaign has been permanently deployed on the immutable blockchain.
                 </p>
                 <div style={{margin:'24px 0', padding:'16px', background:'rgba(0,0,0,0.2)', borderRadius:'8px', textAlign:'left', border: '1px solid rgba(0,255,100,0.1)'}}>
                    <div style={{fontSize:'0.75rem', color:'var(--text-secondary)', marginBottom:'8px'}}>Verified Block Receipt</div>
                    <a href={`https://sepolia.etherscan.io/tx/${txModal.hash}`} target="_blank" rel="noreferrer" style={{color:'var(--success)', textDecoration:'none', wordBreak:'break-all', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'6px'}}>
                      <span className="material-symbols-outlined" style={{fontSize:'1rem'}}>open_in_new</span> {txModal.hash.slice(0,20)}...
                    </a>
                 </div>
                 <button className="btn btn-primary btn-full pulse" onClick={() => { setTxModal({ show: false, step: 0, hash: '', type: '', error: '' }); setActiveTab('my-campaigns'); }}>Complete</button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
