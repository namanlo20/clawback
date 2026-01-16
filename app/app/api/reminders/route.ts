// app/app/api/reminders/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// ----------
// Types
// ----------
type DbProfile = {
  id: string; // user_id
  full_name: string | null;
  phone_e164: string | null;
  notif_email_enabled: boolean;
  notif_sms_enabled: boolean;
  sms_consent: boolean;
  default_offsets_days: number[]; // e.g. [7,1]
};

type DbUserCard = {
  user_id: string;
  card_key: string;
  card_start_date: string | null; // yyyy-mm-dd
};

type DbCreditState = {
  user_id: string;
  state_key: string; // `${cardKey}:${creditId}`
  used: boolean;
  dont_care: boolean;
  remind: boolean;
};

type ToSend = {
  user_id: string;
  channel: "email" | "sms";
  state_key: string;
  due_date: string; // yyyy-mm-dd
  offset_days: number;
  message: string;
};

// ----------
// Helpers
// ----------
function clampDayToEndOfMonth(year: number, monthIndex0: number, day: number) {
  const lastDay = new Date(year, monthIndex0 + 1, 0).getDate();
  return Math.min(day, lastDay);
}

function makeDate(y: number, m0: number, d: number): Date {
  const dd = clampDayToEndOfMonth(y, m0, d);
  return new Date(y, m0, dd, 0, 0, 0, 0);
}

function fmtISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function daysBetween(a: Date, b: Date): number {
  // b - a in days (floor), in local time
  const A = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const B = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((B - A) / (1000 * 60 * 60 * 24));
}

// We reuse YOUR app's credit frequency strings.
// We don't import cards.ts here because this API route should stay lightweight and decoupled.
// If you want, we can import CARDS later — but for dry-run testing, we only need dates + state keys.
type CreditFrequency =
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "annual"
  | "every4years"
  | "every5years"
  | "onetime";

// Minimal credit record for date math
type CreditLike = {
  id: string;
  title: string;
  frequency: CreditFrequency;
};

// Minimal card record
type CardLike = {
  key: string;
  credits: CreditLike[];
};

// IMPORTANT:
// Keep this list in sync with data/cards.ts keys + credit ids.
// For now we only need credit ids + frequency + title to produce a dryRun list.
// You can later replace this with an import from "../../data/cards".
const CARDS_MIN: CardLike[] = [
  {
    key: "amex-platinum",
    credits: [
      { id: "plat-airline-incidental", title: "Airline Incidental Fees", frequency: "annual" },
      { id: "plat-clear", title: "Clear Plus", frequency: "annual" },
      { id: "plat-digital-entertainment", title: "Digital Entertainment", frequency: "monthly" },
      { id: "plat-fhr-hotel-collection", title: "Fine Hotels + Resorts / Hotel Collection", frequency: "semiannual" },
      { id: "plat-lululemon", title: "Lululemon", frequency: "quarterly" },
      { id: "plat-oura", title: "Oura Ring", frequency: "annual" },
      { id: "plat-resy", title: "Resy Restaurants", frequency: "quarterly" },
      { id: "plat-saks", title: "Saks", frequency: "semiannual" },
      { id: "plat-uber-one", title: "Uber One Subscription", frequency: "annual" },
      { id: "plat-uber-cash-jan-nov", title: "Uber Cash (Jan–Nov)", frequency: "monthly" },
      { id: "plat-uber-cash-dec", title: "Uber Cash (Dec)", frequency: "monthly" },
      { id: "plat-equinox", title: "Equinox", frequency: "annual" },
      { id: "plat-walmartplus", title: "Walmart+ Subscription", frequency: "monthly" },
    ],
  },
  {
    key: "chase-sapphire-reserve",
    credits: [
      { id: "csr-apple-tv", title: "Apple TV+", frequency: "annual" },
      { id: "csr-dining-credit", title: "Dining Credit", frequency: "semiannual" },
      { id: "csr-doordash-dashpass", title: "DoorDash DashPass", frequency: "annual" },
      { id: "csr-doordash-restaurants", title: "DoorDash Restaurant", frequency: "monthly" },
      { id: "csr-doordash-retail-10a", title: "DoorDash Retail", frequency: "monthly" },
      { id: "csr-doordash-retail-10b", title: "DoorDash Retail (second line)", frequency: "monthly" },
      { id: "csr-hotel-the-edit", title: "Hotel (The Edit)", frequency: "semiannual" },
      { id: "csr-lyft", title: "Lyft", frequency: "monthly" },
      { id: "csr-stubhub", title: "StubHub", frequency: "semiannual" },
      { id: "csr-travel", title: "Travel", frequency: "annual" },
      { id: "csr-peloton", title: "Peloton", frequency: "monthly" },
      { id: "csr-global-entry", title: "Global Entry / TSA PreCheck / NEXUS fee", frequency: "every4years" },
      { id: "csr-priority-pass", title: "Priority Pass", frequency: "annual" },
    ],
  },
  {
    key: "capitalone-venture-x",
    credits: [
      { id: "vx-travel", title: "Travel", frequency: "annual" },
      { id: "vx-global-entry", title: "Global Entry / TSA PreCheck / NEXUS fee", frequency: "every4years" },
      { id: "vx-anniversary-bonus", title: "Anniversary Bonus Miles", frequency: "annual" },
    ],
  },
  {
    key: "chase-sapphire-preferred",
    credits: [
      { id: "csp-dashpass", title: "DoorDash DashPass", frequency: "annual" },
      { id: "csp-hotel-credit", title: "Hotels booked via Chase Travel portal", frequency: "annual" },
    ],
  },
  {
    key: "amex-green",
    credits: [{ id: "green-clear", title: "Clear Plus", frequency: "annual" }],
  },
  {
    key: "hilton-surpass",
    credits: [{ id: "surpass-hilton-credit", title: "Hilton credit", frequency: "quarterly" }],
  },
  {
    key: "amex-gold",
    credits: [
      { id: "gold-uber-cash", title: "Uber Cash", frequency: "monthly" },
      { id: "gold-dunkin", title: "Dunkin", frequency: "monthly" },
      { id: "gold-resy", title: "Resy Restaurants", frequency: "semiannual" },
      { id: "gold-dining", title: "Dining", frequency: "monthly" },
    ],
  },
  {
    key: "hilton-honors-aspire",
    credits: [
      { id: "aspire-flights", title: "Flights", frequency: "quarterly" },
      { id: "aspire-clear", title: "Clear Plus", frequency: "annual" },
      { id: "aspire-conrad-waldorf-2night", title: "Conrad/Waldorf Astoria (2 Night)", frequency: "annual" },
      { id: "aspire-hilton-resort", title: "Hilton Resort", frequency: "semiannual" },
    ],
  },
  {
    key: "delta-reserve",
    credits: [
      { id: "delta-resy", title: "Resy Restaurants", frequency: "monthly" },
      { id: "delta-rideshare", title: "Rideshare", frequency: "monthly" },
      { id: "delta-delta-stays", title: "Delta Stays", frequency: "annual" },
    ],
  },
  {
    key: "marriott-brilliant",
    credits: [
      { id: "brilliant-dining", title: "Dining", frequency: "monthly" },
      { id: "brilliant-ritz-stregis", title: "Ritz-Carlton / St. Regis", frequency: "annual" },
      { id: "brilliant-global-entry", title: "Global Entry", frequency: "every4years" },
      { id: "brilliant-tsa-precheck", title: "TSA PreCheck / NEXUS fee", frequency: "every5years" },
    ],
  },
  {
    key: "citi-strata-elite",
    credits: [
      { id: "strata-hotel", title: "Hotel", frequency: "annual" },
      { id: "strata-splurge", title: "Splurge", frequency: "annual" },
      { id: "strata-blacklane", title: "Annual Blacklane", frequency: "annual" },
      { id: "strata-priority-pass", title: "Priority Pass", frequency: "annual" },
    ],
  },
  {
    key: "citi-aa-executive",
    credits: [
      { id: "aaexec-lyft", title: "Lyft", frequency: "monthly" },
      { id: "aaexec-grubhub", title: "Grubhub", frequency: "monthly" },
      { id: "aaexec-car-rentals", title: "Car rentals", frequency: "annual" },
    ],
  },
];

function nextResetDateForCredit(params: {
  frequency: CreditFrequency;
  cardStartDate: Date;
  now: Date;
}): Date | null {
  const { frequency, cardStartDate, now } = params;

  if (frequency === "onetime") return null;

  const startMonth = cardStartDate.getMonth();
  const startDay = cardStartDate.getDate();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // monthly → next month same day (clamp)
  if (frequency === "monthly") {
    const y = now.getFullYear();
    const m0 = now.getMonth();
    const nextM0 = m0 + 1;
    const nextY = y + Math.floor(nextM0 / 12);
    const normalizedM0 = ((nextM0 % 12) + 12) % 12;
    return makeDate(nextY, normalizedM0, startDay);
  }

  // every4years / every5years
  if (frequency === "every4years" || frequency === "every5years") {
    const years = frequency === "every4years" ? 4 : 5;
    const startY = cardStartDate.getFullYear();
    const nowY = now.getFullYear();
    let k = Math.floor((nowY - startY) / years);
    if (k < 0) k = 0;

    let candY = startY + k * years;
    let cand = makeDate(candY, startMonth, startDay);
    if (cand <= today) {
      candY += years;
      cand = makeDate(candY, startMonth, startDay);
    }
    return cand;
  }

  // quarterly / semiannual / annual
  const monthsStep = frequency === "quarterly" ? 3 : frequency === "semiannual" ? 6 : 12;

  let candidate = makeDate(now.getFullYear(), startMonth, startDay);
  if (candidate > today) candidate = makeDate(now.getFullYear() - 1, startMonth, startDay);

  while (candidate <= today) {
    const next = new Date(candidate);
    next.setMonth(next.getMonth() + monthsStep);
    candidate = makeDate(next.getFullYear(), next.getMonth(), startDay);
  }

  return candidate;
}

// ----------
// GET handler
// ----------
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const secret = url.searchParams.get("secret") ?? "";
    const dryRun = (url.searchParams.get("dryRun") ?? "1") === "1";

    const CRON_SECRET = process.env.CRON_SECRET ?? "";
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

    if (!CRON_SECRET || !SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json(
        { ok: false, error: "Missing env vars: CRON_SECRET / NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    // Load data
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone_e164, notif_email_enabled, notif_sms_enabled, sms_consent, default_offsets_days");

    if (profErr) throw profErr;

    const { data: userCards, error: cardsErr } = await supabaseAdmin
      .from("user_cards")
      .select("user_id, card_key, card_start_date");

    if (cardsErr) throw cardsErr;

    const { data: creditStates, error: statesErr } = await supabaseAdmin
      .from("credit_states")
      .select("user_id, state_key, used, dont_care, remind");

    if (statesErr) throw statesErr;

    const profs = (profiles ?? []) as DbProfile[];
    const cards = (userCards ?? []) as DbUserCard[];
    const states = (creditStates ?? []) as DbCreditState[];

    // Pre-index states by (user_id + state_key)
    const stateMap = new Map<string, DbCreditState>();
    for (const s of states) {
      stateMap.set(`${s.user_id}::${s.state_key}`, s);
    }

    const now = new Date();

    const toSend: ToSend[] = [];

    // For each user profile:
    for (const p of profs) {
      const offsets = Array.isArray(p.default_offsets_days) && p.default_offsets_days.length > 0 ? p.default_offsets_days : [7, 1];

      const userCardsForUser = cards.filter((c) => c.user_id === p.id);

      for (const uc of userCardsForUser) {
        if (!uc.card_start_date) continue; // needs start date for date math

        const card = CARDS_MIN.find((x) => x.key === uc.card_key);
        if (!card) continue;

        const start = new Date(uc.card_start_date + "T00:00:00");

        for (const cr of card.credits) {
          const state_key = `${uc.card_key}:${cr.id}`;
          const state = stateMap.get(`${p.id}::${state_key}`);

          // Only remind=true, used=false, dont_care=false
          if (!state?.remind) continue;
          if (state.used) continue;
          if (state.dont_care) continue;

          const due = nextResetDateForCredit({ frequency: cr.frequency, cardStartDate: start, now });
          if (!due) continue;

          // For each offset
          for (const offset of offsets) {
            const target = addDays(due, -offset);
            const diffDays = daysBetween(now, target);

            // send only when "today == target day"
            if (diffDays !== 0) continue;

            const dueISO = fmtISODate(due);

            // Determine channels
            const channels: Array<"email" | "sms"> = [];
            if (p.notif_email_enabled) channels.push("email");
            if (p.notif_sms_enabled && p.sms_consent && p.phone_e164) channels.push("sms");

            for (const ch of channels) {
              toSend.push({
                user_id: p.id,
                channel: ch,
                state_key,
                due_date: dueISO,
                offset_days: offset,
                message: `Reminder: ${cr.title} resets on ${dueISO} (${offset} day(s) before)`,
              });
            }
          }
        }
      }
    }

    // dryRun -> return list only
    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        count: toSend.length,
        toSend,
      });
    }

    // Non-dryRun: log idempotently to notification_log
    // We only "log" here. Later you'll wire Resend/Twilio.
    for (const item of toSend) {
      await supabaseAdmin.from("notification_log").insert({
        user_id: item.user_id,
        state_key: item.state_key,
        due_date: item.due_date,
        offset_days: item.offset_days,
        channel: item.channel,
      });
    }

    return NextResponse.json({
      ok: true,
      dryRun: false,
      logged: toSend.length,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
