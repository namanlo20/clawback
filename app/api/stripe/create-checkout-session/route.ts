import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * ENV VARS (server-only unless prefixed NEXT_PUBLIC)
 * - STRIPE_SECRET_KEY: lets your server talk to Stripe securely
 * - STRIPE_PRICE_ID: which Stripe Price to charge for Pro
 * - APP_URL: used to build success/cancel redirect URLs
 * - NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY: used to validate the user token
 */
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID!;
const APP_URL = process.env.APP_URL!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Stripe SDK client (server-side)
 * This is what actually creates the Checkout Session.
 */
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

/**
 * Pull the Supabase access token from:
 * Authorization: Bearer <token>
 * The client will send this so we can verify who is logged in.
 */
function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer (.+)$/i);
  return m?.[1] || null;
}

export async function POST(req: Request) {
  try {
    // 1) Require a logged-in user (token must be present)
    const accessToken = getBearerToken(req);
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Missing Authorization Bearer token" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    // 2) Validate token with Supabase to get the real user
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser(accessToken);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const user = userData.user;

    // 3) Create Stripe Checkout Session tied to THIS user via metadata
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],

      // After payment, Stripe redirects here.
      success_url: `${APP_URL}/app?upgrade=success`,
      cancel_url: `${APP_URL}/app?upgrade=cancel`,

      // CRITICAL: this is how webhook knows who to upgrade in Supabase
      metadata: {
        supabase_user_id: user.id,
      },

      // Optional: helps you see the buyer email in Stripe
      customer_email: user.email ?? undefined,
      allow_promotion_codes: true,
    });

    // 4) Return Stripe URL so client can redirect
    if (!session.url) {
      return new Response(JSON.stringify({ error: "No session.url returned by Stripe" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
