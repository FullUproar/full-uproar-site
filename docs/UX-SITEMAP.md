# Full Uproar Site Map & UX Flow Analysis

## Site Structure Overview

### Public Marketing Pages
| Route | Purpose | Entry Points |
|-------|---------|--------------|
| `/` | Homepage - main landing | Direct, ads, social |
| `/about` | Company info | Footer, nav |
| `/the-line` | The Line product page | Nav, homepage |
| `/fugly` | Fugly brand page | Nav, homepage |
| `/afterroar` | Afterroar section | Nav |
| `/faq` | FAQ page | Footer, support |
| `/privacy` | Privacy policy | Footer |
| `/terms` | Terms of service | Footer, checkout |
| `/returns` | Return policy | Footer, order emails |
| `/contact` | Contact page | Footer, support |

### Discovery/Content Pages
| Route | Purpose |
|-------|---------|
| `/discover` | Content hub landing |
| `/discover/about` | About (discovery version) |
| `/discover/the-line` | The Line discovery |
| `/discover/fugly` | Fugly discovery |
| `/discover/afterroar` | Afterroar discovery |
| `/discover/faq` | FAQ (discovery version) |
| `/discover/games` | Games catalog |
| `/discover/games/[series]` | Game series page |
| `/discover/games/[series]/[slug]` | Individual game |
| `/discover/games/[series]/[slug]/how-to-play` | How to play |

### E-Commerce (Shop)
| Route | Purpose |
|-------|---------|
| `/shop` | Shop landing |
| `/shop/games` | Games catalog |
| `/shop/games/[slug]` | Game product page |
| `/shop/merch` | Merchandise catalog |
| `/shop/specials` | Special offers |
| `/cart` | Shopping cart |
| `/checkout` | Checkout flow |
| `/order-confirmation` | Order success |
| `/track-order` | Order tracking |

### Legacy/Alternate Shop Routes
| Route | Purpose | Status |
|-------|---------|--------|
| `/games` | Old games listing | Redirect? |
| `/games/[slug]` | Old game page | Redirect? |
| `/games/fugly-mayhem-machine` | FMM series | Active? |
| `/merch` | Old merch listing | Redirect? |
| `/merch/[slug]` | Old merch page | Redirect? |

### Account & Auth
| Route | Purpose |
|-------|---------|
| `/sign-in` | Sign in (Clerk) |
| `/sign-up` | Sign up (Clerk) |
| `/sso-callback` | OAuth callback |
| `/account` | Account dashboard |
| `/profile` | User profile |

### Community Features
| Route | Purpose |
|-------|---------|
| `/connect` | Community hub |
| `/connect/contact` | Contact form |
| `/connect/forum` | Forum link |
| `/forum` | Forum home |
| `/forum/[board]` | Forum board |
| `/forum/[board]/[thread]` | Thread view |
| `/forum/new-thread` | Create thread |

### Game Nights (Events)
| Route | Purpose |
|-------|---------|
| `/game-nights` | Events listing |
| `/game-nights/[id]` | Event detail |
| `/game-nights/play-online` | Online play hub |
| `/game-nights/play-online/[room]` | Game room |

### Play Online (Legacy?)
| Route | Purpose |
|-------|---------|
| `/play/[slug]` | Play a game |
| `/play-online` | Online play hub |
| `/play-online/[room]` | Game room |

### Game Kit (Creator Tools)
| Route | Purpose |
|-------|---------|
| `/game-kit` | Dashboard - my games |
| `/game-kit/new` | Create new game |
| `/game-kit/builder` | Visual game builder |
| `/game-kit/edit/[id]` | Card editor |
| `/game-kit/play/[shareToken]` | Play preview |
| `/game-session/[code]` | Host view |
| `/room/[code]` | Player view |
| `/join` | Join by code |
| `/join/[token]` | Join by invite link |

### Landing Pages (Campaigns)
| Route | Purpose |
|-------|---------|
| `/landing/chaos-unleashed` | Campaign landing |
| `/landing/game-night-fugly` | Campaign landing |

### Support
| Route | Purpose |
|-------|---------|
| `/support/ticket/[token]` | View support ticket |

### Admin (Internal)
| Route | Purpose |
|-------|---------|
| `/admin` | Admin dashboard |
| `/admin/orders` | Order management |
| `/admin/orders/[id]` | Order detail |
| `/admin/games` | Game management |
| `/admin/games/[id]/edit` | Edit game |
| `/admin/users` | User management |
| `/admin/returns` | Returns management |
| `/admin/support` | Support tickets |
| `/admin/fulfillment` | Fulfillment |
| `/admin/moderation` | Content moderation |
| `/admin/redirects` | URL redirects |
| `/admin/site-issues` | Site issues |
| `/admin/migrations` | Data migrations |
| `/admin/design-components` | Design system |
| `/admin/figma` | Figma integration |
| `/admin/webhook-test` | Webhook testing |
| `/admin/manage-images/[type]/[id]` | Image management |
| `/admin/dashboard` | Analytics dashboard |

---

## Major User Flows

### Flow 1: Browse & Purchase Game
```
Homepage → Shop/Games → Game Detail → Add to Cart → Cart → Checkout → Confirmation
    │
    └── Or: Homepage → The Line → Shop Page → ...
```

**Pages involved:**
1. `/` - Entry
2. `/shop/games` - Browse
3. `/shop/games/[slug]` - Product detail
4. `/cart` - Review cart
5. `/checkout` - Payment
6. `/order-confirmation` - Success

**Key UX questions:**
- [ ] Is navigation to shop clear from homepage?
- [ ] Can users easily find specific games?
- [ ] Is add-to-cart feedback clear?
- [ ] Is checkout flow streamlined?
- [ ] Are error states handled well?

### Flow 2: Create Custom Game (Game Kit)
```
Homepage → Game Kit → New Game → Choose Template → Edit Cards → Play/Share
                                        │
                                        └── Or: Builder (advanced)
```

**Pages involved:**
1. `/game-kit` - Dashboard
2. `/game-kit/new` - Template selection
3. `/game-kit/edit/[id]` - Card editing
4. `/game-kit/play/[shareToken]` - Preview/share
5. `/game-session/[code]` - Host game

**Key UX questions:**
- [ ] Is Game Kit discoverable from homepage?
- [ ] Is template selection intuitive?
- [ ] Is card editing efficient?
- [ ] Is sharing/playing clear?

### Flow 3: Join & Play Game
```
Receive Code/Link → Join Page → Enter Name → Lobby → Play
```

**Pages involved:**
1. `/join` or `/join/[token]` - Entry
2. `/room/[code]` - Player experience

**Key UX questions:**
- [ ] Is code entry easy (especially mobile)?
- [ ] Is lobby state clear?
- [ ] Is gameplay intuitive?
- [ ] Are connection errors handled?

### Flow 4: Account Management
```
Sign Up → Account Dashboard → View Orders → Track Order
                    │
                    └── Profile Settings
```

**Pages involved:**
1. `/sign-up` - Registration
2. `/account` - Dashboard
3. `/profile` - Settings
4. `/track-order` - Order tracking

**Key UX questions:**
- [ ] Is sign-up frictionless?
- [ ] Is account info accessible?
- [ ] Can users easily track orders?

### Flow 5: Get Support
```
Issue → FAQ → Contact/Support → Ticket → Resolution
```

**Pages involved:**
1. `/faq` - Self-service
2. `/contact` or `/connect/contact` - Contact form
3. `/support/ticket/[token]` - Ticket view

**Key UX questions:**
- [ ] Is FAQ helpful?
- [ ] Is contact form accessible?
- [ ] Is ticket status clear?

### Flow 6: Community Engagement
```
Homepage → Connect → Forum → Browse/Post → Engage
                │
                └── Game Nights → RSVP → Play
```

**Pages involved:**
1. `/connect` - Hub
2. `/forum` - Discussion
3. `/game-nights` - Events
4. `/game-nights/[id]` - Event RSVP

**Key UX questions:**
- [ ] Is community discoverable?
- [ ] Is forum functional?
- [ ] Are game nights easy to join?

---

## Identified Issues & Duplications

### Route Duplication
1. **Shop vs Legacy routes:**
   - `/shop/games` vs `/games`
   - `/shop/merch` vs `/merch`
   - Should consolidate with redirects

2. **Discovery vs Direct:**
   - `/about` vs `/discover/about`
   - `/faq` vs `/discover/faq`
   - `/the-line` vs `/discover/the-line`

3. **Play systems:**
   - `/play-online` vs `/game-nights/play-online`
   - `/game-kit` system vs older play system

### Navigation Questions
1. Where does Game Kit appear in main nav?
2. Is /discover a separate experience or integrated?
3. How do users get to community features?

---

## UX Evaluation Checklist

### Global Elements
- [ ] Navigation clarity
- [ ] Mobile responsiveness
- [ ] Loading states
- [ ] Error handling
- [ ] Accessibility (focus, ARIA)
- [ ] Brand consistency

### Per-Flow Evaluation
- [ ] Entry point discoverability
- [ ] Progress indication
- [ ] Back navigation
- [ ] Error recovery
- [ ] Success confirmation
- [ ] Mobile experience

---

## Current Navigation Structure

```
SHOP ─────────────┬── All Games (/shop/games)
                  ├── Specials (/shop/specials)
                  └── Merch (/shop/merch)

DISCOVER ─────────┬── Games (/discover/games)
                  ├── Fugly (/discover/fugly)
                  ├── About Us (/discover/about)
                  ├── The Line (/discover/the-line)
                  ├── FAQ (/discover/faq)
                  └── What is Afterroar? (/discover/afterroar)

CONNECT ──────────┬── Forum (/connect/forum)
                  └── Contact Us (/connect/contact)

PLAY ─────────────┬── My Game Nights (/game-nights)
                  ├── Play Online (/play-online)
                  └── ✨ Game Kit (/game-kit)
```

## Homepage CTAs & Entry Points

1. **Hero Section** → /shop (primary CTA)
2. **Games Carousel** → /games/[slug] (individual game pages)
3. **Choose Your Weapon** section:
   - Games panel → /shop
   - Mods panel → product links
   - Game Night panel → /game-nights
4. **Footer** links to all major sections

**Missing from Homepage:**
- No direct link to Game Kit (only in nav dropdown)
- No link to /the-line product page

---

## Next Steps

1. **Audit each major flow** - Walk through as a user
2. **Identify dead ends** - Pages with no clear next action
3. **Check mobile UX** - Test on actual devices
4. **Consolidate duplicates** - Set up redirects
5. **Document findings** - Create issues for each problem
