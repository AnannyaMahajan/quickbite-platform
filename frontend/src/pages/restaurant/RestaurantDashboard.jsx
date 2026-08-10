import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import { Store, Utensils, CheckCircle2, Clock, Power, Plus, Star } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const RestaurantDashboard = () => {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);

  // New Menu Item Form state
  const [newItem, setNewItem] = useState({ categoryName: 'Chef Specials', name: '', description: '', price: '', isVeg: true, quantity: 50 });
  const { addToast } = useSocket();

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchOrdersOnly, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const profileRes = await api.get('/restaurant/profile');
      if (profileRes.data.success) {
        setRestaurant(profileRes.data.restaurant);
        const [ordersRes, menuRes, analyticsRes] = await Promise.all([
          api.get('/restaurant/orders'),
          api.get(`/customer/restaurants/${profileRes.data.restaurant._id}/menu`),
          api.get('/analytics/restaurant')
        ]);
        if (ordersRes.data.success) setOrders(ordersRes.data.orders);
        if (menuRes.data.success) setMenuItems(menuRes.data.items);
        if (analyticsRes.data.success) setAnalytics(analyticsRes.data.metrics);
      }
    } catch (error) {
      console.error('Error fetching restaurant dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersOnly = async () => {
    try {
      const ordersRes = await api.get('/restaurant/orders');
      if (ordersRes.data.success) setOrders(ordersRes.data.orders);
    } catch (err) {
      console.error('Orders refresh error:', err);
    }
  };

  const handleStatusToggle = async (newStatus) => {
    try {
      const res = await api.patch('/restaurant/status', { status: newStatus });
      if (res.data.success) {
        setRestaurant(res.data.restaurant);
        addToast('✓ Status updated successfully.', 'success');
      }
    } catch (err) {
      addToast('Couldn\'t update your restaurant status. Please try again.', 'danger');
    }
  };

  const handleOrderTransition = async (orderId, targetStatus) => {
    try {
      const res = await api.patch(`/restaurant/orders/${orderId}/status`, { status: targetStatus });
      if (res.data.success) {
        addToast(`Order updated to ${targetStatus.replace(/_/g, ' ')}`, 'success');
        fetchOrdersOnly();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update order status.', 'danger');
    }
  };

  const handleToggleItemAvailability = async (itemId, currentAvailability) => {
    try {
      const res = await api.patch(`/restaurant/menu/items/${itemId}/availability`, { isAvailable: !currentAvailability });
      if (res.data.success) {
        addToast('Menu item availability updated.', 'info');
        setMenuItems((prev) => prev.map((i) => (i._id === itemId ? { ...i, isAvailable: !currentAvailability } : i)));
      }
    } catch (err) {
      addToast('Failed to update item availability.', 'danger');
    }
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/restaurant/menu/items', newItem);
      if (res.data.success) {
        addToast('Menu item added successfully!', 'success');
        setMenuItems((prev) => [...prev, res.data.item]);
        setNewItem({ categoryName: 'Chef Specials', name: '', description: '', price: '', isVeg: true, quantity: 50 });
      }
    } catch (err) {
      addToast('Failed to create menu item.', 'danger');
    }
  };

  if (loading) return (
    <div className="main-content" style={{ padding: '60px 18px', textAlign: 'center' }}>
      <div className="skeleton" style={{ height: 24, width: 220, margin: '0 auto 12px' }} />
      <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Opening restaurant workspace...</p>
    </div>
  );

  const incomingOrders = orders.filter((o) => o.status === 'PLACED');
  const activePrepOrders = orders.filter((o) => ['RESTAURANT_ACCEPTED', 'PREPARING'].includes(o.status));
  const ownerName = user?.name ? user.name.split(' ')[0] : 'Chef';

  return (
    <div className="main-content">
      {/* Header Info & Status Controls */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 2 }}>
            Welcome back, {ownerName} 👋
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800 }}>{restaurant?.name || 'Trattoria Bella'}</h1>
            <StatusBadge status={restaurant?.status || 'OPEN'} />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            {restaurant?.cuisines?.join(' • ') || 'Italian • Pasta'} • {restaurant?.address?.street || '200 Gourmet Ave'}, Metropolis
          </p>
        </div>

        {/* Restaurant Status Controls */}
        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6, textAlign: 'right' }}>
            Restaurant Status
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => handleStatusToggle('OPEN')}
              className={`btn btn-sm btn-status-open ${restaurant?.status === 'OPEN' ? 'active' : ''}`}
            >
              ● OPEN
            </button>
            <button
              onClick={() => handleStatusToggle('TEMPORARILY_UNAVAILABLE')}
              className={`btn btn-sm btn-status-pause ${restaurant?.status === 'TEMPORARILY_UNAVAILABLE' ? 'active' : ''}`}
            >
              ⏸ PAUSE ORDERS
            </button>
            <button
              onClick={() => handleStatusToggle('CLOSED')}
              className={`btn btn-sm btn-status-closed ${restaurant?.status === 'CLOSED' ? 'active' : ''}`}
            >
              ● CLOSED
            </button>
          </div>
        </div>
      </div>

      {/* TODAY'S PERFORMANCE (White Cards) */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Today's Sales</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>${analytics?.totalRevenue || 0}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>vs yesterday 0%</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Orders</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>{analytics?.totalOrders || 0}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>vs yesterday 0%</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Customer Rating</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>⭐ {restaurant?.rating || 4.2}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Based on reviews</div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--border-color)', marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: activeTab === 'orders' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'orders' ? '3px solid var(--primary)' : 'none',
            background: 'none'
          }}
        >
          Kitchen Orders ({incomingOrders.length + activePrepOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: activeTab === 'menu' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'menu' ? '3px solid var(--primary)' : 'none',
            background: 'none'
          }}
        >
          Menu Manager ({menuItems.length})
        </button>
      </div>

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="grid-2">
          {/* Needs Attention */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 14, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={18} style={{ color: '#f59e0b' }} /> Needs your attention ({incomingOrders.length})
            </h3>
            {incomingOrders.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24, fontSize: '0.88rem' }}>
                <Utensils size={32} style={{ color: 'var(--text-muted)', marginBottom: 6 }} />
                <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>No new orders right now</div>
                <div style={{ fontSize: '0.82rem' }}>You're all caught up and ready to go!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {incomingOrders.map((o) => (
                  <div key={o._id} className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>#{o.orderNumber}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ background: '#f8fafc', padding: 10, borderRadius: 'var(--radius-sm)', marginBottom: 12, fontSize: '0.85rem' }}>
                      {o.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span>{item.name} × {item.quantity}</span>
                          <span style={{ fontWeight: 700 }}>${item.subtotal}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleOrderTransition(o._id, 'RESTAURANT_ACCEPTED')} className="btn btn-success btn-sm" style={{ flex: 1 }}>
                        Accept Order
                      </button>
                      <button onClick={() => handleOrderTransition(o._id, 'RESTAURANT_REJECTED')} className="btn btn-danger btn-sm">
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kitchen Cooking */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 14, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Utensils size={18} style={{ color: '#3b82f6' }} /> Kitchen cooking queue ({activePrepOrders.length})
            </h3>
            {activePrepOrders.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24, fontSize: '0.88rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>No orders cooking right now</div>
                <div style={{ fontSize: '0.82rem' }}>When orders are accepted, they'll appear here.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {activePrepOrders.map((o) => (
                  <div key={o._id} className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>#{o.orderNumber}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <div style={{ background: '#f8fafc', padding: 10, borderRadius: 'var(--radius-sm)', marginBottom: 12, fontSize: '0.85rem' }}>
                      {o.items.map((item, idx) => (
                        <div key={idx} style={{ marginBottom: 2 }}>• {item.name} × {item.quantity}</div>
                      ))}
                    </div>
                    {o.status === 'RESTAURANT_ACCEPTED' && (
                      <button onClick={() => handleOrderTransition(o._id, 'PREPARING')} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                        Start Kitchen Prep
                      </button>
                    )}
                    {o.status === 'PREPARING' && (
                      <button onClick={() => handleOrderTransition(o._id, 'READY_FOR_PICKUP')} className="btn btn-success btn-sm" style={{ width: '100%' }}>
                        <CheckCircle2 size={15} /> Food Ready for Pickup
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MENU TAB */}
      {activeTab === 'menu' && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 12 }}>Add New Menu Item</h3>
            <form onSubmit={handleAddMenuItem} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <input type="text" placeholder="Item Name" className="form-input" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} required />
              <input type="number" placeholder="Price ($)" className="form-input" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} required />
              <input type="number" placeholder="Stock Quantity" className="form-input" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })} />
              <button type="submit" className="btn btn-primary btn-sm" style={{ height: 42 }}><Plus size={15} /> Add Item</button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {menuItems.map((item) => (
              <div key={item._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>{item.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>${item.price} • Stock: {item.quantity} units</div>
                </div>
                <button
                  onClick={() => handleToggleItemAvailability(item._id, item.isAvailable)}
                  className={`btn btn-sm ${item.isAvailable ? 'btn-secondary' : 'btn-success'}`}
                >
                  {item.isAvailable ? 'Mark Out of Stock' : 'Mark Available'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
