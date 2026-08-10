import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UtensilsCrossed, Shield, Store, Bike, User } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('customer@quickbite.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (result.success) {
      navigate('/customer');
    } else {
      setError(result.message);
    }
  };

  const handleDemo = async (role) => {
    await demoLogin(role);
    if (role === 'CUSTOMER') navigate('/customer');
    if (role === 'RESTAURANT_OWNER') navigate('/restaurant');
    if (role === 'DELIVERY_PARTNER') navigate('/delivery');
    if (role === 'ADMIN') navigate('/admin');
  };

  return (
    <div style={{ maxWidth: 440, margin: '60px auto', padding: 20 }}>
      <div className="card" style={{ padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="brand-logo" style={{ justifyContent: 'center', marginBottom: 8 }}>
            <UtensilsCrossed size={32} />
            Quick<span>Bite</span>
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Log In to Platform</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Access your personalized operations portal</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: 12, borderRadius: 8, fontSize: '0.85rem', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
            Sign In
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #334155' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f97316', textAlign: 'center', marginBottom: 12 }}>
            ⚡ ONE-CLICK DEMO LOGIN FOR TESTING:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button onClick={() => handleDemo('CUSTOMER')} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
              <User size={14} /> Customer
            </button>
            <button onClick={() => handleDemo('RESTAURANT_OWNER')} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
              <Store size={14} /> Owner
            </button>
            <button onClick={() => handleDemo('DELIVERY_PARTNER')} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
              <Bike size={14} /> Driver
            </button>
            <button onClick={() => handleDemo('ADMIN')} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
              <Shield size={14} /> Admin
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: '#94a3b8' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Register</Link>
        </div>
      </div>
    </div>
  );
};
