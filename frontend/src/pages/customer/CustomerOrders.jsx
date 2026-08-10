import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { ShoppingBag, ArrowRight } from 'lucide-react';

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
    <div className="main-content">
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <ShoppingBag size={28} style={{ color: 'var(--primary)' }} /> Your Order History
      </h1>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 50 }}>No orders placed yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {orders.map((o) => (
            <div
              key={o._id}
              className="card card-interactive"
              onClick={() => navigate(`/customer/orders/${o._id}`)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>#{o.orderNumber}</span>
                  <StatusBadge status={o.status} />
                </div>
                <div style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>{o.restaurantId?.name}</div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  {new Date(o.createdAt).toLocaleDateString()} at {new Date(o.createdAt).toLocaleTimeString()} • {o.items.length} items
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>${o.grandTotal}</div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>Track & Details</span>
                </div>
                <ArrowRight size={20} style={{ color: '#94a3b8' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
