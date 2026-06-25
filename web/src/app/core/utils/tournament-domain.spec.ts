import { bracketRounds, tournamentGroups, tournamentMatches } from '../data/tournament-fixtures';
import type { TournamentGroup, TournamentMatch } from '../models/tournament.models';
import {
  calculateGroupStandings,
  calculateTopScorers,
  deriveBracketRounds,
  deriveQualifiedTeamIds,
  featuredMatchStatusLabel,
  selectFeaturedMatch,
  selectFeaturedMatches,
  validateMatchScoreEvents,
  winnerOf,
} from './tournament-domain';

describe('tournament-domain utilities', () => {
  it('calculates standings from finished matches', () => {
    const group: TournamentGroup = {
      id: 'GA',
      name: 'Grupo Test',
      teamIds: ['A', 'B', 'C'],
    };
    const matches: readonly TournamentMatch[] = [
      {
        id: 'M1',
        phase: 'group',
        groupId: 'GA',
        homeTeamId: 'A',
        awayTeamId: 'B',
        homeScore: 2,
        awayScore: 0,
        status: 'finished',
        venue: 'Foro Test',
        kickoffLabel: 'Jornada 1',
        events: [],
      },
      {
        id: 'M2',
        phase: 'group',
        groupId: 'GA',
        homeTeamId: 'B',
        awayTeamId: 'C',
        homeScore: 1,
        awayScore: 1,
        status: 'finished',
        venue: 'Foro Test',
        kickoffLabel: 'Jornada 2',
        events: [],
      },
    ];

    expect(calculateGroupStandings(group, matches)).toEqual([
      {
        teamId: 'A',
        played: 1,
        wins: 1,
        draws: 0,
        losses: 0,
        goalsFor: 2,
        goalsAgainst: 0,
        goalDifference: 2,
        points: 3,
      },
      {
        teamId: 'C',
        played: 1,
        wins: 0,
        draws: 1,
        losses: 0,
        goalsFor: 1,
        goalsAgainst: 1,
        goalDifference: 0,
        points: 1,
      },
      {
        teamId: 'B',
        played: 2,
        wins: 0,
        draws: 1,
        losses: 1,
        goalsFor: 1,
        goalsAgainst: 3,
        goalDifference: -2,
        points: 1,
      },
    ]);
  });

  it('keeps fixture goal events aligned with scoreboards', () => {
    expect(tournamentMatches.every(validateMatchScoreEvents)).toBe(true);
  });

  it('allows verified scoreboards while scorers remain pending', () => {
    expect(
      validateMatchScoreEvents({
        id: 'M-test',
        phase: 'group',
        groupId: 'GA',
        homeTeamId: 'A',
        awayTeamId: 'B',
        homeScore: 1,
        awayScore: 0,
        status: 'finished',
        venue: 'Foro Test',
        kickoffLabel: 'Jornada 1',
        events: [],
      }),
    ).toBe(true);
  });

  it('calculates top scorers from goal events', () => {
    const topScorers = calculateTopScorers(tournamentMatches, 5);

    expect(topScorers.length).toBe(5);
    expect(topScorers[0].goals).toBeGreaterThanOrEqual(topScorers[4].goals);
  });

  it('derives 32 qualified teams without duplicates', () => {
    const qualified = deriveQualifiedTeamIds(tournamentGroups, tournamentMatches);

    expect(qualified).toHaveLength(32);
    expect(new Set(qualified).size).toBe(32);
  });

  it('derives bracket rounds and winners from knockout matches', () => {
    const derivedRounds = deriveBracketRounds(tournamentMatches);
    const finalRound = derivedRounds.find((round) => round.id === 'final');
    const finalMatch = tournamentMatches.find((match) => match.phase === 'final');

    expect(derivedRounds.map((round) => round.name)).toEqual(
      bracketRounds.map((round) => round.name),
    );
    expect(finalRound?.matchIds).toHaveLength(1);
    expect(finalMatch ? winnerOf(finalMatch) : null).toBeNull();
  });

  it('selects a contextual featured match instead of the fixed opener', () => {
    const featured = selectFeaturedMatch(tournamentMatches);

    expect(featured).not.toBeNull();
    expect(featured?.id).not.toBe('M01');
    expect(featured ? featuredMatchStatusLabel(featured) : '').toBe('Proximo partido');
  });

  it('selects a contextual match strip instead of a single fixed opener', () => {
    const featured = selectFeaturedMatches(tournamentMatches, 3);

    expect(featured.map((match) => match.id)).toEqual(['M55', 'M56', 'M57']);
    expect(featured.some((match) => match.id === 'M01')).toBe(false);
  });
});
