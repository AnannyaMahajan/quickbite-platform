# QuickBite Order State Machine Specification

## Controlled Order State Machine Diagram

```
                    [ PLACED ] ──(Customer cancels before prep)──► [ CANCELLED ]
                        │
             (Restaurant Accepts)
                        ▼
               [ RESTAURANT_ACCEPTED ]
                        │
             (Restaurant Starts Prep)
                        ▼
                  [ PREPARING ]
                        │
               (Food Ready for Pickup)
                        ▼
               [ READY_FOR_PICKUP ] ──► (System assigns Delivery Partner)
                        │
                        ▼
              [ DELIVERY_ASSIGNED ] ◄─── (If Partner Rejects: Auto-Reassigns)
                        │
              (Partner Accepts & Picked Up)
                        ▼
                 [ PICKED_UP ]
                        │
               (Partner En Route)
                        ▼
              [ OUT_FOR_DELIVERY ]
                        │
               (Delivered to Customer)
                        ▼
                  [ DELIVERED ]
                        │
              (Customer/System Complete)
                        ▼
                  [ COMPLETED ]
```

## Controlled State Transition Validation Matrix

| Current State | Target State | Permitted Role | Backend Constraint Enforcement |
|---|---|---|---|
| `PLACED` | `CANCELLED` | `CUSTOMER`, `ADMIN` | Allowed ONLY if status is `PLACED`. Restores inventory atomically. |
| `PLACED` | `RESTAURANT_ACCEPTED` | `RESTAURANT_OWNER`, `ADMIN` | Transitions order to kitchen acceptance. |
| `PLACED` | `RESTAURANT_REJECTED` | `RESTAURANT_OWNER`, `ADMIN` | Rejects order and restores inventory. |
| `RESTAURANT_ACCEPTED` | `PREPARING` | `RESTAURANT_OWNER`, `ADMIN` | Marks food in active kitchen preparation. Customer can no longer cancel. |
| `PREPARING` | `READY_FOR_PICKUP` | `RESTAURANT_OWNER`, `ADMIN` | Triggers automated delivery partner matching service. |
| `READY_FOR_PICKUP` | `DELIVERY_ASSIGNED` | Automated Service, `ADMIN` | Dispatches assignment to nearest available delivery rider via Socket.IO. |
| `DELIVERY_ASSIGNED` | `PICKED_UP` | `DELIVERY_PARTNER`, `ADMIN` | Confirms rider has collected food package from restaurant. |
| `PICKED_UP` | `OUT_FOR_DELIVERY` | `DELIVERY_PARTNER`, `ADMIN` | Updates live customer timeline with active navigation status. |
| `OUT_FOR_DELIVERY` | `DELIVERED` | `DELIVERY_PARTNER`, `ADMIN` | Confirms drop-off to customer, unlocks rating modal. |
| `DELIVERED` | `COMPLETED` | System, `CUSTOMER`, `ADMIN` | Finalizes order lifecycle. |
