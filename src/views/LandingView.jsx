import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getReadOnlyContract } from '../web3Connection';
import CampaignCard from '../components/CampaignCard';
import { ROLES } from '../roleConfig';
import './AuthView.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function LandingView({ onConnect, hasMetaMask }) {
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
    <div className="login-split-container">
      <div className="login-form-side fade-in" style={{ flexDirection: 'column', padding: '2rem 1rem' }}>
        
        {/* ── Exact Glass Card Frame from AuthView ── */}
        <div className="login-glass-card" style={{ maxWidth: '850px', marginBottom: '3rem' }}>
          
          {/* Left Brand Side */}
          <div className="login-brand-side">
            <div className="login-header">
              <div className="brand-logo">
                <img src="/logo.png" alt="BBDRTS Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', animation: 'logoFloat 3s ease-in-out infinite' }} />
              </div>
              <div className="login-subtitle">
                <h1 className="brand-title">BBDRTS</h1>
                <p className="brand-tagline">Blockchain-Based Donation<br />& Relief Transparency System</p>
              </div>
            </div>

            <div className="brand-content">
              <div className="login-stats">
                <div className="stat-bubble">
                  <div className="stat-value">{stats.donors}</div>
                  <div className="stat-labels">Active Donors</div>
                </div>
                <div className="stat-bubble">
                  <div className="stat-value">{stats.orgs}</div>
                  <div className="stat-labels">Verified NGOs</div>
                </div>
                <div className="stat-bubble">
                  <div className="stat-value">{stats.campaigns || campaigns.length}</div>
                  <div className="stat-labels">Campaigns</div>
                </div>
              </div>
            </div>

            <div className="floating-shapes">
              <div className="shape shape-1"></div>
              <div className="shape shape-2"></div>
              <div className="shape shape-3"></div>
              <div className="shape shape-4"></div>
            </div>
          </div>

          {/* Right Content Group */}
          <div className="login-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="login-header-modern" style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
              <h2>Public Transparency</h2>
              <p>Verified On-Chain Sepolia Ledger</p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '12px 14px', marginBottom: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</i>
                <span>Direct Wallet-to-Wallet Relief</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#aaa', margin: 0, lineHeight: 1.5 }}>
                Every peso and ETH donated goes directly to verified Non-Governmental Organizations (NGOs) with zero middleman fees.
              </p>
            </div>

            {/* Quick Feature Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#ccc' }}>
                <i className="material-symbols-outlined" style={{ fontSize: '16px', color: '#4ade80' }}>check_circle</i>
                <span>No Third-Party Fees</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#ccc' }}>
                <i className="material-symbols-outlined" style={{ fontSize: '16px', color: '#38bdf8' }}>lock</i>
                <span>Tamper-Proof Ledger</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#ccc' }}>
                <i className="material-symbols-outlined" style={{ fontSize: '16px', color: '#f59e0b' }}>bolt</i>
                <span>Smart Contracts</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#ccc' }}>
                <i className="material-symbols-outlined" style={{ fontSize: '16px', color: '#a855f7' }}>public</i>
                <span>Etherscan Audits</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <button type="button" className="btn-modern-primary" onClick={onConnect} style={{ marginBottom: '1rem' }}>
              <span>Access Portal & Log In</span>
              <i className="material-symbols-outlined">arrow_forward</i>
            </button>

            <div className="login-footer-modern">
              <a href="#campaign-section" className="admin-link-modern" style={{ width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}>
                <i className="material-symbols-outlined">explore</i>
                <span>Browse Live Campaigns ({campaigns.length})</span>
              </a>
            </div>
          </div>

        </div>

        {/* ── Live Relief Campaigns Grid ── */}
        <div id="campaign-section" style={{ width: '100%', maxWidth: '850px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', color: '#fff' }}>
            <h3 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="material-symbols-outlined" style={{ color: '#38bdf8' }}>campaign</i>
              <span>Active Relief Campaigns</span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#888' }}>Sepolia Blockchain</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: '0.9rem' }}>
              <span>Reading block state...</span>
            </div>
          ) : campaigns.length === 0 ? (
            <div style={{ background: 'rgba(42, 42, 42, 0.5)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '30px', textAlign: 'center', color: '#aaa' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem' }}>No active campaigns deployed on ledger yet.</p>
              <button className="btn-modern-primary" onClick={onConnect} style={{ width: 'auto', margin: '0 auto', fontSize: '0.8rem', padding: '6px 16px' }}>
                <span>Log In to Create First Campaign</span>
              </button>
            </div>
          ) : (
            <div className="campaigns-list">
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
        </div>

      </div>
    </div>
  );
}


