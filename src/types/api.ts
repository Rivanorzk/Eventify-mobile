// src/types/api.ts
export interface EventItem {
  id: number;
  title: string;
  description?: string;
  location?: string;
  event_date?: string;
  start_time?: string;
  sales_start_at?: string;
  category_id?: number;
  category_name?: string;
  price?: number;
  status?: string;
  image?: string;
  is_reminded?: boolean;
  [k: string]: any;
}

export interface Ticket {
  id: number;
  ticket_code: string;
  status: string;
  event_status?: string;
  event_title: string;
  event_date: string;
  start_time?: string;
  location?: string;
  category_name?: string;
  [k: string]: any;
}

export interface Category {
  id: number;
  category_name: string;
}

export interface CustomerDashboardStats {
  total_order: number;
  order_pending: number;
  order_berhasil: number;
  total_tiket: number;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  phone?: string;
  role?: 'customer' | 'admin' | 'superadmin';
  status?: string;
  is_active?: boolean;
  profile_image?: string | null;
  cover_image?: string | null;
  bio?: string;
  city?: string;
  created_at?: string;
  [k: string]: any;
}

// src/types/api.ts (tambahkan)

export interface TicketArea {
  id: number;
  area_name: string;
  floor?: string;
  access_type?: string;
  gate_name?: string;
  description?: string;
}

export interface TicketBenefit {
  id: number;
  title: string;
  description?: string;
}

export interface TicketRule {
  id?: number;
  title: string;
  description?: string;
}

export interface TicketCategory {
  id: number;
  category_name: string;
  price: number;
  remaining_stock: number;
}

export interface EventDetail extends EventItem {
  admin_username?: string;
  poster?: string;
  latitude?: string;
  longitude?: string;
  start_time?: string;
  end_time?: string;
  ticket_categories: TicketCategory[];
}

export interface TicketDetail extends Ticket {
  poster?: string;
  qr_code?: string;
  end_time?: string;
  category_name: string;
  ticket_price: number;
  discount_amount?: number;
  final_price: number;
  event_location: string;
  invoice_number: string;
  payment_type?: string;
  transaction_status?: string;
  settlement_time?: string;
  areas?: TicketArea[];
  benefits?: TicketBenefit[];
  rules?: TicketRule[];
}

// src/types/api.ts (tambahkan)
export interface Order {
  id: number;
  invoice_number: string;
  event_title?: string;
  event_date?: string;
  start_time?: string;
  event_location?: string;
  poster?: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled' | string;
  final_price: number;
  discount_amount?: number;
  ticket_count?: number;
  quantity?: number;
  category_name?: string;
  payment_type?: string;
  payment_va?: string;
  payment_deadline?: string;
  created_at: string;
  ticket_code?: string;
  seat_info?: string;
  rating?: number;
  [k: string]: any;
}

export type VoucherState = 'available' | 'upcoming' | 'used' | 'expired' | 'inactive';

export interface Voucher {
  id: number;
  promo_code: string;
  title?: string;
  event_id?: number | null;
  event_title?: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  maximum_discount?: number | null;
  minimum_quantity: number;
  start_date: string;
  end_date: string;
  used_at?: string | null;
  state: VoucherState;
  [k: string]: any;
}

// src/types/api.ts (tambahkan)

export interface CreateOrderPayload {
  event_id: number;
  user_voucher_id: number | null;
  tickets: Array<{
    ticket_category_id: number;
    quantity: number;
  }>;
}

export interface CreatedOrder {
  id: number;
  invoice_number: string;
  final_price: number;
  status: string;
  payment_url?: string;      // Midtrans Snap redirect URL
  snap_token?: string;       // Midtrans Snap token
  [k: string]: any;
}

export interface AppNotification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'event' | 'ticket' | 'promo' | 'system' | string;
  is_read: boolean | 0 | 1;    // ← backend MySQL balikin 0/1
  link?: string | null;
  icon?: string | null;
  created_at: string;
  updated_at?: string;
  [k: string]: any;
}

// src/types/api.ts (tambahkan)

export interface OrderTicket {
  id: number;
  order_detail_id: number;
  ticket_code: string;
  status: 'active' | 'used' | 'expired' | 'cancelled' | string;
  category_name?: string;
  area_name?: string | null;
  gate_name?: string | null;
  [k: string]: any;
}

export interface OrderDetailLine {
  id: number;
  order_id: number;
  event_ticket_category_id: number;
  quantity: number;
  price: number;
  subtotal: number;
  category_name?: string;
  tickets?: OrderTicket[];
  [k: string]: any;
}

export interface OrderPayment {
  id: number;
  order_id: number;
  midtrans_order_id: string;
  transaction_id?: string | null;
  payment_type?: string | null;
  transaction_status: string;
  fraud_status?: string | null;
  gross_amount: number;
  transaction_time?: string | null;
  settlement_time?: string | null;
  expiry_time?: string | null;
  [k: string]: any;
}

export interface OrderDetail {
  id: number;
  invoice_number: string;

  // Relasi
  event_id: number;
  customer_id: number;
  voucher_id?: number | null;

  // Event snapshot
  event_title?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  event_location?: string;
  event_poster?: string;

  // Customer snapshot
  customer_username?: string;
  customer_email?: string;
  customer_phone?: string;

  // Voucher snapshot
  voucher_promo_code?: string | null;

  // Harga
  total_price: number;
  discount_amount: number;
  final_price: number;
  service_fee_percent: number;
  service_fee: number;
  grand_total: number;

  // Status
  status: 'pending' | 'paid' | 'expired' | 'cancelled' | string;
  expired_at?: string | null;
  created_at: string;

  // Relasi nested
  order_details?: OrderDetailLine[];
  tickets?: OrderTicket[];      // flat kalau backend bikin flat
  payment?: OrderPayment | null;
  [k: string]: any;
}