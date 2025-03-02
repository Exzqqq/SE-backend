export interface Stock {
  id: number; // stock_id in the database
  drug_id: number; // Foreign key to Drug
  amount: number;
  expired: Date;
  unit_price: number;
  created_at?: Date; // Optional, as it may be auto-generated
  updated_at?: Date; // Optional, as it may be auto-generated
}
