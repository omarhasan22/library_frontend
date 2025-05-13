import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-add-book',
  templateUrl: './add-book.component.html',
  styleUrls: ['./add-book.component.css']
})
export class AddBookComponent {
  newBook: Book = {
    title: '',
    author: '',
    volumes: 1,
    publisher: '',
    pageCount: 1,
    publicationYear: new Date().getFullYear()
  };

  constructor(private bookService: BookService, private router: Router) {}

  addBook(): void {
    if (!this.newBook.title || !this.newBook.author) {
      alert('Title and Author are required.');
      return;
    }

    this.bookService.createBook(this.newBook).subscribe(
      () => {
        alert('Book added successfully!');
        this.router.navigate(['/books']);
      },
      (error) => console.error('Error adding book:', error)
    );
  }
}
