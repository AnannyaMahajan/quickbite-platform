import React from 'react';
import { CheckCircle2, Clock, Utensils, Bike, Home, AlertCircle } from 'lucide-react';

export const OrderTimeline = ({ status }) => {
  const steps = [
    { key: 'PLACED', label: 'Order Placed', icon: Clock },
    { key: 'PREPARING', label: 'In Kitchen Prep', icon: Utensils },
    { key: 'READY_FOR_PICKUP', label: 'Ready for Rider', icon: Bike },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Bike },
    { key: 'DELIVERED', label: 'Delivered', icon: Home }
  ];

  const getStepIndex = (s) => {
    switch (s) {
      case 'PLACED': return 0;
      case 'RESTAURANT_ACCEPTED':
      case 'PREPARING': return 1;
      case 'READY_FOR_PICKUP':
      case 'DELIVERY_ASSIGNED': return 2;
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY': return 3;
      case 'DELIVERED':
      case 'COMPLETED': return 4;
      default: return -1;
    }
  };

  const currentIndex = getStepIndex(status);
  const isCancelled = ['CANCELLED', 'RESTAURANT_REJECTED'].includes(status);

  if (isCancelled) {
    return (
      <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12, color: '#f87171' }}>
        <AlertCircle size={24} />
        <div>
          <div style={{ fontWeight: 700 }}>Order Cancelled / Rejected</div>
          <div style={{ fontSize: '0.85rem' }}>Status: {status.replace(/_/g, ' ')}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
        {/* Progress Line */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 30,
            right: 30,
            height: 3,
            background: '#334155',
            zIndex: 1
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'var(--primary)',
              width: `${(Math.max(0, currentIndex) / (steps.length - 1)) * 100}%`,
              transition: 'width 0.4s ease'
            }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const StepIcon = step.icon;

          return (
            <div key={step.key} style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: isDone ? 'var(--primary)' : '#1e293b',
                  border: isCurrent ? '3px solid #ffffff' : '2px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isDone ? '#ffffff' : '#64748b',
                  boxShadow: isCurrent ? '0 0 15px rgba(249, 115, 22, 0.5)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                {isDone ? <CheckCircle2 size={20} /> : <StepIcon size={20} />}
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: isCurrent ? 700 : 500, color: isDone ? '#f8fafc' : '#64748b', textAlign: 'center' }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
