-- As colunas que faltaram quando deduzi o schema lendo o código.
--
-- O primeiro pedido de verdade morreu aqui: a Kirvus gerava o PIX, o cliente via
-- "não foi possível conectar ao servidor de pagamento" e o pedido nunca era
-- gravado. Pior que uma falha logo de cara — a cobrança nascia sem registro do
-- lado de cá, e sem registro o aviso de pagamento não tem contra o que ser
-- conferido. A função faz a coisa certa e recusa entregar o PIX nesse caso.
--
-- Todas entram como nulas: são preenchidas depois da criação do pedido, por
-- etapas que podem nunca acontecer (o cliente desiste, o rastreio falha).

alter table public.orders
  -- O pedido congelado como foi cobrado: produto, quantidade, preço unitário,
  -- frete e adicionais. A tabela de preços muda com o tempo; sem esta cópia não
  -- há como saber depois o que exatamente foi vendido por aquele valor.
  add column if not exists items jsonb,

  -- Atribuição do TikTok. Chegam do navegador e precisam sobreviver até o
  -- pagamento: a conversão só é enviada quando a compra confirma, e aí a
  -- sessão que trouxe o cliente já acabou faz tempo.
  add column if not exists ttclid text,
  add column if not exists ttp    text,
  add column if not exists utm    jsonb,

  -- Envio do rastreio. O par sent_at/error registra o que aconteceu, e o
  -- lock_at é o que impede dois envios simultâneos de criarem rastreio
  -- duplicado para o mesmo pedido.
  add column if not exists rastrocode_sent_at       timestamptz,
  add column if not exists rastrocode_tracking_code text,
  add column if not exists rastrocode_error         text,
  add column if not exists rastrocode_lock_at       timestamptz;
