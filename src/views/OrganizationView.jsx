import { useState } from 'react';
import { ethers } from 'ethers';
import CampaignCard from '../components/CampaignCard';
import { ROLES } from '../roleConfig';
import { shortAddr } from '../components/CampaignCard';

import SettingsPanel from '../components/SettingsPanel';

export default function OrganizationView({ contract, walletAddress, campaigns, fetchCampaigns, fetchingCampaigns, currentUser, handleConnectWallet, handleLogout, updateDbWallet }) {
  const [activeTab, setActiveTab] = useState('all-campaigns');

  // Create campaign form
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [creating, setCreating] = useState(false);
  const [txModal, setTxModal] = useState({ show: false, step: 0, hash: '', type: '', error: '' });

  const myCampaigns = campaigns.filter(
    (c) => c.orgAddress?.toLowerCase() === walletAddress?.toLowerCase()
  );

  const totalRaisedByMe = myCampaigns
    .reduce((s, c) => s + parseFloat(c.currentAmount || 0), 0)
    .toFixed(4);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) return setTxModal({ show: true, step: 0, error: 'Please enter a campaign title.' });
    const parsed = parseFloat(targetAmount);
    if (isNaN(parsed) || parsed <= 0)
      return setTxModal({ show: true, step: 0, error: 'Please enter a valid target amount greater than 0 ETH.' });
    if (!contract)
      return setTxModal({ show: true, step: 0, error: 'ACTION BLOCKED: You are not actively connected to MetaMask on this specific wallet address. Please go to Profile & Settings and click Connect MetaMask.' });
    
    try {
      setCreating(true);
      const targetInWei = ethers.parseEther(targetAmount);
      
      setTxModal({ show: true, step: 1, hash: '', type: 'CREATE', error: '' });
      const tx = await contract.createCampaign(title.trim(), targetInWei);
      
      setTxModal({ show: true, step: 2, hash: tx.hash, type: 'CREATE', error: '' });
      await tx.wait();

      try {
        const token = localStorage.getItem('bbdrts_token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        await fetch(`${apiUrl}/api/campaigns`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: title.trim(),
            target_amount: targetAmount,
            contract_address: Object(contract).target || 'Pending'
          })
        });
      } catch (err) {
        console.error("Failed to sync campaign to backend:", err);
      }

      setTxModal({ show: true, step: 3, hash: tx.hash, type: 'CREATE', error: '' });
      setTitle('');
      setTargetAmount('');
      fetchCampaigns();
    } catch (err) {
      console.error(err);
      if (err.code !== 'ACTION_REJECTED') {
        let errMsg = err.reason || err.shortMessage || err.message || 'Please check MetaMask.';
        if (typeof errMsg === 'string' && (errMsg.includes('missing revert data') || errMsg.includes('CALL_EXCEPTION'))) {
          errMsg = 'Transaction reverted by the network. Ensure you have sufficient SepoliaETH to deploy this contract.';
        }
        setTxModal({ show: true, step: 0, error: `Transaction failed: ${errMsg}` });
      } else {
        setTxModal({ show: false, step: 0, hash: '', type: '', error: '' });
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="dashboard">
      <div className="container">

        {/* Testnet Banner */}
        <div className="testnet-banner">
          <span>🔬</span>
          <span>
            <strong>Sepolia Testnet</strong> — Transactions use test ETH with no real monetary value.{' '}
            <a href="https://sepoliafaucet.com/" target="_blank" rel="noreferrer"
              style={{ color: 'var(--info)', textDecoration: 'underline' }}>
              Get Sepolia ETH →
            </a>
          </span>
        </div>

        {/* My Campaign Summary */}
        {myCampaigns.length > 0 && (
          <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-card-value">{myCampaigns.length}</div>
              <div className="stat-card-label">My Campaigns</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{myCampaigns.filter(c => c.isActive).length}</div>
              <div className="stat-card-label">Active</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value accent">{totalRaisedByMe} <span style={{ fontSize: '0.9rem' }}>ETH</span></div>
              <div className="stat-card-label">Total Raised</div>
            </div>
          </div>
        )}

        {/* Tab Bar */}
        <div className="tab-bar">
          <button className={`tab-btn ${activeTab === 'all-campaigns' ? 'active' : ''}`}
            onClick={() => setActiveTab('all-campaigns')}>
            <span className="material-symbols-outlined icon-sm" style={{marginRight: '6px'}}>list_alt</span> All Campaigns
          </button>
          <button className={`tab-btn ${activeTab === 'my-campaigns' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-campaigns')}>
            <span className="material-symbols-outlined icon-sm" style={{marginRight: '6px'}}>account_balance</span> My Campaigns
            {myCampaigns.length > 0 && (
              <span className="tab-count">{myCampaigns.length}</span>
            )}
          </button>
          <button className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}>
            <span className="material-symbols-outlined icon-sm" style={{marginRight: '6px'}}>rocket_launch</span> Create Campaign
          </button>
          <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}>
            <span className="material-symbols-outlined icon-sm" style={{marginRight: '6px'}}>settings</span> Profile & Settings
          </button>
        </div>

        {/* ── All Campaigns Tab ── */}
        {activeTab === 'all-campaigns' && (
          <div>
            <div className="section-header">
              <h2 className="section-title">
                <span className="material-symbols-outlined section-title-icon" style={{marginRight: '8px'}}>list_alt</span> All Relief Campaigns
              </h2>
              {campaigns.length > 0 && <span className="section-count">{campaigns.length} on ledger</span>}
              <button className="btn btn-ghost btn-sm" onClick={fetchCampaigns} disabled={fetchingCampaigns}>
                {fetchingCampaigns ? <div className="spinner spinner-light" /> : '↻ Refresh'}
              </button>
            </div>
            {campaigns.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <div className="empty-title">No campaigns on the ledger yet</div>
                <div className="empty-desc">Deploy your first campaign from the "Create Campaign" tab.</div>
              </div>
            ) : (
              <div className="campaigns-list">
                {campaigns.map((camp) => (
                  <CampaignCard key={camp.id} camp={camp} contract={contract}
                    role={ROLES.ORGANIZATION} walletAddress={walletAddress} onDonated={fetchCampaigns} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── My Campaigns Tab ── */}
        {activeTab === 'my-campaigns' && (
          <div>
            <div className="section-header">
              <h2 className="section-title">
                <span className="material-symbols-outlined section-title-icon" style={{marginRight: '8px'}}>account_balance</span> My Campaigns
              </h2>
              <span className="section-count" style={{ color: 'var(--text-muted)' }}>
                Org: {shortAddr(walletAddress)}
              </span>
            </div>
            {myCampaigns.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🚀</div>
                <div className="empty-title">You haven't created any campaigns yet</div>
                <div className="empty-desc">
                  Switch to the "Create Campaign" tab to deploy your first relief campaign.
                </div>
              </div>
            ) : (
              <div className="campaigns-list">
                {myCampaigns.map((camp) => (
                  <CampaignCard key={camp.id} camp={camp} contract={contract}
                    role={ROLES.ORGANIZATION} walletAddress={walletAddress} onDonated={fetchCampaigns} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Create Campaign Tab ── */}
        {activeTab === 'create' && (
          <div>
            {currentUser?.verification_status !== 'Approved' ? (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', textAlign: 'center', border: '1px solid rgba(255, 60, 60, 0.4)', background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255, 60, 60, 0.05) 100%)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '56px', color: 'var(--danger)', marginBottom: '16px' }}>gpp_bad</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)', marginBottom: '12px' }}>Action Blocked: Pending Verification</h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '550px', lineHeight: '1.6', fontSize: '1.05rem' }}>
                  Your Organization account must be manually verified and <strong>Approved by an Admin</strong> before you are allowed to deploy relief campaigns permanently onto the blockchain.
                </p>
                <div style={{ marginTop: '24px', padding: '12px 24px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    Please check back later or contact the system administrator to expedite your approval.
                  </p>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="section-header">
                  <h2 className="section-title">
                    <span className="material-symbols-outlined section-title-icon" style={{marginRight: '8px'}}>rocket_launch</span> Deploy Relief Campaign
                  </h2>
                  <span className="badge badge-info">Organization Portal</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
                  Deploy a new campaign as your organization. This creates an immutable on-chain record
                  linked to your wallet address (<code style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>{shortAddr(walletAddress)}</code>).
                </p>
                <form className="create-form" onSubmit={handleCreateCampaign}>
                  <input className="input" type="text"
                    placeholder="Campaign title — e.g., Typhoon Odette Relief, CCS Emergency Fund"
                    value={title} onChange={(e) => setTitle(e.target.value)} disabled={creating} />
                  <div className="form-row">
                    <input className="input" type="number" step="0.001" min="0"
                      placeholder="Fundraising target in ETH — e.g., 0.5"
                      value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} disabled={creating} />
                    <button type="submit" className="btn btn-primary" disabled={creating} style={{ flexShrink: 0 }}>
                      {creating ? <><div className="spinner" /> Processing…</> : '+ Deploy Campaign'}
                    </button>
                  </div>
                  <p className="form-hint">
                    ⚠️ Deploying requires a MetaMask confirmation and a small Sepolia gas fee.
                    Records cannot be deleted or altered once on-chain.
                  </p>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ── Settings Tab ── */}
        {activeTab === 'settings' && (
          <SettingsPanel 
            contract={contract}
            currentUser={currentUser} 
            walletAddress={walletAddress} 
            handleConnectWallet={handleConnectWallet} 
            handleLogout={handleLogout} 
            updateDbWallet={updateDbWallet}
          />
        )}

        {/* ── Transaction Modal (On-Chain Syncer & Validation) ── */}
        {txModal.show && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(5, 7, 12, 0.75)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
          }} className="fade-in">
            <div className="card bounce-in" style={{ width: '420px', padding: '24px', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', borderRadius: '16px' }}>
              
              {txModal.step === 0 && (
                <div className="fade-in">
                  <h2 style={{marginTop:0, marginBottom:'20px', display:'flex', alignItems:'center', fontSize: '1.2rem', color: 'var(--text)'}}>
                    <span className="material-symbols-outlined" style={{marginRight:'8px', color: 'var(--danger)'}}>error</span> 
                    Action Blocked
                  </h2>
                  <p style={{color:'var(--text-secondary)', fontSize:'0.9rem', marginBottom:'24px', lineHeight:'1.5'}}>
                    {txModal.error}
                  </p>
                  <button className="btn btn-primary btn-full pulse" onClick={() => setTxModal({ show: false, step: 0, hash: '', type: '', error: '' })}>Understood</button>
                </div>
              )}

              {txModal.step === 1 && (
                <div className="fade-in" style={{textAlign:'center', padding:'40px 0'}}>
                   <div className="spinner" style={{width:'40px', height:'40px', margin:'0 auto 20px', borderColor:'var(--primary)', borderRightColor:'transparent'}}></div>
                   <h3 style={{marginBottom:'8px', color: 'var(--text)'}}>Awaiting Signature</h3>
                   <p style={{color:'var(--text-muted)', fontSize:'0.85rem'}}>Please open MetaMask and securely sign the transaction to deploy your new campaign.</p>
                </div>
              )}

              {txModal.step === 2 && (
                <div className="fade-in" style={{textAlign:'center', padding:'40px 0'}}>
                   <div className="spinner" style={{width:'40px', height:'40px', margin:'0 auto 20px', borderColor:'var(--secondary)', borderRightColor:'transparent'}}></div>
                   <h3 style={{marginBottom:'8px', color: 'var(--text)'}}>Deploying Campaign</h3>
                   <p style={{color:'var(--text-muted)', fontSize:'0.85rem', marginBottom: '20px'}}>Mining your structural contract across the Sepolia network.</p>
                   <div style={{padding:'10px', background:'rgba(0,0,0,0.3)', borderRadius:'8px', fontSize:'0.75rem', wordBreak:'break-all', border: '1px solid rgba(255,255,255,0.05)'}}>
                     <span style={{color:'var(--text-secondary)', display:'block', marginBottom:'4px'}}>Transaction Hash:</span> 
                     {txModal.hash}
                   </div>
                </div>
              )}

              {txModal.step === 3 && (
                <div className="fade-in" style={{textAlign:'center', padding:'20px 0 10px'}}>
                   <div className="success-circle-container">
                      <span className="material-symbols-outlined check-icon-pop" style={{fontSize: '2.5rem', color: 'var(--success)'}}>check</span>
                   </div>
                   <h3 style={{marginBottom:'8px', color: 'var(--text)'}}>Deployment Successful!</h3>
                   <p style={{color:'var(--text-muted)', fontSize:'0.85rem'}}>
                     Your relief campaign has been permanently deployed on the immutable blockchain.
                   </p>
                   <div style={{margin:'24px 0', padding:'16px', background:'rgba(0,0,0,0.2)', borderRadius:'8px', textAlign:'left', border: '1px solid rgba(0,255,100,0.1)'}}>
                      <div style={{fontSize:'0.75rem', color:'var(--text-secondary)', marginBottom:'8px'}}>Verified Block Receipt</div>
                      <a href={`https://sepolia.etherscan.io/tx/${txModal.hash}`} target="_blank" rel="noreferrer" style={{color:'var(--success)', textDecoration:'none', wordBreak:'break-all', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'6px'}}>
                        <span className="material-symbols-outlined" style={{fontSize:'1rem'}}>open_in_new</span> {txModal.hash.slice(0,20)}...
                      </a>
                   </div>
                   <button className="btn btn-primary btn-full pulse" onClick={() => { setTxModal({ show: false, step: 0, hash: '', type: '', error: '' }); setActiveTab('my-campaigns'); }}>Complete</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
