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
      throw new BadRequestException("Termine d'abord les scènes narratives");
    }
    if (player.trainingDone) {
      return { alreadyTrained: true as const, player };
    }

    return {
      alreadyTrained: false as const,
      player,
      trainings: [
        {
          id: 'SERVE',
          label: 'Service',
          description: "Améliore puissance et précision au service",
          deltaServe: 5,
          deltaTechnique: 2,
          deltaMorale: 1,
          deltaFatigue: 12,
        },
        {
          id: 'FOREHAND',
          label: 'Coup droit',
          description: "Travaille le coup droit et l'attaque",
          deltaForehand: 5,
          deltaTechnique: 1,
          deltaMorale: 1,
          deltaFatigue: 10,
        },
        {
          id: 'BACKHAND',
          label: 'Revers',
          description: "Renforce le revers et la défense",
          deltaBackhand: 5,
          deltaEndurance: 2,
          deltaMorale: 1,
          deltaFatigue: 10,
        },
        {
          id: 'PHYSIQUE',
          label: 'Physique',
          description: "Cardio et endurance générale",
          deltaEndurance: 4,
          deltaMental: 1,
          deltaMorale: 2,
          deltaFatigue: 15,
        },
        {
          id: 'MENTAL',
          label: 'Mental',
          description: "Concentration et gestion de la pression",
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
      throw new BadRequestException("Termine d'abord les scènes narratives");
    }
    if (player.trainingDone) {
      throw new BadRequestException("Entraînement déjà effectué pour ce vertical slice");
    }

    const effects: Record<string, number> =
      dto.trainingType === 'SERVE'
        ? {
            serve: 5,
            technique: 2,
            morale: 1,
            fatigue: 12,
          }
        : dto.trainingType === 'FOREHAND'
          ? {
              forehand: 5,
              technique: 1,
              morale: 1,
              fatigue: 10,
            }
          : dto.trainingType === 'BACKHAND'
            ? {
                backhand: 5,
                endurance: 2,
                morale: 1,
                fatigue: 10,
              }
            : dto.trainingType === 'PHYSIQUE'
              ? {
                  endurance: 4,
                  mental: 1,
                  morale: 2,
                  fatigue: 15,
                }
              : {
                  mental: 4,
                  celebrity: 1,
                  fatigue: 8,
                };

    const updated = await this.prisma.player.update({
      where: { id: player.id },
      data: {
        serve: effects['serve'] !== undefined ? clamp(player.serve + effects['serve']) : player.serve,
        forehand: effects['forehand'] !== undefined ? clamp(player.forehand + effects['forehand']) : player.forehand,
        backhand: effects['backhand'] !== undefined ? clamp(player.backhand + effects['backhand']) : player.backhand,
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
