export interface PosProduct {
  id: string;
  name: string;
  category: string;
  sku: string | null;
  description: string | null;
  sale_price: number;
  stock_quantity: number;
  min_stock_level: number;
  track_stock: boolean;
  is_quick_add: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface PosAccount {
  id: string;
  name: string;
  type: string;
  module_scope: string;
  fee_percentage: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface PosCartItem {
  product_id: string;
  name: string;
  category: string;
  sale_price: number;
  quantity: number;
  discount_percentage: number;
  stock_quantity: number;
  track_stock: boolean;
}

export interface SaleResponseData {
  invoice_id: string;
  invoice_number: string;
  total: number;
  change: number | null;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface StandardEnvelope<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
}
