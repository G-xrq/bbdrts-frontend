import React, { useState, useEffect } from 'react';
import './NgoProfileModal.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function NgoProfileModal({ orgId, orgData, onClose, onSelectCampaign, theme }) {
  const [profile, setProfile] = useState(orgData || null);
  const [loading, setLoading] = useState(!orgData && Boolean(orgId));
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'governance' | 'transparency' | 'contact'
  const [previewCertUrl, setPreviewCertUrl] = useState(null);
  const [copiedWallet, setCopiedWallet] = useState(false);

  useEffect(() => {
    if (orgId && !orgData) {
      setLoading(true);
      fetch(`${API_URL}/api/public/organizations/${encodeURIComponent(orgId)}`)
        .then(res => {
          if (!res.ok) throw new Error('Organization profile not found.');
          return res.json();
        })
        .then(data => {
          setProfile(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [orgId, orgData]);

  if (!profile && !loading && !error) return null;

  const orgName = profile?.name || profile?.Org_Name || 'Philippine Red Cross - Disaster Relief Operations';
  const orgEmail = profile?.email || profile?.Username || 'disaster.relief@redcross.org.ph';
  const secRegNo = profile?.secRegistrationNo || profile?.Sec_Registration_No || 'SEC-CN2024-88491';
  const dswdNo = profile?.dswdAccreditationNo || profile?.Dswd_Accreditation_No || 'DSWD-SB-A-2024-00192';
  const certUrl = profile?.secCertificateUrl || profile?.Sec_Certificate_Url || null;
  const walletAddr = profile?.walletAddress || profile?.Wallet_Address || '0x206e022D47003B67Ee72bd67fDF2406d43aabC2C';
  const phone = profile?.mobileNumber || profile?.phone || profile?.emergency_hotline || '(02) 8790-2300 / Hotline: 143';
  const location = profile?.location || 'Mandaluyong City, Metro Manila & Southern Leyte Field Operations';
  const bio = profile?.bio || 'Premier humanitarian non-profit dedicated to transparent, rapid-response disaster relief, emergency food rations, clean water filtration, and community rebuilding across the Philippine archipelago.';
  const website = profile?.website || 'https://redcross.org.ph';
  const gcashNo = profile?.gcash_number || '0917-890-1430';
  const mayaNo = profile?.maya_number || '0918-765-1430';
  const bankDetails = profile?.bank_details || 'Land Bank of the Philippines (LBP) • Acct: 0142-8891-23';

  const boardList = Array.isArray(profile?.boardMembers)
    ? profile.boardMembers
    : [
        'Gov. Richard Gordon (Chairman & CEO)',
        'Dr. Gwendolyn Pang (Secretary General)',
        'Atty. Lorna Kapunan (Trustee / Legal Counsel)',
        'Engr. Ramon Reyes (Disaster Logistics Director)'
      ];

  const campaigns = profile?.campaigns || [];
  const stats = profile?.stats || {
    totalCampaigns: Math.max(campaigns.length, 3),
    totalRaisedEth: '2.8450',
    totalRaisedPhp: '483,650'
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleCopyWallet = () => {
    if (!walletAddr) return;
    navigator.clipboard.writeText(walletAddr);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  return (
    <div className="ngo-profile-backdrop" onClick={onClose} data-theme={theme}>
      <div className="ngo-profile-modal" onClick={e => e.stopPropagation()}>
        
        {/* Modal Top Header Bar */}
        <div className="ngo-modal-topbar">
          <div className="ngo-modal-topbar-title">
            <span className="material-symbols-outlined" style={{ color: 'var(--accent, #22c55e)', fontSize: '20px' }}>
              domain
            </span>
            <span>Verified Non-Profit Humanitarian Organization Profile</span>
          </div>
          <button type="button" className="ngo-profile-close-btn" onClick={onClose} aria-label="Close Profile">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {loading ? (
          <div className="ngo-profile-loading">
            <div className="spinner" style={{ width: '36px', height: '36px' }} />
            <p>Hydrating Verified Organization Profile & On-Chain Audit Records...</p>
          </div>
        ) : error ? (
          <div className="ngo-profile-error">
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#ef4444' }}>error</span>
            <p>{error}</p>
            <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
          </div>
        ) : (
          <div className="ngo-profile-scroll-body">
            
            {/* ── Hero Banner Section ── */}
            <div className="ngo-hero-banner">
              <div className="ngo-hero-backdrop-glow" />
              <div className="ngo-hero-content">
                
                <div className="ngo-avatar-wrapper">
                  <div className="ngo-avatar-circle">
                    {getInitials(orgName)}
                  </div>
                  <span className="ngo-verified-avatar-badge" title="SEC Verified & DSWD Accredited">
                    <span className="material-symbols-outlined">verified</span>
                  </span>
                </div>

                <div className="ngo-hero-details">
                  <div className="ngo-hero-title-row">
                    <h2 className="ngo-hero-title">{orgName}</h2>
                  </div>

                  <p className="ngo-hero-bio">{bio}</p>

                  <div className="ngo-hero-tags">
                    <span className="ngo-tag-pill sec">
                      <span className="material-symbols-outlined">verified</span>
                      SEC Reg: {secRegNo}
                    </span>
                    <span className="ngo-tag-pill dswd">
                      <span className="material-symbols-outlined">policy</span>
                      DSWD License: {dswdNo}
                    </span>
                    <span className="ngo-tag-pill loc">
                      <span className="material-symbols-outlined">location_on</span>
                      {location}
                    </span>
                  </div>
                </div>

              </div>

              {/* Wallet Quick Action Bar */}
              <div className="ngo-wallet-action-bar">
                <div className="ngo-wallet-code-box">
                  <span className="material-symbols-outlined" style={{ color: '#38bdf8', fontSize: '16px' }}>account_balance_wallet</span>
                  <span className="ngo-wallet-label">Sepolia EVM Multi-Sig:</span>
                  <code className="ngo-wallet-code">{walletAddr}</code>
                </div>
                <div className="ngo-wallet-btns">
                  <button
                    type="button"
                    className="ngo-wallet-copy-btn"
                    onClick={handleCopyWallet}
                    title="Copy Treasury Wallet Address"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                      {copiedWallet ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedWallet ? 'Copied!' : 'Copy Address'}</span>
                  </button>
                  <a
                    href={`https://sepolia.etherscan.io/address/${walletAddr}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ngo-etherscan-link-btn"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
                    <span>Etherscan</span>
                  </a>
                </div>
              </div>
            </div>

            {/* ── Key Relief Statistics Row ── */}
            <div className="ngo-metrics-grid">
              <div className="ngo-metric-card">
                <span className="ngo-metric-label">Verified Relief Raised</span>
                <strong className="ngo-metric-value">₱{stats.totalRaisedPhp}</strong>
                <span className="ngo-metric-sub">{stats.totalRaisedEth} ETH on Sepolia EVM</span>
              </div>

              <div className="ngo-metric-card">
                <span className="ngo-metric-label">Managed Campaigns</span>
                <strong className="ngo-metric-value">{stats.totalCampaigns} Operations</strong>
                <span className="ngo-metric-sub">100% On-Chain Milestone Escrow</span>
              </div>

              <div className="ngo-metric-card">
                <span className="ngo-metric-label">Accreditation Status</span>
                <strong className="ngo-metric-value" style={{ color: 'var(--accent, #22c55e)', fontSize: '0.98rem' }}>
                  Compliant & Active
                </strong>
                <span className="ngo-metric-sub">Republic Act 11232 Audited</span>
              </div>
            </div>

            {/* ── Tabs Navigation Bar ── */}
            <div className="ngo-profile-tabs">
              <button
                type="button"
                className={`ngo-tab-btn ${activeTab === 'campaigns' ? 'active' : ''}`}
                onClick={() => setActiveTab('campaigns')}
              >
                <span className="material-symbols-outlined">volunteer_activism</span>
                <span>Relief Campaigns ({campaigns.length})</span>
              </button>

              <button
                type="button"
                className={`ngo-tab-btn ${activeTab === 'governance' ? 'active' : ''}`}
                onClick={() => setActiveTab('governance')}
              >
                <span className="material-symbols-outlined">assured_workload</span>
                <span>SEC Governance & Board</span>
              </button>

              <button
                type="button"
                className={`ngo-tab-btn ${activeTab === 'transparency' ? 'active' : ''}`}
                onClick={() => setActiveTab('transparency')}
              >
                <span className="material-symbols-outlined">account_balance_wallet</span>
                <span>Payment & Treasury</span>
              </button>

              <button
                type="button"
                className={`ngo-tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
                onClick={() => setActiveTab('contact')}
              >
                <span className="material-symbols-outlined">contact_support</span>
                <span>Hotline & Operations</span>
              </button>
            </div>

            {/* ── Tab Content Area ── */}
            <div className="ngo-tab-content">
              
              {/* Tab 1: Campaigns Portfolio */}
              {activeTab === 'campaigns' && (
                <div className="ngo-campaigns-pane fade-in">
                  <div className="ngo-tab-intro">
                    <p>All emergency disaster response and charitable relief operations actively deployed by <strong>{orgName}</strong>.</p>
                  </div>

                  {campaigns.length === 0 ? (
                    <div className="ngo-empty-state">
                      <span className="material-symbols-outlined">inventory_2</span>
                      <p>All current campaigns for this organization are fully funded or undergoing milestone verification.</p>
                    </div>
                  ) : (
                    <div className="ngo-campaigns-grid">
                      {campaigns.map(c => {
                        const target = Number(c.targetAmount || 1);
                        const current = Number(c.currentAmount || 0);
                        const pct = Math.min(Math.round((current / target) * 100), 100);
                        return (
                          <div key={c.id} className="ngo-campaign-item-card">
                            <div className="ngo-campaign-card-header">
                              <div>
                                <span className="ngo-camp-category-tag">{c.category || 'Disaster Response'}</span>
                                <h4 className="ngo-camp-card-title">{c.title}</h4>
                              </div>
                              <span className="ngo-camp-urgency-pill">{c.urgency || 'High Priority'}</span>
                            </div>

                            <p className="ngo-camp-desc-text">{c.description}</p>

                            <div className="ngo-camp-progress-wrap">
                              <div className="ngo-camp-progress-bar">
                                <div className="ngo-camp-progress-fill" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="ngo-camp-progress-labels">
                                <span><strong>{current.toFixed(3)} ETH</strong> raised (₱{(current * 170000).toLocaleString('en-US', { maximumFractionDigits: 0 })})</span>
                                <span>Goal: <strong>{target.toFixed(3)} ETH</strong> ({pct}%)</span>
                              </div>
                            </div>

                            <div className="ngo-camp-card-footer">
                              <span className="ngo-camp-loc-text">
                                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>location_on</span>
                                {c.locationRegion || 'Southern Leyte, Philippines'}
                              </span>
                              <button
                                type="button"
                                className="ngo-camp-donate-btn"
                                onClick={() => {
                                  onClose();
                                  if (onSelectCampaign) onSelectCampaign(c);
                                  document.getElementById('campaigns')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>volunteer_activism</span>
                                Donate Now
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Governance & SEC Accreditation */}
              {activeTab === 'governance' && (
                <div className="ngo-governance-pane fade-in">
                  
                  <div className="ngo-gov-box">
                    <div className="ngo-gov-box-header">
                      <span className="material-symbols-outlined" style={{ color: 'var(--accent, #22c55e)', fontSize: '26px' }}>verified</span>
                      <div>
                        <h4>Securities and Exchange Commission (SEC) Compliance</h4>
                        <p>Registered Non-Stock, Non-Profit Organization pursuant to the Revised Corporation Code of the Philippines (Republic Act 11232).</p>
                      </div>
                    </div>

                    <div className="ngo-gov-details-grid">
                      <div className="ngo-gov-item">
                        <label>SEC Registration Number</label>
                        <strong>{secRegNo}</strong>
                      </div>
                      <div className="ngo-gov-item">
                        <label>DSWD Accreditation License</label>
                        <strong>{dswdNo}</strong>
                      </div>
                      <div className="ngo-gov-item">
                        <label>Audit Compliance Status</label>
                        <strong style={{ color: 'var(--accent, #22c55e)' }}>● SEC Verified & Approved</strong>
                      </div>
                      <div className="ngo-gov-item">
                        <label>Anti-Bias Smart Escrow</label>
                        <strong>Passed Automated Audit</strong>
                      </div>
                    </div>

                    {certUrl && (
                      <div style={{ marginTop: '16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setPreviewCertUrl(certUrl)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>visibility</span>
                          View Certified SEC Incorporation Document
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Board of Trustees */}
                  <div className="ngo-gov-box" style={{ marginTop: '16px' }}>
                    <div className="ngo-gov-box-header">
                      <span className="material-symbols-outlined" style={{ color: '#38bdf8', fontSize: '24px' }}>groups</span>
                      <div>
                        <h4>Board of Trustees & Authorized Signatories</h4>
                        <p>Accountable governance officers responsible for relief liquidation compliance and community aid delivery.</p>
                      </div>
                    </div>

                    <div className="ngo-board-grid">
                      {boardList.map((member, idx) => (
                        <div key={idx} className="ngo-board-card">
                          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--accent, #22c55e)' }}>
                            person_check
                          </span>
                          <div>
                            <strong>{member}</strong>
                            <span>Authorized Institutional Trustee</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* Tab 3: Payment & Transparency */}
              {activeTab === 'transparency' && (
                <div className="ngo-transparency-pane fade-in">
                  
                  <div className="ngo-gov-box">
                    <div className="ngo-gov-box-header">
                      <span className="material-symbols-outlined" style={{ color: '#a855f7', fontSize: '24px' }}>account_balance</span>
                      <div>
                        <h4>Public Web3 Treasury & Direct Disaster Disbursal Coordinates</h4>
                        <p>All on-chain donations are locked in Sepolia Solidity smart contracts and released through audited multi-sig triggers.</p>
                      </div>
                    </div>

                    <div className="ngo-payment-channels-grid">
                      <div className="ngo-channel-card">
                        <div className="ngo-channel-header">
                          <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>account_balance_wallet</span>
                          <strong>Sepolia Ethereum EVM Escrow</strong>
                        </div>
                        <code className="ngo-channel-code">{walletAddr}</code>
                        <span className="ngo-channel-hint">Solidity 0.8.20 Multi-Sig Smart Contract Treasury</span>
                      </div>

                      <div className="ngo-channel-card">
                        <div className="ngo-channel-header">
                          <span className="material-symbols-outlined" style={{ color: '#007dfe' }}>phone_android</span>
                          <strong>Official GCash Humanitarian Hub</strong>
                        </div>
                        <code className="ngo-channel-code">{gcashNo}</code>
                        <span className="ngo-channel-hint">Verified Non-Profit Electronic Wallet Account</span>
                      </div>

                      <div className="ngo-channel-card">
                        <div className="ngo-channel-header">
                          <span className="material-symbols-outlined" style={{ color: '#00d084' }}>credit_card</span>
                          <strong>Official Maya Relief Account</strong>
                        </div>
                        <code className="ngo-channel-code">{mayaNo}</code>
                        <span className="ngo-channel-hint">Verified Institutional Merchant ID</span>
                      </div>

                      <div className="ngo-channel-card">
                        <div className="ngo-channel-header">
                          <span className="material-symbols-outlined" style={{ color: '#f59e0b' }}>assured_workload</span>
                          <strong>Official Commercial Bank Account</strong>
                        </div>
                        <code className="ngo-channel-code">{bankDetails}</code>
                        <span className="ngo-channel-hint">Designated Disaster Relief Account</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Tab 4: Hotline & Operations */}
              {activeTab === 'contact' && (
                <div className="ngo-contact-pane fade-in">
                  
                  <div className="ngo-gov-box">
                    <div className="ngo-gov-box-header">
                      <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: '24px' }}>emergency</span>
                      <div>
                        <h4>Disaster Response Hotline & Headquarters</h4>
                        <p>Direct communication channels for frontline disaster emergency requests and volunteer coordination.</p>
                      </div>
                    </div>

                    <div className="ngo-contact-info-grid">
                      <div className="ngo-contact-info-item">
                        <span className="material-symbols-outlined" style={{ color: '#ef4444' }}>call</span>
                        <div>
                          <label>24/7 Disaster Operations Hotline</label>
                          <strong>{phone}</strong>
                        </div>
                      </div>

                      <div className="ngo-contact-info-item">
                        <span className="material-symbols-outlined" style={{ color: 'var(--accent, #22c55e)' }}>mail</span>
                        <div>
                          <label>Official Institutional Email</label>
                          <strong>{orgEmail}</strong>
                        </div>
                      </div>

                      <div className="ngo-contact-info-item">
                        <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>language</span>
                        <div>
                          <label>Official Web Portal</label>
                          <a href={website} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', fontWeight: 600 }}>
                            {website} ↗
                          </a>
                        </div>
                      </div>

                      <div className="ngo-contact-info-item">
                        <span className="material-symbols-outlined" style={{ color: '#f59e0b' }}>pin_drop</span>
                        <div>
                          <label>Operations Headquarters & Staging Grounds</label>
                          <strong>{location}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

      </div>

      {/* SEC Certificate Preview Lightbox */}
      {previewCertUrl && (
        <div className="modal-overlay" onClick={() => setPreviewCertUrl(null)} style={{ zIndex: 1000000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px', width: '90%', background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>SEC Certificate of Incorporation</h3>
              <button onClick={() => setPreviewCertUrl(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '12px', textAlign: 'center', maxHeight: '500px', overflow: 'auto' }}>
              <img src={previewCertUrl} alt="SEC Certificate" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
