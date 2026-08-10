# QuickBite Real-Time Socket.IO Architecture

## Socket Event Dispatch Table

| Event Name | Socket Room Target | Payload Data | Triggering Workflow |
|---|---|---|---|
| `order:created` | `restaurant:<id>`, `role:admin` | `{ orderId, orderNumber, grandTotal, customerName }` | New order placed by customer |
| `order:status_update` | `user:<id>`, `restaurant:<id>`, `role:admin` | `{ orderId, orderNumber, status, timestamp, note }` | Any order state transition |
| `delivery:assigned` | `user:<partnerId>` | `{ assignmentId, orderId, orderNumber, pickupAddress }` | Automated delivery matching service |
| `delivery:rejected` | `role:admin` | `{ orderId, partnerId, reason, timestamp }` | Delivery partner rejects trip |
| `delivery:reassigned` | `user:<newPartnerId>` | `{ assignmentId, orderId, reassigned: true }` | Automated reassignment engine |
| `menu:availability_changed` | `restaurant:<id>`, `role:customer` | `{ itemId, isAvailable, quantity }` | Restaurant owner toggles stock or item reaches 0 |
| `restaurant:status_changed` | Global / Public room | `{ restaurantId, name, status }` | Restaurant toggles status (`OPEN`/`TEMPORARILY_UNAVAILABLE`) |
| `complaint:created` | `role:admin` | `{ ticketNumber, complaintId, customerName, subject }` | Customer files dispute ticket |
| `complaint:resolved` | `user:<customerId>` | `{ ticketNumber, status, resolutionNotes, refundAmount }` | Admin resolves dispute ticket |
| `admin:alert` | `role:admin` | `{ type, severity, message, orderId }` | Escalated operational alerts (e.g. no driver available) |
