import type { Rarity, Sticker } from '../models/album.models';
import { squadHighlights, tournamentTeams } from './worldcup-facts';

const roles = ['Referente', 'Portero', 'Defensa', 'Mediocampo', 'Delantero'] as const;

export const albumStickers: readonly Sticker[] = tournamentTeams.flatMap((team, teamIndex) =>
  roles.map((role, roleIndex) => {
    const number = teamIndex * roles.length + roleIndex + 1;
    const rarity: Rarity = roleIndex === 0 ? 'holografico' : roleIndex === 4 ? 'brillante' : 'base';
    const player = squadHighlights[team.id]?.[roleIndex];

    return {
      id: `FG-${String(number).padStart(3, '0')}`,
      number,
      teamId: team.id,
      team: team.name,
      confederation: team.confederation,
      colors: team.colors,
      role: player?.role ?? role,
      rarity,
      name: player?.name ?? `Jugador ${team.code}-${roleIndex + 1}`,
      position: player?.position ?? '',
      shirt: player?.shirt ?? '',
      height: player?.height ?? '',
      portrait: '',
      privateSlot: `private-assets/players/fg-${String(number).padStart(3, '0')}.webp`,
      caption: `Ficha ${String(number).padStart(3, '0')} lista para retrato privado local.`,
      note: `Cromo ${rarity} de ${team.name}. Nombre factual de plantilla publica; sin foto, escudo, logo ni arte oficial.`,
    };
  }),
);

export const confederations: readonly string[] = [
  ...new Set(tournamentTeams.map((team) => team.confederation)),
];
