import { Routes } from '@angular/router';
import { ChallengesPageComponent } from './features/challenges/challenges-page.component';
import { CollectionPageComponent } from './features/collection/collection-page.component';
import { CountriesPageComponent } from './features/countries/countries-page.component';
import { HomePageComponent } from './features/home/home-page.component';
import { RoomPageComponent } from './features/room/room-page.component';
import { StadiumsPageComponent } from './features/stadiums/stadiums-page.component';
import { TournamentBracketPageComponent } from './features/tournament/tournament-bracket-page.component';
import { TournamentGroupsPageComponent } from './features/tournament/tournament-groups-page.component';
import { TournamentMatchCenterPageComponent } from './features/tournament/tournament-match-center-page.component';
import { TournamentMatchesPageComponent } from './features/tournament/tournament-matches-page.component';
import { TournamentOverviewPageComponent } from './features/tournament/tournament-overview-page.component';
import { TournamentTeamPageComponent } from './features/tournament/tournament-team-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  { path: 'inicio', component: HomePageComponent },
  { path: 'coleccion', component: CollectionPageComponent },
  { path: 'torneo', component: TournamentOverviewPageComponent },
  { path: 'torneo/grupos', component: TournamentGroupsPageComponent },
  { path: 'torneo/partidos', component: TournamentMatchesPageComponent },
  { path: 'torneo/partidos/:matchId', component: TournamentMatchCenterPageComponent },
  { path: 'torneo/llaves', component: TournamentBracketPageComponent },
  { path: 'torneo/equipos/:teamId', component: TournamentTeamPageComponent },
  { path: 'equipos', component: CountriesPageComponent },
  { path: 'paises', pathMatch: 'full', redirectTo: 'equipos' },
  { path: 'sedes', component: StadiumsPageComponent },
  { path: 'retos', component: ChallengesPageComponent },
  { path: 'sala', component: RoomPageComponent },
  { path: '**', redirectTo: 'coleccion' },
];
