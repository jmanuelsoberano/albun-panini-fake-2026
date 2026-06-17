import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Sticker } from '../../../core/models/album.models';

@Component({
  selector: 'app-pack-strip',
  templateUrl: './pack-strip.component.html',
  styleUrl: './pack-strip.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackStripComponent {
  readonly stickers = input.required<readonly Sticker[]>();
}
