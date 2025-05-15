export interface Borrow {
  _id?: string;
  book: string;
  user: string;
  startDate: Date;
  endDate: Date;
  returned?: boolean;
}
