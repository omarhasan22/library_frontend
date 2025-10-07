import { Component, OnInit, HostListener, AfterViewInit, OnDestroy } from '@angular/core';
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
    private router: Router
  ) { }

  ngOnInit(): void {
    // Subscribe to user changes
    this.subscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
      if (this.currentUser?.user.role == 'admin') {
        this.isAdmin = true;
      }
      // Debug logging
      console.log('Navbar - Current user:', user);
      console.log('Navbar - User role:', user?.role);
      console.log('Navbar - Is admin:', this.isAdmin);
    });

    // If user is logged in but data not loaded, trigger load
    if (this.authService.isAuthenticated() && !this.authService.currentUser) {
      console.log("User authenticated but no data, loading...");
      this.authService.loadUserData().subscribe({
        next: (user) => console.log("User data loaded in navbar:", user),
        error: (error) => console.error("Failed to load user data in navbar:", error)
      });
    }

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
  }
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

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