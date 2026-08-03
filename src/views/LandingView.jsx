import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getReadOnlyContract } from '../web3Connection';
import CampaignCard from '../components/CampaignCard';
import { ROLES } from '../roleConfig';
import './AuthView.css';

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
    <div className="login-split-container" style={{ padding: '2rem 1rem 4rem' }}>
      <div className="login-form-side fade-in" style={{ flexDirection: 'column', width: '100%', maxWidth: '960px', margin: '0 auto' }}>
        
        {/* ── 1. Glassmorphism Hero Portal Card ── */}
        <div className="login-glass-card" style={{ maxWidth: '960px', width: '100%', marginBottom: '2.5rem' }}>
          
          {/* Left Brand Side with Animated Floating Shapes & Stats */}
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

          {/* Right Hero Content */}
          <div className="login-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="login-header-modern" style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.7rem' }}>On-Chain Relief Transparency</h2>
              <p>Ethereum Sepolia Smart Contract Protocol</p>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              BBDRTS eliminates payment gateway subtractions by transferring disaster relief contributions directly from donor crypto wallets into verified NGO accounts with 100% public ledger verifiability.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#e2e8f0', background: 'rgba(255, 255, 255, 0.04)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <i className="material-symbols-outlined" style={{ fontSize: '18px', color: '#4ade80' }}>check_circle</i>
                <span>Direct Wallet Transfers</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#e2e8f0', background: 'rgba(255, 255, 255, 0.04)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <i className="material-symbols-outlined" style={{ fontSize: '18px', color: '#38bdf8' }}>verified_user</i>
                <span>Admin Vetted NGOs</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#e2e8f0', background: 'rgba(255, 255, 255, 0.04)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <i className="material-symbols-outlined" style={{ fontSize: '18px', color: '#f59e0b' }}>lock</i>
                <span>Smart Contract Audit</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#e2e8f0', background: 'rgba(255, 255, 255, 0.04)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <i className="material-symbols-outlined" style={{ fontSize: '18px', color: '#a855f7' }}>public</i>
                <span>Etherscan Proofs</span>
              </div>
            </div>

            <button type="button" className="btn-modern-primary" onClick={onConnect} style={{ width: '100%', marginBottom: '0.75rem' }}>
              <span>Enter Portal & Log In</span>
              <i className="material-symbols-outlined">arrow_forward</i>
            </button>

            <div className="login-footer-modern">
              <a href="#campaigns-section" className="admin-link-modern" style={{ width: '100%', justifyContent: 'center' }}>
                <i className="material-symbols-outlined">explore</i>
                <span>Explore Active Relief Campaigns ({campaigns.length})</span>
              </a>
            </div>
          </div>

        </div>

        {/* ── 2. Live Platform Metrics Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', width: '100%', maxWidth: '960px', marginBottom: '3rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '20px', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{stats.donors}</div>
            <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>Active Donors</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '20px', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{stats.orgs}</div>
            <div style={{ fontSize: '0.8rem', color: '#4ade80', fontWeight: 600 }}>Verified NGOs</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '20px', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{stats.campaigns || campaigns.length}</div>
            <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>Active Campaigns</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '20px', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{totalRaised} ETH</div>
            <div style={{ fontSize: '0.8rem', color: '#a855f7', fontWeight: 600 }}>Total Raised</div>
          </div>
        </div>

        {/* ── 3. Live Relief Campaigns Grid ── */}
        <div id="campaigns-section" style={{ width: '100%', maxWidth: '960px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', color: '#fff' }}>
            <h3 style={{ fontSize: '1.3rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <i className="material-symbols-outlined" style={{ color: '#38bdf8' }}>campaign</i>
              <span>Active Relief Causes</span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#888' }}>Sepolia Blockchain</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: '0.9rem' }}>
              <span>Reading Sepolia block state...</span>
            </div>
          ) : campaigns.length === 0 ? (
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '36px', textAlign: 'center', color: '#aaa' }}>
              <p style={{ margin: '0 0 14px 0', fontSize: '0.9rem' }}>No active campaigns deployed on ledger yet.</p>
              <button className="btn-modern-primary" onClick={onConnect} style={{ width: 'auto', margin: '0 auto', fontSize: '0.85rem', padding: '8px 20px' }}>
                <span>Log In to Create Campaign</span>
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


