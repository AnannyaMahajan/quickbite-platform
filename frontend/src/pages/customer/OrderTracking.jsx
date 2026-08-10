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
    const interval = setInterval(fetchOrder, 5000);
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

  if (loading) return (
    <div className="main-content" style={{ padding: '80px 20px', textAlign: 'center' }}>
      <div className="skeleton" style={{ height: 28, width: 240, margin: '0 auto 16px' }} />
      <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Tracking your delivery in real-time...</p>
    </div>
  );

  if (!order) return (
    <div className="main-content" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h2>Order Not Found</h2>
      <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>We couldn't locate the requested order reference.</p>
    </div>
  );

  const canCancel = order.status === 'PLACED';

  const getStatusHeadline = () => {
    switch (order.status) {
      case 'PLACED': return 'Order placed! Waiting for restaurant to accept...';
      case 'RESTAURANT_ACCEPTED': return 'Restaurant accepted your order!';
      case 'PREPARING': return 'Chef is preparing your meal in the kitchen 🍳';
      case 'READY_FOR_PICKUP': return 'Food is ready! Waiting for rider pickup 🛵';
      case 'DELIVERY_ASSIGNED': return 'Rider assigned & heading to restaurant 🚴';
      case 'AT_RESTAURANT': return 'Rider arrived at restaurant 📍';
      case 'PICKED_UP': return 'Food picked up! Rider is on the way 🚀';
      case 'OUT_FOR_DELIVERY': return 'Almost there! Rider is nearby 🚚';
      case 'DELIVERED': return 'Delivered! Enjoy your meal 😋';
      case 'CANCELLED': return 'Order Cancelled';
      default: return 'Live Delivery Tracking';
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: 920 }}>
      {/* Header Summary */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Order Reference Number</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>#{order.orderNumber}</div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {cancelError && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171', padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertCircle size={22} />
          <span>{cancelError}</span>
        </div>
      )}

      {/* Visual State Timeline */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 16, color: 'var(--primary)' }}>
          {getStatusHeadline()}
        </h3>
        <OrderTimeline status={order.status} />
      </div>

      {/* Driver & Restaurant Details */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Restaurant Info */}
        <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Store size={36} style={{ color: 'var(--primary)' }} />
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Restaurant</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{order.restaurantId?.name}</div>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{order.restaurantId?.address?.street}</div>
          </div>
        </div>

        {/* Assigned Rider Info */}
        <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Bike size={36} style={{ color: '#06b6d4' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Delivery Partner</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>
              {order.assignedDeliveryPartnerId ? order.assignedDeliveryPartnerId.name : 'Finding nearest rider...'}
            </div>
            {order.assignedDeliveryPartnerId && (
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <Phone size={14} /> {order.assignedDeliveryPartnerId.phone} • ⭐ {order.assignedDeliveryPartnerId.rating}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Summary & Actions */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 18, borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>Order Items</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {order.items.map((i) => (
            <div key={i.menuItemId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
              <span>{i.name} × {i.quantity}</span>
              <span style={{ fontWeight: 700 }}>${i.subtotal}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary)', paddingTop: 12, borderTop: '1px dashed var(--border-color)' }}>
            <span>Total Amount Paid</span>
            <span>${order.grandTotal}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {canCancel && (
            <button onClick={handleCancelOrder} disabled={cancelling} className="btn btn-danger btn-sm">
              {cancelling ? 'Cancelling...' : 'Cancel Order (Before Kitchen Prep)'}
            </button>
          )}

          {['DELIVERED', 'COMPLETED'].includes(order.status) && (
            <button onClick={() => setIsRatingOpen(true)} className="btn btn-primary btn-sm">
              <Star size={16} /> Rate Order & Delivery
            </button>
          )}

          <button onClick={() => setIsComplaintOpen(true)} className="btn btn-secondary btn-sm" style={{ color: '#f87171' }}>
            <ShieldAlert size={16} /> Need help with your order?
          </button>
        </div>
      </div>

      {/* Modals */}
      <RatingModal isOpen={isRatingOpen} onClose={() => setIsRatingOpen(false)} order={order} />
      <ComplaintModal isOpen={isComplaintOpen} onClose={() => setIsComplaintOpen(false)} order={order} />
    </div>
  );
};
