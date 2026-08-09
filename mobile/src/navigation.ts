export type RootStackParamList = {
  Create: undefined;
  Hub: { playerId: string };
  Scene: { playerId: string };
  Match: { playerId: string };
  Reward: {
    playerId: string;
    reward?: {
      cash: number;
      celebrity: number;
      won: boolean;
      scoreline: string;
      narrative: string;
    };
    timeline?: { phase: string; title: string; detail: string }[];
    opponentName?: string;
  };
};
