import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { UtensilsCrossed, ShoppingBag, LogOut, Shield, Bike, Store, Compass, Layers, UserRound, X } from 'lucide-react';

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

  const personas = [
    {
      role: 'CUSTOMER',
      roleLabel: 'Customer',
      name: 'Alex Johnson',
      description: 'Browse, Cart & Orders',
      icon: UserRound,
      color: '#FF6B00',
      bg: 'rgba(255, 107, 0, 0.08)'
    },
    {
      role: 'RESTAURANT_OWNER',
      roleLabel: 'Restaurant Owner',
      name: 'Chef Marco Rossi',
      description: 'Kitchen Queue & Menu',
      icon: Store,
      color: '#16A34A',
      bg: 'rgba(22, 163, 74, 0.08)'
    },
    {
      role: 'DELIVERY_PARTNER',
      roleLabel: 'Delivery Partner',
      name: 'David Vance',
      description: 'Rider App & Deliveries',
      icon: Bike,
      color: '#3B82F6',
      bg: 'rgba(59, 130, 246, 0.08)'
    },
    {
      role: 'ADMIN',
      roleLabel: 'Platform Admin',
      name: 'Sarah Connor',
      description: 'Fleet, GMV & Disputes',
      icon: Shield,
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.08)'
    }
  ];

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

              {/* Discrete Demo Switcher Button */}
              <button
                onClick={() => setShowDemoModal(true)}
                className="btn btn-secondary btn-sm"
                title="Switch Persona Demo"
                style={{ fontSize: '0.78rem', background: 'rgba(255, 107, 0, 0.08)', color: '#FF6B00', border: '1px solid rgba(255, 107, 0, 0.25)' }}
              >
                <Layers size={14} /> Demo Persona
              </button>

              {/* User Profile Info & Logout */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 12, borderLeft: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.82rem', textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#172033' }}>{user.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>{user.role.replace(/_/g, ' ')}</div>
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
                style={{ fontSize: '0.78rem', background: 'rgba(255, 107, 0, 0.08)', color: '#FF6B00', border: '1px solid rgba(255, 107, 0, 0.25)' }}
              >
                <Layers size={14} /> Demo Switcher
              </button>
              <Link to="/login" className="btn btn-secondary btn-sm">Log In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Switch Demo Persona Modal */}
      {showDemoModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDemoModal(false)}
          style={{ background: 'rgba(15, 23, 42, 0.35)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
        >
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 520,
              width: 'calc(100% - 32px)',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#172033', margin: 0 }}>Switch Demo Persona</h3>
              <button
                onClick={() => setShowDemoModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5, marginBottom: 20 }}>
              Select a stakeholder role to instantly log in as a pre-configured account.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {personas.map((p) => {
                const IconComponent = p.icon;

                return (
                  <button
                    key={p.role}
                    onClick={() => handleRoleSwitch(p.role)}
                    aria-label={`Switch to ${p.roleLabel} demo persona`}
                    className="persona-card-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                      padding: 16,
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 12,
                      textAlign: 'left',
                      width: '100%',
                      cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        background: p.bg,
                        color: p.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <IconComponent size={22} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#172033' }}>
                        {p.roleLabel}
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#334155', marginTop: 1 }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: 2, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
                        {p.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowDemoModal(false)}
              style={{
                width: '100%',
                marginTop: 20,
                padding: '10px 18px',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                color: '#334155',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
