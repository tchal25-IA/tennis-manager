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
export class NarrativeService {
  constructor(private readonly prisma: PrismaService) {}

  async currentScene(playerId: string) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) throw new NotFoundException('Joueur introuvable');

    if (player.sceneIndex >= 3) {
      return { done: true as const, player, scene: null };
    }

    const scene = await this.prisma.scene.findUnique({
      where: { orderIndex: player.sceneIndex },
      include: { choices: true },
    });
    if (!scene) throw new NotFoundException('Scène introuvable');

    return { done: false as const, player, scene };
  }

  async resolveChoice(playerId: string, choiceId: string) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) throw new NotFoundException('Joueur introuvable');
    if (player.sceneIndex >= 3) {
      throw new BadRequestException('Toutes les scènes sont déjà jouées');
    }

    const choice = await this.prisma.sceneChoice.findUnique({
      where: { id: choiceId },
      include: { scene: true },
    });
    if (!choice) throw new NotFoundException('Choix introuvable');
    if (choice.scene.orderIndex !== player.sceneIndex) {
      throw new BadRequestException('Ce choix ne correspond pas à la scène courante');
    }

    const updated = await this.prisma.player.update({
      where: { id: playerId },
      data: {
        technique: clamp(player.technique + choice.deltaTechnique, 60, 100),
        endurance: clamp(player.endurance + choice.deltaEndurance, 60, 100),
        mental: clamp(player.mental + choice.deltaMental, 60, 100),
        celebrity: clamp(player.celebrity + choice.deltaCelebrity),
        cash: Math.max(0, player.cash + choice.deltaCash),
        morale: clamp(player.morale + choice.deltaMorale),
        sceneIndex: player.sceneIndex + 1,
      },
    });

    await this.prisma.sceneChoiceLog.create({
      data: { playerId, choiceId },
    });

    const next = await this.currentScene(playerId);
    return { player: updated, choiceApplied: choice, next };
  }
}
