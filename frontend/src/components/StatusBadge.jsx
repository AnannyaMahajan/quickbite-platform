import React from 'react';

export const StatusBadge = ({ status }) => {
  const getBadgeClass = (s) => {
    switch (s) {
      case 'PLACED': return 'badge-placed';
      case 'RESTAURANT_ACCEPTED':
      case 'PREPARING': return 'badge-prep';
      case 'READY_FOR_PICKUP':
      case 'DELIVERY_ASSIGNED': return 'badge-ready';
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY': return 'badge-delivery';
      case 'DELIVERED':
      case 'COMPLETED': return 'badge-delivered';
      case 'CANCELLED':
      case 'RESTAURANT_REJECTED': return 'badge-cancel';
      default: return 'badge-placed';
    }
  };

  return (
    <span className={`badge ${getBadgeClass(status)}`}>
      {status ? status.replace(/_/g, ' ') : 'UNKNOWN'}
    </span>
  );
};
