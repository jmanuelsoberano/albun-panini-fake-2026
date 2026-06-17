import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AlbumStore } from '../../core/state/album-store.service';

@Component({
  selector: 'app-challenges-page',
  templateUrl: './challenges-page.component.html',
  styleUrl: './challenges-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChallengesPageComponent {
  protected readonly album = inject(AlbumStore);
}
