/**
 * @file supabase/functions/create-pix/index.ts
 * @description Função para gerar um pagamento via PIX utilizando o gateway configurado.
 * 
 * Fluxo:
 * 1. Recebe os dados do cliente e valor do pedido.
 * 2. Identifica o gateway ativo e o produto associado na tabela 'gateway_settings'.
 * 3. Formata o payload de acordo com a API do gateway (SigmaPay, PayEvo, SealPay ou ZenixPay).
 * 4. Realiza a chamada para gerar o PIX.
 * 5. Salva os dados do pedido na tabela 'orders' com status 'pix_generated'.
 * 6. Retorna o código PIX (copia e cola) e o QR Code em Base64 para o front-end.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

/**
 * Cabeçalhos CORS para permitir acesso externo.
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Servidor HTTP que processa a criação de transações PIX.
 * 
 * @param {Request} req - Requisição HTTP com amount, customer e qty no corpo JSON.
 * @returns {Promise<Response>} Dados do PIX gerado ou erro.
 */
serve(async (req) => {
  // Tratamento de preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Parse seguro do corpo da requisição
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Corpo da requisição inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { amount, customer, qty } = body || {};

    // Validação de valor
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 100) {
      return new Response(JSON.stringify({ error: 'Valor do pedido inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validação de dados do cliente
    if (!customer?.name || !customer?.email || !customer?.document) {
      return new Response(JSON.stringify({ error: 'Dados do cliente incompletos. Preencha nome, e-mail e CPF.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validação simples de e-mail
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(customer.email))) {
      return new Response(JSON.stringify({ error: 'E-mail do cliente inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Busca o gateway configurado como ativo
    const { data: gwData, error: gwError } = await supabaseAdmin
      .from('gateway_settings')
      .select('gateway_name, api_token, product_id')
      .eq('is_active', true)
      .maybeSingle();

    if (gwError) {
      console.error('Erro ao buscar gateway:', gwError);
      return new Response(JSON.stringify({ error: 'Não foi possível carregar as configurações de pagamento. Tente novamente em instantes.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!gwData) {
      return new Response(JSON.stringify({ error: 'Pagamento indisponível no momento. Tente novamente mais tarde.' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const gateway = gwData.gateway_name;
    // Para ZenixPay, permite fallback para o secret ZENIXPAY_API_KEY
    const apiToken = gwData.api_token || (gateway === 'ZenixPay' ? (Deno.env.get('ZENIXPAY_API_KEY') || '') : '');
    const productId = gwData.product_id;

    if (!apiToken) {
      console.error('Gateway ativo sem api_token configurado:', gateway);
      return new Response(JSON.stringify({ error: 'Pagamento indisponível no momento. Tente novamente mais tarde.' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Active gateway: ${gateway}`);

    // Limpeza de caracteres não numéricos de campos sensíveis
    const cleanDoc = String(customer.document).replace(/\D/g, '');
    const cleanPhone = customer.phone_number ? String(customer.phone_number).replace(/\D/g, '') : '';
    const cleanCep = customer.zip_code ? String(customer.zip_code).replace(/\D/g, '') : '';

    if (cleanDoc.length !== 11) {
      return new Response(JSON.stringify({ error: 'CPF inválido. Informe um CPF com 11 dígitos.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const quantity = Number(qty) > 0 ? Number(qty) : 1;

    let pixCode = '';
    let pixQrCodeBase64 = '';
    let transactionId = '';

    // Integração com gateways específicos
    if (gateway === 'SigmaPay' || gateway === 'Adqui') {
      // ===== Integração SigmaPay =====
      const sigmapayPayload = {
        amount,
        offer_hash: productId,
        payment_method: "pix",
        customer: {
          name: customer.name,
          email: customer.email,
          phone_number: cleanPhone,
          document: cleanDoc,
          street_name: customer.street || "Não informado",
          number: customer.number || "S/N",
          complement: customer.complement || "",
          neighborhood: customer.neighborhood || "Não informado",
          city: customer.city || "Não informado",
          state: customer.state || "SP",
          zip_code: cleanCep,
        },
        cart: [
          {
            product_hash: productId,
            title: "Escada Telescópica Multifuncional Inox",
            cover: null,
            price: amount,
            quantity,
            operation_type: 1,
            tangible: true,
          },
        ],
        expire_in_days: 1,
        transaction_origin: "api",
      };

      console.log('Creating SigmaPay transaction...');
      const response = await fetch(`https://api.sigmapay.com.br/api/public/v1/transactions?api_token=${apiToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(sigmapayPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('SigmaPay error:', JSON.stringify(data));
        return new Response(JSON.stringify({ error: 'Erro ao gerar PIX', details: data }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('SigmaPay response:', JSON.stringify(data));

      // Extração de dados da resposta do SigmaPay
      const txn = data?.data || data;
      pixCode = txn?.pix_code || txn?.pix?.pix_qr_code || txn?.pix?.emv || '';
      pixQrCodeBase64 = txn?.qr_code || txn?.pix?.qr_code_base64 || '';
      transactionId = txn?.hash || txn?.id || '';

    } else if (gateway === 'PayEvo') {
      // ===== Integração PayEvo =====
      const PAYEVO_SECRET = apiToken || Deno.env.get('PAYEVO_SECRET_KEY');

      const transactionPayload = {
        paymentMethod: "PIX",
        amount,
        customer: {
          name: customer.name,
          email: customer.email,
          document: cleanDoc,
          phone: cleanPhone || undefined,
        },
        pix: { expiresInDays: 1 },
        items: [
          {
            title: "Escada Telescópica Multifuncional Inox",
            quantity,
            unitPrice: amount,
            tangible: true,
          },
        ],
        ip: "0.0.0.0",
      };

      const authHeader = 'Basic ' + base64Encode(PAYEVO_SECRET + ':');

      console.log('Creating PayEvo v2 transaction...');
      const response = await fetch('https://apiv2.payevo.com.br/functions/v1/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify(transactionPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('PayEvo v2 error:', JSON.stringify(data));
        return new Response(JSON.stringify({ error: 'Erro ao gerar PIX', details: data }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('PayEvo v2 response:', JSON.stringify(data));

      pixCode = data?.pix?.qrcode || data?.pix?.qrCode || data?.pix?.pix_qr_code || data?.pix?.emv || '';
      pixQrCodeBase64 = data?.pix?.qrcodeBase64 || data?.pix?.qrCodeBase64 || data?.pix?.qr_code_base64 || '';
      transactionId = data?.id || data?.transaction_id || '';

    } else if (gateway === 'SealPay') {
      // ===== Integração SealPay =====
      const sealPayload = {
        amount,
        description: "Pagamento Aprovado.",
        api_key: apiToken,
        customer: {
          name: customer.name,
          email: customer.email,
          cellphone: cleanPhone,
          taxId: cleanDoc,
        },
        tracking: {
          utm: { utm_source: "", utm_medium: "", utm_campaign: "", utm_term: "", utm_content: "" },
          src: "https://lojatopmercado.lovable.app/finalizar-compra",
        },
        fbp: "",
        fbc: "",
        user_agent: "Mozilla/5.0",
      };

      console.log('Creating SealPay transaction...');
      
      // SealPay pode apresentar erros intermitentes - tentando até 3 vezes
      let data: any = null;
      let lastError: any = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`SealPay attempt ${attempt}/3...`);
        const response = await fetch('https://abacate-5eo1.onrender.com/create-pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(sealPayload),
        });

        const responseText = await response.text();
        console.log('SealPay raw response:', responseText);

        try { data = JSON.parse(responseText); } catch {
          lastError = { error: 'Resposta inválida do SealPay', raw: responseText };
          if (attempt < 3) { await new Promise(r => setTimeout(r, 1000)); continue; }
          return new Response(JSON.stringify(lastError), {
            status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verifica se os dados do PIX estão presentes na resposta
        pixCode = data?.pix_code || '';
        const rawQr = data?.pix_qr_code || '';
        pixQrCodeBase64 = rawQr.startsWith('data:') ? rawQr.split(',')[1] || rawQr : rawQr;
        transactionId = data?.txid || '';

        if (pixCode) {
          if (!response.ok) console.warn('SealPay returned error status but PIX was generated successfully');
          break; // Sucesso ao obter dados do PIX
        }

        // Falha na tentativa - tenta novamente se possível
        console.error(`SealPay attempt ${attempt} failed:`, JSON.stringify(data));
        lastError = data;
        if (attempt < 3) { await new Promise(r => setTimeout(r, 1500)); continue; }
        
        return new Response(JSON.stringify({ error: 'Erro ao gerar PIX', details: data }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

    } else if (gateway === 'ZenixPay') {
      // ===== Integração ZenixPay (POST /api/v1/direct-payments com API Key) =====
      // URL real do produto enviada pelo front-end (evita o link de exemplo do gateway).
      // Fallback para a URL publicada caso o campo não venha na requisição.
      const productUrl = typeof body?.product_url === 'string' && body.product_url.startsWith('http')
        ? body.product_url
        : 'https://escadaa.lovable.app/produto';

      const zenixPayload = {
        amount,
        description: "Pagamento Aprovado.",
        paymentMethod: "pix",
        productLink: productUrl,
        customer: {
          name: customer.name,
          email: customer.email,
          document: cleanDoc,
          phone: cleanPhone ? `+55${cleanPhone}` : undefined,
          birthDate: undefined,
        },
      };

      console.log('Creating ZenixPay direct-payment...', JSON.stringify(zenixPayload));
      const response = await fetch('https://api.zenixpay.com.br/api/v1/direct-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-Key': apiToken.trim(),
          'Authorization': `Bearer ${apiToken.trim()}`,
        },
        body: JSON.stringify(zenixPayload),
      });

      const data = await response.json();
      console.log('ZenixPay response:', JSON.stringify(data));

      if (data?.hasError || !response.ok) {
        console.error('ZenixPay error:', JSON.stringify(data));
        return new Response(JSON.stringify({ error: 'Erro ao gerar PIX', details: data }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const txnData = data?.data;
      pixCode = txnData?.payment_data?.pix_key || '';
      pixQrCodeBase64 = '';
      transactionId = txnData?.transaction_id || '';
    } else {
      return new Response(JSON.stringify({ error: `Gateway "${gateway}" não suportado` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Salva o pedido no banco de dados para rastreamento
    try {
      await supabaseAdmin.from('orders').insert({
        customer_name: customer.name,
        customer_email: customer.email,
        customer_document: cleanDoc,
        customer_phone: cleanPhone || null,
        amount,
        quantity,
        status: 'pix_generated',
        pix_code: pixCode,
        pix_qr_code: pixQrCodeBase64,
        transaction_id: String(transactionId),
        customer_city: customer.city || null,
        customer_state: customer.state || null,
        customer_cep: cleanCep || null,
      });
    } catch (dbError) {
      console.error('Error saving order:', dbError);
    }

    // Retorna a resposta normalizada para o front-end
    return new Response(JSON.stringify({
      pix: {
        pix_qr_code: pixCode,
        qr_code_base64: pixQrCodeBase64,
      },
      id: transactionId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
