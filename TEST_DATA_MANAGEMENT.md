# Test Data Management Guide

## Understanding Test Mode vs Test Data

**Test Mode** controls:
- Which Stripe API keys are used (test vs live)
- Visual indicators in the admin panel
- Safety features for development

**Test Data** includes:
- Products created during testing
- Test orders
- Test customers
- Any other database records

## Options for Managing Test Data

### Option 1: Manual Cleanup (Recommended for Small Data)
1. Go to Admin Panel
2. Manually delete test products, orders, etc.
3. This ensures you only remove what you intend to

### Option 2: Add Test Flags to Database
We could modify the schema to add `isTestData` flags:

```prisma
model Game {
  // ... existing fields
  isTestData Boolean @default(false)
}
```

Then filter out test data in production:
```typescript
const games = await prisma.game.findMany({
  where: { isTestData: false }
});
```

### Option 3: Use Separate Databases
- Development/staging database for testing
- Production database for live data
- Most robust solution but requires more setup

### Option 4: Create Cleanup Script
Create a script to remove test data:

```typescript
// scripts/cleanup-test-data.ts
async function cleanupTestData() {
  // Delete orders with test email patterns
  await prisma.order.deleteMany({
    where: {
      customerEmail: {
        contains: 'test@'
      }
    }
  });
  
  // Delete products with test indicators
  await prisma.game.deleteMany({
    where: {
      title: {
        contains: 'Test'
      }
    }
  });
}
```

## Recommended Approach

For production launch:

1. **Before going live:**
   - Manually review and delete obvious test products
   - Clear test orders from the database
   - Keep any real products you've already created

2. **Set up environment separation:**
   - Use different databases for dev/staging/production
   - Or implement test data flags for easy filtering

3. **Document your test data:**
   - Keep a list of test product IDs
   - Use consistent naming (e.g., prefix with "TEST_")
   - Makes cleanup easier

## Quick Commands

### Check for test data:
```sql
-- Find potential test products
SELECT * FROM "Game" WHERE title LIKE '%Test%' OR title LIKE '%test%';
SELECT * FROM "Merchandise" WHERE name LIKE '%Test%' OR name LIKE '%test%';

-- Find test orders
SELECT * FROM "Order" WHERE "customerEmail" LIKE '%test@%';
```

### Safe cleanup approach:
1. First, identify what would be deleted
2. Review the list
3. Then proceed with deletion
4. Always backup your database first

## Important Notes

- Test mode ≠ test data
- Stripe test transactions never appear in live mode
- Database records persist regardless of mode
- Always backup before bulk deletions
- Consider soft deletes (status flags) instead of hard deletes