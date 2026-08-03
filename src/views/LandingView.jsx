import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getReadOnlyContract } from '../web3Connection';
import CampaignCard from '../components/CampaignCard';
import { ROLES } from '../roleConfig';
import './AuthView.css';
import './LandingView.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function LandingView({ onConnect }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ donors: '0', orgs: '0', campaigns: '0' });
  const [activeStackIndex, setActiveStackIndex] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

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

    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const totalRaised = campaigns
    .reduce((s, c) => s + parseFloat(c.currentAmount || 0), 0)
    .toFixed(4);

  const featuresStack = [
    {
      title: 'Direct NGO Wallet Relief',
      icon: 'account_balance_wallet',
      badge: 'Zero Middleman Fees',
      desc: 'Donations flow straight from donor crypto wallets into verified Non-Governmental Organization accounts with zero payment gateway subtractions.',
      highlights: ['Metamask Integration', 'Instant Ledger Transfer', 'Public Receipts', 'Sepolia Network']
    },
    {
      title: 'Smart Contract Verification',
      icon: 'verified_user',
      badge: 'Tamper-Proof Audit',
      desc: 'All campaign goals, target ETH amounts, and actual received funds are encoded into an unalterable Solidity smart contract on the Sepolia testnet.',
      highlights: ['Automated Disbursement', 'Transparent Balance', 'Solidity 0.8.20', 'Public Audit']
    },
    {
      title: 'Administrative Governance',
      icon: 'admin_panel_settings',
      badge: 'Strict Security',
      desc: 'Official platform administrators rigorously review legal documentation (SEC/DSWD registration) before approving any NGO relief organization.',
      highlights: ['Official NGO Vetting', 'Role-Based Access', 'Security Audited', 'Multi-Layer Guard']
    },
    {
      title: 'Public Etherscan Transparency',
      icon: 'explore',
      badge: 'Global Verifiability',
      desc: 'Anyone, anywhere in the world can inspect real-time transaction hashes on Etherscan to confirm where funds were deployed.',
      highlights: ['100% On-Chain', 'Etherscan Links', 'Real-Time Sync', 'Open Data']
    }
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="landing-wrapper">
      
      {/* ── 1. HERO SECTION (Enrollment System Style) ── */}
      <div className="hero-es">
        <div className="hero-es-container">
          <div className="hero-es-badge">
            <i className="material-symbols-outlined" style={{ fontSize: '18px' }}>shield</i>
            <span>Est. 2026 · Ethereum Sepolia Testnet Protocol</span>
          </div>
          <h1>Blockchain-Based Donation &<br />Relief Transparency System</h1>
          <p>
            Revolutionizing disaster relief through immutable Web3 smart contracts.
            Empowering donors and verified NGOs with 100% direct wallet-to-wallet transparency.
          </p>
          <div className="hero-es-actions">
            <button className="btn-es-primary" onClick={onConnect}>
              <i className="material-symbols-outlined">login</i>
              <span>Access Secure Portal</span>
            </button>
            <a href="#campaigns" className="btn-es-ghost">
              <i className="material-symbols-outlined">explore</i>
              <span>Explore Relief Campaigns</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── 2. BREAKING NEWS TICKER BAR ── */}
      <div className="news-ticker-container">
        <div className="ticker-label">
          <i className="material-symbols-outlined" style={{ fontSize: '18px' }}>campaign</i>
          <span>LIVE RELIEF BULLETIN</span>
        </div>
        <div className="news-ticker">
          <div className="ticker-content">
            🌐 Real-Time Sepolia Blockchain Block Sync Active &nbsp;•&nbsp; 🏛️ Official Administrative Vetting Active for All Registered NGOs &nbsp;•&nbsp; 💙 Direct Wallet Transfers Enabled with 0% Third-Party Gateway Fees &nbsp;•&nbsp; 📜 Solidity Smart Contract Verified on Etherscan
          </div>
        </div>
      </div>

      {/* ── 3. ABOUT & HIGHLIGHTS SECTION ── */}
      <div className="section-es">
        <div className="container-es">
          
          <div className="section-header-es">
            <h2>About BBDRTS Platform</h2>
            <p>Combining Web3 security with humanitarian relief to eliminate financial opacity in disaster assistance.</p>
          </div>

          <div className="about-hero-es">
            <div className="about-intro-es">
              <div className="about-badge-es">Web3 Philanthropy Standards</div>
              <h3>Empowering Community Relief Through On-Chain Accountability</h3>
              <p className="about-description-es">
                BBDRTS stands as a pioneer in transparent relief distribution in the Philippines. By eliminating centralized intermediaries and black-box accounting, every single peso donated is recorded immutably on the Ethereum ledger for instant public audit.
              </p>

              <div className="about-highlights-es">
                <div className="highlight-card-es">
                  <div className="highlight-icon-es">
                    <i className="material-symbols-outlined">verified</i>
                  </div>
                  <div className="highlight-content-es">
                    <h4>Admin Verified NGOs</h4>
                    <p>Only legitimate relief organizations with official credentials can create campaigns.</p>
                  </div>
                </div>

                <div className="highlight-card-es">
                  <div className="highlight-icon-es">
                    <i className="material-symbols-outlined">lock</i>
                  </div>
                  <div className="highlight-content-es">
                    <h4>Smart Contract Escrow</h4>
                    <p>Automated Solidity contract execution ensures 100% fidelity to relief goals.</p>
                  </div>
                </div>

                <div className="highlight-card-es">
                  <div className="highlight-icon-es">
                    <i className="material-symbols-outlined">bolt</i>
                  </div>
                  <div className="highlight-content-es">
                    <h4>Direct Crypto Disbursal</h4>
                    <p>Metamask wallet transfers execute in seconds across the Sepolia testnet.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Split Glass Frame Branding */}
            <div className="login-glass-card" style={{ height: '100%', minHeight: '380px' }}>
              <div className="login-brand-side" style={{ width: '100%', height: '100%', borderRadius: '16px' }}>
                <div className="login-header">
                  <div className="brand-logo">
                    <img src="/logo.png" alt="BBDRTS Logo" style={{ width: '90px', height: '90px', objectFit: 'contain', animation: 'logoFloat 3s ease-in-out infinite' }} />
                  </div>
                  <div className="login-subtitle">
                    <h1 className="brand-title">BBDRTS</h1>
                    <p className="brand-tagline">Disaster Relief Transparency</p>
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
            </div>
          </div>

          {/* ── 4. MISSION & VISION GRID (Enrollment System Style) ── */}
          <div className="mission-vision-grid-es">
            <div className="mission-card-es">
              <div className="card-header-es">
                <div className="card-icon-es">
                  <i className="material-symbols-outlined">track_changes</i>
                </div>
                <h3>Our Mission</h3>
              </div>
              <p>
                To provide accessible, unalterable, and automated donation infrastructure that guarantees 100% of contributed relief funds reach legitimate disaster victims and community projects without administrative leakages.
              </p>
            </div>

            <div className="vision-card-es">
              <div className="card-header-es">
                <div className="card-icon-es">
                  <i className="material-symbols-outlined">visibility</i>
                </div>
                <h3>Our Vision</h3>
              </div>
              <p>
                To serve as the global benchmark for public humanitarian transparency, establishing Web3 smart contracts as the gold standard for global charity and disaster relief allocation.
              </p>
            </div>
          </div>

          {/* ── 5. INTERACTIVE FEATURE CARD STACK ── */}
          <div className="section-header-es" style={{ marginBottom: '30px' }}>
            <h2>System Features & Architecture</h2>
            <p>Click through the interactive stack below to explore system mechanisms.</p>
          </div>

          <div className="programs-interactive-es">
            <div className="card-stack-es">
              {featuresStack.map((item, idx) => (
                <div
                  key={idx}
                  className={`stack-card-es ${activeStackIndex === idx ? 'active' : ''}`}
                  onClick={() => setActiveStackIndex(idx)}
                >
                  <i className="material-symbols-outlined stack-icon-es">{item.icon}</i>
                  <h4 className="stack-title-es">{item.title}</h4>
                </div>
              ))}
            </div>

            <div className="program-details-panel-es">
              {featuresStack[activeStackIndex] && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#4a90e2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="material-symbols-outlined">{featuresStack[activeStackIndex].icon}</i>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.4rem', color: '#fff', margin: 0 }}>{featuresStack[activeStackIndex].title}</h3>
                      <span style={{ fontSize: '0.8rem', color: '#4a90e2', fontWeight: 600 }}>{featuresStack[activeStackIndex].badge}</span>
                    </div>
                  </div>

                  <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '24px' }}>
                    {featuresStack[activeStackIndex].desc}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {featuresStack[activeStackIndex].highlights.map((h, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#222', padding: '10px 14px', borderRadius: '8px', border: '1px solid #333', fontSize: '0.85rem', color: '#eee' }}>
                        <i className="material-symbols-outlined" style={{ fontSize: '16px', color: '#4ade80' }}>check_circle</i>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── 6. NUMERICAL STATISTICS SHOWCASE ── */}
          <div className="stats-showcase-es">
            <div className="section-header-es">
              <h2>Platform Statistics</h2>
              <p>Real-time metrics calculated from the Ethereum Sepolia block height</p>
            </div>

            <div className="stats-grid-es">
              <div className="stat-card-es">
                <div className="stat-icon-es">
                  <i className="material-symbols-outlined">group</i>
                </div>
                <div className="stat-number-es">{stats.donors}</div>
                <div className="stat-label-es">Active Donors</div>
                <div className="stat-sublabel-es">Across all regions</div>
              </div>

              <div className="stat-card-es">
                <div className="stat-icon-es">
                  <i className="material-symbols-outlined">domain</i>
                </div>
                <div className="stat-number-es">{stats.orgs}</div>
                <div className="stat-label-es">Verified NGOs</div>
                <div className="stat-sublabel-es">Admin approved</div>
              </div>

              <div className="stat-card-es">
                <div className="stat-icon-es">
                  <i className="material-symbols-outlined">campaign</i>
                </div>
                <div className="stat-number-es">{stats.campaigns || campaigns.length}</div>
                <div className="stat-label-es">Active Campaigns</div>
                <div className="stat-sublabel-es">Relief initiatives</div>
              </div>

              <div className="stat-card-es">
                <div className="stat-icon-es">
                  <i className="material-symbols-outlined">savings</i>
                </div>
                <div className="stat-number-es">{totalRaised} ETH</div>
                <div className="stat-label-es">Total ETH Raised</div>
                <div className="stat-sublabel-es">Sepolia testnet</div>
              </div>
            </div>
          </div>

          {/* ── 7. TESTIMONIALS SECTION ── */}
          <div className="section-header-es">
            <h2>Community Feedback</h2>
            <p>What donors and relief coordinators say about BBDRTS</p>
          </div>

          <div className="testimonials-grid-es">
            <div className="testimonial-card-es">
              <div className="testimonial-content-es">
                <p>"BBDRTS transformed how our NGO handles typhoon relief. Our donors can see their contributions land on-chain in real time."</p>
              </div>
              <div className="testimonial-author-es">
                <div className="author-avatar-es">JA</div>
                <div className="author-info-es">
                  <h4>Jessel Abrea</h4>
                  <p>Red Cross Relief Officer</p>
                </div>
              </div>
            </div>

            <div className="testimonial-card-es">
              <div className="testimonial-content-es">
                <p>"Knowing there are no payment gateway fees or hidden charges gives total confidence that every cent supports disaster victims."</p>
              </div>
              <div className="testimonial-author-es">
                <div className="author-avatar-es">RS</div>
                <div className="author-info-es">
                  <h4>Reva Saga</h4>
                  <p>Crypto Donor & Supporter</p>
                </div>
              </div>
            </div>

            <div className="testimonial-card-es">
              <div className="testimonial-content-es">
                <p>"The admin verification process ensures that scam pages are impossible. Only audited NGOs are given campaign access."</p>
              </div>
              <div className="testimonial-author-es">
                <div className="author-avatar-es">CV</div>
                <div className="author-info-es">
                  <h4>Claire Villaruel</h4>
                  <p>Community Organizer</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── 8. LIVE RELIEF CAMPAIGNS GRID ── */}
          <div id="campaigns" style={{ paddingTop: '80px' }}>
            <div className="section-header-es">
              <h2>Active Relief Campaigns</h2>
              <p>Explore ongoing disaster relief causes verified on the blockchain.</p>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: '0.95rem' }}>
                <span>Reading Sepolia ledger state...</span>
              </div>
            ) : campaigns.length === 0 ? (
              <div style={{ background: '#2a2a2a', borderRadius: '16px', border: '1px solid #333', padding: '40px', textAlign: 'center', color: '#aaa', maxWidth: '600px', margin: '0 auto' }}>
                <p style={{ margin: '0 0 16px 0', fontSize: '1rem' }}>No active campaigns deployed on ledger yet.</p>
                <button className="btn-es-primary" onClick={onConnect} style={{ margin: '0 auto', padding: '10px 24px', fontSize: '0.9rem' }}>
                  <span>Log In to Create First Campaign</span>
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
          </div>

        </div>
      </div>

      {/* ── 9. SCROLL TO TOP BUTTON (Enrollment System Style) ── */}
      {showScrollTop && (
        <button className="scroll-to-top-btn-es" onClick={scrollToTop} aria-label="Scroll to top">
          <i className="material-symbols-outlined">arrow_upward</i>
        </button>
      )}

    </div>
  );
}



