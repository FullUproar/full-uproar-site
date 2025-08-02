# Quick Reference Guide

## 🚀 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test:seed      # Add test data
npm run test:clean     # Remove test data

# Database
npx prisma studio      # Visual database editor
npx prisma db push     # Sync schema changes
```

## 🔑 Key URLs

- **Local Dev**: http://localhost:3010
- **Admin Panel**: http://localhost:3010/admin
- **Test Stripe**: http://localhost:3010/test-stripe
- **Cart Page**: http://localhost:3010/cart

## 🎨 Brand Colors

```css
Primary Orange:    #f97316
Light Orange:      #fdba74
Background:        #0a0a0a
Text Primary:      #fde68a
Text Secondary:    #e2e8f0
Success Green:     #10b981
Error Red:         #ef4444
Info Blue:         #3b82f6
Purple Accent:     #8b5cf6
```

## 📁 Project Structure

```
/app                    # Next.js app directory
  /admin               # Admin panel (protected)
  /api                 # API routes
  /cart               # Cart page
  /checkout           # Checkout flow
  /games              # Game catalog
  /merch              # Merchandise
  components/          # Shared components
  layout.tsx          # Root layout with providers

/lib                   # Utilities and services
  /analytics          # Event tracking
  /services           # Business logic
  /validation         # Zod schemas
  auth.ts            # Permission system
  cartStore.ts       # Cart state
  stripe.ts          # Payment config

/prisma               # Database
  schema.prisma      # Data models
  migrations/        # Schema history
```

## 🛠️ Common Patterns

### Protected API Route
```typescript
import { requirePermission } from '@/lib/auth';

export async function GET() {
  await requirePermission('admin:access');
  // Your code here
}
```

### Add Toast Notification
```typescript
import { toastStore } from '@/lib/toastStore';

toastStore.addToast('success', 'Product added to cart!');
```

### Track Analytics Event
```typescript
import { analytics, AnalyticsEvent } from '@/lib/analytics/analytics';

analytics.track(AnalyticsEvent.PRODUCT_ADD_TO_CART, {
  productId: 'abc123',
  productName: 'Game Name',
  productPrice: 29.99
});
```

## 🐛 Troubleshooting

### Cart not updating?
- Check browser console for errors
- Verify localStorage is not blocked
- Look for toast notifications

### Admin panel 404?
- Ensure you're logged in
- Check user has admin role in Clerk
- Verify DATABASE_URL is set

### Stripe not working?
- Add test keys to .env
- Check NEXT_PUBLIC prefix on publishable key
- Verify webhook secret if using webhooks

### Build errors?
- Run `npm install`
- Check all env vars are set
- Ensure Prisma client is generated

## 🔄 Deployment Checklist

1. [ ] Set all environment variables in Vercel
2. [ ] Configure Stripe webhook endpoint
3. [ ] Set up custom domain
4. [ ] Test payment flow with real Stripe test cards
5. [ ] Remove test data from production
6. [ ] Enable Vercel Analytics
7. [ ] Set up error monitoring (Sentry)

## 📞 Support

- **GitHub Issues**: Report bugs and feature requests
- **Admin Email**: info@fulluproar.com
- **Discord**: Join the Full Uproar community