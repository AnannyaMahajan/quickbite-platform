import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { Store, Utensils, CheckCircle2, Clock, DollarSign, Plus, Power, AlertCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const RestaurantDashboard = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // orders, menu
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
        const label = newStatus === 'OPEN' ? 'OPEN' : newStatus === 'TEMPORARILY_UNAVAILABLE' ? 'TAKING A BREAK' : 'CLOSED';
        addToast(`Restaurant status changed to ${label}`, 'success');
      }
    } catch (err) {
      addToast('Failed to update status.', 'danger');
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
    <div className="main-content" style={{ padding: '80px 20px', textAlign: 'center' }}>
      <div className="skeleton" style={{ height: 28, width: 260, margin: '0 auto 16px' }} />
      <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading restaurant operations...</p>
    </div>
  );

  if (!restaurant) return (
    <div className="main-content" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h2>No Restaurant Profile</h2>
      <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>There is no restaurant profile associated with this account.</p>
    </div>
  );

  const incomingOrders = orders.filter((o) => o.status === 'PLACED');
  const activePrepOrders = orders.filter((o) => ['RESTAURANT_ACCEPTED', 'PREPARING'].includes(o.status));

  return (
    <div className="main-content">
      {/* Restaurant Header */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.4px' }}>{restaurant.name}</h1>
            <StatusBadge status={restaurant.status} />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {restaurant.cuisines.join(', ')} • {restaurant.address.street}, {restaurant.address.city}
          </p>
        </div>

        {/* Status Switcher Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>Duty Status:</span>
          <button
            onClick={() => handleStatusToggle('OPEN')}
            className={`btn btn-sm ${restaurant.status === 'OPEN' ? 'btn-success' : 'btn-secondary'}`}
          >
            <Power size={14} /> OPEN
          </button>
          <button
            onClick={() => handleStatusToggle('TEMPORARILY_UNAVAILABLE')}
            className={`btn btn-sm ${restaurant.status === 'TEMPORARILY_UNAVAILABLE' ? 'btn-danger' : 'btn-secondary'}`}
          >
            PAUSE ORDERS
          </button>
          <button
            onClick={() => handleStatusToggle('CLOSED')}
            className={`btn btn-sm ${restaurant.status === 'CLOSED' ? 'btn-secondary' : 'btn-secondary'}`}
          >
            CLOSED
          </button>
        </div>
      </div>

      {/* Performance Overview Snapshot */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Today's Gross Sales</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>${analytics?.totalRevenue || 0}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Orders Processed</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginTop: 2 }}>{analytics?.totalOrders || 0}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Average Order Value</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>${analytics?.avgOrderValue || 0}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Customer Rating</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>⭐ {restaurant.rating}</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border-color)', marginBottom: 28 }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '12px 24px',
            fontWeight: 700,
            fontSize: '0.95rem',
            color: activeTab === 'orders' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'orders' ? '3px solid var(--primary)' : 'none',
            background: 'none'
          }}
        >
          Operational Orders Queue ({incomingOrders.length + activePrepOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          style={{
            padding: '12px 24px',
            fontWeight: 700,
            fontSize: '0.95rem',
            color: activeTab === 'menu' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'menu' ? '3px solid var(--primary)' : 'none',
            background: 'none'
          }}
        >
          Menu & Stock Manager ({menuItems.length})
        </button>
      </div>

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="grid-2">
          {/* Needs Attention Right Now */}
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 16, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={20} /> Needs Attention Right Now ({incomingOrders.length})
            </h3>
            {incomingOrders.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 36 }}>No new incoming orders.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {incomingOrders.map((o) => (
                  <div key={o._id} className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>#{o.orderNumber}</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ fontSize: '0.88rem', marginBottom: 12, color: '#e2e8f0' }}>
                      <strong>Customer:</strong> {o.customerId?.name} ({o.customerId?.phone})
                    </div>
                    <div style={{ background: 'var(--bg-main)', padding: 12, borderRadius: 'var(--radius-sm)', marginBottom: 14, fontSize: '0.88rem' }}>
                      {o.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span>{item.name} × {item.quantity}</span>
                          <span style={{ fontWeight: 700 }}>${item.subtotal}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
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

          {/* Kitchen Preparation Queue */}
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 16, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Utensils size={20} /> Kitchen Queue ({activePrepOrders.length})
            </h3>
            {activePrepOrders.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 36 }}>Kitchen queue is clear.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {activePrepOrders.map((o) => (
                  <div key={o._id} className="card" style={{ borderLeft: '4px solid #38bdf8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>#{o.orderNumber}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <div style={{ background: 'var(--bg-main)', padding: 12, borderRadius: 'var(--radius-sm)', marginBottom: 14, fontSize: '0.88rem' }}>
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
                        <CheckCircle2 size={16} /> Food Ready for Rider Pickup
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
          {/* Add New Item Card */}
          <div className="card" style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 16 }}>Add New Menu Item</h3>
            <form onSubmit={handleAddMenuItem} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <input
                type="text"
                placeholder="Item Name"
                className="form-input"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Price ($)"
                className="form-input"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Initial Stock Quantity"
                className="form-input"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              />
              <select
                className="form-input"
                value={newItem.isVeg}
                onChange={(e) => setNewItem({ ...newItem, isVeg: e.target.value === 'true' })}
              >
                <option value="true">Vegetarian</option>
                <option value="false">Non-Vegetarian</option>
              </select>
              <button type="submit" className="btn btn-primary btn-sm" style={{ height: 44 }}>
                <Plus size={16} /> Add Item
              </button>
            </form>
          </div>

          {/* Menu Items Table */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock Available</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{item.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.isVeg ? '🌱 Veg' : '🍖 Non-Veg'}</div>
                    </td>
                    <td>{item.categoryName || 'Main'}</td>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>${item.price}</td>
                    <td>{item.quantity} units</td>
                    <td>
                      <span style={{ color: item.isAvailable && item.quantity > 0 ? '#4ade80' : '#f87171', fontWeight: 800, fontSize: '0.78rem' }}>
                        {item.isAvailable && item.quantity > 0 ? 'AVAILABLE' : 'OUT OF STOCK'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleItemAvailability(item._id, item.isAvailable)}
                        className={`btn btn-sm ${item.isAvailable ? 'btn-secondary' : 'btn-success'}`}
                      >
                        {item.isAvailable ? 'Mark Out of Stock' : 'Mark Available'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
