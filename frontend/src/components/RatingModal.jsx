import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

export const RatingModal = ({ isOpen, onClose, order }) => {
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [restaurantReview, setRestaurantReview] = useState('');
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [deliveryReview, setDeliveryReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useSocket();

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/customer/ratings', {
        orderId: order._id,
        restaurantRating,
        restaurantReview,
        deliveryRating,
        deliveryReview
      });
      if (res.data.success) {
        addToast('⭐ Rating submitted successfully! Thank you.', 'success');
        onClose();
      }
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to submit rating.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Rate Your Experience</h3>
          <button onClick={onClose} className="btn btn-secondary btn-sm"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Restaurant Rating */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Restaurant Rating ({order.restaurantId?.name || 'Restaurant'})</label>
            <div style={{ display: 'flex', gap: 6, margin: '8px 0' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRestaurantRating(star)}
                  style={{ background: 'none', border: 'none', color: star <= restaurantRating ? '#f59e0b' : '#334155' }}
                >
                  <Star size={28} fill={star <= restaurantRating ? '#f59e0b' : 'none'} />
                </button>
              ))}
            </div>
            <textarea
              className="form-input"
              placeholder="How was the food quality, taste, and packaging?"
              value={restaurantReview}
              onChange={(e) => setRestaurantReview(e.target.value)}
              rows={2}
              style={{ width: '100%' }}
            />
          </div>

          {/* Delivery Rating */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Delivery Experience</label>
            <div style={{ display: 'flex', gap: 6, margin: '8px 0' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setDeliveryRating(star)}
                  style={{ background: 'none', border: 'none', color: star <= deliveryRating ? '#f59e0b' : '#334155' }}
                >
                  <Star size={28} fill={star <= deliveryRating ? '#f59e0b' : 'none'} />
                </button>
              ))}
            </div>
            <textarea
              className="form-input"
              placeholder="Was delivery prompt and polite?"
              value={deliveryReview}
              onChange={(e) => setDeliveryReview(e.target.value)}
              rows={2}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
