import { TestBed } from '@angular/core/testing';
import { SessionPanelComponent } from './session-panel.component';

describe('SessionPanelComponent', () => {
  it('renders a public read-only state while sign-in is unavailable', async () => {
    const fixture = TestBed.createComponent(SessionPanelComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Solo lectura');
    expect(compiled.textContent).toContain('Iniciar sesión');
    expect(compiled.textContent).toContain('Abrir sobre');
    expect(compiled.textContent).not.toContain('Modo local');
    expect(compiled.textContent).not.toContain('Firebase');
  });

  it('opens the sign-in prompt when a public user tries to play', async () => {
    const fixture = TestBed.createComponent(SessionPanelComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const openPackButton = [...compiled.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Abrir sobre'),
    ) as HTMLButtonElement;

    openPackButton.click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Inicia sesión para jugar');
    expect(compiled.querySelector('[role="dialog"]')).not.toBeNull();
  });
});
