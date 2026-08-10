import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { OrderTimeline } from '../../components/OrderTimeline';
import { StatusBadge } from '../../components/StatusBadge';
import { RatingModal } from '../../components/RatingModal';
import { ComplaintModal } from '../../components/ComplaintModal';
import { Bike, Store, Phone, ShieldAlert, Star, AlertCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const OrderTracking = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const { addToast } = useSocket();

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000); // Polling backup alongside WebSockets
    return () => clearInterval(interval);
  }, [id]);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/customer/orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.order);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelError('');
    setCancelling(true);

    try {
      const res = await api.patch(`/customer/orders/${id}/cancel`, {
        reason: 'Customer cancelled from tracking screen'
      });
      if (res.data.success) {
        addToast('Order cancelled successfully.', 'warning');
        setOrder(res.data.order);
      }
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Cancellation failed.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="main-content" style={{ padding: 60, textAlign: 'center' }}>Loading live order tracking...</div>;
  if (!order) return <div className="main-content">Order not found</div>;

  const canCancel = order.status === 'PLACED';

  return (
    <div className="main-content" style={{ maxWidth: 900 }}>
      {/* Header Info */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Order Reference Number</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>#{order.orderNumber}</div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {cancelError && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: 14, borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={20} />
          <span>{cancelError}</span>
        </div>
      )}

      {/* Visual Multi-step State Timeline */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 10 }}>Live Delivery Progress</h3>
        <OrderTimeline status={order.status} />
      </div>

      {/* Driver & Restaurant Details Grid */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Restaurant Card */}
        <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Store size={32} style={{ color: 'var(--primary)' }} />
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Restaurant</div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{order.restaurantId?.name}</div>
            <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>{order.restaurantId?.address?.street}</div>
          </div>
        </div>

        {/* Assigned Rider Card */}
        <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Bike size={32} style={{ color: '#06b6d4' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Assigned Delivery Partner</div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>
              {order.assignedDeliveryPartnerId ? order.assignedDeliveryPartnerId.name : 'Searching nearby riders...'}
            </div>
            {order.assignedDeliveryPartnerId && (
              <div style={{ fontSize: '0.82rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={12} /> {order.assignedDeliveryPartnerId.phone} • ⭐ {order.assignedDeliveryPartnerId.rating}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions & Items Card */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, borderBottom: '1px solid #334155', paddingBottom: 8 }}>Order Summary</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {order.items.map((i) => (
            <div key={i.menuItemId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>{i.name} x {i.quantity}</span>
              <span style={{ fontWeight: 700 }}>${i.subtotal}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)', paddingTop: 10, borderTop: '1px dashed #334155' }}>
            <span>Grand Total Paid</span>
            <span>${order.grandTotal}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {canCancel && (
            <button onClick={handleCancelOrder} disabled={cancelling} className="btn btn-danger btn-sm">
              {cancelling ? 'Cancelling...' : 'Cancel Order (Before Prep Starts)'}
            </button>
          )}

          {['DELIVERED', 'COMPLETED'].includes(order.status) && (
            <button onClick={() => setIsRatingOpen(true)} className="btn btn-primary btn-sm">
              <Star size={16} /> Rate Order & Delivery
            </button>
          )}

          <button onClick={() => setIsComplaintOpen(true)} className="btn btn-secondary btn-sm" style={{ color: '#f87171' }}>
            <ShieldAlert size={16} /> File Dispute / Complaint
          </button>
        </div>
      </div>

      {/* Modals */}
      <RatingModal isOpen={isRatingOpen} onClose={() => setIsRatingOpen(false)} order={order} />
      <ComplaintModal isOpen={isComplaintOpen} onClose={() => setIsComplaintOpen(false)} order={order} />
    </div>
  );
};
