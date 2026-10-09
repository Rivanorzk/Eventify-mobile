const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const MONTHS_SHORT_ID = [
  'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN',
  'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES',
];

export function formatRupiah(value: number | string | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'Harga menyusul';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(value));
}

export function formatEventDate(dateStr?: string | null, timeStr?: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '-';
  const day = d.getDate();
  const month = MONTHS_ID[d.getMonth()];
  const year = d.getFullYear();
  const time = timeStr ? String(timeStr).slice(0, 5) : null;
  return `${day} ${month} ${year}${time ? ` • ${time} WIB` : ''}`;
}

export function getMonthDayBadge(dateStr?: string | null): { month: string; day: string } {
  if (!dateStr) return { month: '-', day: '-' };
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { month: '-', day: '-' };
  return {
    month: MONTHS_SHORT_ID[d.getMonth()],
    day: String(d.getDate()).padStart(2, '0'),
  };
}

export function formatSalesStartLabel(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const day = d.getDate();
  const month = MONTHS_ID[d.getMonth()];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} • ${hh}:${mm} WIB`;
}

export function getSalesCountdown(dateStr?: string | null):
  | { opened: true }
  | { opened: false; label: string }
  | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { opened: true };

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  let label: string;
  if (days > 0) label = `${days} hari ${hours} jam lagi`;
  else if (hours > 0) label = `${hours} jam ${minutes} menit lagi`;
  else label = `${minutes} menit lagi`;

  return { opened: false, label };
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

export function getCountdownParts(
  dateStr?: string | null,
  timeStr?: string | null
): CountdownParts | null {
  if (!dateStr) return null;
  const time = (timeStr || '00:00:00').slice(0, 8);
  const target = new Date(`${dateStr.slice(0, 10)}T${time}`);
  if (Number.isNaN(target.getTime())) return null;

  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, expired: false };
}