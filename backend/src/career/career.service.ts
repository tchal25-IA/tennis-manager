import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

const SEASON_WEEKS = [
  { name: 'Open de Nice', surface: 'CLAY', tier: 'J100' },
  { name: 'Coupe des Alpes', surface: 'HARD', tier: 'J100' },
  { name: 'Trophée de Lyon', surface: 'CLAY', tier: 'J200' },
  { name: 'Open de Genève', surface: 'HARD', tier: 'J200' },
  { name: 'Classic de Londres', surface: 'GRASS', tier: 'J300' },
  { name: 'International de Paris', surface: 'CLAY', tier: 'J300' },
  { name: 'Masters de Montréal', surface: 'HARD', tier: 'J500' },
  { name: 'Finales Junior', surface: 'HARD', tier: 'MASTERS' },
] as const;

function sameUtcDay(a: Date | null, b = new Date()) {
  return Boolean(
    a &&
      a.getUTCFullYear() === b.getUTCFullYear() &&
      a.getUTCMonth() === b.getUTCMonth() &&
      a.getUTCDate() === b.getUTCDate(),
  );
}

@Injectable()
export class CareerService {
  constructor(private readonly prisma: PrismaService) {}

  async hub(playerId: string) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) throw new NotFoundException('Joueur introuvable');

    const dailyAvailable = !sameUtcDay(player.lastDailyClaim);
    let nextStep: 'SCENE' | 'DAILY' | 'TRAINING' | 'MATCH' = 'SCENE';
    if (player.sceneIndex >= 3 && dailyAvailable) nextStep = 'DAILY';
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
        opponentName: true,
        won: true,
        scoreline: true,
        tournamentName: true,
        round: true,
        createdAt: true,
      },
    });

    const upcomingTournament = SEASON_WEEKS[player.currentWeek - 1] ?? SEASON_WEEKS[0];
    const calendar = SEASON_WEEKS.map((event, index) => ({
      ...event,
      week: index + 1,
      status:
        index + 1 < player.currentWeek
          ? 'PLAYED'
          : index + 1 === player.currentWeek
            ? 'NEXT'
            : 'LOCKED',
    }));
    const coachUpgradeCost = player.coachLevel >= 3 ? null : player.coachLevel * 450;

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
      upcomingTournament,
      calendar,
      dailyReward: {
        available: dailyAvailable,
        amount: 120 + Math.min(player.dailyStreak, 7) * 20,
        streak: player.dailyStreak,
      },
      staff: {
        coachLevel: player.coachLevel,
        trainingBonus: player.coachLevel - 1,
        upgradeCost: coachUpgradeCost,
      },
      loopHint:
        nextStep === 'SCENE'
          ? 'Événement narratif en attente'
          : nextStep === 'DAILY'
            ? 'Récompense du jour disponible'
          : nextStep === 'TRAINING'
            ? `Semaine ${player.currentWeek}/8 — prépare ${upcomingTournament.name}`
            : nextStep === 'MATCH'
              ? `${upcomingTournament.name} est prêt — entre sur le court`
              : 'Ta carrière continue',
    };
  }

  async claimDaily(playerId: string) {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Joueur introuvable');
    if (sameUtcDay(player.lastDailyClaim)) {
      throw new BadRequestException('Récompense quotidienne déjà récupérée');
    }

    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const continued = sameUtcDay(player.lastDailyClaim, yesterday);
    const streak = continued ? Math.min(player.dailyStreak + 1, 7) : 1;
    const amount = 120 + Math.min(streak - 1, 7) * 20;
    const updated = await this.prisma.player.update({
      where: { id: playerId },
      data: {
        cash: player.cash + amount,
        dailyStreak: streak,
        lastDailyClaim: new Date(),
        morale: clamp(player.morale + 2),
      },
    });
    return { player: updated, amount, streak };
  }

  async upgradeCoach(playerId: string) {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Joueur introuvable');
    if (player.coachLevel >= 3) {
      throw new BadRequestException('Coach déjà au niveau maximum');
    }
    const cost = player.coachLevel * 450;
    if (player.cash < cost) {
      throw new BadRequestException(`Il faut ${cost} € pour améliorer le coach`);
    }
    const updated = await this.prisma.player.update({
      where: { id: playerId },
      data: { cash: player.cash - cost, coachLevel: player.coachLevel + 1 },
    });
    return { player: updated, cost, trainingBonus: updated.coachLevel - 1 };
  }

  /** Compatibilité avec l'ancien bouton : prépare la semaine suivante. */
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
    if (!player.sliceDone && !player.trainingDone) {
      return this.hub(playerId);
    }

    await this.prisma.player.update({
      where: { id: playerId },
      data: {
        sliceDone: false,
        trainingDone: false,
        fatigue: clamp(player.fatigue - 8),
        form: clamp(player.form + 1),
        morale: clamp(player.morale + 2),
      },
    });

    return this.hub(playerId);
  }
}
