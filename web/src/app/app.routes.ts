import { Routes } from '@angular/router';
import { ChallengesPageComponent } from './features/challenges/challenges-page.component';
import { CollectionPageComponent } from './features/collection/collection-page.component';
import { CountriesPageComponent } from './features/countries/countries-page.component';
import { StadiumsPageComponent } from './features/stadiums/stadiums-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'coleccion' },
  { path: 'coleccion', component: CollectionPageComponent },
  { path: 'paises', component: CountriesPageComponent },
  { path: 'sedes', component: StadiumsPageComponent },
  { path: 'retos', component: ChallengesPageComponent },
  { path: '**', redirectTo: 'coleccion' },
];
