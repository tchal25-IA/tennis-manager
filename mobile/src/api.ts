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
  nextStep: 'SCENE' | 'TRAINING' | 'MATCH' | 'DONE';
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
};

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api';

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
    request<Player>('/players', { method: 'POST', body: JSON.stringify(body) }),

  getPlayer: (id: string) => request<Player>(`/players/${id}`),

  hub: (playerId: string) => request<HubResponse>(`/career/${playerId}/hub`),

  rematch: (playerId: string) =>
    request<HubResponse>(`/career/${playerId}/rematch`, { method: 'POST' }),

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
    trainingType: 'PHYSIQUE' | 'TECHNIQUE' | 'MENTAL';
  }) =>
    request<{ player: Player; trainingType: string }>('/training/do', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
