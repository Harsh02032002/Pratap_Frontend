import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchJson } from '../../utils/api';
import { invalidateAuthSession } from '../../utils/authScope';
import { Eye, EyeOff } from 'lucide-react';

const ManagerLogin = () => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requireReset, setRequireReset] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const stored =
        sessionStorage.getItem('manager_user') ||
        localStorage.getItem('managerData') ||
        localStorage.getItem('user') ||
        sessionStorage.getItem('user');
      const parsed = stored ? JSON.parse(stored) : null;
      const role = String(parsed?.role || '').toLowerCase();

      if (role && role !== 'manager') {
        sessionStorage.removeItem('manager_user');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('managerToken');
        localStorage.removeItem('staff_user');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('staff_token');
        localStorage.removeItem('managerToken');
        localStorage.removeItem('managerData');
        invalidateAuthSession();
      }
    } catch (_) {
      // ignore storage parsing issues
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetchJson('/api/property-managers/login', {
        method: 'POST',
        body: JSON.stringify({
          loginId,
          password
        })
      });

      if (response.requireReset) {
        setRequireReset(true);
        setSuccess('Please set a new password for your account.');
        return;
      }

      if (response.success) {
        const managerUser = { 
          ...response.manager, 
          role: 'manager',
          managerLoginId: response.manager.loginId,
          loginId: response.manager.ownerLoginId // Masquerade as owner so getOwnerRuntimeSession passes
        };
        sessionStorage.setItem('owner_session', JSON.stringify(managerUser));
        sessionStorage.setItem('owner_user', JSON.stringify(managerUser));
        sessionStorage.setItem('manager_user', JSON.stringify(managerUser));
        sessionStorage.setItem('user', JSON.stringify(managerUser));
        sessionStorage.setItem('token', response.token);
        
        localStorage.setItem('owner_session', JSON.stringify(managerUser));
        localStorage.setItem('owner_user', JSON.stringify(managerUser));
        localStorage.setItem('managerData', JSON.stringify(managerUser));
        localStorage.setItem('user', JSON.stringify(managerUser));
        localStorage.setItem('token', response.token);
        invalidateAuthSession();
        navigate('/propertyowner/admin');
      }
    } catch (err) {
      let message = 'Login failed. Please try again.';
      try {
        const parsed = JSON.parse(err?.body || '{}');
        message = parsed?.message || err?.message || message;
      } catch (_) {
        message = err?.message || message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    setLoading(true);

    try {
      const response = await fetchJson('/api/property-managers/reset-initial-password', {
        method: 'POST',
        body: JSON.stringify({
          loginId,
          oldPassword: password,
          newPassword
        })
      });

      if (response.success) {
        setRequireReset(false);
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess('Password reset successfully. Please login with your new password.');
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (err) {
      setError(err?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxWidth: '450px', width: '100%', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img src="/website/roomhy_logo.jpeg" alt="RoomHy" style={{ height: '48px', width: 'auto', objectFit: 'contain', margin: '0 auto 20px', display: 'block' }} />
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '0 0 10px' }}>
            {requireReset ? 'Reset Password' : 'Property Manager Login'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            {requireReset ? 'For security reasons, you must change your initial password.' : 'Enter your credentials to access your dashboard'}
          </p>
        </div>

        {requireReset ? (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontSize: '14px', fontWeight: '600' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  style={{ width: '100%', padding: '12px 48px 12px 16px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', outline: 'none', transition: 'border 0.3s' }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontSize: '14px', fontWeight: '600' }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  style={{ width: '100%', padding: '12px 48px 12px 16px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', outline: 'none', transition: 'border 0.3s' }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {error && (
              <div style={{ background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '8px', padding: '12px', marginBottom: '20px', color: '#991b1b', fontSize: '14px' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background: '#dcfce7', border: '1px solid #22c55e', borderRadius: '8px', padding: '12px', marginBottom: '20px', color: '#166534', fontSize: '14px' }}>
                {success}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Resetting...' : 'Reset & Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontSize: '14px', fontWeight: '600' }}>Manager ID</label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="MGR1234"
              required
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', outline: 'none', transition: 'border 0.3s' }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontSize: '14px', fontWeight: '600' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{ width: '100%', padding: '12px 48px 12px 16px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', outline: 'none', transition: 'border 0.3s' }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '8px', padding: '12px', marginBottom: '20px', color: '#991b1b', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ background: '#dcfce7', border: '1px solid #22c55e', borderRadius: '8px', padding: '12px', marginBottom: '20px', color: '#166534', fontSize: '14px' }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        )}

        <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          <p>Need help? Contact your property owner</p>
        </div>
      </div>
    </div>
  );
};

export default ManagerLogin;
