# Full Uproar Gaming E-Commerce Platform

## 🎮 Project Overview

Full Uproar is a gaming company's e-commerce platform built with Next.js 15, featuring a complete online store for board games, merchandise, digital content, and community features. The site has a distinctive "fugly" aesthetic with bold orange (#f97316) branding and dark theme.

### Key Business Features
- **Product Sales**: Board games, merchandise (apparel, accessories), digital downloads
- **Community Hub**: Forums, events, game nights
- **Content Platform**: Comics, artwork galleries, news/blog
- **Admin Dashboard**: Complete order management, analytics, inventory tracking

### Technical Stack
- **Frontend**: Next.js 15.2.3 with App Router, React 19, TypeScript
- **Styling**: Inline styles with consistent dark theme (#0a0a0a background)
- **Database**: PostgreSQL via Prisma ORM (hosted on Prisma Data Platform)
- **Authentication**: Clerk (email/password + OAuth providers)
- **Payments**: Stripe (test mode ready, supports live mode)
- **File Storage**: Vercel Blob Storage
- **Deployment**: Vercel (automatic deploys from GitHub)
- **State Management**: Zustand for cart, toast notifications

## 🚀 Current Implementation Status

### ✅ Completed Features

1. **E-Commerce Core**
   - Full shopping cart with persistent storage (Zustand + localStorage)
   - Stripe checkout integration (payment intents API)
   - Order management system with status tracking
   - Inventory tracking with stock management
   - Product variants (sizes, colors) for merchandise
   - Digital product support with download links

2. **Admin Panel** (/admin)
   - Dashboard with revenue stats and quick actions
   - Product management (games, merchandise)
   - Order processing with status updates
   - Analytics dashboard with charts (page views, conversions, funnel)
   - Bulk operations (bulk delete with confirmation modal)
   - Test mode toggle for safe development
   - Returns/refunds management
   - Customer support ticket system

3. **User Features**
   - Product browsing with search and filters
   - Shopping cart with real-time updates
   - Guest checkout support
   - Order history and tracking
   - Mobile-responsive design
   - Toast notifications for user feedback

4. **Security**
   - Input sanitization (XSS protection)
   - Rate limiting on sensitive endpoints
   - Permission-based access control
   - Secure webhook handling
   - Environment variable protection

## 📁 Documentation Structure

### Core Documentation
- **[README.md](./README.md)** - Basic project setup and deployment
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and structure
- **[STYLE_GUIDE.md](./STYLE_GUIDE.md)** - UI/UX design patterns and brand colors

### Feature Documentation
- **[CLAUDE_ECOMMERCE.md](./CLAUDE_ECOMMERCE.md)** - E-commerce implementation details
- **[STRIPE_SETUP.md](./STRIPE_SETUP.md)** - Payment integration guide
- **[TEST_DATA_MANAGEMENT.md](./TEST_DATA_MANAGEMENT.md)** - Managing test vs production data

### Testing & Security
- **[ECOMMERCE_TEST_PLAN.md](./ECOMMERCE_TEST_PLAN.md)** - Comprehensive test scenarios
- **[ECOMMERCE_QUICK_TEST.md](./ECOMMERCE_QUICK_TEST.md)** - Quick testing checklist
- **[ECOMMERCE_SECURITY_AUDIT.md](./ECOMMERCE_SECURITY_AUDIT.md)** - Security review checklist

### Setup Guides
- **[README_ADMIN_SETUP.md](./README_ADMIN_SETUP.md)** - Admin user configuration
- **[CLERK_EMAIL_VERIFICATION_SETUP.md](./CLERK_EMAIL_VERIFICATION_SETUP.md)** - Email verification setup

## 🎨 Brand Identity

### Colors
- **Primary**: `#f97316` (Vibrant Orange)
- **Accent**: `#fdba74` (Light Orange/Peach)
- **Background**: `#0a0a0a` (Near Black)
- **Text Primary**: `#fde68a` (Pale Yellow)
- **Text Secondary**: `#e2e8f0` (Light Gray)
- **Purple Accent**: `#8b5cf6` (Special items/categories)

### Design Philosophy
"Fugly" aesthetic - Bold, unapologetic, high-contrast design that's impossible to ignore. Think 90s gaming meets modern functionality.

## 🔧 Key Implementation Details

### Database Schema (Prisma)
```
- User (Clerk managed + custom fields)
- Game (products with stock tracking)
- Merchandise (with variants)
- Order (comprehensive order management)
- OrderItem (line items with pricing)
- OrderStatusHistory (audit trail)
- Cart/CartItem (persistent cart)
- Inventory (stock management)
- AnalyticsEvent (user behavior tracking)
- Return (RMA system)
- SupportTicket (customer service)
```

### API Routes Structure
```
/api/
  /admin/        - Admin endpoints (protected)
  /orders/       - Order management
  /cart/         - Cart operations
  /products/     - Public product APIs
  /stripe/       - Payment processing
  /analytics/    - Event tracking
```

### State Management
- **Cart**: Zustand store with localStorage persistence
- **Toasts**: Global toast system for notifications
- **Analytics**: Client-side event tracking with batching

## 🚦 Environment Variables

### Required for Production
```
DATABASE_URL              - PostgreSQL connection string
CLERK_SECRET_KEY         - Clerk authentication
STRIPE_SECRET_KEY        - Stripe payments (live mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY - Stripe public key
BLOB_READ_WRITE_TOKEN    - Vercel Blob storage
```

### Optional
```
STRIPE_WEBHOOK_SECRET    - For webhook verification
DISCORD_WEBHOOK_URL      - Order notifications
```

## 📋 Common Tasks

### Adding New Products
1. Go to `/admin`
2. Navigate to Games or Merchandise
3. Click "New Game/Merch"
4. Fill required fields and save

### Processing Orders
1. Orders appear in `/admin` → Orders
2. Update status as items are processed
3. Add tracking info when shipped
4. System tracks all status changes

### Bulk Cleanup (Test Data)
1. Go to Games/Merch list in admin
2. Select items with checkboxes
3. Click "Delete (X)" button
4. Confirm in modal

### Testing Payments
1. Create Stripe account (free)
2. Add test keys to `.env`
3. Use test card: 4242 4242 4242 4242
4. Check `/admin/test-stripe` for testing tools

## 🐛 Known Issues & Considerations

1. **Analytics Provider** - Wrapped in layout.tsx but be careful with hydration
2. **Test Mode** - Always shows in dev, check production carefully
3. **Image Optimization** - Using Next.js Image where possible
4. **Cart Persistence** - LocalStorage based, cleared on logout

## 🔄 Next Steps / Roadmap

1. **Printify Integration** - POD merchandise automation
2. **Digital Downloads** - Automated delivery system
3. **Forum System** - Community features
4. **Email Notifications** - Order confirmations, shipping updates
5. **Advanced Analytics** - User cohorts, retention metrics
6. **Subscription Products** - Recurring billing support

## 💡 Tips for Claude AI

When working on this project:
1. **Always check existing patterns** - The codebase is consistent
2. **Use inline styles** - No Tailwind classes, follow adminStyles pattern
3. **Test in admin** - Most features have admin UI for testing
4. **Check permissions** - Use requirePermission() for protected routes
5. **Add to cart works** - Look for toast notifications in top-right
6. **Analytics tracks everything** - Check browser console in dev mode

## 🔗 Quick Links

- **Live Site**: https://fulluproar.com
- **Admin Panel**: https://fulluproar.com/admin
- **GitHub**: https://github.com/FullUproar/full-uproar-site
- **Test Stripe**: https://fulluproar.com/test-stripe

---

Last Updated: January 2025
Current Focus: E-commerce launch readiness