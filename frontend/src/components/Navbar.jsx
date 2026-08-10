import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { UtensilsCrossed, ShoppingBag, LogOut, Shield, Bike, Store, Compass, Layers } from 'lucide-react';

export const Navbar = () => {
  const { user, demoLogin, logout } = useAuth();
  const { cartItems } = useCart();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const navigate = useNavigate();

  const handleRoleSwitch = async (role) => {
    await demoLogin(role);
    setShowDemoModal(false);
    if (role === 'CUSTOMER') navigate('/customer');
    if (role === 'RESTAURANT_OWNER') navigate('/restaurant');
    if (role === 'DELIVERY_PARTNER') navigate('/delivery');
    if (role === 'ADMIN') navigate('/admin');
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Clean Glassmorphic Production Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="brand-logo">
            <UtensilsCrossed size={28} />
            Quick<span>Bite</span>
          </Link>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Role-Specific Consumer Navigation Links */}
              {user.role === 'CUSTOMER' && (
                <>
                  <Link to="/customer" className="nav-link">
                    <Compass size={16} /> Discover
                  </Link>
                  <Link to="/customer/orders" className="nav-link">
                    <ShoppingBag size={16} /> My Orders
                  </Link>
                  <Link to="/customer/cart" className="btn btn-primary btn-sm" style={{ position: 'relative' }}>
                    <ShoppingBag size={16} /> Cart
                    {cartItems.length > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          background: '#ffffff',
                          color: '#0f172a',
                          borderRadius: '50%',
                          width: 18,
                          height: 18,
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                      </span>
                    )}
                  </Link>
                </>
              )}

              {user.role === 'RESTAURANT_OWNER' && (
                <Link to="/restaurant" className="btn btn-secondary btn-sm">
                  <Store size={16} /> Restaurant Operations
                </Link>
              )}

              {user.role === 'DELIVERY_PARTNER' && (
                <Link to="/delivery" className="btn btn-secondary btn-sm">
                  <Bike size={16} /> Delivery App
                </Link>
              )}

              {user.role === 'ADMIN' && (
                <Link to="/admin" className="btn btn-secondary btn-sm">
                  <Shield size={16} /> Admin Console
                </Link>
              )}

              {/* Discrete Demo Switcher Button for Testing */}
              <button
                onClick={() => setShowDemoModal(true)}
                className="btn btn-secondary btn-sm"
                title="Switch Persona Demo"
                style={{ fontSize: '0.78rem', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)' }}
              >
                <Layers size={14} /> Demo Persona
              </button>

              {/* User Profile Info & Logout */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 10, borderLeft: '1px solid #334155' }}>
                <div style={{ fontSize: '0.82rem', textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#f8fafc' }}>{user.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{user.role.replace(/_/g, ' ')}</div>
                </div>
                <button onClick={logout} className="btn btn-secondary btn-sm" title="Log out">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          )}

          {!user && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={() => setShowDemoModal(true)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.78rem', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)' }}
              >
                <Layers size={14} /> Demo Switcher
              </button>
              <Link to="/login" className="btn btn-secondary btn-sm">Log In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Discrete Persona Switcher Modal */}
      {showDemoModal && (
        <div className="modal-overlay" onClick={() => setShowDemoModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>Switch Demo Persona</h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 20 }}>
              Select a stakeholder role to instantly log in as a pre-configured account:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => handleRoleSwitch('CUSTOMER')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: 12 }}>
                👤 <strong>Customer:</strong> Alex Johnson (Browse, Cart, Order)
              </button>
              <button onClick={() => handleRoleSwitch('RESTAURANT_OWNER')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: 12 }}>
                🏪 <strong>Restaurant Owner:</strong> Chef Marco Rossi (Kitchen Queue, Menu)
              </button>
              <button onClick={() => handleRoleSwitch('DELIVERY_PARTNER')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: 12 }}>
                🛵 <strong>Delivery Partner:</strong> David Vance (Rider App, Reassignment)
              </button>
              <button onClick={() => handleRoleSwitch('ADMIN')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: 12 }}>
                🛡️ <strong>Platform Admin:</strong> Sarah Connor (Fleet Monitor, GMV, Disputes)
              </button>
            </div>

            <button onClick={() => setShowDemoModal(false)} className="btn btn-secondary" style={{ width: '100%', marginTop: 16 }}>
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
