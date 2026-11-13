import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay, timer } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DisplayData, DisplaySettings, DisplaySlide } from '../models/display.model';

@Injectable({
  providedIn: 'root'
})
export class DisplayService {
  private api = `${environment.apiUrl}/display`;

  /** Shared clock for the slides: ticks every 5 seconds (the screen shows minutes). */
  readonly now$: Observable<Date> = timer(0, 5000).pipe(
    map(() => new Date()),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(private http: HttpClient) { }

  /** Public: settings and enabled slides, for the screen. */
  getScreen(): Observable<DisplayData> {
    return this.http.get<DisplayData>(this.api);
  }

  /** Admin: settings and every slide. */
  getAdminData(): Observable<DisplayData> {
    return this.http.get<DisplayData>(`${this.api}/admin`);
  }

  updateSettings(settings: DisplaySettings): Observable<DisplaySettings> {
    return this.http.put<DisplaySettings>(`${this.api}/settings`, settings);
  }

  createSlide(slide: DisplaySlide, image?: File | null): Observable<DisplaySlide> {
    return this.http.post<DisplaySlide>(`${this.api}/slides`, this.slideBody(slide, image));
  }

  updateSlide(id: string, slide: Partial<DisplaySlide>, image?: File | null, removeImage = false): Observable<DisplaySlide> {
    const data = removeImage ? { ...slide, removeImage: true } : slide;
    return this.http.put<DisplaySlide>(`${this.api}/slides/${id}`, this.slideBody(data, image));
  }

  deleteSlide(id: string): Observable<unknown> {
    return this.http.delete(`${this.api}/slides/${id}`);
  }

  reorderSlides(ids: string[]): Observable<unknown> {
    return this.http.put(`${this.api}/slides/reorder`, { ids });
  }

  mediaUrl(id: string | null | undefined): string | null {
    return id ? `${this.api}/media/${id}` : null;
  }

  // With an image the slide goes as multipart (JSON in `data`); otherwise as plain JSON.
  private slideBody(slide: object, image?: File | null): FormData | object {
    const { _id, order, updatedAt, image: _image, ...data } = slide as DisplaySlide;
    if (!image) return data;
    const form = new FormData();
    form.append('data', JSON.stringify(data));
    form.append('image', image, image.name);
    return form;
  }
}
