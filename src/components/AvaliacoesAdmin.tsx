/**
 * Avaliações no painel /admin: cadastrar, corrigir, esconder, apagar e pôr foto.
 *
 * TODA AVALIAÇÃO NASCE DE UM PEDIDO PAGO. A lista para escolher vem de
 * `pedidos_pagos_para_avaliar()` e o banco recusa qualquer outra coisa — o
 * gatilho de `reviews` confere o pedido e tira dele o produto. Esta tela não
 * tem campo de produto nem de "nota da loja": os dois saem das vendas.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// `reviews` e a função dos pedidos não estão nos tipos gerados do cliente.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
const BUCKET = "produtos";

interface Avaliacao {
  id: string;
  created_at: string;
  order_id: string;
  product_slug: string;
  rating: number;
  author_name: string;
  author_city: string;
  body: string;
  photos: string[];
  visible: boolean;
}

interface PedidoPago {
  id: string;
  paid_at: string;
  primeiro_nome: string;
  cidade: string;
  product_slug: string;
  produto_nome: string | null;
  tem_avaliacao: boolean;
}

interface Form {
  id: string | null;
  order_id: string;
  rating: number;
  author_name: string;
  author_city: string;
  body: string;
  photos: string[];
  visible: boolean;
}

const campo = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#FF2B56] focus:outline-none";
const rotulo = "block text-xs font-semibold text-gray-600 mb-1";
const botao = "rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50";
const data = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");
const estrelas = (n: number) => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
const pedidoCurto = (id: string) => id.slice(0, 8);

const AvaliacoesAdmin = () => {
  const [lista, setLista] = useState<Avaliacao[]>([]);
  const [pedidos, setPedidos] = useState<PedidoPago[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [subindo, setSubindo] = useState(false);

  const carrega = useCallback(async () => {
    const [{ data: av }, { data: pp, error }] = await Promise.all([
      db.from("reviews").select("*").order("created_at", { ascending: false }),
      db.rpc("pedidos_pagos_para_avaliar"),
    ]);
    setLista(av ?? []);
    setPedidos(pp ?? []);
    if (error) setErro(`Não consegui ler os pedidos pagos: ${error.message}`);
  }, []);

  useEffect(() => { carrega(); }, [carrega]);

  const porPedido = useMemo(() => Object.fromEntries(pedidos.map((p) => [p.id, p])), [pedidos]);
  const livres = pedidos.filter((p) => !p.tem_avaliacao);

  const nova = () => {
    setErro(""); setAviso("");
    const p = livres[0];
    setForm({
      id: null, order_id: p?.id ?? "", rating: 5,
      author_name: p?.primeiro_nome ?? "", author_city: p?.cidade ?? "",
      body: "", photos: [], visible: true,
    });
  };

  const escolhePedido = (id: string) => {
    if (!form) return;
    const p = porPedido[id];
    setForm({ ...form, order_id: id,
      author_name: form.author_name || p?.primeiro_nome || "",
      author_city: form.author_city || p?.cidade || "" });
  };

  const sobeFotos = async (arquivos: FileList | null) => {
    if (!form || !arquivos?.length) return;
    if (!form.order_id) { setErro("Escolha o pedido antes de enviar fotos."); return; }
    setSubindo(true);
    const novas: string[] = [];
    for (const arq of Array.from(arquivos)) {
      if (form.photos.length + novas.length >= 6) { setErro("No máximo 6 fotos por avaliação."); break; }
      if (arq.size > 5 * 1024 * 1024) { setErro(`${arq.name}: maior que 5 MB.`); continue; }
      const ext = (arq.name.split(".").pop() || "jpg").toLowerCase();
      const caminho = `avaliacoes/${form.order_id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const { error } = await db.storage.from(BUCKET).upload(caminho, arq, { contentType: arq.type, upsert: false });
      if (error) { setErro(`${arq.name}: ${error.message}`); continue; }
      novas.push(db.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl);
    }
    setSubindo(false);
    if (novas.length) setForm((f) => (f ? { ...f, photos: [...f.photos, ...novas] } : f));
  };

  const salva = async () => {
    if (!form) return;
    if (!form.order_id) { setErro("Escolha o pedido pago de quem avaliou."); return; }
    if (!form.author_name.trim()) { setErro("Falta o nome de quem avaliou."); return; }
    setSalvando(true); setErro("");
    const linha = {
      order_id: form.order_id,
      rating: form.rating,
      author_name: form.author_name.trim(),
      author_city: form.author_city.trim(),
      body: form.body.trim(),
      photos: form.photos,
      visible: form.visible,
    };
    const { error } = form.id
      ? await db.from("reviews").update(linha).eq("id", form.id)
      : await db.from("reviews").insert(linha);
    setSalvando(false);
    if (error) { setErro(`O banco recusou: ${error.message}`); return; }
    setForm(null);
    setAviso(linha.visible ? "Avaliação salva. Já aparece na página do produto."
                           : "Avaliação salva, escondida — não aparece na página.");
    carrega();
  };

  const alterna = async (a: Avaliacao) => {
    const { error } = await db.from("reviews").update({ visible: !a.visible }).eq("id", a.id);
    if (error) { setErro(error.message); return; }
    carrega();
  };

  const apaga = async (a: Avaliacao) => {
    if (!window.confirm(`Apagar a avaliação de ${a.author_name}? Não tem volta.`)) return;
    const { error } = await db.from("reviews").delete().eq("id", a.id);
    if (error) { setErro(error.message); return; }
    carrega();
  };

  // ------------------------------------------------------------ formulário
  if (form) {
    const opcoes = form.id ? pedidos.filter((p) => p.id === form.order_id) : livres;
    return (
      <div className="mt-4 rounded-2xl bg-white p-5 shadow">
        <button className="text-sm text-gray-500" onClick={() => { setForm(null); setErro(""); }}>← Voltar às avaliações</button>
        <h2 className="mt-2 font-semibold">{form.id ? "Editar avaliação" : "Nova avaliação"}</h2>

        <div className="mt-4 space-y-4">
          <div>
            <label className={rotulo}>Pedido pago de quem avaliou</label>
            <select className={campo} value={form.order_id} disabled={Boolean(form.id)}
              onChange={(e) => escolhePedido(e.target.value)}>
              {!form.order_id && <option value="">Escolha o pedido…</option>}
              {opcoes.map((p) => (
                <option key={p.id} value={p.id}>
                  #{pedidoCurto(p.id)} · {p.primeiro_nome || "sem nome"} · {p.produto_nome || p.product_slug} · pago em {data(p.paid_at)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">A avaliação vai para o produto deste pedido. Cada pedido pago rende uma avaliação.</p>
          </div>

          <div>
            <label className={rotulo}>Nota</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })}
                  className={`text-2xl ${n <= form.rating ? "text-yellow-500" : "text-gray-300"}`} aria-label={`${n} estrela(s)`}>★</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={rotulo}>Nome que aparece</label>
              <input className={campo} value={form.author_name} maxLength={60}
                onChange={(e) => setForm({ ...form, author_name: e.target.value })} placeholder="Ex.: Mariana S." />
            </div>
            <div>
              <label className={rotulo}>Cidade (opcional)</label>
              <input className={campo} value={form.author_city}
                onChange={(e) => setForm({ ...form, author_city: e.target.value })} placeholder="Ex.: Goiânia - GO" />
            </div>
          </div>

          <div>
            <label className={rotulo}>O que o cliente disse</label>
            <textarea className={`${campo} h-28`} value={form.body} maxLength={2000}
              onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </div>

          <div>
            <label className={rotulo}>Fotos do cliente (até 6)</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {form.photos.map((src, i) => (
                <div key={src} className="rounded-lg border bg-gray-50 p-1">
                  <img src={src} alt="" className="aspect-square w-full rounded object-cover" />
                  <button className="mt-1 w-full text-xs text-red-600"
                    onClick={() => setForm({ ...form, photos: form.photos.filter((_, j) => j !== i) })}>remover</button>
                </div>
              ))}
              {form.photos.length < 6 && (
                <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed text-center text-xs text-gray-500">
                  {subindo ? "Enviando…" : "+ Fotos"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" disabled={subindo}
                    onChange={(e) => { sobeFotos(e.target.files); e.target.value = ""; }} />
                </label>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-400">JPG, PNG ou WebP até 5 MB — as fotos que o cliente mandou do produto recebido.</p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} />
            Mostrar na página do produto
          </label>

          {erro && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
          <div className="flex justify-end">
            <button className={`${botao} bg-[#FF2B56] text-white`} onClick={salva} disabled={salvando || subindo}>
              {salvando ? "Salvando…" : "Salvar avaliação"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------ lista
  return (
    <div className="mt-4 rounded-2xl bg-white p-5 shadow">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Avaliações</h2>
        <button className={`${botao} bg-[#FF2B56] text-white`} onClick={nova} disabled={!livres.length}>+ Nova avaliação</button>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {pedidos.length === 0
          ? "Ainda não há pedido pago. Cada avaliação precisa ser de um pedido pago — quando a primeira venda confirmar, o botão libera."
          : `${pedidos.length} pedido(s) pago(s) · ${livres.length} ainda sem avaliação.`}
      </p>

      {lista.length > 0 && (
        <ul className="mt-3 divide-y">
          {lista.map((a) => (
            <li key={a.id} className="flex items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="text-yellow-500">{estrelas(a.rating)}</span>{" "}
                  <b>{a.author_name}</b>
                  {a.author_city && <span className="text-gray-500"> · {a.author_city}</span>}
                </p>
                {a.body && <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">{a.body}</p>}
                <p className="mt-0.5 text-xs text-gray-400">
                  {a.product_slug} · pedido #{pedidoCurto(a.order_id)} · {data(a.created_at)}
                  {a.photos.length > 0 && ` · ${a.photos.length} foto(s)`}
                  {" · "}<span className={a.visible ? "text-green-600" : "text-gray-400"}>{a.visible ? "visível" : "escondida"}</span>
                </p>
              </div>
              <div className="flex flex-none gap-2">
                <button className={`${botao} border`} onClick={() => alterna(a)}>{a.visible ? "Esconder" : "Mostrar"}</button>
                <button className={`${botao} border`} onClick={() => { setErro(""); setAviso(""); setForm({
                  id: a.id, order_id: a.order_id, rating: a.rating, author_name: a.author_name,
                  author_city: a.author_city, body: a.body, photos: [...a.photos], visible: a.visible }); }}>Editar</button>
                <button className={`${botao} border text-red-600`} onClick={() => apaga(a)}>Apagar</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {erro && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
      {aviso && <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">{aviso}</p>}
    </div>
  );
};

export default AvaliacoesAdmin;
