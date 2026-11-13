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
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { authGuard, adminGuard } from './guards/auth.guard';
import { unsavedChangesGuard } from './guards/unsaved-changes.guard';


const routes: Routes = [
  // Public routes
  { path: '', component: HomeComponent, title: 'الرئيسية' },
  { path: 'books', component: BookListComponent, title: 'الكتب' },
  { path: 'books/:id', component: BookDetailComponent, title: 'تفاصيل الكتاب' },
  { path: 'categories', component: CategoriesComponent, title: 'أقسام المكتبة' },
  { path: 'login', component: LoginComponent, title: 'تسجيل الدخول' },
  { path: 'register', component: RegisterComponent, title: 'إنشاء حساب' },
  // The library's display screen (full-screen slideshow; no site header)
  { path: 'display', component: DisplayScreenComponent, title: 'شاشة العرض' },

  // Admin tools
  { path: 'authors', component: AuthorDashboardComponent, canActivate: [adminGuard], title: 'المؤلفون' },
  { path: 'publishers', component: PublisherDashboardComponent, canActivate: [adminGuard], title: 'الناشرون' },
  { path: 'exports', component: ExportsComponent, canActivate: [adminGuard], title: 'التصدير' },
  { path: 'bulk-update', component: BulkUpdateComponent, canActivate: [adminGuard], title: 'التحديث الجماعي' },
  { path: 'add-book', component: AddBookComponent, canActivate: [adminGuard], canDeactivate: [unsavedChangesGuard], title: 'إضافة كتاب' },
  { path: 'edit-book/:id', component: AddBookComponent, canActivate: [adminGuard], canDeactivate: [unsavedChangesGuard], title: 'تعديل كتاب' },
  { path: 'admin/borrows', component: AdminBorrowsComponent, canActivate: [adminGuard], title: 'إدارة الاستعارات' },
  { path: 'admin/display', component: DisplayAdminComponent, canActivate: [adminGuard], title: 'إدارة شاشة العرض' },

  // Logged-in users
  { path: 'profile', component: UserProfileComponent, canActivate: [authGuard], title: 'الملف الشخصي' },
  { path: 'my-borrows', component: UserBorrowsComponent, canActivate: [authGuard], title: 'استعاراتي' },

  // Unknown URLs get a real "not found" page (with search) instead of a silent redirect home.
  { path: '**', component: NotFoundComponent, title: 'الصفحة غير موجودة' }
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