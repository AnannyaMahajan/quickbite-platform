import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';

import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

import { Discovery } from './pages/customer/Discovery';
import { RestaurantDetail } from './pages/customer/RestaurantDetail';
import { CartPage } from './pages/customer/CartPage';
import { OrderTracking } from './pages/customer/OrderTracking';
import { CustomerOrders } from './pages/customer/CustomerOrders';

import { RestaurantDashboard } from './pages/restaurant/RestaurantDashboard';
import { DeliveryDashboard } from './pages/delivery/DeliveryDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

// Protected Route Wrapper with Role Verification
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}>Authenticating session...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's permitted workspace
    if (user.role === 'CUSTOMER') return <Navigate to="/customer" replace />;
    if (user.role === 'RESTAURANT_OWNER') return <Navigate to="/restaurant" replace />;
    if (user.role === 'DELIVERY_PARTNER') return <Navigate to="/delivery" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <SocketProvider>
            <div className="app-container">
              <Navbar />
              <Routes>
                {/* Public & Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Customer Workspace */}
                <Route path="/" element={<Discovery />} />
                <Route path="/customer" element={<Discovery />} />
                <Route path="/customer/restaurants/:id" element={<RestaurantDetail />} />
                <Route path="/customer/cart" element={<CartPage />} />
                <Route path="/customer/orders" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerOrders /></ProtectedRoute>} />
                <Route path="/customer/orders/:id" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><OrderTracking /></ProtectedRoute>} />

                {/* Restaurant Owner Workspace */}
                <Route path="/restaurant" element={<ProtectedRoute allowedRoles={['RESTAURANT_OWNER']}><RestaurantDashboard /></ProtectedRoute>} />

                {/* Delivery Partner Workspace */}
                <Route path="/delivery" element={<ProtectedRoute allowedRoles={['DELIVERY_PARTNER']}><DeliveryDashboard /></ProtectedRoute>} />

                {/* Platform Admin Workspace */}
                <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />

                {/* Catch All Redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </SocketProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};
