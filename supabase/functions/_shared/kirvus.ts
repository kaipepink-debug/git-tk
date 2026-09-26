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

/** Extrai um valor numérico de campos comuns de valor (reais ou centavos). */
// deno-lint-ignore no-explicit-any
export function pickAmount(o: any): number | null {
  if (!o || typeof o !== 'object') return null;
  for (const k of ['amount', 'value', 'total', 'paidAmount', 'paid_amount']) {
    const n = Number(o[k]);
    if (o[k] !== undefined && o[k] !== null && Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

/** Consulta a transação na Kirvus (GET /gateway/transactions?id=). Evitar polling frequente (429). */
export async function fetchKirvusStatus(transactionId: string): Promise<{ ok: boolean; status?: string; amount?: number | null; error?: string }> {
  const headers = kirvusHeaders();
  if (!headers) return { ok: false, error: 'Credenciais Kirvus ausentes' };
  const res = await fetch(`${KIRVUS_BASE}/gateway/transactions?id=${encodeURIComponent(transactionId)}`, { headers });
  const text = await res.text();
  if (!res.ok) return { ok: false, error: `[${res.status}] ${text.slice(0, 300)}` };
  try {
    const d = JSON.parse(text);
    const t = d?.transaction ?? d?.data ?? d;
    return { ok: true, status: String(d.status || t?.status || ''), amount: pickAmount(t) ?? pickAmount(d) };
  } catch { return { ok: false, error: 'Resposta inválida' }; }
}

/** Compara um valor informado pela Kirvus (reais ou centavos) com o esperado em centavos. */
export function amountMatches(kirvusAmount: number, expectedCents: number): boolean {
  return Math.abs(kirvusAmount * 100 - expectedCents) < 1 || Math.abs(kirvusAmount - expectedCents) < 1;
}
