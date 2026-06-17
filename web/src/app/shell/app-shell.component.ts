import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  protected readonly navItems = [
    { label: 'Coleccion', path: '/coleccion' },
    { label: 'Paises', path: '/paises' },
    { label: 'Sedes', path: '/sedes' },
    { label: 'Retos', path: '/retos' },
  ] as const;
}
