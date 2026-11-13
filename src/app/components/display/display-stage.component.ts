import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';

export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

/**
 * A fixed 1920x1080 canvas scaled to fit (and centred in) its container.
 * Slides are designed once at full-HD size and look identical on the TV, in the admin preview,
 * and in the small thumbnails.
 */
@Component({
  selector: 'app-display-stage',
  template: `<div class="stage" #stage><ng-content></ng-content></div>`,
  styles: [`
    :host { display: block; position: relative; width: 100%; height: 100%; overflow: hidden; }
    .stage {
      position: absolute; top: 0; left: 0;
      width: 1920px; height: 1080px; /* STAGE_WIDTH x STAGE_HEIGHT */
      transform-origin: 0 0;
      visibility: hidden;
    }
  `]
})
export class DisplayStageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('stage', { static: true }) private stage: ElementRef<HTMLElement>;
  private observer?: ResizeObserver;

  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone) { }

  ngAfterViewInit(): void {
    // Pure layout work: no change detection needed.
    this.zone.runOutsideAngular(() => {
      this.fit();
      this.observer = new ResizeObserver(() => this.fit());
      this.observer.observe(this.host.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private fit(): void {
    const { clientWidth: w, clientHeight: h } = this.host.nativeElement;
    if (!w || !h) return;
    const scale = Math.min(w / STAGE_WIDTH, h / STAGE_HEIGHT);
    const x = (w - STAGE_WIDTH * scale) / 2;
    const y = (h - STAGE_HEIGHT * scale) / 2;
    const style = this.stage.nativeElement.style;
    style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    style.visibility = 'visible';
  }
}
