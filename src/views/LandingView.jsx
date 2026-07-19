import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getReadOnlyContract } from '../web3Connection';
import CampaignCard, { progressPct } from '../components/CampaignCard';
import { ROLES } from '../roleConfig';

export default function LandingView({ onConnect, hasMetaMask }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        console.error('Public fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalRaised = campaigns
    .reduce((s, c) => s + parseFloat(c.currentAmount || 0), 0)
    .toFixed(4);
  const activeCampaigns = campaigns.filter((c) => c.isActive).length;

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="hero">
        <div className="container">
          <div className="hero-eyebrow">
            <span>🔗</span> Powered by Ethereum Blockchain · Sepolia Testnet
          </div>

          <h1 className="hero-title">
            Transparent Relief,{' '}
            <span className="gradient-text">Verified On-Chain</span>
          </h1>

          <p className="hero-subtitle">
            The <strong>Blockchain-Based Donation and Relief Transparency System (BBDRTS)</strong>{' '}
            is a decentralized web platform enabling NGOs and student organizations to create
            relief campaigns and receive wallet-to-wallet donations — every peso permanently
            and publicly verifiable on the blockchain.
          </p>

          {/* Live stats (public, read-only) */}
          {!loading && campaigns.length > 0 && (
            <div className="hero-live-stats">
              <div className="hero-live-stat">
                <span className="hero-live-value">{campaigns.length}</span>
                <span className="hero-live-label">Campaigns on Ledger</span>
              </div>
              <div className="hero-live-stat">
                <span className="hero-live-value">{activeCampaigns}</span>
                <span className="hero-live-label">Active Now</span>
              </div>
              <div className="hero-live-stat">
                <span className="hero-live-value accent">{totalRaised} ETH</span>
                <span className="hero-live-label">Total Raised On-Chain</span>
              </div>
            </div>
          )}

          {/* Web3 Sign-In Portal */}
          <div className="login-portal card glow fade-in" style={{ maxWidth: '600px', margin: '40px auto 0', textAlign: 'left' }}>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>🔐</span> Secure Web3 Sign-In
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
              BBDRTS uses <strong>blockchain wallet authentication</strong> instead of traditional passwords. 
              Your role is automatically detected based on your wallet address:
            </p>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span className="role-badge" style={{ color: 'var(--warning)', borderColor: 'var(--warning)', minWidth: '95px', justifyContent: 'center' }}>⚡ Admin</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: '3px' }}>Contract deployer. Can register NGOs.</span>
              </li>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span className="role-badge" style={{ color: 'var(--info)', borderColor: 'var(--info)', minWidth: '95px', justifyContent: 'center' }}>🏛️ NGO</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: '3px' }}>Registered NGO. Can create campaigns.</span>
              </li>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span className="role-badge" style={{ color: 'var(--accent)', borderColor: 'var(--accent)', minWidth: '95px', justifyContent: 'center' }}>💙 Donor</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: '3px' }}>Any connected wallet. Can donate.</span>
              </li>
            </ul>

            {!hasMetaMask ? (
              <div className="no-metamask" style={{ width: '100%', boxSizing: 'border-box' }}>
                <span>⚠️</span>
                <span>
                  MetaMask is required to sign in.{' '}
                  <a href="https://metamask.io/download/" target="_blank" rel="noreferrer"
                    style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>
                    Install MetaMask
                  </a>{' '}
                  and refresh to continue.
                </span>
              </div>
            ) : (
              <button
                className="btn btn-primary btn-lg pulse"
                onClick={onConnect}
                style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '1.05rem', padding: '16px' }}
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" style={{ width: '22px' }} />
                Sign In with MetaMask
              </button>
            )}
          </div>

          {/* How It Works */}
          <div className="how-it-works">
            <div className="how-step"><div className="how-icon">🏛️</div><div className="how-label">Organizations create relief campaigns</div></div>
            <div className="how-arrow">→</div>
            <div className="how-step"><div className="how-icon">💙</div><div className="how-label">Donors send ETH directly via MetaMask</div></div>
            <div className="how-arrow">→</div>
            <div className="how-step"><div className="how-icon">📜</div><div className="how-label">Every transaction recorded immutably on-chain</div></div>
            <div className="how-arrow">→</div>
            <div className="how-step"><div className="how-icon">🔍</div><div className="how-label">Anyone can verify donations on Etherscan</div></div>
          </div>

          <div className="features-strip">
            <div className="feature-item"><span className="feature-icon">🚫</span><span>No Third-Party Fees</span></div>
            <div className="feature-sep" />
            <div className="feature-item"><span className="feature-icon">🔒</span><span>Tamper-Proof Ledger</span></div>
            <div className="feature-sep" />
            <div className="feature-item"><span className="feature-icon">⚡</span><span>Smart Contract Automation</span></div>
            <div className="feature-sep" />
            <div className="feature-item"><span className="feature-icon">🌐</span><span>Real-Time Tracking</span></div>
          </div>
        </div>
      </section>

      {/* ─── Public Campaign Browser ─── */}
      <section style={{ paddingBottom: '60px' }}>
        <div className="container">
          <div className="section-header" style={{ marginBottom: '20px' }}>
            <h2 className="section-title">
              <span className="section-title-icon">📋</span>
              Live Relief Campaigns
            </h2>
            {campaigns.length > 0 && (
              <span className="section-count">{campaigns.length} on ledger</span>
            )}
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="spinner spinner-light" style={{ width: 28, height: 28 }} />
              <div className="empty-title">Reading from blockchain…</div>
              <div className="empty-desc">Fetching live campaign data from Sepolia.</div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-title">No campaigns yet</div>
              <div className="empty-desc">
                Connect your wallet and, if you are a registered organization,
                deploy the first relief campaign above.
              </div>
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

      {/* ─── Beneficiary Cards ─── */}
      <section className="about-section">
        <div className="container">
          <div className="about-grid">
            <div className="about-card">
              <div className="about-card-icon">🏛️</div>
              <h3 className="about-card-title">For NGOs &amp; Organizations</h3>
              <p className="about-card-desc">
                Create and manage relief campaigns with a secure portal. Reduce
                administrative overhead, build donor trust, and publish an immutable
                public record of every fund received.
              </p>
            </div>
            <div className="about-card">
              <div className="about-card-icon">💙</div>
              <h3 className="about-card-title">For Donors</h3>
              <p className="about-card-desc">
                Send donations directly from your digital wallet — no intermediaries,
                no hidden deductions. Track exactly where your contribution went
                through a real-time public ledger.
              </p>
            </div>
            <div className="about-card">
              <div className="about-card-icon">🆘</div>
              <h3 className="about-card-title">For Beneficiaries</h3>
              <p className="about-card-desc">
                Zero corporate gateway fees means a maximized portion of every donation
                reaches the communities and individuals who need it most during crises.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
