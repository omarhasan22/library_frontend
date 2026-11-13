import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { Subscription, map } from 'rxjs';
import { DisplayService } from '../../../services/display.service';
import {
  DEFAULT_DISPLAY_SETTINGS, DisplayData, DisplaySettings, DisplaySlide, FALLBACK_SLIDE, clockParts, slideStatus
} from '../../../models/display.model';

interface Layer {
  key: number;
  slide: DisplaySlide;
}

const CACHE_KEY = 'display_screen_cache';
const POLL_MS = 60_000;            // pick up the admin's changes within a minute
const RETRY_MS = 15_000;           // faster retries while there is nothing to show
const TRANSITION_MS = 1300;        // keep the previous slide underneath while the next one enters
const RELOAD_AFTER_MS = 24 * 3600_000; // reload daily to pick up new versions of the site
const TICKER_SPEED = 110;          // px per second
const IDLE_MS = 3000;

/**
 * The page the library's screen opens (/display): plays the enabled slides in a loop.
 * Public, so a TV only needs the URL. Keeps showing the last data it had if the network drops.
 */
@Component({
  selector: 'app-display-screen',
  templateUrl: './display-screen.component.html',
  styleUrls: ['./display-screen.component.css']
})
export class DisplayScreenComponent implements OnInit, OnDestroy {
  settings: DisplaySettings = { ...DEFAULT_DISPLAY_SETTINGS };
  layers: Layer[] = [];
  tickerItems: string[] = [];
  tickerDuration = 60;
  offline = false;
  idle = false;
  isFullscreen = false;

  private display = inject(DisplayService);
  readonly clock$ = this.display.now$.pipe(map(date => clockParts(date, this.settings.hijriOffset)));

  @ViewChild('tickerCopy') private tickerCopy?: ElementRef<HTMLElement>;

  private slides: DisplaySlide[] = [];
  private current: DisplaySlide | null = null;
  private layerKey = 0;
  private signature = '';
  private readonly startedAt = Date.now();
  private fetchSub?: Subscription;
  private advanceTimer?: ReturnType<typeof setTimeout>;
  private cleanupTimer?: ReturnType<typeof setTimeout>;
  private pollTimer?: ReturnType<typeof setTimeout>;
  private idleTimer?: ReturnType<typeof setTimeout>;
  private wakeLock: { release(): Promise<void> } | null = null;

  get showBar(): boolean {
    return this.tickerItems.length > 0 || this.settings.showClock;
  }

  ngOnInit(): void {
    document.body.classList.add('display-mode');
    this.restoreCache();
    this.poll();
    this.wake();
    this.requestWakeLock();
    // The ticker's speed depends on its text width, which changes once the Arabic web font loads.
    document.fonts?.ready.then(() => this.measureTicker());
  }

  ngOnDestroy(): void {
    document.body.classList.remove('display-mode');
    this.fetchSub?.unsubscribe();
    [this.advanceTimer, this.cleanupTimer, this.pollTimer, this.idleTimer].forEach(t => clearTimeout(t));
    this.wakeLock?.release().catch(() => { /* already released */ });
  }

  mediaUrl(slide: DisplaySlide): string | null {
    return this.display.mediaUrl(slide.image);
  }

  trackLayer(_: number, layer: Layer): number {
    return layer.key;
  }

  // ---------- data ----------

  private poll(): void {
    clearTimeout(this.pollTimer);
    this.fetchSub?.unsubscribe();
    this.fetchSub = this.display.getScreen().subscribe({
      next: data => {
        this.offline = false;
        this.apply(data);
        this.saveCache(data);
        if (Date.now() - this.startedAt > RELOAD_AFTER_MS) {
          location.reload();
          return;
        }
        this.pollTimer = setTimeout(() => this.poll(), POLL_MS);
      },
      error: () => {
        this.offline = true;
        if (!this.layers.length) this.advance(); // show the welcome slide meanwhile
        this.pollTimer = setTimeout(() => this.poll(), this.slides.length ? POLL_MS : RETRY_MS);
      }
    });
  }

  private apply(data: DisplayData): void {
    const signature = JSON.stringify(data);
    if (signature === this.signature) return;
    this.signature = signature;

    this.settings = { ...DEFAULT_DISPLAY_SETTINGS, ...data.settings };
    this.slides = data.slides || [];

    const items = this.settings.tickerEnabled
      ? (this.settings.tickerText || '').split('\n').map(s => s.trim()).filter(Boolean)
      : [];
    if (items.join('\n') !== this.tickerItems.join('\n')) {
      this.tickerItems = items;
      setTimeout(() => this.measureTicker());
    }

    // The slide on screen: keep it if it is still scheduled (updating its content in place),
    // otherwise move on.
    const fresh = this.current?._id ? this.slides.find(s => s._id === this.current!._id) : undefined;
    if (!this.layers.length || !fresh || slideStatus(fresh) !== 'live') {
      this.advance();
      return;
    }
    const top = this.layers[this.layers.length - 1];
    this.layers = [...this.layers.slice(0, -1), { key: top.key, slide: fresh }];
    this.current = fresh;
  }

  private restoreCache(): void {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) this.apply(JSON.parse(cached));
    } catch { /* no storage or bad data: wait for the network */ }
  }

  private saveCache(data: DisplayData): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch { /* storage unavailable */ }
  }

  // ---------- playback ----------

  /** Slides to play today (enabled and within their dates, by this screen's local date). */
  private playable(): DisplaySlide[] {
    return this.slides.filter(s => slideStatus(s) === 'live');
  }

  private advance(step = 1): void {
    clearTimeout(this.advanceTimer);
    const list = this.playable();

    let next: DisplaySlide;
    if (!list.length) {
      next = FALLBACK_SLIDE;
    } else {
      const position = this.current ? list.indexOf(this.current) : -1;
      next = position === -1
        ? list[step > 0 ? 0 : list.length - 1]
        : list[(position + step + list.length) % list.length];
    }

    // A single slide stays put instead of replaying its entrance every cycle.
    if (next !== this.current || !this.layers.length) this.show(next);
    this.current = next;

    if (list.length > 1) this.preload(list[(list.indexOf(next) + 1) % list.length]);
    this.advanceTimer = setTimeout(() => this.advance(), Math.max(3, next.duration || 12) * 1000);
  }

  private show(slide: DisplaySlide): void {
    this.layers = [...this.layers.slice(-1), { key: ++this.layerKey, slide }];
    clearTimeout(this.cleanupTimer);
    this.cleanupTimer = setTimeout(() => (this.layers = this.layers.slice(-1)), TRANSITION_MS);
  }

  private preload(slide: DisplaySlide): void {
    const url = this.mediaUrl(slide);
    if (url) new Image().src = url;
  }

  private measureTicker(): void {
    const width = this.tickerCopy?.nativeElement.offsetWidth;
    if (width) this.tickerDuration = Math.max(20, Math.round(width / TICKER_SPEED));
  }

  // ---------- screen controls ----------

  @HostListener('document:mousemove')
  @HostListener('document:touchstart')
  wake(): void {
    this.idle = false;
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => (this.idle = true), IDLE_MS);
  }

  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    if (event.key === 'f' || event.key === 'F') this.toggleFullscreen();
    // Right-to-left: the left arrow moves forward.
    else if (event.key === 'ArrowLeft') this.advance(1);
    else if (event.key === 'ArrowRight') this.advance(-1);
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    this.isFullscreen = !!document.fullscreenElement;
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    // The browser drops the wake lock whenever the page is hidden.
    if (document.visibilityState === 'visible') this.requestWakeLock();
  }

  toggleFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => { /* ignore */ });
    } else {
      document.documentElement.requestFullscreen().catch(() => { /* not allowed */ });
    }
  }

  /** Keeps the TV/computer from dimming or sleeping while the screen is open (where supported). */
  private async requestWakeLock(): Promise<void> {
    try {
      const wakeLock = (navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<{ release(): Promise<void> }> } }).wakeLock;
      if (wakeLock) this.wakeLock = await wakeLock.request('screen');
    } catch { /* not supported or not allowed */ }
  }
}
