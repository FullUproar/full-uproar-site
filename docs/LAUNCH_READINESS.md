# Launch Readiness Tracker

## Critical E2E Flows

### Flow 1: Purchase Flow (Highest Priority)
**User comes to site → finds game → adds to cart → purchases → receives confirmation**

> ⚠️ **BLOCKER**: All products currently have stock=0. No "Add to Cart" buttons appear on the shop page.
> Products show "COMING SPRING 2026" instead. **Fix: Add inventory via /admin → Games → Edit → Set stock > 0**

| Step | Status | Notes |
|------|--------|-------|
| 1.1 Homepage loads, games visible | ✅ | Tested - working |
| 1.2 Can navigate to shop/game page | ✅ | Tested - working |
| 1.3 Game has price, description, images | ⚠️ | Prices shown, but **no purchasable products** (stock=0) |
| 1.4 Add to cart works, shows feedback | 🚫 | **BLOCKED** - no Add to Cart buttons (all products stock=0) |
| 1.5 Cart shows correct items/prices | ✅ | Works - shows empty state correctly when no items |
| 1.6 Checkout form validates properly | 🚫 | **BLOCKED** - redirects to home when cart empty |
| 1.7 Stripe payment loads | 🚫 | **BLOCKED** - requires items in cart |
| 1.8 Test payment processes | ⬜ | Requires setup + cart items |
| 1.9 Order created in database | ⬜ | Requires payment |
| 1.10 Order confirmation page shows | ⬜ | Requires order |
| 1.11 Confirmation email sent | ⬜ | Requires order |
| 1.12 Order appears in admin | ✅ | Admin orders page accessible (requires login) |

**Test command**: `npm run test:flow1`

---

### Flow 2: Fulfillment Flow
**Order received → fulfillment manifest → shipping label → inventory updated → tracking**

| Step | Status | Notes |
|------|--------|-------|
| 2.1 Order appears in admin orders | ⬜ | |
| 2.2 Order status can be updated | ⬜ | |
| 2.3 Fulfillment view shows pending orders | ⬜ | |
| 2.4 Can mark as "processing" | ⬜ | |
| 2.5 Shipping label generation works | ⬜ | ShipStation integration? |
| 2.6 Tracking number can be added | ⬜ | |
| 2.7 Inventory decremented on ship | ⬜ | |
| 2.8 Customer notified of shipment | ⬜ | Email with tracking |
| 2.9 Order status updated to "shipped" | ⬜ | |

**Test command**: `npm run test:e2e -- --grep "fulfillment flow"`

---

### Flow 3: Order Tracking & RMA
**Customer tracks order → requests return → RMA processed → refund issued**

| Step | Status | Notes |
|------|--------|-------|
| 3.1 Order lookup by email/order# | ⬜ | |
| 3.2 Order status visible to customer | ⬜ | |
| 3.3 Tracking link works | ⬜ | |
| 3.4 Return request form works | ⬜ | |
| 3.5 RMA created in admin | ⬜ | |
| 3.6 Return shipping label generated | ⬜ | |
| 3.7 Return received, status updated | ⬜ | |
| 3.8 Refund processed via Stripe | ⬜ | |
| 3.9 Customer notified of refund | ⬜ | |
| 3.10 Inventory restocked (if applicable) | ⬜ | |

**Test command**: `npm run test:e2e -- --grep "rma flow"`

---

## Horizontal Areas

### 1. Product Content
| Item | Status | Notes |
|------|--------|-------|
| All games have titles | ⬜ | |
| All games have descriptions (>50 chars) | ⬜ | |
| All games have prices | ⬜ | |
| All games have primary image | ⬜ | |
| All games have gallery images | ⬜ | |
| All merch has titles | ⬜ | |
| All merch has descriptions | ⬜ | |
| All merch has prices | ⬜ | |
| All merch has size/variant options | ⬜ | |
| All merch has images | ⬜ | |
| No placeholder/lorem ipsum text | ⬜ | |

**Validation script**: `npm run validate:content`

---

### 2. Legal Content
| Item | Status | Notes |
|------|--------|-------|
| Terms of Service exists | ⬜ | |
| Terms reviewed by attorney | ⬜ | |
| Privacy Policy exists | ⬜ | |
| Privacy Policy GDPR compliant | ⬜ | |
| Privacy Policy CCPA compliant | ⬜ | |
| Cookie consent banner works | ⬜ | |
| Refund/Returns policy exists | ⬜ | |
| Shipping policy exists | ⬜ | |
| Age verification (if needed) | ⬜ | |

---

### 3. Web UX & Accessibility
| Item | Status | Notes |
|------|--------|-------|
| All pages load <3s | ✅ | Tested |
| LCP <2.5s | ✅ | Tested |
| No layout shift | ✅ | Tested |
| Color contrast WCAG AA | ✅ | Fixed |
| Form labels accessible | ✅ | Fixed |
| Buttons have aria-labels | ✅ | Fixed |
| Keyboard navigation works | ✅ | Tested |
| Skip to content link | ⬜ | |
| Focus indicators visible | ✅ | Tested |
| Error messages clear | ⬜ | |
| Loading states shown | ⬜ | No loading.tsx |
| 404 page helpful | ✅ | Tested |
| Empty states have CTAs | ✅ | Tested |

**Test command**: `npm run test:ux`

---

### 4. Mobile UX & Accessibility
| Item | Status | Notes |
|------|--------|-------|
| No horizontal scroll | ✅ | Tested |
| Touch targets ≥44px | ⚠️ | 8 small targets |
| Text readable (≥16px) | ✅ | Tested |
| Mobile nav works | ✅ | Tested |
| Forms usable on mobile | ⬜ | |
| Checkout works on mobile | ⬜ | |
| Images responsive | ⬜ | |
| No fixed positioning issues | ⬜ | |

**Test command**: `npm run test:ux -- --project="Mobile Chrome"`

---

### 5. SEO
| Item | Status | Notes |
|------|--------|-------|
| Meta titles on all pages | ⬜ | |
| Meta descriptions on all pages | ⬜ | |
| OpenGraph tags | ✅ | Present |
| Twitter cards | ✅ | Present |
| Sitemap.xml generated | ✅ | Present |
| Robots.txt configured | ✅ | Present |
| Canonical URLs set | ⬜ | |
| Product structured data | ⬜ | JSON-LD |
| Organization structured data | ⬜ | |
| Image alt text on all images | ⬜ | |
| No broken links | ✅ | Tested |
| Page speed >70 (Lighthouse) | ⬜ | |

**Test command**: `npm run lighthouse`

---

### 6. Security
| Item | Status | Notes |
|------|--------|-------|
| Rate limiting enabled | ✅ | Implemented |
| Security headers set | ✅ | Implemented |
| Input sanitization | ✅ | Implemented |
| SQL injection prevented | ✅ | Prisma |
| XSS prevented | ✅ | React + sanitizer |
| CSRF protection | ✅ | Clerk |
| Admin routes protected | ✅ | Middleware |
| API keys not exposed | ⬜ | Audit needed |
| Environment vars secure | ⬜ | Check Vercel |
| PII encrypted at rest | ⬜ | |
| SSL/TLS enforced | ⬜ | Vercel handles |
| Dependency audit clean | ⬜ | `npm audit` |

**Test command**: `npm run security:audit`

---

### 7. Testing & CI
| Item | Status | Notes |
|------|--------|-------|
| Unit tests pass | ⬜ | `npm run test:unit` |
| E2E tests pass | ✅ | 34 UX tests |
| Visual regression baselines | ⬜ | Need to generate |
| GitHub Actions workflow | ✅ | Created |
| Lighthouse CI configured | ✅ | Created |
| Test coverage >60% | ⬜ | |
| No flaky tests | ⚠️ | Rate limit issues |

**Test command**: `npm run test:all`

---

### 8. Analytics & Dashboards
| Item | Status | Notes |
|------|--------|-------|
| Page view tracking | ⬜ | |
| Event tracking (add to cart, etc) | ⬜ | |
| Conversion tracking | ⬜ | |
| Google Analytics configured | ⬜ | |
| Meta Pixel configured | ⬜ | |
| Admin dashboard shows metrics | ⬜ | |
| Revenue tracking | ⬜ | |
| Error monitoring (Sentry?) | ⬜ | |
| Uptime monitoring | ⬜ | |

---

## Quick Reference

### Commands
```bash
# Run critical flow tests
npm run test:flow1           # Purchase flow
npm run test:flow2           # Fulfillment flow
npm run test:flow3           # RMA flow
npm run test:flows           # All flows

# Run all UX tests
npm run test:ux

# Run full test suite
npm run test:all

# Run Lighthouse audit
npm run lighthouse

# Security audit
npm run security:audit

# Launch readiness check
npm run test:launch-ready
```

### Priority Order
1. **Flow 1** - Purchase flow (revenue blocker)
2. **Legal** - Terms/Privacy (legal blocker)
3. **Flow 2** - Fulfillment (operations blocker)
4. **Product Content** - Customer experience
5. **Flow 3** - RMA (support readiness)
6. Everything else

---

## Status Legend
- ✅ Complete
- ⚠️ Partial/Issues
- ⬜ Not started
- 🚫 Blocked

Last Updated: 2025-01-25
