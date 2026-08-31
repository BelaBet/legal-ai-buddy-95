import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function response(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[CREATE-CHECKOUT] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return response({ error: "Método não permitido" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return response({ error: "Autenticação obrigatória" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!supabaseUrl || !supabaseAnonKey) return response({ error: "Configuração do Supabase ausente" }, 500);
    if (!stripeKey) return response({ error: "STRIPE_SECRET_KEY não configurada" }, 503);

    let payload: { priceId?: unknown };
    try {
      payload = await req.json();
    } catch {
      return response({ error: "Corpo da requisição inválido" }, 400);
    }

    const priceId = typeof payload.priceId === "string" ? payload.priceId.trim() : "";
    if (!priceId) return response({ error: "Price ID é obrigatório" }, 400);

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
    const token = authHeader.slice("Bearer ".length);
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !data.user?.email) return response({ error: "Sessão inválida ou expirada" }, 401);

    const user = data.user;
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const price = await stripe.prices.retrieve(priceId);
    if (!price.active || price.type !== "recurring") return response({ error: "Plano de assinatura inválido ou inativo" }, 400);

    const targetCurrency = price.currency;
    const customers = await stripe.customers.list({ email: user.email, limit: 10 });
    const customer = customers.data.find((candidate) => candidate.metadata?.supabase_user_id === user.id)
      ?? customers.data[0];
    let customerId = customer?.id;

    if (customerId) {
      const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 10 });
      const existingSub = subscriptions.data[0];
      if (existingSub) {
        const existingCurrency = existingSub.currency;
        if (existingCurrency !== targetCurrency) {
          return response({
            error: "currency_mismatch",
            message: `Você já possui uma assinatura ativa em ${existingCurrency.toUpperCase()}. Cancele ou gerencie a assinatura atual antes de trocar de moeda.`,
            hasActiveSubscription: true,
            existingCurrency,
            targetCurrency,
          }, 400);
        }
        return response({
          error: "already_subscribed",
          message: "Você já possui uma assinatura ativa. Use o portal do cliente para gerenciar seu plano.",
          hasActiveSubscription: true,
        }, 400);
      }
    }

    if (!customerId) {
      const createdCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = createdCustomer.id;
    }

    const origin = req.headers.get("origin");
    if (!origin) return response({ error: "Origem da aplicação não informada" }, 400);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/pricing?success=true`,
      cancel_url: `${origin}/pricing?canceled=true`,
    });

    logStep("Checkout session created", { userId: user.id, sessionId: session.id });
    return response({ url: session.url }, 200);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[CREATE-CHECKOUT] ERROR", errorMessage);
    return response({ error: "Não foi possível criar o checkout." }, 502);
  }
});