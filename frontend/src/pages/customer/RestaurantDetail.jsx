import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useSocket } from '../../context/SocketContext';
import { Star, Clock, ShoppingBag, Plus, Minus, AlertCircle } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';

export const RestaurantDetail = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { cartItems, addToCart, updateQuantity, subtotal, grandTotal } = useCart();
  const { addToast } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurantAndMenu();
  }, [id]);

  const fetchRestaurantAndMenu = async () => {
    try {
      setLoading(true);
      const restRes = await api.get(`/customer/restaurants/${id}`);
      const menuRes = await api.get(`/customer/restaurants/${id}/menu`);
      
      if (restRes.data.success) setRestaurant(restRes.data.restaurant);
      if (menuRes.data.success) {
        setCategories(menuRes.data.categories);
        setMenuItems(menuRes.data.items);
      }
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (item, restId) => {
    addToCart(item, restId);
    addToast(`Added '${item.name}' to your cart`, 'success');
  };

  if (loading) return (
    <div className="main-content" style={{ padding: '80px 20px', textAlign: 'center' }}>
      <div className="skeleton" style={{ height: 28, width: 260, margin: '0 auto 16px' }} />
      <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading restaurant menu...</p>
    </div>
  );

  if (!restaurant) return (
    <div className="main-content" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h2>Restaurant Not Found</h2>
      <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>The restaurant you are looking for is currently unavailable.</p>
    </div>
  );

  return (
    <div className="main-content">
      {/* Restaurant Hero Banner */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 28, position: 'relative' }}>
        <div style={{ height: 240, position: 'relative' }}>
          <img src={restaurant.bannerImage} alt={restaurant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(9, 13, 22, 0.92), rgba(9, 13, 22, 0.2))' }} />
          <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px' }}>{restaurant.name}</h1>
                <StatusBadge status={restaurant.status} />
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>
                {restaurant.cuisines.join(', ')} • {restaurant.address.street}, {restaurant.address.city}
              </p>
            </div>
            <div style={{ background: 'rgba(19, 27, 46, 0.9)', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(8px)' }}>
              <Star fill="#f59e0b" color="#f59e0b" size={20} />
              <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{restaurant.rating}</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>({restaurant.totalRatings}+ reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {restaurant.status === 'TEMPORARILY_UNAVAILABLE' && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', padding: 16, borderRadius: 'var(--radius-md)', color: '#f87171', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertCircle size={22} />
          <span style={{ fontWeight: 600 }}>This restaurant is taking a short break and not accepting orders right now.</span>
        </div>
      )}

      {/* Main Menu + Cart Drawer Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28 }}>
        {/* Menu Items List */}
        <div>
          {menuItems.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              No menu items available at the moment.
            </div>
          ) : (
            categories.map((cat) => {
              const catItems = menuItems.filter((i) => i.categoryId === cat._id || !i.categoryId);
              if (catItems.length === 0) return null;

              return (
                <div key={cat._id} style={{ marginBottom: 32 }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border-color)', letterSpacing: '-0.3px' }}>
                    {cat.name}
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {catItems.map((item) => {
                      const cartMatch = cartItems.find((ci) => ci.menuItemId === item._id);
                      const isOutOfStock = !item.isAvailable || item.quantity <= 0;

                      return (
                        <div key={item._id} className="card" style={{ display: 'flex', gap: 18, alignItems: 'center', opacity: isOutOfStock ? 0.6 : 1 }}>
                          <img src={item.image} alt={item.name} style={{ width: 96, height: 96, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.isVeg ? '#22c55e' : '#ef4444' }} />
                              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{item.name}</h3>
                              {item.quantity > 0 && item.quantity <= 5 && (
                                <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 800 }}>Only {item.quantity} left!</span>
                              )}
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 10 }}>{item.description}</p>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>${item.price}</div>
                          </div>

                          {/* Add to Cart Controls */}
                          <div>
                            {isOutOfStock ? (
                              <button disabled className="btn btn-secondary btn-sm" style={{ opacity: 0.5 }}>Sold Out</button>
                            ) : cartMatch ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-main)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary)' }}>
                                <button onClick={() => updateQuantity(item._id, -1)} className="btn btn-secondary btn-sm" style={{ padding: 4 }}><Minus size={14} /></button>
                                <span style={{ fontWeight: 800, minWidth: 22, textAlign: 'center' }}>{cartMatch.quantity}</span>
                                <button onClick={() => updateQuantity(item._id, 1)} className="btn btn-secondary btn-sm" style={{ padding: 4 }}><Plus size={14} /></button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAddItem(item, restaurant._id)}
                                disabled={restaurant.status !== 'OPEN'}
                                className="btn btn-primary btn-sm"
                              >
                                <Plus size={15} /> Add to Cart
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Drawer Panel */}
        <div>
          <div className="card" style={{ position: 'sticky', top: 90 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingBag size={20} style={{ color: 'var(--primary)' }} /> Your Cart
            </h3>

            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '0.9rem' }}>Your cart is waiting for something tasty.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18, maxHeight: 260, overflowY: 'auto' }}>
                  {cartItems.map((ci) => (
                    <div key={ci.menuItemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{ci.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>${ci.price} × {ci.quantity}</div>
                      </div>
                      <div style={{ fontWeight: 800 }}>${ci.price * ci.quantity}</div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14, fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}><span>Subtotal</span><span>${subtotal}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}><span>Delivery Fee</span><span>$40</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}><span>Taxes</span><span>${Math.round(subtotal * 0.05)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.05rem', color: '#ffffff', paddingTop: 10, borderTop: '1px dashed var(--border-color)' }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--primary)' }}>${grandTotal}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/customer/cart')}
                  disabled={restaurant.status !== 'OPEN'}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 20, padding: 12 }}
                >
                  Continue to Checkout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
