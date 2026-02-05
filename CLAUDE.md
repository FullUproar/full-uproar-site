# Full Uproar Games E-Commerce Platform

## 🎮 Project Overview

Full Uproar is a gaming company's e-commerce platform built with Next.js 15, featuring a complete online store for board games, merchandise, digital content, and community features. The site has a distinctive "fugly" aesthetic with bold orange branding and dark theme.

### Key Business Features
- **Product Sales**: Board games, merchandise (apparel, accessories), digital downloads
- **Community Hub**: Forums, events, game nights
- **Content Platform**: Comics, artwork galleries, news/blog
- **Admin Dashboard**: Complete order management, analytics, inventory tracking

### Technical Stack
- **Frontend**: Next.js 15.2.3 with App Router, React 19, TypeScript
- **Styling**: Inline styles with centralized design system (NO Tailwind)
- **Database**: PostgreSQL via Prisma ORM (hosted on Prisma Data Platform)
- **Authentication**: Clerk (email/password + OAuth providers)
- **Payments**: Stripe (test mode ready, supports live mode)
- **File Storage**: Vercel Blob Storage
- **Deployment**: Vercel (automatic deploys from GitHub)
- **State Management**: Zustand for cart, toast notifications

---

## 🤖 AI MAINTAINER INSTRUCTIONS

**CRITICAL**: This site is primarily built and maintained by AI. Follow these patterns exactly.

### Brand Colors - USE THESE EXACT VALUES

```typescript
// ✅ CORRECT - Pantone-matched brand colors
primary:      '#FF8200'  // Pantone 151 C - Main orange
headline:     '#FBDB65'  // Pantone 120 C - Yellow for headlines
purple:       '#7D55C7'  // Pantone 266 C - Purple accent
background:   '#0a0a0a'  // Near black
surface:      '#1a1a2e'  // Card backgrounds
text:         '#e2e8f0'  // Body text (light gray)

// ❌ WRONG - Never use these Tailwind defaults
'#f97316'   // Tailwind orange-500 - NOT our orange
'#fdba74'   // Tailwind orange-300 - NOT our yellow
'#8b5cf6'   // Tailwind violet-500 - NOT our purple
'#fde68a'   // Tailwind yellow-200 - legacy, use #FBDB65
```

### Design System Location

All design tokens are centralized:
```
lib/
├── colors.ts                    # Brand colors (SINGLE SOURCE OF TRUTH)
├── design-system/
│   ├── index.ts                 # Central export for all tokens
│   ├── typography.ts            # Font sizes, weights, line heights
│   ├── spacing.ts               # Margins, padding, gaps
│   ├── breakpoints.ts           # Responsive breakpoints + useBreakpoint()
│   └── buttons.ts               # Button sizes and variants
└── utils/
    └── formatting.ts            # Enum formatters (ALWAYS USE THESE)
```

### Using the Design System

```typescript
// ✅ CORRECT - Import from centralized design system
import { colors, typography, spacing, buttonSizes } from '@/lib/design-system';
import { formatAgeRating, formatPlayerCount, formatPlayTime, formatCategory } from '@/lib/utils/formatting';

// Use in styles
<div style={{
  background: colors.surface,
  color: colors.text,
  padding: spacing.lg,
  ...typography.body,
}}>

// ❌ WRONG - Hardcoded values
<div style={{
  background: '#1a1a2e',
  color: '#e2e8f0',
  padding: '1.5rem',
  fontSize: '1rem',
}}>
```

### Enum Formatting - NEVER Display Raw Values

```typescript
// ✅ CORRECT - Use centralized formatters
import { formatAgeRating, formatPlayerCount, formatPlayTime, formatCategory } from '@/lib/utils/formatting';

<span>{formatAgeRating(game.ageRating)}</span>      // "14+" not "FOURTEEN_PLUS"
<span>{formatPlayerCount(game.playerCount)}</span>  // "2-4 Players" not "TWO_TO_FOUR"
<span>{formatPlayTime(game.playTime)}</span>        // "30-60 min" not "THIRTY_TO_SIXTY"
<span>{formatCategory(game.category)}</span>        // "Strategy" not "STRATEGY"

// ❌ WRONG - Raw enum values
<span>{game.ageRating}</span>  // Shows "FOURTEEN_PLUS" - ugly!
```

### Shared UI Components

Located at `app/components/ui/`:

```typescript
// Empty states - use for empty lists, no results, etc.
import { EmptyState } from '@/app/components/ui';
<EmptyState variant="cart" />      // Empty shopping cart
<EmptyState variant="orders" />    // No orders
<EmptyState variant="products" />  // No products found
<EmptyState variant="search" />    // No search results
<EmptyState variant="games" />     // No games available

// Loading states - use for async content
import { Spinner, SkeletonGrid, LoadingSection, ProductCardSkeleton } from '@/app/components/ui';
<SkeletonGrid count={8} columns={4} />  // Grid of loading cards
<LoadingSection message="Loading games..." />
<Spinner size="large" />
```

### Prisma Enum Values (Schema Truth)

```typescript
// PlayerCount enum
'SINGLE' | 'TWO' | 'TWO_TO_FOUR' | 'TWO_TO_SIX' | 'TWO_TO_EIGHT' | 'THREE_TO_SIX' | 'FOUR_TO_EIGHT' | 'VARIES'

// PlayTime enum
'UNDER_FIFTEEN' | 'FIFTEEN_TO_THIRTY' | 'THIRTY_TO_SIXTY' | 'ONE_TO_TWO_HOURS' | 'TWO_PLUS_HOURS' | 'VARIES'

// AgeRating enum
'EVERYONE' | 'EIGHT_PLUS' | 'TEN_PLUS' | 'TWELVE_PLUS' | 'FOURTEEN_PLUS' | 'SIXTEEN_PLUS' | 'EIGHTEEN_PLUS' | 'ADULTS_ONLY'

// Category enum
'PARTY' | 'FAMILY' | 'STRATEGY' | 'COOPERATIVE' | 'COMPETITIVE' | 'CARD' | 'DRINKING' | 'ICEBREAKER' | 'OTHER'

// ⚠️ NOTE: Use 'VARIES' not 'VARIABLE' - this was a common mistake
```

### Admin Styles Pattern

For admin pages, use the adminStyles object pattern:
```typescript
// Located at: app/admin/styles/adminStyles.ts
import { adminStyles } from '../styles/adminStyles';

<div style={adminStyles.card}>
  <h2 style={adminStyles.cardTitle}>Title</h2>
  <button style={adminStyles.buttonPrimary}>Action</button>
</div>
```

---

## 🎨 Brand Identity

### Official Pantone Colors
| Color | Pantone | Hex | Usage |
|-------|---------|-----|-------|
| Orange | 151 C | `#FF8200` | Primary brand, buttons, accents |
| Yellow | 120 C | `#FBDB65` | Headlines, highlighted text |
| Purple | 266 C | `#7D55C7` | Special categories, secondary accent |
| Black | - | `#0a0a0a` | Background |
| Surface | - | `#1a1a2e` | Cards, elevated surfaces |

### Design Philosophy
"Fugly" aesthetic - Bold, unapologetic, high-contrast design that's impossible to ignore. Think 90s gaming meets modern functionality.

---

## 📁 Project Structure

### Key Directories
```
app/
├── admin/              # Admin dashboard (protected)
│   └── styles/         # adminStyles.ts pattern
├── components/
│   ├── ui/             # Shared UI components (EmptyState, LoadingState)
│   └── ...             # Feature-specific components
├── shop/               # E-commerce pages
├── api/                # API routes
└── ...

lib/
├── colors.ts           # Brand colors (SINGLE SOURCE OF TRUTH)
├── design-system/      # Typography, spacing, breakpoints, buttons
├── utils/
│   └── formatting.ts   # Enum formatters
└── ...
```

### Database Schema (Prisma)
```
- User (Clerk managed + custom fields)
- Game (products with stock tracking, images relation)
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

---

## 🚀 Implementation Status

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
   - Analytics dashboard with charts
   - Bulk operations (bulk delete with confirmation modal)
   - Test mode toggle for safe development

3. **Design System**
   - Centralized color tokens (lib/colors.ts)
   - Typography scale (lib/design-system/typography.ts)
   - Spacing system (lib/design-system/spacing.ts)
   - Responsive breakpoints with useBreakpoint() hook
   - Shared UI components (EmptyState, LoadingState, Skeletons)

4. **Security**
   - Input sanitization (XSS protection)
   - Rate limiting on sensitive endpoints
   - Permission-based access control
   - Secure webhook handling

---

## 🖼️ IMAGE LOADING BEST PRACTICES

### Use Next.js Image Component
```typescript
// ✅ CORRECT - Use Next.js Image for optimization
import Image from 'next/image';
<Image
  src={imageUrl}
  alt="Description"
  width={300}
  height={200}
  priority={isAboveTheFold}  // Priority for above-the-fold images
  unoptimized={isExternalUrl} // External URLs need unoptimized
/>

// ❌ WRONG - Raw img tags bypass all optimization
<img src={imageUrl} alt="Description" />
```

### Cache API Data That Doesn't Change Often
```typescript
// In components, cache artwork/logo URLs in localStorage
const CACHE_KEY = 'my-cache-key';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// In API routes, add cache headers
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  },
});
```

### Image Size Guidelines
- **Logos/icons**: < 50KB, use thumbnails for sizes ≤ 100px
- **Product images**: < 200KB, use WebP format
- **Hero images**: < 500KB, provide multiple sizes
- **NEVER** commit images > 1MB to public/ folder

### Current Issues to Fix (72 instances of raw `<img>`)
Files needing Next.js Image migration:
- ProductImageGallery.tsx (3 instances)
- ArtworkDisplay.tsx (2 instances)
- GameProductTabbed.tsx (6+ instances)
- MerchProductStyled.tsx (3 instances)
- shop pages (multiple)

---

## 🔧 IMPORTANT BUILD PRACTICES

### ALWAYS Build Locally First
**CRITICAL**: Before pushing any code changes to GitHub/Vercel, you MUST:
1. Run `npm run build` locally first
2. Fix all TypeScript/build errors locally
3. Only push to GitHub after successful local build
4. The Vercel deployment turnaround time is too long for debugging

---

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

---

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

### Testing Payments
1. Add test keys to `.env`
2. Use test card: 4242 4242 4242 4242
3. Check `/admin/test-stripe` for testing tools

---

## 🔗 Quick Links

- **Live Site**: https://fulluproar.com
- **Admin Panel**: https://fulluproar.com/admin
- **GitHub**: https://github.com/FullUproar/full-uproar-site

---

Last Updated: February 2025
