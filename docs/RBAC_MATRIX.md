# QuickBite Role-Based Access Control (RBAC) Matrix

## Permission Matrix Across Stakeholder Roles

| API / Feature Capability | CUSTOMER | RESTAURANT_OWNER | DELIVERY_PARTNER | ADMIN |
|---|:---:|:---:|:---:|:---:|
| Browse Restaurants & Menus | ✅ | ✅ | ✅ | ✅ |
| Place Order (Atomic Stock Check) | ✅ | ❌ | ❌ | ❌ |
| Cancel Order (Before Prep) | ✅ | ❌ | ❌ | ✅ |
| Track Active Order & Timeline | ✅ | ❌ | ❌ | ✅ |
| Rate Restaurant & Driver | ✅ | ❌ | ❌ | ❌ |
| Submit Dispute / Complaint | ✅ | ❌ | ❌ | ❌ |
| Manage Restaurant Profile & Hours | ❌ | ✅ | ❌ | ✅ |
| Manage Menu Items & Stock | ❌ | ✅ | ❌ | ✅ |
| Toggle Restaurant Status (`TEMPORARILY_UNAVAILABLE`) | ❌ | ✅ | ❌ | ✅ |
| Accept / Prep Kitchen Orders | ❌ | ✅ | ❌ | ✅ |
| View Assigned Deliveries | ❌ | ❌ | ✅ | ✅ |
| Accept / Reject Delivery Assignment | ❌ | ❌ | ✅ | ❌ |
| Update Delivery Status (`PICKED_UP` → `DELIVERED`) | ❌ | ❌ | ✅ | ✅ |
| View Driver Earnings | ❌ | ❌ | ✅ | ❌ |
| Approve / Reject Restaurants | ❌ | ❌ | ❌ | ✅ |
| Toggle User Account Suspension | ❌ | ❌ | ❌ | ✅ |
| View Platform GMV & Fleet Monitor | ❌ | ❌ | ❌ | ✅ |
| Resolve Customer Dispute Tickets & Issue Refunds | ❌ | ❌ | ❌ | ✅ |
