import React, { useState } from 'react';
import './SettingsPanel.css';
import { ROLES, ROLE_META } from '../roleConfig';
import { shortAddr } from './CampaignCard';

export default function SettingsPanel({ contract, currentUser, walletAddress, handleConnectWallet, handleLogout, updateDbWallet }) {
  const [manualWallet, setManualWallet] = React.useState('');
  if (!currentUser) return null;
  const roleMeta = ROLE_META[currentUser.role] || ROLE_META[ROLES.PUBLIC];

  return (
    <div className="settings-glass-container fade-in">
      
      <div className="section-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
        <h2 className="settings-section-header">
          <span className="material-symbols-outlined">account_circle</span> Profile Settings
        </h2>
        <span className="badge" style={{ color: roleMeta.color, borderColor: roleMeta.color, background: `${roleMeta.color}15`, padding: '6px 12px', fontSize: '0.85rem' }}>
          <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '6px', fontSize: '1rem' }}>{roleMeta.icon}</span> 
          {roleMeta.label}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Verification Status (Orgs only) */}
        {currentUser.role === 'organization' && (
          <div className="settings-section-glass" style={{ borderLeft: `4px solid ${currentUser.verification_status === 'Approved' ? 'var(--success)' : 'var(--warning)'}` }}>
            <h3 className="settings-section-header">Organization Verification</h3>
            <p className="settings-section-desc">Your current approval status defines whether you can deploy campaigns on-chain. Approvals are strictly monitored by administration.</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '10px 18px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Blockchain Authority Status:</span>
              <strong style={{ color: currentUser.verification_status === 'Approved' ? 'var(--success)' : 'var(--warning)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {currentUser.verification_status || 'Pending'}
              </strong>
            </div>
          </div>
        )}

        {/* Account Details */}
        <div className="settings-section-glass">
          <h3 className="settings-section-header">Decentralized Identifier</h3>
          <p className="settings-section-desc">This is your core operational identity registered inside the Web2 database matrix before bridging to Web3.</p>
          <div className="profile-data-row">
            <div className="profile-data-box">
              <label className="profile-data-label"><i className="material-symbols-outlined" style={{fontSize: '1rem'}}>mail</i> Username / Email</label>
              <div className="profile-data-value">{currentUser.name}</div>
            </div>
            <div className="profile-data-box">
              <label className="profile-data-label"><i className="material-symbols-outlined" style={{fontSize: '1rem'}}>admin_panel_settings</i> Authorization Tier</label>
              <div className="profile-data-value" style={{ color: roleMeta.color }}>{currentUser.role}</div>
            </div>
          </div>
        </div>

        {/* Web3 Wallet Association */}
        <div className="settings-section-glass">
          <h3 className="settings-section-header">Web3 Authentication Key</h3>
          <p className="settings-section-desc">The cryptographic MetaMask signature registered to authorize your smart contract transactions.</p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {walletAddress ? (
              <div className={`wallet-conn-box ${contract ? 'connected' : 'mismatch'}`}>
                <span className="wallet-icon">🦊</span>
                <div>
                  <div className={`wallet-status ${contract ? 'connected' : 'mismatch'}`}>
                     {contract ? 'Secure Link Established' : 'Access Key Mismatch'}
                  </div>
                  <strong className="wallet-address">{walletAddress}</strong>
                  {!contract && (
                     <div style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--warning)', marginTop: '4px' }}>
                        Your installed MetaMask wallet currently does not match this registered key.
                     </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="wallet-conn-box disconnected">
                <span className="wallet-icon" style={{ filter: 'grayscale(100%)' }}>🦊</span>
                <div>
                  <div className="wallet-status disconnected">No Cryptographic Key</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>You must bind a wallet to interact with the ledger.</div>
                </div>
              </div>
            )}
            
            {walletAddress && !contract && (
              <button className="btn btn-primary glow pulse" onClick={() => handleConnectWallet(true)} style={{ flexShrink: 0, padding: '1.25rem' }}>
                <span className="material-symbols-outlined">sync</span> Sync Signature
              </button>
            )}

            {walletAddress ? (
              <button className="btn btn-outline" onClick={async () => {
                if(window.confirm("CRITICAL WARNING: Unbinding this wallet revokes your ability to broadcast smart contracts. Proceed?")) {
                  if (updateDbWallet) {
                    await updateDbWallet('');
                    window.location.reload();
                  }
                }
              }} style={{ flexShrink: 0, borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '1.25rem' }}>
                <span className="material-symbols-outlined">link_off</span> Sever Link
              </button>
            ) : (
              <button className="btn btn-primary glow" onClick={() => handleConnectWallet(true)} style={{ flexShrink: 0, padding: '1.25rem' }}>
                <span className="material-symbols-outlined">link</span> Bind MetaMask Key
              </button>
            )}
          </div>
          
          <div className="terminal-sandbox">
             <div style={{ color: '#38bdf8', fontSize: '0.85rem', marginBottom: '10px' }}>&gt; AWAITING MANUAL OVERRIDE PROTOCOL...</div>
             <p style={{ fontSize: '0.75rem', color: 'rgba(56,189,248,0.7)', marginBottom: '0' }}>Inject a generic 0x hex string to force Web3 database binding during offline defense simulations.</p>
             <div className="terminal-input-group">
                <input type="text" className="terminal-input" placeholder="0x..." value={manualWallet} onChange={e => setManualWallet(e.target.value)} />
                <button className="terminal-btn" onClick={async () => {
                  if (manualWallet.startsWith('0x')) {
                     if(updateDbWallet) { 
                       await updateDbWallet(manualWallet.trim()); 
                       window.location.reload(); 
                     }
                  } else {
                     alert("ERROR: Sequence must initiate with 0x");
                  }
                }}>Execute [Enter]</button>
             </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="settings-section-glass settings-danger-zone">
          <h3 className="settings-section-header" style={{color: '#ef4444'}}>Session Termination</h3>
          <p className="settings-section-desc" style={{color: 'rgba(239, 68, 68, 0.7)'}}>Securely close the database connection and erase localized cache tokens.</p>
          <button className="settings-btn-danger" onClick={handleLogout}>
            <span className="material-symbols-outlined" style={{verticalAlign: 'bottom', marginRight: '6px'}}>logout</span>
            Terminate Session
          </button>
        </div>

      </div>
    </div>
  );
}
