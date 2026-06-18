import type { Team } from './album.models';

export type TournamentTeam = Team;
export type MatchPhase =
  | 'group'
  | 'round-of-32'
  | 'round-of-16'
  | 'quarterfinal'
  | 'semifinal'
  | 'third-place'
  | 'final';
export type MatchStatus = 'scheduled' | 'live' | 'finished';
export type MatchEventType = 'goal';

export interface TournamentGroup {
  readonly id: string;
  readonly name: string;
  readonly teamIds: readonly string[];
}

export interface MatchEvent {
  readonly id: string;
  readonly minute: number | null;
  readonly teamId: string;
  readonly playerName: string;
  readonly type: MatchEventType;
}

export interface TournamentMatch {
  readonly id: string;
  readonly phase: MatchPhase;
  readonly groupId?: string;
  readonly homeTeamId: string;
  readonly awayTeamId: string;
  readonly homeScore: number | null;
  readonly awayScore: number | null;
  readonly status: MatchStatus;
  readonly venue: string;
  readonly kickoffLabel: string;
  readonly events: readonly MatchEvent[];
}

export interface StandingRow {
  readonly teamId: string;
  readonly played: number;
  readonly wins: number;
  readonly draws: number;
  readonly losses: number;
  readonly goalsFor: number;
  readonly goalsAgainst: number;
  readonly goalDifference: number;
  readonly points: number;
}

export interface TopScorerRow {
  readonly teamId: string;
  readonly playerName: string;
  readonly goals: number;
}

export interface BracketRound {
  readonly id: string;
  readonly name: string;
  readonly phase: Exclude<MatchPhase, 'group'>;
  readonly matchIds: readonly string[];
}
