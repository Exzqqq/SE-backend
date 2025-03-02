export interface Drug {
  drug_id: number;
  name: string;
  code: string;
  detail: string;
  usage: string;
  slang_food?: string;
  side_effect?: string;
  created_at?: Date; // Optional
  updated_at?: Date; // Optional
  drug_type: string;
  unit_type: string;
  price: number;
  // sold_count?: number;
}
