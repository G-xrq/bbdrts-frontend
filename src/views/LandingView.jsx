import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getReadOnlyContract } from '../web3Connection';
import CampaignCard from '../components/CampaignCard';
import { ROLES } from '../roleConfig';
import './AuthView.css'; // Inherit floating shapes, glass cards, & design system

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function LandingView({ onConnect, hasMetaMask }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ donors: '0', orgs: '0', campaigns: '0' });

  useEffect(() => {
    // Fetch DB Public Stats
    fetch(`${API_URL}/api/public-stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Failed to fetch public stats:', err));

    // Fetch Real-time Blockchain Campaigns
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
    <div style={{ background: '#0a0e1a', color: '#fff', minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>
      
      {/* ─── Hero Section ─── */}
      <section style={{
        position: 'relative',
        padding: '100px 20px 80px',
        background: 'radial-gradient(circle at 50% 20%, rgba(56, 189, 248, 0.12) 0%, rgba(10, 14, 26, 0.95) 70%)',
        textAlign: 'center'
      }}>
        {/* Floating Animated Shapes from AuthView */}
        <div className="floating-shapes">
          <div className="shape shape-1" style={{ opacity: 0.15 }}></div>
          <div className="shape shape-2" style={{ opacity: 0.15 }}></div>
          <div className="shape shape-3" style={{ opacity: 0.15 }}></div>
          <div className="shape shape-4" style={{ opacity: 0.15 }}></div>
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 2, maxWidth: '1100px', margin: '0 auto' }}>
          
          {/* Eyebrow Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '30px',
            padding: '6px 18px',
            fontSize: '0.85rem',
            color: '#38bdf8',
            marginBottom: '28px',
            backdropFilter: 'blur(10px)'
          }}>
            <i className="material-symbols-outlined" style={{ fontSize: '18px', color: '#38bdf8' }}>verified_user</i>
            <span>Ethereum Blockchain Powered · Sepolia Testnet</span>
          </div>

          {/* Hero Title & Subtitle */}
          <h1 style={{
            fontSize: '3.2rem',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-1px',
            marginBottom: '20px',
            background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Transparent Relief,<br />
            <span style={{
              background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Verified On-Chain</span>
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: '#94a3b8',
            maxWidth: '750px',
            margin: '0 auto 40px',
            lineHeight: 1.7,
            fontWeight: 400
          }}>
            The <strong>Blockchain-Based Donation & Relief Transparency System (BBDRTS)</strong> connects donors directly to verified NGOs. Every single peso and ETH contributed is recorded immutably on the Ethereum ledger for 100% public accountability.
          </p>

          {/* Action CTA Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '60px' }}>
            <button 
              className="btn-modern-primary" 
              onClick={onConnect}
              style={{
                width: 'auto',
                padding: '14px 32px',
                fontSize: '1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
                color: '#fff',
                boxShadow: '0 8px 25px rgba(56, 189, 248, 0.35)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <i className="material-symbols-outlined">login</i>
              <span>Access Portal & Log In</span>
            </button>

            <a 
              href="#campaigns" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                fontSize: '1rem',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                textDecoration: 'none',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
            >
              <i className="material-symbols-outlined">explore</i>
              <span>Explore Campaigns</span>
            </a>
          </div>

          {/* Live Public Stats Bar (Glassmorphism Cards) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <div className="stat-bubble" style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="stat-value" style={{ fontSize: '2rem', color: '#38bdf8' }}>{stats.donors}</div>
              <div className="stat-labels" style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Active Donors</div>
            </div>

            <div className="stat-bubble" style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="stat-value" style={{ fontSize: '2rem', color: '#4ade80' }}>{stats.orgs}</div>
              <div className="stat-labels" style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Verified NGOs</div>
            </div>

            <div className="stat-bubble" style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="stat-value" style={{ fontSize: '2rem', color: '#f59e0b' }}>{stats.campaigns || campaigns.length}</div>
              <div className="stat-labels" style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Active Campaigns</div>
            </div>

            <div className="stat-bubble" style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="stat-value" style={{ fontSize: '2rem', color: '#a855f7' }}>{totalRaised} ETH</div>
              <div className="stat-labels" style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Raised On-Chain</div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── How It Works Flow Grid ─── */}
      <section style={{ padding: '80px 20px', background: '#0d1322' }}>
        <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          
          <h2 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '12px' }}>
            How Blockchain Relief Works
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: '50px', fontSize: '1rem' }}>
            Four transparent steps from donation to verified community delivery.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '30px 20px',
              backdropFilter: 'blur(10px)',
              textAlign: 'center'
            }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <i className="material-symbols-outlined" style={{ fontSize: '28px' }}>domain</i>
              </div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>1. NGO Verification</h4>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
                Admin verifies legitimate NGOs before campaign creation is authorized.
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '30px 20px',
              backdropFilter: 'blur(10px)',
              textAlign: 'center'
            }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <i className="material-symbols-outlined" style={{ fontSize: '28px' }}>account_balance_wallet</i>
              </div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>2. Direct Wallet Donation</h4>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
                Donors transfer funds directly via MetaMask wallet with zero intermediary fees.
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '30px 20px',
              backdropFilter: 'blur(10px)',
              textAlign: 'center'
            }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <i className="material-symbols-outlined" style={{ fontSize: '28px' }}>lock</i>
              </div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>3. Immutable Ledger</h4>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
                Smart contract records every transaction permanently on the Sepolia blockchain.
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '30px 20px',
              backdropFilter: 'blur(10px)',
              textAlign: 'center'
            }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <i className="material-symbols-outlined" style={{ fontSize: '28px' }}>travel_explore</i>
              </div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>4. Public Auditability</h4>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
                Anyone can verify campaign funds and transactions directly on Etherscan.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ─── Live Campaign Browser ─── */}
      <section id="campaigns" style={{ padding: '80px 20px', background: '#0a0e1a' }}>
        <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="material-symbols-outlined" style={{ color: '#38bdf8' }}>campaign</i>
                <span>Active Relief Campaigns</span>
              </h2>
              <p style={{ color: '#94a3b8', margin: '6px 0 0 0', fontSize: '0.9rem' }}>
                Browse live campaigns deployed on the Ethereum Sepolia Testnet.
              </p>
            </div>
            
            <button className="btn-modern-primary" onClick={onConnect} style={{ width: 'auto', padding: '10px 20px', fontSize: '0.85rem' }}>
              <i className="material-symbols-outlined">add_circle</i>
              <span>Create or Donate</span>
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <div className="spinner-before" style={{ fontSize: '1.5rem', marginBottom: '12px' }}></div>
              <p>Fetching real-time campaign block state from Sepolia...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '60px 20px',
              textAlign: 'center'
            }}>
              <i className="material-symbols-outlined" style={{ fontSize: '48px', color: '#64748b', marginBottom: '12px' }}>inbox</i>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No Active Campaigns Found</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 20px' }}>
                Log in as a verified Non-Governmental Organization (NGO) to deploy the first relief campaign.
              </p>
              <button className="btn-modern-primary" onClick={onConnect} style={{ width: 'auto', margin: '0 auto' }}>
                <span>Sign In to Create Campaign</span>
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
      </section>

    </div>
  );
}

