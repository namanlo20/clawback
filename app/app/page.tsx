// app/app/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  CARDS,
  type Card,
  type Credit,
  type CreditFrequency,
} from "../../data/cards";

// -----------------------------
// Supabase
// -----------------------------
function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // IMPORTANT: must be NEXT_PUBLIC_* for browser
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    // fallback (optional) in case you keep the old name too
    (process.env as any).SUPABASE_ANON_KEY;

  if (!url || !anon) return null;
  return createClient(url, anon);
}

// -----------------------------
// Local types
// -----------------------------
type CreditToggleState = { used: boolean; dontCare: boolean; remind: boolean };
type ToggleMap = Record<string, CreditToggleState>; // key = `${cardKey}:${creditId}`
type CardStartDateMap = Record<string, string>; // cardKey -> YYYY-MM-DD

// -----------------------------
// Formatting + rules
// -----------------------------
function formatMoney(n: number): string {
  const hasCents = Math.abs(n % 1) > 0.0001;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(n);
}

function annualize(amount: number, freq: CreditFrequency): number {
  if (freq === "monthly") return amount * 12;
  if (freq === "quarterly") return amount * 4;
  if (freq === "semiannual") return amount * 2;
  if (freq === "annual") return amount;
  if (freq === "every4years") return amount / 4;
  if (freq === "every5years") return amount / 5;
  return amount; // onetime
}

function freqLabel(freq: CreditFrequency): string {
  if (freq === "monthly") return "Monthly";
  if (freq === "quarterly") return "Quarterly";
  if (freq === "semiannual") return "Semiannual";
  if (freq === "annual") return "Annual";
  if (freq === "every4years") return "Every 4 Years";
  if (freq === "every5years") return "Every 5 Years";
  return "One-time";
}

function freqSort(freq: CreditFrequency): number {
  const order: CreditFrequency[] = [
    "monthly",
    "quarterly",
    "semiannual",
    "annual",
    "onetime",
    "every4years",
    "every5years",
  ];
  return order.indexOf(freq);
}

// Quarterly display rule
function creditSubtitle(c: Credit): string {
  const ann = annualize(c.amount, c.frequency);
  const base =
    c.frequency === "quarterly"
      ? `${formatMoney(c.amount)} Quarterly`
      : formatMoney(c.amount);

  return `${freqLabel(c.frequency)} • ${base} • Annualized: ${formatMoney(ann)}`;
}

// -----------------------------
// Expiring Soon v2 date math
// -----------------------------
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function clampDayToMonth(year: number, monthIndex0: number, day: number): number {
  const lastDay = new Date(year, monthIndex0 + 1, 0).getDate();
  return Math.min(day, lastDay);
}
function addMonthsClamped(date: Date, months: number): Date {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const targetMonth = m + months;
  const ty = y + Math.floor(targetMonth / 12);
  const tm = ((targetMonth % 12) + 12) % 12;
  const cd = clampDayToMonth(ty, tm, d);
  return new Date(ty, tm, cd);
}
function addYearsClamped(date: Date, years: number): Date {
  const y = date.getFullYear() + years;
  const m = date.getMonth();
  const d = date.getDate();
  const cd = clampDayToMonth(y, m, d);
  return new Date(y, m, cd);
}
function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
function formatDateShort(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Anchor schedule at cardStartDate; roll forward to next >= today
function nextResetDateForFrequency(
  cardStartDate: Date,
  freq: CreditFrequency,
  today: Date
): Date | null {
  if (freq === "onetime") return null;

  const t = startOfDay(today);
  let cursor = startOfDay(cardStartDate);

  if (cursor.getTime() >= t.getTime()) return cursor;

  const safety = 500;
  let i = 0;

  const step = (): Date => {
    switch (freq) {
      case "monthly":
        return addMonthsClamped(cursor, 1);
      case "quarterly":
        return addMonthsClamped(cursor, 3);
      case "semiannual":
        return addMonthsClamped(cursor, 6);
      case "annual":
        return addMonthsClamped(cursor, 12);
      case "every4years":
        return addYearsClamped(cursor, 4);
      case "every5years":
        return addYearsClamped(cursor, 5);
      default:
        return addMonthsClamped(cursor, 12);
    }
  };

  while (i < safety) {
    cursor = step();
    if (cursor.getTime() >= t.getTime()) return cursor;
    i += 1;
  }
  return null;
}

// -----------------------------
// UI helpers
// -----------------------------
function pillClass(kind: "off" | "on" | "warn" | "good"): string {
  const base =
    "rounded-full border px-3 py-1 text-xs font-medium transition whitespace-nowrap";
  if (kind === "on")
    return `${base} border-emerald-400/30 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/15`;
  if (kind === "warn")
    return `${base} border-amber-300/30 bg-amber-300/10 text-amber-100 hover:bg-amber-300/15`;
  if (kind === "good")
    return `${base} border-sky-400/30 bg-sky-400/10 text-sky-100 hover:bg-sky-400/15`;
  return `${base} border-white/10 bg-white/5 text-white/75 hover:bg-white/10`;
}

function surfaceCardClass(extra?: string): string {
  return [
    "rounded-2xl border border-white/10 bg-[#11141B] shadow-[0_0_70px_rgba(0,0,0,0.55)]",
    extra ?? "",
  ].join(" ");
}

function inTier(card: Card, min: number, max: number): boolean {
  return card.annualFee >= min && card.annualFee <= max;
}

// -----------------------------
// Page
// -----------------------------
export default function AppDashboardPage() {
  const supabase = useMemo(() => getSupabase(), []);

  // auth
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  // core state
  const [mobileView, setMobileView] = useState<"cards" | "credits" | "insights">("credits");

  const pinnedOrder: Card["key"][] = [
    "amex-platinum",
    "chase-sapphire-reserve",
    "capitalone-venture-x",
  ];

  const [search, setSearch] = useState("");
  const [activeCardKey, setActiveCardKey] = useState<Card["key"]>("chase-sapphire-reserve");

  const [savedCards, setSavedCards] = useState<string[]>([]);
  const [toggleMap, setToggleMap] = useState<ToggleMap>({});
  const [cardStartDates, setCardStartDates] = useState<CardStartDateMap>({});
  const [expiringWindowDays, setExpiringWindowDays] = useState<number>(14);

  // localStorage fallback for pre-login use
  useEffect(() => {
    try {
      const sc = localStorage.getItem("clawback_saved_cards_v2");
      if (sc) setSavedCards(JSON.parse(sc));
    } catch {}
    try {
      const tm = localStorage.getItem("clawback_toggle_map_v2");
      if (tm) setToggleMap(JSON.parse(tm));
    } catch {}
    try {
      const sd = localStorage.getItem("clawback_card_start_dates_v2");
      if (sd) setCardStartDates(JSON.parse(sd));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("clawback_saved_cards_v2", JSON.stringify(savedCards)); } catch {}
  }, [savedCards]);
  useEffect(() => {
    try { localStorage.setItem("clawback_toggle_map_v2", JSON.stringify(toggleMap)); } catch {}
  }, [toggleMap]);
  useEffect(() => {
    try { localStorage.setItem("clawback_card_start_dates_v2", JSON.stringify(cardStartDates)); } catch {}
  }, [cardStartDates]);

  // bootstrap auth
  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!supabase) {
        if (mounted) {
          setAuthReady(true);
          setUserId(null);
        }
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUserId(data.session?.user?.id ?? null);
      setAuthReady(true);

      const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
        setUserId(sess?.user?.id ?? null);
      });

      return () => sub.subscription.unsubscribe();
    }

    init();
    return () => { mounted = false; };
  }, [supabase]);

  // load from DB when logged in
  useEffect(() => {
    if (!supabase || !userId) return;

    let cancelled = false;

    async function load() {
      // saved cards + start dates
      const { data: userCards } = await supabase
        .from("user_cards")
        .select("card_key, card_start_date")
        .order("created_at", { ascending: true });

      if (!cancelled && userCards) {
        const keys = userCards.map((r: any) => r.card_key as string);
        setSavedCards(keys);

        const map: CardStartDateMap = {};
        for (const r of userCards as any[]) {
          if (r.card_start_date) map[r.card_key] = r.card_start_date;
        }
        setCardStartDates((prev) => ({ ...prev, ...map }));
      }

      // toggle states
      const { data: states } = await supabase
        .from("credit_states")
        .select("card_key, credit_id, used, dont_care, remind");

      if (!cancelled && states) {
        const map: ToggleMap = {};
        for (const r of states as any[]) {
          const k = `${r.card_key}:${r.credit_id}`;
          map[k] = { used: !!r.used, dontCare: !!r.dont_care, remind: !!r.remind };
        }
        setToggleMap((prev) => ({ ...prev, ...map }));
      }
    }

    load();
    return () => { cancelled = true; };
  }, [supabase, userId]);

  // DB writers (fail-soft)
  async function dbUpsertSavedCard(cardKey: string) {
    if (!supabase || !userId) return;
    await supabase.from("user_cards").upsert(
      {
        card_key: cardKey,
        card_start_date: cardStartDates[cardKey] ?? null,
      },
      { onConflict: "user_id,card_key" }
    );
  }

  async function dbDeleteSavedCard(cardKey: string) {
    if (!supabase || !userId) return;
    await supabase.from("user_cards").delete().eq("card_key", cardKey);
    await supabase.from("credit_states").delete().eq("card_key", cardKey);
  }

  async function dbUpsertCreditState(cardKey: string, creditId: string, state: CreditToggleState) {
    if (!supabase || !userId) return;
    await supabase.from("credit_states").upsert(
      {
        card_key: cardKey,
        credit_id: creditId,
        used: state.used,
        dont_care: state.dontCare,
        remind: state.remind,
      },
      { onConflict: "user_id,card_key,credit_id" }
    );
  }

  async function dbUpsertCardStartDate(cardKey: string, dateStr: string) {
    if (!supabase || !userId) return;
    await supabase.from("user_cards").upsert(
      { card_key: cardKey, card_start_date: dateStr || null },
      { onConflict: "user_id,card_key" }
    );
  }

  // derived
  const activeCard = useMemo(
    () => CARDS.find((c) => c.key === activeCardKey) ?? CARDS[0],
    [activeCardKey]
  );

  const creditsSorted = useMemo(() => {
    return activeCard.credits
      .slice()
      .sort((a, b) => {
        const fa = freqSort(a.frequency);
        const fb = freqSort(b.frequency);
        if (fa !== fb) return fa - fb;
        return annualize(b.amount, b.frequency) - annualize(a.amount, a.frequency);
      });
  }, [activeCard]);

  const totals = useMemo(() => {
    let totalAvail = 0;
    let totalRedeemed = 0;

    for (const c of creditsSorted) {
      const k = `${activeCard.key}:${c.id}`;
      const st = toggleMap[k] ?? { used: false, dontCare: false, remind: false };
      const a = annualize(c.amount, c.frequency);

      if (!st.dontCare) totalAvail += a;
      if (!st.dontCare && st.used) totalRedeemed += a;
    }

    const pct =
      totalAvail <= 0 ? 0 : Math.min(100, Math.round((totalRedeemed / totalAvail) * 100));
    return { totalAvail, totalRedeemed, pct };
  }, [creditsSorted, activeCard.key, toggleMap]);

  // Expiring soon v2 (across SAVED cards, not just active)
  const expiringSoon = useMemo(() => {
    const today = new Date();
    const out: Array<{
      card: Card;
      credit: Credit;
      nextReset: Date;
      days: number;
    }> = [];

    for (const cardKey of savedCards) {
      const card = CARDS.find((c) => c.key === cardKey);
      if (!card) continue;

      const startStr = cardStartDates[cardKey];
      if (!startStr) continue; // no start date => can't compute next reset

      const start = new Date(`${startStr}T00:00:00`);
      for (const credit of card.credits) {
        const k = `${cardKey}:${credit.id}`;
        const st = toggleMap[k] ?? { used: false, dontCare: false, remind: false };

        if (!st.remind) continue;
        if (st.used) continue;
        if (st.dontCare) continue;

        const nxt = nextResetDateForFrequency(start, credit.frequency, today);
        if (!nxt) continue; // onetime or fail-soft

        const d = daysBetween(today, nxt);
        if (d < 0) continue;
        if (d <= expiringWindowDays) {
          out.push({ card, credit, nextReset: nxt, days: d });
        }
      }
    }

    out.sort((a, b) => a.days - b.days);
    return out.slice(0, 8);
  }, [savedCards, cardStartDates, toggleMap, expiringWindowDays]);

  // Tiered browsing requirement
  const feeBounds = useMemo(() => {
    const fees = CARDS.map((c) => c.annualFee);
    return { min: Math.min(...fees), max: Math.max(...fees) };
  }, []);

  const [feeMin, setFeeMin] = useState<number>(feeBounds.min);
  const [feeMax, setFeeMax] = useState<number>(feeBounds.max);

  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const inFeeRange = CARDS.filter((c) => c.annualFee >= feeMin && c.annualFee <= feeMax);
    const list = q
      ? inFeeRange.filter((c) => (c.name + " " + c.issuer).toLowerCase().includes(q))
      : inFeeRange.slice();
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [search, feeMin, feeMax]);

  const topPicksVisible = useMemo(() => {
    const q = search.trim();
    const isDefaultFeeRange = feeMin === feeBounds.min && feeMax === feeBounds.max;
    return q.length === 0 && isDefaultFeeRange;
  }, [search, feeMin, feeMax, feeBounds.min, feeBounds.max]);

  const topPicks = useMemo(() => {
    return pinnedOrder
      .map((k) => CARDS.find((c) => c.key === k))
      .filter(Boolean) as Card[];
  }, [pinnedOrder]);

  const tier3 = useMemo(() => baseFiltered.filter((c) => inTier(c, 500, 999999)), [baseFiltered]);
  const tier2 = useMemo(() => baseFiltered.filter((c) => inTier(c, 250, 499.99)), [baseFiltered]);
  const tier1 = useMemo(() => baseFiltered.filter((c) => inTier(c, 0, 249.99)), [baseFiltered]);

  // actions
  function setCreditState(cardKey: string, creditId: string, patch: Partial<CreditToggleState>) {
    const k = `${cardKey}:${creditId}`;
    const prev = toggleMap[k] ?? { used: false, dontCare: false, remind: false };
    const next = { ...prev, ...patch };
    setToggleMap((m) => ({ ...m, [k]: next }));
    void dbUpsertCreditState(cardKey, creditId, next);
  }

  function notifyMeForThisCard() {
    // Free tier rule: save 1 free; multi-card later paywall
    // For now we enforce UI-only: if not logged in, still allow locally;
    // if logged in and already has 1 saved, show message.
    if (userId && savedCards.length >= 1 && !savedCards.includes(activeCard.key)) {
      alert("Free tier saves 1 card. Multi-card will be $5 flat (Stripe later).");
      return;
    }
    setSavedCards((prev) => (prev.includes(activeCard.key) ? prev : [...prev, activeCard.key]));
    void dbUpsertSavedCard(activeCard.key);
  }

  function removeSaved(cardKey: string) {
    setSavedCards((prev) => prev.filter((k) => k !== cardKey));
    void dbDeleteSavedCard(cardKey);
  }

  async function handleAuth() {
    setAuthError(null);

    if (!supabase) {
      setAuthError("Supabase env vars missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    setAuthBusy(true);
    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Check your email to confirm signup, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      setAuthError(e?.message ?? "Auth failed.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  // -----------------------------
  // UI Components
  // -----------------------------
  function CardRow({ card, badgeText }: { card: Card; badgeText?: string }) {
    const active = card.key === activeCard.key;
    return (
      <button
        onClick={() => {
          setActiveCardKey(card.key);
          setMobileView("credits"); // mobile behavior requirement
        }}
        className={[
          "flex w-full items-start gap-3 px-3 py-3 text-left transition",
          active ? "bg-white/8" : "hover:bg-white/5",
        ].join(" ")}
        type="button"
      >
        <div className="relative mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30">
          <Image src={card.logo} alt={card.name} fill className="object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold leading-5 text-white/95">
              {card.name}
            </div>
            {badgeText ? (
              <span className="shrink-0 rounded-full border border-amber-400/35 bg-amber-400/12 px-2 py-0.5 text-[10px] text-amber-100">
                {badgeText}
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 text-xs text-white/55">
            Fee: {formatMoney(card.annualFee)} • Credits: {formatMoney(card.creditsTrackedAnnualized)}
          </div>
        </div>
      </button>
    );
  }

  function Section({ title, subtitle, cards }: { title: string; subtitle: string; cards: Card[] }) {
    if (cards.length === 0) return null;
    return (
      <div className="border-t border-white/10">
        <div className="px-3 py-2 border-b border-white/10 bg-white/5">
          <div className="text-base font-semibold text-white/90">{title}</div>
          <div className="text-xs text-white/50">{subtitle}</div>
        </div>
        {cards.map((c) => (
          <CardRow key={c.key} card={c} />
        ))}
      </div>
    );
  }

  // Panels
  const LeftPanel = (
    <aside className="lg:col-span-4">
      <div className={surfaceCardClass("p-4 lg:sticky lg:top-5")}>
        {/* Auth */}
        <div className="rounded-2xl border border-white/10 bg-[#0F1218] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-white/95">Account</div>
              <div className="mt-1 text-xs text-white/55">
                Login enables real persistence (Supabase).
              </div>
            </div>

            {userId ? (
              <button
                onClick={logout}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
                type="button"
              >
                Logout
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setAuthMode("signin")}
                  className={`rounded-full border px-3 py-2 text-xs ${
                    authMode === "signin"
                      ? "border-white/20 bg-white/10 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                  type="button"
                >
                  Sign in
                </button>
                <button
                  onClick={() => setAuthMode("signup")}
                  className={`rounded-full border px-3 py-2 text-xs ${
                    authMode === "signup"
                      ? "border-white/20 bg-white/10 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                  type="button"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>

          {!userId ? (
            <div className="mt-3 space-y-2">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm outline-none placeholder:text-white/30"
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                type="password"
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm outline-none placeholder:text-white/30"
              />
              {authError ? (
                <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-100">
                  {authError}
                </div>
              ) : null}
              <button
                onClick={handleAuth}
                disabled={authBusy}
                className="w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
                type="button"
              >
                {authBusy ? "Working..." : authMode === "signup" ? "Create account" : "Sign in"}
              </button>

              {!supabase ? (
                <div className="mt-2 text-xs text-white/50">
                  Missing env vars. Add <span className="text-white/80">NEXT_PUBLIC_SUPABASE_URL</span> and{" "}
                  <span className="text-white/80">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>.
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-3 text-xs text-emerald-100/80">
              Logged in ✅ Persistence enabled.
            </div>
          )}
        </div>

        {/* Your Cards */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-[#0F1218] p-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-white/95">Your Cards</div>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/70">
              {savedCards.length}
            </span>
          </div>
          <div className="mt-1 text-xs text-white/55">
            Expiring Soon needs your cardmember year start date.
          </div>

          <div className="mt-3 space-y-2">
            {savedCards.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/60">
                No saved cards yet. Choose a card and click “Notify me”.
              </div>
            ) : (
              savedCards.map((k) => {
                const card = CARDS.find((c) => c.key === k);
                if (!card) return null;
                return (
                  <div key={k} className="rounded-xl border border-white/10 bg-black/25 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="relative mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                          <Image src={card.logo} alt={card.name} fill className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold leading-5 text-white/95">
                            {card.name}
                          </div>
                          <div className="mt-0.5 text-xs text-white/55">
                            Fee: {formatMoney(card.annualFee)}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => removeSaved(k)}
                        className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
                        type="button"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-3">
                      <div className="text-[11px] text-white/50">Cardmember year start date</div>
                      <input
                        type="date"
                        value={cardStartDates[k] ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setCardStartDates((prev) => ({ ...prev, [k]: v }));
                          void dbUpsertCardStartDate(k, v);
                        }}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/25 px-2 py-2 text-xs outline-none"
                      />
                      <div className="mt-1 text-[11px] text-white/40">
                        Example: statement month/day that anchors resets.
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Picker */}
        <div className="mt-4">
          <div className="text-lg font-semibold text-white/95">Choose your card</div>

          <div className="mt-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cards..."
              className="w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none placeholder:text-white/30"
            />
          </div>

          <div className="mt-3 rounded-2xl border border-white/10 bg-[#0F1218] p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white/90">Annual fee filter</div>
              <button
                className="text-xs text-white/45 hover:text-white/70"
                onClick={() => {
                  setFeeMin(feeBounds.min);
                  setFeeMax(feeBounds.max);
                }}
                type="button"
              >
                Reset
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <div className="text-[11px] text-white/50">Min</div>
                <input
                  type="number"
                  value={feeMin}
                  min={feeBounds.min}
                  max={feeMax}
                  onChange={(e) => setFeeMin(Number(e.target.value || 0))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/25 px-2 py-2 text-xs outline-none"
                />
              </div>
              <div>
                <div className="text-[11px] text-white/50">Max</div>
                <input
                  type="number"
                  value={feeMax}
                  min={feeMin}
                  max={feeBounds.max}
                  onChange={(e) => setFeeMax(Number(e.target.value || 0))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/25 px-2 py-2 text-xs outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-3 overflow-auto rounded-2xl border border-white/10 bg-[#0F1218] lg:max-h-[46vh]">
            {topPicksVisible ? (
              <div className="border-b border-white/10">
                <div className="px-3 py-2 bg-amber-400/8">
                  <div className="text-base font-semibold text-amber-100">Top Picks</div>
                  <div className="text-xs text-white/50">Pinned</div>
                </div>
                {topPicks.map((c) => (
                  <CardRow key={c.key} card={c} badgeText="Top pick" />
                ))}
              </div>
            ) : null}

            <Section title="Tier 3" subtitle="$500+ annual fee" cards={tier3} />
            <Section title="Tier 2" subtitle="$250–$500 annual fee" cards={tier2} />
            <Section title="Tier 1" subtitle="$0–$250 annual fee" cards={tier1} />

            {baseFiltered.length === 0 ? (
              <div className="p-4 text-sm text-white/60">No cards match your search / fee filter.</div>
            ) : null}
          </div>

          <button
            onClick={notifyMeForThisCard}
            className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90"
            type="button"
          >
            Notify me for this card
          </button>

          <div className="mt-2 text-xs text-white/40">
            Free: save 1 card • Multi-card is $5 flat (Stripe later)
          </div>
        </div>
      </div>
    </aside>
  );

  const MiddlePanel = (
    <main className="lg:col-span-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className={surfaceCardClass("p-4")}>
          <div className="text-xs text-white/55">Credits Redeemed</div>
          <div className="mt-2 text-3xl font-semibold text-emerald-100">
            {formatMoney(totals.totalRedeemed)}
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-black/30">
            <div
              className="h-2 rounded-full bg-emerald-400/80"
              style={{ width: `${totals.pct}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-white/50">{totals.pct}% used</div>
        </div>

        <div className={surfaceCardClass("p-4")}>
          <div className="text-xs text-white/55">Total Credits Available</div>
          <div className="mt-2 text-3xl font-semibold text-white/95">
            {formatMoney(totals.totalAvail)}
          </div>
          <div className="mt-2 text-xs text-white/50">excludes “Don’t care”</div>
        </div>

        <div className={surfaceCardClass("p-4 border-red-400/15 bg-red-500/6")}>
          <div className="text-xs text-white/55">Annual Fee</div>
          <div className="mt-2 text-3xl font-semibold text-red-100">
            {formatMoney(activeCard.annualFee)}
          </div>
        </div>
      </div>

      <div className={surfaceCardClass("mt-6 p-5")}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-black/30">
              <Image src={activeCard.logo} alt={activeCard.name} fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-xl font-semibold text-white/95">
                {activeCard.name}
              </div>
              <div className="mt-0.5 truncate text-sm text-white/55">
                Annual fee: {formatMoney(activeCard.annualFee)} • Credits tracked:{" "}
                {formatMoney(activeCard.creditsTrackedAnnualized)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-base font-semibold text-white/90">Credits</div>

          <div className="mt-4 space-y-3">
            {creditsSorted.map((c) => {
              const key = `${activeCard.key}:${c.id}`;
              const st = toggleMap[key] ?? { used: false, dontCare: false, remind: false };

              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-white/10 bg-[#0F1218] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white/95">
                        {c.title}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-white/55">
                        {creditSubtitle(c)}
                        {c.notes ? ` • ${c.notes}` : ""}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end lg:flex-nowrap">
                      <button
                        className={pillClass(st.remind ? "on" : "off")}
                        onClick={() => setCreditState(activeCard.key, c.id, { remind: !st.remind })}
                        type="button"
                      >
                        Remind
                      </button>
                      <button
                        className={pillClass(st.dontCare ? "warn" : "off")}
                        onClick={() => setCreditState(activeCard.key, c.id, { dontCare: !st.dontCare })}
                        type="button"
                      >
                        Don&apos;t care
                      </button>
                      <button
                        className={pillClass(st.used ? "good" : "off")}
                        onClick={() => setCreditState(activeCard.key, c.id, { used: !st.used })}
                        type="button"
                      >
                        Mark used
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {creditsSorted.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#0F1218] p-4 text-sm text-white/60">
                No credits found for this card.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );

  const RightPanel = (
    <aside className="lg:col-span-3">
      <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 shadow-[0_0_70px_rgba(0,0,0,0.55)]">
        <div className="text-lg font-semibold text-amber-100">Multipliers</div>
        <div className="mt-1 text-xs text-amber-100/70">
          Category multipliers for the active card
        </div>

        <div className="mt-4 space-y-2">
          {activeCard.multipliers.map((m) => (
            <div
              key={m.label}
              className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/15 bg-black/20 px-3 py-2"
            >
              <div className="text-sm font-medium text-amber-50/90 leading-5">
                {m.label}
              </div>
              <div className="shrink-0 text-sm font-semibold text-amber-50">
                {m.x}x
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={surfaceCardClass("mt-5 p-5 border-sky-300/12 bg-sky-500/5")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-white/95">Expiring soon</div>
            <div className="mt-1 text-xs text-white/55">
              Real date logic (needs saved card + start date).
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">Window</span>
            <select
              value={expiringWindowDays}
              onChange={(e) => setExpiringWindowDays(Number(e.target.value))}
              className="rounded-lg border border-white/10 bg-black/25 px-2 py-1 text-xs outline-none"
            >
              <option value={7}>7d</option>
              <option value={14}>14d</option>
              <option value={21}>21d</option>
              <option value={30}>30d</option>
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {expiringSoon.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white/60">
              Nothing expiring soon.
              <div className="mt-1 text-xs text-white/45">
                To populate: save a card → set start date → toggle “Remind”.
              </div>
            </div>
          ) : (
            expiringSoon.map((x) => (
              <div key={`${x.card.key}:${x.credit.id}`} className="rounded-xl border border-white/10 bg-[#0F1218] p-3">
                <div className="text-xs text-white/50">{x.card.name}</div>
                <div className="text-sm font-semibold text-white/95">{x.credit.title}</div>
                <div className="mt-1 text-xs text-white/55">
                  Next reset: {formatDateShort(x.nextReset)} • {x.days} day{x.days === 1 ? "" : "s"}
                </div>
                <div className="mt-1 text-xs text-white/50">{creditSubtitle(x.credit)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );

  // -----------------------------
  // Page shell
  // -----------------------------
  return (
    <div className="min-h-screen bg-[#0A0C10] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-2xl font-semibold text-white/95">ClawBack</div>
            <div className="text-sm text-white/55">
              No bank logins. Just credits + reminders.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/70">
              Plan: Free
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/70">
              {authReady ? (userId ? "Logged in" : "Logged out") : "Auth..."}
            </div>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="mb-4 flex gap-2 lg:hidden">
          {[
            { key: "cards", label: "Cards" },
            { key: "credits", label: "Credits" },
            { key: "insights", label: "Insights" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setMobileView(t.key as any)}
              className={[
                "flex-1 rounded-full border px-3 py-2 text-sm font-semibold transition",
                mobileView === (t.key as any)
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Desktop grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className={["lg:block", mobileView === "cards" ? "block" : "hidden", "lg:col-span-4"].join(" ")}>
            {LeftPanel}
          </div>

          <div className={["lg:block", mobileView === "credits" ? "block" : "hidden", "lg:col-span-5"].join(" ")}>
            {MiddlePanel}
          </div>

          <div className={["lg:block", mobileView === "insights" ? "block" : "hidden", "lg:col-span-3"].join(" ")}>
            {RightPanel}
          </div>
        </div>
      </div>
    </div>
  );
}
