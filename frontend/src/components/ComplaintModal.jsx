import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

export const ComplaintModal = ({ isOpen, onClose, order }) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('QUALITY_ISSUE');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useSocket();

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !description) {
      addToast('Please fill out both subject and description.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/complaints', {
        orderId: order._id,
        subject,
        description,
        category
      });
      if (res.data.success) {
        addToast(`Ticket #${res.data.complaint.ticketNumber} created! Admin will review your dispute.`, 'success');
        onClose();
      }
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to submit complaint.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444' }}>
            <AlertTriangle size={20} /> File Order Dispute / Complaint
          </h3>
          <button onClick={onClose} className="btn btn-secondary btn-sm"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Issue Category</label>
            <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="QUALITY_ISSUE">Food Quality / Taste Issue</option>
              <option value="LATE_DELIVERY">Late Delivery</option>
              <option value="WRONG_ITEM">Missing or Incorrect Items</option>
              <option value="DAMAGED_FOOD">Damaged Packaging</option>
              <option value="PAYMENT_DISPUTE">Payment / Double Charge</option>
              <option value="OTHER">Other Issue</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Subject</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Lukewarm food and missing Naan"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Description</label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="Please describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn btn-danger">
              {submitting ? 'Submitting...' : 'Submit Dispute Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
