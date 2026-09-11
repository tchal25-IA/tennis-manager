import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

@Injectable()
export class CareerService {
  constructor(private readonly prisma: PrismaService) {}

  async hub(playerId: string) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) throw new NotFoundException('Joueur introuvable');

    let nextStep: 'SCENE' | 'TRAINING' | 'MATCH' | 'DONE' = 'SCENE';
    if (player.sliceDone) nextStep = 'DONE';
    else if (player.sceneIndex >= 3 && !player.trainingDone)
      nextStep = 'TRAINING';
    else if (player.sceneIndex >= 3 && player.trainingDone) nextStep = 'MATCH';

    const lastMatch = await this.prisma.matchResult.findFirst({
      where: { playerId },
      orderBy: { createdAt: 'desc' },
    });

    const matchesPlayed = await this.prisma.matchResult.count({
      where: { playerId },
    });

    const wins = await this.prisma.matchResult.count({
      where: { playerId, won: true },
    });

    const losses = matchesPlayed - wins;
    const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

    const recentMatches = await this.prisma.matchResult.findMany({
      where: { playerId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        opponentName,
        won: true,
        scoreline: true,
        tournamentName: true,
        round: true,
        createdAt: true,
      },
    });

    return {
      player,
      nextStep,
      lastMatch,
      matchesPlayed,
      canRematch: player.sliceDone === true,
      stats: {
        wins,
        losses,
        winRate,
        tournamentsWon: player.tournamentsWon,
        currentSeason: player.currentSeason,
      },
      recentMatches,
      loopHint:
        nextStep === 'SCENE'
          ? 'Événement narratif en attente'
          : nextStep === 'TRAINING'
            ? 'Entraînement avant le match tactique'
            : nextStep === 'MATCH'
              ? 'Ton match junior est prêt — entre sur le court'
              : 'Slice terminée — rejoue un match ou lance une nouvelle carrière',
    };
  }

  /** Débloque un nouveau match avec le même joueur (stats conservées). */
  async rematch(playerId: string) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) throw new NotFoundException('Joueur introuvable');
    if (player.sceneIndex < 3) {
      throw new BadRequestException(
        'Termine d’abord les scènes narratives',
      );
    }
    if (!player.sliceDone) {
      return this.hub(playerId);
    }

    await this.prisma.player.update({
      where: { id: playerId },
      data: {
        sliceDone: false,
        fatigue: clamp(player.fatigue - 8),
        form: clamp(player.form + 1),
        morale: clamp(player.morale + 2),
      },
    });

    return this.hub(playerId);
  }
}
