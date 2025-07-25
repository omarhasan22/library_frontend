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
  muhashis?: { _id?: string; name: string }[];

  editionNumber?: number;   // رقم الطبعة
  publicationYear?: number; // سنة الطباعة
  pageCount?: number;       // عدد الصفحات
  notes?: string;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}