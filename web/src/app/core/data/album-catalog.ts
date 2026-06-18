import type { Rarity, Sticker } from '../models/album.models';
import { squadHighlights, tournamentTeams } from './worldcup-facts';

const roles = ['Referente', 'Portero', 'Defensa', 'Mediocampo', 'Delantero'] as const;

const licensedPortraits: Readonly<
  Record<
    string,
    {
      readonly portrait: string;
      readonly portraitCredit: string;
      readonly portraitLicense: string;
      readonly portraitSourceUrl: string;
    }
  >
> = {
  'FG-005': {
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Mahrez_2021.jpg',
    portraitCredit: 'Jeanpierrekepseu',
    portraitLicense: 'CC BY-SA 4.0',
    portraitSourceUrl: 'https://commons.wikimedia.org/wiki/File:Mahrez_2021.jpg',
  },
  'FG-006': {
    portrait:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Lionel_Messi_White_House_2026_%283x4_cropped%29.jpg/960px-Lionel_Messi_White_House_2026_%283x4_cropped%29.jpg',
    portraitCredit: 'The White House',
    portraitLicense: 'Public domain',
    portraitSourceUrl:
      'https://commons.wikimedia.org/wiki/File:Lionel_Messi_White_House_2026_(3x4_cropped).jpg',
  },
  'FG-021': {
    portrait:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Kevin_De_Bruyne_USMNT_v_Belgium_Mar_28_2026-64_%28cropped%29.jpg/960px-Kevin_De_Bruyne_USMNT_v_Belgium_Mar_28_2026-64_%28cropped%29.jpg',
    portraitCredit: 'Bryan Berlin',
    portraitLicense: 'CC BY-SA 4.0',
    portraitSourceUrl:
      'https://commons.wikimedia.org/wiki/File:Kevin_De_Bruyne_USMNT_v_Belgium_Mar_28_2026-64_(cropped).jpg',
  },
};

export const albumStickers: readonly Sticker[] = tournamentTeams.flatMap((team, teamIndex) =>
  roles.map((role, roleIndex) => {
    const number = teamIndex * roles.length + roleIndex + 1;
    const id = `FG-${String(number).padStart(3, '0')}`;
    const rarity: Rarity = roleIndex === 0 ? 'holografico' : roleIndex === 4 ? 'brillante' : 'base';
    const player = squadHighlights[team.id]?.[roleIndex];
    const portrait = licensedPortraits[id];

    return {
      id,
      number,
      teamId: team.id,
      team: team.name,
      flagCode: team.flagCode,
      confederation: team.confederation,
      colors: team.colors,
      role: player?.role ?? role,
      rarity,
      name: player?.name ?? `Jugador ${team.code}-${roleIndex + 1}`,
      position: player?.position ?? '',
      shirt: player?.shirt ?? '',
      height: player?.height ?? '',
      portrait: portrait?.portrait ?? '',
      portraitCredit: portrait?.portraitCredit ?? '',
      portraitLicense: portrait?.portraitLicense ?? '',
      portraitSourceUrl: portrait?.portraitSourceUrl ?? '',
      privateSlot: `private-assets/players/fg-${String(number).padStart(3, '0')}.webp`,
      caption: `Ficha ${String(number).padStart(3, '0')} del álbum Mundial 2026.`,
      note: portrait
        ? `Cromo ${rarity} de ${team.name}. Datos reales de plantilla; foto con fuente y licencia documentadas.`
        : `Cromo ${rarity} de ${team.name}. Datos reales de plantilla; sin foto, escudo, logo ni arte protegido.`,
    };
  }),
);

export const confederations: readonly string[] = [
  ...new Set(tournamentTeams.map((team) => team.confederation)),
];
