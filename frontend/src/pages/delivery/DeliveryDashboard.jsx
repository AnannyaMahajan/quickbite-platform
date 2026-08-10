import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import { Bike, MapPin, Store, CheckCircle, Navigation, Power } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [history, setHistory] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true);
  const [loading, setLoading] = useState(true);
  const { addToast } = useSocket();

  useEffect(() => {
    fetchDeliveryData();
    const interval = setInterval(fetchAssignmentsOnly, 5000);
    return () => clearInterval(interval);
  }, []);

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
        addToast(`Duty status set to ${res.data.isAvailable ? 'ONLINE' : 'OFFLINE'}`, 'info');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Couldn\'t change your availability status. Please try again.', 'danger');
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
        addToast('Trip declined. Order reassigned to next available rider.', 'warning');
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
    <div className="main-content theme-dark" style={{ padding: '80px 20px', textAlign: 'center' }}>
      <div className="skeleton" style={{ height: 28, width: 240, margin: '0 auto 16px' }} />
      <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading rider console...</p>
    </div>
  );

  const driverName = user?.name ? user.name.split(' ')[0] : 'David';

  return (
    <div className="main-content theme-dark" style={{ maxWidth: 840 }}>
      {/* Duty Status & Earnings Header */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 2 }}>
            Good morning, {driverName} 👋
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Rider Fleet Console</h1>
            <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 800, background: isAvailable ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.18)', color: isAvailable ? '#4ade80' : '#f87171' }}>
              {isAvailable ? '● ONLINE' : '○ OFFLINE'}
            </span>
          </div>
        </div>

        <button onClick={handleToggleAvailability} className={`btn ${isAvailable ? 'btn-danger' : 'btn-success'}`}>
          <Power size={16} /> {isAvailable ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {/* Driver Earnings Bar */}
      <div className="grid-3" style={{ marginBottom: 28 }}>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Today's Earnings</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>${earnings?.totalEarnings || 0}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completed Trips</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginTop: 2 }}>{earnings?.totalCompleted || 0}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Payout Per Trip</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>$45</div>
        </div>
      </div>

      {/* Active Trips Focus */}
      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Bike size={24} style={{ color: 'var(--primary)' }} /> Active Delivery Assignment ({assignments.length})
      </h2>

      {assignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)', marginBottom: 32 }}>
          <Bike size={44} style={{ color: '#64748b', marginBottom: 12 }} />
          <p style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>No active deliveries right now</p>
          <p style={{ fontSize: '0.86rem', marginTop: 4 }}>Stay online and we'll send your next trip here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
          {assignments.map((asgn) => {
            const order = asgn.orderId;
            if (!order) return null;

            return (
              <div key={asgn._id} className="card" style={{ borderLeft: '5px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>Order #{order.orderNumber}</span>
                    <span style={{ marginLeft: 12, fontSize: '0.9rem', color: '#4ade80', fontWeight: 800 }}>+ $45 Payout</span>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {/* Pickup & Dropoff Cards */}
                <div className="grid-2" style={{ marginBottom: 20 }}>
                  <div style={{ background: 'var(--bg-main)', padding: 14, borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Store size={15} style={{ color: 'var(--primary)' }} /> PICK UP FROM
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>{order.restaurantId?.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{order.restaurantId?.address?.street}</div>
                  </div>

                  <div style={{ background: 'var(--bg-main)', padding: 14, borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <MapPin size={15} style={{ color: '#38bdf8' }} /> DELIVER TO
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>{order.customerId?.name} ({order.customerId?.phone})</div>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{order.deliveryAddress?.street}, {order.deliveryAddress?.city}</div>
                  </div>
                </div>

                {/* Dominant Next Step Button */}
                <div>
                  {asgn.status === 'ASSIGNED' && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => handleAcceptAssignment(asgn._id)} className="btn btn-success" style={{ flex: 1, padding: 14, fontSize: '1rem' }}>
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
                        <button onClick={() => handleUpdateDeliveryStatus(order._id, 'AT_RESTAURANT')} className="btn btn-primary" style={{ flex: 1, padding: 14, fontSize: '1rem' }}>
                          <Navigation size={18} /> I've Arrived at Restaurant
                        </button>
                      )}
                      {order.status === 'AT_RESTAURANT' && (
                        <button onClick={() => handleUpdateDeliveryStatus(order._id, 'PICKED_UP')} className="btn btn-success" style={{ flex: 1, padding: 14, fontSize: '1rem' }}>
                          <CheckCircle size={18} /> Confirm Food Picked Up
                        </button>
                      )}
                      {order.status === 'PICKED_UP' && (
                        <button onClick={() => handleUpdateDeliveryStatus(order._id, 'OUT_FOR_DELIVERY')} className="btn btn-primary" style={{ flex: 1, padding: 14, fontSize: '1rem' }}>
                          <Navigation size={18} /> Start Navigation to Customer
                        </button>
                      )}
                      {order.status === 'OUT_FOR_DELIVERY' && (
                        <button onClick={() => handleUpdateDeliveryStatus(order._id, 'DELIVERED')} className="btn btn-success" style={{ flex: 1, padding: 14, fontSize: '1rem' }}>
                          <CheckCircle size={18} /> Complete Delivery & Collect Payout
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
