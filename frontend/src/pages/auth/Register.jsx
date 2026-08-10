import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UtensilsCrossed } from 'lucide-react';
import api from '../../services/api';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CUSTOMER',
    phone: '',
    street: '',
    city: '',
    zipCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
        address: formData.street ? { street: formData.street, city: formData.city, zipCode: formData.zipCode } : undefined
      };

      const res = await api.post('/auth/register', payload);
      if (res.data.success) {
        alert('Registration successful! Please log in.');
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 20 }}>
      <div className="card" style={{ padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="brand-logo" style={{ justifyContent: 'center', marginBottom: 8 }}>
            <UtensilsCrossed size={32} />
            Quick<span>Bite</span>
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Create New Account</h2>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: 12, borderRadius: 8, fontSize: '0.85rem', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Account Role</label>
            <select className="form-input" name="role" value={formData.role} onChange={handleChange}>
              <option value="CUSTOMER">Customer (Food Ordering)</option>
              <option value="RESTAURANT_OWNER">Restaurant Owner</option>
              <option value="DELIVERY_PARTNER">Delivery Partner / Rider</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" name="password" value={formData.password} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input type="text" className="form-input" name="phone" value={formData.phone} onChange={handleChange} />
          </div>

          {formData.role === 'CUSTOMER' && (
            <>
              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input type="text" className="form-input" name="street" value={formData.street} onChange={handleChange} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input type="text" className="form-input" name="city" value={formData.city} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Zip Code</label>
                  <input type="text" className="form-input" name="zipCode" value={formData.zipCode} onChange={handleChange} />
                </div>
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: '#94a3b8' }}>
          Already registered? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Log In</Link>
        </div>
      </div>
    </div>
  );
};
