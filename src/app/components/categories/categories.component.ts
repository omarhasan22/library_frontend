import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BookService } from '../../services/book.service';

interface Category {
  _id: string;
  title: string;
  subjectsCount?: number;
  subjects?: Subject[];
}

interface Subject {
  _id: string;
  title: string;
  categoryId?: string;
  bookCount?: number;
}

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})
export class CategoriesComponent implements OnInit {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  categorySubjects: { [categoryId: string]: Subject[] } = {};
  expandedCategories: { [categoryId: string]: boolean } = {};
  loadingSubjects: { [categoryId: string]: boolean } = {};
  searchTerm: string = '';
  loading: boolean = false;

  constructor(
    private bookService: BookService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;

    // Load categories and get book counts
    this.bookService.getCategories().subscribe(
      async (categories) => {
        // For each category, get the book count
        // for (const category of categories) {
        //   // Get books count for this category
        //   const filters = [{ field: 'category', value: category._id }];
        //   this.bookService.advancedSearch(filters, 1, 1).subscribe(
        //     (response) => {
        //       category.bookCount = response.filteredCount || 0;
        //     }
        //   );
        // }

        this.categories = categories;
        this.filteredCategories = categories;
        this.loading = false;
      },
      (error) => {
        console.error('Error loading categories:', error);
        this.loading = false;
      }
    );
  }

  toggleCategory(categoryId: string): void {
    console.log(123);

    this.expandedCategories[categoryId] = !this.expandedCategories[categoryId];

    // Load subjects if expanding and not already loaded
    if (this.expandedCategories[categoryId] && !this.categorySubjects[categoryId]) {
      this.loadSubjectsForCategory(categoryId);
    }
  }

  loadSubjectsForCategory(categoryId: string): void {
    this.loadingSubjects[categoryId] = true;

    // Find the category to get its subjects
    const category = this.categories.find(cat => cat._id === categoryId);

    if (category && category.subjects) {
      // Use subjects directly from category object
      const categorySubjects = category.subjects || [];

      // Get book count for each subject
      // categorySubjects.forEach(subject => {
      //   const filters = [
      //     { field: 'category', value: categoryId },
      //     { field: 'subject', value: subject._id }
      //   ];

      //   this.bookService.advancedSearch(filters, 1, 1).subscribe(
      //     (response) => {
      //       subject.bookCount = response.filteredCount || 0;
      //     },
      //     (error) => {
      //       subject.bookCount = 0;
      //     }
      //   );
      // });

      this.categorySubjects[categoryId] = categorySubjects;
      this.loadingSubjects[categoryId] = false;
    } else {
      // If no subjects in category, set empty array
      this.categorySubjects[categoryId] = [];
      this.loadingSubjects[categoryId] = false;
    }
  }
  filterCategories(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCategories = this.categories;
      return;
    }


    const normalizedSearch = this.normalizeArabicText(this.searchTerm);

    this.filteredCategories = this.categories.filter(category => {
      const normalizedTitle = this.normalizeArabicText(category.title);
      return normalizedTitle.includes(normalizedSearch);
    });
  }

  resetSearch(): void {
    this.searchTerm = '';
    this.filteredCategories = this.categories;
  }

  navigateToCategory(categoryId: string, categoryTitle: string): void {
    console.log(456);

    // Navigate to books page with category filter
    this.router.navigate(['/books'], {
      queryParams: {
        category: categoryId,
        categoryTitle: categoryTitle
      }
    });
  }

  navigateToSubject(categoryId: string, subjectId: string, subjectTitle: string): void {
    // Navigate to books page with both category and subject filters
    this.router.navigate(['/books'], {
      queryParams: {
        category: categoryId,
        // subject: subjectId,
        subjectTitle: subjectTitle
      }
    });
  }

  private normalizeArabicText(text: string): string {
    if (!text) return '';

    return text
      .replace(/[\u064B-\u0652\u0670\u0640]/g, '') // Remove diacritics
      .replace(/[\u0622\u0623\u0625\u0627]/g, 'ا') // Normalize alef
      .replace(/\u0649/g, 'ي') // Normalize alef maksura
      .replace(/\u0629/g, 'ه') // Normalize taa marbouta
      .replace(/[\u0654\u0655]/g, '') // Remove hamza
      .replace(/\u0624/g, 'و') // Normalize waw with hamza
      .replace(/\u0626/g, 'ي') // Normalize ya with hamza
      .replace(/\u0621/g, '') // Remove standalone hamza
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }
}