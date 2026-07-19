import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CampaignCard from '../components/CampaignCard';
import { ROLES } from '../roleConfig';

import SettingsPanel from '../components/SettingsPanel';

export default function DonorView({ contract, walletAddress, campaigns, fetchCampaigns, fetchingCampaigns, currentUser, handleConnectWallet, handleLogout, updateDbWallet }) {
  const [activeTab, setActiveTab] = useState('campaigns');

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
    .toFixed(4) ?? '—';

  const SEPOLIA_EXPLORER = 'https://sepolia.etherscan.io/tx/';

  return (
    <main className="dashboard">
      <div className="container">

        {/* Testnet Banner */}
        <div className="testnet-banner">
          <span>🔬</span>
          <span>
            <strong>Sepolia Testnet</strong> — All transactions use test ETH
            with no real monetary value.{' '}
            <a href="https://sepoliafaucet.com/" target="_blank" rel="noreferrer"
              style={{ color: 'var(--info)', textDecoration: 'underline' }}>
              Get Sepolia ETH →
            </a>
          </span>
        </div>

        {/* Tab Bar */}
        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === 'campaigns' ? 'active' : ''}`}
            onClick={() => setActiveTab('campaigns')}
          >
            <span className="material-symbols-outlined icon-sm" style={{marginRight: '6px'}}>list_alt</span> All Campaigns
          </button>
          <button
            className={`tab-btn ${activeTab === 'my-donations' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-donations')}
          >
            <span className="material-symbols-outlined icon-sm" style={{marginRight: '6px'}}>favorite</span> My Donations
          </button>
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="material-symbols-outlined icon-sm" style={{marginRight: '6px'}}>settings</span> Profile & Settings
          </button>
        </div>

        {/* ── All Campaigns Tab ── */}
        {activeTab === 'campaigns' && (
          <div>
            <div className="section-header">
              <h2 className="section-title">
                <span className="material-symbols-outlined section-title-icon" style={{marginRight: '8px'}}>list_alt</span> Relief Campaigns
              </h2>
              {campaigns.length > 0 && (
                <span className="section-count">{campaigns.length} on ledger</span>
              )}
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

            {fetchingCampaigns && campaigns.length === 0 ? (
              <div className="empty-state">
                <div className="spinner spinner-light" style={{ width: 28, height: 28 }} />
                <div className="empty-title">Reading from blockchain…</div>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <div className="empty-title">No campaigns on the ledger yet</div>
                <div className="empty-desc">
                  A registered organization will deploy the first campaign soon.
                </div>
              </div>
            ) : (
              <div className="campaigns-list">
                {campaigns.map((camp) => (
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
        )}

        {/* ── My Donations Tab ── */}
        {activeTab === 'my-donations' && (
          <div>
            <div className="section-header">
              <h2 className="section-title">
                <span className="material-symbols-outlined section-title-icon" style={{marginRight: '8px'}}>favorite</span> My Donation History
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={fetchMyDonations} disabled={loadingMyDonations}>
                {loadingMyDonations ? <div className="spinner spinner-light" /> : '↻ Refresh'}
              </button>
            </div>

            {myDonations !== null && myDonations.length > 0 && (
              <div className="donor-summary-row">
                <div className="stat-card">
                  <div className="stat-card-value">{myDonations.length}</div>
                  <div className="stat-card-label">Donations Made</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-value accent">{totalDonated} <span style={{ fontSize: '0.9rem' }}>ETH</span></div>
                  <div className="stat-card-label">Total Contributed</div>
                </div>
              </div>
            )}

            {loadingMyDonations ? (
              <div className="empty-state">
                <div className="spinner spinner-light" style={{ width: 28, height: 28 }} />
                <div className="empty-title">Querying your donation events…</div>
              </div>
            ) : !myDonations || myDonations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <div className="empty-title">No donations yet</div>
                <div className="empty-desc">
                  Go to the "All Campaigns" tab to make your first donation.
                  Your transaction receipts will appear here.
                </div>
              </div>
            ) : (
              <div className="my-donations-list">
                {myDonations.map((d, idx) => (
                  <div key={idx} className="my-donation-item">
                    <div className="my-donation-field">
                      <span className="my-donation-label">Campaign</span>
                      <span className="my-donation-value">#{d.campaignId}</span>
                    </div>
                    <div className="my-donation-field">
                      <span className="my-donation-label">Amount</span>
                      <span className="my-donation-value accent">{d.amount} ETH</span>
                    </div>
                    <div className="my-donation-field full">
                      <span className="my-donation-label">🔗 Digital Receipt (TX Hash)</span>
                      <a
                        href={`${SEPOLIA_EXPLORER}${d.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ledger-tx-link"
                      >
                        {d.txHash} ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Settings Tab ── */}
        {activeTab === 'settings' && (
          <SettingsPanel 
            contract={contract}
            currentUser={currentUser} 
            walletAddress={walletAddress} 
            handleConnectWallet={handleConnectWallet} 
            handleLogout={handleLogout} 
            updateDbWallet={updateDbWallet}
          />
        )}

      </div>
    </main>
  );
}
