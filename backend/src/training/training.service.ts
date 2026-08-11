import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DoTrainingDto } from './dto/do-training.dto';

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

  async options(playerId: string) {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Joueur introuvable');
    if (player.sceneIndex < 3) {
      throw new BadRequestException('Termine d’abord les scènes narratives');
    }
    if (player.trainingDone) {
      return { alreadyTrained: true as const, player };
    }

    return {
      alreadyTrained: false as const,
      player,
      trainings: [
        {
          id: 'PHYSIQUE',
          label: 'Physique',
          deltaEndurance: 4,
          deltaMental: 1,
          deltaMorale: 2,
          deltaFatigue: 15,
        },
        {
          id: 'TECHNIQUE',
          label: 'Technique',
          deltaEndurance: -1,
          deltaTechnique: 4,
          deltaMorale: 1,
          deltaFatigue: 10,
        },
        {
          id: 'MENTAL',
          label: 'Mental',
          deltaMental: 4,
          deltaCelebrity: 1,
          deltaFatigue: 8,
        },
      ],
    };
  }

  async doTraining(dto: DoTrainingDto) {
    const player = await this.prisma.player.findUnique({ where: { id: dto.playerId } });
    if (!player) throw new NotFoundException('Joueur introuvable');
    if (player.sceneIndex < 3) {
      throw new BadRequestException('Termine d’abord les scènes narratives');
    }
    if (player.trainingDone) {
      throw new BadRequestException('Entraînement déjà effectué pour ce vertical slice');
    }

    const effects =
      dto.trainingType === 'PHYSIQUE'
        ? {
            endurance: 4,
            mental: 1,
            morale: 2,
            fatigue: 15,
          }
        : dto.trainingType === 'TECHNIQUE'
          ? {
              technique: 4,
              endurance: -1,
              morale: 1,
              fatigue: 10,
            }
          : {
              mental: 4,
              celebrity: 1,
              fatigue: 8,
            };

    const updated = await this.prisma.player.update({
      where: { id: player.id },
      data: {
        technique: effects['technique'] !== undefined ? clamp(player.technique + effects['technique']) : player.technique,
        endurance:
          effects['endurance'] !== undefined ? clamp(player.endurance + effects['endurance']) : player.endurance,
        mental: effects['mental'] !== undefined ? clamp(player.mental + effects['mental']) : player.mental,
        celebrity:
          effects['celebrity'] !== undefined ? clamp(player.celebrity + effects['celebrity'], 0, 100) : player.celebrity,
        morale: effects['morale'] !== undefined ? clamp(player.morale + effects['morale']) : player.morale,
        fatigue: clamp(player.fatigue + effects['fatigue']),
        trainingDone: true,
      },
    });

    return {
      player: updated,
      trainingType: dto.trainingType,
    };
  }
}

