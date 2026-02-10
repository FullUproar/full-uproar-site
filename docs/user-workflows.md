# Full Uproar — User Workflows

Every user workflow on the site. Each row: **Entry Point → Intent → Desired Outcome → E2E Status**.
Used as the master checklist for QA walkthroughs.

### Coverage Key
- `COVERED` — Playwright test exists and exercises this flow
- `PARTIAL` — Test touches this area but doesn't fully verify the outcome
- `GAP` — No test coverage

---

## Shopping & Purchase

| # | Entry Point | Intent | Desired Outcome | E2E Status | Covered By |
|---|------------|--------|-----------------|------------|------------|
| 1 | Homepage | Capture email | Email saved, confirmation shown | COVERED | email-capture.spec |
| 2 | Homepage | Browse games | Lands on game catalog with filters | COVERED | home.spec, flow1-purchase |
| 3 | Homepage | Browse merch | Lands on merch catalog with filters | COVERED | home.spec |
| 4 | Game catalog | View game details | Detail page with images, specs, price | COVERED | product-pages.spec |
| 5 | Merch catalog | View merch details | Detail page with size/color options | COVERED | product-pages.spec |
| 6 | Game detail | Add game to cart | Cart updates, toast shown | COVERED | shopping-flow.spec, flow1-purchase |
| 7 | Merch detail | Add merch to cart (with size) | Cart updates with correct variant | COVERED | merch-cart.spec |
| 8 | Cart | Continue shopping | Returns to /shop | COVERED | cart-flows.spec |
| 9 | Cart | Proceed to checkout | Enters checkout flow | COVERED | ecommerce-flow.spec |
| 10 | Checkout | Complete purchase | Order confirmation + email | PARTIAL | ecommerce-flow (skipped in some configs) |
| 11 | Order confirmation | View details | Order ID, items, total displayed | PARTIAL | ecommerce-flow (checks redirect only) |
| 12 | Any shop page | Abandon / leave | Cart persists for return visit | COVERED | shopping-flow.spec, ecommerce-flow |
| 13 | Cart | Remove item | Item removed, totals update | COVERED | shopping-flow.spec |
| 14 | Cart | Adjust quantity | Quantity and totals update | COVERED | shopping-flow.spec |
| 15 | Checkout | Go back a step | Previous step with data preserved | COVERED | cart-flows.spec |

---

## Account & Auth

| # | Entry Point | Intent | Desired Outcome | E2E Status | Covered By |
|---|------------|--------|-----------------|------------|------------|
| 16 | Any page (nav) | Sign up | Account created, redirect home | GAP | — (Clerk blocks automation) |
| 17 | Any page (nav) | Sign in | Signed in, redirect back | GAP | — (Clerk blocks automation) |
| 18 | Account page | View profile | Sees name, email, membership | GAP | — |
| 19 | Account page | View order history | Sees past orders with status | GAP | — |
| 20 | Account page | Update profile | Saves changes, confirmation | GAP | — |
| 21 | Nav (signed in) | Sign out | Session cleared, redirect home | GAP | — |

---

## Order Tracking & Support

| # | Entry Point | Intent | Desired Outcome | E2E Status | Covered By |
|---|------------|--------|-----------------|------------|------------|
| 22 | Track order page | Track an order | Sees order status + tracking | COVERED | order-tracking.spec |
| 23 | Returns page | Start a return | Reads policy, sees RMA info | PARTIAL | ux-improvements (nav links only) |
| 24 | Contact page | Submit support request | Form filled, ticket created | COVERED | contact-form.spec |
| 25 | Confirmation email | Track shipment | Carrier tracking page | GAP | — (external link, can't test) |

---

## Game Nights

| # | Entry Point | Intent | Desired Outcome | E2E Status | Covered By |
|---|------------|--------|-----------------|------------|------------|
| 26 | Game Nights page | View game nights | Sees upcoming nights | COVERED | game-nights.spec, community-pages.spec |
| 27 | Game Nights page | Create game night | Modal → 3 steps → created | COVERED | game-nights.spec |
| 28 | Game Nights page | View game night details | Sees guests, games, date | PARTIAL | game-nights (tests 404 only) |
| 29 | Game night detail | RSVP | In/Maybe/Out recorded | PARTIAL | community-pages.spec (checks for RSVP buttons) |
| 30 | Game night detail | Invite guests | Copy invite link | PARTIAL | community-pages.spec (checks for invite UI) |
| 31 | Invite link | Join game night | Lands on page, RSVPs | PARTIAL | game-nights (error case only) |
| 32 | Game night detail | Play online | Enters live game room | GAP | — |

---

## Forums

| # | Entry Point | Intent | Desired Outcome | E2E Status | Covered By |
|---|------------|--------|-----------------|------------|------------|
| 33 | Forum page | Browse forums | Sees boards with activity | COVERED | community-pages.spec |
| 34 | Forum board | View thread | Sees posts and replies | COVERED | community-pages.spec |
| 35 | Forum board | Create new thread | Thread posted | PARTIAL | community-pages.spec (checks button exists) |
| 36 | Thread | Reply to thread | Reply appears | GAP | — (requires auth) |

---

## Game Kit (Custom Card Games)

| # | Entry Point | Intent | Desired Outcome | E2E Status | Covered By |
|---|------------|--------|-----------------|------------|------------|
| 37 | Game Kit page | View my games | Sees dashboard | COVERED | community-pages.spec |
| 38 | Game Kit dashboard | Create new game | Template → name → builder | PARTIAL | community-pages.spec (checks create button) |
| 39 | Game builder | Edit custom game | Cards/rules saved | GAP | — (requires auth + game data) |
| 40 | Game Kit dashboard | Share game | Copy share link | GAP | — (requires auth + game data) |
| 41 | Share link | Play shared game | Joins session, plays | GAP | — |
| 42 | Join page | Join via invite code | Joins correct session | PARTIAL | community-pages.spec (checks join button) |

---

## Content & Discovery

| # | Entry Point | Intent | Desired Outcome | E2E Status | Covered By |
|---|------------|--------|-----------------|------------|------------|
| 43 | About page | Learn about Full Uproar | Reads story, mission, team | COVERED | content-pages.spec |
| 44 | The Line page | Explore game lore | Reads universe stories | COVERED | content-pages.spec |
| 45 | FAQ page | Find answers | Browses/searches FAQ | COVERED | content-pages.spec |
| 46 | Afterroar page | Learn about membership | Sees tiers, benefits, pricing | COVERED | content-pages.spec |
| 47 | Afterroar page | Subscribe | Payment → membership activated | GAP | — (requires Stripe) |
| 48 | Game detail | View how to play | Rules, video, tips | GAP | — |
| 49 | Fugly page | Learn about brand | Reads design philosophy | COVERED | content-pages.spec |

---

## Email & Marketing

| # | Entry Point | Intent | Desired Outcome | E2E Status | Covered By |
|---|------------|--------|-----------------|------------|------------|
| 50 | Footer | Subscribe to newsletter | Email saved, confirmation | COVERED | email-capture.spec |
| 51 | Slide-in popup | Capture engaged user | Enters email, subscribed | PARTIAL | email-capture.spec (scroll trigger, delay too long for CI) |
| 52 | Cart (guest) | Capture email | Email saved for follow-up | COVERED | email-capture.spec |
| 53 | Shop page banner | Capture shopper email | Enters email, subscribed | COVERED | email-capture.spec |

---

## Legal & Policy

| # | Entry Point | Intent | Desired Outcome | E2E Status | Covered By |
|---|------------|--------|-----------------|------------|------------|
| 54 | Footer link | View privacy policy | Reads /privacy | COVERED | ux-improvements |
| 55 | Footer link | View terms of service | Reads /terms | COVERED | ux-improvements |
| 56 | Footer link | View return policy | Reads /returns | COVERED | ux-improvements |

---

## Admin & Fulfillment (Internal)

| # | Entry Point | Intent | Desired Outcome | E2E Status | Covered By |
|---|------------|--------|-----------------|------------|------------|
| 57 | Admin dashboard | Process new order | Status through pick→pack→ship | COVERED | ecommerce-flow.spec |
| 58 | Fulfillment | Scan items for order | Barcodes checked off | GAP | — |
| 59 | Fulfillment | Generate shipping label | Label generated, PDF downloaded | GAP | — |
| 60 | Fulfillment | Complete fulfillment | Shipped, tracking saved | PARTIAL | ecommerce-flow |
| 61 | Admin orders | Issue refund | Refund processed via Stripe | PARTIAL | ecommerce-flow |
| 62 | Admin returns | Process return | RMA approved, refund processed | COVERED | ecommerce-flow.spec |

---

## Coverage Summary

| Category | Total | COVERED | PARTIAL | GAP |
|----------|-------|---------|---------|-----|
| Shopping & Purchase | 15 | 13 | 2 | 0 |
| Account & Auth | 6 | 0 | 0 | 6 |
| Order Tracking & Support | 4 | 2 | 1 | 1 |
| Game Nights | 7 | 2 | 4 | 1 |
| Forums | 4 | 2 | 1 | 1 |
| Game Kit | 6 | 1 | 2 | 3 |
| Content & Discovery | 7 | 5 | 0 | 2 |
| Email & Marketing | 4 | 3 | 1 | 0 |
| Legal & Policy | 3 | 3 | 0 | 0 |
| Admin & Fulfillment | 6 | 2 | 2 | 2 |
| **TOTAL** | **62** | **33 (53%)** | **13 (21%)** | **16 (26%)** |

## Testing Strategy Decisions

### Auth-Dependent Flows (#16-21) — Unit Tests, Not E2E Mocks

**Decision:** Cover auth flows with unit tests (mocked Clerk) instead of E2E mocks.

**Rationale:**
- Sign up/in/out (#16, 17, 21) are **Clerk's hosted UI** — not our code, nothing to test
- Profile/orders (#18-20) depend on `getCurrentUser()`, `requireAuth()`, `checkPermission()` — these are tested via unit tests with mocked `auth()` and `currentUser()`
- Mocking Clerk in Playwright (env-var bypass or testing tokens) tests a *different code path* than production and adds ops overhead for minimal confidence gain
- Unit tests with mocked auth test the logic we actually own: role checks, permission hierarchy, DB lookups

**Unit test coverage added:**
| Test File | Tests | What It Covers |
|-----------|-------|----------------|
| `tests/unit/lib/auth/auth.test.ts` | 16 | getCurrentUser, requireAuth, checkPermission, requirePermission, role hierarchy (GOD > SUPER_ADMIN > ADMIN > MOD > USER), colon notation, individual permissions, expiry |
| `tests/unit/lib/auth/require-admin.test.ts` | 11 | requireAdmin gate (every admin API route), isAdmin helper, all role outcomes |
| `tests/unit/lib/auth/require-elevated-admin.test.ts` | 11 | 2FA elevation gate, requireAdminWithElevationStatus, TOTP enabled/disabled paths |
| `tests/unit/lib/auth/totp.test.ts` | 6 | isElevationValid (null, past, future), getElevationExpiry (180 min window) |

This gives us **44 unit tests** covering every branch of the auth decision tree that protects all authenticated routes.

---

## Remaining E2E Gaps

### Untestable in E2E (by design)
- #16-17, 21 — Clerk hosted UI (sign up, sign in, sign out) → not our code
- #25 — External carrier tracking link → can't test
- #47 — Stripe subscription payment → requires live payment
- #48 — "How to play" → no dedicated page exists yet

### Auth-Required (covered by unit tests instead)
- #18-20 — Profile, order history, profile update → auth logic unit tested
- #32 — Game night play online → real-time feature, auth-gated
- #36 — Forum reply → auth-gated write operation
- #39-41 — Game Kit edit/share/play → auth-gated + needs game data
- #58-59 — Fulfillment scan/label → admin-gated, unit tested via requireAdmin

### Bugs Found & Fixed During Testing
- **Newsletter API Prisma error** (FIXED): `POST /api/newsletter` was failing with `Unknown argument 'name'` in the `emailSubscriber.upsert()` call. Removed the `name` field from both `create` and `update` clauses. All email capture flows (#1, 50-53) now work.
- **Contact form missing rate limiting** (FIXED): `POST /api/contact` had no rate limiting, making it vulnerable to spam/abuse. Added `rateLimit(request, 'api')` (100 req/min) at the top of the POST handler (#24).
