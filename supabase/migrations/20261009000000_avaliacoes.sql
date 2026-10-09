-- =============================================================================
-- AVALIAÇÕES, PRESAS A PEDIDO PAGO
--
-- O painel cadastra, corrige, esconde e põe foto em avaliação — mas toda
-- avaliação aponta para um pedido PAGO desta loja, e o produto dela é o produto
-- daquele pedido. Sem pedido pago não existe avaliação, e um pedido rende uma
-- avaliação só.
--
-- É o que separa "avaliações" de "texto que a loja escreveu sobre si mesma": a
-- nota e a contagem que a página mostra saem desta tabela, e esta tabela só
-- cresce com venda. A regra mora aqui, no banco, e não na tela do painel —
-- esconder um botão não impede ninguém de chamar a API.
-- =============================================================================

create table if not exists public.reviews (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  order_id     uuid not null unique references public.orders (id) on delete cascade,
  product_slug text not null,                 -- preenchido pelo gatilho, a partir do pedido

  rating       integer not null,
  author_name  text not null,
  author_city  text not null default '',
  body         text not null default '',
  photos       text[] not null default '{}',
  visible      boolean not null default true,

  constraint reviews_nota_valida  check (rating between 1 and 5),
  constraint reviews_nome_valido  check (length(trim(author_name)) between 1 and 60),
  constraint reviews_texto_curto  check (length(body) <= 2000),
  constraint reviews_fotos_poucas check (coalesce(array_length(photos, 1), 0) <= 6)
);

create index if not exists reviews_produto_idx on public.reviews (product_slug, visible, created_at desc);

-- -----------------------------------------------------------------------------
-- O PRODUTO DO PEDIDO
--
-- Os pedidos guardam o produto em `items.product.id`: o slug, ou — para o
-- cooler e o buggy, que existiam antes do painel — o id antigo do pixel.
-- -----------------------------------------------------------------------------
create or replace function public.produto_do_pedido(p_items jsonb)
returns text
language sql
immutable
as $$
  select case p_items -> 'product' ->> 'id'
    when '7c4b1f3a-9d28-4e61-a0f5-3b8e2c6d9147' then 'produto'
    when 'b7e2d4a1-5c3f-4e8a-9b61-2f0d8c4a7e15' then 'buggy'
    else p_items -> 'product' ->> 'id'
  end;
$$;

-- -----------------------------------------------------------------------------
-- A TRAVA: pedido pago, e o produto vem dele.
--
-- SECURITY DEFINER porque `orders` é fechada para o navegador (RLS sem
-- política) — o gatilho precisa ler o pedido que a chave do administrador não
-- enxerga.
-- -----------------------------------------------------------------------------
create or replace function public.reviews_confere_pedido()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_items  jsonb;
begin
  select status, items into v_status, v_items from public.orders where id = new.order_id;
  if not found then
    raise exception 'Pedido % não existe.', new.order_id;
  end if;
  if v_status <> 'paid' then
    raise exception 'Só pedido pago pode ter avaliação (este está como %).', v_status;
  end if;
  new.product_slug := coalesce(public.produto_do_pedido(v_items), '');
  if new.product_slug = '' then
    raise exception 'O pedido % não diz qual produto foi comprado.', new.order_id;
  end if;
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_confere_pedido on public.reviews;
create trigger reviews_confere_pedido before insert or update on public.reviews
  for each row execute function public.reviews_confere_pedido();

-- -----------------------------------------------------------------------------
-- ACESSO
-- Visitante lê só o que está visível; administrador lê e escreve tudo.
-- -----------------------------------------------------------------------------
alter table public.reviews enable row level security;

drop policy if exists reviews_leitura on public.reviews;
create policy reviews_leitura on public.reviews
  for select using (visible or public.is_admin());

drop policy if exists reviews_escrita on public.reviews;
create policy reviews_escrita on public.reviews
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;

-- -----------------------------------------------------------------------------
-- OS PEDIDOS PAGOS, PARA O PAINEL ESCOLHER
--
-- Só para administrador, e só o necessário para reconhecer o pedido: primeiro
-- nome, cidade, produto, quando pagou e se já tem avaliação. CPF, endereço e
-- telefone continuam fora do alcance do navegador.
-- -----------------------------------------------------------------------------
create or replace function public.pedidos_pagos_para_avaliar()
returns table (
  id            uuid,
  paid_at       timestamptz,
  primeiro_nome text,
  cidade        text,
  product_slug  text,
  produto_nome  text,
  tem_avaliacao boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select o.id,
         coalesce(o.paid_at, o.created_at),
         split_part(trim(coalesce(o.customer_name, '')), ' ', 1),
         trim(concat_ws(' - ', nullif(o.customer_city, ''), nullif(o.customer_state, ''))),
         public.produto_do_pedido(o.items),
         o.items -> 'product' ->> 'name',
         exists (select 1 from public.reviews r where r.order_id = o.id)
  from public.orders o
  where o.status = 'paid' and public.is_admin()
  order by coalesce(o.paid_at, o.created_at) desc
  limit 500;
$$;

revoke all on function public.pedidos_pagos_para_avaliar() from public;
grant execute on function public.pedidos_pagos_para_avaliar() to authenticated;
