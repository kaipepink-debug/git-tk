/**
 * Cliente server-side da Kirvus Pay (docs: https://app.kirvuspay.com.br/docs/v1).
 * Credenciais somente em secrets: KIRVUS_PUBLIC_KEY / KIRVUS_SECRET_KEY.
 */
export const KIRVUS_BASE = 'https://app.kirvuspay.com.br/api/v1';

export function kirvusHeaders(): Record<string, string> | null {
  const pub = Deno.env.get('KIRVUS_PUBLIC_KEY');
  const sec = Deno.env.get('KIRVUS_SECRET_KEY');
  if (!pub || !sec) return null;
  return { 'x-public-key': pub.trim(), 'x-secret-key': sec.trim(), 'Content-Type': 'application/json', Accept: 'application/json' };
}

/** Consulta a transação na Kirvus (GET /gateway/transactions?id=). Evitar polling frequente (429). */
export async function fetchKirvusStatus(transactionId: string): Promise<{ ok: boolean; status?: string; error?: string }> {
  const headers = kirvusHeaders();
  if (!headers) return { ok: false, error: 'Credenciais Kirvus ausentes' };
  const res = await fetch(`${KIRVUS_BASE}/gateway/transactions?id=${encodeURIComponent(transactionId)}`, { headers });
  const text = await res.text();
  if (!res.ok) return { ok: false, error: `[${res.status}] ${text.slice(0, 300)}` };
  try { return { ok: true, status: String(JSON.parse(text).status || '') }; }
  catch { return { ok: false, error: 'Resposta inválida' }; }
}
