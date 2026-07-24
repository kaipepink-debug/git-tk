import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FIRST_NAMES = [
  "João", "Maria", "Pedro", "Ana", "Carlos", "Fernanda", "Lucas", "Juliana",
  "Rafael", "Camila", "Bruno", "Patrícia", "Gustavo", "Larissa", "Thiago",
  "Beatriz", "André", "Vanessa", "Rodrigo", "Letícia", "Felipe", "Mariana",
  "Eduardo", "Gabriela", "Marcelo", "Daniela", "Roberto", "Priscila",
  "Alexandre", "Natália", "Leonardo", "Renata", "Fernando", "Aline",
];

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

function randomEl<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

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

function generatePhone(): string {
  const ddd = [11, 21, 31, 41, 51, 61, 71, 81, 85, 92, 62, 19, 91, 27, 84][Math.floor(Math.random() * 15)];
  const num = Math.floor(Math.random() * 90000000) + 10000000;
  return `${ddd}9${num}`;
}

function generateEmail(name: string): string {
  const providers = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com.br"];
  const clean = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ".");
  return `${clean}${Math.floor(Math.random() * 999)}@${randomEl(providers)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if this is a scheduled call or manual
    let body: any = {};
    try { body = await req.json(); } catch { /* empty body is fine */ }

    // Read settings from DB
    const { data: settings } = await supabaseAdmin
      .from("site_settings")
      .select("key, value")
      .in("key", ["anti_desvio_enabled", "anti_desvio_target_rate"]);

    const settingsMap: Record<string, string> = {};
    settings?.forEach((r: any) => { settingsMap[r.key] = r.value; });

    const enabled = settingsMap["anti_desvio_enabled"] === "true";
    const target = parseFloat(settingsMap["anti_desvio_target_rate"]) || 30;

    // If not enabled, skip (for scheduled calls)
    if (!enabled) {
      console.log("Anti-desvio disabled, skipping");
      return new Response(JSON.stringify({
        generated: 0,
        message: "Anti-desvio desativado",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get current stats
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

    if (currentRate <= target) {
      return new Response(JSON.stringify({
        generated: 0,
        currentRate,
        message: "Taxa já está abaixo do alvo",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Calculate how many fake orders needed:
    // (paid / (total + x)) * 100 = target  =>  x = (paid * 100 / target) - total
    const needed = Math.ceil((paid * 100 / target) - total);

    if (needed <= 0) {
      return new Response(JSON.stringify({
        generated: 0,
        currentRate,
        message: "Nenhuma transação necessária",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // For scheduled runs, limit batch size to avoid spikes
    const maxPerRun = body?.scheduled ? Math.min(needed, 10) : needed;

    // Get product prices
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("variants")
      .eq("is_active", true)
      .single();

    const variants = (product?.variants as any[]) || [];
    const prices = variants.map((v: any) => v.price).filter(Boolean);
    const defaultPrice = prices.length > 0 ? prices[0] : 6820;

    // Generate fake orders
    const batch = [];
    for (let j = 0; j < maxPerRun; j++) {
      const firstName = randomEl(FIRST_NAMES);
      const fullName = `${firstName} Silva`;
      const location = randomEl(CITIES);
      const price = prices.length > 0 ? randomEl(prices) : defaultPrice;
      const qty = Math.random() > 0.7 ? 2 : 1;

      // Random date within last 2 days for scheduled runs, 7 days for manual
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
