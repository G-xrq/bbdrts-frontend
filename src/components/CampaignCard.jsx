import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ethers } from 'ethers';
import { ROLES } from '../roleConfig';
import LocationMapPicker from './LocationMapPicker';

const SEPOLIA_EXPLORER = 'https://sepolia.etherscan.io/tx/';

export const shortAddr = (addr) =>
  addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';

export const progressPct = (current, target) => {
  const c = parseFloat(current);
  const t = parseFloat(target);
  if (!t) return 0;
  return Math.min(100, ((c / t) * 100).toFixed(1));
};

export const getOrgDisplayName = (orgAddress, orgName, campaignId) => {
  if (orgName && typeof orgName === 'string') {
    const lower = orgName.toLowerCase();
    if (lower.includes('redcross') || lower.includes('red cross')) return 'Red Cross';
    if (lower.includes('ccs')) return 'CCS';
  }
  
  if (orgAddress && typeof orgAddress === 'string') {
    const addrLower = orgAddress.toLowerCase();
    if (addrLower.startsWith('0x206e')) return 'Red Cross';
    if (addrLower.startsWith('0x8898')) return 'CCS';
  }

  return String(campaignId) === '2' || String(campaignId) === '4' ? 'CCS' : 'Red Cross';
};

export const formatCampaignTitle = (title, id) => {
  if (!title) return `Disaster Relief Campaign #${id}`;
  const lower = String(title).toLowerCase().trim();
  if (lower === 'blood donation') {
    return 'Red Cross Emergency Blood & Medical Aid Drive';
  }
  if (lower.startsWith('campaign #') || lower.startsWith('disaster relief campaign #')) {
    const titles = {
      '1': 'Red Cross Emergency Blood & Medical Aid Drive',
      '2': 'Super Typhoon Odette Emergency Disaster Relief',
      '3': 'Visayas Community Food & Relief Operations',
      '4': 'Southern Leyte Landslide Recovery & Shelter Aid',
      '5': 'Bohol Earthquake Rehabilitation & Infrastructure Aid'
    };
    return titles[String(id)] || `Emergency Relief Operation #${id}`;
  }
  return title;
};

export const getCampaignAuditDetails = (id, title, camp = {}) => {
  const sId = String(id);
  const detailsMap = {
    '1': {
      region: 'Southern Leyte Regional Hospital & Red Cross Center',
      gps: '10.1333° N, 124.8667° E (Maasin City)',
      beneficiaries: '~1,200 Emergency Trauma Patients & Medical Facilities',
      allocations: [
        { label: '💉 Blood Bag Storage & Refrigeration', pct: 40, icon: 'vaccines' },
        { label: '🩺 Medical Testing & Transfusion Kits', pct: 35, icon: 'medical_services' },
        { label: '🚑 Mobile Drive & Donor Transport', pct: 15, icon: 'minor_crash' },
        { label: '🍎 Donor Care & Nutrition Packs', pct: 10, icon: 'nutrition' }
      ],
      contact: 'redcross.maasin@bbdrts.org • (053) 570-8899',
      logisticsHub: 'Red Cross Maasin Command Post',
      urgency: 'HIGH (CRITICAL MEDICAL AID)'
    },
    '2': {
      region: 'Ground Zero Coastal Communities, Maasin & Sogod Sector',
      gps: '10.3800° N, 124.9800° E (Sogod Bay Sector)',
      beneficiaries: '~4,500 Displaced Families & Evacuation Centers',
      allocations: [
        { label: '🍲 Emergency Food Packs & Clean Water Drums', pct: 40, icon: 'rice_bowl' },
        { label: '⛺ Heavy-Duty Tarpaulins & Roofing Kits', pct: 30, icon: 'roofing' },
        { label: '🔦 Solar Emergency Lamps & Hygiene Kits', pct: 18, icon: 'lightbulb' },
        { label: '🚚 Evacuation Transport & Field Fuel', pct: 12, icon: 'local_shipping' }
      ],
      contact: 'disaster.relief@redcross.org.ph',
      logisticsHub: 'Maasin Disaster Coordination Center',
      urgency: 'CRITICAL (TYPHOON RELIEF)'
    },
    '3': {
      region: 'Rural Barangay Relief Hubs, Visayas Sector',
      gps: '10.2000° N, 125.0000° E (Visayas Command)',
      beneficiaries: '~2,800 Underprivileged Children & Households',
      allocations: [
        { label: '🍚 Bulk Rice & Staple Grain Supplies', pct: 45, icon: 'rice_bowl' },
        { label: '🚰 Clean Water Filtration Drums', pct: 25, icon: 'water_drop' },
        { label: '👶 Infant Care & High-Nutrient Milk', pct: 18, icon: 'child_care' },
        { label: '📦 Logistics & Distribution Center Operations', pct: 12, icon: 'inventory_2' }
      ],
      contact: 'community.aid@redcross.org.ph',
      logisticsHub: 'Tacloban Regional Logistics Hub',
      urgency: 'MEDIUM-HIGH'
    },
    '4': {
      region: 'St. Bernard & Southern Leyte Landslide Sector',
      gps: '10.3200° N, 125.1300° E (St. Bernard Sector)',
      beneficiaries: '~1,800 Relocated Families & Survivors',
      allocations: [
        { label: '🛠️ Temporary Housing & Construction Materials', pct: 45, icon: 'foundation' },
        { label: '🏥 Field Trauma Medical First-Responders', pct: 25, icon: 'emergency' },
        { label: '🧥 Emergency Bedding & Thermal Blankets', pct: 18, icon: 'bed' },
        { label: '🚛 Search & Rescue Heavy Machinery Fuel', pct: 12, icon: 'engineering' }
      ],
      contact: 'ccs.disaster@ccs.edu.ph',
      logisticsHub: 'CCS St. Bernard Field Post',
      urgency: 'HIGH (LANDSLIDE RECOVERY)'
    },
    '5': {
      region: 'Bohol Epicenter & Community Rehabilitation Hubs',
      gps: '9.8500° N, 124.1400° E (Bohol Sector)',
      beneficiaries: '~3,200 Affected Earthquake Survivors',
      allocations: [
        { label: '🏗️ School & Clinic Structural Shoring Kits', pct: 40, icon: 'domain' },
        { label: '💧 Community Water Purification Stations', pct: 30, icon: 'water' },
        { label: '📦 Family Survival Kits & Dry Goods', pct: 20, icon: 'package' },
        { label: '🚒 Mobile Command Unit Support', pct: 10, icon: 'local_fire_department' }
      ],
      contact: 'bohol.relief@bbdrts.org',
      logisticsHub: 'Tagbilaran Emergency Warehouse',
      urgency: 'MEDIUM'
    }
  };

  const preset = detailsMap[sId] || {
    region: 'Visayas Disaster Management Zone',
    gps: '10.1333° N, 124.8667° E',
    beneficiaries: '~2,500 Registered Relief Beneficiaries',
    allocations: [
      { label: '🍲 Emergency Relief Supplies & Food Rations', pct: 40, icon: 'rice_bowl' },
      { label: '🏥 Medical & Hygiene Aid Packs', pct: 30, icon: 'medical_services' },
      { label: '⛺ Shelter & Structural Materials', pct: 20, icon: 'roofing' },
      { label: '🚚 Transportation & Fuel Logistics', pct: 10, icon: 'local_shipping' }
    ],
    contact: 'operations@bbdrts.org',
    logisticsHub: 'Central Regional Relief Depot',
    urgency: 'HIGH'
  };

  // Parse allocationsJson if present
  let customAllocations = preset.allocations;
  if (camp.allocationsJson) {
    try {
      const parsed = typeof camp.allocationsJson === 'string' ? JSON.parse(camp.allocationsJson) : camp.allocationsJson;
      if (Array.isArray(parsed) && parsed.length > 0) {
        customAllocations = parsed;
      }
    } catch (e) {
      console.warn("Failed to parse allocationsJson", e);
    }
  }

  return {
    region: camp.locationRegion || preset.region,
    gps: camp.gpsCoordinates || preset.gps,
    beneficiaries: camp.beneficiariesImpact || preset.beneficiaries,
    allocations: customAllocations,
    contact: camp.contactInfo || preset.contact,
    logisticsHub: preset.logisticsHub,
    urgency: camp.urgency || preset.urgency,
    description: camp.description || preset.description || 'Full disaster relief deployment and distribution scope logged under official NGO smart contract instance.',
    targetDate: camp.targetDate || '',
    documentUrl: camp.documentUrl || ''
  };
};

export default function CampaignCard(props) {
  const camp = props.camp || props.campaign || {};
  const { contract, role, walletAddress, onDonated, onDeactivated } = props;
  const [amount, setAmount] = useState('');
  const [deactivating, setDeactivating] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
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
          {/* Category Tag determination (Disaster Relief vs Charitable Aid) */}
          {(() => {
            const displayTitle = formatCampaignTitle(camp.title, camp.id);
            const isCharity = /charity|school|orphan|food|feed|community|aid|blood|medical/i.test(displayTitle);
            const catPrefix = isCharity ? 'CD' : 'DR';
            const catLabel  = isCharity ? 'Charitable Aid (CD)' : 'Disaster Relief (DR)';
            const catClass  = isCharity ? 'badge-info' : 'badge-warning';
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className={`badge ${catClass}`} style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                  {catPrefix}-00{camp.id} • {catLabel}
                </span>
              </div>
            );
          })()}

          <div className="campaign-title-row">
            <h3 className="campaign-title">{formatCampaignTitle(camp.title, camp.id)}</h3>
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
              Managing Org: <strong style={{ color: '#ffffff' }}>{getOrgDisplayName(camp.orgAddress, camp.orgName, camp.id)}</strong> ({shortAddr(camp.orgAddress)})
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
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                ≈ ₱{(parseFloat(camp.currentAmount || 0) * 170000).toLocaleString('en-US', {maximumFractionDigits: 0})} PHP
              </span>
            </div>
            <div className="amount-block">
              <span className="amount-label">Target Goal</span>
              <span className="amount-value">{camp.targetAmount} ETH</span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                ≈ ₱{(parseFloat(camp.targetAmount || 0) * 170000).toLocaleString('en-US', {maximumFractionDigits: 0})} PHP
              </span>
            </div>
            <div className="amount-block">
              <span className="amount-label">Tracking ID</span>
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
              <div className="donate-row" style={{ display: 'flex', gap: '8px' }}>
                <input
                  className="input donate-input"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="ETH Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!canDonate}
                  style={{ width: '130px', minWidth: '110px' }}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
            <button 
              className="btn btn-outline btn-sm btn-full" 
              onClick={() => setDetailsOpen(true)}
              style={{
                background: 'rgba(30, 41, 59, 0.6)',
                borderColor: 'rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>info</span>
              <span>More Details & Map</span>
            </button>

            <button className="btn btn-outline btn-sm btn-full" onClick={toggleLedger}>
              {ledgerOpen ? '▲ Hide Public Ledger' : '▼ View Public Ledger'}
            </button>
          </div>

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
        </div>, document.body)}

      {/* ── Comprehensive Campaign Audit & Location Details Modal ── */}
      {detailsOpen && (() => {
        const audit = getCampaignAuditDetails(camp.id, camp.title, camp);
        const orgDisplayName = getOrgDisplayName(camp.orgAddress, camp.orgName, camp.id);
        const displayTitle = formatCampaignTitle(camp.title, camp.id);

        return createPortal(
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(5, 7, 12, 0.82)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
          }} className="fade-in">
            
            <div className="card bounce-in" style={{ 
              width: '640px', 
              maxWidth: '92vw', 
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px', 
              background: '#0f172a', 
              border: '1px solid rgba(56, 189, 248, 0.3)', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 20px rgba(56, 189, 248, 0.15)', 
              borderRadius: '20px',
              color: '#f8fafc'
            }}>

              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px' }}>
                      CAMPAIGN #{camp.id} AUDIT
                    </span>
                    <span className="badge badge-active" style={{ fontSize: '0.72rem', padding: '4px 10px' }}>
                      {audit.urgency}
                    </span>
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#fff', fontWeight: 700 }}>
                    {displayTitle}
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                    Managed by <strong style={{ color: '#38bdf8' }}>{orgDisplayName}</strong> • Smart Contract Verified
                  </p>
                </div>

                <button 
                  onClick={() => setDetailsOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* 1. Target Region & Location GPS Interactive Map Box (2-Column Grid) */}
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '14px',
                padding: '18px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: '1.4rem' }}>
                      location_on
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                      Target Location & Interactive Audit Map
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                    GPS LIVE AUDIT
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', alignItems: 'center' }}>
                  {/* Left Column: Location Details & Impact Summary */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Deployed Relief Region
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                        📍 {audit.region || 'On-Site Relief Zone'}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                      📡 <strong>Coordinates:</strong> <span style={{ color: '#38bdf8', fontWeight: 600 }}>{audit.gps || 'Logged On-Chain'}</span>
                    </div>

                    {/* Impact & Contact Card */}
                    <div style={{
                      background: 'rgba(2, 6, 23, 0.7)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      borderRadius: '10px',
                      padding: '12px',
                      marginTop: '4px'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Beneficiary Impact Estimate
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#22c55e', marginTop: '2px' }}>
                        {audit.beneficiaries}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                        📞 Contact: <span style={{ color: '#38bdf8' }}>{audit.contact}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Square Read-Only Leaflet Map */}
                  <div style={{
                    width: '100%',
                    height: '220px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                    background: '#0f172a'
                  }}>
                    <LocationMapPicker
                      address={audit.region}
                      gps={audit.gps}
                      readOnly={true}
                      height="220px"
                      hideTip={true}
                    />
                  </div>
                </div>
              </div>

              {/* Mission Purpose & Campaign Scope Description Box */}
              <div style={{ 
                background: 'rgba(15, 23, 42, 0.6)', 
                border: '1px solid rgba(56, 189, 248, 0.2)', 
                borderRadius: '12px', 
                padding: '16px', 
                marginBottom: '20px' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>description</span> Mission Purpose & Relief Scope
                  </h4>
                  {audit.targetDate && (
                    <span style={{ fontSize: '0.75rem', color: '#e2e8f0', background: 'rgba(30, 41, 59, 0.8)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      📅 Target Date: {audit.targetDate}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                  {audit.description}
                </p>
                {audit.documentUrl && (
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                    <a 
                      href={audit.documentUrl.startsWith('http') ? audit.documentUrl : `https://${audit.documentUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.8rem', color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>open_in_new</span> Official Verification / Press Release Audit Document
                    </a>
                  </div>
                )}
              </div>

              {/* 2. Fund Allocation Breakdown */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.92rem', color: '#f8fafc', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#38bdf8', fontSize: '1.2rem' }}>pie_chart</span>
                  Transparency Allocation & Necessities Breakdown
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                  {audit.allocations.map((item, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '12px 14px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.83rem', fontWeight: 600, color: '#e2e8f0' }}>
                          {item.label}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8' }}>
                          {item.pct}%
                        </span>
                      </div>
                      <div style={{ background: 'rgba(15, 23, 42, 0.8)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${item.pct}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7, #38bdf8)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Provenance & Smart Contract Audit Footer */}
              <div style={{ 
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '20px',
                fontSize: '0.8rem',
                color: '#94a3b8',
                lineHeight: '1.5'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontWeight: 700, marginBottom: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>verified_user</span>
                  100% Cryptographic On-Chain Provenance Guarantee
                </div>
                Donations made to this campaign are routed directly into the Sepolia EVM Smart Contract vault (`{shortAddr(camp.orgAddress)}`). No intermediary gateway fees, admin cuts, or third-party holding accounts.
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn btn-outline" 
                  style={{ flex: 1, padding: '10px' }} 
                  onClick={() => setDetailsOpen(false)}
                >
                  Close Audit
                </button>

                {canDonate && (
                  <button 
                    className="btn btn-primary glow" 
                    style={{ flex: 1.5, padding: '10px' }} 
                    onClick={() => {
                      setDetailsOpen(false);
                      setModalOpen(true);
                    }}
                  >
                    💙 Donate Now
                  </button>
                )}
              </div>

            </div>
          </div>
        , document.body);
      })()}
    </div>
  );
}
