import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// lets you verify in browser (GET)
export async function GET() {
  return new Response("Stripe webhook endpoint is live. Use POST from Stripe.", { status: 200 });
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing stripe-signature", { status: 400 });

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return new Response(`Signature verification failed: ${err?.message ?? "Unknown error"}`, {
      status: 400,
    });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const supabaseUserId = session.metadata?.supabase_user_id;

    if (!supabaseUserId) return new Response("Missing metadata.supabase_user_id", { status: 400 });

    const stripeCustomerId =
      typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        is_pro: true,
        pro_activated_at: new Date().toISOString(),
        stripe_customer_id: stripeCustomerId,
        stripe_checkout_session_id: session.id,
      })
      .eq("user_id", supabaseUserId);

    if (error) return new Response(`Supabase update failed: ${error.message}`, { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
