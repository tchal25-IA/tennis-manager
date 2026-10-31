export type Player = {
  id: string;
  firstName: string;
  lastName: string;
  nationality: string;
  playStyle: string;
  socialOrigin: string;
  preferredSurface: string;
  dominantHand: string;
  technique: number;
  endurance: number;
  mental: number;
  celebrity: number;
  cash: number;
  morale: number;
  form: number;
  fatigue: number;
  careerStage: string;
  currentSeason: number;
  currentWeek: number;
  ranking: number;
  tournamentsWon: number;
  coachLevel: number;
  dailyStreak: number;
  sceneIndex: number;
  sliceDone: boolean;
};

export type SceneChoice = {
  id: string;
  label: string;
  deltaTechnique: number;
  deltaEndurance: number;
  deltaMental: number;
  deltaCelebrity: number;
  deltaCash: number;
  deltaMorale: number;
};

export type Scene = {
  id: string;
  orderIndex: number;
  title: string;
  body: string;
  speaker: string;
  choices: SceneChoice[];
};

export type MatchReward = {
  cash: number;
  celebrity: number;
  won: boolean;
  scoreline: string;
  narrative: string;
};

export type MatchBeat = {
  phase: string;
  title: string;
  detail: string;
};

export type HubResponse = {
  player: Player;
  nextStep: 'SCENE' | 'DAILY' | 'TRAINING' | 'MATCH';
  loopHint: string;
  matchesPlayed: number;
  canRematch: boolean;
  lastMatch: {
    narrative: string;
    won: boolean;
    scoreline: string;
    rewardCash: number;
    rewardCelebrity: number;
    opponentName?: string;
  } | null;
  stats: {
    wins: number;
    losses: number;
    winRate: number;
    tournamentsWon: number;
    currentSeason: number;
  };
  upcomingTournament: {
    name: string;
    surface: 'CLAY' | 'GRASS' | 'HARD';
    tier: string;
  };
  calendar: {
    week: number;
    name: string;
    surface: string;
    tier: string;
    status: 'PLAYED' | 'NEXT' | 'LOCKED';
  }[];
  dailyReward: { available: boolean; amount: number; streak: number };
  staff: {
    coachLevel: number;
    trainingBonus: number;
    upgradeCost: number | null;
  };
};

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'production'
    ? 'https://tennis-manager-api-thibauds-projects-528bdc51.vercel.app/api'
    : 'http://localhost:3001/api');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    let detail = `Erreur API ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) {
        detail = Array.isArray(body.message)
          ? body.message.join(', ')
          : String(body.message);
      }
    } catch {
      const text = await res.text().catch(() => '');
      if (text) detail = text;
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  createPlayer: (body: Record<string, string>) =>
    request<Player>('/player', { method: 'POST', body: JSON.stringify(body) }),

  getPlayer: (id: string) => request<Player>(`/player/${id}`),

  hub: (playerId: string) => request<HubResponse>(`/career/${playerId}/hub`),

  rematch: (playerId: string) =>
    request<HubResponse>(`/career/${playerId}/rematch`, { method: 'POST' }),

  claimDaily: (playerId: string) =>
    request<{ player: Player; amount: number; streak: number }>(
      `/career/${playerId}/daily`,
      { method: 'POST' },
    ),

  upgradeCoach: (playerId: string) =>
    request<{ player: Player; cost: number; trainingBonus: number }>(
      `/career/${playerId}/staff/coach`,
      { method: 'POST' },
    ),

  currentScene: (playerId: string) =>
    request<{ done: boolean; player: Player; scene: Scene | null }>(
      `/narrative/${playerId}/current`,
    ),

  resolveChoice: (playerId: string, choiceId: string) =>
    request<{
      player: Player;
      next: { done: boolean; scene: Scene | null };
    }>('/narrative/choice', {
      method: 'POST',
      body: JSON.stringify({ playerId, choiceId }),
    }),

  playMatch: (body: {
    playerId: string;
    surface: string;
    preMatchTactic: string;
    rallyChoice: string;
    breakChoice: string;
    finishChoice: string;
  }) =>
    request<{
      player: Player;
      reward: MatchReward;
      opponent: { name: string };
      timeline: MatchBeat[];
    }>('/match/play', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  trainingOptions: (playerId: string) =>
    request<{ alreadyTrained: boolean; trainings: any[]; player: Player }>(
      `/training/${playerId}/options`,
    ),

  doTraining: (body: {
    playerId: string;
    trainingType: 'SERVE' | 'FOREHAND' | 'BACKHAND' | 'PHYSIQUE' | 'MENTAL';
  }) =>
    request<{ player: Player; trainingType: string }>('/training/do', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
