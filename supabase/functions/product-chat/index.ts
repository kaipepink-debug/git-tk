import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é a assistente virtual da JP Variedades LTDA, uma loja online brasileira. Você deve responder APENAS em português brasileiro, de forma simpática, objetiva e prestativa.

Produto principal: Escada Telescópica Multifuncional Inox
- Tamanhos e preços: 3.5m (R$ 99,00), 5.5m (R$ 134,00), 7.5m (R$ 179,00), 10m (R$ 249,00)
- Mais de 1.300 vendas e 81 avaliações 5 estrelas
- Material: Alumínio/Inox de alta qualidade
- Multifuncional: uso doméstico e profissional
- Frete grátis para todo o Brasil
- Pagamento via PIX

Informações de entrega:
- Sudeste: 5 a 10 dias úteis
- Sul: 7 a 12 dias úteis
- Centro-Oeste: 8 a 14 dias úteis
- Nordeste: 10 a 16 dias úteis
- Norte: 12 a 20 dias úteis
- Prazo inicia após confirmação do pagamento
- Código de rastreamento enviado por e-mail

Contato: contato@JPvariedadesltda.com.br | (89) 98102-5918 | Seg a Sex 9h às 18h

Regras:
- Não invente informações que não estão acima
- Se não souber algo, oriente o cliente a entrar em contato pelo e-mail ou telefone
- Seja breve nas respostas (máximo 3 parágrafos curtos)
- Use emojis com moderação`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas solicitações. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Serviço temporariamente indisponível." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
