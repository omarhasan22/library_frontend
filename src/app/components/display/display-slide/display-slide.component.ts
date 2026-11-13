import { Component, Input, inject } from '@angular/core';
import { map } from 'rxjs';
import { DisplayService } from '../../../services/display.service';
import { DisplaySlide, DisplayTheme, clockParts } from '../../../models/display.model';

/**
 * Renders one slide with its template, at 1920x1080 (or whatever box it is given; layouts flex).
 * Used by the screen, the admin preview and the thumbnails - put it inside <app-display-stage>.
 */
@Component({
  selector: 'app-display-slide',
  templateUrl: './display-slide.component.html',
  styleUrls: ['./display-slide.component.css']
})
export class DisplaySlideComponent {
  @Input({ required: true }) slide: DisplaySlide;
  @Input() imageUrl: string | null = null;
  @Input() hijriOffset = 0;
  /** Entrance animations (on the screen). Off for thumbnails and the editor. */
  @Input() animate = false;
  /** Admin editor: shows an "upload an image" hint where an image is missing. */
  @Input() editing = false;

  private display = inject(DisplayService);
  readonly clock$ = this.display.now$.pipe(map(date => clockParts(date, this.hijriOffset)));

  get theme(): DisplayTheme {
    return this.slide.theme || 'teal';
  }

  get logoSrc(): string {
    return this.theme === 'light' ? 'assets/img/display/logo.png' : 'assets/img/display/logo-white.png';
  }

  get patternUrl(): string {
    return `url(assets/img/display/pattern-${this.theme === 'light' ? 'teal' : 'white'}.svg)`;
  }

  get blurBackground(): string {
    return this.imageUrl ? `url("${this.imageUrl}")` : 'none';
  }

  /** Steps the font size down for longer texts so they still fit. */
  size(text: string | null | undefined, long: number, xlong: number): string {
    const length = (text || '').length;
    return length > xlong ? 'xlong' : length > long ? 'long' : '';
  }
}
