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
    <div className="capstone-landing-root">
      
      {/* Background Ambient Glow Effects */}
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>

      <div className="landing-container">
        
        {/* ── 1. Top Navbar ── */}
        <header className="landing-nav">
          <div className="nav-brand">
            <img src="/logo.png" alt="BBDRTS Logo" className="nav-logo" />
            <div className="nav-title">BBDRTS</div>
            <span className="nav-badge">Sepolia Testnet</span>
          </div>

          <button className="nav-btn" onClick={onConnect}>
            <i className="material-symbols-outlined" style={{ fontSize: '18px' }}>login</i>
            <span>Access Portal</span>
          </button>
        </header>

        {/* ── 2. Hero Banner ── */}
        <section className="hero-section">
          <div className="hero-pill">
            <span className="hero-pill-dot"></span>
            <span>Blockchain-Based Donation & Relief Transparency System</span>
          </div>

          <h1 className="hero-heading">
            Zero Middlemen.<br />
            <span className="hero-heading-gradient">100% Immutable Relief.</span>
          </h1>

          <p className="hero-subtext">
            Empowering disaster relief through Ethereum smart contracts. BBDRTS connects donors directly to vetted Non-Governmental Organizations with complete public ledger accountability.
          </p>

          <div className="hero-actions">
            <button className="btn-primary-hero" onClick={onConnect}>
              <i className="material-symbols-outlined">account_balance_wallet</i>
              <span>Connect Wallet & Enter Portal</span>
            </button>
            <a href="#campaigns" className="btn-secondary-hero">
              <i className="material-symbols-outlined">explore</i>
              <span>Explore Relief Causes</span>
            </a>
          </div>
        </section>

        {/* ── 3. Real-Time Blockchain Stats Row ── */}
        <div className="stats-row">
          <div className="stat-card-capstone">
            <div className="stat-val">{stats.donors}</div>
            <div className="stat-lbl">Active Donors</div>
          </div>
          <div className="stat-card-capstone">
            <div className="stat-val">{stats.orgs}</div>
            <div className="stat-lbl">Verified NGOs</div>
          </div>
          <div className="stat-card-capstone">
            <div className="stat-val">{stats.campaigns || campaigns.length}</div>
            <div className="stat-lbl">Relief Campaigns</div>
          </div>
          <div className="stat-card-capstone">
            <div className="stat-val">{totalRaised} ETH</div>
            <div className="stat-lbl">Total ETH Raised</div>
          </div>
        </div>

        {/* ── 4. Core Transparency Pillars ── */}
        <section className="pillars-section">
          <div className="section-title">
            <h2>Why Web3 Transparency?</h2>
            <p>Solving traditional charity opacity with decentralized Ethereum smart contracts.</p>
          </div>

          <div className="pillars-grid">
            <div className="pillar-card">
              <div className="pillar-icon">
                <i className="material-symbols-outlined">account_balance_wallet</i>
              </div>
              <h3>Direct Wallet Disbursal</h3>
              <p>Donations flow straight from donor Metamask wallets into verified NGO campaign accounts without third-party fees or deductions.</p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon">
                <i className="material-symbols-outlined">gavel</i>
              </div>
              <h3>Smart Contract Execution</h3>
              <p>Campaign targets, collected funds, and transaction receipts are permanently stored on an unalterable Solidity smart contract.</p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon">
                <i className="material-symbols-outlined">admin_panel_settings</i>
              </div>
              <h3>Administrative Vetting</h3>
              <p>Strict administrative governance verifies legal NGO documentation (SEC/DSWD) before granting campaign creation privileges.</p>
            </div>
          </div>
        </section>

        {/* ── 5. System Workflow Steps ── */}
        <section className="workflow-section">
          <div className="section-title" style={{ marginBottom: '36px' }}>
            <h2>How BBDRTS Works</h2>
            <p>3-step automated protocol for disaster relief allocation.</p>
          </div>

          <div className="workflow-grid">
            <div className="workflow-step">
              <div className="step-num">1</div>
              <h4>NGO Credential Vetting</h4>
              <p>Organizations submit legal registration details for administrator verification and approval.</p>
            </div>

            <div className="workflow-step">
              <div className="step-num">2</div>
              <h4>Relief Campaign Onboarding</h4>
              <p>Approved NGOs launch disaster relief targets directly on the Ethereum Sepolia smart contract.</p>
            </div>

            <div className="workflow-step">
              <div className="step-num">3</div>
              <h4>Direct On-Chain Donation</h4>
              <p>Donors contribute ETH directly via Web3 wallet, receiving an instant public Etherscan receipt.</p>
            </div>
          </div>
        </section>

        {/* ── 6. Live Relief Campaigns Showcase ── */}
        <section id="campaigns" className="campaigns-section-capstone">
          <div className="section-title">
            <h2>Active Relief Causes</h2>
            <p>Real-time relief initiatives verified on the Sepolia blockchain ledger.</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: '0.95rem' }}>
              <span>Synchronizing with Sepolia Block State...</span>
            </div>
          ) : campaigns.length === 0 ? (
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '40px', textAlign: 'center', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.95rem' }}>No active campaigns deployed on ledger yet.</p>
              <button className="nav-btn" onClick={onConnect} style={{ margin: '0 auto' }}>
                <span>Log In to Deploy First Campaign</span>
              </button>
            </div>
          ) : (
            <div className="campaigns-list" style={{ maxWidth: '900px', margin: '0 auto' }}>
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

        {/* ── 7. Capstone Project Footer ── */}
        <footer className="capstone-footer">
          <p>© 2026 BBDRTS — Blockchain-Based Donation & Relief Transparency System. All rights reserved.</p>
        </footer>

      </div>
    </div>
  );
}

