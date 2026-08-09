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

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Erreur API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  createPlayer: (body: Record<string, string>) =>
    request<Player>('/players', { method: 'POST', body: JSON.stringify(body) }),

  getPlayer: (id: string) => request<Player>(`/players/${id}`),

  hub: (playerId: string) =>
    request<{
      player: Player;
      nextStep: 'SCENE' | 'MATCH' | 'DONE';
      loopHint: string;
      lastMatch: { narrative: string; won: boolean; scoreline: string } | null;
    }>(`/career/${playerId}/hub`),

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
    keyMomentChoice: string;
  }) =>
    request<{ player: Player; reward: MatchReward }>('/match/play', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
