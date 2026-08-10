# QuickBite REST API Specification

## Authentication Endpoints (`/api/auth`)
- `POST /api/auth/register` — Register a new account (`CUSTOMER`, `RESTAURANT_OWNER`, `DELIVERY_PARTNER`).
- `POST /api/auth/login` — Login with email and password, returns JWT token & user object.
- `GET /api/auth/me` — [Auth] Fetch current user profile.

## Customer Endpoints (`/api/customer`)
- `GET /api/customer/restaurants` — Search and filter approved restaurants by cuisine and status.
- `GET /api/customer/restaurants/:id` — Get restaurant details.
- `GET /api/customer/restaurants/:id/menu` — Get categorized menu items with stock availability.
- `POST /api/customer/orders` — [Customer] Place order with atomic inventory reservation.
- `GET /api/customer/orders` — [Customer] Get customer order history.
- `GET /api/customer/orders/:id` — [Customer] Get order details and tracking timeline.
- `PATCH /api/customer/orders/:id/cancel` — [Customer] Cancel order (Permitted ONLY before prep).
- `POST /api/customer/ratings` — [Customer] Rate restaurant and delivery experience.

## Restaurant Owner Endpoints (`/api/restaurant`)
- `GET /api/restaurant/profile` — [Owner] Get restaurant profile.
- `POST /api/restaurant/profile` — [Owner] Create or update restaurant profile.
- `PATCH /api/restaurant/status` — [Owner] Toggle restaurant status (`OPEN`, `CLOSED`, `TEMPORARILY_UNAVAILABLE`).
- `GET /api/restaurant/orders` — [Owner] Fetch incoming operational order queue.
- `PATCH /api/restaurant/orders/:id/status` — [Owner] Transition order state (`RESTAURANT_ACCEPTED`, `PREPARING`, `READY_FOR_PICKUP`).
- `POST /api/restaurant/menu/items` — [Owner] Create new menu item.
- `PATCH /api/restaurant/menu/items/:id` — [Owner] Update menu item.
- `DELETE /api/restaurant/menu/items/:id` — [Owner] Delete menu item.
- `PATCH /api/restaurant/menu/items/:id/availability` — [Owner] Toggle menu item availability and stock.

## Delivery Partner Endpoints (`/api/delivery`)
- `GET /api/delivery/assignments` — [Driver] Fetch active assigned trips.
- `POST /api/delivery/assignments/:id/accept` — [Driver] Accept trip assignment.
- `POST /api/delivery/assignments/:id/reject` — [Driver] Reject trip assignment (triggers automated system reassignment).
- `PATCH /api/delivery/orders/:orderId/status` — [Driver] Update delivery status (`PICKED_UP`, `OUT_FOR_DELIVERY`, `DELIVERED`).
- `GET /api/delivery/history` — [Driver] View completed trip history.
- `GET /api/delivery/earnings` — [Driver] View earnings breakdown.
- `PATCH /api/delivery/availability` — [Driver] Toggle online/offline duty status.

## Platform Admin Endpoints (`/api/admin`)
- `GET /api/admin/users` — [Admin] List all registered users across all roles.
- `PATCH /api/admin/users/:id/suspend` — [Admin] Toggle user account suspension.
- `GET /api/admin/restaurants` — [Admin] List restaurants and pending approvals.
- `PATCH /api/admin/restaurants/:id/approve` — [Admin] Approve or revoke restaurant registration.
- `GET /api/admin/orders` — [Admin] Live fleet order monitor with fraud indicators.

## Analytics & Complaints (`/api/analytics`, `/api/complaints`)
- `GET /api/analytics/admin` — [Admin] GMV, order volume, cancellation rates, platform health.
- `GET /api/analytics/restaurant` — [Owner] Revenue, order counts, average order value.
- `POST /api/complaints` — [Customer] File dispute ticket.
- `GET /api/complaints/customer` — [Customer] View dispute tickets.
- `GET /api/complaints/admin` — [Admin] View open complaints.
- `PATCH /api/complaints/:id/resolve` — [Admin] Resolve complaint ticket and issue refund.
