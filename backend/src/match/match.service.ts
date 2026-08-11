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

type KeyChoice = 'GO_FOR_WINNER' | 'HIGH_PERCENTAGE' | 'MIX_PACE';

function choiceMod(choice: KeyChoice, player: {
  mental: number;
  endurance: number;
  technique: number;
}) {
  if (choice === 'GO_FOR_WINNER') return 0.035 + player.technique / 2500;
  if (choice === 'HIGH_PERCENTAGE') return 0.03 + player.endurance / 2800;
  return 0.032 + player.mental / 2600;
}

function choiceLabel(choice: KeyChoice) {
  if (choice === 'GO_FOR_WINNER') return 'tenter le winner';
  if (choice === 'HIGH_PERCENTAGE') return 'jouer safe à haut pourcentage';
  return 'casser le rythme';
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
    if (!player.trainingDone) {
      throw new BadRequestException(
        'Effectue d’abord un entraînement avant le match tactique',
      );
    }
    if (player.sliceDone) {
      throw new BadRequestException(
        'Match déjà joué — relance un match depuis le hub',
      );
    }

    const surfaceBonus =
      dto.surface === player.preferredSurface ? 0.09 : -0.03;

    const tacticMod =
      dto.preMatchTactic === 'AGGRESSIVE'
        ? player.playStyle === 'ATTACKER'
          ? 0.08
          : 0.02
        : dto.preMatchTactic === 'SAFE'
          ? player.playStyle === 'DEFENDER'
            ? 0.08
            : 0.02
          : player.playStyle === 'ALLROUND'
            ? 0.07
            : 0.02;

    const keyMod =
      (choiceMod(dto.rallyChoice, player) +
        choiceMod(dto.breakChoice, player) +
        choiceMod(dto.finishChoice, player)) /
      3;

    const playerRng = 0.92 + Math.random() * 0.16;
    const oppRng = 0.92 + Math.random() * 0.16;

    const opponentPool = [
      { name: 'Lucas Vermeer', technique: 68, endurance: 70, mental: 66, form: 72, fatigue: 15 },
      { name: 'Inès Calderón', technique: 70, endurance: 67, mental: 69, form: 70, fatigue: 12 },
      { name: 'Noah Berger', technique: 66, endurance: 72, mental: 64, form: 74, fatigue: 18 },
    ];
    const opponent = opponentPool[Math.floor(Math.random() * opponentPool.length)];

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

    const oppPower = powerFromStats({
      technique: opponent.technique,
      endurance: opponent.endurance,
      mental: opponent.mental,
      form: opponent.form,
      fatigue: opponent.fatigue,
      surfaceBonus: dto.surface === 'HARD' ? 0.02 : 0,
      tacticMod: 0.03,
      keyMod: 0.025,
      rng: oppRng,
    });

    const margin = playerPower - oppPower;
    const won = margin >= 0;
    const close = Math.abs(margin) < 4;

    const sets = won
      ? close
        ? Math.random() > 0.5
          ? '6-4 3-6 7-5'
          : '7-6 4-6 6-4'
        : Math.random() > 0.45
          ? '6-4 7-5'
          : '6-3 6-4'
      : close
        ? Math.random() > 0.5
          ? '4-6 6-3 5-7'
          : '6-7 6-4 3-6'
        : Math.random() > 0.45
          ? '4-6 5-7'
          : '3-6 4-6';

    const surfaceFr =
      dto.surface === 'CLAY'
        ? 'terre battue'
        : dto.surface === 'GRASS'
          ? 'gazon'
          : 'dur';

    const timeline = [
      {
        phase: 'ENTREE',
        title: 'Entrée sur le court',
        detail: `Tu affrontes ${opponent.name} sur ${surfaceFr}. La foule junior est déjà chaude.`,
      },
      {
        phase: 'RALLY',
        title: 'Premier set — échange long',
        detail: `Tu choisis de ${choiceLabel(dto.rallyChoice)}. ${
          won || Math.random() > 0.4
            ? 'Tu prends l’ascendant, les jambes de ton adversaire commencent à lourdes.'
            : 'Il/elle résiste : chaque point se joue dans le filet de sécurité.'
        }`,
      },
      {
        phase: 'BREAK',
        title: 'Moment clé — balle de break',
        detail: `4-4. Tu décides de ${choiceLabel(dto.breakChoice)}. ${
          margin > 2
            ? 'Break ! Le public se lève.'
            : margin < -2
              ? 'Break contre. Il faut remonter la pente.'
              : 'Échange de ouf — le set reste en suspens.'
        }`,
      },
      {
        phase: 'FINISH',
        title: 'Finale — dernière balle',
        detail: `Dernier set. Tu choisis de ${choiceLabel(dto.finishChoice)}. ${
          won
            ? `Point gagnant. Tu bats ${opponent.name} (${sets}).`
            : `${opponent.name} ferme mieux le point (${sets}). Défaite utile.`
        }`,
      },
    ];

    const rewardCash = won
      ? 280 + Math.floor(player.celebrity * 2.5) + (close ? 40 : 0)
      : 90 + Math.floor(player.celebrity);
    const rewardCelebrity = won ? (close ? 7 : 5) : 2;
    const narrative = won
      ? close
        ? `Match accroché contre ${opponent.name} (${sets}). Tu sors grandi — la carrière junior a un visage.`
        : `Maîtrise sur ${surfaceFr}. Tu bats ${opponent.name} (${sets}). Les recruteurs notent ton nom.`
      : `Défaite formative face à ${opponent.name} (${sets}). Tu sens exactement ce qu’il faut travailler demain.`;

    const updated = await this.prisma.player.update({
      where: { id: player.id },
      data: {
        cash: player.cash + rewardCash,
        celebrity: clamp(player.celebrity + rewardCelebrity),
        morale: clamp(player.morale + (won ? 8 : -4)),
        fatigue: clamp(player.fatigue + 12),
        form: clamp(player.form + (won ? 4 : -2)),
        sliceDone: true,
      },
    });

    const match = await this.prisma.matchResult.create({
      data: {
        playerId: player.id,
        opponentName: opponent.name,
        surface: dto.surface,
        preMatchTactic: dto.preMatchTactic,
        keyMomentChoice: [
          dto.rallyChoice,
          dto.breakChoice,
          dto.finishChoice,
        ].join('|'),
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
      opponent: { name: opponent.name },
      timeline,
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
