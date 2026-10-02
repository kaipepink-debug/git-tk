-- =============================================================================
-- PRODUTOS EDITÁVEIS PELO PAINEL
--
-- Até aqui cada produto morava em dois arquivos de código — o que o cliente vê
-- (storeContent.ts) e o que o servidor cobra (pricing.ts) — e trocar um preço
-- era deploy. Agora os dois leem desta tabela: o painel /admin grava aqui e o
-- site e o Pix mudam juntos, na hora.
--
-- O preço é guardado em CENTAVOS dentro de cada versão, pelo mesmo motivo da
-- tabela de pedidos: real com casa decimal em ponto flutuante perde centavo.
--
-- Nota, "vendidos" e avaliações NÃO moram aqui de propósito: são números que
-- só podem vir de vendas e avaliações de verdade, e um campo de texto livre
-- para eles seria uma ferramenta de inventá-los.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- QUEM ADMINISTRA
--
-- Uma lista de e-mails, e não um papel no token: acrescentar ou tirar alguém é
-- um insert/delete aqui, sem mexer em código nem em configuração de login.
-- -----------------------------------------------------------------------------
create table if not exists public.admins (
  email      text primary key,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- sem policy: ninguém lê nem escreve pela API pública; só a função abaixo.

insert into public.admins (email) values ('manda@tk.shop') on conflict do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- VERSÕES VÁLIDAS
--
-- Cada versão precisa de nome e de preço inteiro positivo em centavos. Conferir
-- aqui, e não só no painel, é o que impede um preço zerado de chegar ao Pix.
-- -----------------------------------------------------------------------------
create or replace function public.versoes_validas(v jsonb)
returns boolean
language sql
immutable
as $$
  select jsonb_typeof(v) = 'array'
     and jsonb_array_length(v) between 1 and 20
     and not exists (
       select 1 from jsonb_array_elements(v) e
       where coalesce(trim(e ->> 'label'), '') = ''
          or jsonb_typeof(e -> 'price_cents') <> 'number'
          or (e ->> 'price_cents')::numeric <= 0
          or (e ->> 'price_cents')::numeric <> trunc((e ->> 'price_cents')::numeric)
     );
$$;

create table if not exists public.products (
  slug          text primary key,
  title         text not null,
  description   text not null default '',
  images        text[] not null default '{}',
  variant_label text not null default 'Versão',
  variants      jsonb not null,
  delivery_text text not null default '',
  protection    text[] not null default '{}',
  active        boolean not null default true,
  position      integer not null default 0,
  updated_at    timestamptz not null default now(),
  updated_by    text,

  -- o endereço vira /p/<slug>: só letra minúscula, número e hífen
  constraint products_slug_valido check (slug ~ '^[a-z0-9][a-z0-9-]{1,59}$'),
  constraint products_versoes_validas check (public.versoes_validas(variants))
);

create or replace function public.products_carimba()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.jwt() ->> 'email', new.updated_by);
  return new;
end;
$$;
drop trigger if exists products_carimba on public.products;
create trigger products_carimba before insert or update on public.products
  for each row execute function public.products_carimba();

alter table public.products enable row level security;

drop policy if exists products_leitura on public.products;
create policy products_leitura on public.products
  for select using (active or public.is_admin());

drop policy if exists products_escrita on public.products;
create policy products_escrita on public.products
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

-- -----------------------------------------------------------------------------
-- FOTOS
--
-- Bucket público para leitura (a vitrine mostra as fotos para qualquer um) e
-- escrita só de administrador.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produtos', 'produtos', true, 5242880,
        array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists produtos_fotos_leitura on storage.objects;
create policy produtos_fotos_leitura on storage.objects
  for select using (bucket_id = 'produtos');

drop policy if exists produtos_fotos_envio on storage.objects;
create policy produtos_fotos_envio on storage.objects
  for insert to authenticated with check (bucket_id = 'produtos' and public.is_admin());

drop policy if exists produtos_fotos_troca on storage.objects;
create policy produtos_fotos_troca on storage.objects
  for update to authenticated using (bucket_id = 'produtos' and public.is_admin());

drop policy if exists produtos_fotos_remocao on storage.objects;
create policy produtos_fotos_remocao on storage.objects
  for delete to authenticated using (bucket_id = 'produtos' and public.is_admin());
