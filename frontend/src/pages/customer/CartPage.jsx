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
      <div className="main-content" style={{ textAlign: 'center', padding: 80 }}>
        <ShoppingBag size={48} style={{ color: '#94a3b8', marginBottom: 12 }} />
        <h2>Your Shopping Cart is Empty</h2>
        <p style={{ color: '#94a3b8', margin: '8px 0 20px' }}>Explore top restaurants and add delicious items to order.</p>
        <button onClick={() => navigate('/customer')} className="btn btn-primary">Browse Restaurants</button>
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
        addToast(`✅ Order #${res.data.order.orderNumber} placed successfully!`, 'success');
        clearCart();
        navigate(`/customer/orders/${res.data.order._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        <ShoppingBag size={28} style={{ color: 'var(--primary)' }} /> Order Checkout
      </h1>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: 14, borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div>
          {/* Items Summary */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, borderBottom: '1px solid #334155', paddingBottom: 8 }}>Order Items</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {cartItems.map((ci) => (
                <div key={ci.menuItemId} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <img src={ci.image} alt={ci.name} style={{ width: 54, height: 54, borderRadius: 8, objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{ci.name}</div>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>${ci.price} x {ci.quantity}</div>
                  </div>
                  <div style={{ fontWeight: 800 }}>${ci.price * ci.quantity}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address Picker */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

        {/* Payment & Order Summary Panel */}
        <div>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={20} /> Payment Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}><span>Subtotal</span><span>${subtotal}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}><span>Delivery Fee</span><span>${deliveryFee}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}><span>Taxes (5%)</span><span>${tax}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', color: '#ffffff', paddingTop: 10, borderTop: '1px dashed #334155' }}>
                <span>Grand Total</span>
                <span style={{ color: 'var(--primary)' }}>${grandTotal}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: 10, borderRadius: 8, fontSize: '0.78rem', color: '#4ade80', marginBottom: 16 }}>
              🔒 Demo Payment Gateway Pre-Approved
            </div>

            <button onClick={handlePlaceOrder} disabled={submitting} className="btn btn-primary" style={{ width: '100%', padding: 12, fontSize: '1rem' }}>
              {submitting ? 'Processing Order...' : `Confirm & Pay $${grandTotal}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
