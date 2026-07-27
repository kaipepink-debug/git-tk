/**
 * @file supabase/functions/seed-admin/index.ts
 * @description Função para inicializar ou atualizar um usuário administrador no sistema.
 * 
 * Fluxo:
 * 1. Recebe e-mail e senha.
 * 2. Verifica se o usuário já existe no Supabase Auth.
 * 3. Se não existir, cria o usuário e confirma o e-mail automaticamente.
 * 4. Atribui a role 'admin' ao usuário na tabela 'user_roles' usando um upsert.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Cabeçalhos CORS.
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Servidor HTTP para criação de administradores.
 * 
 * @param {Request} req - Requisição com email e password no corpo JSON.
 * @returns {Promise<Response>} Sucesso ou erro da operação.
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

    const { email, password } = await req.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verifica se o usuário já existe na lista de usuários do Auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(u => u.email === email);
    
    let userId: string;
    
    if (existing) {
      userId = existing.id;
    } else {
      // Cria o novo usuário como administrador
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createError) throw createError;
      userId = newUser.user.id;
    }

    // Atribui a role de administrador na tabela user_roles
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });
    
    if (roleError) throw roleError;

    return new Response(JSON.stringify({ success: true, userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
