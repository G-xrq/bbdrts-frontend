import { useState, useEffect } from 'react';
import './AuthView.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function AuthView({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('donor');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ donors: '0', orgs: '0', campaigns: '0' });

  useEffect(() => {
    fetch(`${API_URL}/api/public-stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Failed to fetch stats', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegistering ? `${API_URL}/api/auth/register` : `${API_URL}/api/auth/login`;
    const payload = isRegistering ? { name, email, password, role } : { email, password, role };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Authentication failed.');
      localStorage.setItem('bbdrts_token', data.token);
      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-container">
      <div className="login-form-side fade-in">
        <div className="login-glass-card">

          <div className="login-brand-side">
            <div className="login-header">
              <div className="brand-logo">
                <img src="/logo.png" alt="BBDRTS Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', animation: 'logoFloat 3s ease-in-out infinite' }} />
              </div>
              <div className="login-subtitle">
                <h1 className="brand-title">BBDRTS</h1>
                <p className="brand-tagline">Blockchain-Based Donation<br></br>& Relief Transparency System</p>
              </div>
            </div>
            

            <div className="brand-content">
              <div className="login-stats">
                <div className="stat-bubble">
                  <div className="stat-value">{stats.donors}</div>
                  <div className="stat-labels">Active Donors</div>
                </div>
                <div className="stat-bubble">
                  <div className="stat-value">{stats.orgs}</div>
                  <div className="stat-labels">Verified NGOs</div>
                </div>
                <div className="stat-bubble">
                  <div className="stat-value">{stats.campaigns}</div>
                  <div className="stat-labels">Campaigns Seeded</div>
                </div>
              </div>
            </div>

            <div className="floating-shapes">
              <div className="shape shape-1"></div>
              <div className="shape shape-2"></div>
              <div className="shape shape-3"></div>
              <div className="shape shape-4"></div>
            </div>
          </div>

          <div className="login-group">
            <div className="login-header-modern">
              <h2>{isRegistering ? 'Create Account' : (role === 'admin' ? 'Administrator Portal' : (role === 'organization' ? 'NGO Portal Login' : 'Donor Portal Login'))}</h2>
              <p>
                {isRegistering 
                  ? (role === 'organization' ? 'Register your Non-Governmental Organization (NGO)' : 'Sign up as an Individual Donor')
                  : (role === 'admin' ? 'Secure System Management Access' : 'Log in to access your portal')}
              </p>
            </div>

            {role !== 'admin' && (
              <div className="role-selector">
                <div className={`role-option ${role === 'donor' ? 'active' : ''}`} onClick={() => setRole('donor')}>
                  <div className="role-icon"><i className="material-symbols-outlined">person_outline</i></div>
                  <span>Individual Donor</span>
                  <div className="role-check"><i className="material-symbols-outlined">check_circle</i></div>
                </div>
                <div className={`role-option ${role === 'organization' ? 'active' : ''}`} onClick={() => setRole('organization')}>
                  <div className="role-icon"><i className="material-symbols-outlined">domain</i></div>
                  <span>NGO / Relief Org</span>
                  <div className="role-check"><i className="material-symbols-outlined">check_circle</i></div>
                </div>
              </div>
            )}

            <form className="modern-login-form" onSubmit={handleSubmit}>
              {isRegistering && (
                <div className="input-group-modern">
                  <label>{role === 'donor' ? 'FULL NAME' : 'OFFICIAL NGO NAME'}</label>
                  <div className="input-container">
                    <i className="material-symbols-outlined">{role === 'donor' ? 'person' : 'domain'}</i>
                    <input 
                      type="text" 
                      placeholder={role === 'donor' ? "e.g., Gester Macaldo" : "e.g., Philippine Red Cross / Caritas"} 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
              )}

              <div className="input-group-modern">
                <label>{role === 'organization' ? 'OFFICIAL NGO EMAIL' : 'EMAIL ADDRESS'}</label>
                <div className="input-container">
                  <i className="material-symbols-outlined">mail</i>
                  <input 
                    type="email" 
                    placeholder={role === 'organization' ? "contact@ngo-organization.org" : "you@email.com"} 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="input-group-modern">
                <label>PASSWORD</label>
                <div className="input-container">
                  <i className="material-symbols-outlined">lock</i>
                  <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    <i className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</i>
                  </button>
                </div>
                {isRegistering && role === 'organization' && (
                  <div className="input-hint" style={{ color: '#38bdf8', marginTop: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="material-symbols-outlined" style={{ fontSize: '14px' }}>info</i>
                    <span>NGO accounts are submitted for Admin verification before campaign creation is unlocked.</span>
                  </div>
                )}
                {!isRegistering && <div className="input-hint">Default password is provided by your admin</div>}
              </div>

              {!isRegistering && (
                <div className="login-options">
                  <label className="custom-checkbox">
                    <input type="checkbox" />
                    <span className="checkbox-mark"></span>
                    <span className="checkbox-label">Remember me</span>
                  </label>
                  <a href="#" className="link-modern">Forgot Password?</a>
                </div>
              )}

              {error && (
                <div className="alert-modern error">
                  <i className="material-symbols-outlined">warning</i>
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className={`btn-modern-primary ${loading ? 'loading' : ''}`} disabled={loading}>
                {loading && <span className="spinner-before"></span>}
                <span>{loading ? 'Processing...' : (isRegistering ? 'Sign Up' : 'Log In')}</span>
                {!loading && <i className="material-symbols-outlined">arrow_forward</i>}
              </button>
            </form>

            <div className="login-divider"><span>or</span></div>

            <div className="login-footer-modern">
              <p>
                {isRegistering ? "Already have an account? " : "Don't have an account? "}
                <a href="#" onClick={(e) => { e.preventDefault(); setIsRegistering(!isRegistering); setError(''); }}>
                  {isRegistering ? "Log In" : "Sign Up"}
                </a>
              </p>
              <a href="#" className="admin-link-modern" onClick={(e) => {
                e.preventDefault();
                setRole(role === 'admin' ? 'donor' : 'admin');
                setIsRegistering(false);
                setError('');
              }}>
                <i className="material-symbols-outlined">settings</i>
                <span>{role === 'admin' ? 'Return to User Login' : 'Admin Access'}</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
