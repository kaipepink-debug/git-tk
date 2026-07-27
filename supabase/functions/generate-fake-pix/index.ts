/**
 * @file supabase/functions/generate-fake-pix/index.ts
 * @description Função para gerar transações "falsas" (PIX gerado, mas não pago) para ajustar a taxa de conversão.
 * 
 * Este mecanismo (Anti-Desvio) visa "diluir" a taxa de conversão real gerando ordens pendentes,
 * evitando que gateways de pagamento marquem a conta por taxa de conversão atípica.
 * 
 * Fluxo:
 * 1. Verifica se o recurso anti-desvio está ativo nas configurações do site.
 * 2. Calcula a taxa de conversão atual (pedidos pagos / total de pedidos).
 * 3. Se a taxa atual for maior que o alvo, calcula quantos pedidos "fake" são necessários.
 * 4. Gera dados aleatórios (nomes, CPFs, e-mails, endereços) e insere os registros na tabela 'orders'.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Cabeçalhos CORS.
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Lista de nomes para geração aleatória.
 */
const FIRST_NAMES = [
  "João", "Maria", "Pedro", "Ana", "Carlos", "Fernanda", "Lucas", "Juliana",
  "Rafael", "Camila", "Bruno", "Patrícia", "Gustavo", "Larissa", "Thiago",
  "Beatriz", "André", "Vanessa", "Rodrigo", "Letícia", "Felipe", "Mariana",
  "Eduardo", "Gabriela", "Marcelo", "Daniela", "Roberto", "Priscila",
  "Alexandre", "Natália", "Leonardo", "Renata", "Fernando", "Aline",
];

/**
 * Lista de cidades e estados para geração aleatória.
 */
const CITIES = [
  { city: "São Paulo", state: "SP", cep: "01001" },
  { city: "Rio de Janeiro", state: "RJ", cep: "20040" },
  { city: "Belo Horizonte", state: "MG", cep: "30130" },
  { city: "Curitiba", state: "PR", cep: "80010" },
  { city: "Salvador", state: "BA", cep: "40020" },
  { city: "Fortaleza", state: "CE", cep: "60060" },
  { city: "Recife", state: "PE", cep: "50030" },
  { city: "Porto Alegre", state: "RS", cep: "90010" },
  { city: "Manaus", state: "AM", cep: "69005" },
  { city: "Goiânia", state: "GO", cep: "74003" },
  { city: "Brasília", state: "DF", cep: "70040" },
  { city: "Campinas", state: "SP", cep: "13015" },
  { city: "Belém", state: "PA", cep: "66017" },
  { city: "Vitória", state: "ES", cep: "29010" },
  { city: "Natal", state: "RN", cep: "59010" },
];

/**
 * Seleciona um elemento aleatório de um array.
 * @param {T[]} arr - O array de entrada.
 * @returns {T} O elemento selecionado.
 */
function randomEl<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Gera um CPF válido aleatório (apenas números).
 * @returns {string} CPF gerado.
 */
function generateCPF(): string {
  const n = () => Math.floor(Math.random() * 10);
  const d = Array.from({ length: 9 }, n);
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += d[i] * (len + 1 - i);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  d.push(calc(9));
  d.push(calc(10));
  return d.join("");
}

/**
 * Gera um número de telefone celular brasileiro aleatório.
 * @returns {string} Telefone gerado (DDD + 9 + 8 dígitos).
 */
function generatePhone(): string {
  const ddd = [11, 21, 31, 41, 51, 61, 71, 81, 85, 92, 62, 19, 91, 27, 84][Math.floor(Math.random() * 15)];
  const num = Math.floor(Math.random() * 90000000) + 10000000;
  return `${ddd}9${num}`;
}

/**
 * Gera um endereço de e-mail baseado no nome fornecido.
 * @param {string} name - Nome base para o e-mail.
 * @returns {string} E-mail gerado.
 */
function generateEmail(name: string): string {
  const providers = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com.br"];
  const clean = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ".");
  return `${clean}${Math.floor(Math.random() * 999)}@${randomEl(providers)}`;
}

/**
 * Handler principal para geração de ordens fakes.
 * 
 * @param {Request} req - Requisição. Pode conter {"scheduled": true} no corpo.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Tenta ler o corpo da requisição para verificar se é uma chamada agendada
    let body: any = {};
    try { body = await req.json(); } catch { /* corpo vazio é aceitável */ }

    // Busca configurações de anti-desvio no banco de dados
    const { data: settings } = await supabaseAdmin
      .from("site_settings")
      .select("key, value")
      .in("key", ["anti_desvio_enabled", "anti_desvio_target_rate"]);

    const settingsMap: Record<string, string> = {};
    settings?.forEach((r: any) => { settingsMap[r.key] = r.value; });

    const enabled = settingsMap["anti_desvio_enabled"] === "true";
    const target = parseFloat(settingsMap["anti_desvio_target_rate"]) || 30;

    // Se o recurso não estiver ativado, encerra a execução
    if (!enabled) {
      console.log("Anti-desvio disabled, skipping");
      return new Response(JSON.stringify({
        generated: 0,
        message: "Anti-desvio desativado",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Obtém estatísticas atuais de pedidos
    const { count: totalCount } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true });
    const { count: paidCount } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "paid");

    const total = totalCount || 0;
    const paid = paidCount || 0;
    const currentRate = total > 0 ? (paid / total) * 100 : 0;

    console.log(`Current rate: ${currentRate.toFixed(1)}%, target: ${target}%, total: ${total}, paid: ${paid}`);

    // Se a taxa já estiver abaixo do alvo, não faz nada
    if (currentRate <= target) {
      return new Response(JSON.stringify({
        generated: 0,
        currentRate,
        message: "Taxa já está abaixo do alvo",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Calcula quantas ordens fakes são necessárias para atingir o alvo:
    // (pago / (total + x)) * 100 = target  =>  x = (pago * 100 / target) - total
    const needed = Math.ceil((paid * 100 / target) - total);

    if (needed <= 0) {
      return new Response(JSON.stringify({
        generated: 0,
        currentRate,
        message: "Nenhuma transação necessária",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Para execuções agendadas, limita o tamanho do lote para evitar picos repentinos
    const maxPerRun = body?.scheduled ? Math.min(needed, 10) : needed;

    // Busca os preços dos produtos ativos para usar nas ordens fakes
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("variants")
      .eq("is_active", true)
      .single();

    const variants = (product?.variants as any[]) || [];
    const prices = variants.map((v: any) => v.price).filter(Boolean);
    const defaultPrice = prices.length > 0 ? prices[0] : 6820;

    // Gera o lote de ordens fakes
    const batch = [];
    for (let j = 0; j < maxPerRun; j++) {
      const firstName = randomEl(FIRST_NAMES);
      const fullName = `${firstName} Silva`;
      const location = randomEl(CITIES);
      const price = prices.length > 0 ? randomEl(prices) : defaultPrice;
      const qty = Math.random() > 0.7 ? 2 : 1;

      // Gera uma data aleatória recente
      const maxDays = body?.scheduled ? 0.5 : 7;
      const daysAgo = Math.random() * maxDays;
      const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

      batch.push({
        customer_name: fullName,
        customer_email: generateEmail(fullName),
        customer_document: generateCPF(),
        customer_phone: generatePhone(),
        amount: price * qty,
        quantity: qty,
        status: "pix_generated",
        pix_code: `fake_pix_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        transaction_id: `fake_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        customer_city: location.city,
        customer_state: location.state,
        customer_cep: location.cep + String(Math.floor(Math.random() * 900) + 100),
        created_at: createdAt,
      });
    }

    // Insere as ordens fakes no banco de dados
    const { error } = await supabaseAdmin.from("orders").insert(batch);
    const generated = error ? 0 : batch.length;
    if (error) console.error("Insert error:", error);

    const newTotal = total + generated;
    const newRate = newTotal > 0 ? (paid / newTotal) * 100 : 0;

    console.log(`Generated ${generated} fake orders. Rate: ${currentRate.toFixed(1)}% → ${newRate.toFixed(1)}%`);

    return new Response(JSON.stringify({
      generated,
      currentRate: newRate,
      previousRate: currentRate,
      needed: needed - generated,
      message: `${generated} transações geradas. Taxa: ${currentRate.toFixed(1)}% → ${newRate.toFixed(1)}%`,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
