import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { BookListComponent } from './components/book-list/book-list.component';
import { BookDetailComponent } from './components/book-detail/book-detail.component';
import { AddBookComponent } from './components/add-book/add-book.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { AdminBorrowsComponent } from './components/admin-borrows/admin-borrows.component';
import { UserBorrowsComponent } from './components/user-borrows/user-borrows.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { ExportsComponent } from './components/exports/exports.component';
import { AuthorDashboardComponent } from './components/author-dashboard/author-dashboard.component';
import { PublisherDashboardComponent } from './components/publisher-dashboard/publisher-dashboard.component';
import { BulkUpdateComponent } from './components/bulk-update/bulk-update.component';
import { DisplayScreenComponent } from './components/display/display-screen/display-screen.component';
import { DisplayAdminComponent } from './components/display/display-admin/display-admin.component';
import { authGuard, adminGuard } from './guards/auth.guard';


const routes: Routes = [
  // Public routes
  { path: '', component: HomeComponent },
  { path: 'books', component: BookListComponent },
  { path: 'books/:id', component: BookDetailComponent },
  { path: 'categories', component: CategoriesComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  // The library's display screen (full-screen slideshow; no navbar)
  { path: 'display', component: DisplayScreenComponent },

  // Admin tools
  { path: 'authors', component: AuthorDashboardComponent, canActivate: [adminGuard] },
  { path: 'publishers', component: PublisherDashboardComponent, canActivate: [adminGuard] },
  { path: 'exports', component: ExportsComponent, canActivate: [adminGuard] },
  { path: 'bulk-update', component: BulkUpdateComponent, canActivate: [adminGuard] },
  { path: 'add-book', component: AddBookComponent, canActivate: [adminGuard] },
  { path: 'edit-book/:id', component: AddBookComponent, canActivate: [adminGuard] },
  { path: 'admin/borrows', component: AdminBorrowsComponent, canActivate: [adminGuard] },
  { path: 'admin/display', component: DisplayAdminComponent, canActivate: [adminGuard] },

  // Logged-in users
  { path: 'profile', component: UserProfileComponent, canActivate: [authGuard] },
  { path: 'my-borrows', component: UserBorrowsComponent, canActivate: [authGuard] },

  // Wildcard route - redirect to home
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'enabled',
    anchorScrolling: 'enabled'
    // The sticky header offset is handled in CSS: html { scroll-padding-top } (src/styles/base.css).
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }