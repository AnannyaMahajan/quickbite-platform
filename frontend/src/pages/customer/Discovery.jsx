import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Search, Star, Clock, AlertCircle } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';

export const Discovery = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('ALL');
  const navigate = useNavigate();

  const cuisines = ['ALL', 'Italian', 'Indian', 'Japanese', 'Mexican', 'American', 'Chinese', 'Vegan', 'Thai', 'Middle Eastern', 'Korean'];

  useEffect(() => {
    fetchRestaurants();
  }, [search, selectedCuisine]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customer/restaurants', {
        params: { search, cuisine: selectedCuisine }
      });
      if (res.data.success) {
        setRestaurants(res.data.restaurants);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      {/* Search & Header Banner */}
      <div style={{ marginBottom: 30, textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>
          Discover Top Restaurants & Cuisines
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: 20 }}>
          Order fresh meals delivered hot to your doorstep in Metropolis
        </p>

        {/* Search Input */}
        <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 16, top: 14, color: '#94a3b8' }} size={20} />
          <input
            type="text"
            className="form-input"
            placeholder="Search restaurants, biryani, burgers, sushi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 48, height: 48, fontSize: '1rem', borderRadius: 999 }}
          />
        </div>
      </div>

      {/* Cuisine Filter Pills */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 12, marginBottom: 24 }}>
        {cuisines.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCuisine(c)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: '0.85rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              background: selectedCuisine === c ? 'var(--primary)' : '#1e293b',
              color: selectedCuisine === c ? '#ffffff' : '#94a3b8',
              border: '1px solid #334155'
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Restaurant Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading top restaurants...</div>
      ) : restaurants.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 50 }}>
          <AlertCircle size={40} style={{ color: '#94a3b8', marginBottom: 10 }} />
          <h3>No restaurants match your search</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Try clearing filters or searching for another cuisine.</p>
        </div>
      ) : (
        <div className="grid-3">
          {restaurants.map((rest) => (
            <div
              key={rest._id}
              className="card card-interactive"
              onClick={() => navigate(`/customer/restaurants/${rest._id}`)}
              style={{ cursor: 'pointer', overflow: 'hidden', padding: 0 }}
            >
              <div style={{ height: 180, position: 'relative', overflow: 'hidden' }}>
                <img
                  src={rest.image}
                  alt={rest.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                  <StatusBadge status={rest.status} />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 12,
                    left: 12,
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(6px)',
                    padding: '4px 10px',
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#f59e0b'
                  }}
                >
                  <Star size={14} fill="#f59e0b" /> {rest.rating} ({rest.totalRatings}+)
                </div>
              </div>

              <div style={{ padding: 18 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{rest.name}</h3>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: 12 }}>
                  {rest.cuisines.join(', ')} • ${rest.costForTwo} for two
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1', paddingTop: 10, borderTop: '1px solid #334155' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={14} /> {rest.avgDeliveryTimeMinutes} mins delivery
                  </span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Browse Menu →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
