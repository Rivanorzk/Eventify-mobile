// src/lib/payment.ts
// Helper pembayaran Midtrans (Snap) yang terhubung ke backend:
//   POST /payments                          → buat / ambil Snap redirect_url (idempotent)
//   GET  /payments/order/:id/check-status   → sinkronkan status ke Midtrans Core API
//   GET  /orders/:id                        → status & batas waktu order
import { api } from '@/lib/api';
import type { Order } from '@/types/api';

export type OrderStatus = 'pending' | 'paid' | 'expired' | 'cancelled' | string;

export interface PaymentSession {
  redirect_url: string;
}

// Backend (paymentService.createTransaction) mengarahkan Midtrans ke
// `${FRONTEND_URL}/customer/payment/finish?order_id=...&transaction_status=...`.
// Di aplikasi mobile URL itu tidak perlu dibuka: WebView cukup mencegatnya.
const FINISH_PATH = '/payment/finish';

export async function fetchOrder(orderId: string | number): Promise<Order> {
  const res = await api.get(`/orders/${orderId}`);
  return res.data.data;
}

export async function createPayment(orderId: string | number): Promise<PaymentSession> {
  const res = await api.post('/payments', { order_id: Number(orderId) });
  return res.data.data;
}

export async function checkPaymentStatus(orderId: string | number): Promise<OrderStatus> {
  const res = await api.get(`/payments/order/${orderId}/check-status`);
  return res.data.data?.order_status;
}

/**
 * Di Sandbox, transaksi kadang belum tercatat di Core API beberapa detik
 * setelah Snap selesai (backend membalas 404 "belum tercatat"). Coba ulang.
 */
export async function checkStatusWithRetry(
  orderId: string | number,
  tries = 4,
  delayMs = 2000
): Promise<OrderStatus> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await checkPaymentStatus(orderId);
    } catch (err: any) {
      lastErr = err;
      if (err?.response?.status !== 404) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

export function isFinishUrl(url: string): boolean {
  return url.includes(FINISH_PATH);
}

export function isWebUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}