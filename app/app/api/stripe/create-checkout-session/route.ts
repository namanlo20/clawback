import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * What this endpoint does:
 * - Confirms the user is logged in (via Supabase access token)
 * - Creates a Stripe Checkout Session for STRIPE_PRICE_ID
 * - Saves metadata: { supabase_user_id: <uuid> }  <-- CRITICAL
 * - Returns { url } so the browser can redirect to Stripe checkout
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID!;
const APP_URL = process.env.APP_URL!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer (.+)$/i);
  return m?.[1] || null;
}

export async function POST(req: Request) {
  try {
    // 1) Require auth token
    const accessToken = getBearerToken(req);
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Missing Authorization Bearer token" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    // 2) Validate token and get logged-in user
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

    // 3) Create Stripe Checkout Session tied to THIS Supabase user
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${APP_URL}/app?upgrade=success`,
      cancel_url: `${APP_URL}/app?upgrade=cancel`,
      metadata: {
        supabase_user_id: user.id, // <- Stripe webhook reads this later
      },
      customer_email: user.email ?? undefined,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return new Response(JSON.stringify({ error: "No session.url returned by Stripe" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    // 4) Send checkout url back to client
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
