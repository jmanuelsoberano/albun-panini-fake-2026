import { TestBed } from '@angular/core/testing';
import { albumStickers } from '../../../core/data/album-catalog';
import { PackDialogComponent } from './pack-dialog.component';

describe('PackDialogComponent', () => {
  it('renders the pack cards and emits open another', () => {
    const fixture = TestBed.createComponent(PackDialogComponent);
    let openAnotherCount = 0;

    fixture.componentRef.setInput('stickers', albumStickers.slice(0, 5));
    fixture.componentRef.setInput('copies', {});
    fixture.componentInstance.openAnotherPack.subscribe(() => (openAnotherCount += 1));
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const dialog = compiled.querySelector('[role="dialog"]') as HTMLElement;
    const closeButton = compiled.querySelector('.close-btn') as HTMLButtonElement;
    const backdrop = compiled.querySelector('.backdrop') as HTMLElement;

    expect(dialog.getAttribute('aria-describedby')).toBe('pack-dialog-description');
    expect(closeButton.getAttribute('aria-label')).toBe('Cerrar sobre');
    expect(backdrop.getAttribute('aria-hidden')).toBe('true');
    expect(compiled.querySelector('.pack-summary')?.textContent).toContain('5');
    expect(compiled.querySelector('.pack-summary')?.textContent).toContain('nuevos');
    expect(compiled.querySelectorAll('app-sticker-card').length).toBe(5);

    const button = [...compiled.querySelectorAll('button')].find((item) =>
      item.textContent?.includes('Abrir otro sobre'),
    ) as HTMLButtonElement;
    button.click();

    expect(openAnotherCount).toBe(1);
  });

  it('hides the open another action for online packs', () => {
    const fixture = TestBed.createComponent(PackDialogComponent);

    fixture.componentRef.setInput('stickers', albumStickers.slice(0, 5));
    fixture.componentRef.setInput('copies', {});
    fixture.componentRef.setInput('sourceLabel', 'Sobre abierto');
    fixture.componentRef.setInput('canOpenAnother', false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Sobre abierto');
    expect(compiled.textContent).not.toContain('Abrir otro sobre');
  });
});
