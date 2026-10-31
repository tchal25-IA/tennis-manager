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
  { name: 'Open de Nice', surface: 'CLAY', tier: 'ATP 250', major: false },
  { name: 'Open d’Australie', surface: 'HARD', tier: 'GRAND CHELEM', major: true },
  { name: 'Masters de Monte-Carlo', surface: 'CLAY', tier: 'MASTERS 1000', major: false },
  { name: 'Roland-Garros', surface: 'CLAY', tier: 'GRAND CHELEM', major: true },
  { name: 'Queen’s Club', surface: 'GRASS', tier: 'ATP 500', major: false },
  { name: 'Wimbledon', surface: 'GRASS', tier: 'GRAND CHELEM', major: true },
  { name: 'Masters de Toronto', surface: 'HARD', tier: 'MASTERS 1000', major: false },
  { name: 'US Open', surface: 'HARD', tier: 'GRAND CHELEM', major: true },
  { name: 'Paris Masters', surface: 'HARD', tier: 'MASTERS 1000', major: false },
  { name: 'Finales mondiales', surface: 'HARD', tier: 'FINALS', major: true },
] as const;

const EVENTS = [
  {
    title: 'Le rival te provoque',
    speaker: 'Lucas Vermeer',
    body: '« Ton classement est flatteur. Sur le court central, tu ne tiendras pas deux sets. » Les caméras attendent ta réponse.',
    choices: [
      { id: 'FIRE', label: 'Répondre : rendez-vous en finale', morale: 4, celebrity: 3, rival: 8 },
      { id: 'CALM', label: 'Laisser la raquette parler', morale: 2, celebrity: 0, rival: 3 },
    ],
  },
  {
    title: 'Dilemme du sponsor',
    speaker: 'Maya Laurent · agente',
    body: 'Une séance photo est prévue la veille du tournoi. C’est bon pour ta marque, moins pour ta récupération.',
    choices: [
      { id: 'MEDIA', label: 'Honorer le contrat', morale: 1, celebrity: 4, cash: 180, fatigue: 8 },
      { id: 'REST', label: 'Protéger la performance', morale: 3, celebrity: -1, fatigue: -6 },
    ],
  },
  {
    title: 'Alerte du staff médical',
    speaker: 'Dr. Sofia Bellini',
    body: 'Une raideur apparaît à l’épaule. Rien de grave, mais le prochain bloc doit être adapté.',
    choices: [
      { id: 'CARE', label: 'Suivre le protocole du physio', health: 8, fatigue: -8, cash: -80 },
      { id: 'PUSH', label: 'Continuer à pleine intensité', technique: 2, health: -8, morale: 2 },
    ],
  },
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
    const eventKey = `${player.currentSeason}-${player.currentWeek}`;
    const weeklyEvent = EVENTS[(player.currentWeek - 1) % EVENTS.length];
    const eventAvailable =
      player.sceneIndex >= 3 && player.resolvedEventKey !== eventKey;
    let nextStep: 'SCENE' | 'DAILY' | 'EVENT' | 'RECOVERY' | 'TRAINING' | 'MATCH' = 'SCENE';
    if (player.sceneIndex >= 3 && player.injury !== 'NONE') nextStep = 'RECOVERY';
    else if (player.sceneIndex >= 3 && dailyAvailable) nextStep = 'DAILY';
    else if (eventAvailable) nextStep = 'EVENT';
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
      major: event.major,
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
        physioLevel: player.physioLevel,
        agentLevel: player.agentLevel,
      },
      weeklyEvent: eventAvailable ? weeklyEvent : null,
      equipment: {
        racket: player.racket,
        shoes: player.shoes,
        offers: [
          { id: 'RACKET_PRO', label: 'Raquette ProSpin X', slot: 'RACKET', cost: 550, bonus: '+3 technique en match' },
          { id: 'SHOES_PRO', label: 'Chaussures CourtFly', slot: 'SHOES', cost: 420, bonus: '-5 fatigue en match' },
        ],
      },
      sponsors: [
        { id: 'COURTVISION', name: 'CourtVision', bonus: '+80 € par match', requirement: 0 },
        { id: 'ACE', name: 'Ace Athletics', bonus: '+140 € par victoire', requirement: 15 },
        { id: 'MAJOR', name: 'Major Sports', bonus: '+220 € en Grand Chelem', requirement: 35 },
      ],
      rival: {
        name: 'Lucas Vermeer',
        score: player.rivalScore,
        status: player.rivalScore >= 25 ? 'RIVALITÉ BRÛLANTE' : 'RIVALITÉ NAISSANTE',
      },
      health: {
        value: player.health,
        injury: player.injury,
        risk: player.fatigue >= 65 ? 'ÉLEVÉ' : player.fatigue >= 40 ? 'MODÉRÉ' : 'FAIBLE',
      },
      trophies: {
        titles: player.tournamentsWon,
        grandSlams: player.grandSlams,
        season: player.currentSeason,
      },
      loopHint:
        nextStep === 'SCENE'
          ? 'Événement narratif en attente'
          : nextStep === 'DAILY'
            ? 'Récompense du jour disponible'
          : nextStep === 'EVENT'
            ? `${weeklyEvent.speaker} veut te parler`
          : nextStep === 'RECOVERY'
            ? `Infirmerie — ${player.injury}`
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

  async resolveEvent(playerId: string, choiceId: string) {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Joueur introuvable');
    const event = EVENTS[(player.currentWeek - 1) % EVENTS.length];
    const choice = event.choices.find((item) => item.id === choiceId) as any;
    if (!choice) throw new BadRequestException('Choix narratif invalide');
    const eventKey = `${player.currentSeason}-${player.currentWeek}`;
    if (player.resolvedEventKey === eventKey) {
      throw new BadRequestException('Événement déjà résolu cette semaine');
    }
    const updated = await this.prisma.player.update({
      where: { id: playerId },
      data: {
        morale: clamp(player.morale + (choice.morale ?? 0)),
        celebrity: clamp(player.celebrity + (choice.celebrity ?? 0)),
        cash: Math.max(0, player.cash + (choice.cash ?? 0)),
        fatigue: clamp(player.fatigue + (choice.fatigue ?? 0)),
        health: clamp(player.health + (choice.health ?? 0)),
        technique: clamp(player.technique + (choice.technique ?? 0)),
        rivalScore: clamp(player.rivalScore + (choice.rival ?? 0)),
        resolvedEventKey: eventKey,
      },
    });
    return { player: updated, eventTitle: event.title, choiceLabel: choice.label };
  }

  async upgradeStaff(playerId: string, role: string) {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Joueur introuvable');
    const key =
      role === 'coach' ? 'coachLevel' : role === 'physio' ? 'physioLevel' : role === 'agent' ? 'agentLevel' : null;
    if (!key) throw new BadRequestException('Rôle de staff inconnu');
    const level = player[key];
    if (level >= 3) throw new BadRequestException('Membre du staff au niveau maximum');
    const cost = level * (role === 'coach' ? 450 : 350);
    if (player.cash < cost) throw new BadRequestException(`Il faut ${cost} €`);
    const updated = await this.prisma.player.update({
      where: { id: playerId },
      data: { cash: player.cash - cost, [key]: level + 1 },
    });
    return { player: updated, role, cost };
  }

  async buyEquipment(playerId: string, item: string) {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Joueur introuvable');
    const offer =
      item === 'RACKET_PRO'
        ? { cost: 550, data: { racket: 'PROSPIN_X' } }
        : item === 'SHOES_PRO'
          ? { cost: 420, data: { shoes: 'COURTFLY' } }
          : null;
    if (!offer) throw new BadRequestException('Équipement inconnu');
    if (player.cash < offer.cost) throw new BadRequestException(`Il faut ${offer.cost} €`);
    const updated = await this.prisma.player.update({
      where: { id: playerId },
      data: { cash: player.cash - offer.cost, ...offer.data },
    });
    return { player: updated, item, cost: offer.cost };
  }

  async signSponsor(playerId: string, sponsor: string) {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Joueur introuvable');
    const requirements: Record<string, number> = { COURTVISION: 0, ACE: 15, MAJOR: 35 };
    if (!(sponsor in requirements)) throw new BadRequestException('Sponsor inconnu');
    if (player.celebrity < requirements[sponsor]) {
      throw new BadRequestException(`Il faut ${requirements[sponsor]} de célébrité`);
    }
    const updated = await this.prisma.player.update({
      where: { id: playerId },
      data: { sponsor },
    });
    return { player: updated, sponsor };
  }

  async recover(playerId: string) {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Joueur introuvable');
    const cost = Math.max(40, 140 - player.physioLevel * 30);
    if (player.cash < cost) throw new BadRequestException(`Il faut ${cost} € pour les soins`);
    const updated = await this.prisma.player.update({
      where: { id: playerId },
      data: {
        cash: player.cash - cost,
        injury: 'NONE',
        health: clamp(player.health + 25 + player.physioLevel * 8),
        fatigue: clamp(player.fatigue - 20),
      },
    });
    return { player: updated, cost };
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
