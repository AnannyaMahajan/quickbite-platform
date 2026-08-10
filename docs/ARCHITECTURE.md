# QuickBite Architecture Specification

## System Architecture Diagram

```
                    ┌────────────────────────────────────────────────────────┐
                    │               REACT FRONTEND (Vite)                    │
                    │  [Customer UI] [Restaurant UI] [Delivery UI] [Admin UI]│
                    └───────────────────┬────────────────┬───────────────────┘
                                        │                │
                             HTTP REST (Axios)    WebSockets (Socket.IO)
                                        │                │
                                        ▼                ▼
                    ┌────────────────────────────────────────────────────────┐
                    │                 EXPRESS BACKEND SERVER                 │
                    │   - JWT Auth & RBAC Middleware                         │
                    │   - Order State Machine Engine                         │
                    │   - Inventory Concurrency Guard (Atomic Operations)    │
                    │   - Automated Delivery Reassignment Engine             │
                    │   - Real-Time Socket Event Emitter                     │
                    └───────────────────────────┬────────────────────────────┘
                                                │
                                       Mongoose / MongoDB
                                                │
                                                ▼
                    ┌────────────────────────────────────────────────────────┐
                    │                   MONGODB DATABASE                     │
                    │  [Users] [Restaurants] [MenuItems] [Orders]           │
                    │  [DeliveryAssignments] [Ratings] [Complaints]          │
                    └────────────────└───────────────────────────────────────┘
```

## Modular Backend Architectural Layers
1. **Config Layer**: `db.js`, `jwt.js`, `socket.js` - handles database initialization, JWT verification, and Socket.IO server room dispatchers.
2. **Models Layer**: Mongoose document schemas enforcing indexing, constraints, data types, and password hashing hooks.
3. **Middleware Layer**: JWT authentication middleware (`authMiddleware.js`), Role-Based Access Control (`rbacMiddleware.js`), Express Rate Limiting (`rateLimiter.js`), and centralized error handling (`errorHandler.js`).
4. **Services Layer**: Core domain business logic including `orderStateMachine.js` (order lifecycle state transitions), `inventoryService.js` (atomic `$inc` stock checks), `deliveryService.js` (automated driver matching & rejection reassignment), and `seedData.js` (realistic dataset generation).
5. **Controllers & Routes**: Stakeholder-segregated API controllers providing clean RESTful endpoints.
