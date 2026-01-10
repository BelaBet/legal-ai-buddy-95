import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Sending request to Lovable AI Gateway with", messages.length, "messages");

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
