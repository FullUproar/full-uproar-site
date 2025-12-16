import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// Types for AI requests
type AIRequestType =
  | 'suggest_games'      // Suggest games based on player count, vibe, duration
  | 'generate_invite'    // Generate a fun invite message
  | 'suggest_snacks'     // Suggest food/drinks for the vibe
  | 'generate_theme'     // Generate a theme idea
  | 'generate_recap'     // Generate post-game-night recap
  | 'plan_night';        // Full planning assistance

interface AIRequest {
  type: AIRequestType;
  context: {
    playerCount?: number;
    vibe?: string;
    duration?: number; // in minutes
    theme?: string;
    guestNames?: string[];
    gamesOwned?: string[];
    dietaryRestrictions?: string[];
    gameNightId?: string; // For recap generation
    customPrompt?: string;
  };
}

// Fallback suggestions when AI is not available
const FALLBACK_SUGGESTIONS = {
  games: {
    CHILL: ['Codenames', 'Ticket to Ride', 'Wingspan', 'Azul', 'Splendor'],
    COMPETITIVE: ['Catan', 'Terraforming Mars', 'Scythe', 'Root', '7 Wonders'],
    CHAOS: ['Exploding Kittens', 'Throw Throw Burrito', 'Unstable Unicorns', 'Coup', 'Love Letter'],
    PARTY: ['Cards Against Humanity', 'What Do You Meme', 'Telestrations', 'Just One', 'Wavelength'],
    COZY: ['Mysterium', 'Pandemic', 'Spirit Island', 'Gloomhaven: Jaws of the Lion', 'Betrayal at House on the Hill'],
  },
  snacks: {
    CHILL: ['Cheese board with crackers', 'Veggie platter with hummus', 'Popcorn bar', 'Fruit and chocolate'],
    COMPETITIVE: ['Finger foods that won\'t slow you down', 'Mini sandwiches', 'Energy drinks', 'Trail mix'],
    CHAOS: ['Pizza rolls', 'Hot wings', 'Nachos supreme', 'Anything deep fried'],
    PARTY: ['Chips and multiple dips', 'Slider bar', 'Cocktail/mocktail station', 'S\'mores bar'],
    COZY: ['Warm soup in mugs', 'Fresh baked cookies', 'Hot cocoa bar', 'Comfort food spread'],
  },
  themes: [
    '80s Arcade Night - neon colors, synthwave music, retro snacks',
    'Medieval Tavern - mead (or root beer), meat pies, fantasy games',
    'Space Station Alpha - cosmic cocktails, astronaut ice cream, sci-fi games',
    'Spy vs Spy - mystery games, secret codes, tuxedo dress code optional',
    'Chaos Casino - poker chips as score trackers, dealer vibes, high stakes snacks',
  ],
};

// Generate suggestions using Claude AI
async function generateWithAI(prompt: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return null; // Fall back to preset suggestions
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Fast and cheap for suggestions
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: prompt,
        }],
        system: `You are the "Chaos Coordinator" - a fun, irreverent AI assistant for Full Uproar Games' Game Night Planner.
Your personality is playful, slightly chaotic, and always enthusiastic about game nights.
Keep responses concise but entertaining. Use emojis sparingly but effectively.
Remember: game nights are about having fun with friends, not being perfect.`,
      }),
    });

    if (!response.ok) {
      console.error('Anthropic API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.content?.[0]?.text || null;
  } catch (error) {
    console.error('AI generation error:', error);
    return null;
  }
}

// POST /api/game-nights/ai - AI-powered suggestions
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body: AIRequest = await request.json();
    const { type, context } = body;

    let result: any = { source: 'ai' };

    switch (type) {
      case 'suggest_games': {
        const vibe = (context.vibe || 'CHILL').toUpperCase();
        const playerCount = context.playerCount || 4;
        const duration = context.duration || 180;

        const prompt = `Suggest 5 board/card games for a ${vibe.toLowerCase()} game night with ${playerCount} players and about ${Math.round(duration / 60)} hours to play.
${context.gamesOwned?.length ? `They already own: ${context.gamesOwned.join(', ')}. Suggest different games.` : ''}
${context.theme ? `Theme: ${context.theme}` : ''}

Format as a JSON array with objects containing: name, reason (1 sentence why it fits), playerCount, estimatedMinutes.`;

        const aiResponse = await generateWithAI(prompt);

        if (aiResponse) {
          try {
            // Try to parse JSON from response
            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              result.games = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('No JSON found');
            }
          } catch {
            // If parsing fails, use fallback
            result.source = 'fallback';
            result.games = FALLBACK_SUGGESTIONS.games[vibe as keyof typeof FALLBACK_SUGGESTIONS.games] || FALLBACK_SUGGESTIONS.games.CHILL;
            result.rawSuggestion = aiResponse;
          }
        } else {
          result.source = 'fallback';
          result.games = FALLBACK_SUGGESTIONS.games[vibe as keyof typeof FALLBACK_SUGGESTIONS.games] || FALLBACK_SUGGESTIONS.games.CHILL;
        }
        break;
      }

      case 'generate_invite': {
        const prompt = `Write a fun, casual invite message for a game night.
Details:
- Host is inviting friends
- Vibe: ${context.vibe || 'chill'}
${context.theme ? `- Theme: ${context.theme}` : ''}
${context.guestNames?.length ? `- Guests: ${context.guestNames.join(', ')}` : ''}

Keep it under 100 words. Make it feel like a text from a friend, not a formal invitation. Include one emoji max. Make people actually want to come!`;

        const aiResponse = await generateWithAI(prompt);

        if (aiResponse) {
          result.invite = aiResponse;
        } else {
          result.source = 'fallback';
          result.invite = `Hey! Game night at my place - you in? 🎲 We're gonna play some games, eat some snacks, and probably argue about the rules at least twice. It's gonna be chaotic and I need you there!`;
        }
        break;
      }

      case 'suggest_snacks': {
        const vibe = (context.vibe || 'CHILL').toUpperCase();

        const prompt = `Suggest 5 snack/drink ideas for a ${vibe.toLowerCase()} game night.
${context.dietaryRestrictions?.length ? `Dietary restrictions: ${context.dietaryRestrictions.join(', ')}` : ''}
${context.theme ? `Theme: ${context.theme}` : ''}

Format as a JSON array with objects containing: item, description (fun 1-liner), difficulty (easy/medium).`;

        const aiResponse = await generateWithAI(prompt);

        if (aiResponse) {
          try {
            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              result.snacks = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('No JSON found');
            }
          } catch {
            result.source = 'fallback';
            result.snacks = FALLBACK_SUGGESTIONS.snacks[vibe as keyof typeof FALLBACK_SUGGESTIONS.snacks] || FALLBACK_SUGGESTIONS.snacks.CHILL;
            result.rawSuggestion = aiResponse;
          }
        } else {
          result.source = 'fallback';
          result.snacks = FALLBACK_SUGGESTIONS.snacks[vibe as keyof typeof FALLBACK_SUGGESTIONS.snacks] || FALLBACK_SUGGESTIONS.snacks.CHILL;
        }
        break;
      }

      case 'generate_theme': {
        const prompt = `Generate 3 unique, fun theme ideas for a game night. Be creative and unexpected!
${context.vibe ? `Preferred vibe: ${context.vibe}` : ''}
${context.playerCount ? `Player count: ${context.playerCount}` : ''}

Format as a JSON array with objects containing: name, description (2-3 sentences), suggestedGames (array of 2-3 games), snackIdea.`;

        const aiResponse = await generateWithAI(prompt);

        if (aiResponse) {
          try {
            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              result.themes = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('No JSON found');
            }
          } catch {
            result.source = 'fallback';
            result.themes = FALLBACK_SUGGESTIONS.themes.map(t => {
              const [name, ...rest] = t.split(' - ');
              return { name, description: rest.join(' - ') };
            });
            result.rawSuggestion = aiResponse;
          }
        } else {
          result.source = 'fallback';
          result.themes = FALLBACK_SUGGESTIONS.themes.map(t => {
            const [name, ...rest] = t.split(' - ');
            return { name, description: rest.join(' - ') };
          });
        }
        break;
      }

      case 'generate_recap': {
        if (!context.gameNightId) {
          return NextResponse.json({ error: 'gameNightId required for recap' }, { status: 400 });
        }

        // Fetch game night data
        const gameNight = await prisma.gameNight.findUnique({
          where: { id: context.gameNightId },
          include: {
            host: { select: { displayName: true, username: true } },
            guests: {
              where: { status: 'IN' },
              include: { user: { select: { displayName: true, username: true } } }
            },
            games: {
              where: { status: 'COMPLETED' },
              include: { game: { select: { title: true } } }
            },
            moments: true,
          }
        });

        if (!gameNight) {
          return NextResponse.json({ error: 'Game night not found' }, { status: 404 });
        }

        // Verify access
        if (gameNight.hostId !== user.id) {
          return NextResponse.json({ error: 'Only host can generate recap' }, { status: 403 });
        }

        const attendees = gameNight.guests.map(g =>
          g.user?.displayName || g.user?.username || g.guestName || 'Mystery Guest'
        );
        const gamesPlayed = gameNight.games.map(g => ({
          name: g.game?.title || g.customGameName,
          winner: g.winnerName,
          chaosLevel: g.chaosLevel,
        }));
        const chaosNotes = gameNight.moments.filter(m => m.type === 'CHAOS' || m.type === 'QUOTE');

        const prompt = `Write a fun, entertaining recap of this game night in 2-3 short paragraphs:

Host: ${gameNight.host.displayName || gameNight.host.username}
Attendees: ${attendees.join(', ')}
Games played: ${gamesPlayed.map(g => `${g.name}${g.winner ? ` (won by ${g.winner})` : ''}`).join(', ')}
${chaosNotes.length ? `Notable moments: ${chaosNotes.map(m => m.content).join('; ')}` : ''}
Vibe: ${gameNight.vibe}

Make it feel like a sports recap but for game night. Highlight winners, chaos moments, and make it shareable. End with a hype line about the next game night.`;

        const aiResponse = await generateWithAI(prompt);

        if (aiResponse) {
          result.recap = aiResponse;

          // Save the recap
          await prisma.gameNightRecap.upsert({
            where: { gameNightId: context.gameNightId },
            create: {
              gameNightId: context.gameNightId,
              aiSummary: aiResponse,
              totalGamesPlayed: gameNight.games.length,
              highlights: {
                attendees,
                gamesPlayed,
                chaosNotes: chaosNotes.map(m => m.content),
              },
            },
            update: {
              aiSummary: aiResponse,
              highlights: {
                attendees,
                gamesPlayed,
                chaosNotes: chaosNotes.map(m => m.content),
              },
              generatedAt: new Date(),
            }
          });
        } else {
          result.source = 'fallback';
          result.recap = `🎲 GAME NIGHT RECAP 🎲\n\n${attendees.join(', ')} gathered for an epic night of gaming! ${gamesPlayed.length} games were played, friendships were tested, and snacks were demolished.\n\nUntil next time, keep rolling those dice!`;
        }
        break;
      }

      case 'plan_night': {
        const prompt = `Help plan an amazing game night based on these details:
${context.customPrompt || 'Plan a fun game night for friends'}

Player count: ${context.playerCount || 'Unknown'}
Duration: ${context.duration ? `${Math.round(context.duration / 60)} hours` : 'A few hours'}
Vibe: ${context.vibe || 'Whatever feels right'}

Give suggestions for:
1. 3-4 games to play (in recommended order)
2. Snack ideas
3. A fun theme or twist to make it memorable
4. One "chaos rule" to add excitement

Keep it concise and actionable. Format response as structured sections.`;

        const aiResponse = await generateWithAI(prompt);

        if (aiResponse) {
          result.plan = aiResponse;
        } else {
          result.source = 'fallback';
          const vibe = (context.vibe || 'CHILL').toUpperCase();
          result.plan = {
            games: FALLBACK_SUGGESTIONS.games[vibe as keyof typeof FALLBACK_SUGGESTIONS.games] || FALLBACK_SUGGESTIONS.games.CHILL,
            snacks: FALLBACK_SUGGESTIONS.snacks[vibe as keyof typeof FALLBACK_SUGGESTIONS.snacks] || FALLBACK_SUGGESTIONS.snacks.CHILL,
            theme: FALLBACK_SUGGESTIONS.themes[Math.floor(Math.random() * FALLBACK_SUGGESTIONS.themes.length)],
            chaosRule: 'Loser of each game has to wear the "Shame Hat" until someone else loses!',
          };
        }
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI endpoint error:', error);
    return NextResponse.json({ error: 'AI service error' }, { status: 500 });
  }
}
