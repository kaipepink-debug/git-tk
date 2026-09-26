Store all site images as real WebP files under public/images/{product,order-bumps,reviews,brand} and reference them as /images/...; the owner is migrating to Namecheap and needs no dependency on Lovable storage.Public store content (product, prices, exit offer, reviews, company info, pre-sell) lives in src/data/storeContent.ts, not the database; the store must render without the backend ahead of the PHP/MySQL migration.

- Pix só via KirvusPay, fixo no código (webhook /integracao/webhooks/kirvuspay valida webhookToken + status COMPLETED + valor pago na API) — pagamento só é liberado com confirmação servidor-a-servidor.
- Preço do PIX recalculado no servidor por supabase/functions/_shared/pricing.ts (manter igual a storeContent.ts/orderBumps.ts); o navegador envia só itens — impede adulterar o valor.
- Backend mínimo: sem painel/login/métricas; `orders` e `tiktok_events` acessíveis só pelo servidor (service_role) — reduz superfície de ataque.
- Pedido pago é enviado à RastroCode (_shared/rastrocode.ts, chave RASTROCODE_API_KEY) a partir do webhook de pagamento; idempotente via rastrocode_sent_at.
