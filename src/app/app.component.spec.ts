import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';

describe('AppComponent (shell)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppComponent],
      // Header, toasts and dialogs are tested on their own; here only the shell's structure matters.
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('renders the header, a focusable <main> landmark and the footer', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.componentInstance.isDisplayRoute = false;
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-navbar')).not.toBeNull();
    const main = el.querySelector('main#main');
    expect(main?.getAttribute('tabindex')).toBe('-1');
    expect(el.querySelector('footer.app-footer')).not.toBeNull();
    expect(el.querySelector('app-toast-host')).not.toBeNull();
  });

  it('hides header and footer on the display screen', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.componentInstance.isDisplayRoute = true;
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-navbar')).toBeNull();
    expect(el.querySelector('footer')).toBeNull();
    expect(el.querySelector('main#main')).not.toBeNull();
  });
});
