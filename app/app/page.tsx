// app/app/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createClient, type Session, type User } from "@supabase/supabase-js";
import {
  CARDS,
  pointValueUsd,
  type Card,
  type Credit,
  type CreditFrequency,
  type SpendCategory,
} from "../../data/cards";

// -----------------------------
// SUPABASE (non-null, TS-safe)
// -----------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -----------------------------
// TYPES
// -----------------------------
type ToggleState = Record<string, boolean>;

type DbUserCard = {
  card_key: string;
  card_start_date: string | null; // yyyy-mm-dd
};

type DbCreditState = {
  state_key: string; // `${cardKey}:${creditId}`
  used: boolean;
  dont_care: boolean;
  remind: boolean;
};

// -----------------------------
// ICONS (no dependencies)
// -----------------------------
function IconBell({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "h-4 w-4"}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M15 17H9m10-2V11a7 7 0 10-14 0v4l-2 2h18l-2-2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 19a2 2 0 01-4 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconEyeOff({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "h-4 w-4"}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.6 10.6a3 3 0 004.24 4.24"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9.9 5.2A10.5 10.5 0 0122 12c-.8 1.8-2.2 3.9-4.3 5.5M6.2 6.2C4.1 7.8 2.8 10 2 12c1.7 3.9 6 8 10 8 1.3 0 2.6-.3 3.8-.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "h-4 w-4"}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// -----------------------------
// HELPERS
// -----------------------------
function formatMoney(n: number): string {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function clampDayToEndOfMonth(year: number, monthIndex0: number, day: number) {
  const lastDay = new Date(year, monthIndex0 + 1, 0).getDate();
  return Math.min(day, lastDay);
}

function annualize(amount: number, freq: CreditFrequency): number {
  if (freq === "monthly") return amount * 12;
  if (freq === "quarterly") return amount * 4;
  if (freq === "semiannual") return amount * 2;
  if (freq === "annual") return amount;
  if (freq === "every4years") return amount / 4;
  if (freq === "every5years") return amount / 5;
  return amount;
}

function freqLabel(freq: CreditFrequency): string {
  if (freq === "monthly") return "Monthly";
  if (freq === "quarterly") return "Quarterly";
  if (freq === "semiannual") return "Semiannual";
  if (freq === "annual") return "Annual";
  if (freq === "every4years") return "Every 4 years";
  if (freq === "every5years") return "Every 5 years";
  return "One-time";
}

function freqSort(freq: CreditFrequency): number {
  const order: CreditFrequency[] = [
    "monthly",
    "quarterly",
    "semiannual",
    "annual",
    "every4years",
    "every5years",
    "onetime",
  ];
  const idx = order.indexOf(freq);
  return idx === -1 ? 999 : idx;
}

function creditSubtitle(c: Credit): string {
  const a = annualize(c.amount, c.frequency);
  return `${freqLabel(c.frequency)} • ${formatMoney(c.amount)} • Annualized: ${formatMoney(
    a
  )}`;
}

function surfaceCardClass(extra?: string): string {
  return [
    "rounded-2xl border border-white/10 bg-[#11141B] shadow-[0_0_70px_rgba(0,0,0,0.55)]",
    extra ?? "",
  ].join(" ");
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// -----------------------------
// EXPIRING SOON DATE MATH (v2)
// -----------------------------
function nextResetDateForCredit(params: {
  credit: Credit;
  cardStartDate: Date; // user's cardmember year start
  now: Date;
}): Date | null {
  const { credit, cardStartDate, now } = params;

  if (credit.frequency === "onetime") return null;

  const makeDate = (y: number, m0: number, d: number) => {
    const dd = clampDayToEndOfMonth(y, m0, d);
    return new Date(y, m0, dd, 0, 0, 0, 0);
  };

  const startMonth = cardStartDate.getMonth();
  const startDay = cardStartDate.getDate();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // monthly → next month same day (clamp)
  if (credit.frequency === "monthly") {
    const y = now.getFullYear();
    const m0 = now.getMonth();
    const nextM0 = m0 + 1;
    const nextY = y + Math.floor(nextM0 / 12);
    const normalizedM0 = ((nextM0 % 12) + 12) % 12;
    return makeDate(nextY, normalizedM0, startDay);
  }

  // every4years / every5years
  if (credit.frequency === "every4years" || credit.frequency === "every5years") {
    const years = credit.frequency === "every4years" ? 4 : 5;
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
  const monthsStep =
    credit.frequency === "quarterly"
      ? 3
      : credit.frequency === "semiannual"
      ? 6
      : 12;

  let candidate = makeDate(now.getFullYear(), startMonth, startDay);
  if (candidate > today) candidate = makeDate(now.getFullYear() - 1, startMonth, startDay);

  while (candidate <= today) {
    const next = new Date(candidate);
    next.setMonth(next.getMonth() + monthsStep);
    candidate = makeDate(next.getFullYear(), next.getMonth(), startDay);
  }

  return candidate;
}

// -----------------------------
// QUIZ ENGINE (deterministic)
// -----------------------------
type QuizInputs = {
  spend: Record<SpendCategory, number>; // monthly spend
  annualFeeTolerance: number; // soft penalty threshold
  creditUtilizationPct: number; // 0..1
  includeWelcomeBonus: boolean;
};

function getEarnRate(card: Card, cat: SpendCategory): number {
  const r = card.earnRates[cat];
  if (typeof r === "number") return r;
  return card.earnRates.other ?? 1;
}

function softFeePenalty(annualFee: number, tolerance: number): number {
  const harshness = 1.15;
  if (annualFee <= tolerance) return 0;
  return (annualFee - tolerance) * harshness;
}

function scoreCard(card: Card, input: QuizInputs) {
  const pv = pointValueUsd(card.pointsProgram);

  const annualSpendByCat: Record<SpendCategory, number> = {
    dining: input.spend.dining * 12,
    travel: input.spend.travel * 12,
    groceries: input.spend.groceries * 12,
    gas: input.spend.gas * 12,
    online: input.spend.online * 12,
    other: input.spend.other * 12,
  };

  let rewardsValue = 0;
  for (const cat of Object.keys(annualSpendByCat) as SpendCategory[]) {
    const spend = annualSpendByCat[cat];
    const rate = getEarnRate(card, cat);
    rewardsValue += spend * rate * pv;
  }

  const creditsValue = card.creditsTrackedAnnualized * input.creditUtilizationPct;
  const bonusValue = input.includeWelcomeBonus ? card.signupBonusEstUsd ?? 0 : 0;

  const fee = card.annualFee;
  const penalty = softFeePenalty(fee, input.annualFeeTolerance);

  const estAnnualValue = rewardsValue + creditsValue + bonusValue - fee;
  const score = estAnnualValue - penalty;

  const breakdown = [
    `Rewards: ${formatMoney(rewardsValue)}`,
    `Credits used: ${formatMoney(creditsValue)}`,
    `Welcome bonus: ${formatMoney(bonusValue)}`,
    `Annual fee: -${formatMoney(fee)}`,
    `Fee penalty (soft): -${formatMoney(penalty)}`,
  ];

  return { score, estAnnualValue, breakdown };
}

function inTier(card: Card, min: number, max: number): boolean {
  return card.annualFee >= min && card.annualFee <= max;
}

// -----------------------------
// PAGE
// -----------------------------
export default function AppDashboardPage() {
  const [mobileView, setMobileView] = useState<"cards" | "credits" | "insights">("credits");

  // Auth
  const [session, setSession] = useState<Session | null>(null);
  const user: User | null = session?.user ?? null;

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMsg, setAuthMsg] = useState<string | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "reset">("signin");
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  // Founder logic
  const FOUNDER_EMAIL = "namanlohia02@gmail.com";
  const isFounder =
    (user?.email ?? "").toLowerCase() === FOUNDER_EMAIL.toLowerCase();

  // Top Picks pinned
  const pinnedOrder: Card["key"][] = [
    "amex-platinum",
    "chase-sapphire-reserve",
    "capitalone-venture-x",
  ];

  const [search, setSearch] = useState("");

  // ✅ Platinum default
  const [activeCardKey, setActiveCardKey] = useState<Card["key"]>("amex-platinum");

  const [savedCards, setSavedCards] = useState<string[]>([]);
  const [cardStartDates, setCardStartDates] = useState<Record<string, string>>({});
  const [used, setUsed] = useState<ToggleState>({});
  const [dontCare, setDontCare] = useState<ToggleState>({});
  const [remind, setRemind] = useState<ToggleState>({});

  const [dbWarning, setDbWarning] = useState<string | null>(null);

  // Fee filter
  const feeBounds = useMemo(() => {
    const fees = CARDS.map((c) => c.annualFee);
    return { min: Math.min(...fees), max: Math.max(...fees) };
  }, []);

  const [feeMin, setFeeMin] = useState<number>(feeBounds.min);
  const [feeMax, setFeeMax] = useState<number>(feeBounds.max);

  const activeCard = useMemo(
    () => CARDS.find((c) => c.key === activeCardKey) ?? CARDS[0],
    [activeCardKey]
  );

  // ✅ Credits order:
  // 1) frequency group: monthly, quarterly, semiannual, annual, other (every4years/every5years/onetime)
  // 2) alphabetical within group (by title)
  const creditsSorted = useMemo(() => {
    return activeCard.credits
      .slice()
      .sort((a, b) => {
        const fa = freqSort(a.frequency);
        const fb = freqSort(b.frequency);
        if (fa !== fb) return fa - fb;

        const at = (a.title ?? "").toLowerCase();
        const bt = (b.title ?? "").toLowerCase();
        const byTitle = at.localeCompare(bt);
        if (byTitle !== 0) return byTitle;

        // stable-ish tie breakers
        const aid = (a.id ?? "").toLowerCase();
        const bid = (b.id ?? "").toLowerCase();
        return aid.localeCompare(bid);
      });
  }, [activeCard]);

  const totals = useMemo(() => {
    let totalAvail = 0;
    let totalRedeemed = 0;

    for (const c of creditsSorted) {
      const k = `${activeCard.key}:${c.id}`;
      const isDontCareOn = !!dontCare[k];
      const isUsedOn = !!used[k];
      const a = annualize(c.amount, c.frequency);

      if (!isDontCareOn) totalAvail += a;
      if (!isDontCareOn && isUsedOn) totalRedeemed += a;
    }

    const pct =
      totalAvail <= 0
        ? 0
        : Math.min(100, Math.round((totalRedeemed / totalAvail) * 100));
    return { totalAvail, totalRedeemed, pct };
  }, [creditsSorted, activeCard.key, dontCare, used]);

  // Quiz
  const [quizOpen, setQuizOpen] = useState(false);
  const [quiz, setQuiz] = useState<QuizInputs>({
    spend: {
      dining: 600,
      travel: 400,
      groceries: 400,
      gas: 120,
      online: 200,
      other: 800,
    },
    annualFeeTolerance: 200,
    creditUtilizationPct: 0.5,
    includeWelcomeBonus: true,
  });

  const quizResults = useMemo(() => {
    const scored = CARDS.map((c) => ({ card: c, ...scoreCard(c, quiz) })).sort(
      (a, b) => b.score - a.score
    );
    return scored.slice(0, 3);
  }, [quiz]);

  // -----------------------------
  // AUTH: init + subscribe
  // -----------------------------
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setSession(data.session ?? null);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // -----------------------------
  // LOAD USER DATA
  // -----------------------------
  const didInitialLoad = useRef(false);

  useEffect(() => {
    if (!user) {
      setSavedCards([]);
      setCardStartDates({});
      setUsed({});
      setDontCare({});
      setRemind({});
      setDbWarning(null);
      didInitialLoad.current = false;
      return;
    }

    if (didInitialLoad.current) return;
    didInitialLoad.current = true;

    (async () => {
      try {
        setDbWarning(null);

        const { data: cards, error: cardsErr } = await supabase
          .from("user_cards")
          .select("card_key, card_start_date")
          .order("created_at", { ascending: true });

        if (cardsErr) throw cardsErr;

        const typedCards = (cards ?? []) as DbUserCard[];
        setSavedCards(typedCards.map((c) => c.card_key));

        const startMap: Record<string, string> = {};
        for (const c of typedCards) {
          if (c.card_start_date) startMap[c.card_key] = c.card_start_date;
        }
        setCardStartDates(startMap);

        const { data: states, error: statesErr } = await supabase
          .from("credit_states")
          .select("state_key, used, dont_care, remind");

        if (statesErr) throw statesErr;

        const typedStates = (states ?? []) as DbCreditState[];

        const usedMap: ToggleState = {};
        const dcMap: ToggleState = {};
        const remindMap: ToggleState = {};

        for (const s of typedStates) {
          usedMap[s.state_key] = !!s.used;
          dcMap[s.state_key] = !!s.dont_care;
          remindMap[s.state_key] = !!s.remind;
        }

        setUsed(usedMap);
        setDontCare(dcMap);
        setRemind(remindMap);
      } catch {
        setDbWarning(
          "Supabase tables/policies might not be set up yet. App will still run (no persistence)."
        );
      }
    })();
  }, [user]);

  // -----------------------------
  // ✅ EXPIRING SOON (date-based v2)
  // -----------------------------
  const expiringSoon = useMemo(() => {
    const out: Array<{ credit: Credit; due: Date }> = [];

    const startStr = cardStartDates[activeCard.key];
    if (!startStr) return out;

    const start = new Date(startStr + "T00:00:00");
    const now = new Date();
    const horizonDays = 14;
    const horizon = new Date(now);
    horizon.setDate(horizon.getDate() + horizonDays);

    for (const c of creditsSorted) {
      const k = `${activeCard.key}:${c.id}`;
      if (!remind[k]) continue;
      if (used[k]) continue;
      if (dontCare[k]) continue;

      const due = nextResetDateForCredit({ credit: c, cardStartDate: start, now });
      if (!due) continue;
      if (due <= horizon) out.push({ credit: c, due });
    }

    out.sort((a, b) => a.due.getTime() - b.due.getTime());
    return out.slice(0, 8);
  }, [creditsSorted, activeCard.key, remind, used, dontCare, cardStartDates]);

  // -----------------------------
  // PERSIST HELPERS
  // -----------------------------
  async function upsertCreditState(stateKey: string, patch: Partial<DbCreditState>) {
    if (!user) return;
    await supabase.from("credit_states").upsert(
      {
        user_id: user.id,
        state_key: stateKey,
        used: !!patch.used,
        dont_care: !!patch.dont_care,
        remind: !!patch.remind,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,state_key" }
    );
  }

  function toggleUsed(cardKey: string, creditId: string) {
    const k = `${cardKey}:${creditId}`;
    setUsed((prev) => {
      const next = { ...prev, [k]: !prev[k] };
      void upsertCreditState(k, {
        used: next[k],
        dont_care: !!dontCare[k],
        remind: !!remind[k],
      });
      return next;
    });
  }

  function toggleDontCare(cardKey: string, creditId: string) {
    const k = `${cardKey}:${creditId}`;
    setDontCare((prev) => {
      const next = { ...prev, [k]: !prev[k] };
      void upsertCreditState(k, {
        used: !!used[k],
        dont_care: next[k],
        remind: !!remind[k],
      });
      return next;
    });
  }

  function toggleRemind(cardKey: string, creditId: string) {
    const k = `${cardKey}:${creditId}`;
    setRemind((prev) => {
      const next = { ...prev, [k]: !prev[k] };
      void upsertCreditState(k, {
        used: !!used[k],
        dont_care: !!dontCare[k],
        remind: next[k],
      });
      return next;
    });
  }

  async function notifyMeForThisCard() {
    if (!user) {
      setAuthMsg("Sign in to save a card.");
      setAuthModalOpen(true);
      setAuthMode("signin");
      return;
    }

    if (!isFounder && savedCards.length >= 1 && !savedCards.includes(activeCard.key)) {
      setAuthMsg("Free tier saves 1 card. Multi-card is $5 flat (coming soon).");
      return;
    }

    setSavedCards((prev) =>
      prev.includes(activeCard.key) ? prev : [...prev, activeCard.key]
    );

    try {
      await supabase.from("user_cards").upsert(
        { user_id: user.id, card_key: activeCard.key },
        { onConflict: "user_id,card_key" }
      );
    } catch {
      // ignore
    }
  }

  async function updateCardStartDate(cardKey: string, iso: string) {
    setCardStartDates((p) => ({ ...p, [cardKey]: iso }));
    if (!user) return;

    try {
      await supabase.from("user_cards").upsert(
        { user_id: user.id, card_key: cardKey, card_start_date: iso },
        { onConflict: "user_id,card_key" }
      );
    } catch {
      // ignore
    }
  }

  // -----------------------------
  // BROWSE LIST (Alphabetical)
  // -----------------------------
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

  // -------------------------
  // AUTH ACTIONS
  // -------------------------
  async function signIn() {
    setAuthBusy(true);
    setAuthMsg(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      });
      if (error) setAuthMsg(error.message);
      else {
        setAuthMsg(null);
        setAuthModalOpen(false);
      }
    } finally {
      setAuthBusy(false);
    }
  }

  async function signUp() {
    setAuthBusy(true);
    setAuthMsg(null);
    try {
      const { error } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword,
      });
      if (error) setAuthMsg(error.message);
      else setAuthMsg("Check your email to confirm your account (if required).");
    } finally {
      setAuthBusy(false);
    }
  }

  async function sendPasswordReset() {
    setAuthBusy(true);
    setResetMsg(null);
    try {
      const email = (resetEmail || authEmail).trim();
      if (!email) {
        setResetMsg("Enter your email first.");
        return;
      }

      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/app/auth/reset`
          : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) setResetMsg(error.message);
      else setResetMsg("Password reset email sent. Check your inbox.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function signOut() {
    setAuthMsg(null);

    // optimistic UI update (no refresh needed)
    setSession(null);
    setSavedCards([]);
    setCardStartDates({});
    setUsed({});
    setDontCare({});
    setRemind({});
    setDbWarning(null);
    didInitialLoad.current = false;

    await supabase.auth.signOut({ scope: "local" });
  }

  // -----------------------------
  // UI helpers
  // -----------------------------
  function badgePill(text: string, tone: "gold" | "slate" | "neutral") {
    const cls =
      tone === "gold"
        ? "border-amber-300/25 bg-amber-300/10 text-amber-100"
        : tone === "slate"
        ? "border-sky-300/20 bg-sky-300/10 text-sky-100"
        : "border-white/10 bg-white/5 text-white/70";
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cls}`}
      >
        {text}
      </span>
    );
  }

  function IconToggleButton(props: {
    on: boolean;
    onClick: () => void;
    title: string;
    icon: React.ReactNode;
    tone: "neutral" | "good" | "warn";
  }) {
    const base =
      "inline-flex items-center justify-center rounded-full border px-2.5 py-2 text-xs transition select-none";
    const cls =
      props.tone === "good"
        ? props.on
          ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
          : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10"
        : props.tone === "warn"
        ? props.on
          ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
          : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10"
        : props.on
        ? "border-sky-300/30 bg-sky-300/15 text-sky-100"
        : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10";

    return (
      <button
        type="button"
        onClick={props.onClick}
        title={props.title}
        className={`${base} ${cls}`}
      >
        {props.icon}
      </button>
    );
  }

  function CardRow({
    card,
    showTopPickBadge,
  }: {
    card: Card;
    showTopPickBadge?: boolean;
  }) {
    const active = card.key === activeCard.key;

    return (
      <button
        onClick={() => {
          setActiveCardKey(card.key);
          setMobileView("credits");
        }}
        className={[
          "flex w-full items-start gap-3 px-3 py-3 text-left transition",
          active ? "bg-white/8" : "hover:bg-white/5",
        ].join(" ")}
        type="button"
      >
        <div
          className={[
            "relative mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-black/30",
            active
              ? "border-amber-300/30 shadow-[0_0_0_2px_rgba(245,158,11,0.12),0_0_40px_rgba(245,158,11,0.10)]"
              : "border-white/10",
          ].join(" ")}
        >
          <Image src={card.logo} alt={card.name} fill className="object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold leading-5 line-clamp-2 text-white/95">
              {card.name}
            </div>

            {/* welcome bonus est badge */}
            {typeof card.signupBonusEstUsd === "number" &&
            card.signupBonusEstUsd > 0 ? (
              <span className="shrink-0 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-100">
                Bonus est: {formatMoney(card.signupBonusEstUsd)}
              </span>
            ) : null}

            {showTopPickBadge ? (
              <span className="shrink-0 rounded-full border border-amber-400/35 bg-amber-400/12 px-2 py-0.5 text-[10px] font-semibold text-amber-100">
                Top pick
              </span>
            ) : null}
          </div>

          <div className="mt-0.5 text-xs text-white/55">
            Fee: {formatMoney(card.annualFee)} • Credits:{" "}
            {formatMoney(card.creditsTrackedAnnualized)}
          </div>
        </div>

        <div className="pt-1 text-[10px] text-white/35">{active ? "Viewing" : ""}</div>
      </button>
    );
  }

  function Section({
    title,
    subtitle,
    cards,
    accent,
  }: {
    title: string;
    subtitle: string;
    cards: Card[];
    accent: "gold" | "slate" | "neutral";
  }) {
    if (cards.length === 0) return null;

    const headerBg =
      accent === "gold"
        ? "bg-amber-400/10 border-amber-400/20"
        : accent === "slate"
        ? "bg-sky-400/10 border-sky-400/20"
        : "bg-white/5 border-white/10";

    const titleColor =
      accent === "gold"
        ? "text-amber-100"
        : accent === "slate"
        ? "text-sky-100"
        : "text-white/90";

    return (
      <div className="border-t border-white/10">
        <div
          className={[
            "px-3 py-3 border-b flex items-center justify-between gap-3",
            headerBg,
          ].join(" ")}
        >
          <div>
            <div className={["text-lg font-semibold leading-6", titleColor].join(" ")}>
              {title}
            </div>
            <div className="text-xs text-white/55">{subtitle}</div>
          </div>
          <div className="flex items-center gap-2">
            {badgePill(
              `${cards.length} cards`,
              accent === "neutral" ? "neutral" : accent
            )}
          </div>
        </div>
        {cards.map((c) => (
          <CardRow key={c.key} card={c} />
        ))}
      </div>
    );
  }

  // -------------------------
  // TOP-RIGHT AUTH + QUIZ
  // -------------------------
  const TopRight = (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {user ? (
        <>
          <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-emerald-100">
            {isFounder ? "Founder" : "Signed in"}
          </div>
          <div className="hidden sm:block rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/70 max-w-[320px] truncate">
            {user.email}
          </div>
          <button
            onClick={signOut}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/80 hover:bg-white/10"
            type="button"
          >
            Sign out
          </button>
        </>
      ) : (
        <>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/70">
            Preview mode
          </div>
          <button
            onClick={() => {
              setAuthModalOpen(true);
              setAuthMode("signin");
              setAuthMsg(null);
              setResetMsg(null);
            }}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/80 hover:bg-white/10"
            type="button"
          >
            Sign in
          </button>
          <button
            onClick={() => {
              setAuthModalOpen(true);
              setAuthMode("signup");
              setAuthMsg(null);
              setResetMsg(null);
            }}
            className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-emerald-100 hover:bg-emerald-300/15"
            type="button"
          >
            Sign up
          </button>
        </>
      )}

      <button
        onClick={() => setQuizOpen(true)}
        className="rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-amber-100 hover:bg-amber-300/15"
        type="button"
      >
        Quiz
      </button>
    </div>
  );

  const AuthModal = !authModalOpen ? null : (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-black/60"
        onClick={() => setAuthModalOpen(false)}
        aria-label="Close auth modal backdrop"
      />
      <div className="absolute left-1/2 top-10 w-[92vw] max-w-xl -translate-x-1/2">
        <div className={surfaceCardClass("p-5")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xl font-semibold text-white/95">
                {authMode === "signin"
                  ? "Sign in"
                  : authMode === "signup"
                  ? "Create account"
                  : "Reset password"}
              </div>
              <div className="mt-1 text-sm text-white/55">
                {authMode === "reset"
                  ? "We’ll email you a reset link."
                  : "Email/password. No anonymous accounts."}
              </div>
            </div>
            <button
              onClick={() => setAuthModalOpen(false)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
              type="button"
            >
              Close
            </button>
          </div>

          {authMode !== "reset" ? (
            <div className="mt-4 space-y-2">
              <input
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm outline-none placeholder:text-white/30"
              />
              <input
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Password"
                type="password"
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm outline-none placeholder:text-white/30"
              />

              <div className="flex gap-2 pt-1">
                {authMode === "signin" ? (
                  <>
                    <button
                      onClick={signIn}
                      disabled={authBusy}
                      className="flex-1 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
                      type="button"
                    >
                      Sign in
                    </button>
                    <button
                      onClick={() => setAuthMode("signup")}
                      disabled={authBusy}
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 disabled:opacity-60"
                      type="button"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={signUp}
                      disabled={authBusy}
                      className="flex-1 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
                      type="button"
                    >
                      Create account
                    </button>
                    <button
                      onClick={() => setAuthMode("signin")}
                      disabled={authBusy}
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 disabled:opacity-60"
                      type="button"
                    >
                      Back to sign in
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    setAuthMode("reset");
                    setResetEmail(authEmail);
                    setResetMsg(null);
                  }}
                  className="text-xs text-white/55 hover:text-white/80"
                  type="button"
                >
                  Forgot password?
                </button>
                <div className="text-xs text-white/40">
                  Tip: confirm email can be OFF during testing.
                </div>
              </div>

              {authMsg ? (
                <div className="mt-2 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/70">
                  {authMsg}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <input
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm outline-none placeholder:text-white/30"
              />
              <button
                onClick={sendPasswordReset}
                disabled={authBusy}
                className="w-full rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
                type="button"
              >
                Send reset email
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setAuthMode("signin")}
                  className="text-xs text-white/55 hover:text-white/80"
                  type="button"
                >
                  Back to sign in
                </button>
                <div className="text-xs text-white/40">
                  Reset link opens /app/auth/reset
                </div>
              </div>

              {resetMsg ? (
                <div className="mt-2 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/70">
                  {resetMsg}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // -------------------------
  // LEFT PANEL (NO SIGN IN UI)
  // -------------------------
  const LeftPanel = (
    <aside className="lg:col-span-4">
      <div className={surfaceCardClass("p-4 lg:sticky lg:top-5")}>
        <div className="rounded-2xl border border-white/10 bg-[#0F1218] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-white/95">Account</div>
              <div className="mt-1 text-xs text-white/55">
                Sign in top-right to save cards + toggles.
              </div>
            </div>
            {user ? (
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
                Synced
              </span>
            ) : (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                Preview
              </span>
            )}
          </div>

          {!user ? (
            <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/70">
              You can browse everything free. Sign in (top-right) to save 1 card + your reminders.
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <div className="text-xs text-white/60 break-all">{user.email}</div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                Plan: {isFounder ? "Founder" : "Free"}
              </div>
              {dbWarning ? (
                <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs text-amber-100/90">
                  {dbWarning}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Your Cards */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-[#0F1218] p-4">
          <div className="text-lg font-semibold text-white/95">Your Cards</div>
          <div className="mt-1 text-xs text-white/55">Saved cards appear here.</div>

          <div className="mt-3 space-y-2">
            {savedCards.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/60">
                No saved cards yet. Pick a card and click “Notify me”.
              </div>
            ) : (
              savedCards.map((k) => {
                const card = CARDS.find((c) => c.key === k);
                if (!card) return null;
                const start = cardStartDates[k] ?? "";
                return (
                  <div key={k} className="rounded-xl border border-white/10 bg-black/25 p-3">
                    <div className="flex items-start gap-3">
                      <div className="relative mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                        <Image src={card.logo} alt={card.name} fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold leading-5 line-clamp-2">
                          {card.name}
                        </div>
                        <div className="mt-0.5 text-xs text-white/55">
                          Fee: {formatMoney(card.annualFee)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-[11px] text-white/50">
                        Cardmember year start (for Expiring Soon)
                      </div>
                      <input
                        type="date"
                        value={start}
                        onChange={(e) => updateCardStartDate(k, e.target.value)}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/25 px-2 py-2 text-xs outline-none"
                        disabled={!user}
                      />
                      {!user ? (
                        <div className="mt-1 text-[11px] text-white/40">
                          Sign in to save start dates.
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Choose your card */}
        <div className="mt-4">
          <div className="text-lg font-semibold text-white/95">Choose your card</div>
          <div className="mt-1 text-xs text-white/55">
            Browse any card free. “Notify me” saves it to your dashboard.
          </div>

          <div className="mt-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cards..."
              className="w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none placeholder:text-white/30"
            />
          </div>

          {/* Fee filter */}
          <div className="mt-3 rounded-2xl border border-white/10 bg-[#0F1218] p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white/90">
                Annual fee filter
              </div>
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

            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { label: "0–250", min: 0, max: 250 },
                { label: "250–500", min: 250, max: 500 },
                { label: "500+", min: 500, max: feeBounds.max },
              ].map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => {
                    setFeeMin(chip.min);
                    setFeeMax(chip.max);
                  }}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
                  type="button"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="mt-3 text-[11px] text-white/40">
              Hard filter affects browsing only. Quiz uses soft fee penalty.
            </div>
          </div>

          {/* Tiered list */}
          <div className="mt-3 overflow-auto rounded-2xl border border-white/10 bg-[#0F1218] lg:max-h-[46vh]">
            {topPicksVisible ? (
              <div className="border-b border-white/10">
                <div className="px-3 py-3 bg-amber-400/10">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-amber-100">
                        Top Picks
                      </div>
                      <div className="text-xs text-white/55">
                        Your 3 highlighted cards
                      </div>
                    </div>
                    {badgePill(`${topPicks.length} cards`, "gold")}
                  </div>
                </div>
                {topPicks.map((c) => (
                  <CardRow key={c.key} card={c} showTopPickBadge />
                ))}
              </div>
            ) : null}

            <Section title="Tier 3" subtitle="$500+ annual fee" cards={tier3} accent="slate" />
            <Section title="Tier 2" subtitle="$250–$500 annual fee" cards={tier2} accent="neutral" />
            <Section title="Tier 1" subtitle="$0–$250 annual fee" cards={tier1} accent="neutral" />

            {baseFiltered.length === 0 ? (
              <div className="p-4 text-sm text-white/60">
                No cards match your search / fee filter.
              </div>
            ) : null}
          </div>

          <button
            onClick={() => void notifyMeForThisCard()}
            className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90"
            type="button"
          >
            Notify me for this card
          </button>

          <div className="mt-2 text-xs text-white/40">
            Free: save 1 card • Multi-card is $5 flat (coming soon)
          </div>

          {authMsg ? (
            <div className="mt-2 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/70">
              {authMsg}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );

  // -------------------------
  // MIDDLE: Credits
  // -------------------------
  const MiddlePanel = (
    <main className="lg:col-span-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className={surfaceCardClass("p-4")}>
          <div className="text-xs text-white/55">Credits Redeemed</div>
          <div className="mt-2 text-3xl font-semibold text-emerald-100">
            {formatMoney(totals.totalRedeemed)}
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-black/30">
            <div className="h-2 rounded-full bg-emerald-400/80" style={{ width: `${totals.pct}%` }} />
          </div>
          <div className="mt-2 text-xs text-white/50">{totals.pct}% used</div>
        </div>

        <div className={surfaceCardClass("p-4")}>
          <div className="text-xs text-white/55">Total Credits Available</div>
          <div className="mt-2 text-3xl font-semibold text-white/95">
            {formatMoney(totals.totalAvail)}
          </div>
          <div className="mt-2 text-xs text-white/50">
            excludes credits marked “Don’t care”
          </div>
        </div>

        <div className={surfaceCardClass("p-4 border-red-400/15 bg-red-500/6")}>
          <div className="text-xs text-white/55">Annual Fee</div>
          <div className="mt-2 text-3xl font-semibold text-red-100">
            {formatMoney(activeCard.annualFee)}
          </div>
          <div className="mt-2 text-xs text-white/50">next: net value vs fee</div>
        </div>
      </div>

      {/* Active card glow */}
      <div
        className={surfaceCardClass(
          "mt-6 p-5 border-amber-300/15 shadow-[0_0_0_2px_rgba(245,158,11,0.10),0_0_90px_rgba(245,158,11,0.08)]"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-black/30">
              <Image src={activeCard.logo} alt={activeCard.name} fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-semibold text-white/95 leading-6 line-clamp-2">
                {activeCard.name}
              </div>
              <div className="mt-1 text-sm text-white/55">
                Annual fee: {formatMoney(activeCard.annualFee)} • Credits tracked:{" "}
                {formatMoney(activeCard.creditsTrackedAnnualized)}
              </div>
            </div>
          </div>
          <div className="text-xs text-white/45 text-right">
            Status
            <br />
            {user ? "Synced" : "Preview"}
          </div>
        </div>

        <div className="mt-6">
          <div className="text-base font-semibold text-white/90">Credits</div>

          <div className="mt-4 space-y-3">
            {creditsSorted.map((c) => {
              const key = `${activeCard.key}:${c.id}`;
              const usedOn = !!used[key];
              const dontCareOn = !!dontCare[key];
              const remindOn = !!remind[key];

              return (
                <div key={c.id} className="rounded-2xl border border-white/10 bg-[#0F1218] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white/95 leading-5 line-clamp-2">
                        {c.title}
                      </div>
                      <div className="mt-1 text-xs text-white/55">
                        {creditSubtitle(c)}
                        {c.notes ? ` • ${c.notes}` : ""}
                      </div>
                    </div>

                    {/* Icon toggles */}
                    <div className="flex items-center gap-2 sm:justify-end">
                      <IconToggleButton
                        on={remindOn}
                        onClick={() => toggleRemind(activeCard.key, c.id)}
                        title="Remind"
                        icon={<IconBell className="h-4 w-4" />}
                        tone="neutral"
                      />
                      <IconToggleButton
                        on={dontCareOn}
                        onClick={() => toggleDontCare(activeCard.key, c.id)}
                        title="Don’t care"
                        icon={<IconEyeOff className="h-4 w-4" />}
                        tone="warn"
                      />
                      <IconToggleButton
                        on={usedOn}
                        onClick={() => toggleUsed(activeCard.key, c.id)}
                        title="Mark used"
                        icon={<IconCheck className="h-4 w-4" />}
                        tone="good"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {creditsSorted.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#0F1218] p-4 text-sm text-white/60">
                No credits found for this card.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );

  // -------------------------
  // RIGHT: Multipliers + Expiring Soon
  // -------------------------
  const RightPanel = (
    <aside className="lg:col-span-3">
      <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 shadow-[0_0_70px_rgba(0,0,0,0.55)]">
        <div className="text-lg font-semibold text-amber-100">Points / Cash Back</div>
        <div className="mt-1 text-xs text-amber-100/70">
          Category multipliers for the active card
        </div>

        <div className="mt-4 space-y-2">
          {activeCard.multipliers.map((m) => (
            <div
              key={m.label}
              className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/15 bg-black/20 px-3 py-2"
            >
              <div className="text-sm font-medium text-amber-50/90 leading-5 line-clamp-2">
                {m.label}
              </div>
              <div className="shrink-0 text-sm font-semibold text-amber-50">{m.x}x</div>
            </div>
          ))}
        </div>
      </div>

      <div className={surfaceCardClass("mt-5 p-5 border-sky-300/12 bg-sky-500/5")}>
        <div className="text-lg font-semibold text-white/95">Expiring soon</div>
        <div className="mt-1 text-xs text-white/55">
          Date-based (needs your cardmember year start date).
        </div>

        {!cardStartDates[activeCard.key] ? (
          <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100/90">
            Add your <b>cardmember year start date</b> in “Your Cards” to enable Expiring Soon.
          </div>
        ) : null}

        <div className="mt-4 space-y-2">
          {expiringSoon.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white/60">
              {cardStartDates[activeCard.key]
                ? "No credits expiring in the next 14 days (with Remind on)."
                : "No date set yet. Toggle Remind + set start date."}
            </div>
          ) : (
            expiringSoon.map((x) => (
              <div key={x.credit.id} className="rounded-xl border border-white/10 bg-[#0F1218] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold leading-5 line-clamp-2">
                      {x.credit.title}
                    </div>
                    <div className="mt-1 text-xs text-white/55">
                      {creditSubtitle(x.credit)}
                    </div>
                  </div>
                  <div className="shrink-0 rounded-full border border-sky-300/20 bg-sky-300/10 px-2 py-0.5 text-[11px] text-sky-100">
                    due {formatDateShort(x.due)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-3 text-[11px] text-white/45">
          Rules: Remind ON, not Used, not Don’t care, and reset within 14 days.
        </div>
      </div>
    </aside>
  );

  // -------------------------
  // QUIZ MODAL
  // -------------------------
  const QuizModal = !quizOpen ? null : (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-black/60"
        onClick={() => setQuizOpen(false)}
        aria-label="Close quiz modal backdrop"
      />
      <div className="absolute left-1/2 top-8 w-[92vw] max-w-3xl -translate-x-1/2">
        <div className={surfaceCardClass("p-5")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xl font-semibold text-white/95">Quick Fit Quiz</div>
              <div className="mt-1 text-sm text-white/55">
                Recommendation math is deterministic (rule-based).
              </div>
            </div>
            <button
              onClick={() => setQuizOpen(false)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
              type="button"
            >
              Close
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(
              ["dining", "travel", "groceries", "gas", "online", "other"] as SpendCategory[]
            ).map((cat) => (
              <div key={cat}>
                <div className="text-xs text-white/50">{cat} / mo</div>
                <input
                  type="number"
                  value={quiz.spend[cat]}
                  onChange={(e) =>
                    setQuiz((p) => ({
                      ...p,
                      spend: { ...p.spend, [cat]: Number(e.target.value || 0) },
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs text-white/50">Annual fee tolerance</div>
              <input
                type="number"
                value={quiz.annualFeeTolerance}
                onChange={(e) =>
                  setQuiz((p) => ({
                    ...p,
                    annualFeeTolerance: Number(e.target.value || 0),
                  }))
                }
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <div className="text-xs text-white/50">Credit usage %</div>
              <select
                value={quiz.creditUtilizationPct}
                onChange={(e) =>
                  setQuiz((p) => ({
                    ...p,
                    creditUtilizationPct: Number(e.target.value),
                  }))
                }
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none"
              >
                <option value={0.25}>25%</option>
                <option value={0.5}>50%</option>
                <option value={0.75}>75%</option>
                <option value={1}>100%</option>
              </select>
            </div>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={quiz.includeWelcomeBonus}
              onChange={(e) =>
                setQuiz((p) => ({ ...p, includeWelcomeBonus: e.target.checked }))
              }
            />
            Include welcome bonus value (if any)
          </label>

          <div className="mt-5">
            <div className="text-base font-semibold text-white/90">Top matches</div>
            <div className="mt-3 space-y-3">
              {quizResults.map((r) => (
                <div key={r.card.key} className="rounded-2xl border border-white/10 bg-[#0F1218] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold leading-5 line-clamp-2">
                        {r.card.name}
                      </div>
                      <div className="mt-1 text-sm text-white/60">
                        Est annual value: {formatMoney(r.estAnnualValue)} • Score:{" "}
                        {formatMoney(r.score)}
                      </div>
                    </div>
                    <div className="shrink-0 text-xs text-white/50">
                      Fee {formatMoney(r.card.annualFee)}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-white/55">
                    {r.breakdown.slice(0, 5).map((b) => (
                      <div key={b}>• {b}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 text-xs text-white/45">
              Next: “what to do this month” checklist + reminders UX.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // -------------------------
  // PAGE
  // -------------------------
  return (
    <div className="min-h-screen bg-[#0A0C10] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-2xl font-semibold text-white/95">ClawBack</div>
            <div className="text-sm text-white/55">
              No bank logins. Just credits, reminders, and savings.
            </div>
          </div>

          {TopRight}
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
              onClick={() => setMobileView(t.key as "cards" | "credits" | "insights")}
              className={[
                "flex-1 rounded-full border px-3 py-2 text-sm font-semibold transition",
                mobileView === t.key
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

      {AuthModal}
      {QuizModal}
    </div>
  );
}
