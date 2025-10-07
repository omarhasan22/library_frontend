export interface Borrow {
  _id?: string;
  book: any; // Can be string or populated book object
  user: any; // Can be string or populated user object
  startDate: Date;
  endDate: Date;
  returned?: boolean;
  returnedDate?: Date;
  emailNotificationSent?: boolean;
  notificationDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
