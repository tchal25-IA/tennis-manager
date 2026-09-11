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

interface Opponent {
  name: string;
  rank: number;
  technique: number;
  endurance: number;
  mental: number;
  form: number;
  fatigue: number;
  nationality: string;
  playStyle: string;
}

const OPPONENT_POOL: Opponent[] = [
  {
    name: 'Lucas Vermeer',
    rank: 145,
    technique: 68,
    endurance: 70,
    mental: 66,
    form: 72,
    fatigue: 15,
    nationality: 'NL',
    playStyle: 'DEFENDER',
  },
  {
    name: 'Inès Calderón',
    rank: 132,
    technique: 70,
    endurance: 67,
    mental: 69,
    form: 70,
    fatigue: 12,
    nationality: 'ES',
    playStyle: 'ALLROUND',
  },
  {
    name: 'Noah Berger',
    rank: 158,
    technique: 66,
    endurance: 72,
    mental: 64,
    form: 74,
    fatigue: 18,
    nationality: 'DE',
    playStyle: 'ATTACKER',
  },
  {
    name: 'Sofia Marchetti',
    rank: 127,
    technique: 72,
    endurance: 69,
    mental: 71,
    form: 68,
    fatigue: 10,
    nationality: 'IT',
    playStyle: 'ATTACKER',
  },
  {
    name: 'Léa Dubois',
    rank: 140,
    technique: 69,
    endurance: 68,
    mental: 67,
    form: 71,
    fatigue: 14,
    nationality: 'FR',
    playStyle: 'DEFENDER',
  },
  {
    name: 'Kai Jensen',
    rank: 150,
    technique: 67,
    endurance: 70,
    mental: 65,
    form: 69,
    fatigue: 16,
    nationality: 'DK',
    playStyle: 'ALLROUND',
  },
];

const TOURNAMENTS = [
  'Open Junior Nice Côte d\'Azur',
  'Tournoi des Espoirs Lyon',
  'Challenger Junior Bordeaux',
  'ITF Junior Paris',
  'Coupe Junior Marseille',
  'Trophée Junior Monaco',
];

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
        "Effectue d'abord un entraînement avant le match tactique",
      );
    }
    if (player.sliceDone) {
      throw new BadRequestException(
        'Match déjà joué — relance un match depuis le hub',
      );
    }

    const matchesPlayed = await this.prisma.matchResult.count({
      where: { playerId: player.id },
    });

    const previousOpponents = await this.prisma.matchResult.findMany({
      where: { playerId: player.id },
      select: { opponentName: true },
    });
    const usedNames = new Set(previousOpponents.map((m) => m.opponentName));

    const availableOpponents = OPPONENT_POOL.filter(
      (opp) => !usedNames.has(opp.name),
    );
    const opponent =
      availableOpponents.length > 0
        ? availableOpponents[Math.floor(Math.random() * availableOpponents.length)]
        : OPPONENT_POOL[Math.floor(Math.random() * OPPONENT_POOL.length)];

    const tournament =
      TOURNAMENTS[Math.floor(Math.random() * TOURNAMENTS.length)];
    const rounds = ['1er tour', 'Quart de finale', 'Demi-finale', 'Finale'];
    const round = rounds[Math.min(matchesPlayed, rounds.length - 1)];

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

    const styleLabel = (style: string) => {
      if (style === 'ATTACKER') return 'attaquant agressif';
      if (style === 'DEFENDER') return 'défenseur solide';
      return 'joueur complet';
    };

    const timeline = [
      {
        phase: 'INTRO',
        title: `${tournament} — ${round}`,
        detail: `Tu affrontes ${opponent.name} (${opponent.nationality}, rang ${opponent.rank}, ${styleLabel(opponent.playStyle)}) sur ${surfaceFr}. Le public junior est prêt.`,
        playerScore: 0,
        opponentScore: 0,
      },
      {
        phase: 'WARMUP',
        title: 'Échauffement',
        detail: `Premières balles échangées. Tu sens ${
          player.form > 75
            ? 'une belle frappe, la confiance est là'
            : player.form > 60
              ? 'que ça vient, il faut trouver le rythme'
              : 'quelques tensions, respire et concentre-toi'
        }.`,
        playerScore: 0,
        opponentScore: 0,
      },
      {
        phase: 'RALLY',
        title: 'Premier set — échange long',
        detail: `Tu choisis de ${choiceLabel(dto.rallyChoice)}. ${
          won || Math.random() > 0.4
            ? `Tu prends l'ascendant, ${opponent.name} montre des signes de fatigue.`
            : `${opponent.name} résiste bien, chaque point se joue dans la marge.`
        }`,
        playerScore: won ? 6 : 4,
        opponentScore: won ? 4 : 6,
      },
      {
        phase: 'BREAK',
        title: 'Moment clé — balle de break',
        detail: `4-4, deuxième set. Tu décides de ${choiceLabel(dto.breakChoice)}. ${
          margin > 2
            ? `Break ! Le public se lève, ${opponent.name} accuse le coup.`
            : margin < -2
              ? `Break contre. ${opponent.name} prend les commandes, il faut remonter.`
              : `Échange intense — le set reste totalement ouvert.`
        }`,
        playerScore: close ? 6 : won ? 6 : 3,
        opponentScore: close ? 4 : won ? 4 : 6,
      },
      {
        phase: 'FINISH',
        title: 'Finale — dernière balle',
        detail: `${close ? 'Troisième set décisif.' : 'Set final.'} Tu choisis de ${choiceLabel(dto.finishChoice)}. ${
          won
            ? `Point gagnant ! Tu bats ${opponent.name} (${sets}). La qualification est à toi.`
            : `${opponent.name} ferme mieux le point (${sets}). Défaite utile — tu as progressé.`
        }`,
        playerScore: won ? 7 : 5,
        opponentScore: won ? 5 : 7,
      },
    ];

    const rewardCash = won
      ? 280 + Math.floor(player.celebrity * 2.5) + (close ? 40 : 0)
      : 90 + Math.floor(player.celebrity);
    const rewardCelebrity = won ? (close ? 7 : 5) : 2;
    const narrative = won
      ? close
        ? `Match accroché contre ${opponent.name} (${opponent.nationality}, ${sets}). Combat de titan — tu sors grandi avec une victoire référence.`
        : `Maîtrise totale sur ${surfaceFr}. Tu bats ${opponent.name} (${sets}). Les recruteurs notent ton nom, la carrière décolle.`
      : `Défaite formative face à ${opponent.name} (${opponent.nationality}, ${sets}). Tu sens exactement ce qu'il faut travailler — le prochain match sera différent.`;

    const updated = await this.prisma.player.update({
      where: { id: player.id },
      data: {
        cash: player.cash + rewardCash,
        celebrity: clamp(player.celebrity + rewardCelebrity),
        morale: clamp(player.morale + (won ? 8 : -4)),
        fatigue: clamp(player.fatigue + 12),
        form: clamp(player.form + (won ? 4 : -2)),
        tournamentsWon: won && round === 'Finale' ? player.tournamentsWon + 1 : player.tournamentsWon,
        sliceDone: true,
      },
    });

    const match = await this.prisma.matchResult.create({
      data: {
        playerId: player.id,
        opponentName: opponent.name,
        opponentRank: opponent.rank,
        surface: dto.surface,
        tournamentName: tournament,
        round,
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
        phases: JSON.stringify(timeline),
      },
    });

    return {
      match,
      player: updated,
      opponent: {
        name: opponent.name,
        rank: opponent.rank,
        nationality: opponent.nationality,
        playStyle: opponent.playStyle,
      },
      tournament: {
        name: tournament,
        round,
      },
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
