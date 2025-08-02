# Full Uproar Gaming

E-commerce platform for Full Uproar Games - board games, merchandise, and digital content.

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Complete project overview and AI context
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Commands, URLs, and common patterns
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and technical details

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Run development server
npm run dev

# Open http://localhost:3000
```

## 🔧 Environment Variables

Create a `.env` file with:

```env
# Database (Required)
DATABASE_URL="your-postgres-connection-string"

# Clerk Auth (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Stripe Payments (Required for checkout)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Optional
STRIPE_WEBHOOK_SECRET="whsec_..."
BLOB_READ_WRITE_TOKEN="vercel_blob_..."
```

## 📦 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Clerk
- **Payments**: Stripe
- **Styling**: Inline styles (no Tailwind)
- **Deployment**: Vercel

## 🎮 Features

- Complete e-commerce platform
- Admin dashboard with analytics
- Shopping cart with persistence
- Stripe checkout integration
- Order management system
- Inventory tracking
- Mobile responsive

## 🚢 Deployment

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

See [CLAUDE.md](./CLAUDE.md) for detailed deployment instructions.

## 📄 License

© 2025 Full Uproar Games. All rights reserved.