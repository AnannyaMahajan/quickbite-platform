import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { Bike, DollarSign, MapPin, CheckCircle2, XCircle, Power, Navigation, PackageCheck } from 'lucide-react';
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
    const interval = setInterval(fetchDeliveryData, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchDeliveryData = async () => {
    try {
      const [assignRes, historyRes, earningsRes] = await Promise.all([
        api.get('/delivery/assignments'),
        api.get('/delivery/history'),
        api.get('/delivery/earnings')
      ]);
      if (assignRes.data.success) setAssignments(assignRes.data.assignments);
      if (historyRes.data.success) setHistory(historyRes.data.assignments);
      if (earningsRes.data.success) setEarnings(earningsRes.data);
    } catch (error) {
      console.error('Error fetching delivery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (assignmentId) => {
    try {
      const res = await api.post(`/delivery/assignments/${assignmentId}/accept`);
      if (res.data.success) {
        addToast('Delivery accepted! Navigate to restaurant.', 'success');
        fetchDeliveryData();
      }
    } catch (err) {
      addToast('Failed to accept trip.', 'danger');
    }
  };

  const handleReject = async (assignmentId) => {
    if (!window.confirm('Reject delivery assignment? System will reassign trip to another available rider.')) return;
    try {
      const res = await api.post(`/delivery/assignments/${assignmentId}/reject`, { reason: 'Rider busy' });
      if (res.data.success) {
        addToast('Assignment rejected. System automatically reassigned trip.', 'warning');
        fetchDeliveryData();
      }
    } catch (err) {
      addToast('Failed to reject assignment.', 'danger');
    }
  };

  const handleUpdateStatus = async (orderId, targetStatus) => {
    try {
      const res = await api.patch(`/delivery/orders/${orderId}/status`, { status: targetStatus });
      if (res.data.success) {
        addToast(`Trip status updated: ${targetStatus.replace(/_/g, ' ')}`, 'success');
        fetchDeliveryData();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update delivery status.', 'danger');
    }
  };

  const handleToggleAvailability = async () => {
    try {
      const res = await api.patch('/delivery/availability');
      if (res.data.success) {
        setIsAvailable(res.data.isAvailable);
        addToast(`Duty status: ${res.data.isAvailable ? 'ONLINE / READY' : 'OFFLINE'}`, 'info');
      }
    } catch (err) {
      addToast('Failed to toggle duty status.', 'danger');
    }
  };

  if (loading) return <div className="main-content" style={{ padding: 60, textAlign: 'center' }}>Loading Rider App...</div>;

  return (
    <div className="main-content" style={{ maxWidth: 700 }}>
      {/* Mobile-First Rider Status Bar */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bike size={24} style={{ color: '#06b6d4' }} /> Rider Operations Portal
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Step-by-step trip execution and earnings tracker</p>
        </div>

        <button
          onClick={handleToggleAvailability}
          className={`btn btn-sm ${isAvailable ? 'btn-success' : 'btn-secondary'}`}
        >
          <Power size={14} /> {isAvailable ? 'ONLINE' : 'OFFLINE'}
        </button>
      </div>

      {/* Earnings Cards */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Total Earned</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>${earnings?.totalEarnings || 0}</div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Trips Completed</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4ade80' }}>{earnings?.totalCompleted || 0}</div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Rate / Trip</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>$45.00</div>
        </div>
      </div>

      {/* Active Trip Assignment */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>Active Trip Assignment ({assignments.length})</h2>

      {assignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#94a3b8', padding: 40, marginBottom: 24 }}>
          No active trip assignments. Standing by for dispatches...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {assignments.map((asg) => {
            const order = asg.orderId;
            if (!order) return null;

            return (
              <div key={asg._id} className="card" style={{ borderLeft: '4px solid #06b6d4', padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>#{order.orderNumber}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div style={{ fontWeight: 800, color: '#4ade80' }}>+$45.00 Payout</div>
                </div>

                {/* Step-by-Step Pickup & Drop Locations */}
                <div style={{ background: '#0f172a', padding: 12, borderRadius: 10, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <MapPin size={18} style={{ color: '#f59e0b', shrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>1. PICKUP RESTAURANT</div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{order.restaurantId?.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{order.restaurantId?.address?.street}</div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px dashed #334155', paddingTop: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Navigation size={18} style={{ color: '#22c55e', shrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>2. DROP OFF CUSTOMER</div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{order.customerId?.name} ({order.customerId?.phone})</div>
                      <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{order.deliveryAddress?.street}, {order.deliveryAddress?.city}</div>
                    </div>
                  </div>
                </div>

                {/* Step-by-Step Driver Action Progression */}
                {asg.status === 'ASSIGNED' && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => handleAccept(asg._id)} className="btn btn-success" style={{ flex: 1 }}>
                      <CheckCircle2 size={16} /> Accept Delivery
                    </button>
                    <button onClick={() => handleReject(asg._id)} className="btn btn-danger">
                      <XCircle size={16} /> Reject (Auto-Reassign)
                    </button>
                  </div>
                )}

                {asg.status === 'ACCEPTED' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {order.status === 'DELIVERY_ASSIGNED' && (
                      <button onClick={() => handleUpdateStatus(order._id, 'AT_RESTAURANT')} className="btn btn-primary" style={{ width: '100%' }}>
                        <MapPin size={16} /> Arrived at Restaurant
                      </button>
                    )}

                    {['AT_RESTAURANT', 'READY_FOR_PICKUP'].includes(order.status) && (
                      <button onClick={() => handleUpdateStatus(order._id, 'PICKED_UP')} className="btn btn-primary" style={{ width: '100%' }}>
                        <PackageCheck size={16} /> Confirm Pickup from Kitchen
                      </button>
                    )}

                    {order.status === 'PICKED_UP' && (
                      <button onClick={() => handleUpdateStatus(order._id, 'OUT_FOR_DELIVERY')} className="btn btn-primary" style={{ width: '100%' }}>
                        <Navigation size={16} /> Start Delivery Navigation
                      </button>
                    )}

                    {order.status === 'OUT_FOR_DELIVERY' && (
                      <button onClick={() => handleUpdateStatus(order._id, 'DELIVERED')} className="btn btn-success" style={{ width: '100%' }}>
                        <CheckCircle2 size={16} /> Mark Delivered to Customer
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* History */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>Completed Trips History ({history.length})</h2>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Order Ref</th>
              <th>Restaurant</th>
              <th>Earnings</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h._id}>
                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>#{h.orderId?.orderNumber}</td>
                <td>{h.orderId?.restaurantId?.name}</td>
                <td style={{ fontWeight: 700, color: '#4ade80' }}>+$45.00</td>
                <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(h.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
