import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { Star, Clock, ShoppingBag, Plus, Minus, Check, AlertCircle } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';

export const RestaurantDetail = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { cartItems, addToCart, updateQuantity, subtotal, grandTotal } = useCart();
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

  if (loading) return <div className="main-content" style={{ padding: 60, textAlign: 'center' }}>Loading restaurant menu...</div>;
  if (!restaurant) return <div className="main-content">Restaurant not found</div>;

  return (
    <div className="main-content">
      {/* Restaurant Hero Banner */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24, position: 'relative' }}>
        <div style={{ height: 220, position: 'relative' }}>
          <img src={restaurant.bannerImage} alt={restaurant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.9), transparent)' }} />
          <div style={{ position: 'absolute', bottom: 20, left: 24, right: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{restaurant.name}</h1>
                <StatusBadge status={restaurant.status} />
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                {restaurant.cuisines.join(', ')} • {restaurant.address.street}, {restaurant.address.city}
              </p>
            </div>
            <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '8px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Star fill="#f59e0b" color="#f59e0b" size={18} />
              <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{restaurant.rating}</span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>({restaurant.totalRatings}+ ratings)</span>
            </div>
          </div>
        </div>
      </div>

      {restaurant.status === 'TEMPORARILY_UNAVAILABLE' && (
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', padding: 14, borderRadius: 12, color: '#f87171', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={20} />
          <span>Notice: This restaurant is currently <strong>TEMPORARILY UNAVAILABLE</strong> for ordering.</span>
        </div>
      )}

      {/* Main Menu + Cart Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Menu Items List */}
        <div>
          {menuItems.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>No menu items available.</div>
          ) : (
            categories.map((cat) => {
              const catItems = menuItems.filter((i) => i.categoryId === cat._id || !i.categoryId);
              if (catItems.length === 0) return null;

              return (
                <div key={cat._id} style={{ marginBottom: 28 }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 14, paddingBottom: 6, borderBottom: '1px solid #334155' }}>
                    {cat.name}
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {catItems.map((item) => {
                      const cartMatch = cartItems.find((ci) => ci.menuItemId === item._id);
                      const isOutOfStock = !item.isAvailable || item.quantity <= 0;

                      return (
                        <div key={item._id} className="card" style={{ display: 'flex', gap: 16, alignItems: 'center', opacity: isOutOfStock ? 0.6 : 1 }}>
                          <img src={item.image} alt={item.name} style={{ width: 90, height: 90, borderRadius: 10, objectFit: 'cover' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.isVeg ? '#22c55e' : '#ef4444' }} />
                              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{item.name}</h3>
                              {item.quantity > 0 && item.quantity <= 5 && (
                                <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700 }}>Only {item.quantity} left!</span>
                              )}
                            </div>
                            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '4px 0 8px' }}>{item.description}</p>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>${item.price}</div>
                          </div>

                          {/* Add to Cart / Quantity controls */}
                          <div>
                            {isOutOfStock ? (
                              <button disabled className="btn btn-secondary btn-sm" style={{ opacity: 0.5 }}>Out of Stock</button>
                            ) : cartMatch ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', padding: '4px 8px', borderRadius: 8, border: '1px solid var(--primary)' }}>
                                <button onClick={() => updateQuantity(item._id, -1)} className="btn btn-secondary btn-sm" style={{ padding: 4 }}><Minus size={14} /></button>
                                <span style={{ fontWeight: 800, minWidth: 20, textAlign: 'center' }}>{cartMatch.quantity}</span>
                                <button onClick={() => updateQuantity(item._id, 1)} className="btn btn-secondary btn-sm" style={{ padding: 4 }}><Plus size={14} /></button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(item, restaurant._id)}
                                disabled={restaurant.status !== 'OPEN'}
                                className="btn btn-primary btn-sm"
                              >
                                <Plus size={14} /> Add to Cart
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

        {/* Sidebar Cart Preview */}
        <div>
          <div className="card" style={{ position: 'sticky', top: 90 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingBag size={20} /> Your Order Cart
            </h3>

            {cartItems.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>Cart is currently empty.</p>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, maxHeight: 240, overflowY: 'auto' }}>
                  {cartItems.map((ci) => (
                    <div key={ci.menuItemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{ci.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>${ci.price} x {ci.quantity}</div>
                      </div>
                      <div style={{ fontWeight: 700 }}>${ci.price * ci.quantity}</div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid #334155', paddingTop: 12, fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}><span>Subtotal</span><span>${subtotal}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}><span>Delivery Fee</span><span>$40</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}><span>Taxes</span><span>${Math.round(subtotal * 0.05)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', color: '#ffffff', paddingTop: 8, borderTop: '1px dashed #334155' }}>
                    <span>Total Pay</span>
                    <span style={{ color: 'var(--primary)' }}>${grandTotal}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/customer/cart')}
                  disabled={restaurant.status !== 'OPEN'}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 16 }}
                >
                  Proceed to Checkout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
