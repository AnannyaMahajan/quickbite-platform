import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  useEffect(() => {
    if (!token) return;

    const socket = getSocket();

    socket.on('order:created', (data) => {
      addToast(`🔔 New Order #${data.orderNumber} placed! ($${data.grandTotal})`, 'success');
    });

    socket.on('order:status_update', (data) => {
      addToast(`📦 Order #${data.orderNumber} status updated to: ${data.status.replace(/_/g, ' ')}`, 'info');
    });

    socket.on('delivery:assigned', (data) => {
      addToast(`🚀 New Delivery Request assigned! Order #${data.orderNumber}`, 'warning');
    });

    socket.on('delivery:reassigned', (data) => {
      addToast(`⚡ Order #${data.orderNumber} reassigned to you!`, 'warning');
    });

    socket.on('admin:alert', (data) => {
      addToast(`🚨 ADMIN ALERT: ${data.message}`, 'danger');
    });

    socket.on('menu:availability_changed', (data) => {
      addToast(`ℹ️ Menu item availability updated in real-time.`, 'info');
    });

    socket.on('restaurant:status_changed', (data) => {
      addToast(`🏪 Restaurant '${data.name}' status changed to ${data.status}`, 'info');
    });

    return () => {
      socket.off('order:created');
      socket.off('order:status_update');
      socket.off('delivery:assigned');
      socket.off('delivery:reassigned');
      socket.off('admin:alert');
      socket.off('menu:availability_changed');
      socket.off('restaurant:status_changed');
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ addToast }}>
      {children}
      {/* Toast Notification Renderer */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
