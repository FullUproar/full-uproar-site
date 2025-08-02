-- Add new fields to Order table for comprehensive management
ALTER TABLE "Order" 
ADD COLUMN IF NOT EXISTS "userId" TEXT,
ADD COLUMN IF NOT EXISTS "customerPhone" TEXT,
ADD COLUMN IF NOT EXISTS "paymentIntentId" TEXT,
ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT,
ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS "shippedAt" TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS "refundAmountCents" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "shippingMethod" TEXT,
ADD COLUMN IF NOT EXISTS "shippingCarrier" TEXT,
ADD COLUMN IF NOT EXISTS "shippingLabelUrl" TEXT,
ADD COLUMN IF NOT EXISTS "estimatedDeliveryDate" TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS "internalNotes" TEXT;

-- Create ShippingLabel table for tracking generated labels
CREATE TABLE IF NOT EXISTS "ShippingLabel" (
  "id" SERIAL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "carrier" TEXT NOT NULL,
  "trackingNumber" TEXT NOT NULL,
  "labelUrl" TEXT NOT NULL,
  "labelPdfUrl" TEXT,
  "rate" JSONB,
  "costCents" INTEGER NOT NULL,
  "weight" DECIMAL(10, 2),
  "length" DECIMAL(10, 2),
  "width" DECIMAL(10, 2),
  "height" DECIMAL(10, 2),
  "isVoid" BOOLEAN DEFAULT false,
  "voidedAt" TIMESTAMP(6),
  "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE
);

-- Create Return/RMA table
CREATE TABLE IF NOT EXISTS "Return" (
  "id" SERIAL PRIMARY KEY,
  "rmaNumber" TEXT UNIQUE NOT NULL,
  "orderId" TEXT NOT NULL,
  "userId" TEXT,
  "customerEmail" TEXT NOT NULL,
  "status" TEXT DEFAULT 'requested',
  "reason" TEXT NOT NULL,
  "condition" TEXT,
  "customerNotes" TEXT,
  "internalNotes" TEXT,
  "returnShippingMethod" TEXT,
  "returnTrackingNumber" TEXT,
  "receivedAt" TIMESTAMP(6),
  "processedAt" TIMESTAMP(6),
  "refundAmountCents" INTEGER,
  "restockingFeeCents" INTEGER DEFAULT 0,
  "replacementOrderId" TEXT,
  "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE
);

-- Create ReturnItem table for specific items being returned
CREATE TABLE IF NOT EXISTS "ReturnItem" (
  "id" SERIAL PRIMARY KEY,
  "returnId" INTEGER NOT NULL,
  "orderItemId" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "reason" TEXT,
  "condition" TEXT,
  "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("returnId") REFERENCES "Return"("id") ON DELETE CASCADE,
  FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE
);

-- Create SupportTicket table
CREATE TABLE IF NOT EXISTS "SupportTicket" (
  "id" SERIAL PRIMARY KEY,
  "ticketNumber" TEXT UNIQUE NOT NULL,
  "userId" TEXT,
  "customerEmail" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "orderId" TEXT,
  "category" TEXT NOT NULL,
  "priority" TEXT DEFAULT 'normal',
  "status" TEXT DEFAULT 'open',
  "subject" TEXT NOT NULL,
  "assignedTo" TEXT,
  "resolvedAt" TIMESTAMP(6),
  "satisfactionRating" INTEGER,
  "tags" TEXT[],
  "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL
);

-- Create SupportMessage table for ticket conversations
CREATE TABLE IF NOT EXISTS "SupportMessage" (
  "id" SERIAL PRIMARY KEY,
  "ticketId" INTEGER NOT NULL,
  "senderId" TEXT,
  "senderType" TEXT NOT NULL, -- 'customer', 'staff', 'system'
  "message" TEXT NOT NULL,
  "attachments" JSONB,
  "isInternal" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE
);

-- Create OrderNote table for internal order notes
CREATE TABLE IF NOT EXISTS "OrderNote" (
  "id" SERIAL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "noteType" TEXT DEFAULT 'general', -- 'general', 'shipping', 'customer', 'issue'
  "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE
);

-- Create InventoryAlert table for low stock notifications
CREATE TABLE IF NOT EXISTS "InventoryAlert" (
  "id" SERIAL PRIMARY KEY,
  "itemType" TEXT NOT NULL, -- 'game' or 'merch'
  "itemId" INTEGER NOT NULL,
  "itemName" TEXT NOT NULL,
  "currentStock" INTEGER NOT NULL,
  "threshold" INTEGER NOT NULL,
  "alertType" TEXT NOT NULL, -- 'low_stock', 'out_of_stock', 'restock_needed'
  "isResolved" BOOLEAN DEFAULT false,
  "resolvedAt" TIMESTAMP(6),
  "resolvedBy" TEXT,
  "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- Create EmailNotification table for tracking sent emails
CREATE TABLE IF NOT EXISTS "EmailNotification" (
  "id" SERIAL PRIMARY KEY,
  "recipientEmail" TEXT NOT NULL,
  "recipientName" TEXT,
  "subject" TEXT NOT NULL,
  "templateType" TEXT NOT NULL,
  "relatedId" TEXT, -- Could be orderId, ticketId, etc
  "relatedType" TEXT, -- 'order', 'ticket', 'return', etc
  "status" TEXT DEFAULT 'pending',
  "sentAt" TIMESTAMP(6),
  "errorMessage" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_order_userid" ON "Order"("userId");
CREATE INDEX IF NOT EXISTS "idx_order_status" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "idx_order_createdat" ON "Order"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_shippinglabel_orderid" ON "ShippingLabel"("orderId");
CREATE INDEX IF NOT EXISTS "idx_shippinglabel_tracking" ON "ShippingLabel"("trackingNumber");
CREATE INDEX IF NOT EXISTS "idx_return_orderid" ON "Return"("orderId");
CREATE INDEX IF NOT EXISTS "idx_return_status" ON "Return"("status");
CREATE INDEX IF NOT EXISTS "idx_supportticket_status" ON "SupportTicket"("status");
CREATE INDEX IF NOT EXISTS "idx_supportticket_customerEmail" ON "SupportTicket"("customerEmail");
CREATE INDEX IF NOT EXISTS "idx_supportticket_orderid" ON "SupportTicket"("orderId");
CREATE INDEX IF NOT EXISTS "idx_ordernote_orderid" ON "OrderNote"("orderId");
CREATE INDEX IF NOT EXISTS "idx_inventoryalert_resolved" ON "InventoryAlert"("isResolved");
CREATE INDEX IF NOT EXISTS "idx_emailnotification_status" ON "EmailNotification"("status");

-- Add notes field to OrderStatusHistory if it doesn't exist
ALTER TABLE "OrderStatusHistory" 
ADD COLUMN IF NOT EXISTS "notes" TEXT;