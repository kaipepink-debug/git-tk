-- =============================================================================
-- CONFIGURAÇÕES DA LOJA EDITÁVEIS PELO PAINEL
--
-- Hoje só o pixel do TikTok. Chave e valor em texto: cada configuração nova é
-- uma linha, sem migração. Leitura pública (o navegador precisa do ID do pixel
-- para carregá-lo; ele é público por natureza) e escrita só de administrador.
-- Segredo NUNCA entra aqui — o token da API de Conversões continua sendo
-- secret da Edge Function.
-- =============================================================================
create table if not exists public.settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now(),
  constraint settings_chave_conhecida check (key in ('tiktok_pixel_id')),
  -- ID de pixel do TikTok: letras maiúsculas e números, ou vazio (desligado)
  constraint settings_pixel_valido check (key <> 'tiktok_pixel_id' or value ~ '^([A-Z0-9]{10,40})?$')
);
alter table public.settings enable row level security;

drop policy if exists settings_leitura on public.settings;
create policy settings_leitura on public.settings for select using (true);

drop policy if exists settings_escrita on public.settings;
create policy settings_escrita on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.settings to anon, authenticated;
grant insert, update on public.settings to authenticated;

insert into public.settings (key, value) values ('tiktok_pixel_id', 'DAH37V3C77UDHLL3Q7Q0')
on conflict (key) do nothing;
