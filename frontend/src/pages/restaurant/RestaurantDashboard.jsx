import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { Store, Utensils, CheckCircle2, Clock, DollarSign, Plus, Edit2, Trash2, Power } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const RestaurantDashboard = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // orders, menu, analytics, profile
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
        addToast(`Restaurant status changed to ${newStatus}`, 'success');
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

  if (loading) return <div className="main-content" style={{ padding: 60, textAlign: 'center' }}>Loading restaurant workspace...</div>;
  if (!restaurant) return <div className="main-content">No restaurant profile associated with this account.</div>;

  const incomingOrders = orders.filter((o) => o.status === 'PLACED');
  const activePrepOrders = orders.filter((o) => ['RESTAURANT_ACCEPTED', 'PREPARING'].includes(o.status));

  return (
    <div className="main-content">
      {/* Restaurant Status Bar & Header */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{restaurant.name}</h1>
            <StatusBadge status={restaurant.status} />
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            {restaurant.cuisines.join(', ')} • {restaurant.address.street}, {restaurant.address.city}
          </p>
        </div>

        {/* Status Switcher Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Toggle Status:</span>
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

      {/* Analytics Snapshot Bar */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Gross Sales</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>${analytics?.totalRevenue || 0}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Orders</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>{analytics?.totalOrders || 0}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Avg Order Value</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>${analytics?.avgOrderValue || 0}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Customer Rating</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>⭐ {restaurant.rating}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid #334155', marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '10px 20px',
            fontWeight: 700,
            color: activeTab === 'orders' ? 'var(--primary)' : '#94a3b8',
            borderBottom: activeTab === 'orders' ? '2px solid var(--primary)' : 'none',
            background: 'none'
          }}
        >
          Operational Orders Queue ({incomingOrders.length + activePrepOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          style={{
            padding: '10px 20px',
            fontWeight: 700,
            color: activeTab === 'menu' ? 'var(--primary)' : '#94a3b8',
            borderBottom: activeTab === 'menu' ? '2px solid var(--primary)' : 'none',
            background: 'none'
          }}
        >
          Menu & Inventory Manager ({menuItems.length})
        </button>
      </div>

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="grid-2">
          {/* Incoming Orders Section */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 14, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={20} /> Incoming Orders ({incomingOrders.length})
            </h3>
            {incomingOrders.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: '#94a3b8', padding: 30 }}>No pending incoming orders.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {incomingOrders.map((o) => (
                  <div key={o._id} className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 800, color: 'var(--primary)' }}>#{o.orderNumber}</span>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(o.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', marginBottom: 10 }}>
                      <strong>Customer:</strong> {o.customerId?.name} ({o.customerId?.phone})
                    </div>
                    <div style={{ background: '#0f172a', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: '0.85rem' }}>
                      {o.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{item.name} x {item.quantity}</span>
                          <span style={{ fontWeight: 700 }}>${item.subtotal}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => handleOrderTransition(o._id, 'RESTAURANT_ACCEPTED')} className="btn btn-success btn-sm" style={{ flex: 1 }}>
                        Accept Order
                      </button>
                      <button onClick={() => handleOrderTransition(o._id, 'RESTAURANT_REJECTED')} className="btn btn-danger btn-sm">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kitchen Preparation Queue */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 14, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Utensils size={20} /> In Kitchen Prep ({activePrepOrders.length})
            </h3>
            {activePrepOrders.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: '#94a3b8', padding: 30 }}>Kitchen queue is clear.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {activePrepOrders.map((o) => (
                  <div key={o._id} className="card" style={{ borderLeft: '4px solid #38bdf8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 800, color: 'var(--primary)' }}>#{o.orderNumber}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <div style={{ background: '#0f172a', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: '0.85rem' }}>
                      {o.items.map((item, idx) => (
                        <div key={idx}>• {item.name} x {item.quantity}</div>
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
          {/* Add New Item Form Card */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 14 }}>Add New Menu Item</h3>
            <form onSubmit={handleAddMenuItem} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
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
              <button type="submit" className="btn btn-primary btn-sm" style={{ height: 42 }}>
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
                  <th>Real-Time Toggle</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{item.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{item.isVeg ? '🌱 Veg' : '🍖 Non-Veg'}</div>
                    </td>
                    <td>{item.categoryName || 'Main'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>${item.price}</td>
                    <td>{item.quantity} units</td>
                    <td>
                      <span style={{ color: item.isAvailable && item.quantity > 0 ? '#4ade80' : '#f87171', fontWeight: 700, fontSize: '0.8rem' }}>
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
