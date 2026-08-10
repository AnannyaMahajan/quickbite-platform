import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ShieldCheck, ShieldAlert, AlertTriangle, Users, Store, DollarSign, Check, X, FileText, CheckCircle2 } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, restaurants, users, complaints
  const [loading, setLoading] = useState(true);

  // Dispute Refund Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [refundForm, setRefundForm] = useState({ resolutionNotes: 'Approved full refund for packaging issue', refundAmount: 25 });
  const { addToast } = useSocket();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, restRes, userRes, compRes] = await Promise.all([
        api.get('/analytics/admin'),
        api.get('/admin/restaurants'),
        api.get('/admin/users'),
        api.get('/complaints/admin')
      ]);

      if (analyticsRes.data.success) setMetrics(analyticsRes.data.metrics);
      if (restRes.data.success) setRestaurants(restRes.data.restaurants);
      if (userRes.data.success) setUsers(userRes.data.users);
      if (compRes.data.success) setComplaints(compRes.data.complaints);
    } catch (error) {
      console.error('Error loading admin control panel data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRestaurant = async (restId, isApproved) => {
    try {
      const res = await api.patch(`/admin/restaurants/${restId}/approval`, { isApproved });
      if (res.data.success) {
        addToast(`Restaurant ${isApproved ? 'APPROVED' : 'APPROVAL REVOKED'}`, 'info');
        setRestaurants((prev) => prev.map((r) => (r._id === restId ? { ...r, isApproved } : r)));
      }
    } catch (err) {
      addToast('Failed to update restaurant approval state.', 'danger');
    }
  };

  const handleToggleUserSuspension = async (userId, isSuspended) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/suspension`, { isSuspended: !isSuspended });
      if (res.data.success) {
        addToast(`User ${!isSuspended ? 'SUSPENDED' : 'UNSUSPENDED'}`, 'warning');
        setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, isSuspended: !isSuspended } : u)));
      }
    } catch (err) {
      addToast('Failed to update user suspension.', 'danger');
    }
  };

  const handleResolveComplaint = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      const res = await api.patch(`/complaints/${selectedComplaint._id}/resolve`, {
        status: 'RESOLVED',
        resolutionNotes: refundForm.resolutionNotes,
        refundAmount: Number(refundForm.refundAmount)
      });

      if (res.data.success) {
        addToast('Dispute complaint resolved & refund issued!', 'success');
        setComplaints((prev) => prev.map((c) => (c._id === selectedComplaint._id ? res.data.complaint : c)));
        setSelectedComplaint(null);
      }
    } catch (err) {
      addToast('Failed to resolve complaint ticket.', 'danger');
    }
  };

  if (loading) return (
    <div className="main-content" style={{ padding: '80px 20px', textAlign: 'center' }}>
      <div className="skeleton" style={{ height: 28, width: 260, margin: '0 auto 16px' }} />
      <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading platform analytics & operations...</p>
    </div>
  );

  return (
    <div className="main-content">
      {/* Header */}
      <div className="card" style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.4px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={28} style={{ color: 'var(--primary)' }} /> Platform Administrator Control Center
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>QuickBite Governance, Operations & Fraud Monitoring</p>
        </div>
      </div>

      {/* Metric Overview Cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Gross Merchandise Value (GMV)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>${metrics?.totalGMV || 0}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Completed Orders</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginTop: 2 }}>{metrics?.totalCompletedOrders || 0}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Partner Restaurants</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>{restaurants.filter((r) => r.isApproved).length}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Open Dispute Tickets</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f87171', marginTop: 2 }}>{complaints.filter((c) => c.status === 'OPEN').length}</div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border-color)', marginBottom: 28 }}>
        {['overview', 'restaurants', 'users', 'complaints'].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              padding: '12px 24px',
              fontWeight: 700,
              fontSize: '0.92rem',
              textTransform: 'capitalize',
              color: activeTab === t ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === t ? '3px solid var(--primary)' : 'none',
              background: 'none'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB: Fraud Anomaly Heuristics */}
      {activeTab === 'overview' && (
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldAlert size={22} style={{ color: '#f87171' }} /> Fraud Anomaly & Anomaly Monitor
          </h2>
          {metrics?.fraudMetrics?.flaggedUsersCount === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: '#4ade80' }}>
              <CheckCircle2 size={36} style={{ marginBottom: 10 }} />
              <div style={{ fontWeight: 700 }}>No Security Fraud Anomalies Detected</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>Platform accounts and transactions operating normally.</div>
            </div>
          ) : (
            <div className="card" style={{ borderLeft: '4px solid #f87171' }}>
              <div style={{ color: '#f87171', fontWeight: 800, marginBottom: 6 }}>
                ⚠️ {metrics?.fraudMetrics?.flaggedUsersCount} Account(s) Flagged for High-Frequency Reconciliations
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                System automated heuristics monitored high cancellation or refund velocity.
              </p>
            </div>
          )}
        </div>
      )}

      {/* RESTAURANTS TAB */}
      {activeTab === 'restaurants' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Restaurant Name</th>
                <th>Owner Email</th>
                <th>Cuisines</th>
                <th>Status</th>
                <th>Approval State</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr key={r._id}>
                  <td style={{ fontWeight: 700 }}>{r.name}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.ownerId?.email || 'N/A'}</td>
                  <td>{r.cuisines?.join(', ')}</td>
                  <td style={{ fontWeight: 700, fontSize: '0.82rem' }}>{r.status}</td>
                  <td>
                    <span style={{ color: r.isApproved ? '#4ade80' : '#f87171', fontWeight: 800, fontSize: '0.78rem' }}>
                      {r.isApproved ? 'APPROVED' : 'PENDING'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleApproveRestaurant(r._id, !r.isApproved)}
                      className={`btn btn-sm ${r.isApproved ? 'btn-danger' : 'btn-success'}`}
                    >
                      {r.isApproved ? 'Revoke Approval' : 'Approve Partner'}
                    </button>
                  </td>
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
                <th>User Name</th>
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
                  <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem' }}>{u.role}</td>
                  <td>
                    <span style={{ color: u.isSuspended ? '#f87171' : '#4ade80', fontWeight: 800, fontSize: '0.78rem' }}>
                      {u.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleUserSuspension(u._id, u.isSuspended)}
                      className={`btn btn-sm ${u.isSuspended ? 'btn-success' : 'btn-danger'}`}
                    >
                      {u.isSuspended ? 'Unsuspend Account' : 'Suspend Account'}
                    </button>
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
                <th>Order Ref</th>
                <th>Customer</th>
                <th>Category</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 800, color: 'var(--primary)' }}>#{c.orderId?.orderNumber}</td>
                  <td>{c.customerId?.name}</td>
                  <td style={{ fontSize: '0.82rem', fontWeight: 700 }}>{c.category}</td>
                  <td>{c.subject}</td>
                  <td>
                    <span style={{ color: c.status === 'RESOLVED' ? '#4ade80' : '#f59e0b', fontWeight: 800, fontSize: '0.78rem' }}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    {c.status === 'OPEN' ? (
                      <button onClick={() => setSelectedComplaint(c)} className="btn btn-primary btn-sm">
                        Resolve & Issue Refund
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Refunded ${c.refundAmount}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dispute Resolution Refund Modal */}
      {selectedComplaint && (
        <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 16 }}>Resolve Customer Dispute Ticket</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 20 }}>
              Order #{selectedComplaint.orderId?.orderNumber} • Category: {selectedComplaint.category}
            </p>

            <form onSubmit={handleResolveComplaint}>
              <div className="form-group">
                <label className="form-label">Resolution Notes</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={refundForm.resolutionNotes}
                  onChange={(e) => setRefundForm({ ...refundForm, resolutionNotes: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Approved Refund Amount ($)</label>
                <input
                  type="number"
                  className="form-input"
                  value={refundForm.refundAmount}
                  onChange={(e) => setRefundForm({ ...refundForm, refundAmount: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button type="button" onClick={() => setSelectedComplaint(null)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-success btn-sm">
                  Approve Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
