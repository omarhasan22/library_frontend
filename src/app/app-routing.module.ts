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


const routes: Routes = [
  // Public routes
  { path: '', component: HomeComponent },
  { path: 'books', component: BookListComponent },
  { path: 'books/:id', component: BookDetailComponent },
  { path: 'categories', component: CategoriesComponent },
  { path: 'exports', component: ExportsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Protected routes (require authentication)
  {
    path: 'add-book',
    component: AddBookComponent,
    // canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'edit-book/:id',
    component: AddBookComponent,
    // canActivate: [AuthGuard, AdminGuard]
  },

  // User routes
  {
    path: 'profile',
    component: UserProfileComponent,
    // canActivate: [AuthGuard]
  },

  // Borrow routes
  {
    path: 'my-borrows',
    component: UserBorrowsComponent,
    // canActivate: [AuthGuard]
  },
  {
    path: 'admin/borrows',
    component: AdminBorrowsComponent,
    // canActivate: [AuthGuard, AdminGuard]
  },

  // Wildcard route - redirect to home
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'enabled',
    anchorScrolling: 'enabled',
    scrollOffset: [0, 64] // Offset for fixed navbar
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }