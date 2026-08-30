import React, { useState, useRef } from 'react';
import './EditProfileModal.css';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function EditProfileModal({ currentUser, onClose, onProfileUpdated, theme }) {
  const { showSuccess, showError, showWarning } = useToast();
  const fileInputRef = useRef(null);
  const [saving, setSaving] = useState(false);

  // Compute Initial Display Name (Human-friendly name, not email)
  const getInitialName = () => {
    if (currentUser?.name && !currentUser.name.includes('@')) return currentUser.name;
    if (currentUser?.Org_Name) return currentUser.Org_Name;
    if (currentUser?.email) {
      const handle = currentUser.email.split('@')[0];
      if (handle.toLowerCase() === 'gestermacaldo') return 'Gester Macaldo';
      return handle.replace(/[\._]/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    return 'Donor Benefactor';
  };

  const [displayName, setDisplayName] = useState(getInitialName());
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');
  const [previewImage, setPreviewImage] = useState(currentUser?.avatar_url || null);

  const role = currentUser?.role || 'donor';
  const isDonor = role === 'donor';

  // Cooldown calculation: 7 days cooldown for name changes
  const COOLDOWN_DAYS = 7;
  let isCooldownActive = false;
  let remainingDays = 0;
  let nextAvailableDateStr = '';

  if (currentUser?.last_name_change_at) {
    const lastChange = new Date(currentUser.last_name_change_at).getTime();
    const now = Date.now();
    const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    const remainingMs = cooldownMs - (now - lastChange);

    if (remainingMs > 0) {
      isCooldownActive = true;
      remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
      const nextDate = new Date(lastChange + cooldownMs);
      nextAvailableDateStr = nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  // Handle Image File Upload (JPEG/PNG/WebP converted to base64 for instant preview & persistence)
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return showError('Please select a valid image file (PNG, JPG, WEBP).', 'Invalid File');
    }

    if (file.size > 3 * 1024 * 1024) {
      return showError('Profile image must be less than 3MB in size.', 'File Too Large');
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setPreviewImage(base64);
      setAvatarUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    setAvatarUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if donor is trying to change their name while under cooldown
    const currentStoredName = currentUser?.name || '';
    const hasNameChanged = displayName.trim() !== currentStoredName.trim();

    if (hasNameChanged && isCooldownActive && isDonor) {
      return showWarning(
        `Display name can only be changed once every ${COOLDOWN_DAYS} days. Available on ${nextAvailableDateStr}.`,
        'Name Cooldown Active'
      );
    }

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
          name: isDonor ? displayName.trim() : currentUser?.name || currentUser?.Org_Name,
          avatar_url: avatarUrl
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile.');

      showSuccess('Profile updated successfully!', 'Profile Saved');
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

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'US';

  return (
    <div className="bbdrts-simple-profile-backdrop" onClick={onClose} data-theme={theme}>
      <div className="bbdrts-simple-profile-modal" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bbdrts-simple-profile-header">
          <div className="bbdrts-simple-header-title">
            <span className="material-symbols-outlined" style={{ color: 'var(--accent, #22c55e)', fontSize: '22px' }}>
              account_circle
            </span>
            <div>
              <h3>Edit Profile</h3>
              <span>Customize your avatar image and display name</span>
            </div>
          </div>
          <button type="button" className="bbdrts-simple-close-btn" onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="bbdrts-simple-profile-body">
          
          {/* Avatar Upload Centerpiece */}
          <div className="bbdrts-avatar-upload-section">
            <div className="bbdrts-avatar-preview-box">
              {previewImage ? (
                <img src={previewImage} alt="Profile Avatar" className="bbdrts-avatar-image-img" />
              ) : (
                <div className="bbdrts-avatar-initials-fallback">
                  {initials}
                </div>
              )}

              {/* Camera Upload Trigger Overlay */}
              <button
                type="button"
                className="bbdrts-avatar-camera-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Upload Profile Picture"
              >
                <span className="material-symbols-outlined">photo_camera</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              accept="image/png, image/jpeg, image/webp"
              style={{ display: 'none' }}
            />

            <div className="bbdrts-avatar-upload-actions">
              <button
                type="button"
                className="bbdrts-avatar-btn-upload"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>upload</span>
                Upload Image
              </button>

              {previewImage && (
                <button
                  type="button"
                  className="bbdrts-avatar-btn-remove"
                  onClick={handleRemoveImage}
                >
                  Remove
                </button>
              )}
            </div>
            <span className="bbdrts-avatar-guideline">Supported: PNG, JPG, WebP (Max: 3MB)</span>
          </div>

          {/* Display Name Field (For Donor) */}
          <div className="bbdrts-simple-field">
            <div className="bbdrts-field-label-row">
              <label className="bbdrts-simple-label">
                {isDonor ? 'Donor Display Name' : 'Organization Name'}
              </label>

              {/* 7-Day Cooldown Status Tag */}
              {isDonor && (
                isCooldownActive ? (
                  <span className="bbdrts-cooldown-badge active">
                    <span className="material-symbols-outlined">lock_clock</span>
                    Cooldown: {remainingDays}d left ({nextAvailableDateStr})
                  </span>
                ) : (
                  <span className="bbdrts-cooldown-badge ready">
                    <span className="material-symbols-outlined">check_circle</span>
                    Ready to Change (7d Cooldown)
                  </span>
                )
              )}
            </div>

            <input
              type="text"
              className={`bbdrts-simple-input ${isCooldownActive && isDonor ? 'locked' : ''}`}
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              disabled={isCooldownActive && isDonor}
              placeholder="Enter your public display name"
              required
            />

            <span className="bbdrts-simple-hint">
              {isDonor
                ? isCooldownActive
                  ? `To prevent identity spoofing, names can only be changed once every ${COOLDOWN_DAYS} days.`
                  : `Your display name appears on public donation feeds and verified relief receipts. (7-day cooldown applies upon save).`
                : `Official registered non-profit legal entity identifier.`}
            </span>
          </div>

          {/* Registered Email (Clean Read-Only) */}
          <div className="bbdrts-simple-field">
            <label className="bbdrts-simple-label">Registered Account Email</label>
            <div className="bbdrts-simple-input-with-badge">
              <input
                type="email"
                className="bbdrts-simple-input read-only"
                value={currentUser?.email || ''}
                readOnly
                disabled
              />
              <span className="bbdrts-verified-pill">
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>verified</span>
                Verified
              </span>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="bbdrts-simple-footer">
            <button
              type="button"
              className="bbdrts-simple-btn-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bbdrts-simple-btn-save"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="spinner" style={{ width: '14px', height: '14px' }} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
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
