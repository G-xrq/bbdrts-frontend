import React, { useState } from 'react';
import './EditProfileModal.css';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const AVATAR_PRESETS = [
  { id: '1', icon: 'volunteer_activism', label: 'Aid Shield', color: '#22c55e' },
  { id: '2', icon: 'shield_with_heart', label: 'Humanitarian', color: '#38bdf8' },
  { id: '3', icon: 'local_hospital', label: 'Emergency Aid', color: '#ef4444' },
  { id: '4', icon: 'water_drop', label: 'Relief Logistics', color: '#06b6d4' },
  { id: '5', icon: 'domain', label: 'Institution', color: '#a855f7' },
  { id: '6', icon: 'assured_workload', label: 'Governance', color: '#f59e0b' },
  { id: '7', icon: 'token', label: 'Web3 Patron', color: '#ec4899' },
  { id: '8', icon: 'diversity_1', label: 'Community', color: '#10b981' }
];

export default function EditProfileModal({ currentUser, onClose, onProfileUpdated, theme }) {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'contact' | 'role_details' | 'security'
  const [saving, setSaving] = useState(false);

  // Parse existing preferences
  let initialPrefs = {
    anonymousDefault: false,
    preferredCurrency: 'PHP',
    smsAlerts: true,
    emailReceipts: true,
    reliefInterests: ['Typhoon Relief', 'Emergency Food Packs']
  };
  if (currentUser?.preferences) {
    try {
      const parsed = typeof currentUser.preferences === 'string' ? JSON.parse(currentUser.preferences) : currentUser.preferences;
      if (parsed && typeof parsed === 'object') initialPrefs = { ...initialPrefs, ...parsed };
    } catch (_) {}
  }

  // Form State
  const [name, setName] = useState(currentUser?.name || currentUser?.Org_Name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [location, setLocation] = useState(currentUser?.location || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');
  const [website, setWebsite] = useState(currentUser?.website || '');
  const [emergencyHotline, setEmergencyHotline] = useState(currentUser?.emergency_hotline || '');
  const [gcashNumber, setGcashNumber] = useState(currentUser?.gcash_number || '');
  const [mayaNumber, setMayaNumber] = useState(currentUser?.maya_number || '');
  const [bankDetails, setBankDetails] = useState(currentUser?.bank_details || '');
  const [title, setTitle] = useState(currentUser?.title || '');
  const [agency, setAgency] = useState(currentUser?.agency || '');
  const [preferences, setPreferences] = useState(initialPrefs);

  const role = currentUser?.role || 'donor';
  const isOrg = role === 'organization';
  const isAdmin = role === 'admin';

  const handleInterestToggle = (interest) => {
    setPreferences(prev => {
      const list = prev.reliefInterests || [];
      const updated = list.includes(interest)
        ? list.filter(item => item !== interest)
        : [...list, interest];
      return { ...prev, reliefInterests: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const token = localStorage.getItem('bbdrts_token');
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          name,
          phone,
          location,
          bio,
          avatar_url: avatarUrl,
          website,
          emergency_hotline: emergencyHotline,
          gcash_number: gcashNumber,
          maya_number: mayaNumber,
          bank_details: bankDetails,
          title,
          agency,
          preferences
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile.');

      showSuccess('Profile information synchronized successfully!', 'Profile Updated');
      if (onProfileUpdated && data.user) {
        onProfileUpdated(data.user);
      }
      onClose();
    } catch (err) {
      console.error('Profile update error:', err);
      showError(err.message || 'Failed to update profile.', 'Update Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bbdrts-edit-profile-backdrop" onClick={onClose} data-theme={theme}>
      <div className="bbdrts-edit-profile-modal" onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="bbdrts-edit-profile-header">
          <div className="bbdrts-edit-profile-header-title">
            <span className="material-symbols-outlined" style={{ color: 'var(--accent, #22c55e)', fontSize: '22px' }}>
              manage_accounts
            </span>
            <div>
              <h3>Account Profile & Preferences</h3>
              <span>Manage your personal identity, contact details, and relief settings</span>
            </div>
          </div>
          <button type="button" className="bbdrts-edit-profile-close-btn" onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bbdrts-edit-profile-tabs">
          <button
            type="button"
            className={`bbdrts-edit-profile-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <span className="material-symbols-outlined">badge</span>
            <span>General Identity</span>
          </button>

          <button
            type="button"
            className={`bbdrts-edit-profile-tab ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            <span className="material-symbols-outlined">contact_phone</span>
            <span>Contact & Operations</span>
          </button>

          <button
            type="button"
            className={`bbdrts-edit-profile-tab ${activeTab === 'role_details' ? 'active' : ''}`}
            onClick={() => setActiveTab('role_details')}
          >
            <span className="material-symbols-outlined">
              {isOrg ? 'account_balance' : isAdmin ? 'admin_panel_settings' : 'volunteer_activism'}
            </span>
            <span>{isOrg ? 'Disbursement & Org' : isAdmin ? 'Governance' : 'Relief Preferences'}</span>
          </button>

          <button
            type="button"
            className={`bbdrts-edit-profile-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <span className="material-symbols-outlined">lock_person</span>
            <span>Web3 & Security</span>
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="bbdrts-edit-profile-form">
          
          {/* ── TAB 1: GENERAL IDENTITY ── */}
          {activeTab === 'general' && (
            <div className="bbdrts-edit-tab-pane fade-in">
              
              {/* Avatar Selector Section */}
              <div className="bbdrts-edit-section">
                <label className="bbdrts-edit-label">Profile Avatar Icon / Theme</label>
                <div className="bbdrts-avatar-picker-grid">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`bbdrts-avatar-preset-btn ${avatarUrl === preset.icon ? 'selected' : ''}`}
                      onClick={() => setAvatarUrl(preset.icon)}
                      style={{ '--preset-color': preset.color }}
                    >
                      <span className="material-symbols-outlined" style={{ color: preset.color, fontSize: '22px' }}>
                        {preset.icon}
                      </span>
                      <span className="preset-label">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Name */}
              <div className="bbdrts-edit-field">
                <label className="bbdrts-edit-label">
                  {isOrg ? 'Organization / Institution Legal Name' : 'Full Display Name'}
                </label>
                <input
                  type="text"
                  className="bbdrts-edit-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={isOrg ? 'e.g. Philippine Red Cross - Southern Leyte' : 'e.g. Juan Dela Cruz'}
                  required
                />
                <span className="bbdrts-edit-hint">This name is displayed on verified donor receipts, campaign rosters, and ledger audits.</span>
              </div>

              {/* Email (Read-Only) */}
              <div className="bbdrts-edit-field">
                <label className="bbdrts-edit-label">Registered Account Email</label>
                <div className="bbdrts-input-with-badge">
                  <input
                    type="email"
                    className="bbdrts-edit-input read-only"
                    value={currentUser?.email || ''}
                    readOnly
                    disabled
                  />
                  <span className="bbdrts-verified-badge-inline">
                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>verified</span>
                    Verified
                  </span>
                </div>
              </div>

              {/* Bio / Mission Statement */}
              <div className="bbdrts-edit-field">
                <label className="bbdrts-edit-label">
                  {isOrg ? 'Official Humanitarian Mission & Operational Scope' : 'Advocacy Bio / Relief Note'}
                </label>
                <textarea
                  className="bbdrts-edit-textarea"
                  rows="3"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder={isOrg ? 'Describe your institutional mission, primary disaster response capabilities, and local partner communities...' : 'Share what motivates your humanitarian contributions...'}
                />
              </div>

            </div>
          )}

          {/* ── TAB 2: CONTACT & OPERATIONS ── */}
          {activeTab === 'contact' && (
            <div className="bbdrts-edit-tab-pane fade-in">
              
              <div className="bbdrts-edit-grid-2">
                {/* Phone */}
                <div className="bbdrts-edit-field">
                  <label className="bbdrts-edit-label">Contact / SMS Notification Mobile</label>
                  <input
                    type="tel"
                    className="bbdrts-edit-input"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+63 912 345 6789"
                  />
                  <span className="bbdrts-edit-hint">Used for urgent relief milestone SMS broadcasts.</span>
                </div>

                {/* Location */}
                <div className="bbdrts-edit-field">
                  <label className="bbdrts-edit-label">Primary City / Operational Base</label>
                  <input
                    type="text"
                    className="bbdrts-edit-input"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Maasin City, Southern Leyte, PH"
                  />
                </div>
              </div>

              {isOrg && (
                <div className="bbdrts-edit-grid-2">
                  {/* Emergency Hotline */}
                  <div className="bbdrts-edit-field">
                    <label className="bbdrts-edit-label">24/7 Disaster Response Hotline</label>
                    <input
                      type="text"
                      className="bbdrts-edit-input"
                      value={emergencyHotline}
                      onChange={e => setEmergencyHotline(e.target.value)}
                      placeholder="e.g. (053) 570-9111 / 143"
                    />
                  </div>

                  {/* Website */}
                  <div className="bbdrts-edit-field">
                    <label className="bbdrts-edit-label">Official Website / Portal</label>
                    <input
                      type="url"
                      className="bbdrts-edit-input"
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      placeholder="https://redcross.org.ph"
                    />
                  </div>
                </div>
              )}

              {/* Notification Toggles */}
              <div className="bbdrts-edit-section">
                <label className="bbdrts-edit-label">Notification Channels</label>
                <div className="bbdrts-toggle-row">
                  <div className="bbdrts-toggle-info">
                    <strong>Real-Time SMS Alerts</strong>
                    <span>Receive instant SMS when your relief donations are disbursed to frontline beneficiaries.</span>
                  </div>
                  <input
                    type="checkbox"
                    className="bbdrts-toggle-switch"
                    checked={preferences.smsAlerts}
                    onChange={e => setPreferences(prev => ({ ...prev, smsAlerts: e.target.checked }))}
                  />
                </div>

                <div className="bbdrts-toggle-row">
                  <div className="bbdrts-toggle-info">
                    <strong>Cryptographic Email Receipts</strong>
                    <span>Receive verified PDF receipts with on-chain Ethereum transaction proofs.</span>
                  </div>
                  <input
                    type="checkbox"
                    className="bbdrts-toggle-switch"
                    checked={preferences.emailReceipts}
                    onChange={e => setPreferences(prev => ({ ...prev, emailReceipts: e.target.checked }))}
                  />
                </div>
              </div>

            </div>
          )}

          {/* ── TAB 3: ROLE DETAILS (DONOR / NGO / ADMIN) ── */}
          {activeTab === 'role_details' && (
            <div className="bbdrts-edit-tab-pane fade-in">
              
              {/* DONOR SPECIFIC PREFERENCES */}
              {!isOrg && !isAdmin && (
                <>
                  <div className="bbdrts-edit-field">
                    <label className="bbdrts-edit-label">Preferred Currency Display</label>
                    <div className="bbdrts-currency-selector">
                      {['PHP', 'ETH', 'USD'].map(curr => (
                        <button
                          key={curr}
                          type="button"
                          className={`bbdrts-currency-btn ${preferences.preferredCurrency === curr ? 'active' : ''}`}
                          onClick={() => setPreferences(prev => ({ ...prev, preferredCurrency: curr }))}
                        >
                          <strong>{curr === 'PHP' ? '₱ PHP' : curr === 'ETH' ? 'Ξ ETH' : '$ USD'}</strong>
                          <span>{curr === 'PHP' ? 'Philippine Peso' : curr === 'ETH' ? 'Ethereum EVM' : 'US Dollar'}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bbdrts-edit-section">
                    <label className="bbdrts-edit-label">Relief Focus & Cause Interests</label>
                    <div className="bbdrts-cause-tags-grid">
                      {['Typhoon Relief', 'Flood Response', 'Earthquake Aid', 'Emergency Food Packs', 'Medical Assistance', 'Rebuilding Shelter', 'Clean Water'].map(cause => {
                        const isSelected = (preferences.reliefInterests || []).includes(cause);
                        return (
                          <button
                            key={cause}
                            type="button"
                            className={`bbdrts-cause-chip ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleInterestToggle(cause)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                              {isSelected ? 'check_circle' : 'add'}
                            </span>
                            <span>{cause}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bbdrts-toggle-row" style={{ marginTop: '12px' }}>
                    <div className="bbdrts-toggle-info">
                      <strong>Anonymous Donor by Default</strong>
                      <span>Mask your name on public campaign leaderboards while keeping cryptographically signed receipts.</span>
                    </div>
                    <input
                      type="checkbox"
                      className="bbdrts-toggle-switch"
                      checked={preferences.anonymousDefault}
                      onChange={e => setPreferences(prev => ({ ...prev, anonymousDefault: e.target.checked }))}
                    />
                  </div>
                </>
              )}

              {/* ORGANIZATION SPECIFIC CHANNELS */}
              {isOrg && (
                <>
                  <div className="bbdrts-notice-box">
                    <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>info</span>
                    <div>
                      <strong>Direct Humanitarian Channels</strong>
                      <span>Configure your organization's direct electronic fund transfer points for verified fiat disaster assistance.</span>
                    </div>
                  </div>

                  <div className="bbdrts-edit-grid-2">
                    <div className="bbdrts-edit-field">
                      <label className="bbdrts-edit-label">Official GCash Disaster Relief Number</label>
                      <input
                        type="text"
                        className="bbdrts-edit-input"
                        value={gcashNumber}
                        onChange={e => setGcashNumber(e.target.value)}
                        placeholder="0917-XXX-XXXX"
                      />
                    </div>

                    <div className="bbdrts-edit-field">
                      <label className="bbdrts-edit-label">Official Maya Relief Account Number</label>
                      <input
                        type="text"
                        className="bbdrts-edit-input"
                        value={mayaNumber}
                        onChange={e => setMayaNumber(e.target.value)}
                        placeholder="0918-XXX-XXXX"
                      />
                    </div>
                  </div>

                  <div className="bbdrts-edit-field">
                    <label className="bbdrts-edit-label">Official Bank Deposit Details (LandBank / DBP / BDO / BPI)</label>
                    <textarea
                      className="bbdrts-edit-textarea"
                      rows="2"
                      value={bankDetails}
                      onChange={e => setBankDetails(e.target.value)}
                      placeholder="Bank: Land Bank of the Philippines&#10;Account Name: Philippine Red Cross Disaster Relief&#10;Account Number: 1234-5678-90"
                    />
                  </div>
                </>
              )}

              {/* ADMIN SPECIFIC DETAILS */}
              {isAdmin && (
                <div className="bbdrts-edit-grid-2">
                  <div className="bbdrts-edit-field">
                    <label className="bbdrts-edit-label">Official Government / Protocol Title</label>
                    <input
                      type="text"
                      className="bbdrts-edit-input"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Senior SEC Anti-Bias Compliance Officer"
                    />
                  </div>

                  <div className="bbdrts-edit-field">
                    <label className="bbdrts-edit-label">Regulatory Department / Bureau</label>
                    <input
                      type="text"
                      className="bbdrts-edit-input"
                      value={agency}
                      onChange={e => setAgency(e.target.value)}
                      placeholder="e.g. SEC Governance & DSWD Relief Oversight Desk"
                    />
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ── TAB 4: WEB3 & SECURITY ── */}
          {activeTab === 'security' && (
            <div className="bbdrts-edit-tab-pane fade-in">
              
              <div className="bbdrts-edit-field">
                <label className="bbdrts-edit-label">Linked Sepolia EVM Multi-Sig Wallet</label>
                <div className="bbdrts-input-with-badge">
                  <input
                    type="text"
                    className="bbdrts-edit-input read-only"
                    value={currentUser?.wallet_address || 'No Web3 Wallet Connected Yet'}
                    readOnly
                    disabled
                  />
                  <span className="bbdrts-wallet-status-badge">
                    {currentUser?.wallet_address ? 'Sepolia Synced' : 'Unlinked'}
                  </span>
                </div>
                <span className="bbdrts-edit-hint">All smart contract donations and milestone escrows are signed using this Ethereum wallet.</span>
              </div>

              <div className="bbdrts-security-card">
                <div className="bbdrts-security-card-header">
                  <span className="material-symbols-outlined" style={{ color: 'var(--accent)' }}>verified_user</span>
                  <div>
                    <strong>Cryptographic Session Security</strong>
                    <p>Secured with JWT HS256 and Web3 EVM ECDSA signature verification.</p>
                  </div>
                </div>
                <div className="bbdrts-security-meta-row">
                  <span>Role: <strong>{role.toUpperCase()}</strong></span>
                  <span>Protocol: <strong>BBDRTS v2.4</strong></span>
                  <span>Status: <strong style={{ color: '#22c55e' }}>Active & Compliant</strong></span>
                </div>
              </div>

            </div>
          )}

          {/* Modal Footer */}
          <div className="bbdrts-edit-profile-footer">
            <button
              type="button"
              className="bbdrts-edit-btn-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bbdrts-edit-btn-save"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="spinner" style={{ width: '14px', height: '14px' }} />
                  <span>Synchronizing...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>save</span>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
