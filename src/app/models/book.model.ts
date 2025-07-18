export class Book {
  _id?: string;
  title?: string;
  address:{
  roomNumber?: string;
  wallNumber?: string;
  shelfNumber?: string;
  bookNumber?: string;
  };
  author : {
    name?:string,
    _id?:string
  };   
  category: {
    title?:string,
    _id?:string
  };
  subject: {
    title?:string,
    _id?:string
  };
  numberOfVolumes?: number; // عدد الأجزاء
  publisher? : {
    title?:string,
    _id?:string
  };      // الدار
  editor? : {
    name?:string,
    _id?:string
  };             // المحقق
  muhashi? : {
    name?:string,
    _id?:string
  };             // المحقق
  caretaker : {
    name?:string,
    _id?:string
  };         // اعتنى به
  editionNumber?: number;   // رقم الطبعة
  publicationYear?: number; // سنة الطباعة
  pageCount?: number;       // عدد الصفحات
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}