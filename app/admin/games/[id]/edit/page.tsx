import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import GameEditForm from './GameEditForm';

interface EditGamePageProps {
  params: Promise<{ id: string }>;
}

async function getGame(id: number) {
  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { sortOrder: 'asc' }
      }
    }
  });

  if (!game) {
    notFound();
  }

  return game;
}

export default async function EditGamePage({ params }: EditGamePageProps) {
  const { id } = await params;
  const gameId = parseInt(id);
  
  if (isNaN(gameId)) {
    notFound();
  }

  const game = await getGame(gameId);

  // Convert Date to string for the form
  const gameForForm = {
    ...game,
    launchDate: game.launchDate ? game.launchDate.toISOString() : null
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-black text-orange-500 mb-8">
          Edit Game: {game.title}
        </h1>
        
        <GameEditForm game={gameForForm} />
      </div>
    </div>
  );
}