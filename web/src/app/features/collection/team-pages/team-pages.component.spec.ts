import { TestBed } from '@angular/core/testing';
import { albumStickers } from '../../../core/data/album-catalog';
import { TeamPagesComponent } from './team-pages.component';

describe('TeamPagesComponent', () => {
  it('renders one page per tournament team', () => {
    const fixture = TestBed.createComponent(TeamPagesComponent);
    fixture.componentRef.setInput('stickers', albumStickers);
    fixture.componentRef.setInput('copies', {});
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.team-page').length).toBe(48);
    expect(compiled.querySelectorAll('app-sticker-card').length).toBe(240);
  });
});
