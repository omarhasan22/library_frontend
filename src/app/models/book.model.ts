export class Book {
  _id?: string;
  title: string;
  author: string;
  volumes?: number;
  publisher?: string;
  editor?: string;
  caretaker?: string;
  editionNumber?: number;
  publicationYear?: number;
  subject?: string;
  pageCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}