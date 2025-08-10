import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { BookListComponent } from './components/book-list/book-list.component';
import { BookDetailComponent } from './components/book-detail/book-detail.component';
import { AddBookComponent } from './components/add-book/add-book.component';
import { AuthService } from './services/auth.service';
import { NavbarComponent } from './navbar/navbar.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { CommonModule } from '@angular/common';

@NgModule({ declarations: [
        AppComponent,
        RegisterComponent,
        LoginComponent,
        HomeComponent,
        BookDetailComponent,
        BookListComponent,
        AddBookComponent,
        NavbarComponent,
        CategoriesComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        FormsModule,
        CommonModule,
        ReactiveFormsModule], providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        },
        AuthService,
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
