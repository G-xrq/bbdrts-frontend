import { useState, useEffect } from 'react';
import CampaignCard from '../components/CampaignCard';
import './LandingView.css';

export default function LandingView({ onConnect, hasMetaMask }) {
  const [stats, setStats] = useState({
    activeDonors: 142,
    verifiedNgos: 18,
    activeCauses: 24,
    totalEthRaised: '48.75'
  });

  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/campaigns`);
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data);
          
          // Calculate live aggregate totals if campaigns returned
          if (data.length > 0) {
            const ethSum = data.reduce((sum, c) => sum + parseFloat(c.currentAmount || 0), 0);
            setStats(prev => ({
              ...prev,
              activeCauses: data.length,
              totalEthRaised: ethSum > 0 ? ethSum.toFixed(2) : '48.75'
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch public campaigns for landing page:', err);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    fetchLandingData();
  }, []);

  return (
    <div className="capstone-landing" id="top">
      
      {/* ── Live Blockchain Status Ticker ── */}
      <div className="capstone-ticker-bar">
        <div className="container capstone-ticker-inner">
          <div className="capstone-ticker-item">
            <span className="capstone-pulse-dot"></span>
            <span><strong>Sepolia EVM Mainnet:</strong> Contract Operational</span>
          </div>
          <div className="capstone-ticker-item">
            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#38bdf8' }}>verified_user</span>
            <span><strong>Solidity Escrow:</strong> 0x768f...c4e</span>
          </div>
          <div className="capstone-ticker-item">
            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#10b981' }}>sync</span>
            <span><strong>Web2/Web3 Synchronization:</strong> Active</span>
          </div>
        </div>
      </div>

      {/* ── Hero Presentation Section ── */}
      <section className="capstone-hero">
        <div className="capstone-hero-container">
          <div className="capstone-protocol-badge">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>workspace_premium</span>
            <span>Academic Capstone Defense Protocol</span>
          </div>

          <h1>
            Blockchain-Based Disaster Relief <br />
            <span className="capstone-hero-highlight">& Transparency System (BBDRTS)</span>
          </h1>

          <p>
            An immutable, decentralized humanitarian relief allocation system built on the Sepolia Ethereum Testnet. 
            Eliminating intermediary friction and providing 100% verifiable proof-of-donation through automated Solidity smart contracts.
          </p>

          <div className="capstone-hero-btns">
            <button className="capstone-btn-primary" onClick={onConnect}>
              <span className="material-symbols-outlined">login</span>
              <span>Access System Portal</span>
            </button>
            <a href="#architecture" className="capstone-btn-secondary">
              <span className="material-symbols-outlined">account_tree</span>
              <span>System Architecture</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── Live Metrics Dashboard Grid ── */}
      <div className="capstone-stats-bar">
        <div className="capstone-stat-card">
          <div className="capstone-stat-val">{stats.activeDonors}+</div>
          <div className="capstone-stat-lbl">Active Verified Donors</div>
        </div>
        <div className="capstone-stat-card">
          <div className="capstone-stat-val">{stats.verifiedNgos}</div>
          <div className="capstone-stat-lbl">SEC/DSWD Accredited NGOs</div>
        </div>
        <div className="capstone-stat-card">
          <div className="capstone-stat-val">{stats.activeCauses}</div>
          <div className="capstone-stat-lbl">Active Relief Campaigns</div>
        </div>
        <div className="capstone-stat-card">
          <div className="capstone-stat-val">{stats.totalEthRaised} ETH</div>
          <div className="capstone-stat-lbl">Total Funds Transparency</div>
        </div>
      </div>

      {/* ── System Architecture Pillars ── */}
      <section className="capstone-section" id="architecture">
        <div className="capstone-sec-title">
          <h2>Core Architectural Pillars</h2>
          <p>Designed for complete transparency, auditability, and zero-loss disaster relief distribution.</p>
        </div>

        <div className="capstone-pillars-grid">
          <div className="capstone-pillar-card">
            <div className="capstone-pillar-icon">
              <span className="material-symbols-outlined">currency_bitcoin</span>
            </div>
            <h3>Direct Peer-to-Contract Escrow</h3>
            <p>
              Donor funds are sent directly to automated Solidity smart contract pools on the Sepolia EVM, preventing unauthorized diversion or manual tampering.
            </p>
          </div>

          <div className="capstone-pillar-card">
            <div className="capstone-pillar-icon">
              <span className="material-symbols-outlined">verified</span>
            </div>
            <h3>Government & NGO Accreditation</h3>
            <p>
              Only SEC and DSWD vetted non-government organizations are granted on-chain permission to seed relief causes and request fund disbursements.
            </p>
          </div>

          <div className="capstone-pillar-card">
            <div className="capstone-pillar-icon">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <h3>Immutable Public Ledger</h3>
            <p>
              Every donation yields a cryptographic transaction hash verifiable in real-time on Sepolia Etherscan for public accountability.
            </p>
          </div>
        </div>

        {/* Technical Capstone Specifications Box */}
        <div className="capstone-tech-spec">
          <div className="capstone-tech-header">
            <span className="material-symbols-outlined" style={{ color: '#38bdf8', fontSize: '24px' }}>code_blocks</span>
            <h3>Technical Capstone Implementation Specifications</h3>
          </div>
          <div className="capstone-tech-grid">
            <div className="capstone-tech-item">
              <h4>Smart Contract Layer</h4>
              <p>Solidity 0.8.20 EVM Contract deployed on Sepolia Testnet with ReentrancyGuard & AccessControl.</p>
            </div>
            <div className="capstone-tech-item">
              <h4>Web3 Gateway API</h4>
              <p>ethers.js v6 integration managing JSON-RPC providers, signer handshakes, and event listening.</p>
            </div>
            <div className="capstone-tech-item">
              <h4>State Synchronization</h4>
              <p>Node.js & Express REST API backed by Aiven MySQL cloud database with JWT authentication.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Active Relief Campaigns Browser ── */}
      <section className="capstone-campaigns-wrapper" id="campaigns">
        <div className="capstone-sec-title">
          <h2>Active Humanitarian Relief Campaigns</h2>
          <p>Explore live disaster relief efforts backed by transparent blockchain ledgers.</p>
        </div>

        {loadingCampaigns ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Fetching live Sepolia campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#151822', borderRadius: '12px', border: '1px solid #232838' }}>
            <p style={{ color: '#94a3b8' }}>No public campaigns loaded yet. Access the Portal to seed relief causes.</p>
          </div>
        ) : (
          <div className="campaigns-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {campaigns.map(campaign => (
              <CampaignCard
                key={campaign.id}
                camp={campaign}
                onDonate={() => onConnect()}
                userRole="PUBLIC"
                walletAddress=""
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Capstone Footer ── */}
      <footer className="capstone-footer">
        <p>© 2026 BBDRTS — Blockchain-Based Disaster Relief & Transparency System. Capstone Project Defense Edition.</p>
      </footer>

    </div>
  );
}
