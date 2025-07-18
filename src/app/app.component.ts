import { Component, Renderer2 } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'UI';
  isHomePage: boolean = true;

  constructor(    private router: Router,
    private renderer: Renderer2) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        const nav = document.querySelector('#mainNav');
        if (!nav) return;

        // Always shrink on non-home
        if (e.urlAfterRedirects !== '/') {
          this.renderer.addClass(nav, 'navbar-shrink');
        } else {
          // if you still want scroll logic on home,
          // you can remove the class and let your HomeComponent
          // handle scroll-shrink there.
          this.renderer.removeClass(nav, 'navbar-shrink');
        }
      });
  }
  }

  

