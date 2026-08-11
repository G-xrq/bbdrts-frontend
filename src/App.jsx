import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { connectWallet } from './web3Connection';
import { ROLES, ROLE_META } from './roleConfig';
import LandingView from './views/LandingView';
import AuthView from './views/AuthView';
import DonorView from './views/DonorView';
import OrganizationView from './views/OrganizationView';
import AdminView from './views/AdminView';
import SettingsPanel from './components/SettingsPanel';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function App() {
  const contractRef = useRef(null);

  /* ── Database Auth State (Web2) ─────────────────────── */
  const [dbUser, setDbUser] = useState(null); 
  // dbUser = { id, name, email, role, wallet_address }
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false); // Default to Landing Page!
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  /* ── Wallet State (Web3) ────────────────────────────── */
  const [walletAddress, setWalletAddress] = useState('');
  const [hasMetaMask, setHasMetaMask]     = useState(true);
  const [activeContract, setActiveContract] = useState(null);

  const [campaigns, setCampaigns]             = useState([]);
  const [fetchingCampaigns, setFetchingCampaigns] = useState(false);

  /* ── 1. Init Session & Check MetaMask ───────────────── */
  useEffect(() => {
    setHasMetaMask(Boolean(window.ethereum));
    
    const token = localStorage.getItem('bbdrts_token');
    if (token) {
      fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setDbUser(data.user);
            if (data.user.wallet_address) {
              setWalletAddress(data.user.wallet_address);
            }
          }
        })
        .catch(err => console.error('Session restore failed:', err))
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  /* ── 2. Handle Wallet Changes ───────────────────────── */
  useEffect(() => {
    if (!window.ethereum) return;
    const onChange = async (accounts) => {
      if (accounts.length === 0) {
        setWalletAddress('');
        contractRef.current = null;
        setActiveContract(null);
      } else {
        try {
          const { contract } = await connectWallet();
          contractRef.current = contract;
          setActiveContract(contract);
          setWalletAddress(accounts[0]);
          fetchCampaigns(contract);
        } catch (err) {
          console.error('Account change error:', err);
        }
      }
    };
    window.ethereum.on('accountsChanged', onChange);

    if (dbUser && dbUser.wallet_address) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(async accounts => {
          if (accounts.length > 0 && accounts[0].toLowerCase() === dbUser.wallet_address.toLowerCase()) {
             try {
                const { hydrateContract } = await import('./web3Connection.js');
                const contract = await hydrateContract();
                contractRef.current = contract;
                setActiveContract(contract);
                fetchCampaigns(contract);
             } catch (e) {
                console.warn("Silent contract hydration prevented by MetaMask:", e);
             }
          }
        });
    }

    return () => window.ethereum.removeListener('accountsChanged', onChange);
  }, [dbUser]);

  /* ── Update DB with connected wallet ────────────────── */
  const updateDbWallet = async (address) => {
    if (!dbUser || dbUser.wallet_address === address) return;
    const token = localStorage.getItem('bbdrts_token');
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/auth/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ wallet_address: address })
      });
      setDbUser(prev => ({ ...prev, wallet_address: address }));
    } catch (err) {
      console.error('Failed to link wallet to DB Profile:', err);
    }
  };

  /* ── 3. Actions ─────────────────────────────────────── */
  const handleConnectWallet = async (forcePrompt = false) => {
    try {
      const { signer, contract } = await connectWallet(forcePrompt);
      contractRef.current = contract;
      setActiveContract(contract);
      const addr = await signer.getAddress();
      setWalletAddress(addr);
      fetchCampaigns(contract);
      updateDbWallet(addr);
    } catch (err) {
      console.error('Wallet connection failed:', err);
      if (err.message?.includes('MetaMask')) setHasMetaMask(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bbdrts_token');
    setDbUser(null);
    setShowAuth(false);
    setWalletAddress('');
    contractRef.current = null;
    setActiveContract(null);
  };

  /* ── 4. Fetch campaigns ──────────────────────────────── */
  const fetchCampaigns = async (contractOverride) => {
    try {
      setFetchingCampaigns(true);
      let dbCampaigns = [];
      try {
        const res = await fetch(`${API_URL}/api/campaigns`);
        if (res.ok) {
          dbCampaigns = await res.json();
        }
      } catch (e) {
        console.error('Offline DB Sync failed:', e);
      }
      
      const contract = contractOverride || contractRef.current;
      if (contract) {
        const count = Number(await contract.campaignCount());
        const fetched = [];
        for (let i = 1; i <= count; i++) {
          const c = await contract.campaigns(i);
          const cleanContractTitle = (c[1] || '').trim().toLowerCase();
          const dbCamp = dbCampaigns.find(d => 
            (d.title && d.title.trim().toLowerCase() === cleanContractTitle) ||
            String(d.id) === String(i)
          ) || dbCampaigns[i - 1] || {};

          fetched.push({
            ...dbCamp,
            id: i,
            orgAddress: c[0] || dbCamp.orgAddress,
            title: c[1] || dbCamp.title,
            targetAmount: ethers.formatEther(c[2]),
            currentAmount: ethers.formatEther(c[3]),
            isActive: c[4],
          });
        }
        setCampaigns(fetched);
      } else {
        setCampaigns(dbCampaigns);
      }
    } catch (err) {
      console.error('Campaign sync error:', err);
    } finally {
      setFetchingCampaigns(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  if (authLoading) {
    return (
      <div className="app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner" style={{ width: 40, height: 40, transform: 'scale(1.5)' }} />
      </div>
    );
  }

  const uiRole = dbUser?.role || ROLES.PUBLIC;
  const roleMeta = ROLE_META[uiRole];
  
  const sharedProps = {
    contract: activeContract,
    walletAddress,
    role: uiRole,
    campaigns,
    fetchCampaigns,
    fetchingCampaigns,
    currentUser: dbUser,
    handleConnectWallet,
    handleLogout,
    updateDbWallet
  };

  return (
    <div className="app">

      {/* ── Enrollment System 2-Tier Stacked Header ── */}
      <header className="es-header">
        <div className="container es-logo-header">
          <div className="es-logo-container" onClick={() => !dbUser && setShowAuth(false)} style={{ cursor: 'pointer' }}>
            <img src="/logo.png" alt="BBDRTS Logo" className="es-logo-pic" />
            <div className="es-name-subtitle">
              <span className="es-brand-title">BBDRTS</span>
              <span className="es-logo-subtitle">Disaster Relief Transparency System.</span>
            </div>
          </div>

          <div className="es-search-login">
            {dbUser ? (() => {
              // Sanitize name: if name contains '@' or is unformatted, format with proper spaces
              let userDisplayName = dbUser.name;
              if (!userDisplayName || userDisplayName.includes('@')) {
                const handle = dbUser.email ? dbUser.email.split('@')[0] : 'User';
                if (handle.toLowerCase() === 'gestermacaldo') {
                  userDisplayName = 'Gester Macaldo';
                } else {
                  userDisplayName = handle.replace(/[\._]/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                }
              }
              const userInitials = userDisplayName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();

              return (
                <div className={`profile-section ${isProfileOpen ? 'active' : ''}`} onClick={() => setIsProfileOpen(!isProfileOpen)}>
                  <span className="student-name">{userDisplayName}</span>
                  <div className="profile-picture-wrapper">
                    <div className="profile-initial">{userInitials}</div>
                    <span className="material-symbols-outlined dropdown-arrow">expand_more</span>
                  </div>

                  <div className="profile-dropdown" onClick={e => e.stopPropagation()}>
                    {/* 👤 Account Header matching Reference UI */}
                    <div className="profile-info" style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', marginBottom: '2px' }}>{userDisplayName}</div>
                      <div style={{ color: '#9ca3af', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                        BBDRTS-{dbUser.role ? dbUser.role.toUpperCase() : 'USER'}-2026-0001
                      </div>
                    </div>

                    {/* 📋 Navigation & Actions Group */}
                    <div className="profile-menu-links" style={{ padding: '6px 0' }}>
                      <a href="#" onClick={(e) => { e.preventDefault(); setIsProfileOpen(false); }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>space_dashboard</span>
                        <span>Dashboard</span>
                      </a>
                      <a href="#" onClick={(e) => { e.preventDefault(); setShowSettingsModal(true); setIsProfileOpen(false); }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>manage_accounts</span>
                        <span>Edit Profile & Settings</span>
                      </a>
                      <a href="#campaigns" onClick={() => setIsProfileOpen(false)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>volunteer_activism</span>
                        <span>Relief Campaigns</span>
                      </a>
                      <a href="https://sepolia.etherscan.io" target="_blank" rel="noopener noreferrer">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>analytics</span>
                        <span>Public Ledger Reports</span>
                      </a>
                      {!walletAddress ? (
                        <a href="#" onClick={(e) => { e.preventDefault(); handleConnectWallet(); }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#38bdf8' }}>account_balance_wallet</span>
                          <span>Connect Web3 Wallet</span>
                        </a>
                      ) : (
                        <div style={{ padding: '8px 16px', fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span>
                            <span>{walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}</span>
                          </div>
                          <span style={{ fontSize: '0.7rem', color: '#64748b', background: '#1e293b', padding: '1px 6px', borderRadius: '4px' }}>Sepolia</span>
                        </div>
                      )}
                    </div>

                    {/* 🚪 Reference Logout Section with Red Accent */}
                    <div style={{ padding: '6px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); setIsProfileOpen(false); }} className="logout-link" style={{ color: '#ef4444', borderRadius: '8px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.08)' }}>
                        <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: '18px' }}>logout</span>
                        <span style={{ fontWeight: 600 }}>Logout</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="es-login">
                <button className="es-auth-btn" onClick={() => setShowAuth(!showAuth)}>
                  <i className="material-symbols-outlined" style={{ fontSize: '18px' }}>{showAuth ? 'arrow_back' : 'login'}</i>
                  <span>{showAuth ? 'Landing Page' : 'Portal Login'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Sticky Bottom Header Navigation Strip (Enrollment System Style) ── */}
      <div className="es-header-navigation">
        <div className="container es-nav-container">
          <div className="es-navigation">
            <a href="#top" className="es-nav-link active">Home</a>
            <a href="#features" className="es-nav-link">Architecture <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>▾</span></a>
            <a href="#campaigns" className="es-nav-link">Relief Causes <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>▾</span></a>
            <a href="https://sepolia.etherscan.io" target="_blank" rel="noreferrer" className="es-nav-link">Public Ledger <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>▾</span></a>
            <a href="#footer" className="es-nav-link">System Verification <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>▾</span></a>
          </div>

          <div className="es-enroll">
            {!walletAddress ? (
              <button className="es-enroll-btn" onClick={() => handleConnectWallet()}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>account_balance_wallet</span>
                <span>Connect Web3 Wallet</span>
              </button>
            ) : (
              <div className="es-wallet-pill">
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#10b981' }}>verified</span>
                <span>Sepolia: {walletAddress.substring(0, 6)}...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Unauthenticated Views: Default Landing Page vs Auth Portal ── */}
      {!dbUser && !showAuth && (
        <LandingView 
          onConnect={() => setShowAuth(true)} 
          hasMetaMask={hasMetaMask} 
        />
      )}

      {!dbUser && showAuth && (
        <AuthView onLoginSuccess={(user) => {
          setDbUser(user);
          if (user.wallet_address) setWalletAddress(user.wallet_address);
        }} />
      )}

      {/* ── Role-based Dashboards (Require Wallet for Actions) ── */}
      {dbUser && (
        <>
          {/* Global requirement to connect wallet if they are signed into the DB but have no active Web3 session */}
          {!walletAddress && (
            <div className="container" style={{ marginTop: '20px' }}>
              <div className="metamask-alert-banner">
                <span className="material-symbols-outlined metamask-icon">warning</span>
                <div className="metamask-alert-content">
                  <strong>MetaMask Required for Financial Actions</strong>
                  <span>You are signed securely into your account ({dbUser.email}), but to deploy campaigns or make donations, you must connect your Web3 wallet.</span>
                </div>
                <button className="btn btn-primary btn-sm metamask-connect-btn" onClick={handleConnectWallet}>
                  <span className="material-symbols-outlined icon-sm">link</span>
                  Connect MetaMask
                </button>
              </div>
            </div>
          )}

          {uiRole === ROLES.ADMIN && <AdminView {...sharedProps} />}
          {uiRole === ROLES.ORGANIZATION && <OrganizationView {...sharedProps} />}
          {uiRole === ROLES.DONOR && <DonorView {...sharedProps} />}
        </>
      )}

      {/* ── Account Settings Modal Overlay ── */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)} style={{ zIndex: 10000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px', width: '90%', background: '#131622', border: '1px solid #242a3c', borderRadius: '16px', padding: '24px', position: 'relative' }}>
            <button 
              onClick={() => setShowSettingsModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}
            >
              ×
            </button>
            <SettingsPanel
              contract={activeContract}
              currentUser={dbUser}
              walletAddress={walletAddress}
              handleConnectWallet={handleConnectWallet}
              handleLogout={handleLogout}
              updateDbWallet={updateDbWallet}
            />
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="footer" style={{ marginTop: 'auto' }}>
        <div className="container">
          <div className="footer-logo">
            <div className="topbar-logo-dot" style={{ width: 7, height: 7 }} />
            <span>BBDRTS System</span>
          </div>
          <p className="footer-text" style={{ marginTop: '10px' }}>
            <span>Hybrid Web2/Web3 Authenticated Environment</span><br />
            College of Computer Studies · Saint Joseph College · Maasin City, Southern Leyte<br />
          </p>
        </div>
      </footer>

    </div>
  );
}