import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Search, Star, Clock, UtensilsCrossed } from 'lucide-react';
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
      {/* Friendly Hero Banner */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>
          What's on your mind today?
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: 24 }}>
          Discover delicious meals from Metropolis's favorite kitchens
        </p>

        {/* Inviting Search Bar */}
        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 18, top: 15, color: '#64748b' }} size={20} />
          <input
            type="text"
            className="form-input"
            placeholder="Search for biryani, pizza, sushi, burgers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: 50,
              height: 52,
              fontSize: '1rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)'
            }}
          />
        </div>
      </div>

      {/* Cuisine Filter Pills */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 14, marginBottom: 28, scrollbarWidth: 'none' }}>
        {cuisines.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCuisine(c)}
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.88rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              background: selectedCuisine === c ? 'var(--primary)' : '#1e293b',
              color: selectedCuisine === c ? '#ffffff' : 'var(--text-muted)',
              border: '1px solid #334155',
              boxShadow: selectedCuisine === c ? 'var(--shadow-glow)' : 'none',
              transition: 'all 0.18s ease'
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Restaurant Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
          <div className="skeleton" style={{ height: 24, width: 220, margin: '0 auto 16px' }} />
          <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>Finding great places to eat...</p>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <UtensilsCrossed size={48} style={{ color: '#64748b', marginBottom: 14 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>Nothing tasty found here yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Try clearing your search or switching cuisine filters to explore more choices.
          </p>
        </div>
      ) : (
        <div className="grid-3">
          {restaurants.map((rest) => (
            <div
              key={rest._id}
              className="card card-interactive"
              onClick={() => navigate(`/customer/restaurants/${rest._id}`)}
              style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ height: 190, position: 'relative', overflow: 'hidden' }}>
                <img
                  src={rest.image}
                  alt={rest.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
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
                    backdropFilter: 'blur(8px)',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    color: '#f59e0b'
                  }}
                >
                  <Star size={14} fill="#f59e0b" color="#f59e0b" /> {rest.rating} ({rest.totalRatings}+)
                </div>
              </div>

              <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 4 }}>{rest.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                    {rest.cuisines.join(', ')} • ${rest.costForTwo} for two
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: '#cbd5e1', paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    <Clock size={15} style={{ color: 'var(--primary)' }} /> {rest.avgDeliveryTimeMinutes} mins
                  </span>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Explore Menu →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
