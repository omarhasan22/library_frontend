// export class Book {
//   _id?: string;
//   title?: string;
//   address: {
//     roomNumber?: string;
//     wallNumber?: string;
//     shelfNumber?: string;
//     bookNumber?: string;
//   };
//   author: {
//     name?: string,
//     _id?: string
//   };
//   category: {
//     title?: string,
//     _id?: string
//   };
//   subject: {
//     title?: string,
//     _id?: string
//   };
//   numberOfVolumes?: number; // عدد الأجزاء
//   publisher?: {
//     title?: string,
//     _id?: string
//   };      // الدار
//   publisher2?: {
//     title?: string,
//     _id?: string
//   };      // الدار
//   editor?: {
//     name?: string,
//     _id?: string
//   };             // المحقق
//   commentator?: {
//     name?: string,
//     _id?: string
//   };             // المحقق
//   caretaker: {
//     name?: string,
//     _id?: string
//   };         // اعتنى به
//   editionNumber?: number;   // رقم الطبعة
//   publicationYear?: number; // سنة الطباعة
//   pageCount?: number;       // عدد الصفحات
//   imageUrl?: string;
//   createdAt?: Date;
//   updatedAt?: Date;
// }

export class Book {
  _id?: string;
  title?: string;
  address: {
    roomNumber?: string;
    wallNumber?: string;
    shelfNumber?: string;
    bookNumber?: string;
  };
  // Arrays to support multiple entries
  authors: Array<{
    name?: string,
    _id?: string
  }>;
  category: {
    title?: string,
    _id?: string
  }; // Single object, not array
  subject: {
    title?: string,
    _id?: string
  }; // Single object, not array
  numberOfVolumes?: number; // عدد الأجزاء
  publishers?: Array<{
    name?: string,
    _id?: string
  }>;
  editors?: Array<{
    name?: string,
    _id?: string
  }>;             // المحقق
  commentators?: Array<{
    name?: string,
    _id?: string
  }>;             // الشارح
  caretakers: Array<{
    name?: string,
    _id?: string
  }>;         // اعتنى به
  editionNumber?: number;   // رقم الطبعة
  publicationYear?: number; // سنة الطباعة
  pageCount?: number;       // عدد الصفحات
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}