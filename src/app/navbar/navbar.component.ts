import { Component, OnInit, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, AfterViewInit, OnDestroy {

  isLoggedIn = false;
  isAdmin = false;
  currentUser: any = null;
  private subscription: Subscription;
  private routerSubscription: Subscription;

  isScrolled: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private zone: NgZone
  ) { }

  ngOnInit(): void {
    // Subscribe to user changes
    // (AuthService loads the profile on startup when needed.)
    this.subscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
      this.isAdmin = user?.role === 'admin';
    });

    // Scroll fires constantly: listen outside Angular and only re-render when the state flips.
    this.zone.runOutsideAngular(() => window.addEventListener('scroll', this.onWindowScroll, { passive: true }));

    // Subscribe to router navigation events to close navbar on navigation
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.closeNavbar();
      });
  }

  ngAfterViewInit(): void {
    // Ensure navbar is closed on component initialization
    this.closeNavbar();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    window.removeEventListener('scroll', this.onWindowScroll);
  }

  private onWindowScroll = (): void => {
    const scrolled = window.scrollY > 50;
    if (scrolled !== this.isScrolled) {
      this.zone.run(() => (this.isScrolled = scrolled));
    }
  };

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']); // Navigate to home page
  }

  private closeNavbar(): void {
    // Close navbar by removing the 'show' class and adding 'collapse' class
    const navbarCollapse = document.getElementById('navbarNav');
    const navbarToggler = document.querySelector('.navbar-toggler');

    if (navbarCollapse && navbarToggler) {
      // Remove show class to close the navbar
      navbarCollapse.classList.remove('show');
      navbarCollapse.classList.add('collapse');

      // Update aria-expanded attribute
      navbarToggler.setAttribute('aria-expanded', 'false');
    }
  }
}