/**
 * @file supabase/functions/check-payment/index.ts
 * @description Função para verificar o status de pagamento de uma transação em múltiplos gateways.
 * 
 * Fluxo:
 * 1. Recebe o 'transaction_id'.
 * 2. Busca o gateway ativo na tabela 'gateway_settings'.
 * 3. Consulta a API do gateway correspondente (SigmaPay, PayEvo, SealPay ou ZenixPay).
 * 4. Mapeia o status retornado para o padrão do sistema.
 * 5. Se o pagamento for confirmado, atualiza o status do pedido na tabela 'orders' para 'paid'.
 * 6. Retorna o status final ao cliente.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

/**
 * Cabeçalhos CORS padrão para permitir chamadas do front-end.
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Servidor HTTP que processa as requisições de verificação de pagamento.
 * 
 * @param {Request} req - A requisição HTTP contendo o transaction_id no corpo (JSON).
 * @returns {Promise<Response>} Resposta JSON com o status do pagamento ou erro.
 */
serve(async (req) => {
  // Tratamento de requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extração do transaction_id do corpo da requisição
    const { transaction_id } = await req.json();

    if (!transaction_id) {
      return new Response(JSON.stringify({ error: 'transaction_id é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Inicialização do cliente Supabase com a role administrativa
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Busca as configurações do gateway de pagamento ativo
    const { data: gwData, error: gwError } = await supabaseAdmin
      .from('gateway_settings')
      .select('gateway_name, api_token')
      .eq('is_active', true)
      .single();

    if (gwError || !gwData) {
      return new Response(JSON.stringify({ error: 'Nenhum gateway ativo configurado' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const gateway = gwData.gateway_name;
    const apiToken = gwData.api_token;

    console.log(`Checking payment status via ${gateway} for: ${transaction_id}`);

    let paymentStatus = 'unknown';

    // Roteamento baseado no gateway configurado
    if (gateway === 'SigmaPay' || gateway === 'Adqui') {
      // ===== SigmaPay: GET /transactions/{hash}?api_token=... =====
      const url = `https://api.sigmapay.com.br/api/public/v1/transactions/${transaction_id}?api_token=${apiToken}`;
      console.log('SigmaPay check URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      const responseText = await response.text();
      console.log('SigmaPay raw response:', responseText);

      let data;
      try { data = JSON.parse(responseText); } catch {
        return new Response(JSON.stringify({ error: 'Resposta inválida do gateway', raw: responseText }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!response.ok) {
        return new Response(JSON.stringify({ error: 'Erro ao consultar pagamento', details: data }), {
          status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      paymentStatus = data?.data?.status || data?.status || 'unknown';

    } else if (gateway === 'PayEvo') {
      // ===== PayEvo: GET /transactions/{id} com autenticação Basic =====
      const PAYEVO_SECRET = apiToken || Deno.env.get('PAYEVO_SECRET_KEY');
      const authHeader = 'Basic ' + base64Encode(PAYEVO_SECRET + ':');
      const url = `https://apiv2.payevo.com.br/functions/v1/transactions/${transaction_id}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json', 'Authorization': authHeader },
      });

      const responseText = await response.text();
      console.log('PayEvo raw response:', responseText);

      let data;
      try { data = JSON.parse(responseText); } catch {
        return new Response(JSON.stringify({ error: 'Resposta inválida do gateway', raw: responseText }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!response.ok) {
        return new Response(JSON.stringify({ error: 'Erro ao consultar pagamento', details: data }), {
          status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      paymentStatus = data?.status || data?.payment_status || data?.transaction?.status || 'unknown';

    } else if (gateway === 'SealPay') {
      // ===== SealPay: GET /api/payment-status/{txid} =====
      const url = `https://abacate-5eo1.onrender.com/api/payment-status/${transaction_id}`;
      console.log('SealPay check URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      const responseText = await response.text();
      console.log('SealPay raw response:', responseText);

      let data;
      try { data = JSON.parse(responseText); } catch {
        return new Response(JSON.stringify({ error: 'Resposta inválida do SealPay', raw: responseText }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      paymentStatus = data?.status || 'unknown';

    } else if (gateway === 'ZenixPay') {
      // ===== ZenixPay: GET /api/v1/payments/{transaction_id}/status =====
      const url = `https://api.zenixpay.com.br/api/v1/payments/${transaction_id}/status`;
      console.log('ZenixPay check URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      const responseText = await response.text();
      console.log('ZenixPay raw response:', responseText);

      let data;
      try { data = JSON.parse(responseText); } catch {
        return new Response(JSON.stringify({ error: 'Resposta inválida do ZenixPay', raw: responseText }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // O ZenixPay retorna o status em data.status (PENDING, AUTHORIZED, etc.)
      paymentStatus = data?.data?.status || data?.status || 'unknown';

    } else {
      return new Response(JSON.stringify({ error: `Gateway "${gateway}" não suportado` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Lista de status que consideramos como "pago"
    const isPaid = ['PAID', 'paid', 'approved', 'APPROVED', 'confirmed', 'completed', 'AUTHORIZED', 'authorized'].includes(paymentStatus);
    console.log('Parsed payment status:', paymentStatus, '| isPaid:', isPaid);

    // Se o pagamento foi confirmado, atualiza o pedido no banco de dados
    if (isPaid) {
      try {
        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update({ status: 'paid' })
          .eq('transaction_id', String(transaction_id));

        if (updateError) console.error('Error updating order status:', updateError);
        else console.log('Order status updated to paid for transaction:', transaction_id);
      } catch (dbErr) {
        console.error('DB update error:', dbErr);
      }
    }

    // Retorna a resposta normalizada para o front-end
    return new Response(JSON.stringify({ status: isPaid ? 'paid' : paymentStatus.toLowerCase(), raw_status: paymentStatus }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno', message: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
