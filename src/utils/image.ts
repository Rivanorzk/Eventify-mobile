// Perkecil & optimalkan gambar Cloudinary supaya aman dimuat di mobile.
export function optimizeImage(url?: string | null, width = 800): string | undefined {
  if (!url) return undefined;
  const https = url.replace(/^http:\/\//, 'https://');
  if (!https.includes('res.cloudinary.com') || !https.includes('/upload/')) return https;
  return https.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
}