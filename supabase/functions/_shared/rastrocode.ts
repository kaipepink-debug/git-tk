/**
 * Envio do pedido pago para a RastroCode (POST https://app.rastrocode.site/api/v1/orders).
 * Chave somente no servidor: RASTROCODE_API_KEY. Idempotente via transaction_id + rastrocode_sent_at.
 */
// deno-lint-ignore no-explicit-any
export async function sendToRastroCode(admin: any, transactionId: string): Promise<{ ok: boolean; info: string }> {
  const key = Deno.env.get('RASTROCODE_API_KEY');
  if (!key) return { ok: false, info: 'RASTROCODE_API_KEY ausente' };

  const { data: o } = await admin.from('orders').select('*').eq('transaction_id', transactionId).maybeSingle();
  if (!o) return { ok: false, info: 'pedido não encontrado' };
  if (o.rastrocode_sent_at) return { ok: true, info: 'já enviado' };

  const digits = (v: unknown) => String(v ?? '').replace(/\D/g, '');
  const total = Number((Number(o.amount || 0) / 100).toFixed(2));
  const qty = Number(o.quantity) > 0 ? Number(o.quantity) : 1;
  const payload = {
    transaction_id: String(o.id).replace(/[^A-Za-z0-9._-]/g, '').slice(0, 50),
    customer: {
      name: String(o.customer_name || '').slice(0, 255),
      email: String(o.customer_email || '').toLowerCase(),
      phone: digits(o.customer_phone),
      document: digits(o.customer_document),
    },
    address: {
      street: o.customer_street || '',
      number: String(o.customer_number || 'S/N').slice(0, 20),
      complement: o.customer_complement || '',
      neighborhood: o.customer_neighborhood || '',
      city: o.customer_city || '',
      state: String(o.customer_state || '').toUpperCase().slice(0, 2),
      zipcode: digits(o.customer_cep),
    },
    products: [{
      name: 'Bicicleta Bike Eletrica V9 Max 1000w 48km',
      quantity: qty,
      price: Number((total / qty).toFixed(2)),
    }],
    total,
  };

  const res = await fetch('https://app.rastrocode.site/api/v1/orders', {
    method: 'POST',
    headers: { 'X-API-Key': key.trim(), 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  // deno-lint-ignore no-explicit-any
  let data: any = null;
  try { data = JSON.parse(text); } catch { /* texto */ }

  if (res.ok && data?.success) {
    await admin.from('orders').update({
      rastrocode_sent_at: new Date().toISOString(),
      rastrocode_tracking_code: data?.data?.tracking_code ?? null,
      rastrocode_error: null,
    }).eq('id', o.id);
    return { ok: true, info: `enviado ${data?.data?.tracking_code ?? '(duplicado)'}` };
  }
  const info = `[${res.status}] ${text.slice(0, 800)}`;
  console.error('RastroCode erro:', info);
  await admin.from('orders').update({ rastrocode_error: info }).eq('id', o.id);
  return { ok: false, info };
}
