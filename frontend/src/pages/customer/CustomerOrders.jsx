import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { ShoppingBag, ArrowRight, UtensilsCrossed } from 'lucide-react';

export const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customer/orders');
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (error) {
      console.error('Error loading order history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: 960 }}>
      <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12, letterSpacing: '-0.4px' }}>
        <ShoppingBag size={30} style={{ color: 'var(--primary)' }} /> Your Order History
      </h1>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
          <div className="skeleton" style={{ height: 24, width: 220, margin: '0 auto 16px' }} />
          <p style={{ fontWeight: 600 }}>Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <UtensilsCrossed size={48} style={{ color: '#64748b', marginBottom: 14 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>You haven't ordered anything yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
            When you place an order, it will appear here so you can track it in real-time.
          </p>
          <button onClick={() => navigate('/customer')} className="btn btn-primary">
            Explore Restaurants
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map((o) => (
            <div
              key={o._id}
              className="card card-interactive"
              onClick={() => navigate(`/customer/orders/${o._id}`)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary)' }}>#{o.orderNumber}</span>
                  <StatusBadge status={o.status} />
                </div>
                <div style={{ fontSize: '0.95rem', color: '#f8fafc', fontWeight: 700 }}>{o.restaurantId?.name}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {new Date(o.createdAt).toLocaleDateString()} at {new Date(o.createdAt).toLocaleTimeString()} • {o.items.length} {o.items.length === 1 ? 'item' : 'items'}
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 20 }}>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>${o.grandTotal}</div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 700 }}>Track & Details</span>
                </div>
                <ArrowRight size={22} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
