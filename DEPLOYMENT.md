# Full Uproar Games - Deployment Guide

## Quick Deploy to Vercel

### 1. Push to GitHub (if not already done)
```bash
git remote add origin https://github.com/YOUR_USERNAME/full-uproar-games.git
git push -u origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables (see below)

### 3. Environment Variables for Vercel
Add these in Vercel's dashboard under Settings > Environment Variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Z3JlYXQtc2hlcGhlcmQtOTUuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_JIjr1ZbaaQIXDEnWkB8Wy5LwUovoEKrVV6wCU2IyB7
DATABASE_URL=your_production_database_url
```

### 4. Database Options for Production

#### Option A: PlanetScale (Recommended)
```bash
# Sign up at planetscale.com
# Create database: full-uproar-prod
# Copy connection string
DATABASE_URL="mysql://username:password@host/full-uproar-prod?sslaccept=strict"
```

#### Option B: Neon (PostgreSQL)
```bash
# Sign up at neon.tech  
# Create database
# Update schema.prisma provider to "postgresql"
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
```

#### Option C: Vercel Postgres
```bash
# Add Vercel Postgres integration in Vercel dashboard
# It will auto-configure DATABASE_URL
```

### 5. Update Schema for Production Database
If using PostgreSQL (Neon/Vercel Postgres), update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"  // or "mysql" for PlanetScale
  url      = env("DATABASE_URL")
}
```

### 6. Deploy Commands
Vercel will automatically:
- Install dependencies
- Run `npm run build`
- Generate Prisma client
- Deploy your app

### 7. Post-Deploy Setup
1. Run database migrations:
   ```bash
   npx prisma db push
   ```
2. Seed initial data:
   ```bash
   node prisma/seed-games.js
   ```

## Features Included
- ✅ E-commerce store with cart
- ✅ Admin dashboard with image uploads
- ✅ Clerk authentication
- ✅ Database-driven content
- ✅ Responsive design
- ✅ API endpoints
- ✅ Image upload functionality

## Admin Access
- Sign in with any email via Clerk
- Go to `/admin/dashboard`
- Manage games, comics, and news
- Upload images directly

Your chaotic game store is ready for the world! 🎮😼