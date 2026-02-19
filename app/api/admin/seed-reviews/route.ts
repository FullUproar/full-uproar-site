import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth as getSession } from '@/lib/auth-config';

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
  ],
  critical2: [
    {
      title: "Not quite what I expected",
      comment: "The concept is cool but the execution didn't click for our group. Games tend to drag on a bit and the chaos can feel random rather than strategic. Your mileage may vary depending on your gaming preferences.",
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
];

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(daysBack: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - getRandomInt(1, daysBack));
  return date;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you may want to add proper admin check here)
    const body = await request.json();
    const { gameId, count = 10, clearExisting = false } = body;

    if (!gameId) {
      // Get all games to seed reviews for
      const games = await prisma.game.findMany({
        select: { id: true, title: true },
      });
      return NextResponse.json({
        message: 'Please specify a gameId',
        availableGames: games,
      });
    }

    // Verify game exists
    const game = await prisma.game.findUnique({
      where: { id: parseInt(gameId) },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Clear existing test reviews if requested
    if (clearExisting) {
      await prisma.review.deleteMany({
        where: {
          gameId: parseInt(gameId),
          isTest: true,
        },
      });
    }

    // Generate fake reviews
    const reviews = [];
    const usedUserNames = new Set<string>();

    for (let i = 0; i < count; i++) {
      // Weighted random rating distribution (more positive reviews)
      const ratingRoll = Math.random();
      let rating: number;
      let templates: { title: string; comment: string }[];

      if (ratingRoll < 0.45) {
        rating = 5;
        templates = reviewTemplates.positive5;
      } else if (ratingRoll < 0.75) {
        rating = 4;
        templates = reviewTemplates.positive4;
      } else if (ratingRoll < 0.90) {
        rating = 3;
        templates = reviewTemplates.neutral3;
      } else {
        rating = 2;
        templates = reviewTemplates.critical2;
      }

      const template = getRandomElement(templates);

      // Get unique username
      let userName = getRandomElement(fakeUserNames);
      while (usedUserNames.has(userName) && usedUserNames.size < fakeUserNames.length) {
        userName = getRandomElement(fakeUserNames);
      }
      usedUserNames.add(userName);

      // Random verified purchase (60% chance)
      const verified = Math.random() < 0.6;

      // Random helpful/unhelpful votes
      const helpful = getRandomInt(0, 25);
      const unhelpful = getRandomInt(0, Math.floor(helpful / 3));

      const review = await prisma.review.create({
        data: {
          gameId: parseInt(gameId),
          userId: `test_user_${i}_${Date.now()}`,
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
          createdAt: getRandomDate(120),
        },
      });

      reviews.push(review);
    }

    // Add one with an official response
    if (reviews.length > 0) {
      const reviewToRespond = reviews[getRandomInt(0, Math.min(2, reviews.length - 1))];
      await prisma.review.update({
        where: { id: reviewToRespond.id },
        data: {
          responseText: "Thanks for the awesome review! We're thrilled you're enjoying the chaos. Game on! \u{1F3B2}",
          responseBy: 'Full Uproar Team',
          responseAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Created ${reviews.length} test reviews for ${game.title}`,
      reviewIds: reviews.map(r => r.id),
    });
  } catch (error) {
    console.error('Error seeding reviews:', error);
    return NextResponse.json(
      { error: 'Failed to seed reviews' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clear test reviews
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const gameId = searchParams.get('gameId');

    const where = {
      isTest: true,
      ...(gameId ? { gameId: parseInt(gameId) } : {}),
    };

    const deleted = await prisma.review.deleteMany({ where });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.count} test reviews`,
    });
  } catch (error) {
    console.error('Error deleting test reviews:', error);
    return NextResponse.json(
      { error: 'Failed to delete test reviews' },
      { status: 500 }
    );
  }
}
