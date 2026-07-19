import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ethers } from 'ethers';
import { ROLES } from '../roleConfig';

const SEPOLIA_EXPLORER = 'https://sepolia.etherscan.io/tx/';

export const shortAddr = (addr) =>
  addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';

export const progressPct = (current, target) => {
  const c = parseFloat(current);
  const t = parseFloat(target);
  if (!t) return 0;
  return Math.min(100, ((c / t) * 100).toFixed(1));
};

export default function CampaignCard({ camp, contract, role, walletAddress, onDonated, onDeactivated }) {
  const [amount, setAmount] = useState('');
  const [deactivating, setDeactivating] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [donateStep, setDonateStep] = useState(1);
  const [customMsg, setCustomMsg] = useState('');
  const [txHash, setTxHash] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [legalConfirm, setLegalConfirm] = useState(false);
  const [deactivateModal, setDeactivateModal] = useState({ show: false, step: 0, hash: '', error: '' });

  const isPublic  = role === ROLES.PUBLIC;
  const canDonate = (role === ROLES.DONOR || role === ROLES.ORGANIZATION) && camp.isActive;
  const pct       = progressPct(camp.currentAmount, camp.targetAmount);

  // Who can deactivate?
  // Admin → any campaign; Moderator → only their own
  const isOwner = walletAddress?.toLowerCase() === camp.orgAddress?.toLowerCase();
  const canDeactivate =
    camp.isActive &&
    Boolean(contract) &&
    (role === ROLES.ADMIN || (role === ROLES.ORGANIZATION && isOwner));

  /* ── Checkout Modal Logic ─────────────────────── */
  const handleOpenCheckout = () => {
    if (!contract) {
      return alert("ACTION BLOCKED: MetaMask is not actively connected to this test account. Please click Connect MetaMask in Profile Settings.");
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0)
      return alert('Please enter a valid ETH amount greater than 0.');
    setDonateStep(1);
    setCustomMsg('');
    setTxHash('');
    setIsAnonymous(false);
    setLegalConfirm(false);
    setModalOpen(true);
  };

  const handleConfirmDonate = async () => {
    try {
      setDonateStep(2); // Signature Phase
      const parsed = parseFloat(amount);
      const wei = ethers.parseEther(String(parsed));
      const msg = customMsg.trim() || 'Verified Web Portal Transaction';

      const tx = await contract.donateToCampaign(camp.id, msg, { value: wei });
      
      setDonateStep(3); // Mining Phase
      setTxHash(tx.hash);
      await tx.wait();

      try {
        const token = localStorage.getItem('bbdrts_token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        await fetch(`${apiUrl}/api/donations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            campaign_id: Number(camp.id),
            tx_hash: tx.hash,
            amount: parsed,
            is_anonymous: isAnonymous
          })
        });
      } catch (err) {
        console.error("Failed to sync donation to backend:", err);
      }

      setDonateStep(4); // Success Phase
      onDonated?.();
      if (ledgerOpen) fetchHistory(true);
    } catch (err) {
      console.error(err);
      if (err.code !== 'ACTION_REJECTED') {
        let errMsg = err.reason || err.shortMessage || err.message;
        if (typeof errMsg === 'string' && (errMsg.includes('missing revert data') || errMsg.includes('CALL_EXCEPTION'))) {
          errMsg = 'Transaction reverted by the network. This usually means you have insufficient SepoliaETH for gas/value, or the contract rejected the amount.';
        }
        setModalOpen(false);
        setDeactivateModal({ show: true, step: 5, hash: '', error: `Donation failed: ${errMsg}` });
      } else {
        setModalOpen(false);
      }
    }
  };

  /* ── Deactivate Campaign ──────────────────────── */
  const triggerDeactivate = () => {
    setDeactivateModal({ show: true, step: 1, hash: '', error: '' });
  };

  const handleDeactivate = async () => {
    try {
      setDeactivating(true);
      setDeactivateModal({ show: true, step: 2, hash: '', error: '' });
      const tx = await contract.deactivateCampaign(camp.id);
      
      setDeactivateModal({ show: true, step: 3, hash: tx.hash, error: '' });
      await tx.wait();
      
      setDeactivateModal({ show: true, step: 4, hash: tx.hash, error: '' });
      onDeactivated?.();
    } catch (err) {
      console.error(err);
      if (err.code !== 'ACTION_REJECTED') {
        setDeactivateModal({ show: true, step: 5, hash: '', error: `Deactivation failed: ${err.reason || err.message}` });
      } else {
        setDeactivateModal({ show: false, step: 0, hash: '', error: '' });
      }
    } finally {
      setDeactivating(false);
    }
  };

  /* ── Ledger ───────────────────────────────────── */
  const fetchHistory = async (force = false) => {
    if (!force && history !== null) return;
    try {
      setHistoryLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/campaigns/${camp.id}/donations`);
      if (res.ok) {
        const data = await res.json();
        const list = data.map((d) => ({
          donor: d.Is_Anonymous ? '🕵️ Anonymous' : (d.donorName || 'Unregistered Wallet'),
          wallet: d.wallet,
          isAnonymous: Boolean(d.Is_Anonymous),
          amount: parseFloat(d.Amount).toFixed(4),
          txHash: d.Tx_Hash,
        }));
        setHistory(list);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error('Ledger fetch error (DB API):', err);
      if (!history) setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleLedger = () => {
    const opening = !ledgerOpen;
    setLedgerOpen(opening);
    if (opening) fetchHistory();
  };

  /* ── Render ───────────────────────────────────── */
  return (
    <div className="card glow campaign-card fade-in">
      <div className="campaign-card-body">

        {/* ── Left: Info ── */}
        <div className="campaign-info">
          <div className="campaign-title-row">
            <h3 className="campaign-title">{camp.title}</h3>
            <span className={`badge ${camp.isActive ? 'badge-active' : 'badge-closed'}`}>
              {camp.isActive ? '● Active' : '● Closed'}
            </span>
            {isOwner && role !== ROLES.DONOR && (
              <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                Your Campaign
              </span>
            )}
          </div>

          <div className="campaign-org">
            <span>🏛</span>
            <span className="campaign-org-addr" title={camp.orgAddress}>
              Managing Org: {shortAddr(camp.orgAddress)}
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ marginTop: '12px' }}>
            <div className="progress-wrap">
              <div
                className={`progress-bar ${parseFloat(pct) >= 100 ? 'full' : ''}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {camp.currentAmount} ETH of {camp.targetAmount} ETH goal
              </span>
              <span className="progress-pct">{pct}% funded</span>
            </div>
          </div>

          <div className="campaign-amounts">
            <div className="amount-block">
              <span className="amount-label">Raised</span>
              <span className="amount-value accent">{camp.currentAmount} ETH</span>
            </div>
            <div className="amount-block">
              <span className="amount-label">Target</span>
              <span className="amount-value">{camp.targetAmount} ETH</span>
            </div>
            <div className="amount-block">
              <span className="amount-label">Campaign ID</span>
              <span className="amount-value" style={{ color: 'var(--text-secondary)' }}>
                #{camp.id}
              </span>
            </div>
          </div>
        </div>

        {/* ── Right: Actions ── */}
        <div className="campaign-actions">
          {isPublic ? (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px' }}>
              Connect MetaMask to donate to this campaign.
            </p>
          ) : role === ROLES.ADMIN ? (
            <p style={{ fontSize: '0.78rem', color: 'var(--warning)', textAlign: 'center', padding: '8px', border: '1px solid rgba(255,180,0,0.2)', borderRadius: '8px', background: 'rgba(255,180,0,0.05)' }}>
              Administrative accounts cannot execute financial transactions. Switch to a Donor or NGO account.
            </p>
          ) : (
            <>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Wallet-to-wallet — no intermediaries, no gateway fees.
              </p>
              <div className="donate-row">
                <input
                  className="input donate-input"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="Amount (ETH)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!canDonate}
                />
                <button
                  className="btn btn-primary donate-btn"
                  onClick={handleOpenCheckout}
                  disabled={!canDonate}
                >
                  💙 Donate
                </button>
              </div>
              {!camp.isActive && (
                <p style={{ fontSize: '0.74rem', color: 'var(--danger)', textAlign: 'center' }}>
                  This campaign is closed to donations.
                </p>
              )}
            </>
          )}

          <button className="btn btn-outline btn-sm btn-full" onClick={toggleLedger}>
            {ledgerOpen ? '▲ Hide Public Ledger' : '▼ View Public Ledger'}
          </button>

          {/* Deactivate button — only for eligible roles */}
          {canDeactivate && (
            <button
              className="btn btn-ghost btn-sm btn-full"
              onClick={triggerDeactivate}
              disabled={deactivating}
              style={{ color: 'var(--danger)', borderColor: 'rgba(255,78,106,0.3)', marginTop: '4px' }}
            >
              {deactivating ? <><div className="spinner" /> Confirming…</> : '🔴 Deactivate Campaign'}
            </button>
          )}
        </div>
      </div>

      {/* ── Ledger Panel ── */}
      {ledgerOpen && (
        <div className="ledger-panel">
          <div className="ledger-header">
            📜 Public Transaction Ledger — Campaign #{camp.id}
            <span className="ledger-header-note">
              Each entry is a tamper-proof digital receipt verifiable on Sepolia Etherscan.
            </span>
          </div>

          {historyLoading ? (
            <div className="ledger-empty">
              <div className="spinner spinner-light" />
              <span>Querying Sepolia blockchain events…</span>
            </div>
          ) : !history || history.length === 0 ? (
            <div className="ledger-empty">
              <span style={{ fontSize: '1.4rem' }}>📭</span>
              <span>No donations recorded for this campaign yet.</span>
            </div>
          ) : (
            <div className="ledger-list">
              {history.map((rec, idx) => (
                <div key={idx} className="ledger-item">
                  <div className="ledger-field">
                    <span className="ledger-label">Donor</span>
                    <span className="ledger-value" title={rec.wallet}>
                      {rec.donor} {rec.wallet && !rec.isAnonymous && <span style={{fontSize:'0.7rem', color:'var(--text-muted)'}}><br/>{shortAddr(rec.wallet)}</span>}
                    </span>
                  </div>
                  <div className="ledger-field">
                    <span className="ledger-label">Amount Donated</span>
                    <span className="ledger-value accent">{rec.amount} ETH</span>
                  </div>
                  <div className="ledger-field full">
                    <span className="ledger-label">🔗 Digital Receipt (TX Hash — Blockchain Proof)</span>
                    <a href={`${SEPOLIA_EXPLORER}${rec.txHash}`}
                      target="_blank" rel="noreferrer" className="ledger-tx-link">
                      {rec.txHash} ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Premium Checkout Modal ── */}
      {modalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(5, 7, 12, 0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
        }} className="fade-in">
          
          <div className="card bounce-in" style={{ width: '420px', padding: '24px', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', borderRadius: '16px' }}>
            
            {donateStep === 1 && (
               <div className="fade-in">
                 <h2 style={{marginTop:0, marginBottom:'20px', display:'flex', alignItems:'center', fontSize: '1.2rem', color: 'var(--text)'}}>
                   <span className="material-symbols-outlined" style={{marginRight:'8px', color: 'var(--primary)'}}>volunteer_activism</span> 
                   Review Donation
                 </h2>
                 <p style={{color:'var(--text-muted)', fontSize:'0.85rem', marginBottom:'8px'}}>You are contributing to:</p>
                 <div style={{background:'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding:'12px', borderRadius:'8px', marginBottom:'16px'}}>
                    <strong style={{color: 'var(--text)', fontSize: '1rem'}}>{camp.title}</strong><br/>
                    <span style={{fontSize:'0.75rem', color:'var(--text-secondary)'}}>Managed by: {shortAddr(camp.orgAddress)}</span>
                 </div>
                 
                 <div style={{marginBottom:'18px', textAlign: 'center'}}>
                    <p style={{fontSize:'0.85rem', marginBottom:'6px', color:'var(--text-muted)'}}>Selected Amount</p>
                    <div style={{display:'inline-flex', alignItems:'baseline', gap:'6px'}}>
                       <span style={{fontSize:'2.5rem', fontWeight:'800', color:'var(--primary)', lineHeight:'1'}}>{amount}</span> 
                       <span style={{fontSize:'1.1rem', fontWeight:'600', color:'var(--text-secondary)'}}>ETH</span>
                    </div>
                    {/* FIAT CONVERSION (Approximate real-world fallback for offline defense) */}
                    <div style={{fontSize:'0.85rem', color:'var(--text-muted)', marginTop:'8px', fontWeight:'500', background:'rgba(255,255,255,0.05)', padding:'4px 12px', borderRadius:'20px', display:'inline-block'}}>
                       ≈ ₱{(!isNaN(parseFloat(amount)) ? (parseFloat(amount) * 175000) : 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} PHP
                    </div>
                 </div>

                 <div style={{marginBottom:'24px'}}>
                    <p style={{fontSize:'0.85rem', marginBottom:'8px', color:'var(--text-muted)'}}>Public Support Message (Optional)</p>
                    <textarea 
                       className="input" 
                       style={{width:'100%', minHeight:'70px', padding:'12px', resize:'none', background: 'rgba(0,0,0,0.2)'}}
                       placeholder="Leave a message for the campaign..."
                       value={customMsg}
                       onChange={(e) => setCustomMsg(e.target.value)}
                       maxLength={90}
                    />
                 </div>

                 <div style={{marginBottom:'24px', display:'flex', flexDirection:'column', gap:'12px'}}>
                    
                    {/* ── Premium Toggle: Donate Anonymously ── */}
                    <div 
                      onClick={() => setIsAnonymous(!isAnonymous)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 16px', background: isAnonymous ? 'rgba(0, 255, 163, 0.05)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isAnonymous ? 'rgba(0, 255, 163, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                        borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease', userSelect: 'none'
                      }}
                    >
                      <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                         <div style={{
                            width: '38px', height: '38px', borderRadius: '50%', 
                            background: isAnonymous ? 'rgba(0, 255, 163, 0.15)' : 'rgba(255,255,255,0.05)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            color: isAnonymous ? 'var(--primary)' : 'var(--text-muted)',
                            transition: 'all 0.3s ease'
                         }}>
                            <span className="material-symbols-outlined" style={{fontSize:'1.3rem'}}>visibility_off</span>
                         </div>
                         <div style={{display:'flex', flexDirection:'column'}}>
                           <span style={{fontSize:'0.95rem', fontWeight:'600', color: isAnonymous ? 'var(--primary)' : 'var(--text)', transition: '0.3s'}}>Donate Anonymously</span>
                           <span style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>Hide your name on the public ledger</span>
                         </div>
                      </div>
                      
                      {/* CSS Switch UI */}
                      <div style={{
                         width: '42px', height: '22px', borderRadius: '20px', 
                         background: isAnonymous ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                         position: 'relative', transition: '0.3s'
                      }}>
                         <div style={{
                            width: '18px', height: '18px', background: '#fff', borderRadius: '50%',
                            position: 'absolute', top: '2px', left: isAnonymous ? '22px' : '2px',
                            transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                         }}/>
                      </div>
                    </div>

                    {/* ── Premium Toggle: Legal Confirmation ── */}
                    <div 
                      onClick={() => setLegalConfirm(!legalConfirm)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '14px',
                        padding: '14px 16px', background: legalConfirm ? 'rgba(0, 200, 255, 0.05)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${legalConfirm ? 'rgba(0, 200, 255, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                        borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease', userSelect: 'none'
                      }}
                    >
                      <div style={{
                         minWidth: '22px', height: '22px', borderRadius: '6px', marginTop: '2px',
                         background: legalConfirm ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                         border: `1px solid ${legalConfirm ? 'var(--accent)' : 'rgba(255,255,255,0.2)'}`,
                         display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', flexShrink: 0
                      }}>
                         {legalConfirm && <span className="material-symbols-outlined" style={{fontSize:'16px', color:'#000', fontWeight:'bold'}}>check</span>}
                      </div>
                      <div style={{display:'flex', flexDirection:'column'}}>
                         <span style={{fontSize:'0.82rem', fontWeight:'500', color: legalConfirm ? 'var(--text)' : 'var(--text-muted)', lineHeight: '1.5', transition: '0.3s'}}>
                           I understand that blockchain transactions sent to the Sepolia Node are final and irreversible upon confirmation.
                         </span>
                      </div>
                    </div>

                 </div>

                 <div style={{display:'flex', gap:'12px'}}>
                    <button className="btn btn-outline" style={{flex:1}} onClick={() => setModalOpen(false)}>Cancel</button>
                    <button className="btn btn-primary glow" style={{flex:2}} onClick={handleConfirmDonate} disabled={!legalConfirm}>Confirm & Sign</button>
                 </div>
               </div>
            )}

            {donateStep === 2 && (
               <div className="fade-in" style={{textAlign:'center', padding:'40px 0'}}>
                 <div className="spinner" style={{width:'40px', height:'40px', margin:'0 auto 20px', borderColor:'var(--primary)', borderRightColor:'transparent'}}></div>
                 <h3 style={{marginBottom:'8px', color: 'var(--text)'}}>Awaiting Signature</h3>
                 <p style={{color:'var(--text-muted)', fontSize:'0.85rem'}}>Please open MetaMask and sign the transaction to proceed.</p>
               </div>
            )}

            {donateStep === 3 && (
               <div className="fade-in" style={{textAlign:'center', padding:'40px 0'}}>
                 <div className="spinner" style={{width:'40px', height:'40px', margin:'0 auto 20px', borderColor:'var(--secondary)', borderRightColor:'transparent'}}></div>
                 <h3 style={{marginBottom:'8px', color: 'var(--text)'}}>Processing Payment</h3>
                 <p style={{color:'var(--text-muted)', fontSize:'0.85rem', marginBottom: '20px'}}>Mining your transaction on the Sepolia network.</p>
                 <div style={{padding:'10px', background:'rgba(0,0,0,0.3)', borderRadius:'8px', fontSize:'0.75rem', wordBreak:'break-all', border: '1px solid rgba(255,255,255,0.05)'}}>
                   <span style={{color:'var(--text-secondary)', display:'block', marginBottom:'4px'}}>Transaction Hash:</span> 
                   {txHash}
                 </div>
               </div>
            )}

            {donateStep === 4 && (
               <div className="fade-in" style={{textAlign:'center', padding:'20px 0 10px'}}>
                 <div className="success-circle-container">
                    <span 
                       className="material-symbols-outlined check-icon-pop" 
                       style={{fontSize: '2.5rem', color: 'var(--success)'}}
                    >
                       check
                    </span>
                 </div>
                 <h3 style={{marginBottom:'8px', color: 'var(--text)'}}>Donation Successful!</h3>
                 <p style={{color:'var(--text-muted)', fontSize:'0.85rem'}}>Thank you for your generous contribution.</p>
                 
                 <div style={{margin:'24px 0', padding:'16px', background:'rgba(0,0,0,0.2)', borderRadius:'8px', textAlign:'left', border: '1px solid rgba(0,255,100,0.1)'}}>
                    <div style={{fontSize:'0.75rem', color:'var(--text-secondary)', marginBottom:'8px'}}>Verified Digital Receipt</div>
                    <a href={`${SEPOLIA_EXPLORER}${txHash}`} target="_blank" rel="noreferrer" style={{color:'var(--success)', textDecoration:'none', wordBreak:'break-all', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'6px'}}>
                      <span className="material-symbols-outlined" style={{fontSize:'1rem'}}>open_in_new</span> {txHash.slice(0,20)}...
                    </a>
                 </div>

                 <button className="btn btn-primary btn-full pulse" onClick={() => { setModalOpen(false); setAmount(''); }}>Complete</button>
               </div>
            )}
          </div>
        </div>
      , document.body)}

      {/* ── Deactivate / Transaction Events Modal ── */}
      {deactivateModal.show && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(5, 7, 12, 0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
        }} className="fade-in">
          
          <div className="card bounce-in" style={{ width: '420px', padding: '24px', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', borderRadius: '16px' }}>
            
            {deactivateModal.step === 1 && (
              <div className="fade-in">
                <h2 style={{marginTop:0, marginBottom:'20px', display:'flex', alignItems:'center', fontSize: '1.2rem', color: 'var(--text)'}}>
                  <span className="material-symbols-outlined" style={{marginRight:'8px', color: 'var(--danger)'}}>warning</span> 
                  Deactivate Campaign
                </h2>
                <div style={{background:'rgba(255,60,60,0.05)', border: '1px solid rgba(255,60,60,0.2)', padding:'12px', borderRadius:'8px', marginBottom:'16px'}}>
                   <strong style={{color: 'var(--danger)', fontSize: '0.95rem'}}>Campaign #{camp.id}: {camp.title}</strong>
                </div>
                <p style={{color:'var(--text-muted)', fontSize:'0.85rem', marginBottom:'24px', lineHeight: '1.5'}}>
                  This will permanently close the campaign to new donations. This administrative action is recorded on the blockchain and <strong>cannot be undone</strong>.
                </p>

                <div style={{display:'flex', gap:'12px'}}>
                   <button className="btn btn-outline" style={{flex:1}} onClick={() => setDeactivateModal({ show: false, step: 0, hash: '', error: '' })}>Cancel</button>
                   <button className="btn btn-primary glow" style={{flex:1, background: 'var(--danger)', borderColor: 'var(--danger)'}} onClick={handleDeactivate}>Deactivate</button>
                </div>
              </div>
            )}

            {deactivateModal.step === 2 && (
              <div className="fade-in" style={{textAlign:'center', padding:'40px 0'}}>
                 <div className="spinner" style={{width:'40px', height:'40px', margin:'0 auto 20px', borderColor:'var(--primary)', borderRightColor:'transparent'}}></div>
                 <h3 style={{marginBottom:'8px', color: 'var(--text)'}}>Awaiting Signature</h3>
                 <p style={{color:'var(--text-muted)', fontSize:'0.85rem'}}>Please sign the transaction in MetaMask to deactivate this campaign.</p>
              </div>
            )}

            {deactivateModal.step === 3 && (
              <div className="fade-in" style={{textAlign:'center', padding:'40px 0'}}>
                 <div className="spinner" style={{width:'40px', height:'40px', margin:'0 auto 20px', borderColor:'var(--secondary)', borderRightColor:'transparent'}}></div>
                 <h3 style={{marginBottom:'8px', color: 'var(--text)'}}>Deactivating Campaign</h3>
                 <p style={{color:'var(--text-muted)', fontSize:'0.85rem', marginBottom: '20px'}}>Mining your transaction on the Sepolia network.</p>
                 <div style={{padding:'10px', background:'rgba(0,0,0,0.3)', borderRadius:'8px', fontSize:'0.75rem', wordBreak:'break-all', border: '1px solid rgba(255,255,255,0.05)'}}>
                   <span style={{color:'var(--text-secondary)', display:'block', marginBottom:'4px'}}>Transaction Hash:</span> 
                   {deactivateModal.hash}
                 </div>
              </div>
            )}

            {deactivateModal.step === 4 && (
              <div className="fade-in" style={{textAlign:'center', padding:'20px 0 10px'}}>
                 <div className="success-circle-container">
                    <span className="material-symbols-outlined check-icon-pop" style={{fontSize: '2.5rem', color: 'var(--success)'}}>check</span>
                 </div>
                 <h3 style={{marginBottom:'8px', color: 'var(--text)'}}>Campaign Deactivated</h3>
                 <p style={{color:'var(--text-muted)', fontSize:'0.85rem'}}>Donations are now permanently closed for this campaign.</p>
                 
                 <div style={{margin:'24px 0', padding:'16px', background:'rgba(0,0,0,0.2)', borderRadius:'8px', textAlign:'left', border: '1px solid rgba(0,255,100,0.1)'}}>
                    <div style={{fontSize:'0.75rem', color:'var(--text-secondary)', marginBottom:'8px'}}>Verified Block Receipt</div>
                    <a href={`${SEPOLIA_EXPLORER}${deactivateModal.hash}`} target="_blank" rel="noreferrer" style={{color:'var(--success)', textDecoration:'none', wordBreak:'break-all', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'6px'}}>
                      <span className="material-symbols-outlined" style={{fontSize:'1rem'}}>open_in_new</span> {deactivateModal.hash.slice(0,20)}...
                    </a>
                 </div>

                 <button className="btn btn-primary btn-full pulse" onClick={() => setDeactivateModal({ show: false, step: 0, hash: '', error: '' })}>Close</button>
              </div>
            )}

            {deactivateModal.step === 5 && (
              <div className="fade-in">
                <h2 style={{marginTop:0, marginBottom:'20px', display:'flex', alignItems:'center', fontSize: '1.2rem', color: 'var(--text)'}}>
                  <span className="material-symbols-outlined" style={{marginRight:'8px', color: 'var(--danger)'}}>error</span> 
                  Transaction Failed
                </h2>
                <p style={{color:'var(--text-secondary)', fontSize:'0.9rem', marginBottom:'24px', lineHeight:'1.5'}}>
                  {deactivateModal.error}
                </p>
                <button className="btn btn-primary btn-full pulse" onClick={() => setDeactivateModal({ show: false, step: 0, hash: '', error: '' })}>Close</button>
              </div>
            )}

          </div>
        </div>
      , document.body)}
    </div>
  );
}
