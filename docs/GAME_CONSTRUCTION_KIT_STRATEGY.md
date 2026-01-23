# Full Uproar Game Construction Kit
## Strategic Product Document

**Version:** 1.0
**Date:** January 2026
**Status:** Strategic Planning

---

## Executive Summary

The Full Uproar Game Construction Kit represents a significant opportunity to create a subscription-worthy platform that combines the accessibility of no-code game builders (Scratch, Roblox Studio) with the social engagement of party games (Jackbox, Cards Against Humanity) and the real-time multiplayer capabilities of digital tabletop platforms (Board Game Arena, Tabletop Simulator).

### The Opportunity

- The creator economy is valued at $250-480 billion and growing 26% annually
- Gaming UGC platforms have attracted $9 billion in investment since 2020
- Educational gaming tools (Kahoot, Gimkit, Blooket) have proven massive adoption in K-12
- Party games experienced explosive growth during COVID and remain strong for streaming

### Our Unique Position

Full Uproar already has:
1. An existing e-commerce platform with payment infrastructure (Stripe)
2. A block-based game builder foundation (`/game-kit/builder`)
3. Brand identity that resonates with the "anti-corporate" party game aesthetic
4. Community features (game nights, forums) that can drive organic growth

### Target Markets

**Primary:** Party game enthusiasts (18-35) who want Jackbox-like experiences but customizable
**Secondary:** Educators (K-12 teachers) seeking engaging, customizable classroom games
**Tertiary:** Streamers/content creators who need fresh interactive content

### Key Success Metrics (12-Month Targets)

| Metric | Target |
|--------|--------|
| Monthly Active Users (MAU) | 50,000 |
| Paid Subscribers | 2,500 (5% conversion) |
| Creator-Published Games | 500 |
| Monthly Revenue (MRR) | $25,000 |

---

## Part 1: Competitive Analysis & Key Insights

### 1.1 No-Code Platforms (Scratch, Roblox Studio)

#### What Makes Them Work

**Scratch (MIT)**
- 25% of all shared projects are remixes - remix culture drives engagement
- Creative Commons licensing makes all content remixable
- No accounts required for basic play - reduces friction
- Block-based coding eliminates syntax errors completely
- Progressive disclosure: simple surface, depth available when needed

**Roblox Studio**
- 12 million monthly creators, 2.7 million monetized at least once
- Mobile-first UX is critical - 70%+ of users on mobile
- Iteration speed matters more than visual quality
- Analytics dashboard helps creators understand what works
- Social/trend-driven content wins over technically impressive games

#### Actionable Insights for Game Kit

1. **Remix Everything**: Every published game should be remixable with one click
2. **Mobile-First Builder**: Current builder is desktop-focused - need mobile creation
3. **No Account Play**: Let players join games without creating accounts
4. **Block-Based Rules**: Our current builder has the right approach - expand it
5. **Creator Analytics**: Show plays, completion rates, popular cards

### 1.2 Digital Board Game Platforms

#### Platform Comparison

| Platform | Model | Rule Enforcement | Best For |
|----------|-------|------------------|----------|
| Board Game Arena | $42/year | Yes (automated) | Casual matchmaking |
| Tabletop Simulator | $20 one-time | No (sandbox) | Modding, flexibility |
| PlayingCards.io | Free | No | Simple card games |

#### Key Differentiators

**Board Game Arena (BGA)**
- Browser-native (no install required)
- Rules are enforced automatically
- Asynchronous/turn-based modes for different schedules
- Ranked play and matchmaking

**Tabletop Simulator (TTS)**
- Physics sandbox (dice roll realistically)
- Lua scripting for custom logic
- Steam Workshop for distribution
- Requires purchase from all players

**PlayingCards.io**
- Completely free
- Extremely limited (cards, dice, containers only)
- No zoom, minimal customization
- Good for prototyping

#### Where We Can Win

The gap: **No platform offers easy creation + automatic rule enforcement + social virality**

- BGA: Great to play, impossible for users to create games
- TTS: Flexible creation, but requires coding knowledge
- PlayingCards.io: Easy creation, but too limited

**Our opportunity: Scratch-level ease of creation with BGA-level polish in play**

### 1.3 Educational Gaming Platforms

#### The Kahoot Phenomenon

Kahoot's success factors:
- **Zero friction**: Students join with a code, no account needed
- **Gamified learning**: Competition + music + leaderboards
- **Teacher control**: Teachers run the show, students react
- **Compliance ready**: COPPA, FERPA, GDPR certified

#### Gimkit vs Blooket Comparison

| Feature | Gimkit | Blooket |
|---------|--------|---------|
| Free Tier | Very limited (5 kits) | Generous (most features) |
| Price | $59.88/year | $35.88/year |
| Best For | High school (strategy) | Elementary (collectibles) |
| Student Preference | 47.8% | 43.5% |
| Key Mechanic | In-game economy | Collectible "blooks" |

#### Compliance Requirements for Schools

**COPPA (Children's Online Privacy Protection Act)**
- Parental consent required for under-13 data collection
- 2025 update: Explicit opt-in consent required (no more opt-out default)
- Schools can provide consent on behalf of parents for educational use

**FERPA (Family Educational Rights and Privacy Act)**
- Platform must act as "school official" under school's control
- Cannot use student data for non-educational purposes
- Must have data deletion capabilities

**Key Implementation Requirements:**
1. No ads, no data selling
2. Anonymous participation option (nickname only)
3. Student Privacy Pledge certification
4. Formal written security program
5. Data export and deletion tools for admins

### 1.4 Viral Party Games

#### Jackbox Games Success Formula

**Phone as Controller**
- No app download required - just go to jackbox.tv
- Enter room code and play
- Works on any device with a browser

**Audience Mode** (Critical for Streaming)
- Up to 10,000 spectators can participate
- Spectators vote on outcomes, affecting gameplay
- Creates engagement for streamers' viewers

**Streaming Features**
- Profanity filters for family streams
- Password-protected games
- Room code hiding options
- Twitch login verification

#### Cards Against Humanity Marketing Lessons

**Anti-Marketing Marketing**
- No traditional ads - purely word-of-mouth
- Outrageous stunts generate earned media
- Self-deprecating humor builds authenticity
- Built-in obsolescence (expansion packs) drives revenue

**Viral Mechanics**
- Large group play exposes game to new people
- Easy to explain, hard to master
- Social sharing is natural ("you won't believe this card combo")
- User-generated content extends replayability

#### Among Us Success Factors

- Simple roles, deep social dynamics
- Crossplay everywhere (mobile, PC, console)
- Streaming-friendly (viewers can speculate)
- Free-to-play with cosmetic monetization

### 1.5 Monetization Models

#### Freemium Conversion Benchmarks

| Model Type | Avg Conversion | Top Performers |
|------------|----------------|----------------|
| Freemium (self-serve) | 3-5% | 6-8% |
| Freemium (sales-assisted) | 5-7% | 10-15% |
| Free Trial (opt-out) | 48.8% | 60%+ |
| Free Trial (opt-in) | 18.2% | 25-30% |

#### Key Freemium Principles

1. **80/20 Rule**: Provide 80% of functionality free, reserve 20% high-value features
2. **Usage Limits**: Restrict games/month, not core features
3. **Reverse Trials**: Let free users experience premium temporarily
4. **Community Premium**: Higher conversion when community exists (37% better retention)

#### Creator Economy Monetization

- Brand partnerships: 70% of creator income
- Platform revenue share: Varies widely (30-70% platform cut common)
- Subscriptions fastest-growing segment
- Direct fan payments gaining traction (Patreon model)

---

## Part 2: Feature Recommendations

### MVP (0-3 Months) - "Party Mode First"

Focus: Get games playable and shareable as fast as possible.

#### Core Features

**P0 - Must Have for Launch**

| Feature | Description | Why It Matters |
|---------|-------------|----------------|
| **Room Code Join** | 4-6 character codes like Jackbox | Zero-friction player joining |
| **Real-time Multiplayer** | See other players' actions live | Core experience requirement |
| **Phone Controller** | Play on phone, display on TV/stream | Streaming/party essential |
| **5 Starter Templates** | CAH, Trivia, Uno, Poker, Custom | Quick starts for new users |
| **Anonymous Play** | Nickname-only for players | COPPA-friendly, low friction |
| **Share Link** | One-click sharing to social | Viral distribution |

**P1 - Important for Retention**

| Feature | Description | Why It Matters |
|---------|-------------|----------------|
| **Card Editor** | Visual card creation | Creator empowerment |
| **Rule Blocks** | Drag-drop game logic | No-code rule creation |
| **Game Preview** | Test without publishing | Quality assurance |
| **Basic Analytics** | Play count, completion rate | Creator feedback |
| **Remix Button** | Fork any published game | Growth flywheel |

**Current Builder Assessment**

Based on code review, the existing `/game-kit/builder` has:
- Block-based structure (rounds, turns, phases)
- Card type definitions with properties
- Zone management (deck, hand, discard)
- Resource tracking (score, health, etc.)
- Component presets for quick setup

**Gaps to Fill for MVP:**
1. No real-time multiplayer engine
2. No phone-as-controller interface
3. No room code system
4. Limited rule execution (mostly definition, not runtime)

### Phase 2 (3-6 Months) - "Creator Economy"

#### Creator Features

| Feature | Description | Business Impact |
|---------|-------------|-----------------|
| **Creator Profiles** | Public profile with games | Social proof, discovery |
| **Play Metrics** | Detailed analytics dashboard | Retain creators |
| **Featured Games** | Staff picks showcase | Quality curation |
| **Remix Trees** | See remix history | Attribution, discovery |
| **Creator Revenue** | Tip jar / premium games | Creator monetization |

#### Community Features

| Feature | Description | Business Impact |
|---------|-------------|-----------------|
| **Game Comments** | Feedback on games | Engagement, improvement |
| **Collections** | Curated game lists | Discovery |
| **Following** | Follow favorite creators | Notification loops |
| **Leaderboards** | High scores, achievements | Competition, retention |

#### Educational Features

| Feature | Description | Business Impact |
|---------|-------------|-----------------|
| **Classroom Mode** | Teacher dashboard | School sales |
| **Student Rostering** | Import from Google Classroom | Reduce teacher friction |
| **Progress Reports** | Individual student analytics | Learning validation |
| **Content Moderation** | Safe mode for schools | Compliance requirement |

### Future (6-12 Months) - "Platform Scale"

#### Advanced Creator Tools

- **AI Card Generator**: Generate cards from prompts
- **Image AI**: Generate card art
- **Import/Export**: Bring cards from spreadsheets
- **Version Control**: Track game changes over time
- **Collaboration**: Multi-creator editing

#### Advanced Gameplay

- **Tournament Mode**: Brackets, elimination rounds
- **Spectator Mode**: 1000+ viewers can watch
- **Streaming Integration**: Twitch/YouTube overlays
- **Voice Chat**: Built-in communication
- **Custom Avatars**: Personalization

#### Platform Features

- **API Access**: Developers can build integrations
- **White Label**: Schools/companies brand their instance
- **Mobile App**: Native iOS/Android
- **Offline Mode**: Play without internet
- **Mod Marketplace**: Buy/sell game mods

---

## Part 3: Pricing Strategy

### Tier Structure

#### Free Tier - "Party Starter"

**Price:** $0

**Includes:**
- Create up to 3 games
- Host games with up to 8 players
- Access to 5 starter templates
- Basic card editor
- Share links (with Full Uproar branding)
- Play unlimited games created by others

**Limits:**
- Games auto-archive after 30 days of inactivity
- "Powered by Full Uproar" watermark on game screens
- No custom branding
- Limited to 50 plays per game per month

#### Pro Tier - "Game Master"

**Price:** $9/month or $79/year (save 27%)

**Includes everything in Free, plus:**
- Unlimited games
- Up to 16 players per game
- All premium templates
- Remove "Powered by" branding
- Custom game URLs (yourgame.fulluproar.com)
- Priority matchmaking
- Advanced analytics
- Export game data
- Remix any game with attribution
- Email support

**Perfect for:** Regular hosts, streamers, game designers

#### Classroom Tier - "Educator"

**Price:** $49/year per teacher (volume discounts available)

**Includes everything in Pro, plus:**
- Student roster import (Google Classroom, Clever)
- Progress tracking per student
- Safe mode (content filtering)
- Parent reports
- No student accounts required
- COPPA/FERPA compliance documentation
- Data export and deletion tools
- School admin dashboard
- Purchase order support

**Volume Pricing:**
- 1-10 teachers: $49/year each
- 11-50 teachers: $39/year each
- 51+ teachers: $29/year each
- District-wide: Contact for pricing

#### Creator Tier - "Studio"

**Price:** $29/month or $249/year (save 28%)

**Includes everything in Pro, plus:**
- Monetize your games (tip jar, premium games)
- 70% revenue share on tips
- Featured placement eligibility
- Creator badge and profile
- API access
- Collaboration tools
- Priority feature requests
- White-glove onboarding
- Direct Slack support

### Pricing Rationale

**Why $9/month for Pro?**
- Below Gimkit ($59.88/year = ~$5/month) psychological barrier
- Above Blooket Plus ($35.88/year = ~$3/month) to position as premium
- Netflix/Spotify-comparable impulse purchase
- Annual discount encourages commitment

**Why $49/year for Educators?**
- Below Gimkit Pro ($59.88) to win head-to-head
- Comparable to other classroom tools
- Purchase order friendly (under typical approval threshold)
- Volume discounts enable district deals

**Why $29/month for Creators?**
- Comparable to Liveblocks Pro ($29/month)
- High enough to filter serious creators
- Low enough to not require business case
- 70% revenue share competitive with Roblox

### Revenue Projections (Conservative)

| Month | Free Users | Pro | Educator | Creator | MRR |
|-------|------------|-----|----------|---------|-----|
| 3 | 5,000 | 100 | 20 | 5 | $1,200 |
| 6 | 15,000 | 400 | 100 | 20 | $4,750 |
| 9 | 30,000 | 1,000 | 300 | 50 | $12,700 |
| 12 | 50,000 | 2,000 | 500 | 100 | $25,400 |

Assumptions:
- 4% Pro conversion (industry avg 3-5%)
- Educator driven by direct outreach + word-of-mouth
- Creator tier grows with platform success

---

## Part 4: Technical Architecture

### Real-Time Multiplayer Requirements

| Requirement | Target |
|-------------|--------|
| Latency | <200ms for actions |
| Concurrent connections per room | 1,000 (spectators) |
| Total concurrent users | 10,000 initial, 100,000 scale |
| Reconnection handling | Automatic with state recovery |
| Cross-platform | Web, mobile web, future native |

### Recommended Architecture

#### Option 1: PartyKit (Recommended for MVP)

**Why PartyKit:**
- Acquired by Cloudflare (stable, scaling solved)
- Built for exactly this use case (multiplayer rooms)
- WebSocket connections with automatic scaling
- Edge deployment (low latency globally)
- Integrates cleanly with Next.js
- Free tier generous for development

**Architecture:**
```
[Client Browser]
    ↓ WebSocket
[PartyKit Room] ← State Management
    ↓
[Next.js API] ← Game Logic, Auth, DB
    ↓
[PostgreSQL] ← Persistence
```

**Cost Estimate:**
- Development: Free tier
- Launch (10K MAU): ~$50-100/month
- Scale (100K MAU): ~$500-1000/month

#### Option 2: Liveblocks

**Why Consider:**
- More structured for collaborative features
- Built-in presence (who's online)
- Better conflict resolution
- React hooks ready

**Pricing:**
- Free: 500 monthly active rooms
- Pro: $29/month + $0.02/MAU above 1,000
- "First day free" billing (good for viral spikes)

**Cost Estimate:**
- 10K MAU: ~$200/month
- 100K MAU: ~$2,000/month

**Verdict: PartyKit for cost efficiency, Liveblocks if collaboration features needed**

#### Option 3: Self-Hosted (Future Scale)

If costs become prohibitive at scale:
- Redis Pub/Sub for message routing
- Kubernetes for auto-scaling
- Cloudflare Workers for edge logic

**Cost at 100K MAU:** $500-2000/month (highly variable)
**Complexity:** High - requires DevOps expertise

### Recommended Tech Stack

```
Frontend:
├── Next.js 15 (existing)
├── React 19 (existing)
├── Zustand (state management - existing)
└── PartyKit Client (real-time)

Backend:
├── Next.js API Routes (existing)
├── PartyKit Server (rooms, WebSocket)
├── Prisma + PostgreSQL (existing)
└── Clerk (auth - existing)

Infrastructure:
├── Vercel (hosting - existing)
├── PartyKit (real-time - new)
├── Vercel Blob (images - existing)
└── Stripe (payments - existing)
```

### Database Schema Additions

```prisma
// Game Definition (extends existing)
model GameDefinition {
  id          String   @id @default(cuid())
  // ... existing fields

  // New fields
  isRemixOf   String?  // Parent game ID
  remixCount  Int      @default(0)
  featuredAt  DateTime?

  // Relations
  parent      GameDefinition?  @relation("Remixes", fields: [isRemixOf], references: [id])
  remixes     GameDefinition[] @relation("Remixes")
  sessions    GameSession[]
}

// Live Game Session
model GameSession {
  id            String   @id @default(cuid())
  roomCode      String   @unique
  gameId        String
  hostId        String?
  status        SessionStatus @default(WAITING)
  playerCount   Int      @default(0)
  spectatorCount Int     @default(0)
  startedAt     DateTime?
  endedAt       DateTime?
  createdAt     DateTime @default(now())

  game          GameDefinition @relation(fields: [gameId], references: [id])
  players       SessionPlayer[]
}

model SessionPlayer {
  id          String   @id @default(cuid())
  sessionId   String
  clerkId     String?  // Null for anonymous players
  nickname    String
  isHost      Boolean  @default(false)
  isSpectator Boolean  @default(false)
  joinedAt    DateTime @default(now())

  session     GameSession @relation(fields: [sessionId], references: [id])
}

enum SessionStatus {
  WAITING
  IN_PROGRESS
  PAUSED
  COMPLETED
  ABANDONED
}
```

### API Endpoints (New)

```
POST   /api/game-kit/sessions        - Create room, get code
GET    /api/game-kit/sessions/:code  - Get room info
POST   /api/game-kit/sessions/:code/join - Join as player
DELETE /api/game-kit/sessions/:code  - End session (host only)

WebSocket (PartyKit):
/party/:roomCode - Real-time game events
```

---

## Part 5: Go-To-Market Strategy

### Phase 1: Party Gamers (Months 1-3)

#### Target Audience
- Age 18-35
- Hosts regular game nights
- Active on Discord, Reddit, TikTok
- Plays Jackbox, CAH, Codenames

#### Launch Channels

**Reddit (Organic)**
- r/boardgames (4.5M members)
- r/tabletop (180K members)
- r/partygames (25K members)
- r/jackboxgames (45K members)

**Strategy:** Create genuinely useful CAH/Jackbox alternatives, share for free, earn organic upvotes

**Discord (Community Building)**
- Create Full Uproar Discord server
- Partner with existing game night Discord servers
- Beta access for Discord members

**TikTok/YouTube Shorts (Viral Content)**
- "We made a game where..." short-form content
- Gameplay highlights from beta testers
- Creator spotlights

**Twitch (Influencer Seeding)**
- Identify variety streamers (10K-100K followers)
- Offer free Creator tier for 6 months
- Provide streaming kit (overlays, alerts)

#### Launch Promotion

**"Cards Against Full Uproar" Event**
- Community-submitted cards
- Best cards become official pack
- Winner gets lifetime Pro + merch

**Streamer Tournament**
- Invite 16 streamers to compete
- Create custom tournament bracket game
- Prize pool from first month's revenue

### Phase 2: Educators (Months 4-6)

#### Target Audience
- K-12 teachers (especially 3rd-12th grade)
- Tech-forward, uses Kahoot/Gimkit already
- Active on Teachers Pay Teachers, Pinterest
- Looking for engagement tools

#### Sales Channels

**Direct Outreach**
- LinkedIn to curriculum directors
- Email to tech integration specialists
- Booth at ISTE, FETC conferences

**Teacher Ambassadors**
- Free Creator tier for influential teachers
- Commission on school referrals
- Feature their games on platform

**Content Marketing**
- "50 Classroom Games You Can Build in 5 Minutes"
- "How One Teacher Increased Test Scores 23% with Custom Games"
- SEO for "Kahoot alternative" and "classroom game maker"

#### School Sales Process

Based on research, K-12 procurement takes 6+ months. Strategy:

1. **Teacher Trial** (Month 1-2)
   - Free Educator tier for 60 days
   - No approval needed for free tools

2. **Classroom Success** (Month 2-3)
   - Document student engagement
   - Gather testimonials

3. **Department Buy** (Month 3-4)
   - Teacher advocates to principal
   - Small purchase order ($200-500)

4. **School/District Scale** (Month 6+)
   - Success metrics shared
   - Formal RFP response
   - Volume discount negotiation

#### Compliance Checklist

Before education launch:
- [ ] COPPA compliance audit
- [ ] FERPA documentation
- [ ] Student Privacy Pledge signature
- [ ] SOC 2 Type 1 (or roadmap)
- [ ] Data Processing Agreement template
- [ ] Clever/ClassLink integration

### Phase 3: Creator Economy (Months 7-12)

#### Target Audience
- Game designers (amateur to professional)
- Content creators seeking original games
- Tabletop game publishers for digital versions
- Event companies for custom experiences

#### Growth Strategies

**Creator Residency Program**
- Select 10 creators quarterly
- $1,000 stipend + free Creator tier
- Featured placement for their games
- Builds catalog of quality games

**Publisher Partnerships**
- Approach small tabletop publishers
- Offer digital version creation
- Revenue share on plays
- Cross-promotion to physical game buyers

**Corporate/Event Market**
- Custom games for team building
- Conference icebreakers
- Wedding/party entertainment
- White-label for agencies

### Marketing Budget Allocation

**Monthly Budget: $5,000 (initial)**

| Channel | Allocation | Expected Result |
|---------|------------|-----------------|
| Content Creation | 30% ($1,500) | 4 videos/month, SEO |
| Influencer/Streamer | 30% ($1,500) | 5 micro-influencers |
| Community/Events | 20% ($1,000) | Discord, tournaments |
| Paid Ads (Test) | 15% ($750) | Reddit, TikTok tests |
| Tools/Software | 5% ($250) | Analytics, email |

**Scale at $25K MRR:** Increase to $10K/month, add education conference attendance

---

## Part 6: Success Metrics & Milestones

### Key Performance Indicators

#### User Metrics
| Metric | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| MAU | 5,000 | 15,000 | 50,000 |
| DAU/MAU Ratio | 15% | 20% | 25% |
| Games Created | 200 | 1,000 | 5,000 |
| Games Published | 50 | 300 | 1,500 |
| Avg Session Length | 15 min | 20 min | 25 min |

#### Revenue Metrics
| Metric | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| MRR | $1,200 | $4,750 | $25,400 |
| Paying Customers | 125 | 520 | 2,600 |
| ARPU | $9.60 | $9.13 | $9.77 |
| Churn Rate | 15% | 10% | 7% |

#### Engagement Metrics
| Metric | Target |
|--------|--------|
| Game Completion Rate | >70% |
| 7-Day Retention | >20% |
| 30-Day Retention | >10% |
| Viral Coefficient | >1.0 |
| NPS Score | >50 |

### Milestones

#### Month 1-3: MVP Launch
- [ ] Real-time multiplayer working
- [ ] Room code join system
- [ ] 5 starter templates
- [ ] Phone controller interface
- [ ] Basic sharing
- [ ] 1,000 beta users

#### Month 4-6: Creator Tools
- [ ] Advanced card editor
- [ ] Remix functionality
- [ ] Creator profiles
- [ ] Analytics dashboard
- [ ] Education pilot (5 schools)
- [ ] 500 paid users

#### Month 7-9: Scale
- [ ] Spectator mode (1,000+)
- [ ] Streaming integrations
- [ ] API access
- [ ] Mobile improvements
- [ ] 20 school customers

#### Month 10-12: Platform
- [ ] Creator monetization live
- [ ] Featured games curation
- [ ] Advanced compliance (SOC 2)
- [ ] White-label option
- [ ] 50K MAU, $25K MRR

---

## Part 7: Risk Analysis

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Real-time scaling issues | Medium | High | Start with PartyKit (proven infra) |
| Mobile performance | High | Medium | PWA first, native later |
| Cheating/exploits | Medium | Medium | Server-authoritative game logic |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low creator adoption | Medium | High | Seed with own games, creator residency |
| School sales cycle too long | High | Medium | Focus on teacher bottoms-up |
| Jackbox/BGA enters market | Low | High | Move fast, build community |
| Compliance failure | Low | High | Third-party audit before edu launch |

### Competitive Response

**If Jackbox launches a creator tool:**
- Double down on remix/community (their IP prevents remixing)
- Emphasize free tier (they'll likely be premium-only)
- Focus on education (not their market)

**If Board Game Arena adds creation:**
- Emphasize ease of use (their games are complex)
- Focus on party games (their audience is different)
- Leverage our streaming features

---

## Part 8: Immediate Next Steps

### Week 1-2: Architecture
1. Spike on PartyKit integration
2. Design room code system
3. Plan database schema changes
4. Estimate MVP development time

### Week 3-4: MVP Planning
1. Define MVP feature set (cut ruthlessly)
2. Create wireframes for phone controller
3. Design 5 starter templates
4. Plan beta user recruitment

### Week 5-8: MVP Development
1. Build real-time game engine
2. Implement room codes and joining
3. Create phone controller UI
4. Port existing builder to new engine

### Week 9-10: Beta Launch
1. Recruit 100 beta users (Discord, Reddit)
2. Run weekly playtests
3. Gather feedback and iterate
4. Fix critical bugs

### Week 11-12: Public Launch
1. ProductHunt launch
2. Reddit announcement posts
3. Streamer seeding begins
4. Monitor and respond to feedback

---

## Appendix A: Competitor Feature Matrix

| Feature | Full Uproar | Jackbox | BGA | TTS | PlayingCards.io |
|---------|-------------|---------|-----|-----|-----------------|
| Browser-based | Yes | Yes | Yes | No | Yes |
| No download | Yes | Yes | Yes | No | Yes |
| User-created games | Yes | No | No | Yes | Limited |
| Rule enforcement | Yes | Yes | Yes | No | No |
| Real-time multiplayer | Yes | Yes | Yes | Yes | Yes |
| Spectator mode | Yes | Yes | Yes | Yes | No |
| Education features | Yes | No | No | No | No |
| Remix/fork games | Yes | No | No | Yes | No |
| Mobile creation | Yes | No | No | No | Yes |
| Free tier | Yes | No | Limited | No | Yes |
| Creator monetization | Yes | No | No | No | No |

## Appendix B: Technology Comparison

### Real-Time Platforms

| Platform | Pricing | Best For | Complexity |
|----------|---------|----------|------------|
| PartyKit | Usage-based (~$0.001/connection-hour) | Rooms, games | Low |
| Liveblocks | $29/mo + $0.02/MAU | Collaboration | Medium |
| Pusher | $49/mo for 500 connections | Simple pub/sub | Low |
| Ably | Pay-as-you-go | High reliability | Medium |
| PubNub | $98/mo | Enterprise | High |
| Self-hosted | $500-2000/mo | Full control | Very High |

### Recommendation: PartyKit

- Best cost at our scale
- Purpose-built for multiplayer
- Cloudflare backing ensures reliability
- Clean Next.js integration

## Appendix C: Pricing Research Summary

### Comparable Products

| Product | Free Tier | Paid Tier | Notes |
|---------|-----------|-----------|-------|
| Kahoot | Limited | $9.99/mo | Per-user for business |
| Gimkit | Very limited | $59.88/yr | Teacher-focused |
| Blooket | Generous | $35.88/yr | Best free tier |
| Canva | Generous | $12.99/mo | Freemium model |
| Figma | Generous | $15/mo | Editor pricing |
| Board Game Arena | Most games | $42/yr | Recent price increase |

### Our Positioning

- **vs Gimkit/Blooket**: More flexible (create any game), comparable price
- **vs Jackbox**: User creation, free to play, lower total cost
- **vs BGA**: Create your own games, party-focused

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2026 | Strategy Team | Initial document |

---

*This document is confidential and intended for Full Uproar internal use.*
