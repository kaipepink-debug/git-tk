-- =============================================================================
-- O BANCO DA LOJA, RECRIADO DO ZERO
--
-- O schema nunca esteve versionado: vivia só dentro do projeto Supabase antigo,
-- e o repositório sabia consultá-lo sem saber recriá-lo. Este arquivo conserta
-- isso — daqui para frente o banco nasce do código, e não de um painel.
--
-- Os campos vieram do que as Edge Functions gravam e do que as telas leem.
-- Duas tabelas dão conta da loja inteira: `orders` e `tiktok_events`.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- PEDIDOS
--
-- Um pedido nasce quando o checkout pede o Pix e morre pago, recusado ou
-- esquecido. O dinheiro é guardado em CENTAVOS (integer): valor em real com
-- casa decimal em ponto flutuante é como se perde um centavo por pedido e
-- ninguém descobre de onde veio.
-- -----------------------------------------------------------------------------
create table if not exists public.orders (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),

  -- quem comprou
  customer_name        text,
  customer_email       text,
  customer_document    text,          -- CPF, só dígitos
  customer_phone       text,

  -- para onde vai
  customer_cep         text,
  customer_street      text,
  customer_number      text,
  customer_complement  text,
  customer_neighborhood text,
  customer_city        text,
  customer_state       text,

  -- o que e por quanto
  amount               integer not null,
  quantity             integer not null default 1,

  -- o pagamento
  status               text not null default 'pix_generated',
  pix_code             text,
  pix_qr_code          text,
  transaction_id       text,
  paid_at              timestamptz,

  -- o token que o webhook da Kirvus apresenta para provar que é ele.
  -- Sem isto, qualquer um que descubra a URL da função marca pedido como pago.
  kirvus_webhook_token text,

  -- rastreamento de conversão
  tiktok_event_id      text,
  tt_purchase_sent_at  timestamptz,

  constraint orders_status_valido check (status in (
    'pix_generated', 'paid', 'failed', 'amount_mismatch', 'recusado', 'expirado'
  )),
  constraint orders_amount_positivo check (amount > 0),
  constraint orders_quantity_positivo check (quantity > 0)
);

-- O webhook chega com o id da transação e precisa achar o pedido na hora;
-- a tela de obrigado procura pelo id. Os outros índices são para o dia em que
-- alguém perguntar "quantos pedidos pagos ontem?" sem varrer a tabela toda.
create index if not exists orders_transaction_id_idx on public.orders (transaction_id);
create index if not exists orders_status_idx         on public.orders (status);
create index if not exists orders_created_at_idx     on public.orders (created_at desc);
create index if not exists orders_email_idx          on public.orders (customer_email);

-- -----------------------------------------------------------------------------
-- EVENTOS DO TIKTOK
--
-- Fila de envio para a API de conversões: o que foi mandado, o que falhou e
-- quantas vezes tentou. `event_id` é o que impede o mesmo evento de contar
-- duas vezes quando uma tentativa falha no meio.
-- -----------------------------------------------------------------------------
create table if not exists public.tiktok_events (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  event_id      text,
  event         text,
  event_name    text,
  event_time    timestamptz,
  event_source  text,
  event_source_id text,
  external_id   text,

  content_id    text,
  content_name  text,
  content_type  text,
  price         numeric(12,2),

  page          text,
  source        text,
  utm           jsonb,

  status        text not null default 'pendente',
  retry_count   integer not null default 0,
  method        text,
  headers       jsonb,
  body          jsonb,
  data          jsonb,

  constraint tiktok_events_status_valido check (status in (
    'pendente', 'enviando', 'sent', 'fail', 'failed', 'duplicado'
  ))
);

create unique index if not exists tiktok_events_event_id_idx
  on public.tiktok_events (event_id) where event_id is not null;
create index if not exists tiktok_events_status_idx on public.tiktok_events (status);

-- =============================================================================
-- SEGURANÇA
--
-- AS DUAS TABELAS FICAM FECHADAS PARA O NAVEGADOR, e isto não é excesso de
-- zelo: a chave `anon` viaja dentro do JavaScript de todo visitante, então o
-- que ela alcança é público na prática. Uma tabela de pedidos aberta com essa
-- chave é a lista de nomes, CPFs, telefones e endereços de todo mundo que já
-- comprou, à disposição de quem abrir o console do navegador.
--
-- Nenhuma tela consulta `orders` direto — tudo passa pelas Edge Functions, que
-- usam a chave de serviço e ignoram RLS. Por isso fechar não quebra nada.
--
-- Ligar RLS sem criar política nenhuma nega tudo para anon e authenticated.
-- É o padrão mais seguro: o acesso precisa ser concedido de propósito.
-- =============================================================================
alter table public.orders        enable row level security;
alter table public.tiktok_events enable row level security;
