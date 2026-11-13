import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false
})
export class AppComponent {
  readonly year = new Date().getFullYear();
  // Checked up front too, so a TV opening /display never flashes the header.
  isDisplayRoute = location.pathname.startsWith('/display');
  private lastPath = location.pathname;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => {
        this.isDisplayRoute = e.urlAfterRedirects.startsWith('/display');

        // Moving to another page: put keyboard/screen-reader focus at the start of the new content.
        // Query-only changes (filters, paging on the same page) keep focus where the user is.
        const path = e.urlAfterRedirects.split(/[?#]/)[0];
        if (path !== this.lastPath) {
          this.lastPath = path;
          document.getElementById('main')?.focus({ preventScroll: true });
        }
      });
  }
}
