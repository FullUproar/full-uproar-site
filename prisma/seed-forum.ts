/**
 * Forum Seed Script
 * Creates fake users, categories, boards, threads, and posts for testing
 * Run with: npx ts-node prisma/seed-forum.ts
 */

import { PrismaClient, BoardAccessLevel } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================================================
// FAKE USERS
// =============================================================================
const fakeUsers = [
  // Trust Level 4 - Leaders
  { username: 'ChaosMaster_Dave', displayName: 'Dave the Destroyer', trustLevel: 4, email: 'dave@fake.test' },
  { username: 'BoardFlipperSarah', displayName: 'Sarah Tableflip', trustLevel: 4, email: 'sarah@fake.test' },

  // Trust Level 3 - Regulars
  { username: 'DiceGoblin42', displayName: 'Goblin Greg', trustLevel: 3, email: 'greg@fake.test' },
  { username: 'StrategyQueen', displayName: 'Queen Beatrix', trustLevel: 3, email: 'beatrix@fake.test' },
  { username: 'CardShark_Mike', displayName: 'Mike the Card', trustLevel: 3, email: 'mike@fake.test' },

  // Trust Level 2 - Members
  { username: 'RulesLawyer2024', displayName: 'Actually Adrian', trustLevel: 2, email: 'adrian@fake.test' },
  { username: 'CasualChaosCarl', displayName: 'Carl Chaos', trustLevel: 2, email: 'carl@fake.test' },
  { username: 'TabletopTina', displayName: 'Tina Tables', trustLevel: 2, email: 'tina@fake.test' },
  { username: 'MeepleCollector', displayName: 'Meeple Max', trustLevel: 2, email: 'max@fake.test' },

  // Trust Level 1 - Basic
  { username: 'NewToGaming_Jay', displayName: 'Jay Newbie', trustLevel: 1, email: 'jay@fake.test' },
  { username: 'FuglyFanatic', displayName: 'Fanatic Fran', trustLevel: 1, email: 'fran@fake.test' },
  { username: 'BoardGameBen', displayName: 'Ben Board', trustLevel: 1, email: 'ben@fake.test' },
  { username: 'GameNightGina', displayName: 'Gina Nights', trustLevel: 1, email: 'gina@fake.test' },
  { username: 'DeckBuilder_Derek', displayName: 'Derek Decks', trustLevel: 1, email: 'derek@fake.test' },

  // Trust Level 0 - New
  { username: 'JustJoinedJim', displayName: 'Jim Fresh', trustLevel: 0, email: 'jim@fake.test' },
  { username: 'LurkingLisa', displayName: 'Lisa Lurker', trustLevel: 0, email: 'lisa@fake.test' },
  { username: 'QuietQuentin', displayName: 'Quentin Quiet', trustLevel: 0, email: 'quentin@fake.test' },

  // Special - Moderation testing
  { username: 'TrollTommy', displayName: 'Tommy Trouble', trustLevel: 1, email: 'tommy@fake.test', forumBanned: true, forumBannedReason: 'Repeated trolling and harassment' },
  { username: 'SpammerStan', displayName: 'Stan Spam', trustLevel: 0, email: 'stan@fake.test', isMuted: true, mutedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
];

// =============================================================================
// CATEGORIES
// =============================================================================
const categories = [
  {
    name: 'Full Uproar Official',
    slug: 'official',
    description: 'News, announcements, and official discussions from the Full Uproar team',
    icon: '📢',
    sortOrder: 1,
  },
  {
    name: 'Game Talk',
    slug: 'games',
    description: 'Discuss our games, strategies, house rules, and everything gameplay',
    icon: '🎲',
    sortOrder: 2,
  },
  {
    name: 'Community Chaos',
    slug: 'community',
    description: 'General discussions, introductions, and off-topic mayhem',
    icon: '💬',
    sortOrder: 3,
  },
  {
    name: 'Creative Corner',
    slug: 'creative',
    description: 'Fan art, custom content, game mods, and creative projects',
    icon: '🎨',
    sortOrder: 4,
  },
  {
    name: 'Support & Feedback',
    slug: 'support',
    description: 'Get help, report issues, and share suggestions',
    icon: '❓',
    sortOrder: 5,
  },
];

// =============================================================================
// BOARDS
// =============================================================================
const boards = [
  // Official Category
  { categorySlug: 'official', name: 'News & Announcements', slug: 'news', icon: '📰', accessLevel: 'PUBLIC', sortOrder: 1 },
  { categorySlug: 'official', name: 'Dev Blog', slug: 'dev-blog', icon: '💻', accessLevel: 'PUBLIC', sortOrder: 2 },
  { categorySlug: 'official', name: 'Insider Chat', slug: 'insider', icon: '🔒', accessLevel: 'SUBSCRIBERS_ONLY', sortOrder: 3 },

  // Game Talk Category
  { categorySlug: 'games', name: 'Strategy & Tips', slug: 'strategy', icon: '🧠', accessLevel: 'PUBLIC', sortOrder: 1 },
  { categorySlug: 'games', name: 'House Rules', slug: 'house-rules', icon: '📋', accessLevel: 'MEMBERS_ONLY', sortOrder: 2 },
  { categorySlug: 'games', name: 'Game Night Stories', slug: 'stories', icon: '📖', accessLevel: 'MEMBERS_ONLY', sortOrder: 3 },

  // Community Category
  { categorySlug: 'community', name: 'Introductions', slug: 'introductions', icon: '👋', accessLevel: 'PUBLIC', sortOrder: 1 },
  { categorySlug: 'community', name: 'Off-Topic Chaos', slug: 'off-topic', icon: '🌀', accessLevel: 'MEMBERS_ONLY', sortOrder: 2 },

  // Creative Category
  { categorySlug: 'creative', name: 'Fan Art', slug: 'fan-art', icon: '🖼️', accessLevel: 'PUBLIC', sortOrder: 1 },
  { categorySlug: 'creative', name: 'Custom Cards & Mods', slug: 'mods', icon: '⚙️', accessLevel: 'MEMBERS_ONLY', sortOrder: 2 },

  // Support Category
  { categorySlug: 'support', name: 'Help & Questions', slug: 'help', icon: '🆘', accessLevel: 'PUBLIC', sortOrder: 1 },
  { categorySlug: 'support', name: 'Feedback & Suggestions', slug: 'feedback', icon: '💡', accessLevel: 'MEMBERS_ONLY', sortOrder: 2 },
];

// =============================================================================
// THREADS AND POSTS - Sample Content
// =============================================================================
const sampleThreads = [
  // News & Announcements
  {
    boardSlug: 'news',
    title: 'Welcome to the New Community Forum!',
    isPinned: true,
    posts: [
      { author: 'ChaosMaster_Dave', content: `Hey everyone! 🎉

Welcome to the brand new Full Uproar Community Forum! We've been working hard to create a space where you can connect with fellow chaos agents, share strategies, and generally cause mayhem together.

**What you'll find here:**
- Official news and announcements
- Strategy discussions for all our games
- A place to share your game night stories
- Creative content from the community
- Support and feedback channels

Please take a moment to read the forum rules (they're mostly "don't be a jerk" but written more formally).

Let's make this the best gaming community on the internet!

*- Dave the Destroyer*` },
      { author: 'DiceGoblin42', content: `Finally! Been waiting for this. The Discord was getting too chaotic even for me 😂` },
      { author: 'TabletopTina', content: `This looks amazing! Love the dark theme. Very on-brand.` },
      { author: 'StrategyQueen', content: `Already planning to write up some strategy guides. Where should I post those?` },
      { author: 'ChaosMaster_Dave', content: `@StrategyQueen The "Strategy & Tips" board is perfect for that! Can't wait to see what you come up with.` },
    ],
  },
  {
    boardSlug: 'news',
    title: 'Hack Your Deck Expansion Pack - Coming Soon!',
    isPinned: false,
    posts: [
      { author: 'BoardFlipperSarah', content: `We've been keeping this under wraps, but it's time to spill the beans...

**Hack Your Deck: Chaos Protocol** is coming!

50 new cards that will completely change how you approach the game. We're talking:
- New mechanic: "Glitch Cards" that change rules mid-game
- 15 new action cards
- 10 new defense cards
- 25 new attack cards with wild effects

Beta testing starts next month. Stay tuned for how to sign up!` },
      { author: 'CardShark_Mike', content: `GLITCH CARDS?! My wallet is already crying.` },
      { author: 'NewToGaming_Jay', content: `I just bought the base game last week! Should I wait or...?` },
      { author: 'BoardFlipperSarah', content: `@NewToGaming_Jay Don't wait! The base game is amazing on its own, and the expansion will just add more options. Plus, experienced players will have an advantage in tournaments 😉` },
    ],
  },

  // Strategy & Tips
  {
    boardSlug: 'strategy',
    title: 'The Ultimate Chaos Cards Tier List (2026 Edition)',
    isPinned: true,
    posts: [
      { author: 'StrategyQueen', content: `After 200+ games and countless game nights, I've finally compiled my definitive tier list for Chaos Cards.

**S-TIER (Game Changers)**
- The Reversal: Changes the entire board state
- Chaos Multiplier: When timed right, it's an instant win
- The Silent Treatment: Underrated but devastating

**A-TIER (Consistently Strong)**
- Double Down: Great value, always useful
- Pocket Chaos: Flexible timing is key
- The Betrayal: Friendship ender, but effective

**B-TIER (Solid Picks)**
- Wild Card: Decent but predictable
- The Setup: Requires planning but pays off

**C-TIER (Situational)**
- Lucky Break: Too random
- The Gambit: High risk, sometimes no reward

Thoughts? Disagree? Let me know!` },
      { author: 'CardShark_Mike', content: `Hard disagree on The Gambit being C-tier. In aggressive metas, it's easily A-tier. The psychological pressure alone...` },
      { author: 'RulesLawyer2024', content: `Actually, if you look at the official tournament stats from the last quarter, The Gambit has a 34% win rate when played in the first three rounds, but 67% when held until the final round. Context matters!` },
      { author: 'StrategyQueen', content: `@RulesLawyer2024 Fair point about the timing. I was considering average performance, but you're right that skilled players can elevate certain cards.` },
      { author: 'DiceGoblin42', content: `I refuse to believe The Silent Treatment is S-tier. I've literally never won with that card.` },
      { author: 'StrategyQueen', content: `@DiceGoblin42 It's all about timing! Use it when someone's about to play their big combo. The look on their face is worth the win alone.` },
    ],
  },
  {
    boardSlug: 'strategy',
    title: 'Beginner Tips - What I Wish I Knew Starting Out',
    isPinned: false,
    posts: [
      { author: 'TabletopTina', content: `For all the new players joining us, here are some tips that would have saved me many losses:

1. **Don't play all your cards at once** - Patience wins games
2. **Watch other players' discard piles** - It tells you what they DON'T have
3. **The "boring" cards are often the best** - Consistency > flashy plays
4. **Alliances are temporary** - Never fully trust anyone
5. **Learn when to fold** - Sometimes taking a small loss prevents a big one

What tips would you add?` },
      { author: 'JustJoinedJim', content: `This is exactly what I needed! I've been throwing everything out immediately and wondering why I keep losing 😅` },
      { author: 'MeepleCollector', content: `Adding: Read ALL the cards before your first game. Some have interactions that aren't obvious.` },
    ],
  },

  // House Rules
  {
    boardSlug: 'house-rules',
    title: 'Our Table Rule: The Chaos Multiplier',
    isPinned: false,
    posts: [
      { author: 'CasualChaosCarl', content: `We play with a house rule where every third round, all card effects are DOUBLED.

It sounds broken, and honestly it kind of is, but it makes for the most memorable moments. Last week someone played a Reversal during a multiplier round and completely flipped a 4-player game.

Anyone else play with this? Any balance suggestions?` },
      { author: 'GameNightGina', content: `We tried this last night and it was WILD. The third round had everyone sweating. I think we might make it random (roll a die at round start) to keep people on their toes.` },
      { author: 'DiceGoblin42', content: `Adding a "mulligan token" that resets if unused might balance it. So you can survive ONE multiplied attack but then you're vulnerable.` },
    ],
  },

  // Game Night Stories
  {
    boardSlug: 'stories',
    title: 'The Game Night That Nearly Ended a Marriage',
    isPinned: false,
    posts: [
      { author: 'BoardGameBen', content: `Okay so this happened last month and I'm finally ready to talk about it.

Playing Dumbest Ways to Win with my wife, her sister, and brother-in-law. Standard family game night, right?

Wrong.

My wife and I had an alliance. We'd been crushing it. Final round, I have the win locked... and she BETRAYS me. Not just a small betrayal - she'd been planning it for THREE ROUNDS.

The silence in the room. The look in her eyes. The smug satisfaction.

I slept on the couch that night. By choice. I needed time to process.

We're fine now. But I'll never trust her in a board game again.` },
      { author: 'TabletopTina', content: `This is EXACTLY why I don't play competitive games with my partner anymore 😂 Cooperative games only in this household.` },
      { author: 'FuglyFanatic', content: `Your wife is a LEGEND. Please tell her the community respects her game.` },
      { author: 'BoardGameBen', content: `@FuglyFanatic I showed her this comment. She's framing it.` },
    ],
  },

  // Introductions
  {
    boardSlug: 'introductions',
    title: 'New here! Introducing myself',
    isPinned: false,
    posts: [
      { author: 'JustJoinedJim', content: `Hey everyone! I'm Jim, been playing board games for about 6 months now. A friend introduced me to Dumbest Ways to Win at a party and I was instantly hooked.

Looking forward to learning from you all and maybe finding some people to play with online!` },
      { author: 'ChaosMaster_Dave', content: `Welcome Jim! Great to have you here. The community's pretty friendly (mostly). Don't be afraid to ask questions!` },
      { author: 'GameNightGina', content: `Welcome! If you're looking for online games, check the Game Nights section - there are regular sessions!` },
    ],
  },
  {
    boardSlug: 'introductions',
    title: 'Longtime lurker, finally making an account',
    isPinned: false,
    posts: [
      { author: 'LurkingLisa', content: `I've been reading the forums for months but never posted. Finally decided to join!

I'm a teacher who uses board games to teach critical thinking. Full Uproar games have been amazing for this - the kids love the chaos but they're actually learning probability and strategy!` },
      { author: 'StrategyQueen', content: `A teacher using our games for education? That's incredibly cool! Would love to hear more about how you structure that.` },
      { author: 'BoardFlipperSarah', content: `This is amazing! We'd love to feature you in a blog post if you're interested. DM me!` },
    ],
  },

  // Fan Art
  {
    boardSlug: 'fan-art',
    title: 'Drew the Chaos Goblin character - thoughts?',
    isPinned: false,
    posts: [
      { author: 'DiceGoblin42', content: `Spent way too many hours on this but I'm pretty happy with how the Chaos Goblin turned out.

[IMAGINE: A detailed fan art of a mischievous goblin character surrounded by scattered dice and cards]

Tried to capture that chaotic energy the games give off. Let me know what you think!` },
      { author: 'TabletopTina', content: `THIS IS INCREDIBLE! The detail on the dice is insane. How long did this take?` },
      { author: 'DiceGoblin42', content: `@TabletopTina About 15 hours over a week. The dice reflections nearly broke me 😅` },
      { author: 'BoardFlipperSarah', content: `This is amazing! Mind if we share this on our official social media (with credit of course)?` },
      { author: 'DiceGoblin42', content: `@BoardFlipperSarah YES! That would be amazing!` },
    ],
  },

  // Help & Questions
  {
    boardSlug: 'help',
    title: 'Question about card interaction',
    isPinned: false,
    posts: [
      { author: 'QuietQuentin', content: `If I play "The Reversal" while someone has "Shield Up" active, does the reversal affect the shield or does the shield block it?

We had a 20 minute argument about this last game night and ended up flipping a coin.` },
      { author: 'RulesLawyer2024', content: `According to the official FAQ (page 12), "The Reversal" affects game state, not individual players. "Shield Up" only blocks direct attacks on a player. So yes, The Reversal goes through!

The key is the word "attack" - Reversal isn't classified as an attack, it's a state change.` },
      { author: 'QuietQuentin', content: `Thank you! This settles it. I owe my friend a drink because I was wrong 😅` },
      { author: 'StrategyQueen', content: `This is actually a common confusion! I might add a section about card classifications to my strategy guide.` },
    ],
  },
  {
    boardSlug: 'help',
    title: 'Shipping question - International orders',
    isPinned: false,
    posts: [
      { author: 'MeepleCollector', content: `Trying to order from Canada and the shipping seems really high. Is this normal? Any tips for international customers?` },
      { author: 'ChaosMaster_Dave', content: `Unfortunately international shipping costs are set by carriers and we pass them through at cost. We're working on finding better solutions!

In the meantime, if you can wait, we sometimes run free shipping promotions on orders over $75.` },
    ],
  },

  // Feedback & Suggestions
  {
    boardSlug: 'feedback',
    title: 'Suggestion: Tournament Mode',
    isPinned: false,
    posts: [
      { author: 'CardShark_Mike', content: `Would love to see an official tournament mode with:
- Standardized rules
- Ranked matchmaking
- Seasonal rewards
- Leaderboards

I know it's a big ask but the competitive community is growing and we need structure!` },
      { author: 'StrategyQueen', content: `+1 to this! Even just official tournament rules would be huge. Right now every local tournament has different rules.` },
      { author: 'BoardFlipperSarah', content: `This is actually something we're exploring! No promises on timeline but competitive play is definitely on our radar. Keep the feedback coming!` },
    ],
  },
];

// =============================================================================
// SEED FUNCTION
// =============================================================================
async function main() {
  console.log('🌱 Starting forum seed...\n');

  // Create fake users
  console.log('Creating fake users...');
  const userMap: Record<string, string> = {};

  for (const userData of fakeUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existing) {
      userMap[userData.username] = existing.id;
      console.log(`  ⏭️  User ${userData.username} already exists`);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        clerkId: `fake_${userData.username}_${Date.now()}`,
        email: userData.email,
        username: userData.username,
        displayName: userData.displayName,
        trustLevel: userData.trustLevel,
        forumBanned: userData.forumBanned || false,
        forumBannedReason: userData.forumBannedReason || null,
        isMuted: userData.isMuted || false,
        mutedUntil: userData.mutedUntil || null,
      },
    });
    userMap[userData.username] = user.id;
    console.log(`  ✅ Created user: ${userData.username}`);
  }

  // Create categories
  console.log('\nCreating categories...');
  const categoryMap: Record<string, number> = {};

  for (const categoryData of categories) {
    const existing = await prisma.boardCategory.findUnique({
      where: { slug: categoryData.slug },
    });

    if (existing) {
      categoryMap[categoryData.slug] = existing.id;
      console.log(`  ⏭️  Category ${categoryData.name} already exists`);
      continue;
    }

    const category = await prisma.boardCategory.create({
      data: categoryData,
    });
    categoryMap[categoryData.slug] = category.id;
    console.log(`  ✅ Created category: ${categoryData.name}`);
  }

  // Create boards
  console.log('\nCreating boards...');
  const boardMap: Record<string, number> = {};

  for (const boardData of boards) {
    const existing = await prisma.messageBoard.findUnique({
      where: { slug: boardData.slug },
    });

    if (existing) {
      boardMap[boardData.slug] = existing.id;
      console.log(`  ⏭️  Board ${boardData.name} already exists`);
      continue;
    }

    const categoryId = categoryMap[boardData.categorySlug];
    const board = await prisma.messageBoard.create({
      data: {
        categoryId,
        name: boardData.name,
        slug: boardData.slug,
        icon: boardData.icon,
        accessLevel: boardData.accessLevel as BoardAccessLevel,
        sortOrder: boardData.sortOrder,
      },
    });
    boardMap[boardData.slug] = board.id;
    console.log(`  ✅ Created board: ${boardData.name} (${boardData.accessLevel})`);
  }

  // Create threads and posts
  console.log('\nCreating threads and posts...');

  for (const threadData of sampleThreads) {
    const boardId = boardMap[threadData.boardSlug];
    if (!boardId) {
      console.log(`  ⚠️  Board not found: ${threadData.boardSlug}`);
      continue;
    }

    // Generate slug from title
    const slug = threadData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);

    // Check if thread exists
    const existing = await prisma.messageThread.findFirst({
      where: { boardId, slug },
    });

    if (existing) {
      console.log(`  ⏭️  Thread "${threadData.title.slice(0, 40)}..." already exists`);
      continue;
    }

    // Get author ID for first post
    const firstPostAuthor = threadData.posts[0].author;
    const authorId = userMap[firstPostAuthor];
    if (!authorId) {
      console.log(`  ⚠️  Author not found: ${firstPostAuthor}`);
      continue;
    }

    // Create thread
    const thread = await prisma.messageThread.create({
      data: {
        boardId,
        title: threadData.title,
        slug,
        authorId,
        isPinned: threadData.isPinned || false,
        lastPostAt: new Date(),
      },
    });

    console.log(`  ✅ Created thread: "${threadData.title.slice(0, 40)}..."`);

    // Create posts
    for (let i = 0; i < threadData.posts.length; i++) {
      const postData = threadData.posts[i];
      const postAuthorId = userMap[postData.author];

      if (!postAuthorId) {
        console.log(`    ⚠️  Post author not found: ${postData.author}`);
        continue;
      }

      // Add some time offset for post ordering
      const postDate = new Date(Date.now() - (threadData.posts.length - i) * 3600000);

      await prisma.messagePost.create({
        data: {
          threadId: thread.id,
          authorId: postAuthorId,
          content: postData.content,
          createdAt: postDate,
        },
      });
    }
    console.log(`    📝 Created ${threadData.posts.length} posts`);

    // Update thread's lastPostAt
    await prisma.messageThread.update({
      where: { id: thread.id },
      data: { lastPostAt: new Date() },
    });
  }

  console.log('\n✨ Forum seed complete!');

  // Print summary
  const userCount = await prisma.user.count({ where: { email: { contains: '@fake.test' } } });
  const categoryCount = await prisma.boardCategory.count();
  const boardCount = await prisma.messageBoard.count();
  const threadCount = await prisma.messageThread.count();
  const postCount = await prisma.messagePost.count();

  console.log(`
📊 Summary:
  - ${userCount} fake users
  - ${categoryCount} categories
  - ${boardCount} boards
  - ${threadCount} threads
  - ${postCount} posts
`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
