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

    let nextStep: 'SCENE' | 'MATCH' | 'DONE' = 'SCENE';
    if (player.sliceDone) nextStep = 'DONE';
    else if (player.sceneIndex >= 3) nextStep = 'MATCH';

    const lastMatch = await this.prisma.matchResult.findFirst({
      where: { playerId },
      orderBy: { createdAt: 'desc' },
    });

    const matchesPlayed = await this.prisma.matchResult.count({
      where: { playerId },
    });

    return {
      player,
      nextStep,
      lastMatch,
      matchesPlayed,
      canRematch: player.sliceDone === true,
      loopHint:
        nextStep === 'SCENE'
          ? 'Un événement t’attend à l’académie'
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
