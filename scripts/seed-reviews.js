const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fake review data templates
const reviewTemplates = {
  positive5: [
    {
      title: "Best game night purchase EVER!",
      comment: "This game absolutely transformed our game nights! My friends and I can't stop playing it. The chaos, the laughter, the unexpected twists - it's everything you want in a party game. Already planning to buy more for gifts!",
    },
    {
      title: "Pure chaotic fun",
      comment: "If you want a game that'll have everyone laughing until they cry, this is it. The rules are easy to learn but the gameplay is wildly unpredictable. We've played it 20+ times and it never gets old.",
    },
    {
      title: "Instant classic at our house",
      comment: "We have a massive board game collection and this immediately jumped to the top of the rotation. It's the perfect mix of strategy and chaos. Even our friends who don't usually like board games are obsessed.",
    },
    {
      title: "Worth every penny!",
      comment: "The production quality is amazing and the gameplay is even better. It's become our go-to for parties, family gatherings, and honestly just random Tuesday nights. Can't recommend it enough!",
    },
    {
      title: "My family is OBSESSED",
      comment: "We bought this for a family game night and now it's all anyone wants to play. The kids love it, the adults love it, even grandma got into it! It's become a weekly tradition at our house.",
    },
    {
      title: "Finally, a game everyone agrees on!",
      comment: "Getting my gaming group to agree on anything is impossible, but everyone loves this game. The perfect balance of skill and luck means anyone can win, which keeps it exciting every time.",
    },
  ],
  positive4: [
    {
      title: "Great game, minor learning curve",
      comment: "Really fun game that brings a lot of energy to game night. It took us a couple rounds to fully get the rules down, but once we did, it was nonstop entertainment. Highly recommend for groups who like a bit of chaos.",
    },
    {
      title: "Solid addition to our collection",
      comment: "We've had some really memorable moments with this game. The mechanics are clever and it scales well with different group sizes. My only minor complaint is setup time, but it's worth it.",
    },
    {
      title: "Fun for the whole crew",
      comment: "Played this at our last game night and everyone had a blast. The artwork is great, the components feel premium, and the gameplay is engaging. Would buy from Full Uproar again!",
    },
    {
      title: "Exceeded expectations",
      comment: "I was skeptical at first but this game really delivers. It's the kind of game where you're still talking about what happened days later. Great for creating those memorable gaming moments.",
    },
    {
      title: "Perfect party game",
      comment: "Brought this to a party and it was an instant hit. Easy to teach, quick to play, and generates tons of laughs. The only reason it's not 5 stars is we want more expansion content!",
    },
  ],
  neutral3: [
    {
      title: "Good but not for everyone",
      comment: "It's a well-made game with interesting mechanics. That said, it's definitely better with the right group - people who embrace the chaos and don't take things too seriously. Might not be ideal for hardcore strategy fans.",
    },
    {
      title: "Decent party game",
      comment: "We've played it a handful of times and it's fun enough. The chaos factor is high which some in our group love and others find frustrating. Know your audience before buying.",
    },
    {
      title: "Mixed feelings",
      comment: "The concept is great and when it clicks, it really clicks. But it requires the right mood and the right group. We've had amazing sessions and also some that fell flat. Your experience may vary.",
    },
  ],
  critical2: [
    {
      title: "Not quite what I expected",
      comment: "The concept is cool but the execution didn't click for our group. Games tend to drag on a bit and the chaos can feel random rather than strategic. Your mileage may vary depending on your gaming preferences.",
    },
    {
      title: "Too random for our taste",
      comment: "We're more strategy-focused gamers and this was too luck-based for us. If you like that style it might work, but it wasn't our cup of tea. The components are nice at least.",
    },
  ],
};

const fakeUserNames = [
  "ChaosKing_2024",
  "BoardGameSarah",
  "GameNightGreg",
  "TableTopTim",
  "DiceRollDiana",
  "PartyGamePete",
  "MeeplesMelissa",
  "CardSharkCarlos",
  "StrategySteve",
  "FunTimeFiona",
  "GameMasterMike",
  "RollWithRachel",
  "VictoryVince",
  "PlayfulPenny",
  "EpicEric",
  "TabletopTasha",
  "BoardGameBen",
  "GameGeekGina",
  "DiceDropDave",
  "ChaosCrafter",
  "MeepleMonarch",
  "CardCounterCathy",
  "RuleBookRick",
  "WinningWendy",
  "LuckyLuke",
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(daysBack) {
  const date = new Date();
  date.setDate(date.getDate() - getRandomInt(1, daysBack));
  return date;
}

async function seedReviewsForGame(gameId, count) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    console.log(`Game ${gameId} not found`);
    return;
  }

  console.log(`\nSeeding ${count} reviews for: ${game.title}`);

  // Clear existing test reviews
  const deleted = await prisma.review.deleteMany({
    where: {
      gameId,
      isTest: true,
    },
  });
  console.log(`  Cleared ${deleted.count} existing test reviews`);

  const usedUserNames = new Set();
  const reviews = [];

  for (let i = 0; i < count; i++) {
    // Weighted random rating distribution (more positive reviews)
    const ratingRoll = Math.random();
    let rating;
    let templates;

    if (ratingRoll < 0.40) {
      rating = 5;
      templates = reviewTemplates.positive5;
    } else if (ratingRoll < 0.70) {
      rating = 4;
      templates = reviewTemplates.positive4;
    } else if (ratingRoll < 0.88) {
      rating = 3;
      templates = reviewTemplates.neutral3;
    } else {
      rating = 2;
      templates = reviewTemplates.critical2;
    }

    const template = getRandomElement(templates);

    // Get unique username
    let userName = getRandomElement(fakeUserNames);
    let attempts = 0;
    while (usedUserNames.has(userName) && attempts < 50) {
      userName = getRandomElement(fakeUserNames);
      attempts++;
    }
    if (usedUserNames.has(userName)) {
      userName = `${userName}_${i}`;
    }
    usedUserNames.add(userName);

    // Random verified purchase (55% chance)
    const verified = Math.random() < 0.55;

    // Random helpful/unhelpful votes
    const helpful = getRandomInt(0, 30);
    const unhelpful = getRandomInt(0, Math.floor(helpful / 4));

    const review = await prisma.review.create({
      data: {
        gameId,
        userId: `test_user_${gameId}_${i}_${Date.now()}`,
        userName,
        rating,
        title: template.title,
        comment: template.comment,
        verified,
        purchaseDate: verified ? getRandomDate(90) : null,
        verifiedAt: verified ? getRandomDate(60) : null,
        status: 'approved',
        helpful,
        unhelpful,
        isTest: true,
        createdAt: getRandomDate(180),
      },
    });

    reviews.push(review);
  }

  // Add official responses to top helpful reviews
  const topReviews = reviews
    .sort((a, b) => b.helpful - a.helpful)
    .slice(0, 2);

  const responses = [
    "Thanks for the awesome review! We're thrilled you're enjoying the chaos. Game on! 🎲",
    "We love hearing stories like this! Thanks for spreading the chaos with your friends and family. 💥",
    "Thank you for the thoughtful feedback! We're always working to improve and appreciate you taking the time to share your experience.",
  ];

  for (const review of topReviews) {
    if (review.rating >= 4) {
      await prisma.review.update({
        where: { id: review.id },
        data: {
          responseText: getRandomElement(responses),
          responseBy: 'Full Uproar Team',
          responseAt: new Date(),
        },
      });
    }
  }

  console.log(`  Created ${reviews.length} reviews (avg rating: ${(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)})`);
}

async function main() {
  console.log('🎲 Seeding test reviews...\n');

  // Get all games except test products
  const games = await prisma.game.findMany({
    where: {
      slug: {
        not: 'test-product-hidden'
      }
    },
    select: { id: true, title: true }
  });

  for (const game of games) {
    // Seed different amounts based on game
    const reviewCount = getRandomInt(8, 15);
    await seedReviewsForGame(game.id, reviewCount);
  }

  console.log('\n✅ Done seeding reviews!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
