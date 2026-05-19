export type Plant = 'SR' | 'BP' | 'GW';

export interface Player {
  id: string;
  name: string;
  plant: Plant;
  declaredScore: number;
  scores: number[]; // 18 holes, index 0 = hole 1
}

export interface HoleScore {
  hole: number;
  par: number;
}

export interface HonestJohnResult {
  playerId: string;
  playerName: string;
  plant: Plant;
  declaredScore: number;
  actualScore: number;
  adjustmentHoles: number[];
  adjustedGrossScore: number;
  difference: number;
}

export interface PlantBattleResult {
  hole: number;
  srPlayer: Player | null;
  bpPlayer: Player | null;
  gwPlayer: Player | null;
  winner: Plant | null;
}

export interface LuckyDrawWinner {
  id: string;
  playerName: string;
  plant: Plant;
  timestamp: number;
}

export interface CourseSetup {
  holePars: number[]; // 18 holes, index 0 = hole 1
}

export interface TournamentState {
  players: Player[];
  honestJohnResults: HonestJohnResult[];
  plantBattleResults: PlantBattleResult[];
  plantScores: { SR: number; BP: number; GW: number };
  luckyDrawWinners: LuckyDrawWinner[];
  luckyDrawPool: string[]; // player IDs
  courseSetup: CourseSetup;
}
