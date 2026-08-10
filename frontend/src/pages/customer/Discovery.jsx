import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Search, Star, Clock, Utensils, MapPin } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';

export const Discovery = () => {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('ALL');
  const navigate = useNavigate();

  const cuisines = ['ALL', 'Italian', 'Indian', 'Japanese', 'Mexican', 'American', 'Chinese', 'Vegan', 'Thai', 'Middle Eastern'];

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

  const userName = user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <div className="main-content">
      {/* Consumer Greeting & Search */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 4 }}>
          <MapPin size={16} style={{ color: 'var(--primary)' }} /> Delivering to <strong style={{ color: 'var(--text-main)' }}>456 Ocean Ave, Metropolis</strong>
        </div>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>
          Good evening, {userName} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: 20 }}>
          What are you craving today?
        </p>

        {/* Search Bar */}
        <div style={{ position: 'relative', maxWidth: 640 }}>
          <Search style={{ position: 'absolute', left: 16, top: 16, color: '#94a3b8' }} size={20} />
          <input
            type="text"
            className="form-input"
            placeholder="Search for biryani, pizza, sushi, burgers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: 48,
              height: 52,
              fontSize: '0.98rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid #cbd5e1',
              boxShadow: 'var(--shadow-sm)'
            }}
          />
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 12, marginBottom: 28, scrollbarWidth: 'none' }}>
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
              background: selectedCuisine === c ? 'var(--primary)' : '#ffffff',
              color: selectedCuisine === c ? '#ffffff' : 'var(--text-main)',
              border: selectedCuisine === c ? 'none' : '1px solid #e2e8f0',
              boxShadow: selectedCuisine === c ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
              transition: 'all 0.18s ease'
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Restaurant Cards List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div className="skeleton" style={{ height: 28, width: 220, margin: '0 auto 14px' }} />
          <p style={{ fontWeight: 600 }}>Finding delicious choices near you...</p>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Utensils size={44} style={{ color: '#94a3b8', marginBottom: 12 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 6 }}>Nothing tasty found here yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Try another cuisine or clear your search to explore more options.
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
              <div style={{ height: 180, position: 'relative', overflow: 'hidden' }}>
                <img
                  src={rest.image}
                  alt={rest.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                  <StatusBadge status={rest.status} />
                </div>
              </div>

              <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{rest.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: 6, fontSize: '0.82rem', fontWeight: 800 }}>
                      <Star size={13} fill="#b45309" color="#b45309" /> {rest.rating}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                    {rest.cuisines.join(' • ')}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-muted)', paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                    <Clock size={14} style={{ color: 'var(--primary)' }} /> {rest.avgDeliveryTimeMinutes} mins
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>${rest.costForTwo} for two</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
