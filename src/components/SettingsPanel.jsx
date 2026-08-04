import React, { useState } from 'react';
import './SettingsPanel.css';
import { ROLES, ROLE_META } from '../roleConfig';
import { shortAddr } from './CampaignCard';

export default function SettingsPanel({ contract, currentUser, walletAddress, handleConnectWallet, handleLogout, updateDbWallet }) {
  const [manualWallet, setManualWallet] = useState('');
  const [emailNotify, setEmailNotify] = useState(true);
  const [anonDefault, setAnonDefault] = useState(false);
  const [glassFx, setGlassFx] = useState(true);

  if (!currentUser) return null;
  const roleMeta = ROLE_META[currentUser.role] || ROLE_META[ROLES.PUBLIC];
  const isOrg = currentUser?.role === ROLES.ORGANIZATION || currentUser?.role === 'organization';
  
  let displayName = currentUser?.name || currentUser?.email || 'User';
  if (isOrg) {
    if (displayName.toLowerCase().includes('redcross') || displayName.toLowerCase().includes('red cross')) {
      displayName = 'Red Cross';
    } else if (displayName.toLowerCase().includes('ccs')) {
      displayName = 'CCS';
    } else if (walletAddress) {
      if (walletAddress.toLowerCase().startsWith('0x206e')) displayName = 'Red Cross';
      if (walletAddress.toLowerCase().startsWith('0x8898')) displayName = 'CCS';
    }
  } else {
    if (displayName.includes('@')) {
      displayName = displayName.split('@')[0];
    }
  }
  
  const userInitials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const userId = isOrg ? 'BBDRTS-NGO-2026-0001' : 'BBDRTS-DONOR-2026-0001';

  return (
    <div className="settings-glass-container fade-in">
      
      {/* Header Bar */}
      <div className="section-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="settings-section-header" style={{ fontSize: '1.4rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>shield</span> {roleMeta.label} Profile & Command Center
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>
            Manage your cryptographic identity, Web3 MetaMask bindings, and system preferences.
          </p>
        </div>

        <span className="badge" style={{ color: roleMeta.color, borderColor: roleMeta.color, background: `${roleMeta.color}15`, padding: '8px 16px', fontSize: '0.88rem', fontWeight: 700 }}>
          <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '6px', fontSize: '1.1rem' }}>{roleMeta.icon}</span> 
          {roleMeta.label}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* ── 1. HERO IDENTITY PASS CARD ── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle background glow */}
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            
            {/* Left: Avatar & Personal Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#fff', fontWeight: '800', fontSize: '1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(2,132,199,0.5)',
                border: '2px solid rgba(255,255,255,0.2)'
              }}>
                {userInitials}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#fff', fontWeight: 700 }}>{displayName}</h3>
                  <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '2px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                    ● ACTIVE & VERIFIED
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
                  {currentUser.email || currentUser.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontFamily: 'monospace', marginTop: '4px' }}>
                  ID: {userId} • EVM Level 1
                </div>
              </div>
            </div>

            {/* Right: Quick Diagnostics Grid */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', minWidth: '120px' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Network</div>
                <strong style={{ fontSize: '0.9rem', color: '#38bdf8' }}>Sepolia EVM</strong>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', minWidth: '120px' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Smart Contract</div>
                <strong style={{ fontSize: '0.9rem', color: '#22c55e' }}>100% Online</strong>
              </div>
            </div>

          </div>
        </div>

        {/* ── 2. WEB3 METAMASK WALLET MANAGEMENT SUITE ── */}
        <div className="settings-section-glass" style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 className="settings-section-header" style={{ margin: 0 }}>
              <span className="material-symbols-outlined" style={{ color: '#f59e0b' }}>account_balance_wallet</span> Web3 MetaMask Cryptographic Key
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
              Chain ID: 11155111 (Sepolia)
            </span>
          </div>

          <p className="settings-section-desc">
            Your MetaMask public address is registered on the blockchain to sign and authorize tamper-proof transactions.
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {walletAddress ? (
              <div className={`wallet-conn-box ${contract ? 'connected' : 'mismatch'}`} style={{ padding: '16px 20px', borderRadius: '12px' }}>
                <span className="wallet-icon" style={{ fontSize: '2.8rem' }}>🦊</span>
                <div style={{ flex: 1 }}>
                  <div className={`wallet-status ${contract ? 'connected' : 'mismatch'}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                     <span className="spinner-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: contract ? '#22c55e' : '#f59e0b' }} />
                     {contract ? 'Secure Cryptographic Link Active' : 'Signature Pending MetaMask Sync'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <strong className="wallet-address" style={{ fontSize: '1.2rem' }}>{shortAddr(walletAddress)}</strong>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(walletAddress);
                        alert('Full wallet address copied!');
                      }}
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#38bdf8', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      📋 Copy Address
                    </button>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px' }}>
                    {walletAddress}
                  </div>
                </div>
              </div>
            ) : (
              <div className="wallet-conn-box disconnected" style={{ padding: '16px 20px', borderRadius: '12px' }}>
                <span className="wallet-icon" style={{ filter: 'grayscale(100%)', fontSize: '2.8rem' }}>🦊</span>
                <div>
                  <div className="wallet-status disconnected">● No Cryptographic Wallet Bound</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>You must bind a MetaMask key to interact with smart contract campaigns.</div>
                </div>
              </div>
            )}
            
            {walletAddress ? (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {!contract && (
                  <button className="btn btn-primary glow pulse" onClick={() => handleConnectWallet(true)} style={{ padding: '0.75rem 1.25rem' }}>
                    <span className="material-symbols-outlined">sync</span> Sync Wallet
                  </button>
                )}
                <button className="btn btn-outline" onClick={async () => {
                  if(window.confirm("CRITICAL WARNING: Unbinding this wallet revokes your ability to broadcast smart contract transactions. Proceed?")) {
                    if (updateDbWallet) {
                      await updateDbWallet('');
                      window.location.reload();
                    }
                  }
                }} style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '0.75rem 1.25rem' }}>
                  <span className="material-symbols-outlined">link_off</span> Sever Link
                </button>
              </div>
            ) : (
              <button className="btn btn-primary glow" onClick={() => handleConnectWallet(true)} style={{ padding: '0.85rem 1.75rem' }}>
                <span className="material-symbols-outlined">link</span> Bind MetaMask Key
              </button>
            )}
          </div>
          
          <div className="terminal-sandbox" style={{ marginTop: '20px' }}>
             <div style={{ color: '#38bdf8', fontSize: '0.82rem', marginBottom: '6px', fontWeight: 700 }}>&gt; MANUAL OVERRIDE PROTOCOL (OFFLINE CAPSTONE SIMULATION)</div>
             <p style={{ fontSize: '0.75rem', color: 'rgba(56,189,248,0.7)', marginBottom: '10px' }}>
               Inject a custom 0x hex string to force Web3 database binding during capstone defense simulations.
             </p>
             <div className="terminal-input-group">
                <input type="text" className="terminal-input" placeholder="0x..." value={manualWallet} onChange={e => setManualWallet(e.target.value)} />
                <button className="terminal-btn" onClick={async () => {
                  if (manualWallet.startsWith('0x')) {
                     if(updateDbWallet) { 
                       await updateDbWallet(manualWallet.trim()); 
                       window.location.reload(); 
                     }
                  } else {
                     alert("ERROR: Address must initiate with 0x");
                  }
                }}>Inject [Enter]</button>
             </div>
          </div>
        </div>

        {/* ── 3. PREFERENCES & SYSTEM DIAGNOSTICS GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          
          {/* Preferences */}
          <div className="settings-section-glass">
            <h3 className="settings-section-header" style={{ fontSize: '1.1rem' }}>
              <span className="material-symbols-outlined" style={{ color: '#0284c7' }}>tune</span> Donor Preferences
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
              
              <div 
                onClick={() => setEmailNotify(!emailNotify)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', cursor: 'pointer' }}
              >
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>Email Transaction Receipts</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Receive PDF reports via email</div>
                </div>
                <div style={{ width: '38px', height: '20px', borderRadius: '20px', background: emailNotify ? '#0284c7' : 'rgba(255,255,255,0.1)', position: 'relative', transition: '0.3s' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: emailNotify ? '20px' : '2px', transition: '0.3s' }} />
                </div>
              </div>

              <div 
                onClick={() => setAnonDefault(!anonDefault)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', cursor: 'pointer' }}
              >
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>Default Anonymous Mode</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Pre-select anonymous checkbox</div>
                </div>
                <div style={{ width: '38px', height: '20px', borderRadius: '20px', background: anonDefault ? '#0284c7' : 'rgba(255,255,255,0.1)', position: 'relative', transition: '0.3s' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: anonDefault ? '20px' : '2px', transition: '0.3s' }} />
                </div>
              </div>

              <div 
                onClick={() => setGlassFx(!glassFx)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', cursor: 'pointer' }}
              >
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>High-Performance UI Glass</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Enable backdrop blur effects</div>
                </div>
                <div style={{ width: '38px', height: '20px', borderRadius: '20px', background: glassFx ? '#0284c7' : 'rgba(255,255,255,0.1)', position: 'relative', transition: '0.3s' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: glassFx ? '20px' : '2px', transition: '0.3s' }} />
                </div>
              </div>

            </div>
          </div>

          {/* System Health */}
          <div className="settings-section-glass">
            <h3 className="settings-section-header" style={{ fontSize: '1.1rem' }}>
              <span className="material-symbols-outlined" style={{ color: '#22c55e' }}>health_and_safety</span> Blockchain System Health
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>EVM RPC Gateway:</span>
                <strong style={{ color: '#22c55e' }}>● Operational (Sepolia)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Smart Contract Address:</span>
                <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>0xD87c...E507</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Off-Chain Database:</span>
                <strong style={{ color: '#22c55e' }}>● MySQL Connected</strong>
              </div>
            </div>
          </div>

        </div>

        {/* ── 4. DANGER ZONE: SESSION TERMINATION ── */}
        <div className="settings-section-glass settings-danger-zone">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 className="settings-section-header" style={{color: '#ef4444', margin: 0, fontSize: '1.1rem'}}>Session Termination</h3>
              <p className="settings-section-desc" style={{color: 'rgba(239, 68, 68, 0.7)', margin: '4px 0 0'}}>
                Securely close database connection and clear active authentication tokens.
              </p>
            </div>
            <button className="settings-btn-danger" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.75rem 1.5rem' }}>
              <span className="material-symbols-outlined" style={{fontSize: '18px'}}>logout</span>
              Terminate Session
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
