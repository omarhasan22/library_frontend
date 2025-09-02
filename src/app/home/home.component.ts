import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BookService } from '../services/book.service';
import { CategoryService } from '../services/category.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  // Statistics
  totalBooks: number = 0;
  totalCategories: number = 0;
  totalAuthors: number = 0;
  totalPublishers: number = 0;

  // Categories with subjects
  categories: any[] = [];
  categorySubjects: { [categoryId: string]: any[] } = {};
  expandedCategory: string | null = null;

  // Recent books
  recentBooks: any[] = [];

  // Search
  quickSearchTerm: string = '';

  // Auth
  isAdmin: boolean = false;

  constructor(
    private bookService: BookService,
    // private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadStatistics();
    this.loadCategories();
    this.loadRecentBooks();
    // this.checkAuth();
  }

  // checkAuth(): void {
  //   this.authService.currentUser$.subscribe(user => {
  //     this.isAdmin = user?.role === 'admin';
  //   });
  // }

  loadStatistics(): void {
    this.bookService.getStatistics().subscribe(
      stats => {
        this.totalBooks = stats.totalBooks || 0;
        this.totalAuthors = stats.totalAuthors || 0;
        this.totalPublishers = stats.totalPublishers || 0;
      },
      error => {
        console.error('Error loading statistics:', error);
        this.totalBooks = 0;
        this.totalAuthors = 0;
        this.totalPublishers = 0;
      }
    );
  }

  loadCategories(): void {
    this.bookService.getCategories().subscribe(
      categories => {
        // Get book count for each category
        categories.forEach(category => {
          // Get count of books in this category
          const filters = [{ field: 'category', value: category._id }];
          this.bookService.advancedSearch(filters, 1, 1).subscribe(
            response => {
              category.bookCount = response.filteredCount || 0;
            }
          );
        });

        this.categories = categories.slice(0, 12); // Show first 12 categories
        this.totalCategories = categories.length;
      },
      error => {
        console.error('Error loading categories:', error);
      }
    );
  }

  toggleCategoryExpand(categoryId: string): void {
    if (this.expandedCategory === categoryId) {
      this.expandedCategory = null;
    } else {
      this.expandedCategory = categoryId;

      // Load subjects if not already loaded
      if (!this.categorySubjects[categoryId]) {
        this.loadSubjectsForCategory(categoryId);
      }
    }
  }

  loadSubjectsForCategory(categoryId: string): void {
    this.bookService.getSubjects().subscribe(
      subjects => {
        // Filter subjects for this category (you might need to adjust based on your data structure)
        const categorySubjects = subjects.filter(subject =>
          subject.categoryId === categoryId || subject.category === categoryId
        );

        // Get book count for each subject
        categorySubjects.forEach(subject => {
          const filters = [
            { field: 'category', value: categoryId },
            { field: 'subject', value: subject._id }
          ];

          this.bookService.advancedSearch(filters, 1, 1).subscribe(
            response => {
              subject.bookCount = response.filteredCount || 0;
            }
          );
        });

        this.categorySubjects[categoryId] = categorySubjects;
      },
      error => {
        console.error('Error loading subjects:', error);
        this.categorySubjects[categoryId] = [];
      }
    );
  }

  loadRecentBooks(): void {
    this.bookService.getRecentBooks(8).subscribe(
      books => {
        this.recentBooks = books;
      },
      error => {
        console.error('Error loading recent books:', error);
      }
    );
  }

  navigateToCategory(category: any): void {
    this.router.navigate(['/books'], {
      queryParams: {
        category: category._id,
        categoryTitle: category.title
      }
    });
  }

  navigateToCategorySubject(categoryId: string, subjectId: string): void {
    this.router.navigate(['/books'], {
      queryParams: {
        category: categoryId,
        subject: subjectId
      }
    });
  }

  quickSearch(): void {
    if (this.quickSearchTerm.trim()) {
      this.router.navigate(['/books'], {
        queryParams: { search: this.quickSearchTerm }
      });
    }
  }

  viewBook(bookId: string): void {
    this.router.navigate(['/books', bookId]);
  }

  getAuthorsNames(authors: any[]): any {
    if (!authors || authors.length === 0) return 'غير محدد';
  }

}