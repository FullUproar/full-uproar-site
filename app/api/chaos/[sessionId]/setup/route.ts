import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { selectObjectivesForSession } from '@/lib/chaos/objectives';

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

interface SetupAnswers {
  comfortLevel?: 'chill' | 'moderate' | 'maximum';
  socialStyle?: 'observer' | 'participant' | 'instigator';
  physicalChallenges?: boolean;
  competitiveOk?: boolean;
}

// POST /api/chaos/[sessionId]/setup - Complete setup and assign objectives
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const user = await getCurrentUser();
    const body = await request.json();
    const { participantId, answers } = body as { participantId: string; answers: SetupAnswers };

    // Get the session
    const session = await prisma.chaosSession.findUnique({
      where: { id: sessionId },
      include: {
        participants: true,
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Find the participant
    const participant = session.participants.find(
      p => p.id === participantId || p.userId === user?.id
    );

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Store setup answers in session if this is the host
    if (participant.isHost && answers) {
      await prisma.chaosSession.update({
        where: { id: sessionId },
        data: {
          setupAnswers: answers as any,
          // Set intensity based on comfort level
          intensity: answers.comfortLevel === 'chill' ? 'LOW' :
                    answers.comfortLevel === 'maximum' ? 'HIGH' : 'MEDIUM',
        },
      });
    }

    // Mark participant as setup complete
    await prisma.chaosParticipant.update({
      where: { id: participant.id },
      data: {
        // Could store individual preferences here if needed
      },
    });

    // Check if all participants have completed setup
    const allComplete = session.participants.every(p => {
      // For now, we'll trigger objective assignment when host completes
      return p.isHost ? true : true; // Simplified - assign when host finishes
    });

    // If this is the host completing setup, assign objectives to everyone
    if (participant.isHost && answers) {
      const participantCount = session.participants.length;
      const objectives = selectObjectivesForSession(participantCount, answers);

      // Assign objectives to participants
      const participantIds = session.participants.map(p => p.id);

      // Create objectives in database
      const objectiveAssignments = objectives.map((obj, index) => ({
        sessionId,
        participantId: participantIds[index % participantIds.length],
        templateId: obj.id,
        title: obj.title,
        description: obj.description,
        difficulty: obj.difficulty,
        chaosPoints: obj.chaosPoints,
        requiresVote: obj.requiresVote,
      }));

      await prisma.chaosObjective.createMany({
        data: objectiveAssignments,
      });

      // Fetch created objectives
      const createdObjectives = await prisma.chaosObjective.findMany({
        where: { sessionId },
      });

      return NextResponse.json({
        success: true,
        setupComplete: true,
        objectivesAssigned: createdObjectives.length,
        sessionIntensity: session.intensity,
      });
    }

    return NextResponse.json({
      success: true,
      setupComplete: false, // Waiting for host
    });
  } catch (error) {
    console.error('Error completing chaos setup:', error);
    return NextResponse.json({ error: 'Failed to complete setup' }, { status: 500 });
  }
}

// GET /api/chaos/[sessionId]/setup - Get setup questions
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    const session = await prisma.chaosSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Return the setup questions
    const setupQuestions = [
      {
        id: 'comfortLevel',
        question: 'What\'s your chaos comfort level?',
        description: 'This affects how intense the challenges and events will be.',
        type: 'single',
        options: [
          { value: 'chill', label: 'Chill', description: 'Easy challenges, lots of fun, low pressure' },
          { value: 'moderate', label: 'Moderate', description: 'Mix of easy and challenging, some competition' },
          { value: 'maximum', label: 'Maximum Chaos!', description: 'Intense challenges, high stakes, embrace the chaos!' },
        ],
      },
      {
        id: 'socialStyle',
        question: 'What\'s your social style tonight?',
        description: 'This helps us tailor objectives to your vibe.',
        type: 'single',
        options: [
          { value: 'observer', label: 'Observer', description: 'I prefer to watch and participate quietly' },
          { value: 'participant', label: 'Participant', description: 'I\'ll join in but not lead the charge' },
          { value: 'instigator', label: 'Instigator', description: 'I\'m here to stir things up!' },
        ],
      },
      {
        id: 'physicalChallenges',
        question: 'Physical challenges OK?',
        description: 'Things like standing up, dancing, or moving around.',
        type: 'boolean',
        options: [
          { value: true, label: 'Yes, bring it on!' },
          { value: false, label: 'Keep it chill, please' },
        ],
      },
      {
        id: 'competitiveOk',
        question: 'Competitive sabotage OK?',
        description: 'Objectives that involve (playfully) messing with others.',
        type: 'boolean',
        options: [
          { value: true, label: 'Yes, game on!' },
          { value: false, label: 'Keep it friendly' },
        ],
      },
    ];

    return NextResponse.json({
      questions: setupQuestions,
      currentAnswers: session.setupAnswers,
    });
  } catch (error) {
    console.error('Error fetching setup questions:', error);
    return NextResponse.json({ error: 'Failed to fetch setup' }, { status: 500 });
  }
}
