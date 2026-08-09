import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

    return {
      player,
      nextStep,
      lastMatch,
      loopHint:
        nextStep === 'SCENE'
          ? 'Événement narratif en attente'
          : nextStep === 'MATCH'
            ? 'Premier match junior prêt'
            : 'Vertical slice terminée — récompenses débloquées',
    };
  }
}
