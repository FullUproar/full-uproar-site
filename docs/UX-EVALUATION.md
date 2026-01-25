# Full Uproar UX Evaluation

## Methodology

### Phase 1: Connectivity Mapping
For each page, document:
- **Entry Points**: How can users reach this page?
- **Exit Points**: Where can users go from this page?
- **Dead End?**: Is there a clear next action?

### Phase 2: Heuristic Evaluation
Evaluate against Nielsen's 10 Usability Heuristics:
1. **Visibility of system status** - Does the system keep users informed?
2. **Match between system and real world** - Does it use familiar language?
3. **User control and freedom** - Can users undo/escape easily?
4. **Consistency and standards** - Does it follow conventions?
5. **Error prevention** - Does it prevent errors before they happen?
6. **Recognition over recall** - Are options visible vs memorized?
7. **Flexibility and efficiency** - Are there shortcuts for experts?
8. **Aesthetic and minimalist design** - Is irrelevant info avoided?
9. **Help users with errors** - Are error messages helpful?
10. **Help and documentation** - Is help available when needed?

### Rating Scale
- ✅ **Good** - Meets expectations
- ⚠️ **Needs Work** - Functional but has issues
- ❌ **Problem** - Significant UX issue
- 🚫 **Missing** - Feature/element doesn't exist

---

## Page Connectivity Map

### Legend
```
[Page] ──→ Can navigate to
[Page] ←── Can be reached from
[Page] ←→ Bidirectional navigation
```

---

## 1. HOMEPAGE (`/`)

### Connectivity
| Entry Points | Exit Points |
|--------------|-------------|
| Direct URL / Bookmarks | `/shop` (Hero CTA) |
| Search engines | `/games/[slug]` (Game carousel) |
| Social media links | `/game-nights` (Choose Your Weapon) |
| Marketing campaigns | `/shop` (Choose Your Weapon) |
| Return visitors | Footer links (all sections) |

### Elements Present
- [x] Navigation bar (global)
- [x] Hero section with CTA
- [x] Featured games carousel
- [x] "Choose Your Weapon" sections
- [x] Footer with links
- [ ] Game Kit promotion
- [ ] The Line feature

### Heuristic Evaluation

| Heuristic | Rating | Notes |
|-----------|--------|-------|
| 1. System status | ⚠️ | No loading indicator for game carousel |
| 2. Real world match | ✅ | "Choose Your Weapon" is playful but clear |
| 3. User control | ✅ | Easy to scroll, carousel has controls |
| 4. Consistency | ✅ | Consistent with brand |
| 5. Error prevention | ✅ | No form inputs to error on |
| 6. Recognition | ⚠️ | Game Kit not visible without nav exploration |
| 7. Flexibility | ✅ | Multiple paths to shop |
| 8. Minimalist design | ⚠️ | Dense content, could overwhelm |
| 9. Error handling | N/A | No errors possible |
| 10. Help/docs | 🚫 | No help visible |

### Issues Found
1. **Game Kit discoverability**: Only in nav dropdown, not featured on homepage
2. **The Line product**: Has dedicated page but no homepage presence
3. **No loading states**: Game carousel loads without indicator
4. **Dense content**: Many sections may overwhelm new visitors

### Recommendations
- [ ] Add Game Kit section to homepage
- [ ] Feature The Line product prominently
- [ ] Add skeleton loading for game carousel
- [ ] Consider progressive disclosure for sections

---

## 2. SHOP LANDING (`/shop`)

### Connectivity
| Entry Points | Exit Points |
|--------------|-------------|
| Homepage CTA | `/games/[slug]` (game detail - **legacy route!**) |
| Nav: SHOP > All Games | `/merch/[slug]` (merch detail - **legacy route!**) |
| Nav: SHOP > Merch | Tab switch (games/merch) |
| Footer links | Category filters |
| Direct URL | Cart (via add to cart buttons) |

### Elements Present
- [x] Navigation bar
- [x] Games/Merch tab switcher
- [x] Category filters (with icons)
- [x] Product grid with cards
- [x] Add to cart buttons
- [x] Loading states
- [x] URL state persistence (tab/category survives refresh)
- [x] Responsive design (mobile detection)
- [ ] Search functionality
- [ ] Sort options (price, date, etc.)

### Heuristic Evaluation
| Heuristic | Rating | Notes |
|-----------|--------|-------|
| 1. System status | ✅ | Loading states shown |
| 2. Real world match | ✅ | Clear categories with icons |
| 3. User control | ✅ | Tab/filter controls work well |
| 4. Consistency | ✅ | Consistent card design |
| 5. Error prevention | ✅ | Disabled add for out of stock |
| 6. Recognition | ✅ | Categories visible with icons |
| 7. Flexibility | ⚠️ | No search, no sort options |
| 8. Minimalist design | ✅ | Clean, focused layout |
| 9. Error handling | ⚠️ | Silent fail on API errors (console only) |
| 10. Help/docs | 🚫 | No product help/guides |

### Issues Found
1. **Links to legacy routes**: Products link to `/games/[slug]` not `/shop/games/[slug]`
2. **No search**: Users can't search for specific products
3. **No sort**: Can't sort by price, newest, popularity
4. **Silent API errors**: Errors logged to console, no user feedback
5. **No "empty state"**: If no products match filter, unclear feedback

### Recommendations
- [ ] Update links to use canonical `/shop/games/[slug]` routes
- [ ] Add search functionality
- [ ] Add sort dropdown (price low-high, newest, etc.)
- [ ] Add user-facing error state for failed loads
- [ ] Add empty state for no matching products

---

## 3. GAME PRODUCT PAGE (`/games/[slug]` - legacy route)

### Connectivity
| Entry Points | Exit Points |
|--------------|-------------|
| `/shop` product cards | `/cart` (Add to cart) |
| Homepage game carousel | Back to `/shop` (need to verify) |
| Direct link/share | Related products? |

### Elements Present
- [ ] Need to audit this page

### Issues Found
1. **Route confusion**: Both `/games/[slug]` and `/shop/games/[slug]` may exist
2. **Need redirect strategy**: Should consolidate to one canonical route

---

## 4. CART (`/cart`)

### Connectivity
| Entry Points | Exit Points |
|--------------|-------------|
| "Add to Cart" from any product | `/checkout` (Proceed button) |
| Nav cart icon | `/games` (Continue shopping - **legacy route!**) |
| Direct URL | Back to product pages (implicit) |

### Elements Present
- [x] Cart item list with images
- [x] Quantity controls (+/-)
- [x] Remove item button
- [x] Price summary (subtotal, shipping, tax, total)
- [x] Proceed to checkout button
- [x] Empty cart state
- [x] Trust badges
- [x] Mobile responsive
- [x] Loading state
- [x] Analytics tracking

### Heuristic Evaluation
| Heuristic | Rating | Notes |
|-----------|--------|-------|
| 1. System status | ✅ | Loading state, item counts |
| 2. Real world match | ✅ | Familiar cart metaphor |
| 3. User control | ✅ | Can adjust qty, remove items |
| 4. Consistency | ✅ | Brand consistent |
| 5. Error prevention | ⚠️ | No undo for remove |
| 6. Recognition | ✅ | Clear actions |
| 7. Flexibility | ✅ | Qty controls efficient |
| 8. Minimalist design | ✅ | Focused on cart |
| 9. Error handling | ✅ | Handles empty cart well |
| 10. Help/docs | ⚠️ | No shipping info before checkout |

### Issues Found
1. **Empty cart links to legacy route**: "Browse Games" goes to `/games` not `/shop`
2. **No undo for remove**: Accidentally removing item is permanent
3. **No shipping estimate**: Users don't know shipping cost until checkout
4. **No saved for later**: Can't move items out of cart temporarily

### Recommendations
- [ ] Fix "Browse Games" link to go to `/shop/games`
- [ ] Add "undo" toast when removing items
- [ ] Show shipping estimate in cart
- [ ] Consider "save for later" feature

---

## 5. CHECKOUT (`/checkout`)

### Connectivity
| Entry Points | Exit Points |
|--------------|-------------|
| `/cart` proceed button | `/order-confirmation` (success) |
| Direct URL (redirects if empty) | `/` (if cart empty) |
| | Stay on page (validation errors) |

### Elements Present
- [x] Multi-step form (contact, shipping, payment)
- [x] Form validation
- [x] Order summary
- [x] Stripe integration
- [x] Test mode support
- [x] Form persistence (sessionStorage)
- [x] Trust badges
- [x] SMS opt-in
- [x] Analytics tracking

### Store Status Note
**Store is currently closed** (`isOpen: false`). Launch date: Spring 2026.

### Heuristic Evaluation
| Heuristic | Rating | Notes |
|-----------|--------|-------|
| 1. System status | ✅ | Step indicator, processing state |
| 2. Real world match | ✅ | Familiar checkout flow |
| 3. User control | ✅ | Can go back, form persists |
| 4. Consistency | ✅ | Consistent styling |
| 5. Error prevention | ✅ | Validation before submit |
| 6. Recognition | ✅ | Clear form labels |
| 7. Flexibility | ⚠️ | No guest vs account choice |
| 8. Minimalist design | ✅ | Focused on purchase |
| 9. Error handling | ✅ | Inline validation errors |
| 10. Help/docs | ⚠️ | No FAQ/help link |

### Issues Found
1. **No back to cart button visible**: Users may feel trapped
2. **No FAQ/help**: Payment questions unanswered
3. **No express checkout**: No Apple Pay, Google Pay shortcuts

### Recommendations
- [ ] Add visible "back to cart" link
- [ ] Add checkout FAQ/help section
- [ ] Consider express payment options

---

## 6. ORDER CONFIRMATION (`/order-confirmation`)

### Connectivity
| Entry Points | Exit Points |
|--------------|-------------|
| Checkout success | `/shop` (Continue Shopping) |
| Direct URL with orderId | `/track-order` (Track Your Order) |

### Elements Present
- [x] Success message
- [x] Order ID (copyable)
- [x] Order summary
- [x] Shipping info
- [x] Continue shopping CTA
- [x] Track order CTA
- [x] Meta Pixel tracking

### Heuristic Evaluation
| Heuristic | Rating | Notes |
|-----------|--------|-------|
| 1. System status | ✅ | Clear success confirmation |
| 2. Real world match | ✅ | Receipt-like layout |
| 3. User control | ✅ | Two clear next actions |
| 4. Consistency | ✅ | Brand consistent |
| 5. Error prevention | N/A | Post-purchase page |
| 6. Recognition | ✅ | Clear CTAs |
| 7. Flexibility | ✅ | Multiple exit options |
| 8. Minimalist design | ✅ | Focused on confirmation |
| 9. Error handling | ⚠️ | Redirects to home if order not found |
| 10. Help/docs | ⚠️ | No "what happens next" explanation |

### Issues Found
1. **No email confirmation mention**: Users may wonder if email was sent
2. **No "what happens next"**: Timeline/process unclear
3. **Silent redirect on error**: If order not found, just goes home

### Recommendations
- [ ] Add "confirmation email sent to X" message
- [ ] Add "what happens next" section with timeline
- [ ] Show error message if order not found instead of redirect

---

## 6. GAME KIT DASHBOARD (`/game-kit`)

### Connectivity
| Entry Points | Exit Points |
|--------------|-------------|
| Nav: PLAY > Game Kit | `/game-kit/new` |
| `/join` "Create Your Own" link | `/game-kit/edit/[id]` |
| Direct URL | `/game-kit/builder` |
| | `/game-kit/play/[shareToken]` |
| | `/` (back to site) |

### Elements Present
- [x] Game list
- [x] Create new button
- [x] Edit/delete actions
- [x] Play/share links
- [x] Back to main site

### Heuristic Evaluation

| Heuristic | Rating | Notes |
|-----------|--------|-------|
| 1. System status | ✅ | Loading state shown |
| 2. Real world match | ✅ | Clear game terminology |
| 3. User control | ✅ | Can delete, edit, back button |
| 4. Consistency | ✅ | Consistent with game-kit pages |
| 5. Error prevention | ⚠️ | Delete has no confirmation |
| 6. Recognition | ✅ | Actions clearly visible |
| 7. Flexibility | ⚠️ | No search/filter for many games |
| 8. Minimalist design | ✅ | Clean layout |
| 9. Error handling | ⚠️ | Generic error messages |
| 10. Help/docs | 🚫 | No help/tutorial |

### Issues Found
1. **No delete confirmation**: Can accidentally delete games
2. **No onboarding**: New users don't know what Game Kit is
3. **No search/filter**: Will be problem with many games
4. **No help**: Users might not understand features

---

## 7. JOIN GAME (`/join`)

### Connectivity
| Entry Points | Exit Points |
|--------------|-------------|
| Direct URL (shared verbally) | `/room/[code]` (success) |
| QR code scan | `/game-kit` (Create link) |
| Nav: PLAY > Play Online? | Error state (stay on page) |

### Elements Present
- [x] 6-digit code input
- [x] Join button
- [x] Error display
- [x] Create your own CTA
- [x] Back button

### Heuristic Evaluation

| Heuristic | Rating | Notes |
|-----------|--------|-------|
| 1. System status | ✅ | Shows "Joining..." state |
| 2. Real world match | ✅ | "Room code" is clear |
| 3. User control | ✅ | Back button, can re-enter |
| 4. Consistency | ✅ | Matches game-kit style |
| 5. Error prevention | ✅ | Validates code format |
| 6. Recognition | ✅ | Auto-advance between inputs |
| 7. Flexibility | ✅ | Supports paste |
| 8. Minimalist design | ✅ | Focused single purpose |
| 9. Error handling | ✅ | Clear error messages |
| 10. Help/docs | ⚠️ | Subtitle helps but no FAQ |

### Issues Found
1. **Back button goes to /game-kit**: Should this go to homepage for non-creators?

---

## 8. PLAYER ROOM (`/room/[code]`)

### Connectivity
| Entry Points | Exit Points |
|--------------|-------------|
| `/join` (success) | `/join` (Leave button) |
| `/join/[token]` (invite link) | Game over state |
| Direct URL with code | |

### Elements Present
- [x] Name entry (join phase)
- [x] Lobby waiting state
- [x] Game playing state
- [x] Leave button
- [x] Error handling

### Heuristic Evaluation

| Heuristic | Rating | Notes |
|-----------|--------|-------|
| 1. System status | ✅ | Shows phase clearly |
| 2. Real world match | ✅ | Card game metaphors |
| 3. User control | ✅ | Can leave anytime |
| 4. Consistency | ✅ | Consistent styling |
| 5. Error prevention | ✅ | Validates name |
| 6. Recognition | ✅ | Cards visually clear |
| 7. Flexibility | ⚠️ | No rejoin if disconnected |
| 8. Minimalist design | ✅ | Focused on gameplay |
| 9. Error handling | ✅ | Shows connection errors |
| 10. Help/docs | 🚫 | No rules/help visible |

### Issues Found
1. **No rejoin**: Disconnected players can't rejoin
2. **No game rules**: Players don't know how to play
3. **No player list**: Can't see who else is playing

---

## 9. HOST SESSION (`/game-session/[code]`)

### Connectivity
| Entry Points | Exit Points |
|--------------|-------------|
| `/game-kit/play/[shareToken]` Start | `/game-kit` (Exit) |
| `/game-kit/builder` Test Game | Game over state |

### Elements Present
- [x] Room code display
- [x] QR code
- [x] Player list
- [x] Start game button
- [x] Exit button
- [x] IRL player management

---

## ORPHAN PAGES (No Clear Entry)

These pages exist but have unclear navigation paths:

| Page | Issue |
|------|-------|
| `/the-line` | Not in nav, not on homepage |
| `/about` | Duplicate of `/discover/about` |
| `/faq` | Duplicate of `/discover/faq` |
| `/games` | Duplicate of `/shop/games` |
| `/merch` | Duplicate of `/shop/merch` |
| `/play-online` | Unclear purpose vs Game Kit |
| `/afterroar` | Not prominently linked |

---

## DEAD ENDS (No Clear Exit)

Pages where users might get stuck:

| Page | Issue | Fix |
|------|-------|-----|
| `/order-confirmation` | After purchase, where next? | Add "Continue Shopping" / "Track Order" |
| `/terms` | Legal page, no CTA | Add "Back to Home" |
| `/privacy` | Legal page, no CTA | Add "Back to Home" |
| `/returns` | Policy page, no CTA | Add "Contact Support" |

---

## PRIORITY ISSUES

### P0 - Critical (Blocks Conversions)
1. Checkout flow (need to audit)
2. Cart abandonment points
3. Error handling in purchase flow

### P1 - High (Impacts Core Experience)
1. Game Kit discoverability
2. Orphan page consolidation
3. Dead end pages

### P2 - Medium (Polish)
1. Help/documentation
2. Onboarding flows
3. Loading states

### P3 - Low (Nice to Have)
1. Keyboard shortcuts
2. Advanced filtering
3. Search functionality

---

## 10. CONNECT HUB (`/connect`)

### Connectivity
| Entry Points | Exit Points |
|--------------|-------------|
| Nav: CONNECT | `/connect/forum` (Community Forum) |
| Direct URL | `/connect/contact` (Contact Us) |

### Elements Present
- [x] Navigation bar
- [x] Two primary option cards (Forum, Contact)
- [x] Social CTA section
- [x] Responsive grid layout
- [ ] Social media links (mentioned but not linked)

### Heuristic Evaluation

| Heuristic | Rating | Notes |
|-----------|--------|-------|
| 1. System status | N/A | Static page |
| 2. Real world match | ✅ | Clear language |
| 3. User control | ✅ | Two clear paths |
| 4. Consistency | ✅ | Brand consistent |
| 5. Error prevention | N/A | No inputs |
| 6. Recognition | ✅ | Cards with icons |
| 7. Flexibility | ✅ | Both paths visible |
| 8. Minimalist design | ✅ | Focused layout |
| 9. Error handling | N/A | No errors possible |
| 10. Help/docs | ⚠️ | No back to home CTA |

### Issues Found
1. **Social CTA incomplete**: "Follow the Chaos" section has no actual social links
2. **No back navigation**: Users can only use browser back or nav

---

## 11. FORUM (`/forum`, `/connect/forum`)

### Connectivity
| Entry Points | Exit Points |
|--------------|-------------|
| `/connect` Forum card | `/forum/new-thread` (New Thread) |
| Nav: CONNECT > Forum | `/forum/[board]` (Board) |
| Direct URL | `/forum/[board]/[thread]` (Thread) |

### Elements Present
- [x] Navigation bar
- [x] Forum categories/boards
- [x] Popular threads list
- [x] Recent threads list
- [x] Thread/post counts
- [x] New thread button
- [x] Loading state

### Heuristic Evaluation

| Heuristic | Rating | Notes |
|-----------|--------|-------|
| 1. System status | ✅ | Loading state, thread counts |
| 2. Real world match | ✅ | Familiar forum patterns |
| 3. User control | ✅ | Can navigate freely |
| 4. Consistency | ✅ | Consistent styling |
| 5. Error prevention | ✅ | Auth required for posting |
| 6. Recognition | ✅ | Icons, badges for pinned/locked |
| 7. Flexibility | ⚠️ | No search, no sorting |
| 8. Minimalist design | ✅ | Clean two-column layout |
| 9. Error handling | ⚠️ | Empty states exist |
| 10. Help/docs | 🚫 | No forum guidelines |

### Issues Found
1. **No search**: Can't search threads
2. **No forum guidelines**: No rules or etiquette posted
3. **Duplicate routes**: `/forum` and `/connect/forum` both work (re-export)
4. **Grid layout breaks on mobile**: Two-column may not stack well

---

## 12. CONTACT (`/contact`, `/connect/contact`)

### Connectivity
| Entry Points | Exit Points |
|--------------|-------------|
| `/connect` Contact card | Success state (stay on page) |
| Nav: CONNECT > Contact Us | Email links (external) |
| Footer: Contact | |
| Direct URL | |

### Elements Present
- [x] Navigation bar
- [x] Contact form with validation
- [x] CAPTCHA (Turnstile)
- [x] Subject dropdown
- [x] Auto-fill for logged-in users
- [x] Success state with ticket number
- [x] Multiple contact email addresses
- [x] Pro tips section

### Heuristic Evaluation

| Heuristic | Rating | Notes |
|-----------|--------|-------|
| 1. System status | ✅ | Submitting state, success message |
| 2. Real world match | ✅ | Familiar form patterns |
| 3. User control | ✅ | Can send another message |
| 4. Consistency | ✅ | Brand consistent |
| 5. Error prevention | ✅ | Required fields, CAPTCHA |
| 6. Recognition | ✅ | Clear labels, icons |
| 7. Flexibility | ✅ | Form + direct email options |
| 8. Minimalist design | ✅ | Well organized |
| 9. Error handling | ✅ | Error messages shown |
| 10. Help/docs | ✅ | Pro tips section |

### Issues Found
1. **Duplicate routes**: `/contact` and `/connect/contact` (re-export)
2. **No ticket tracking link**: User gets ticket number but no way to check status
3. **Grid layout assumes min 400px cards**: May break on small screens

---

## 13. DISCOVER HUB (`/discover`)

### Connectivity
| Entry Points | Exit Points |
|--------------|-------------|
| Nav: DISCOVER | `/discover/games` |
| Direct URL | `/discover/fugly` |
| | `/discover/about` |
| | `/discover/the-line` |
| | `/discover/faq` |
| | `/discover/afterroar` |

### Elements Present
- [x] Navigation bar
- [x] Six section cards with icons
- [x] Responsive grid layout

### Heuristic Evaluation

| Heuristic | Rating | Notes |
|-----------|--------|-------|
| 1. System status | N/A | Static page |
| 2. Real world match | ✅ | Clear section names |
| 3. User control | ✅ | Six clear paths |
| 4. Consistency | ✅ | Brand consistent |
| 5. Error prevention | N/A | No inputs |
| 6. Recognition | ✅ | Icons for each section |
| 7. Flexibility | ✅ | All options visible |
| 8. Minimalist design | ✅ | Clean grid |
| 9. Error handling | N/A | No errors possible |
| 10. Help/docs | ✅ | FAQ is linked |

### Issues Found
1. **Duplicate pages exist**: `/about` vs `/discover/about`, `/faq` vs `/discover/faq`
2. **No breadcrumbs**: Users can't see where they are in discover hierarchy

---

## 14. THE LINE (`/the-line`, `/discover/the-line`)

### Connectivity
| Entry Points | Exit Points |
|--------------|-------------|
| `/discover` The Line card | `/` (Back to Home link) |
| Direct URL | `/shop` (Browse Our Games CTA) |
| | `/privacy` (Footer link) |
| | `/terms` (Footer link) |
| | External crisis resources |

### Elements Present
- [x] Navigation bar
- [x] Back to Home link
- [x] Rich content sections
- [x] Crisis resource links
- [x] Shop CTA
- [x] Footer with legal links
- [x] Mobile responsive (checks isMobile)

### Heuristic Evaluation

| Heuristic | Rating | Notes |
|-----------|--------|-------|
| 1. System status | ✅ | Dynamic image loading |
| 2. Real world match | ✅ | Clear, human language |
| 3. User control | ✅ | Multiple exit points |
| 4. Consistency | ✅ | Brand consistent |
| 5. Error prevention | N/A | No inputs |
| 6. Recognition | ✅ | Well-organized sections |
| 7. Flexibility | ✅ | Multiple CTAs |
| 8. Minimalist design | ✅ | Clean content-focused design |
| 9. Error handling | ⚠️ | Silent fail on image load |
| 10. Help/docs | ✅ | Crisis resources included |

### Issues Found
1. **Not linked from main nav**: Only in discover dropdown
2. **Not on homepage**: Important brand content hidden
3. **Duplicate routes**: `/the-line` and `/discover/the-line`

---

## 15. LEGAL PAGES (`/terms`, `/privacy`, `/returns`)

### Connectivity
| Entry Points | Exit Points |
|--------------|-------------|
| Footer links | 🚫 None (dead end) |
| Checkout (terms) | Only navigation bar |
| Direct URL | |

### Elements Present (All Three)
- [x] Navigation bar
- [x] Policy content
- [x] Email contact links
- [ ] Back to home CTA
- [ ] Related page links

### Heuristic Evaluation

| Heuristic | Rating | Notes |
|-----------|--------|-------|
| 1. System status | N/A | Static pages |
| 2. Real world match | ✅ | Standard legal language |
| 3. User control | ❌ | No clear next action |
| 4. Consistency | ✅ | Consistent styling |
| 5. Error prevention | N/A | No inputs |
| 6. Recognition | ✅ | Sections well organized |
| 7. Flexibility | ❌ | Only nav to exit |
| 8. Minimalist design | ✅ | Focused on content |
| 9. Error handling | N/A | No errors possible |
| 10. Help/docs | ⚠️ | Contact emails only |

### Issues Found
1. **DEAD ENDS**: No CTAs, no "back to home", no related links
2. **No cross-linking**: Returns doesn't link to FAQ, Terms doesn't link to Privacy
3. **Footer missing**: Legal pages have no footer

---

## 16. ACCOUNT (`/account`)

### Connectivity
| Entry Points | Exit Points |
|--------------|-------------|
| Nav (signed in) | `/track-order` |
| `/sign-in` redirect | Order detail pages |
| Direct URL | Account settings |

### Elements Present
- [ ] Need to audit AccountView component

### Issues Found
1. **Needs deeper audit**: AccountView component not yet reviewed

---

# COMPREHENSIVE FIX LIST

## P0 - Critical (Fix Immediately)

| Issue | Pages Affected | Fix |
|-------|----------------|-----|
| Legacy route links | Shop, Cart, Homepage | Update all links to use `/shop/games/[slug]` |
| Dead end legal pages | Terms, Privacy, Returns | Add "Back to Home" button + related links |
| No delete confirmation | Game Kit | Add confirmation modal before delete |

## P1 - High (Fix This Week)

| Issue | Pages Affected | Fix |
|-------|----------------|-----|
| Orphan pages | The Line, About, FAQ | Either redirect duplicates or feature prominently |
| Forum mobile layout | Forum | Test and fix two-column grid on mobile |
| Social links missing | Connect Hub | Add actual social media links |
| Back navigation missing | Connect, Discover | Add breadcrumbs or back links |
| Cart "Browse Games" link | Cart | Change `/games` to `/shop` |

## P2 - Medium (Fix This Sprint)

| Issue | Pages Affected | Fix |
|-------|----------------|-----|
| No search | Shop, Forum | Add search functionality |
| No sort options | Shop | Add price/date/popularity sort |
| No forum guidelines | Forum | Add rules/etiquette page |
| Empty state messages | Shop, Forum | Add helpful messages when no results |
| Image load failures | The Line | Add fallback/error state for images |
| Contact grid mobile | Contact | Test min-400px assumption on mobile |
| Ticket tracking | Contact | Add link to view ticket status |

## P3 - Low (Backlog)

| Issue | Pages Affected | Fix |
|-------|----------------|-----|
| Game Kit onboarding | Game Kit | Add first-time user tutorial |
| Help/documentation | Multiple | Add help links throughout |
| Keyboard shortcuts | Game Kit, Forum | Add power user shortcuts |
| Undo for destructive actions | Cart, Game Kit | Add undo toast for removes |
| Express checkout | Checkout | Add Apple Pay, Google Pay |
| Shipping estimate in cart | Cart | Show estimated shipping cost |

---

## ROUTE CONSOLIDATION RECOMMENDATIONS

### Consolidate to Primary Routes
| Current | Primary | Action |
|---------|---------|--------|
| `/games/[slug]` | `/shop/games/[slug]` | 301 redirect |
| `/merch/[slug]` | `/shop/merch/[slug]` | 301 redirect |
| `/games` | `/shop?tab=games` | 301 redirect |
| `/merch` | `/shop?tab=merch` | 301 redirect |
| `/about` | `/discover/about` | Keep both (re-export OK) |
| `/faq` | `/discover/faq` | Keep both (re-export OK) |
| `/the-line` | `/the-line` | Feature on homepage, keep discover link |
| `/contact` | `/connect/contact` | Keep both (re-export OK) |
| `/forum` | `/connect/forum` | Keep both (re-export OK) |

### Internal Link Audit Needed
Search codebase for:
- `href="/games"` → change to `/shop?tab=games`
- `href="/merch"` → change to `/shop?tab=merch`
- `href="/games/${slug}"` → change to `/shop/games/${slug}`
- `href="/merch/${slug}"` → change to `/shop/merch/${slug}`

---

## NEXT STEPS

1. **Immediate**: Fix P0 issues (legacy routes, dead ends, delete confirmation)
2. **This Week**: Fix P1 issues (orphans, mobile, navigation)
3. **Ongoing**: Address P2/P3 as capacity allows
4. **Audit**: Deep dive on AccountView and checkout flow
