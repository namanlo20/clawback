// app/app/api/stripe/webhook/route.ts
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // Stripe needs Node runtime (not Edge)

// Stripe + Supabase server-side secrets
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const stripe = new Stripe(STRIPE_SECRET_KEY);

function getRawBody(req: Request): Promise<Buffer> {
  return req.arrayBuffer().then((ab) => Buffer.from(ab));
}

export async function POST(req: Request) {
  try {
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    const rawBody = await getRawBody(req);

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error("❌ Stripe signature verification failed:", err?.message || err);
      return new Response(`Webhook Error: ${err?.message || "Invalid signature"}`, {
        status: 400,
      });
    }

    // ✅ Only care about successful payment completion
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // We store Supabase user id in metadata during checkout creation
      const supabaseUserId =
        (session?.metadata?.supabase_user_id as string | undefined) ||
        (session?.metadata?.supabaseUserId as string | undefined);

      if (!supabaseUserId) {
        console.error("❌ checkout.session.completed but missing metadata.supabase_user_id");
        return new Response("Missing supabase_user_id in metadata", { status: 400 });
      }

      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const stripeCustomerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id || null;

      const checkoutSessionId = session.id;

      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          is_pro: true,
          pro_activated_at: new Date().toISOString(),
          stripe_customer_id: stripeCustomerId,
          stripe_checkout_session_id: checkoutSessionId,
        })
        .eq("id", supabaseUserId);

      if (error) {
        console.error("❌ Supabase update profiles failed:", error);
        return new Response("Supabase update failed", { status: 500 });
      }

      console.log("✅ Pro activated for user:", supabaseUserId);
    }

    return new Response("ok", { status: 200 });
  } catch (err: any) {
    console.error("❌ Webhook handler failed:", err?.message || err);
    return new Response("Webhook handler failed", { status: 500 });
  }
}

// GET is optional but useful for quick route-exists testing in browser
export async function GET() {
  return new Response("Stripe webhook endpoint is live. Use POST from Stripe.", { status: 200 });
}
