# Full Uproar E-commerce System Guide

## Overview

The Full Uproar site now includes a comprehensive e-commerce operation management system covering the entire business workflow from sales through fulfillment, including returns and customer support.

## Key Features

### 1. **Order Management Dashboard** (`/admin/orders`)
- Complete order lifecycle tracking
- Advanced filtering by status, date range, and search
- Inline order details expansion
- Quick actions for status updates
- Real-time order statistics
- Bulk operations support

### 2. **Fulfillment Center** (`/admin/fulfillment`)
- Workflow-based order processing (Payment → Picking → Packing → Ready → Shipped)
- Priority-based order sorting (Normal, Rush, Expedited)
- Bulk picking and packing operations
- Packing slip generation
- Real-time fulfillment statistics
- Average processing time tracking

### 3. **Shipping Integration** (`lib/shipping/shipping-service.ts`)
- Framework for carrier integrations (USPS, UPS, FedEx)
- Rate calculation system
- Shipping label generation
- Tracking number management
- Multi-carrier support

### 4. **Returns/RMA System** (`/admin/returns`)
- RMA number generation
- Return request processing
- Multi-stage return workflow
- Refund processing integration
- Return reason tracking
- Customer communication

### 5. **Customer Support Tickets** (`/admin/support`)
- Ticket creation and management
- Priority levels (Low, Normal, High, Urgent)
- Category-based organization
- Real-time messaging system
- Order linkage
- Internal notes
- Average response time tracking

### 6. **Stripe Payment Integration**
- Real payment processing capability
- Payment intent creation
- Webhook handling for payment events
- Refund processing
- Test mode support

## Database Schema Additions

The following models have been added to support e-commerce operations:

```prisma
model ShippingLabel {
  id                Int      @id @default(autoincrement())
  orderId           String
  carrier           String
  service           String
  trackingNumber    String
  labelUrl          String?
  costCents         Int
  createdAt         DateTime @default(now())
  order             Order    @relation(fields: [orderId], references: [id])
}

model Return {
  id                 Int          @id @default(autoincrement())
  rmaNumber          String       @unique
  orderId            String
  userId             String?
  customerEmail      String
  status             String       // requested, approved, shipping, received, processing, completed, rejected
  reason             String
  customerNotes      String?
  internalNotes      String?
  refundAmountCents  Int?
  createdAt          DateTime     @default(now())
  receivedAt         DateTime?
  processedAt        DateTime?
  // Relations
}

model SupportTicket {
  id              Int               @id @default(autoincrement())
  ticketNumber    String            @unique
  customerName    String
  customerEmail   String
  orderId         String?
  category        String
  priority        String            @default("normal")
  status          String            @default("open")
  subject         String
  internalNotes   String?
  resolution      String?
  resolvedAt      DateTime?
  assignedToId    String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  // Relations
}
```

## API Endpoints

### Orders
- `GET /api/admin/orders` - List orders with filtering
- `GET /api/admin/orders/[id]` - Get order details
- `PATCH /api/admin/orders/[id]` - Update order status
- `POST /api/admin/orders/[id]/refund` - Process refund
- `POST /api/admin/orders/[id]/shipping-label` - Create shipping label

### Returns
- `GET /api/admin/returns` - List returns
- `POST /api/admin/returns` - Create return/RMA
- `GET /api/admin/returns/[id]` - Get return details
- `PATCH /api/admin/returns/[id]` - Update return status

### Support
- `GET /api/admin/support/tickets` - List tickets
- `POST /api/admin/support/tickets` - Create ticket
- `GET /api/admin/support/tickets/[id]` - Get ticket details
- `PATCH /api/admin/support/tickets/[id]` - Update ticket
- `POST /api/admin/support/tickets/[id]/messages` - Add message

### Stripe
- `POST /api/stripe/create-payment-intent` - Create payment intent
- `POST /api/stripe/webhook` - Handle Stripe webhooks

## Environment Variables

Add these to your `.env.local`:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Shipping (when implementing real carriers)
USPS_API_KEY=
UPS_API_KEY=
FEDEX_API_KEY=
```

## Workflow Examples

### Order Fulfillment Flow
1. Order placed and paid → Status: "paid"
2. Warehouse picks items → Status: "picking"
3. Items packed → Status: "packing"
4. Package ready → Status: "ready"
5. Label created & shipped → Status: "shipped"
6. Delivered → Status: "delivered"

### Return Process Flow
1. Customer requests return → Status: "requested"
2. Admin approves → Status: "approved"
3. Customer ships back → Status: "shipping"
4. Warehouse receives → Status: "received"
5. Items inspected → Status: "processing"
6. Refund issued → Status: "completed"

### Support Ticket Flow
1. Ticket created → Status: "open"
2. Agent responds → Status: "in_progress"
3. Waiting for customer → Status: "waiting_customer"
4. Issue resolved → Status: "resolved"
5. Ticket closed → Status: "closed"

## Testing

### Test Payment Cards
- Success: 4242 4242 4242 4242
- Declined: 4000 0000 0000 0002
- Insufficient funds: 4000 0000 0000 9995
- Expired: 4000 0000 0000 0069

### Creating Test Orders
1. Add items to cart
2. Proceed to checkout
3. Use test card for payment
4. Order will appear in admin dashboard

## Monitoring & Analytics

The system tracks:
- Order volume and revenue
- Average fulfillment time
- Return rates and reasons
- Support ticket response times
- Shipping costs and carrier performance

## Security Considerations

- All admin endpoints require authentication
- Stripe webhooks are verified
- Sensitive data is encrypted
- PCI compliance through Stripe
- Rate limiting on API endpoints

## Future Enhancements

1. **Email Notifications**
   - Order confirmations
   - Shipping notifications
   - Return status updates
   - Support ticket responses

2. **Inventory Management**
   - Stock tracking
   - Low stock alerts
   - Automatic reorder points
   - Reserved inventory for pending orders

3. **Advanced Analytics**
   - Customer lifetime value
   - Product performance metrics
   - Shipping cost optimization
   - Return reason analysis

4. **Customer Portal**
   - Order history
   - Return requests
   - Support ticket creation
   - Tracking information

## Troubleshooting

### Common Issues

1. **Orders not appearing**: Check payment webhook configuration
2. **Shipping rates not loading**: Verify carrier API keys
3. **Returns not processing**: Ensure refund permissions are set
4. **Support tickets not sending**: Check email service configuration

### Debug Commands

```bash
# Check Stripe webhook logs
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test order creation
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customerEmail":"test@example.com",...}'
```

## Contact

For issues or questions about the e-commerce system, check:
- Admin Dashboard → System Health
- Stripe Dashboard for payment issues
- Server logs for API errors