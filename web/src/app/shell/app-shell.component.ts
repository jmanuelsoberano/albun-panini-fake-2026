import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FirebaseSessionStore } from '../core/firebase/firebase-session.store';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent implements OnInit {
  protected readonly session = inject(FirebaseSessionStore);
  protected readonly mobileMenuOpen = signal(false);
  protected readonly navItems = [
    { label: 'Inicio', path: '/inicio' },
    { label: 'Álbum', path: '/coleccion' },
    { label: 'Torneo', path: '/torneo' },
    { label: 'Equipos', path: '/equipos' },
    { label: 'Sedes', path: '/sedes' },
    { label: 'Sala', path: '/sala' },
    { label: 'Retos', path: '/retos' },
  ] as const;

  ngOnInit(): void {
    void this.session.initialize();
  }

  @HostListener('document:keydown.escape')
  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((isOpen) => !isOpen);
  }

  protected skipToMain(event: Event): void {
    event.preventDefault();
    document.getElementById('main-content')?.focus();
  }
}
