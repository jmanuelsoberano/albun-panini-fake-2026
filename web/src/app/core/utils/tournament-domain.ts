import type {
  BracketRound,
  StandingRow,
  TopScorerRow,
  TournamentGroup,
  TournamentMatch,
} from '../models/tournament.models';

function emptyStanding(teamId: string): StandingRow {
  return {
    teamId,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

function sortStandings(left: StandingRow, right: StandingRow): number {
  return (
    right.points - left.points ||
    right.goalDifference - left.goalDifference ||
    right.goalsFor - left.goalsFor ||
    left.teamId.localeCompare(right.teamId)
  );
}

function addMatchToStanding(row: StandingRow, goalsFor: number, goalsAgainst: number): StandingRow {
  const draw = goalsFor === goalsAgainst;
  const win = goalsFor > goalsAgainst;

  return {
    teamId: row.teamId,
    played: row.played + 1,
    wins: row.wins + (win ? 1 : 0),
    draws: row.draws + (draw ? 1 : 0),
    losses: row.losses + (!win && !draw ? 1 : 0),
    goalsFor: row.goalsFor + goalsFor,
    goalsAgainst: row.goalsAgainst + goalsAgainst,
    goalDifference: row.goalDifference + goalsFor - goalsAgainst,
    points: row.points + (win ? 3 : draw ? 1 : 0),
  };
}

export function validateMatchScoreEvents(match: TournamentMatch): boolean {
  if (match.homeScore === null || match.awayScore === null) {
    return match.events.length === 0;
  }

  if (match.events.length === 0) {
    return true;
  }

  const homeGoals = match.events.filter((event) => event.teamId === match.homeTeamId).length;
  const awayGoals = match.events.filter((event) => event.teamId === match.awayTeamId).length;

  return homeGoals === match.homeScore && awayGoals === match.awayScore;
}

export function calculateGroupStandings(
  group: TournamentGroup,
  matches: readonly TournamentMatch[],
): readonly StandingRow[] {
  const table = new Map(group.teamIds.map((teamId) => [teamId, emptyStanding(teamId)]));

  for (const match of matches) {
    if (match.groupId !== group.id || match.status !== 'finished') {
      continue;
    }

    if (match.homeScore === null || match.awayScore === null) {
      continue;
    }

    const homeRow = table.get(match.homeTeamId);
    const awayRow = table.get(match.awayTeamId);

    if (!homeRow || !awayRow) {
      continue;
    }

    table.set(match.homeTeamId, addMatchToStanding(homeRow, match.homeScore, match.awayScore));
    table.set(match.awayTeamId, addMatchToStanding(awayRow, match.awayScore, match.homeScore));
  }

  return [...table.values()].sort(sortStandings);
}

export function calculateAllStandings(
  groups: readonly TournamentGroup[],
  matches: readonly TournamentMatch[],
): Readonly<Record<string, readonly StandingRow[]>> {
  return Object.fromEntries(
    groups.map((group) => [group.id, calculateGroupStandings(group, matches)]),
  ) as Readonly<Record<string, readonly StandingRow[]>>;
}

export function calculateTopScorers(
  matches: readonly TournamentMatch[],
  limit = 10,
): readonly TopScorerRow[] {
  const scorers = new Map<string, TopScorerRow>();

  for (const match of matches) {
    for (const event of match.events) {
      if (event.type !== 'goal') {
        continue;
      }

      const key = `${event.teamId}:${event.playerName}`;
      const current = scorers.get(key);
      scorers.set(key, {
        teamId: event.teamId,
        playerName: event.playerName,
        goals: (current?.goals ?? 0) + 1,
      });
    }
  }

  return [...scorers.values()]
    .sort(
      (left, right) =>
        right.goals - left.goals ||
        left.teamId.localeCompare(right.teamId) ||
        left.playerName.localeCompare(right.playerName),
    )
    .slice(0, limit);
}

export function deriveQualifiedTeamIds(
  groups: readonly TournamentGroup[],
  matches: readonly TournamentMatch[],
): readonly string[] {
  const standings = groups.map((group) => calculateGroupStandings(group, matches));
  const winners = standings.map((groupStandings) => groupStandings[0]?.teamId).filter(Boolean);
  const runnersUp = standings
    .map((groupStandings) => groupStandings[1])
    .filter(Boolean)
    .sort(sortStandings)
    .slice(0, 12)
    .map((row) => row.teamId);
  const thirdPlaces = standings
    .map((groupStandings) => groupStandings[2])
    .filter(Boolean)
    .sort(sortStandings)
    .slice(0, 8)
    .map((row) => row.teamId);

  return [...new Set([...winners, ...runnersUp, ...thirdPlaces])].slice(0, 32);
}

export function winnerOf(match: TournamentMatch): string | null {
  if (match.homeScore === null || match.awayScore === null || match.homeScore === match.awayScore) {
    return null;
  }

  return match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId;
}

export function selectFeaturedMatch(matches: readonly TournamentMatch[]): TournamentMatch | null {
  return selectFeaturedMatches(matches, 1)[0] ?? null;
}

export function selectFeaturedMatches(
  matches: readonly TournamentMatch[],
  limit = 3,
): readonly TournamentMatch[] {
  const liveMatches = matches.filter((match) => match.status === 'live');

  if (liveMatches.length > 0) {
    return liveMatches.slice(0, limit);
  }

  const scheduledMatches = matches.filter((match) => match.status === 'scheduled');

  if (scheduledMatches.length > 0) {
    return scheduledMatches.slice(0, limit);
  }

  return [...matches]
    .reverse()
    .filter((match) => match.status === 'finished')
    .slice(0, limit);
}

export function featuredMatchStatusLabel(match: TournamentMatch): string {
  if (match.status === 'live') {
    return 'En vivo';
  }

  if (match.status === 'scheduled') {
    return 'Proximo partido';
  }

  return 'Ultimo resultado';
}

export function deriveBracketRounds(matches: readonly TournamentMatch[]): readonly BracketRound[] {
  const rounds = [
    ['round-of-32', 'Ronda de 32'],
    ['round-of-16', 'Octavos'],
    ['quarterfinal', 'Cuartos'],
    ['semifinal', 'Semifinales'],
    ['third-place', 'Tercer lugar'],
    ['final', 'Final'],
  ] as const;

  return rounds.map(([phase, name]) => ({
    id: phase,
    name,
    phase,
    matchIds: matches.filter((match) => match.phase === phase).map((match) => match.id),
  }));
}
