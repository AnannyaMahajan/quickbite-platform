# QuickBite — Food Delivery & Restaurant Operations Platform (VESA Project 2)

![QuickBite Banner](https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80)

> **Official VESA Skill Development Program — Project 2 Implementation**  
> QuickBite is an enterprise-grade, multi-tenant food delivery and restaurant operations platform engineered connecting four primary stakeholders: **Customer**, **Restaurant Owner**, **Delivery Partner**, and **Platform Administrator**.

---

## 🌟 Executive Key Features & Highlights

- 👤 **Dedicated Customer Portal**: Restaurant discovery, search, cuisine filters, menu browsing, item stock counters, cart drawer, checkout modal, live multi-step order timeline, driver details, order ratings, and dispute filing.
- 🏪 **Restaurant Operations Console**: Real-time incoming order queue, kitchen prep queue (`PLACED` → `ACCEPTED` → `PREPARING` → `READY_FOR_PICKUP`), menu item price & stock manager, availability toggles, restaurant status switcher (`OPEN`, `CLOSED`, `TEMPORARILY_UNAVAILABLE`), and sales metrics.
- 🛵 **Delivery Partner Rider App**: Trip assignment alerts, accept & rejection controls with **automated system reassignment**, active status updaters (`PICKED_UP` → `OUT_FOR_DELIVERY` → `DELIVERED`), availability toggle, and earnings breakdown.
- 🛡️ **Platform Administrator Console**: GMV analytics, restaurant onboarding approval workflow, live fleet order monitor with fraud indicators, user management with account suspension switches, and customer dispute resolution desk.
- ⚛️ **Atomic Concurrency Protection**: Backend inventory reservation using atomic MongoDB query filters (`{ quantity: { $gte: orderedQty } }`), guaranteeing zero inventory overselling under heavy concurrent user ordering.
- 🔌 **Full Socket.IO Event Engine**: 13+ real-time events broadcasting order creation, status updates, driver dispatches, menu stock toggles, and admin operational alerts.

---

## 🚀 Quick Start & Zero-Dependency Execution Guide

The platform is designed to run completely out-of-the-box with **zero external database setup required**. An embedded MongoDB database engine (`mongodb-memory-server`) automatically spins up on backend start and seeds realistic operational data!

### Demo Login Credentials (1-Click Switcher Available in UI)

| Role Persona | Email Login | Password | Capabilities |
|---|---|---|---|
| 👤 **Customer** | `customer@quickbite.com` | `password123` | Restaurant discovery, cart, checkout, tracking, ratings, complaints |
| 🏪 **Restaurant Owner** | `owner@quickbite.com` | `password123` | Kitchen prep queue, menu management, availability & status toggles |
| 🛵 **Delivery Partner** | `delivery@quickbite.com` | `password123` | Trip assignments, accept/reject, trip status updater, earnings |
| 🛡️ **Platform Admin** | `admin@quickbite.com` | `password123` | Platform health GMV, restaurant approvals, fraud flags, user suspension |

---

## 🛠️ Technology Stack Architecture

- **Frontend**: React 18 (Vite), React Router v6, Axios, Socket.IO Client, Lucide React Icons, Custom Glassmorphic Design System.
- **Backend**: Node.js v24 + Express.js, Socket.IO v4, JWT (`jsonwebtoken`), `bcryptjs`, `express-rate-limit`, `helmet`, `cors`.
- **Database**: MongoDB with Mongoose (using `mongodb-memory-server` with fallback to standard `MONGODB_URI` environment variable).
- **Testing**: Built-in automated edge-case test suite (`npm run test` in backend).

---

## 📁 Repository Folder Structure

```
Project/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection, JWT, Socket.IO setup
│   │   ├── controllers/     # Auth, Customer, Restaurant, Delivery, Admin, Analytics, Complaint controllers
│   │   ├── middleware/      # Auth, RBAC, RateLimiter, ErrorHandler
│   │   ├── models/          # User, Restaurant, MenuItem, MenuCategory, Order, OrderStatusHistory, DeliveryAssignment, Rating, Complaint
│   │   ├── routes/          # REST API endpoints grouped by stakeholder
│   │   ├── services/        # OrderStateMachine, InventoryService, DeliveryService, SocketService, SeedData
│   │   ├── utils/           # Automated test runner script
│   │   └── server.js        # Main Express & Socket.IO server entry
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, StatusBadge, OrderTimeline, Modals
│   │   ├── context/         # AuthContext, CartContext, SocketContext
│   │   ├── pages/           # Customer, Restaurant, Delivery, Admin pages
│   │   ├── services/        # Axios API client & Socket.IO client
│   │   ├── styles/          # Custom Design System CSS
│   │   ├── App.jsx          # Protected Routing setup
│   │   └── main.jsx
│   └── package.json
├── docs/                    # Architecture, ER Diagrams, State Machine, API Docs
└── README.md
```

---

## 🧪 Edge-Case Verification Results (100% Pass Rate)

To execute the automated test suite verifying all 8 VESA edge-case scenarios:

```bash
cd backend
node src/utils/runTests.js
```

### Verified Test Matrix:
- ✅ **Test 1**: Customer cancels before preparation (`PLACED` status) -> Cancellation succeeds, stock restored.
- ✅ **Test 2**: Customer cancels after prep starts (`PREPARING` status) -> Rejected by backend (`400 Bad Request`).
- ✅ **Test 3**: Simultaneous order for stock = 1 -> Exactly 1 order succeeds; 2nd order rejected with stock >= 0 guaranteed.
- ✅ **Test 4**: Restaurant marked `TEMPORARILY_UNAVAILABLE` -> New orders blocked.
- ✅ **Test 6**: Delivery partner rejects trip -> Automated reassignment engine dispatches trip to next available rider.
- ✅ **Test 7**: Customer calls Admin endpoint -> `403 Forbidden` RBAC rejection.
- ✅ **Test 8**: Malformed/Expired JWT -> `401 Unauthorized` rejection.

---

## 📄 License & Attribution

Built for the **VESA Skill Development Program — Project 2 Evaluation**.  
Author: Senior Software Engineer & Architect.
