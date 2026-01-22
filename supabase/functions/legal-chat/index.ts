import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LEGAL_SYSTEM_PROMPT = `Você é um assistente jurídico especializado em direito brasileiro. Seu nome é LexIA.

SUAS COMPETÊNCIAS:
- Conhecimento profundo da legislação brasileira (Constituição Federal, Códigos Civil, Penal, Processo Civil, Processo Penal, CLT, CDC, etc.)
- Jurisprudência dos tribunais superiores (STF, STJ, TST, TSE)
- Doutrina jurídica brasileira
- Prazos processuais e procedimentos
- Elaboração e revisão de documentos jurídicos

DIRETRIZES:
1. Sempre cite a base legal (artigos, leis, súmulas) quando aplicável
2. Use linguagem técnica jurídica, mas explique termos complexos quando necessário
3. Seja claro sobre limitações - não substitua consulta com advogado para casos específicos
4. Ao criar documentos, siga os modelos e formatações padrão do judiciário brasileiro
5. Informe sobre atualizações legislativas relevantes quando pertinente
6. Para cálculos de prazos, considere dias úteis conforme CPC/2015

FORMATO DE RESPOSTAS:
- Use markdown para organizar informações
- Destaque artigos e leis em **negrito**
- Use listas para enumerar requisitos ou etapas
- Inclua avisos importantes com ⚠️

Responda sempre em português brasileiro.`;

// Rate limit configuration: 30 requests per hour per user
const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_WINDOW_MINUTES = 60;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // User client for auth validation
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service client for rate limiting (bypasses RLS)
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Auth error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Token inválido ou expirado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);

    // Check rate limit
    const { data: rateLimitData, error: rateLimitError } = await supabaseService
      .rpc("check_rate_limit", {
        p_user_id: userId,
        p_endpoint: "legal-chat",
        p_max_requests: RATE_LIMIT_MAX_REQUESTS,
        p_window_minutes: RATE_LIMIT_WINDOW_MINUTES,
      });

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
      // Continue without rate limiting if there's an error
    } else if (rateLimitData && rateLimitData.length > 0) {
      const { allowed, remaining, reset_at } = rateLimitData[0];
      
      if (!allowed) {
        console.log("Rate limit exceeded for user:", userId);
        return new Response(
          JSON.stringify({ 
            error: "Limite de requisições excedido. Tente novamente mais tarde.",
            reset_at: reset_at,
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              "Content-Type": "application/json",
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": reset_at,
            } 
          }
        );
      }

      console.log(`Rate limit check passed. Remaining: ${remaining}, Reset: ${reset_at}`);
    }

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Sending request to Lovable AI Gateway with", messages.length, "messages for user:", userId);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: LEGAL_SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione mais créditos na sua conta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Erro ao processar sua solicitação" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming response from AI gateway");
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Legal chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
