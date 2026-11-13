import { Component, Input } from '@angular/core';

// The emblem from the centre's logo: an eight-point star around a ring of petals.
// Colours come from CSS variables so each slide theme can tint it:
//   --emblem-star, --emblem-petal (default: currentColor), --emblem-stroke (default: 9),
//   --emblem-fill (inside of the star, default: none).

const R = 92;                                  // outer star points
const r = R * Math.cos(Math.PI / 4) / Math.cos(Math.PI / 8); // inner corners (two overlapping squares)

function polar(radius: number, degrees: number): string {
  const t = degrees * Math.PI / 180;
  return `${(radius * Math.cos(t)).toFixed(2)},${(radius * Math.sin(t)).toFixed(2)}`;
}

const STAR_POINTS = Array.from({ length: 16 }, (_, k) => polar(k % 2 ? r : R, -90 + k * 22.5)).join(' ');

// One petal pointing up (y is negative upwards), as [x, y] pairs; rotated eight times.
const PETAL: [number, number][] = [[0, -33], [11, -44], [8, -72], [0, -82], [-8, -72], [-11, -44]];
const PETALS = Array.from({ length: 8 }, (_, k) => {
  const t = k * Math.PI / 4;
  const [cos, sin] = [Math.cos(t), Math.sin(t)];
  return PETAL.map(([x, y]) => `${(x * cos - y * sin).toFixed(2)},${(x * sin + y * cos).toFixed(2)}`).join(' ');
});

@Component({
  selector: 'app-display-emblem',
  template: `
    <svg viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
      <polygon class="star" [attr.points]="star" />
      <ng-container *ngIf="!starOnly">
        <circle class="petal" r="22" />
        <polygon *ngFor="let p of petals" class="petal" [attr.points]="p" />
      </ng-container>
    </svg>
  `,
  styles: [`
    :host { display: inline-block; line-height: 0; }
    svg { width: 100%; height: 100%; overflow: visible; }
    .star, .petal { fill: none; stroke-width: var(--emblem-stroke, 9); stroke-linejoin: round; }
    .star { stroke: var(--emblem-star, currentColor); fill: var(--emblem-fill, none); }
    .petal { stroke: var(--emblem-petal, currentColor); }
  `]
})
export class DisplayEmblemComponent {
  /** Draw only the star outline (for small ornaments). */
  @Input() starOnly = false;
  readonly star = STAR_POINTS;
  readonly petals = PETALS;
}
