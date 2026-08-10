import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { Bike, MapPin, Store, CheckCircle, Navigation, DollarSign, Power, AlertTriangle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const DeliveryDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [history, setHistory] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);
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
      const res = await api.patch('/delivery/availability');
      if (res.data.success) {
        setIsAvailable(res.data.isAvailable);
        addToast(`Duty status updated to ${res.data.isAvailable ? 'ONLINE' : 'OFFLINE'}`, 'info');
      }
    } catch (err) {
      addToast('Failed to update availability status.', 'danger');
    }
  };

  const handleAcceptAssignment = async (assignmentId) => {
    try {
      const res = await api.post(`/delivery/assignments/${assignmentId}/accept`);
      if (res.data.success) {
        addToast('Delivery trip accepted! Heading to restaurant.', 'success');
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
    <div className="main-content" style={{ padding: '80px 20px', textAlign: 'center' }}>
      <div className="skeleton" style={{ height: 28, width: 240, margin: '0 auto 16px' }} />
      <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading rider dashboard...</p>
    </div>
  );

  return (
    <div className="main-content" style={{ maxWidth: 960 }}>
      {/* Duty Status & Earnings Header */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.4px' }}>Rider Fleet App</h1>
            <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 800, background: isAvailable ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: isAvailable ? '#4ade80' : '#f87171' }}>
              {isAvailable ? '● ONLINE' : '○ OFFLINE'}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Metropolis Fleet Driver Console</p>
        </div>

        <button onClick={handleToggleAvailability} className={`btn ${isAvailable ? 'btn-danger' : 'btn-success'}`}>
          <Power size={16} /> {isAvailable ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {/* Earnings Summary Cards */}
      <div className="grid-3" style={{ marginBottom: 28 }}>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Completed Deliveries</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginTop: 2 }}>{earnings?.totalCompleted || 0}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Per-Delivery Payout</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>${earnings?.perDeliveryRate || 45}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Driver Earnings</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>${earnings?.totalEarnings || 0}</div>
        </div>
      </div>

      {/* Active Trips / Assignments Section */}
      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Bike size={24} style={{ color: 'var(--primary)' }} /> Active Delivery Assignments ({assignments.length})
      </h2>

      {assignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)', marginBottom: 32 }}>
          <Bike size={44} style={{ color: '#64748b', marginBottom: 12 }} />
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>No active delivery assignments right now.</p>
          <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Keep your status ONLINE to receive incoming delivery dispatches.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
          {assignments.map((asgn) => {
            const order = asgn.orderId;
            if (!order) return null;

            return (
              <div key={asgn._id} className="card" style={{ borderLeft: '5px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>Order #{order.orderNumber}</span>
                    <span style={{ marginLeft: 10, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pay: ${order.deliveryFee || 45}</span>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {/* Pickup & Dropoff Cards */}
                <div className="grid-2" style={{ marginBottom: 18 }}>
                  <div style={{ background: 'var(--bg-main)', padding: 14, borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Store size={15} style={{ color: 'var(--primary)' }} /> PICKUP LOCATION
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{order.restaurantId?.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{order.restaurantId?.address?.street}</div>
                  </div>

                  <div style={{ background: 'var(--bg-main)', padding: 14, borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <MapPin size={15} style={{ color: '#38bdf8' }} /> DROPOFF LOCATION
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{order.customerId?.name} ({order.customerId?.phone})</div>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{order.deliveryAddress?.street}, {order.deliveryAddress?.city}</div>
                  </div>
                </div>

                {/* Driver Actions State Machine Buttons */}
                <div>
                  {asgn.status === 'ASSIGNED' && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => handleAcceptAssignment(asgn._id)} className="btn btn-success" style={{ flex: 1 }}>
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
                        <button onClick={() => handleUpdateDeliveryStatus(order._id, 'AT_RESTAURANT')} className="btn btn-primary" style={{ flex: 1 }}>
                          <Navigation size={16} /> Arrived at Restaurant
                        </button>
                      )}
                      {order.status === 'AT_RESTAURANT' && (
                        <button onClick={() => handleUpdateDeliveryStatus(order._id, 'PICKED_UP')} className="btn btn-success" style={{ flex: 1 }}>
                          <CheckCircle size={16} /> Confirm Order Pickup
                        </button>
                      )}
                      {order.status === 'PICKED_UP' && (
                        <button onClick={() => handleUpdateDeliveryStatus(order._id, 'OUT_FOR_DELIVERY')} className="btn btn-primary" style={{ flex: 1 }}>
                          <Navigation size={16} /> Start Delivery Navigation
                        </button>
                      )}
                      {order.status === 'OUT_FOR_DELIVERY' && (
                        <button onClick={() => handleUpdateDeliveryStatus(order._id, 'DELIVERED')} className="btn btn-success" style={{ flex: 1, padding: 14 }}>
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

      {/* Completed History Table */}
      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 16 }}>Completed Trips History ({history.length})</h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Order Ref</th>
              <th>Restaurant</th>
              <th>Status</th>
              <th>Payout</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h._id}>
                <td style={{ fontWeight: 800, color: 'var(--primary)' }}>#{h.orderId?.orderNumber}</td>
                <td>{h.orderId?.restaurantId?.name || 'Restaurant'}</td>
                <td><span style={{ color: '#4ade80', fontWeight: 800, fontSize: '0.78rem' }}>COMPLETED</span></td>
                <td style={{ fontWeight: 800, color: '#38bdf8' }}>$45</td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{new Date(h.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
