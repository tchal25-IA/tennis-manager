import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlayMatchDto } from './dto/play-match.dto';

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function powerFromStats(input: {
  technique: number;
  endurance: number;
  mental: number;
  form: number;
  fatigue: number;
  surfaceBonus: number;
  tacticMod: number;
  keyMod: number;
  rng: number;
}) {
  const base =
    input.technique * 0.4 + input.endurance * 0.3 + input.mental * 0.3;
  const formF = 0.85 + (input.form / 100) * 0.3;
  const fatigueF = 1 - (input.fatigue / 100) * 0.25;
  return (
    base *
    formF *
    fatigueF *
    (1 + input.surfaceBonus) *
    (1 + input.tacticMod) *
    (1 + input.keyMod) *
    input.rng
  );
}

@Injectable()
export class MatchService {
  constructor(private readonly prisma: PrismaService) {}

  async play(dto: PlayMatchDto) {
    const player = await this.prisma.player.findUnique({
      where: { id: dto.playerId },
    });
    if (!player) throw new NotFoundException('Joueur introuvable');
    if (player.sceneIndex < 3) {
      throw new BadRequestException(
        'Termine les 3 scènes narratives avant le match',
      );
    }
    if (player.sliceDone) {
      throw new BadRequestException('Vertical slice déjà terminée pour ce joueur');
    }

    const surfaceBonus =
      dto.surface === player.preferredSurface ? 0.08 : -0.03;

    const tacticMod =
      dto.preMatchTactic === 'AGGRESSIVE'
        ? player.playStyle === 'ATTACKER'
          ? 0.07
          : 0.02
        : dto.preMatchTactic === 'SAFE'
          ? player.playStyle === 'DEFENDER'
            ? 0.07
            : 0.02
          : player.playStyle === 'ALLROUND'
            ? 0.06
            : 0.02;

    const keyMod =
      dto.keyMomentChoice === 'GO_FOR_WINNER'
        ? 0.04 + player.mental / 2000
        : dto.keyMomentChoice === 'HIGH_PERCENTAGE'
          ? 0.03 + player.endurance / 2500
          : 0.035;

    // 10–15 % aléatoire
    const playerRng = 0.925 + Math.random() * 0.15;
    const oppRng = 0.925 + Math.random() * 0.15;

    const playerPower = powerFromStats({
      technique: player.technique,
      endurance: player.endurance,
      mental: player.mental,
      form: player.form,
      fatigue: player.fatigue,
      surfaceBonus,
      tacticMod,
      keyMod,
      rng: playerRng,
    });

    // Adversaire junior fixe (légèrement sous le plafond)
    const opponent = {
      name: 'Lucas Vermeer',
      technique: 68,
      endurance: 70,
      mental: 66,
      form: 72,
      fatigue: 15,
    };

    const oppPower = powerFromStats({
      technique: opponent.technique,
      endurance: opponent.endurance,
      mental: opponent.mental,
      form: opponent.form,
      fatigue: opponent.fatigue,
      surfaceBonus: dto.surface === 'HARD' ? 0.02 : 0,
      tacticMod: 0.03,
      keyMod: 0.02,
      rng: oppRng,
    });

    const won = playerPower >= oppPower;
    const sets = won
      ? Math.random() > 0.45
        ? '6-4 7-5'
        : '6-3 3-6 6-4'
      : Math.random() > 0.45
        ? '4-6 5-7'
        : '6-4 2-6 3-6';

    const rewardCash = won ? 250 + Math.floor(player.celebrity * 2) : 80;
    const rewardCelebrity = won ? 5 : 1;
    const narrative = won
      ? `Break décisif au moment clé. Tu bats ${opponent.name} (${sets}). La salle applaudit — ta carrière junior démarre vraiment.`
      : `${opponent.name} résiste mieux sur les balles importantes (${sets}). Défaite utile : tu notes ce qu’il faut corriger.`;

    const updated = await this.prisma.player.update({
      where: { id: player.id },
      data: {
        cash: player.cash + rewardCash,
        celebrity: clamp(player.celebrity + rewardCelebrity),
        morale: clamp(player.morale + (won ? 8 : -5)),
        fatigue: clamp(player.fatigue + 12),
        form: clamp(player.form + (won ? 4 : -3)),
        sliceDone: true,
        careerStage: won ? 'JUNIOR' : 'JUNIOR',
      },
    });

    const match = await this.prisma.matchResult.create({
      data: {
        playerId: player.id,
        opponentName: opponent.name,
        surface: dto.surface,
        preMatchTactic: dto.preMatchTactic,
        keyMomentChoice: dto.keyMomentChoice,
        won,
        scoreline: sets,
        rewardCash,
        rewardCelebrity,
        narrative,
      },
    });

    return {
      match,
      player: updated,
      reward: {
        cash: rewardCash,
        celebrity: rewardCelebrity,
        won,
        scoreline: sets,
        narrative,
      },
    };
  }
}
