import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { ShoppingBag, MapPin, CreditCard, AlertCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const CartPage = () => {
  const { cartItems, restaurantId, subtotal, deliveryFee, tax, grandTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [address, setAddress] = useState(user?.addresses?.[0] || { street: '742 Evergreen Terrace', city: 'Metropolis', zipCode: '10001' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { addToast } = useSocket();

  if (cartItems.length === 0) {
    return (
      <div className="main-content" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <ShoppingBag size={52} style={{ color: '#64748b', marginBottom: 16 }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>Your cart is waiting</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.95rem' }}>
          Explore Metropolis's top restaurants and add something delicious to your order.
        </p>
        <button onClick={() => navigate('/customer')} className="btn btn-primary">
          Explore Restaurants
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        restaurantId,
        items: cartItems.map((ci) => ({ menuItemId: ci.menuItemId, quantity: ci.quantity })),
        deliveryAddress: address
      };

      const res = await api.post('/customer/orders', payload);
      if (res.data.success) {
        addToast(`🎉 Order #${res.data.order.orderNumber} placed successfully!`, 'success');
        clearCart();
        navigate(`/customer/orders/${res.data.order._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'We could not place your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: 960 }}>
      <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '-0.4px' }}>
        <ShoppingBag size={30} style={{ color: 'var(--primary)' }} /> Order Checkout
      </h1>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171', padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertCircle size={22} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28 }}>
        <div>
          {/* Order Items */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 18, borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>Order Items</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {cartItems.map((ci) => (
                <div key={ci.menuItemId} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <img src={ci.image} alt={ci.name} style={{ width: 60, height: 60, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>{ci.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>${ci.price} × {ci.quantity}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>${ci.price * ci.quantity}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={20} style={{ color: 'var(--primary)' }} /> Delivery Address
            </h3>
            <div className="form-group">
              <label className="form-label">Street Address</label>
              <input
                type="text"
                className="form-input"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input type="text" className="form-input" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Zip Code</label>
                <input type="text" className="form-input" value={address.zipCode} onChange={(e) => setAddress({ ...address, zipCode: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Summary Panel */}
        <div>
          <div className="card" style={{ position: 'sticky', top: 90 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={20} style={{ color: 'var(--secondary)' }} /> Payment Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.92rem', marginBottom: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}><span>Subtotal</span><span>${subtotal}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}><span>Delivery Fee</span><span>${deliveryFee}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}><span>Taxes (5%)</span><span>${tax}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.15rem', color: '#ffffff', paddingTop: 12, borderTop: '1px dashed var(--border-color)' }}>
                <span>Grand Total</span>
                <span style={{ color: 'var(--primary)' }}>${grandTotal}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: 12, borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: '#4ade80', marginBottom: 20, textAlign: 'center', fontWeight: 600 }}>
              🔒 Demo Payment Gateway Pre-Approved
            </div>

            <button onClick={handlePlaceOrder} disabled={submitting} className="btn btn-primary" style={{ width: '100%', padding: 14, fontSize: '1rem' }}>
              {submitting ? 'Placing your order...' : `Confirm & Pay $${grandTotal}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
