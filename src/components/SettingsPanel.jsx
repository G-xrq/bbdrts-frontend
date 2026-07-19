import React from 'react';
import { ROLES, ROLE_META } from '../roleConfig';
import { shortAddr } from './CampaignCard';

export default function SettingsPanel({ contract, currentUser, walletAddress, handleConnectWallet, handleLogout, updateDbWallet }) {
  const [manualWallet, setManualWallet] = React.useState('');
  if (!currentUser) return null;
  const roleMeta = ROLE_META[currentUser.role] || ROLE_META[ROLES.PUBLIC];

  return (
    <div className="card fade-in">
      <div className="section-header">
        <h2 className="section-title">
          <span className="section-title-icon">⚙️</span> Profile Settings
        </h2>
        <span className="badge" style={{ color: roleMeta.color, borderColor: roleMeta.color }}>
          <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '6px' }}>{roleMeta.icon}</span> {roleMeta.label}
        </span>
      </div>

      <div className="settings-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Account Details */}
        <div style={{ padding: '16px', background: 'var(--surface-light)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>Account Details</h3>
          <div className="form-row">
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Username / Email</label>
              <div style={{ padding: '10px 14px', background: 'var(--bg-dark)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                {currentUser.name}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Role</label>
              <div style={{ padding: '10px 14px', background: 'var(--bg-dark)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span style={{ textTransform: 'capitalize' }}>{currentUser.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Status (Orgs only) */}
        {currentUser.role === 'organization' && (
          <div style={{ padding: '16px', background: 'var(--surface-light)', borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${currentUser.verification_status === 'Approved' ? 'var(--success)' : 'var(--warning)'}` }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Organization Verification</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Your current approval status defines whether you can deploy campaigns on-chain.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--bg-dark)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span>Status:</span>
              <strong style={{ color: currentUser.verification_status === 'Approved' ? 'var(--success)' : 'var(--warning)' }}>
                {currentUser.verification_status || 'Pending'}
              </strong>
            </div>
          </div>
        )}

        {/* Web3 Wallet Association */}
        <div style={{ padding: '16px', background: 'var(--surface-light)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>Web3 Integration</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            The MetaMask wallet currently linked your session. This wallet is used as the cryptographic signature for all your transactions.
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {walletAddress ? (
              <div style={{ padding: '10px 16px', background: contract ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255, 150, 0, 0.1)', border: `1px solid ${contract ? 'var(--success)' : 'var(--warning)'}`, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <span style={{ fontSize: '1.2rem' }}>🦊</span>
                <div>
                  <div style={{ fontSize: '0.75rem', color: contract ? 'var(--success)' : 'var(--warning)' }}>
                     {contract ? 'Connected Wallet' : 'Database Locked (Mismatch Found)'}
                  </div>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{walletAddress}</strong>
                  {!contract && (
                     <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Your MetaMask needs to be set to this account to transact.
                     </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: '10px 16px', background: 'rgba(255, 78, 106, 0.05)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', flex: 1 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>No Web3 wallet connected.</div>
              </div>
            )}
            
            {walletAddress && !contract && (
              <button className="btn btn-primary glow pulse" onClick={() => handleConnectWallet(true)} style={{ flexShrink: 0 }}>
                🔄 Sync MetaMask
              </button>
            )}

            {walletAddress ? (
              <button className="btn btn-outline" onClick={async () => {
                if(window.confirm("Are you sure you want to unbind this MetaMask wallet from your profile?")) {
                  if (updateDbWallet) {
                    await updateDbWallet('');
                    window.location.reload();
                  }
                }
              }} style={{ flexShrink: 0, borderColor: 'var(--warning)', color: 'var(--warning)' }}>
                ✖ Disconnect
              </button>
            ) : (
              <button className="btn btn-outline" onClick={() => handleConnectWallet(true)} style={{ flexShrink: 0 }}>
                🔗 Connect MetaMask (Switch Account)
              </button>
            )}
          </div>
          
          <div style={{ padding: '16px', background: 'var(--bg-dark)', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(255,255,255,0.1)' }}>
             <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Manual System Override (Defense Test Mode)</label>
             <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" className="input" placeholder="Paste 0x... address to manually bind" value={manualWallet} onChange={e => setManualWallet(e.target.value)} style={{ flex: 1 }} />
                <button className="btn btn-primary" onClick={async () => {
                  if (manualWallet.startsWith('0x')) {
                     if(updateDbWallet) { 
                       await updateDbWallet(manualWallet.trim()); 
                       window.location.reload(); 
                     }
                  } else {
                     alert("Invalid format: Wallet addresses must start with 0x");
                  }
                }}>Link Manually</button>
             </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div style={{ padding: '16px', border: '1px solid rgba(255, 78, 106, 0.3)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--danger)' }}>Session Management</h3>
          <button className="btn btn-primary" onClick={handleLogout} style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}>
            Sign Out of Account
          </button>
        </div>

      </div>
    </div>
  );
}
