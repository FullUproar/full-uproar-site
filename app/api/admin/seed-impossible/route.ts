import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Check if we already have products
    const existing = await prisma.impossibleMerch.count();
    if (existing > 1) {
      return NextResponse.json({ message: 'Products already exist', count: existing });
    }

    const products = await prisma.impossibleMerch.createMany({
      data: [
        {
          title: "Fugly Battle Tank",
          slug: "fugly-battle-tank",
          tagline: "For When Monopoly Gets Too Intense",
          description: "Finally, a solution for those heated game nights! This fully operational M1A2 Abrams tank features custom Fugly orange paint job, dice-shaped turret, and a cannon that fires foam game pieces at 200mph.",
          impossiblePrice: "$2.3 Million (financing available)",
          category: "Vehicles",
          warning: "Not street legal in most dimensions",
          features: "• 1500 horsepower turbine engine\n• Cup holders for 6\n• Built-in game table (stable at 60mph)\n• Intimidation bonus: +10\n• Parking: Your problem",
          legalDisclaimer: "Full Uproar Games is not liable for: property damage, international incidents, or your HOA complaints. Tank does not include ammunition, fuel, or forgiveness from your neighbors.",
          stockStatus: "DISCONTINUED_BY_PHYSICS",
          rejectionReason: "The Pentagon called. They want their tank back.",
          sortOrder: 2
        },
        {
          title: "Invisible Dice Set",
          slug: "invisible-dice",
          tagline: "You'll Never Lose Them (Because You'll Never Find Them)",
          description: "Revolutionary transparent dice made from compressed air and good intentions. Perfect for games where trust is paramount and cheating is inevitable.",
          impossiblePrice: "One Honest Review",
          category: "Gaming",
          warning: "May or may not exist",
          features: "• 100% invisible\n• Always rolls in your favor (unverifiable)\n• Quantum superposition means all numbers at once\n• Dishwasher safe (probably)\n• Comes in a box you can't see",
          legalDisclaimer: "Product visibility not guaranteed. Full Uproar Games cannot confirm product exists. Refunds will be processed invisibly.",
          stockStatus: "IMPOSSIBLE",
          rejectionReason: "We can't find them in our warehouse either.",
          sortOrder: 3
        },
        {
          title: "Customer Service Hotline",
          slug: "customer-service",
          tagline: "Someone Will Actually Answer!",
          description: "A phone number that connects directly to a helpful, knowledgeable human being who genuinely cares about your problem and has the authority to fix it immediately.",
          impossiblePrice: "Your Sanity",
          category: "Services",
          warning: "This product violates the laws of corporate physics",
          features: "• Zero hold time\n• No menu tree\n• Speaks your language fluently\n• Actually solves problems\n• Won't try to upsell you\n• Remembers your previous calls",
          legalDisclaimer: "This service is so impossible that even describing it may cause reality to collapse. Please game responsibly in this dimension.",
          stockStatus: "SOLD_OUT_FOREVER",
          rejectionReason: "Our lawyers laughed until they cried.",
          sortOrder: 4
        },
        {
          title: "Time Machine DLC",
          slug: "time-machine-dlc",
          tagline: "Undo Your Worst Game Decisions!",
          description: "Downloadable content that actually sends you back in time to replay your turns. Perfect for those 'I immediately regret this decision' moments. Works with all games, including life.",
          impossiblePrice: "Tomorrow's Lottery Numbers",
          category: "Digital",
          warning: "May cause temporal paradoxes",
          features: "• Unlimited redos\n• Works on ANY game\n• Also works on relationships\n• Prevents grandfather paradoxes\n• Includes free dinosaur",
          legalDisclaimer: "Side effects include: déjà vu, meeting yourself, accidentally preventing your own birth, and Tuesday happening twice.",
          stockStatus: "DISCONTINUED_BY_PHYSICS",
          rejectionReason: "Still stuck in beta testing since 1885.",
          sortOrder: 5
        },
        {
          title: "Fugly Flamethrower",
          slug: "fugly-flamethrower",
          tagline: "For Tables That Need Flipping AND Burning",
          description: "When rage-quitting isn't enough! This gaming-grade flamethrower features adjustable flame settings from 'Mild Annoyance' to 'Scorched Earth Policy'. Includes complimentary fire extinguisher (sold separately).",
          impossiblePrice: "Your Security Deposit",
          category: "Weapons",
          warning: "Definitely illegal everywhere",
          features: "• 30-foot range of regret\n• Ergonomic grip for comfortable destruction\n• LED score display\n• Bluetooth enabled (why?)\n• Marshmallow roasting attachment",
          legalDisclaimer: "Full Uproar Games strongly discourages arson. This product is for entertainment purposes only. Entertainment not guaranteed. Fire is hot.",
          stockStatus: "IMPOSSIBLE",
          rejectionReason: "The ATF, FBI, and Boy Scouts have joined forces to stop us.",
          sortOrder: 6
        },
        {
          title: "Winner's High Ground",
          slug: "winners-high-ground",
          tagline: "Literally Rise Above Your Competition",
          description: "A 10-foot elevated platform that automatically rises when you're winning. Includes spotlights, victory music, and a fog machine. Some assembly required (crane not included).",
          impossiblePrice: "Your Friends' Respect",
          category: "Furniture",
          warning: "May violate building codes and friendships",
          features: "• Hydraulic lifting system\n• Built-in confetti cannons\n• Surround sound gloating system\n• Emergency lowering button (for humility)\n• OSHA non-compliant",
          legalDisclaimer: "Not responsible for ceiling damage, hurt feelings, or the inevitable loneliness that comes with being insufferable.",
          stockStatus: "SOLD_OUT_FOREVER",
          rejectionReason: "Your ceiling is too low and so are your friends' opinions of you.",
          sortOrder: 7
        }
      ]
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Impossible products seeded successfully',
      count: products.count 
    });
  } catch (error) {
    console.error('Error seeding impossible products:', error);
    return NextResponse.json(
      { error: 'Failed to seed products' },
      { status: 500 }
    );
  }
}