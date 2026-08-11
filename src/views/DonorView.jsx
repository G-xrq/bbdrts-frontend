import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CampaignCard, { formatCampaignTitle } from '../components/CampaignCard';
import { ROLES } from '../roleConfig';
import SettingsPanel from '../components/SettingsPanel';
import './ReferenceDashboard.css';

export default function DonorView({ contract, walletAddress, campaigns, fetchCampaigns, fetchingCampaigns, currentUser, handleConnectWallet, handleLogout, updateDbWallet }) {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [campaignSort, setCampaignSort] = useState('NEWEST');
  const [searchQuery, setSearchQuery] = useState('');
  const [receiptFilter, setReceiptFilter] = useState('ALL');
  const [receiptSort, setReceiptSort] = useState('NEWEST');
  const [searchQueryReceipts, setSearchQueryReceipts] = useState('');

  // Pagination for Relief Campaigns
  const [currentPage, setCurrentPage] = useState(1);
  const campaignsPerPage = 4;

  // Reset page on filter/sort/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, campaignSort, searchQuery]);

  // Filter & Sort campaigns
  const filteredCampaigns = campaigns
    .filter(c => {
      if (categoryFilter !== 'ALL') {
        const displayTitle = formatCampaignTitle(c.title, c.id);
        const isCharity = /charity|school|orphan|food|feed|community|aid|blood|medical/i.test(displayTitle);
        if (categoryFilter === 'DR' && isCharity) return false;
        if (categoryFilter === 'CD' && !isCharity) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const displayTitle = formatCampaignTitle(c.title, c.id).toLowerCase();
        const rawTitle = (c.title || '').toLowerCase();
        const orgName = (c.orgName || '').toLowerCase();
        return displayTitle.includes(q) || rawTitle.includes(q) || orgName.includes(q) || String(c.id).includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (campaignSort === 'GOAL_HIGH') return (parseFloat(b.target) || 0) - (parseFloat(a.target) || 0);
      if (campaignSort === 'GOAL_LOW') return (parseFloat(a.target) || 0) - (parseFloat(b.target) || 0);
      return b.id - a.id; // NEWEST
    });

  const totalPages = Math.ceil(filteredCampaigns.length / campaignsPerPage);
  const paginatedCampaigns = filteredCampaigns.slice(
    (currentPage - 1) * campaignsPerPage,
    currentPage * campaignsPerPage
  );

  // My Donations
  const [myDonations, setMyDonations] = useState(null);
  const [loadingMyDonations, setLoadingMyDonations] = useState(false);

  const fetchMyDonations = async () => {
    try {
      setLoadingMyDonations(true);
      const token = localStorage.getItem('bbdrts_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/donations/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map(d => ({
          campaignId: Number(d.campaignId),
          amount: parseFloat(d.amount).toFixed(4),
          txHash: d.txHash
        }));
        setMyDonations(formatted);
      } else {
        setMyDonations([]);
      }
    } catch (err) {
      console.error('Failed to fetch personal donations:', err);
      setMyDonations([]);
    } finally {
      setLoadingMyDonations(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my-donations' && myDonations === null) {
      fetchMyDonations();
    }
  }, [activeTab]);

  const totalDonated = myDonations
    ?.reduce((s, d) => s + parseFloat(d.amount), 0)
    .toFixed(4) ?? '0.0000';

  const filteredMyDonations = (myDonations || [])
    .filter(d => {
      if (receiptFilter !== 'ALL') {
        const matchCamp = campaigns.find(c => String(c.id) === String(d.campaignId));
        const isCharity = matchCamp ? /charity|school|orphan|food|feed|community/i.test(matchCamp.title) : false;
        if (receiptFilter === 'DR' && isCharity) return false;
        if (receiptFilter === 'CD' && !isCharity) return false;
      }
      if (searchQueryReceipts.trim()) {
        const q = searchQueryReceipts.toLowerCase().trim();
        const txHash = (d.txHash || '').toLowerCase();
        const matchCamp = campaigns.find(c => String(c.id) === String(d.campaignId));
        const campTitle = matchCamp ? formatCampaignTitle(matchCamp.title, matchCamp.id).toLowerCase() : '';
        return txHash.includes(q) || campTitle.includes(q) || String(d.campaignId).includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (receiptSort === 'AMOUNT_HIGH') return parseFloat(b.amount) - parseFloat(a.amount);
      return 0;
    });

  const userDisplayName = currentUser?.name && !currentUser.name.includes('@') 
    ? currentUser.name 
    : 'Gester Macaldo';
    
  const userInitials = userDisplayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <main className="dashboard container" style={{ paddingTop: '16px' }}>
      {/* ── Reference Dashboard Grid Architecture ── */}
      <div className="ref-dashboard-grid" style={{ marginTop: '0' }}>

        {/* ── Left Sidebar Navigation (Maasin Reference Style) ── */}
        <aside className="ref-sidebar">
          <div>
            <div className="ref-sidebar-user">
              <div className="ref-sidebar-avatar">{userInitials}</div>
              <div>
                <div className="ref-sidebar-name">{userDisplayName.split(' ')[0]}</div>
                <div className="ref-sidebar-id">BBDRTS-DONOR-2026-0001</div>
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
                className={`ref-nav-item ${activeTab === 'campaigns' ? 'active' : ''}`}
                onClick={() => setActiveTab('campaigns')}
              >
                <span className="material-symbols-outlined">campaign</span>
                <span>Relief Campaigns</span>
              </button>

              <button 
                className={`ref-nav-item ${activeTab === 'my-donations' ? 'active' : ''}`}
                onClick={() => setActiveTab('my-donations')}
              >
                <span className="material-symbols-outlined">favorite</span>
                <span>My Contributions</span>
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
                <span>Contract Health</span>
                <span className="ref-widget-value green">100% Immutable</span>
              </div>
              <div className="ref-widget-row">
                <span>Verification</span>
                <span className="ref-widget-value">Automated</span>
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
              <strong>Sepolia Testnet Protocol Active</strong> — Verified Smart Contract Transactions.{' '}
              <a href="https://sepoliafaucet.com/" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>
                Get Sepolia ETH →
              </a>
            </span>
          </div>

          {/* ── 1. DASHBOARD OVERVIEW TAB ONLY (Shows Welcome Banner + 4 Metric Cards) ── */}
          {activeTab === 'dashboard' && (
            <>
              {/* Top Welcome Hero Banner */}
              <div className="ref-welcome-card">
                <div className="ref-welcome-header">
                  <div className="ref-welcome-avatar">{userInitials}</div>
                  <div className="ref-welcome-text">
                    <h1>Welcome back, {userDisplayName.split(' ')[0]}!</h1>
                    <p>Donor ID: BBDRTS-DONOR-2026-0001 | Verified Sepolia EVM Protocol</p>
                  </div>
                </div>

                <div className="ref-action-btns">
                  <button className="ref-btn-pill-primary" onClick={() => setActiveTab('campaigns')}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                    <span>Contribute to Relief</span>
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
                  <div className="ref-metric-title">Total Donated</div>
                  <div className="ref-metric-value">{totalDonated} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>ETH</span></div>
                  <div className="ref-metric-sub">≈ ${(parseFloat(totalDonated) * 3000).toFixed(2)} USD / ₱{(parseFloat(totalDonated) * 170000).toLocaleString()} PHP</div>
                </div>

                <div className="ref-metric-card">
                  <div className="ref-metric-icon-circle">
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#22c55e' }}>volunteer_activism</span>
                  </div>
                  <div className="ref-metric-title">My Contributions</div>
                  <div className="ref-metric-value">{myDonations?.length ?? 0}</div>
                  <div className="ref-metric-sub">Verified On-Chain Receipts</div>
                </div>

                <div className="ref-metric-card">
                  <div className="ref-metric-icon-circle">
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#0284c7' }}>campaign</span>
                  </div>
                  <div className="ref-metric-title">Active Relief Causes</div>
                  <div className="ref-metric-value">{campaigns.length}</div>
                  <div className="ref-metric-sub">Open for Aid Assistance</div>
                </div>

                <div className="ref-metric-card">
                  <div className="ref-metric-icon-circle">
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#38bdf8' }}>verified</span>
                  </div>
                  <div className="ref-metric-title">Web3 Network</div>
                  <div className="ref-metric-value" style={{ fontSize: '1rem', color: '#22c55e' }}>Sepolia EVM</div>
                  <div className="ref-metric-sub">Chain ID 11155111 Active</div>
                </div>
              </div>

              {/* Featured Campaigns Preview Section */}
              <div style={{ marginTop: '28px' }}>
                <div className="section-header">
                  <h2 className="section-title">
                    <span className="material-symbols-outlined section-title-icon" style={{marginRight: '8px'}}>stars</span> Featured Relief Causes
                  </h2>
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('campaigns')}>
                    View All {campaigns.length} Campaigns →
                  </button>
                </div>

                {fetchingCampaigns && campaigns.length === 0 ? (
                  <div className="empty-state">
                    <div className="spinner spinner-light" style={{ width: 28, height: 28 }} />
                    <div className="empty-title">Reading from blockchain…</div>
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <div className="empty-title">No active campaigns on the ledger yet</div>
                  </div>
                ) : (
                  <div className="campaigns-list">
                    {campaigns.slice(0, 2).map((camp) => (
                      <CampaignCard
                        key={camp.id}
                        camp={camp}
                        contract={contract}
                        role={ROLES.DONOR}
                        walletAddress={walletAddress}
                        onDonated={fetchCampaigns}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── 2. DEDICATED RELIEF CAMPAIGNS TAB (Hides 4 boxes & welcome card) ── */}
          {activeTab === 'campaigns' && (
            <div style={{ marginTop: '8px' }}>
              <div className="section-header">
                <div>
                  <h2 className="section-title" style={{ fontSize: '1.4rem' }}>
                    <span className="material-symbols-outlined section-title-icon" style={{marginRight: '8px', color: '#0284c7'}}>campaign</span> Active Disaster Relief Campaigns
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>
                    Select a verified cause to contribute testnet ETH. All transactions are recorded on the Sepolia blockchain ledger.
                  </p>
                </div>

                <button
                  className="btn btn-ghost btn-sm"
                  onClick={fetchCampaigns}
                  disabled={fetchingCampaigns}
                >
                  {fetchingCampaigns
                    ? <div className="spinner spinner-light" />
                    : '↻ Refresh Campaigns'}
                </button>
              </div>

              {/* Category & Sorting Dropdown Toolbar */}
              <div style={{ 
                display: 'flex', 
                justify: 'space-between', 
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
                {/* Live Search Input Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px', minWidth: '220px' }}>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1.1rem', pointerEvents: 'none' }}>
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Search campaign, NGO, or cause..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
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
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
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
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
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
                    <option value="ALL">All Relief Causes ({campaigns.length})</option>
                    <option value="DR">🌊 Disaster Relief (DR-00X)</option>
                    <option value="CD">🤝 Charitable Aid (CD-00X)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Sort By:</span>
                  <select
                    value={campaignSort}
                    onChange={(e) => setCampaignSort(e.target.value)}
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
                    <option value="NEWEST">✨ Newest First</option>
                    <option value="GOAL_HIGH">💰 Highest Funding Goal</option>
                    <option value="GOAL_LOW">📉 Lowest Funding Goal</option>
                  </select>
                </div>
              </div>

              {fetchingCampaigns && campaigns.length === 0 ? (
                <div className="empty-state">
                  <div className="spinner spinner-light" style={{ width: 28, height: 28 }} />
                  <div className="empty-title">Reading campaigns from smart contract…</div>
                </div>
              ) : filteredCampaigns.length === 0 ? (
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
                    {paginatedCampaigns.map((camp) => (
                      <CampaignCard
                        key={camp.id}
                        camp={camp}
                        contract={contract}
                        role={ROLES.DONOR}
                        walletAddress={walletAddress}
                        onDonated={fetchCampaigns}
                      />
                    ))}
                  </div>

                  {/* Pagination Controls Bar (100% Width Centered) */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    alignSelf: 'stretch',
                    paddingTop: '20px',
                    paddingBottom: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    marginTop: '28px'
                  }}>
                    <button
                      className="btn btn-outline btn-sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      style={{ minWidth: '36px', height: '36px', padding: 0, borderRadius: '8px', opacity: currentPage === 1 ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Previous Page"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_left</span>
                    </button>

                    {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setCurrentPage(pageNum)}
                        style={{ 
                          minWidth: '36px', 
                          height: '36px',
                          borderRadius: '8px', 
                          fontWeight: currentPage === pageNum ? 700 : 500 
                        }}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      className="btn btn-outline btn-sm"
                      disabled={currentPage >= Math.max(1, totalPages)}
                      onClick={() => setCurrentPage(p => Math.min(Math.max(1, totalPages), p + 1))}
                      style={{ minWidth: '36px', height: '36px', padding: 0, borderRadius: '8px', opacity: currentPage >= Math.max(1, totalPages) ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Next Page"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_right</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── 3. MY CONTRIBUTIONS TAB ── */}
          {activeTab === 'my-donations' && (
            <div style={{ marginTop: '8px' }}>
              <div className="section-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '16px' }}>
                <div>
                  <h2 className="section-title" style={{ fontSize: '1.4rem' }}>
                    <span className="material-symbols-outlined section-title-icon" style={{marginRight: '8px', color: '#22c55e'}}>favorite</span> My Contribution History & Receipts
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>
                    Your personal on-chain donation history verified by the smart contract.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className="btn btn-outline btn-sm" 
                    onClick={() => window.print()}
                    style={{ borderRadius: '8px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>print</span>
                    <span>Export Audit Report</span>
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={fetchMyDonations} disabled={loadingMyDonations}>
                    {loadingMyDonations ? <div className="spinner spinner-light" /> : '↻ Refresh Receipts'}
                  </button>
                </div>
              </div>

              {myDonations !== null && myDonations.length > 0 && (
                <>
                  <div className="ref-metrics-grid" style={{ marginBottom: '16px' }}>
                    <div className="ref-metric-card" style={{ padding: '16px 20px' }}>
                      <div className="ref-metric-title">Total Donated (ETH)</div>
                      <div className="ref-metric-value" style={{ color: '#22c55e' }}>{totalDonated} <span style={{ fontSize: '0.9rem' }}>ETH</span></div>
                      <div className="ref-metric-sub">Personal ETH Contributed</div>
                    </div>
                    <div className="ref-metric-card" style={{ padding: '16px 20px' }}>
                      <div className="ref-metric-title">Fiat Equivalent</div>
                      <div className="ref-metric-value" style={{ color: '#38bdf8' }}>
                        ≈ ₱{(parseFloat(totalDonated) * 170000).toLocaleString('en-US', {maximumFractionDigits: 0})}
                      </div>
                      <div className="ref-metric-sub">≈ ${(parseFloat(totalDonated) * 3000).toFixed(2)} USD</div>
                    </div>
                    <div className="ref-metric-card" style={{ padding: '16px 20px' }}>
                      <div className="ref-metric-title">Digital Receipts</div>
                      <div className="ref-metric-value" style={{ color: '#0284c7' }}>{myDonations.length}</div>
                      <div className="ref-metric-sub">100% Sepolia EVM Verified</div>
                    </div>
                  </div>

                  {/* My Donations Filter & Sort Toolbar */}
                  <div style={{ 
                    display: 'flex', 
                    justify: 'space-between', 
                    alignItems: 'center', 
                    gap: '12px', 
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    background: 'rgba(15, 23, 42, 0.4)',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    {/* Live Receipts Search Input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 220px', minWidth: '200px' }}>
                      <div style={{ position: 'relative', width: '100%' }}>
                        <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1rem', pointerEvents: 'none' }}>
                          search
                        </span>
                        <input
                          type="text"
                          placeholder="Search tx hash or campaign..."
                          value={searchQueryReceipts}
                          onChange={(e) => setSearchQueryReceipts(e.target.value)}
                          style={{
                            width: '100%',
                            background: 'rgba(30, 41, 59, 0.9)',
                            color: '#fff',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '8px',
                            padding: '6px 28px 6px 32px',
                            fontSize: '0.82rem',
                            outline: 'none'
                          }}
                        />
                        {searchQueryReceipts && (
                          <button
                            onClick={() => setSearchQueryReceipts('')}
                            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.82rem', padding: 0 }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Filter Receipts:</span>
                      <select
                        value={receiptFilter}
                        onChange={(e) => setReceiptFilter(e.target.value)}
                        style={{
                          background: 'rgba(30, 41, 59, 0.9)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          padding: '5px 12px',
                          fontSize: '0.82rem',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="ALL">All Receipts ({myDonations.length})</option>
                        <option value="DR">🌊 Disaster Relief (DR)</option>
                        <option value="CD">🤝 Charitable Aid (CD)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Sort Receipts:</span>
                      <select
                        value={receiptSort}
                        onChange={(e) => setReceiptSort(e.target.value)}
                        style={{
                          background: 'rgba(30, 41, 59, 0.9)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          padding: '5px 12px',
                          fontSize: '0.82rem',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="NEWEST">✨ Newest First</option>
                        <option value="AMOUNT_HIGH">💎 Highest Amount</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {loadingMyDonations ? (
                <div className="empty-state">
                  <div className="spinner spinner-light" style={{ width: 28, height: 28 }} />
                  <div className="empty-title">Querying your donation events…</div>
                </div>
              ) : !myDonations || myDonations.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <div className="empty-title">No personal donations recorded yet</div>
                  <div className="empty-desc">
                    Go to the "Relief Campaigns" tab on the left sidebar to make your first contribution.
                  </div>
                </div>
              ) : filteredMyDonations.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <div className="empty-title">No receipts match this category</div>
                  <div className="empty-desc">
                    Try selecting a different category from the dropdown above.
                  </div>
                </div>
              ) : (
                <div className="my-donations-list" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {filteredMyDonations.map((d, idx) => {
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
                        {/* Top Main Row */}
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
                            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text)', fontWeight: 600 }}>
                              {campTitle}
                            </h3>
                          </div>

                          {/* Amount Box */}
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--success)' }}>
                              {d.amount} <span style={{ fontSize: '0.85rem' }}>ETH</span>
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: 500, marginTop: '2px' }}>
                              ≈ ₱{(parseFloat(d.amount) * 170000).toLocaleString('en-US', {maximumFractionDigits: 2})} PHP
                            </div>
                          </div>
                        </div>

                        {/* Bottom Blockchain Proof Row */}
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
                          <div style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>TX Hash:</span> {d.txHash.slice(0, 18)}…{d.txHash.slice(-8)}
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
                              style={{ padding: '3px 10px', fontSize: '0.75rem', borderColor: 'rgba(56,189,248,0.3)', color: '#38bdf8' }}
                            >
                              Verify on Etherscan ↗
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── 4. SETTINGS TAB (Hides 4 boxes & welcome card) ── */}
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
    </main>
  );
}
