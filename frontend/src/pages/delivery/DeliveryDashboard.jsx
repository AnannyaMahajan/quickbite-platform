import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import { Bike, MapPin, Store, CheckCircle, Navigation, Power } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const DeliveryDashboard = () => {
  const { user, token } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [history, setHistory] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true);
  const [loading, setLoading] = useState(true);
  const { addToast } = useSocket();

  useEffect(() => {
    if (!token || !user) return;
    fetchDeliveryData();
    const interval = setInterval(fetchAssignmentsOnly, 5000);
    return () => clearInterval(interval);
  }, [token, user]);

  const fetchDeliveryData = async () => {
    try {
      setLoading(true);
      const [assignRes, historyRes, earnRes] = await Promise.all([
        api.get('/delivery/assignments'),
        api.get('/delivery/history'),
        api.get('/delivery/earnings')
      ]);

      if (assignRes.data.success) setAssignments(assignRes.data.assignments);
      if (historyRes.data.success) setHistory(historyRes.data.assignments);
      if (earnRes.data.success) setEarnings(earnRes.data);
    } catch (error) {
      console.error('Error fetching delivery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentsOnly = async () => {
    try {
      const assignRes = await api.get('/delivery/assignments');
      if (assignRes.data.success) setAssignments(assignRes.data.assignments);
    } catch (err) {
      console.error('Assignments refresh error:', err);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      const nextAvailable = !isAvailable;
      const res = await api.patch('/delivery/availability', { isAvailable: nextAvailable });
      if (res.data.success) {
        setIsAvailable(res.data.isAvailable);
        addToast(`Duty status updated to ${res.data.isAvailable ? 'ONLINE' : 'OFFLINE'}`, 'info');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Could not update status. Please try again.', 'danger');
    }
  };

  const handleAcceptAssignment = async (assignmentId) => {
    try {
      const res = await api.post(`/delivery/assignments/${assignmentId}/accept`);
      if (res.data.success) {
        addToast('Trip accepted! Heading to restaurant.', 'success');
        fetchAssignmentsOnly();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to accept delivery.', 'danger');
    }
  };

  const handleRejectAssignment = async (assignmentId) => {
    try {
      const res = await api.post(`/delivery/assignments/${assignmentId}/reject`, { reason: 'Partner busy' });
      if (res.data.success) {
        addToast('Trip declined. Reassigned to next available rider.', 'warning');
        fetchAssignmentsOnly();
      }
    } catch (err) {
      addToast('Failed to decline assignment.', 'danger');
    }
  };

  const handleUpdateDeliveryStatus = async (orderId, targetStatus) => {
    try {
      const res = await api.patch(`/delivery/orders/${orderId}/status`, { status: targetStatus });
      if (res.data.success) {
        addToast(`Delivery status updated to ${targetStatus.replace(/_/g, ' ')}`, 'success');
        fetchDeliveryData();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update delivery status.', 'danger');
    }
  };

  if (loading) return (
    <div className="main-content" style={{ padding: '60px 18px', textAlign: 'center' }}>
      <div className="skeleton" style={{ height: 24, width: 220, margin: '0 auto 12px' }} />
      <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading rider console...</p>
    </div>
  );

  const driverName = user?.name ? user.name.split(' ')[0] : 'David';

  return (
    <div className="main-content" style={{ maxWidth: 780 }}>
      {/* Header Greeting & Duty Control */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>
            Good morning, {driverName} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            You're {isAvailable ? 'online and ready for deliveries.' : 'currently offline.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 800, background: isAvailable ? 'rgba(22, 163, 74, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isAvailable ? '#16A34A' : '#EF4444' }}>
            {isAvailable ? '● ONLINE' : '○ OFFLINE'}
          </span>
          <button onClick={handleToggleAvailability} className={`btn btn-sm ${isAvailable ? 'btn-secondary' : 'btn-success'}`}>
            <Power size={14} /> {isAvailable ? 'Go Offline' : 'Go Online'}
          </button>
        </div>
      </div>

      {/* Today's Progress Bar Card (White Card) */}
      <div className="card" style={{ marginBottom: 24, padding: '16px 20px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
          Today's progress
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Today's earnings</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>${earnings?.totalEarnings || 0}</div>
          </div>
          <div style={{ width: 1, height: 32, background: 'var(--border-color)' }} />
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Completed today</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>{earnings?.totalCompleted || 0}</div>
          </div>
          <div style={{ width: 1, height: 32, background: 'var(--border-color)' }} />
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Per-trip payout</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#3b82f6' }}>$45</div>
          </div>
        </div>
      </div>

      {/* Current Delivery Task */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Bike size={22} style={{ color: 'var(--primary)' }} /> Your next delivery
      </h2>

      {assignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-secondary)', marginBottom: 28 }}>
          <Bike size={36} style={{ color: 'var(--primary)', marginBottom: 8 }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>No delivery assigned yet</h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>Stay online and we'll show your next delivery here as soon as one is assigned.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
          {assignments.map((asgn) => {
            const order = asgn.orderId;
            if (!order) return null;

            return (
              <div key={asgn._id} className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>Order #{order.orderNumber}</span>
                    <span style={{ marginLeft: 10, fontSize: '0.85rem', color: '#16A34A', fontWeight: 800 }}>+ $45 Payout</span>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {/* Pickup & Dropoff */}
                <div className="grid-2" style={{ marginBottom: 16 }}>
                  <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                      <Store size={14} style={{ color: 'var(--primary)' }} /> PICK UP FROM
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>{order.restaurantId?.name}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{order.restaurantId?.address?.street}</div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                      <MapPin size={14} style={{ color: '#3b82f6' }} /> DELIVER TO
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>{order.customerId?.name} ({order.customerId?.phone})</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{order.deliveryAddress?.street}, {order.deliveryAddress?.city}</div>
                  </div>
                </div>

                {/* Step Action Button */}
                <div>
                  {asgn.status === 'ASSIGNED' && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => handleAcceptAssignment(asgn._id)} className="btn btn-success" style={{ flex: 1, padding: 12 }}>
                        Accept Delivery Trip
                      </button>
                      <button onClick={() => handleRejectAssignment(asgn._id)} className="btn btn-danger btn-sm">
                        Decline
                      </button>
                    </div>
                  )}

                  {asgn.status === 'ACCEPTED' && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {['DELIVERY_ASSIGNED', 'READY_FOR_PICKUP'].includes(order.status) && (
                        <button onClick={() => handleUpdateDeliveryStatus(order._id, 'AT_RESTAURANT')} className="btn btn-primary" style={{ flex: 1, padding: 12 }}>
                          <Navigation size={16} /> I've Arrived at Restaurant
                        </button>
                      )}
                      {order.status === 'AT_RESTAURANT' && (
                        <button onClick={() => handleUpdateDeliveryStatus(order._id, 'PICKED_UP')} className="btn btn-success" style={{ flex: 1, padding: 12 }}>
                          <CheckCircle size={16} /> Confirm Food Picked Up
                        </button>
                      )}
                      {order.status === 'PICKED_UP' && (
                        <button onClick={() => handleUpdateDeliveryStatus(order._id, 'OUT_FOR_DELIVERY')} className="btn btn-primary" style={{ flex: 1, padding: 12 }}>
                          <Navigation size={16} /> Start Delivery Navigation
                        </button>
                      )}
                      {order.status === 'OUT_FOR_DELIVERY' && (
                        <button onClick={() => handleUpdateDeliveryStatus(order._id, 'DELIVERED')} className="btn btn-success" style={{ flex: 1, padding: 12 }}>
                          <CheckCircle size={16} /> Complete Delivery & Collect Payout
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
