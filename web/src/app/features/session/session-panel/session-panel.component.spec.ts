import { TestBed } from '@angular/core/testing';
import { SessionPanelComponent } from './session-panel.component';

describe('SessionPanelComponent', () => {
  it('renders local mode while Firebase is not configured', async () => {
    const fixture = TestBed.createComponent(SessionPanelComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Modo local');
    expect(compiled.textContent).toContain('Abrir sobre local');
  });
});
