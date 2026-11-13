import { Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService, User } from '../services/auth.service';
import { ToastService } from '../shared/services/toast.service';
import { environment } from 'src/environments/environment';

interface NavLink { path: string; label: string; icon: string; }

/**
 * Site header. Sticky (not fixed), so pages need no top offset. Menus are plain disclosure buttons
 * driven by Angular: they close on navigation, on Esc (returning focus to their button) and on an
 * outside click. No Bootstrap JS involved.
 */
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  @ViewChild('adminBtn') adminBtn?: ElementRef<HTMLButtonElement>;
  @ViewChild('accountBtn') accountBtn?: ElementRef<HTMLButtonElement>;
  @ViewChild('mobileBtn') mobileBtn?: ElementRef<HTMLButtonElement>;

  isLoggedIn = false;
  isAdmin = false;
  currentUser: User | null = null;
  isScrolled = false;
  openMenu: 'admin' | 'account' | null = null;
  mobileOpen = false;
  showSearch = false;
  isAdminRoute = false;
  query = '';
  readonly borrowingEnabled = !!(environment as any).borrowingEnabled;

  readonly adminLinks: NavLink[] = [
    { path: '/add-book', label: 'إضافة كتاب', icon: 'fa-plus' },
    { path: '/bulk-update', label: 'التحديث الجماعي', icon: 'fa-pen-to-square' },
    { path: '/authors', label: 'المؤلفون', icon: 'fa-user-pen' },
    { path: '/publishers', label: 'الناشرون', icon: 'fa-building' },
    { path: '/exports', label: 'التصدير', icon: 'fa-file-export' },
    { path: '/admin/display', label: 'شاشة العرض', icon: 'fa-tv' },
    ...(environment as any).borrowingEnabled
      ? [{ path: '/admin/borrows', label: 'إدارة الاستعارات', icon: 'fa-book-open-reader' }]
      : []
  ];

  private subs = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router,
    private zone: NgZone,
    private host: ElementRef<HTMLElement>,
    private toast: ToastService
  ) {}

  get initial(): string {
    return (this.currentUser?.username || '؟').trim().charAt(0).toUpperCase();
  }

  ngOnInit(): void {
    this.subs.add(this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
      this.isAdmin = user?.role === 'admin';
    }));

    this.updateForUrl(this.router.url);
    this.subs.add(this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => {
        this.openMenu = null;
        this.mobileOpen = false;
        this.updateForUrl(e.urlAfterRedirects);
      }));

    // Scroll fires constantly: listen outside Angular and only re-render when the state flips.
    this.zone.runOutsideAngular(() => window.addEventListener('scroll', this.onScroll, { passive: true }));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    window.removeEventListener('scroll', this.onScroll);
  }

  toggle(menu: 'admin' | 'account'): void {
    this.openMenu = this.openMenu === menu ? null : menu;
  }

  toggleMobile(): void {
    this.mobileOpen = !this.mobileOpen;
    this.openMenu = null;
  }

  search(event: Event): void {
    event.preventDefault();
    const q = this.query.trim();
    this.router.navigate(['/books'], q ? { queryParams: { q } } : {});
    this.query = '';
  }

  logout(): void {
    this.openMenu = null;
    this.authService.logout();
    this.toast.info('تم تسجيل الخروج');
    this.router.navigate(['/']);
  }

  skipToMain(event: Event): void {
    event.preventDefault();
    const main = document.getElementById('main');
    main?.focus();
    main?.scrollIntoView();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.openMenu) return;
    const menu = this.host.nativeElement.querySelector(`[data-menu="${this.openMenu}"]`);
    if (menu && !menu.contains(event.target as Node)) this.openMenu = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.openMenu) {
      const btn = this.openMenu === 'admin' ? this.adminBtn : this.accountBtn;
      this.openMenu = null;
      btn?.nativeElement.focus();
    } else if (this.mobileOpen) {
      this.mobileOpen = false;
      this.mobileBtn?.nativeElement.focus();
    }
  }

  private updateForUrl(url: string): void {
    const path = url.split(/[?#]/)[0];
    // The home page and the book list have their own large search box.
    this.showSearch = path !== '/' && path !== '/books';
    this.isAdminRoute = this.adminLinks.some(link => path === link.path || path.startsWith(link.path + '/'))
      || path.startsWith('/edit-book/');
  }

  private onScroll = (): void => {
    const scrolled = window.scrollY > 4;
    if (scrolled !== this.isScrolled) this.zone.run(() => (this.isScrolled = scrolled));
  };
}
