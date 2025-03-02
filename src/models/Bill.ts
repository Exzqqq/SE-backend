export interface Bill {
  id?: number; // Optional for when creating a new bill
  customer_name: string;
  items: BillItem[]; // Detailed items in the bill
  total_amount: number;
  discount: number;
  created_at?: Date; // Automatically generated in the database
  updated_at?: Date; // Automatically generated in the database
}

export interface BillItem {
  stock_id: number;
  drug_name?: string; // Filled after fetching from the database
  quantity: number;
  price_per_item?: number; // Filled after fetching from the database
  status: "pending" | "confirmed";
}
