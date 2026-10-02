/**
 * Rota: /admin
 * Painel da loja: produtos (texto, fotos, versões, preços, prazos, ativo) e o
 * pixel do TikTok. Grava direto na Supabase — a vitrine lê de lá e o Pix cobra
 * de lá, então o que se salva aqui vale na hora, sem deploy.
 *
 * Quem pode salvar não é decidido nesta tela: é a regra de acesso do banco
 * (is_admin), que confere o e-mail do login. Esta tela só esconde o formulário
 * de quem não é administrador — esconder não é proteger.
 *
 * Nota, "vendidos" e avaliações ficam de fora de propósito: só podem vir de
 * vendas e avaliações de verdade.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { daLinha, enderecoDoProduto, SLUG_VALIDO, type ProdutoBanco, type VersaoBanco } from "@/lib/catalogo";

// `products` e `settings` não estão nos tipos gerados do cliente.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const EMAIL_PADRAO = "manda@tk.shop";
const BUCKET = "produtos";

/** "24.990,00" | "24990" | "24990.5" → centavos; null se não for um valor. */
function paraCentavos(texto: string): number | null {
  const limpo = texto.trim().replace(/[R$\s]/g, "");
  if (!limpo) return null;
  const normal = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const n = Number(normal);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}
const deCentavos = (c: number) =>
  (c / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface VersaoForm { label: string; preco: string; delivery: string; stock: string }
interface ProdutoForm {
  novo: boolean;
  slug: string;
  title: string;
  description: string;
  images: string[];
  variant_label: string;
  versoes: VersaoForm[];
  delivery_text: string;
  protection: string;
  active: boolean;
  position: number;
}

const paraForm = (p: ProdutoBanco): ProdutoForm => ({
  novo: false,
  slug: p.slug,
  title: p.title,
  description: p.description,
  images: [...p.images],
  variant_label: p.variant_label,
  versoes: p.variants.map((v) => ({
    label: v.label,
    preco: deCentavos(v.price_cents),
    delivery: v.delivery ?? "",
    stock: String(v.stock ?? 99),
  })),
  delivery_text: p.delivery_text,
  protection: p.protection.join("\n"),
  active: p.active,
  position: p.position,
});

const produtoVazio = (position: number): ProdutoForm => ({
  novo: true,
  slug: "",
  title: "",
  description: "",
  images: [],
  variant_label: "Versão",
  versoes: [{ label: "", preco: "", delivery: "", stock: "99" }],
  delivery_text: "Enviado por transportadora · frete incluso",
  protection: "Pagamento seguro via Pix\nGarantia legal de 90 dias\n7 dias para desistir da compra\nNota fiscal",
  active: false,
  position,
});

/** Confere o formulário e devolve a linha para o banco, ou a lista de problemas. */
function validar(f: ProdutoForm): { linha?: Omit<ProdutoBanco, "position"> & { position: number }; erros: string[] } {
  const erros: string[] = [];
  if (!SLUG_VALIDO.test(f.slug)) erros.push("Endereço: use só letras minúsculas, números e hífen (ex.: kart-eletrico).");
  if (!f.title.trim()) erros.push("Título é obrigatório.");
  if (f.images.length === 0) erros.push("Coloque pelo menos uma foto.");
  const variants: VersaoBanco[] = [];
  f.versoes.forEach((v, i) => {
    const centavos = paraCentavos(v.preco);
    if (!v.label.trim()) erros.push(`Versão ${i + 1}: falta o nome.`);
    if (centavos === null) erros.push(`Versão ${i + 1}: preço inválido.`);
    const stock = Math.max(0, Math.floor(Number(v.stock) || 0));
    if (centavos !== null) {
      variants.push({
        label: v.label.trim(),
        price_cents: centavos,
        stock,
        ...(v.delivery.trim() ? { delivery: v.delivery.trim() } : {}),
      });
    }
  });
  if (f.versoes.length === 0) erros.push("Precisa de pelo menos uma versão.");
  if (erros.length) return { erros };
  return {
    erros,
    linha: {
      slug: f.slug,
      title: f.title.trim(),
      description: f.description,
      images: f.images,
      variant_label: f.variant_label.trim() || "Versão",
      variants,
      delivery_text: f.delivery_text.trim(),
      protection: f.protection.split("\n").map((l) => l.trim()).filter(Boolean),
      active: f.active,
      position: f.position,
    },
  };
}

const campo = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#FF2B56] focus:outline-none";
const rotulo = "block text-xs font-semibold text-gray-600 mb-1";
const botao = "rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50";

const Admin = () => {
  const [sessao, setSessao] = useState<{ email: string } | null | undefined>(undefined);
  const [ehAdmin, setEhAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState(EMAIL_PADRAO);
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);

  const [produtos, setProdutos] = useState<ProdutoBanco[]>([]);
  const [editando, setEditando] = useState<ProdutoForm | null>(null);
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [subindo, setSubindo] = useState(false);
  const [pixel, setPixel] = useState("");
  const [pixelSalvo, setPixelSalvo] = useState("");

  // Painel não aparece em busca.
  useEffect(() => {
    const m = document.createElement("meta");
    m.name = "robots";
    m.content = "noindex, nofollow";
    document.head.appendChild(m);
    const antes = document.title;
    document.title = "Painel da loja";
    return () => { m.remove(); document.title = antes; };
  }, []);

  useEffect(() => {
    db.auth.getSession().then(({ data }: { data: { session: { user: { email?: string } } | null } }) =>
      setSessao(data.session ? { email: data.session.user.email ?? "" } : null));
    const { data } = db.auth.onAuthStateChange((_e: string, s: { user: { email?: string } } | null) =>
      setSessao(s ? { email: s.user.email ?? "" } : null));
    return () => data.subscription.unsubscribe();
  }, []);

  const carrega = useCallback(async () => {
    const [{ data: lista }, { data: conf }] = await Promise.all([
      db.from("products").select("*").order("position"),
      db.from("settings").select("value").eq("key", "tiktok_pixel_id").maybeSingle(),
    ]);
    setProdutos(lista ?? []);
    setPixel(conf?.value ?? "");
    setPixelSalvo(conf?.value ?? "");
  }, []);

  useEffect(() => {
    if (!sessao) { setEhAdmin(null); return; }
    db.rpc("is_admin").then(({ data }: { data: boolean }) => {
      setEhAdmin(Boolean(data));
      if (data) carrega();
    });
  }, [sessao, carrega]);

  const pedeLink = async () => {
    setEnviando(true);
    setAviso("");
    const { error } = await db.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${location.origin}/admin` },
    });
    setEnviando(false);
    setAviso(error
      ? `Não consegui enviar: ${error.message}`
      : "Pronto! Abra o e-mail e toque em \"Entrar no painel\". O link vale por 1 hora.");
  };

  const salva = async () => {
    if (!editando) return;
    const { linha, erros: problemas } = validar(editando);
    setErros(problemas);
    if (!linha) return;
    if (editando.novo && produtos.some((p) => p.slug === linha.slug)) {
      setErros(["Já existe um produto com esse endereço."]);
      return;
    }
    setSalvando(true);
    const { error } = editando.novo
      ? await db.from("products").insert(linha)
      : await db.from("products").update(linha).eq("slug", linha.slug);
    setSalvando(false);
    if (error) { setErros([`O banco recusou: ${error.message}`]); return; }
    await carrega();
    setEditando({ ...editando, novo: false });
    setAviso(`Salvo. Já está valendo no site${linha.active ? "" : " (produto desativado — não aparece na loja)"}.`);
  };

  const sobeFotos = async (arquivos: FileList | null) => {
    if (!editando || !arquivos?.length) return;
    if (!SLUG_VALIDO.test(editando.slug)) {
      setErros(["Defina o endereço do produto antes de enviar fotos."]);
      return;
    }
    setSubindo(true);
    const novas: string[] = [];
    for (const arq of Array.from(arquivos)) {
      if (arq.size > 5 * 1024 * 1024) { setErros((e) => [...e, `${arq.name}: maior que 5 MB.`]); continue; }
      const ext = (arq.name.split(".").pop() || "jpg").toLowerCase();
      const caminho = `${editando.slug}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const { error } = await db.storage.from(BUCKET).upload(caminho, arq, { contentType: arq.type, upsert: false });
      if (error) { setErros((e) => [...e, `${arq.name}: ${error.message}`]); continue; }
      novas.push(db.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl);
    }
    setSubindo(false);
    if (novas.length) setEditando((f) => (f ? { ...f, images: [...f.images, ...novas] } : f));
  };

  const salvaPixel = async () => {
    const valor = pixel.trim().toUpperCase();
    if (valor && !/^[A-Z0-9]{10,40}$/.test(valor)) {
      setAviso("ID do pixel inválido: só letras e números, como DAH37V3C77UDHLL3Q7Q0.");
      return;
    }
    const { error } = await db.from("settings").upsert({ key: "tiktok_pixel_id", value: valor });
    if (error) { setAviso(`Não salvou o pixel: ${error.message}`); return; }
    setPixelSalvo(valor);
    setPixel(valor);
    setAviso(valor ? "Pixel salvo. Vale para quem abrir o site a partir de agora." : "Pixel desligado.");
  };

  const previa = useMemo(() => {
    if (!editando) return null;
    const { linha } = validar(editando);
    return linha ? daLinha(linha as ProdutoBanco) : null;
  }, [editando]);

  const pagina = "min-h-screen bg-gray-50 px-4 py-6";
  const caixa = "mx-auto max-w-3xl";

  // ---------------------------------------------------------------- login
  if (sessao === undefined) return <div className={pagina} />;
  if (!sessao) {
    return (
      <div className={pagina}>
        <div className="mx-auto mt-16 max-w-sm rounded-2xl bg-white p-6 shadow">
          <h1 className="text-lg font-bold">Painel da loja</h1>
          <p className="mt-1 text-sm text-gray-500">Entre com o e-mail de administrador. Você recebe um link de acesso — sem senha.</p>
          <label className={`${rotulo} mt-4`} htmlFor="email">E-mail</label>
          <input id="email" className={campo} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className={`${botao} mt-4 w-full bg-[#FF2B56] text-white`} onClick={pedeLink} disabled={enviando || !email.includes("@")}>
            {enviando ? "Enviando…" : "Receber link de acesso"}
          </button>
          {aviso && <p className="mt-3 text-sm text-gray-700">{aviso}</p>}
        </div>
      </div>
    );
  }
  if (ehAdmin === null) return <div className={pagina} />;
  if (!ehAdmin) {
    return (
      <div className={pagina}>
        <div className="mx-auto mt-16 max-w-sm rounded-2xl bg-white p-6 text-center shadow">
          <p className="text-sm">O e-mail <b>{sessao.email}</b> não tem acesso ao painel.</p>
          <button className={`${botao} mt-4 border`} onClick={() => db.auth.signOut()}>Sair</button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- edição
  if (editando) {
    const f = editando;
    const muda = (parcial: Partial<ProdutoForm>) => setEditando({ ...f, ...parcial });
    const mudaVersao = (i: number, parcial: Partial<VersaoForm>) =>
      muda({ versoes: f.versoes.map((v, j) => (j === i ? { ...v, ...parcial } : v)) });
    const moveFoto = (i: number, d: number) => {
      const imgs = [...f.images];
      const j = i + d;
      if (j < 0 || j >= imgs.length) return;
      [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
      muda({ images: imgs });
    };

    return (
      <div className={pagina}>
        <div className={caixa}>
          <button className="text-sm text-gray-500" onClick={() => { setEditando(null); setErros([]); setAviso(""); }}>← Voltar aos produtos</button>
          <h1 className="mt-2 text-xl font-bold">{f.novo ? "Novo produto" : f.title || f.slug}</h1>

          <div className="mt-4 space-y-4 rounded-2xl bg-white p-5 shadow">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={f.active} onChange={(e) => muda({ active: e.target.checked })} />
                Produto ativo (aparece na loja)
              </label>
              {!f.novo && f.active && (
                <a className="text-sm text-[#FF2B56] underline" href={enderecoDoProduto(f.slug)} target="_blank" rel="noreferrer">Ver página</a>
              )}
            </div>

            <div>
              <label className={rotulo}>Endereço da página</label>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <span>{location.host}{f.slug === "produto" || f.slug === "buggy" ? "/" : "/p/"}</span>
                <input className={campo} value={f.slug} disabled={!f.novo}
                  onChange={(e) => muda({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                  placeholder="kart-eletrico" />
              </div>
              {!f.novo && <p className="mt-1 text-xs text-gray-400">O endereço não muda depois de criado — os anúncios apontam para ele.</p>}
            </div>

            <div>
              <label className={rotulo}>Título</label>
              <input className={campo} value={f.title} onChange={(e) => muda({ title: e.target.value })} />
            </div>

            <div>
              <label className={rotulo}>Descrição</label>
              <textarea className={`${campo} h-64 font-mono text-xs`} value={f.description} onChange={(e) => muda({ description: e.target.value })} />
              <p className="mt-1 text-xs text-gray-400">
                Linha com <b>**texto**</b> vira título · linha começando com <b>✔</b> vira item de lista · uma linha só com <b>---</b> separa seções.
              </p>
            </div>

            <div>
              <label className={rotulo}>Fotos (a primeira é a capa e a do carrinho)</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {f.images.map((src, i) => (
                  <div key={src + i} className="relative rounded-lg border bg-gray-50 p-1">
                    <img src={src} alt="" className="aspect-square w-full rounded object-cover" />
                    <div className="mt-1 flex justify-between text-xs">
                      <button onClick={() => moveFoto(i, -1)} disabled={i === 0} className="px-1 disabled:opacity-30">◀</button>
                      <button onClick={() => muda({ images: f.images.filter((_, j) => j !== i) })} className="px-1 text-red-600">remover</button>
                      <button onClick={() => moveFoto(i, 1)} disabled={i === f.images.length - 1} className="px-1 disabled:opacity-30">▶</button>
                    </div>
                  </div>
                ))}
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-xs text-gray-500">
                  {subindo ? "Enviando…" : "+ Adicionar fotos"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" disabled={subindo}
                    onChange={(e) => { sobeFotos(e.target.files); e.target.value = ""; }} />
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-400">JPG, PNG ou WebP até 5 MB. Remover tira a foto da página.</p>
            </div>

            <div>
              <label className={rotulo}>Versões e preços</label>
              <input className={`${campo} mb-2`} value={f.variant_label} onChange={(e) => muda({ variant_label: e.target.value })} placeholder="Nome do seletor (ex.: Versão, Cor, Tamanho)" />
              <div className="space-y-2">
                {f.versoes.map((v, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_80px]">
                      <input className={campo} value={v.label} onChange={(e) => mudaVersao(i, { label: e.target.value })} placeholder="Nome da versão" />
                      <input className={campo} value={v.preco} onChange={(e) => mudaVersao(i, { preco: e.target.value })} placeholder="Preço (ex.: 24.990,00)" inputMode="decimal" />
                      <input className={campo} value={v.stock} onChange={(e) => mudaVersao(i, { stock: e.target.value })} placeholder="Estoque" inputMode="numeric" title="Estoque (0 = esgotado)" />
                    </div>
                    <input className={`${campo} mt-2`} value={v.delivery} onChange={(e) => mudaVersao(i, { delivery: e.target.value })} placeholder="Prazo desta versão (opcional — vazio usa o prazo geral)" />
                    {f.versoes.length > 1 && (
                      <button className="mt-2 text-xs text-red-600" onClick={() => muda({ versoes: f.versoes.filter((_, j) => j !== i) })}>Remover versão</button>
                    )}
                  </div>
                ))}
              </div>
              <button className="mt-2 text-sm text-[#FF2B56]" onClick={() => muda({ versoes: [...f.versoes, { label: "", preco: "", delivery: "", stock: "99" }] })}>+ Adicionar versão</button>
              <p className="mt-1 text-xs text-gray-400">
                O preço salvo aqui é o mesmo que o Pix cobra. Quem estiver com a página aberta no preço antigo recebe "o valor mudou, recarregue" — nunca é cobrado um valor diferente do que viu.
              </p>
            </div>

            <div>
              <label className={rotulo}>Prazo de entrega geral</label>
              <input className={campo} value={f.delivery_text} onChange={(e) => muda({ delivery_text: e.target.value })} placeholder="Ex.: Enviado por transportadora em até 5 dias úteis" />
              {f.slug === "produto" && <p className="mt-1 text-xs text-gray-400">Vazio no cooler = mostra "Frete grátis · receba em 4 dias".</p>}
            </div>

            <div>
              <label className={rotulo}>Proteção do cliente (um item por linha)</label>
              <textarea className={`${campo} h-24`} value={f.protection} onChange={(e) => muda({ protection: e.target.value })} />
            </div>

            {erros.length > 0 && (
              <ul className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erros.map((e) => <li key={e}>• {e}</li>)}</ul>
            )}
            {aviso && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{aviso}</p>}

            <div className="flex items-center justify-between">
              {previa && <span className="text-xs text-gray-500">{previa.variants.length} versão(ões) · a partir de R$ {deCentavos(Math.min(...previa.variants.map((v) => Math.round(v.price * 100))))}</span>}
              <button className={`${botao} bg-[#FF2B56] text-white`} onClick={salva} disabled={salvando || subindo}>
                {salvando ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- lista
  return (
    <div className={pagina}>
      <div className={caixa}>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Painel da loja</h1>
          <button className="text-sm text-gray-500" onClick={() => db.auth.signOut()}>Sair ({sessao.email})</button>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-5 shadow">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Produtos</h2>
            <button className={`${botao} bg-[#FF2B56] text-white`} onClick={() => { setErros([]); setAviso(""); setEditando(produtoVazio(produtos.length)); }}>+ Novo produto</button>
          </div>
          <ul className="mt-3 divide-y">
            {produtos.map((p) => (
              <li key={p.slug} className="flex items-center gap-3 py-3">
                <img src={p.images[0]} alt="" className="h-14 w-14 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.title}</p>
                  <p className="text-xs text-gray-500">
                    {p.variants.length > 1 ? "a partir de " : ""}R$ {deCentavos(Math.min(...p.variants.map((v) => v.price_cents)))}
                    {" · "}{enderecoDoProduto(p.slug)}
                    {" · "}<span className={p.active ? "text-green-600" : "text-gray-400"}>{p.active ? "ativo" : "desativado"}</span>
                  </p>
                </div>
                <button className={`${botao} border`} onClick={() => { setErros([]); setAviso(""); setEditando(paraForm(p)); }}>Editar</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-5 shadow">
          <h2 className="font-semibold">Pixel do TikTok</h2>
          <p className="mt-1 text-xs text-gray-500">O ID que aparece no Gerenciador de Eventos (ex.: DAH37V3C77UDHLL3Q7Q0). Vazio = pixel desligado. Ele carrega só nas telas do checkout.</p>
          <div className="mt-2 flex gap-2">
            <input className={campo} value={pixel} onChange={(e) => setPixel(e.target.value)} placeholder="ID do pixel" />
            <button className={`${botao} bg-[#FF2B56] text-white`} onClick={salvaPixel} disabled={pixel.trim().toUpperCase() === pixelSalvo}>Salvar</button>
          </div>
        </div>

        {aviso && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{aviso}</p>}
      </div>
    </div>
  );
};

export default Admin;
