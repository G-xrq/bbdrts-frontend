import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { connectWallet } from './web3Connection';
import { ROLES, ROLE_META } from './roleConfig';
import LandingView from './views/LandingView';
import AuthView from './views/AuthView';
import DonorView from './views/DonorView';
import OrganizationView from './views/OrganizationView';
import AdminView from './views/AdminView';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function App() {
  const contractRef = useRef(null);

  /* ── Database Auth State (Web2) ─────────────────────── */
  const [dbUser, setDbUser] = useState(null); 
  // dbUser = { id, name, email, role, wallet_address }
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false); // Default to Landing Page!

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
      try {
        const res = await fetch(`${API_URL}/api/campaigns`);
        if (res.ok) {
          const data = await res.json();
          if (!contractRef.current && !contractOverride) {
            setCampaigns(data);
          }
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

      {/* ── Top Navigation Bar ── */}
      <nav className="topbar">
        <div className="container topbar-inner">
          
          <div className="topbar-brand" style={{ cursor: 'pointer' }} onClick={() => !dbUser && setShowAuth(false)}>
            <img src="/logo.png" alt="Logo" className="topbar-brand-logo" />
            <div className="topbar-brand-text">
               <span className="brand-title">BBDRTS</span>
               <span className="brand-subtitle">Relief Transparency</span>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="premium-badge testnet-badge">
              <span className="material-symbols-outlined icon-sm">shield_locked</span>
              <span>Sepolia Security</span>
            </div>

            {/* Public Navigation Buttons (When Unauthenticated) */}
            {!dbUser && !showAuth && (
              <button className="btn btn-primary" onClick={() => setShowAuth(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined icon-sm">login</span>
                <span>Log In / Register</span>
              </button>
            )}

            {!dbUser && showAuth && (
              <button className="btn btn-outline" onClick={() => setShowAuth(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined icon-sm">arrow_back</span>
                <span>Public Landing Page</span>
              </button>
            )}

            {/* Authenticated User Badges */}
            {dbUser && (
              <div className="premium-badge role-badge" style={{ color: roleMeta.color, borderColor: roleMeta.color, background: `${roleMeta.color}15` }}>
                <span className="material-symbols-outlined icon-sm">account_circle</span>
                <span>{roleMeta.label}</span>
              </div>
            )}

            {dbUser && !walletAddress && (
              <button className="btn btn-outline btn-connect pulse" onClick={handleConnectWallet}>
                <span className="material-symbols-outlined icon-sm">account_balance_wallet</span>
                <span>Connect Wallet</span>
              </button>
            )}

            {dbUser && walletAddress && (
              <div className="premium-badge wallet-pill pulse">
                <span className="material-symbols-outlined icon-sm wallet-icon">account_balance_wallet</span>
                <span className="wallet-pill-addr">{walletAddress}</span>
              </div>
            )}

            {dbUser && (
              <button className="btn btn-icon btn-logout" onClick={handleLogout} title="Sign Out">
                 <span className="material-symbols-outlined">logout</span>
              </button>
            )}
          </div>
        </div>
      </nav>

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