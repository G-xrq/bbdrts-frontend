import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getReadOnlyContract } from '../web3Connection';
import CampaignCard from '../components/CampaignCard';
import { ROLES } from '../roleConfig';
import './LandingView.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function LandingView({ onConnect }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ donors: '0', orgs: '0', campaigns: '0' });

  useEffect(() => {
    fetch(`${API_URL}/api/public-stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Failed to fetch stats', err));

    const load = async () => {
      try {
        const contract = getReadOnlyContract();
        const count = Number(await contract.campaignCount());
        const fetched = [];
        for (let i = 1; i <= count; i++) {
          const c = await contract.campaigns(i);
          fetched.push({
            id: i,
            orgAddress: c[0],
            title: c[1],
            targetAmount: ethers.formatEther(c[2]),
            currentAmount: ethers.formatEther(c[3]),
            isActive: c[4],
          });
        }
        setCampaigns(fetched);
      } catch (err) {
        console.error('Public blockchain fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalRaised = campaigns
    .reduce((s, c) => s + parseFloat(c.currentAmount || 0), 0)
    .toFixed(4);

  return (
    <div className="capstone-landing">
      
      {/* ── 1. TOP NAVBAR ── */}
      <nav className="capstone-nav">
        <div className="capstone-brand">
          <img src="/logo.png" alt="BBDRTS Logo" className="capstone-logo" />
          <span className="capstone-title-text">BBDRTS</span>
        </div>

        <div className="capstone-nav-links">
          <a href="#features" className="capstone-nav-link">Architecture</a>
          <a href="#transparency" className="capstone-nav-link">Transparency</a>
          <a href="#campaigns" className="capstone-nav-link">Relief Causes</a>
        </div>

        <button className="capstone-btn-sm" onClick={onConnect}>
          <i className="material-symbols-outlined" style={{ fontSize: '18px' }}>account_balance_wallet</i>
          <span>Access Portal</span>
        </button>
      </nav>

      {/* ── 2. HERO SECTION ── */}
      <header className="capstone-hero">
        <div className="capstone-hero-container">
          <div className="capstone-badge">
            <i className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</i>
            <span>Ethereum Sepolia Web3 Protocol</span>
          </div>

          <h1>
            Blockchain-Based Donation &<br />
            <span className="capstone-hero-gradient">Relief Transparency System</span>
          </h1>

          <p>
            An immutable decentralized platform eliminating intermediary payment fees and black-box accounting. Empowering donors and verified NGOs with direct wallet-to-wallet relief distribution.
          </p>

          <div className="capstone-hero-btns">
            <button className="capstone-btn-lg" onClick={onConnect}>
              <i className="material-symbols-outlined">login</i>
              <span>Access Secure Portal</span>
            </button>
            <a href="#campaigns" className="capstone-btn-ghost">
              <i className="material-symbols-outlined">explore</i>
              <span>View Active Campaigns</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── 3. LIVE LEDGER STATS BAR ── */}
      <div className="capstone-stats-bar">
        <div className="capstone-stat-card">
          <div className="capstone-stat-val">{stats.donors}</div>
          <div className="capstone-stat-lbl">Active Donors</div>
        </div>
        <div className="capstone-stat-card">
          <div className="capstone-stat-val">{stats.orgs}</div>
          <div className="capstone-stat-lbl">Verified NGOs</div>
        </div>
        <div className="capstone-stat-card">
          <div className="capstone-stat-val">{stats.campaigns || campaigns.length}</div>
          <div className="capstone-stat-lbl">Active Causes</div>
        </div>
        <div className="capstone-stat-card">
          <div className="capstone-stat-val">{totalRaised} ETH</div>
          <div className="capstone-stat-lbl">Total Raised</div>
        </div>
      </div>

      {/* ── 4. FEATURE PILLARS SECTION ── */}
      <section id="features" className="capstone-section">
        <div className="capstone-sec-title">
          <h2>Core System Pillars</h2>
          <p>Built for complete public auditability and unalterable disaster relief accounting.</p>
        </div>

        <div className="capstone-pillars-grid">
          <div className="capstone-pillar-card">
            <div className="capstone-pillar-icon">
              <i className="material-symbols-outlined">account_balance_wallet</i>
            </div>
            <h3>Direct Wallet Transfers</h3>
            <p>
              Donations are routed directly from donor Web3 wallets into verified NGO smart contracts, eliminating 3rd party processing fees.
            </p>
          </div>

          <div className="capstone-pillar-card">
            <div className="capstone-pillar-icon">
              <i className="material-symbols-outlined">history_edu</i>
            </div>
            <h3>Automated Solidity Escrow</h3>
            <p>
              Target funding thresholds, campaign progress, and disbursement states are immutably executed on the Sepolia Ethereum testnet.
            </p>
          </div>

          <div className="capstone-pillar-card">
            <div className="capstone-pillar-icon">
              <i className="material-symbols-outlined">admin_panel_settings</i>
            </div>
            <h3>Admin Verified Credentials</h3>
            <p>
              Platform administrators rigorously vet legal accreditation (SEC/DSWD) before allowing an organization to publish a relief campaign.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. LIVE RELIEF CAMPAIGNS BROWSER ── */}
      <section id="campaigns" className="capstone-campaigns-wrapper">
        <div className="capstone-sec-title">
          <h2>Active Relief Causes</h2>
          <p>Verified humanitarian causes active on the Sepolia ledger</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: '0.9rem' }}>
            <span>Reading Sepolia blockchain state...</span>
          </div>
        ) : campaigns.length === 0 ? (
          <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '40px', textAlign: 'center', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.95rem' }}>No active campaigns deployed on ledger yet.</p>
            <button className="capstone-btn-sm" onClick={onConnect} style={{ margin: '0 auto' }}>
              <span>Log In to Create First Campaign</span>
            </button>
          </div>
        ) : (
          <div className="campaigns-list" style={{ maxWidth: '950px', margin: '0 auto' }}>
            {campaigns.map((camp) => (
              <CampaignCard
                key={camp.id}
                camp={camp}
                contract={null}
                role={ROLES.PUBLIC}
                walletAddress={null}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── 6. FOOTER ── */}
      <footer className="capstone-footer">
        <p>© 2026 BBDRTS — Blockchain-Based Donation & Relief Transparency System. Capstone Project Protocol.</p>
      </footer>

    </div>
  );
}
