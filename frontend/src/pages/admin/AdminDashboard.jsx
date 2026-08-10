import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { Shield, Users, Store, ShoppingBag, AlertTriangle, CheckCircle, Ban, DollarSign } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, restaurants, orders, users, complaints
  const [loading, setLoading] = useState(true);
  const { addToast } = useSocket();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, restRes, ordersRes, usersRes, complaintsRes] = await Promise.all([
        api.get('/analytics/admin'),
        api.get('/admin/restaurants'),
        api.get('/admin/orders'),
        api.get('/admin/users'),
        api.get('/complaints/admin')
      ]);

      if (analyticsRes.data.success) setMetrics(analyticsRes.data.metrics);
      if (restRes.data.success) setRestaurants(restRes.data.restaurants);
      if (ordersRes.data.success) setOrders(ordersRes.data.orders);
      if (usersRes.data.success) setUsers(usersRes.data.users);
      if (complaintsRes.data.success) setComplaints(complaintsRes.data.complaints);
    } catch (error) {
      console.error('Error loading admin console:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRestaurant = async (id, currentApproved) => {
    try {
      const res = await api.patch(`/admin/restaurants/${id}/approve`, { isApproved: !currentApproved });
      if (res.data.success) {
        addToast(`Restaurant approval updated.`, 'success');
        setRestaurants((prev) => prev.map((r) => (r._id === id ? { ...r, isApproved: !currentApproved } : r)));
      }
    } catch (err) {
      addToast('Failed to update approval.', 'danger');
    }
  };

  const handleToggleSuspension = async (userId) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/suspend`);
      if (res.data.success) {
        addToast(res.data.message, 'warning');
        setUsers((prev) => prev.map((u) => (u._id === userId ? res.data.user : u)));
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to toggle suspension.', 'danger');
    }
  };

  const handleResolveComplaint = async (complaintId) => {
    const notes = prompt('Enter resolution notes for customer dispute ticket:');
    if (!notes) return;

    try {
      const res = await api.patch(`/complaints/${complaintId}/resolve`, {
        status: 'RESOLVED',
        resolutionNotes: notes,
        refundAmount: 20
      });
      if (res.data.success) {
        addToast('Dispute resolved successfully!', 'success');
        setComplaints((prev) => prev.map((c) => (c._id === complaintId ? res.data.complaint : c)));
      }
    } catch (err) {
      addToast('Failed to resolve complaint.', 'danger');
    }
  };

  if (loading) return <div className="main-content" style={{ padding: 60, textAlign: 'center' }}>Loading Platform Admin Console...</div>;

  return (
    <div className="main-content">
      {/* Header */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={28} style={{ color: 'var(--primary)' }} /> Platform Administrator Control Center
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Monitor platform health, onboard partners, manage disputes, and inspect live fleet</p>
        </div>
      </div>

      {/* Health Metrics Grid */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Platform GMV</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>${metrics?.totalGMV || 0}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Orders Processed</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>{metrics?.totalOrders || 0}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Cancellation Rate</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b' }}>{metrics?.cancellationRate || 0}%</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Open Customer Disputes</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444' }}>{metrics?.openComplaints || 0} tickets</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid #334155', marginBottom: 24, overflowX: 'auto' }}>
        {['overview', 'restaurants', 'orders', 'users', 'complaints'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 18px',
              fontWeight: 700,
              textTransform: 'capitalize',
              color: activeTab === tab ? 'var(--primary)' : '#94a3b8',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : 'none',
              background: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid-2">
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 14 }}>Platform Operations Overview</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Approved Active Restaurants</span><strong style={{ color: '#4ade80' }}>{metrics?.totalRestaurants}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Active Delivery Partners</span><strong style={{ color: '#06b6d4' }}>{metrics?.activeDeliveryPartners}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Registered Customers</span><strong style={{ color: '#ffffff' }}>{metrics?.totalCustomers}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Successful Deliveries</span><strong style={{ color: '#22c55e' }}>{metrics?.completedOrders}</strong></div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 14 }}>Suspicious Order / Fraud Risk Monitor</h3>
            {orders.filter((o) => o.isFlaggedForFraud).length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No anomalous or suspicious orders flagged by security heuristics.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orders.filter((o) => o.isFlaggedForFraud).slice(0, 4).map((o) => (
                  <div key={o._id} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', padding: 10, borderRadius: 8, fontSize: '0.82rem', color: '#f87171' }}>
                    <div style={{ fontWeight: 700 }}>Order #{o.orderNumber} - High Amount Anomaly (${o.grandTotal})</div>
                    <div>Customer: {o.customerId?.name} ({o.customerId?.email})</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RESTAURANTS TAB */}
      {activeTab === 'restaurants' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Restaurant Name</th>
                <th>Owner Details</th>
                <th>Cuisines</th>
                <th>Rating</th>
                <th>Approval Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{r.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{r.address.street}</div>
                  </td>
                  <td>
                    <div>{r.ownerId?.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{r.ownerId?.email}</div>
                  </td>
                  <td>{r.cuisines.join(', ')}</td>
                  <td style={{ color: '#f59e0b', fontWeight: 700 }}>⭐ {r.rating}</td>
                  <td>
                    <span style={{ color: r.isApproved ? '#4ade80' : '#f87171', fontWeight: 700, fontSize: '0.8rem' }}>
                      {r.isApproved ? 'APPROVED' : 'PENDING'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleApproveRestaurant(r._id, r.isApproved)}
                      className={`btn btn-sm ${r.isApproved ? 'btn-danger' : 'btn-success'}`}
                    >
                      {r.isApproved ? 'Revoke Approval' : 'Approve Restaurant'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Customer</th>
                <th>Restaurant</th>
                <th>Assigned Rider</th>
                <th>Grand Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>#{o.orderNumber}</td>
                  <td>{o.customerId?.name}</td>
                  <td>{o.restaurantId?.name}</td>
                  <td>{o.assignedDeliveryPartnerId ? o.assignedDeliveryPartnerId.name : 'Unassigned'}</td>
                  <td style={{ fontWeight: 700 }}>${o.grandTotal}</td>
                  <td><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Account Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 700 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span style={{ fontWeight: 700, fontSize: '0.78rem' }}>{u.role}</span></td>
                  <td>
                    <span style={{ color: u.isSuspended ? '#f87171' : '#4ade80', fontWeight: 700, fontSize: '0.8rem' }}>
                      {u.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td>
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleToggleSuspension(u._id)}
                        className={`btn btn-sm ${u.isSuspended ? 'btn-success' : 'btn-danger'}`}
                      >
                        {u.isSuspended ? 'Unsuspend' : 'Suspend Account'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* COMPLAINTS TAB */}
      {activeTab === 'complaints' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Ticket Ref</th>
                <th>Customer</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Status</th>
                <th>Resolution Action</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 700, color: '#ef4444' }}>{c.ticketNumber}</td>
                  <td>{c.customerId?.name}</td>
                  <td>{c.subject}</td>
                  <td><span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{c.category}</span></td>
                  <td>
                    <span style={{ color: c.status === 'RESOLVED' ? '#4ade80' : '#f59e0b', fontWeight: 700, fontSize: '0.8rem' }}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    {c.status !== 'RESOLVED' ? (
                      <button onClick={() => handleResolveComplaint(c._id)} className="btn btn-primary btn-sm">
                        Resolve & Refund
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{c.resolutionNotes}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
