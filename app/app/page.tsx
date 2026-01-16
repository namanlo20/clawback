// app/app/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
// SUPABASE
// -----------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -----------------------------
// CONFETTI
// -----------------------------
function fireConfetti() {
  const duration = 4000;
  const animationEnd = Date.now() + duration;
  const colors = ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b', '#8b5cf6', '#a78bfa'];

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);
    for (let i = 0; i < 5; i++) {
      createParticle(Math.random() * 0.6 + 0.2, Math.random() * 0.4 + 0.5, colors);
    }
  }, 250);
}

function createParticle(x: number, y: number, colors: string[]) {
  const p = document.createElement('div');
  p.style.cssText = `position:fixed;left:${x*100}vw;top:${y*100}vh;width:${Math.random()*10+5}px;height:${Math.random()*10+5}px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:${Math.random()>0.5?'50%':'0'};pointer-events:none;z-index:9999;animation:confetti-fall 3s ease-out forwards;transform:rotate(${Math.random()*360}deg);`;
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 3000);
}

if (typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.textContent = `@keyframes confetti-fall{0%{opacity:1;transform:translateY(0) rotate(0deg) scale(1)}100%{opacity:0;transform:translateY(100vh) rotate(720deg) scale(0.3)}}`;
  document.head.appendChild(s);
}

// -----------------------------
// TYPES
// -----------------------------
type ToggleState = Record<string, boolean>;
type DbUserCard = { card_key: string; card_start_date: string | null };
type DbCreditState = { state_key: string; used: boolean; dont_care: boolean; remind: boolean };

// -----------------------------
// ICONS
// -----------------------------
const Icon = {
  Bell: ({ className = "h-4 w-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M15 17H9m10-2V11a7 7 0 10-14 0v4l-2 2h18l-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 19a2 2 0 01-4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
  ),
  EyeOff: ({ className = "h-4 w-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18M10.6 10.6a3 3 0 004.24 4.24M9.9 5.2A10.5 10.5 0 0122 12c-.8 1.8-2.2 3.9-4.3 5.5M6.2 6.2C4.1 7.8 2.8 10 2 12c1.7 3.9 6 8 10 8 1.3 0 2.6-.3 3.8-.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  Check: ({ className = "h-4 w-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  Gear: ({ className = "h-4 w-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a8.4 8.4 0 000-6l-2.1.4a6.7 6.7 0 00-1.2-1.2L16.5 6a8.4 8.4 0 00-6 0l.4 2.2a6.7 6.7 0 00-1.2 1.2L7.5 9a8.4 8.4 0 000 6l2.2-.4a6.7 6.7 0 001.2 1.2L10.5 18a8.4 8.4 0 006 0l-.4-2.2a6.7 6.7 0 001.2-1.2l2.1.4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
  ),
  Sparkles: ({ className = "h-4 w-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 15l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5L17 17l1.5-.5.5-1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  ChevronDown: ({ className = "h-4 w-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  Star: ({ className = "h-4 w-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
  ),
};

// -----------------------------
// HELPERS
// -----------------------------
const fmt = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtFull = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });

function clampDay(year: number, m0: number, day: number) {
  return Math.min(day, new Date(year, m0 + 1, 0).getDate());
}

function annualize(amount: number, freq: CreditFrequency): number {
  const map: Record<CreditFrequency, number> = { monthly: 12, quarterly: 4, semiannual: 2, annual: 1, every4years: 0.25, every5years: 0.2, onetime: 1 };
  return amount * map[freq];
}

function freqLabel(f: CreditFrequency): string {
  const m: Record<CreditFrequency, string> = { monthly: "Monthly", quarterly: "Quarterly", semiannual: "Semiannual", annual: "Annual", every4years: "Every 4 yrs", every5years: "Every 5 yrs", onetime: "One-time" };
  return m[f];
}

function freqSort(f: CreditFrequency): number {
  return ["monthly", "quarterly", "semiannual", "annual", "every4years", "every5years", "onetime"].indexOf(f);
}

const surface = (extra = "") => `rounded-2xl border border-white/10 bg-[#11141B]/80 backdrop-blur-sm ${extra}`;

function formatDateShort(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Reset date calc
function nextResetDate(credit: Credit, cardStart: Date, now: Date): Date | null {
  if (credit.frequency === "onetime") return null;
  const make = (y: number, m: number, d: number) => new Date(y, m, clampDay(y, m, d), 0, 0, 0, 0);
  const sm = cardStart.getMonth(), sd = cardStart.getDate();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (credit.frequency === "monthly") {
    const nm = now.getMonth() + 1;
    return make(now.getFullYear() + Math.floor(nm / 12), nm % 12, sd);
  }
  if (credit.frequency === "every4years" || credit.frequency === "every5years") {
    const yrs = credit.frequency === "every4years" ? 4 : 5;
    const sy = cardStart.getFullYear();
    let k = Math.floor((now.getFullYear() - sy) / yrs);
    if (k < 0) k = 0;
    let cy = sy + k * yrs;
    let c = make(cy, sm, sd);
    if (c <= today) c = make(cy + yrs, sm, sd);
    return c;
  }
  const step = credit.frequency === "quarterly" ? 3 : credit.frequency === "semiannual" ? 6 : 12;
  let cand = make(now.getFullYear(), sm, sd);
  if (cand > today) cand = make(now.getFullYear() - 1, sm, sd);
  while (cand <= today) {
    const n = new Date(cand);
    n.setMonth(n.getMonth() + step);
    cand = make(n.getFullYear(), n.getMonth(), sd);
  }
  return cand;
}

// Quiz
type QuizInputs = { spend: Record<SpendCategory, number>; feeTolerance: number; creditUtil: number; welcomeBonus: boolean };
type QuizStep = 'intro' | 'spending' | 'fee' | 'results';

function scoreCard(card: Card, q: QuizInputs) {
  const pv = pointValueUsd(card.pointsProgram);
  let rewards = 0;
  for (const cat of ["dining", "travel", "groceries", "gas", "online", "other"] as SpendCategory[]) {
    const rate = card.earnRates[cat] ?? card.earnRates.other ?? 1;
    rewards += q.spend[cat] * 12 * rate * pv;
  }
  const credits = card.creditsTrackedAnnualized * q.creditUtil;
  const bonus = q.welcomeBonus ? card.signupBonusEstUsd ?? 0 : 0;
  const penalty = card.annualFee > q.feeTolerance ? (card.annualFee - q.feeTolerance) * 1.15 : 0;
  const value = rewards + credits + bonus - card.annualFee;
  return { score: value - penalty, value, breakdown: [`Rewards: ${fmt(rewards)}`, `Credits: ${fmt(credits)}`, `Bonus: ${fmt(bonus)}`, `Fee: -${fmt(card.annualFee)}`] };
}

function normalizeOffsets(arr: number[]) {
  const c = arr.map(Number).filter(x => Number.isFinite(x) && x > 0 && x <= 60);
  return [...new Set(c)].sort((a, b) => b - a).slice(0, 5) || [7, 1];
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
  const [authName, setAuthName] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMsg, setAuthMsg] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "reset">("signin");
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  // Settings
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [offsetsDays, setOffsetsDays] = useState<number[]>([7, 1]);

  const displayName = useMemo(() => fullName.trim().split(' ')[0] || "", [fullName]);
  const FOUNDER_EMAIL = "namanlohia02@gmail.com";
  const isFounder = (user?.email ?? "").toLowerCase() === FOUNDER_EMAIL.toLowerCase();

  const pinnedOrder: Card["key"][] = ["amex-platinum", "chase-sapphire-reserve", "capitalone-venture-x"];
  const [search, setSearch] = useState("");
  const [activeCardKey, setActiveCardKey] = useState<Card["key"]>("amex-platinum");
  const [savedCards, setSavedCards] = useState<string[]>([]);
  const [cardStartDates, setCardStartDates] = useState<Record<string, string>>({});
  const [used, setUsed] = useState<ToggleState>({});
  const [dontCare, setDontCare] = useState<ToggleState>({});
  const [remind, setRemind] = useState<ToggleState>({});
  const [dbWarning, setDbWarning] = useState<string | null>(null);
  const [hasCelebrated, setHasCelebrated] = useState<Record<string, boolean>>({});
  const [filterOpen, setFilterOpen] = useState(false);

  const feeBounds = useMemo(() => {
    const fees = CARDS.map(c => c.annualFee);
    return { min: Math.min(...fees), max: Math.max(...fees) };
  }, []);
  const [feeMin, setFeeMin] = useState(feeBounds.min);
  const [feeMax, setFeeMax] = useState(feeBounds.max);

  const activeCard = useMemo(() => CARDS.find(c => c.key === activeCardKey) ?? CARDS[0], [activeCardKey]);

  const creditsSorted = useMemo(() => {
    return activeCard.credits.slice().sort((a, b) => freqSort(a.frequency) - freqSort(b.frequency) || a.title.localeCompare(b.title));
  }, [activeCard]);

  const totals = useMemo(() => {
    let avail = 0, redeemed = 0;
    for (const c of creditsSorted) {
      const k = `${activeCard.key}:${c.id}`;
      if (!dontCare[k]) {
        const a = annualize(c.amount, c.frequency);
        avail += a;
        if (used[k]) redeemed += a;
      }
    }
    const pct = avail > 0 ? Math.min(100, Math.round((redeemed / avail) * 100)) : 0;
    return { avail, redeemed, pct };
  }, [creditsSorted, activeCard.key, dontCare, used]);

  const netValue = totals.redeemed - activeCard.annualFee;
  const isProfit = netValue > 0;

  // Confetti
  useEffect(() => {
    if (isProfit && !hasCelebrated[activeCard.key] && totals.redeemed > 0) {
      fireConfetti();
      setHasCelebrated(prev => ({ ...prev, [activeCard.key]: true }));
    }
  }, [totals.redeemed, activeCard.annualFee, activeCard.key, hasCelebrated, isProfit]);

  // Quiz
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizStep, setQuizStep] = useState<QuizStep>('intro');
  const [topCategories, setTopCategories] = useState<SpendCategory[]>([]);
  const [quiz, setQuiz] = useState<QuizInputs>({
    spend: { dining: 500, travel: 300, groceries: 400, gas: 100, online: 200, other: 500 },
    feeTolerance: 500,
    creditUtil: 0.75,
    welcomeBonus: true,
  });

  const quizResults = useMemo(() => {
    return CARDS.map(c => ({ card: c, ...scoreCard(c, quiz) })).sort((a, b) => b.score - a.score).slice(0, 3);
  }, [quiz]);

  const resetQuiz = useCallback(() => {
    setQuizStep('intro');
    setTopCategories([]);
    setQuiz({ spend: { dining: 500, travel: 300, groceries: 400, gas: 100, online: 200, other: 500 }, feeTolerance: 500, creditUtil: 0.75, welcomeBonus: true });
  }, []);

  // Auth init
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => { if (alive) setSession(data.session ?? null); });
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  // Load data
  const didLoad = useRef(false);
  useEffect(() => {
    if (!user) {
      setSavedCards([]); setCardStartDates({}); setUsed({}); setDontCare({}); setRemind({});
      setDbWarning(null); setFullName(""); setPhoneE164(""); setNotifEmail(true); setNotifSms(false);
      setSmsConsent(false); setOffsetsDays([7, 1]); didLoad.current = false;
      return;
    }
    if (didLoad.current) return;
    didLoad.current = true;

    (async () => {
      try {
        setDbWarning(null);
        const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
        if (prof) {
          setFullName(prof.full_name ?? "");
          setPhoneE164(prof.phone_e164 ?? "");
          setNotifEmail(prof.notif_email_enabled ?? true);
          setNotifSms(prof.notif_sms_enabled ?? false);
          setSmsConsent(prof.sms_consent ?? false);
          setOffsetsDays(prof.default_offsets_days ?? [7, 1]);
        }
        const { data: uc } = await supabase.from("user_cards").select("card_key, card_start_date").eq("user_id", user.id);
        const cards = (uc ?? []) as DbUserCard[];
        setSavedCards(cards.map(x => x.card_key));
        const starts: Record<string, string> = {};
        cards.forEach(r => { if (r.card_start_date) starts[r.card_key] = r.card_start_date; });
        setCardStartDates(starts);
        const { data: cs } = await supabase.from("credit_states").select("state_key, used, dont_care, remind").eq("user_id", user.id);
        const states = (cs ?? []) as DbCreditState[];
        const u: ToggleState = {}, dc: ToggleState = {}, rm: ToggleState = {};
        states.forEach(s => { u[s.state_key] = s.used; dc[s.state_key] = s.dont_care; rm[s.state_key] = s.remind; });
        setUsed(u); setDontCare(dc); setRemind(rm);
      } catch (e: any) {
        setDbWarning(e?.message ?? "Failed to load data");
      }
    })();
  }, [user]);

  // Save
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const queueSave = useCallback(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      if (!user) return;
      const rows = [...new Set([...Object.keys(used), ...Object.keys(dontCare), ...Object.keys(remind)])].map(k => ({
        user_id: user.id, state_key: k, used: !!used[k], dont_care: !!dontCare[k], remind: !!remind[k]
      }));
      if (rows.length) await supabase.from("credit_states").upsert(rows, { onConflict: "user_id,state_key" });
    }, 600);
  }, [user, used, dontCare, remind]);

  useEffect(() => { if (user) queueSave(); }, [used, dontCare, remind, user, queueSave]);

  // Actions
  async function notifyMe() {
    if (!user) { setAuthModalOpen(true); setAuthMode("signup"); return; }
    if (savedCards.includes(activeCard.key)) { setAuthMsg("Already saved!"); return; }
    if (!isFounder && savedCards.length >= 1) { setAuthMsg("Free: 1 card. Multi-card: $5 (coming soon)"); return; }
    const { error } = await supabase.from("user_cards").insert({ user_id: user.id, card_key: activeCard.key, card_start_date: null });
    if (error) { setAuthMsg(error.message); return; }
    setSavedCards(p => [...p, activeCard.key]);
    setAuthMsg("Saved! Now set your cardmember start date.");
  }

  async function updateStart(k: string, v: string) {
    setCardStartDates(p => ({ ...p, [k]: v }));
    if (user) await supabase.from("user_cards").update({ card_start_date: v || null }).eq("user_id", user.id).eq("card_key", k);
  }

  const toggle = (setter: React.Dispatch<React.SetStateAction<ToggleState>>) => (k: string) => setter(p => ({ ...p, [k]: !p[k] }));

  async function handleSignIn() {
    setAuthBusy(true); setAuthMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    setAuthBusy(false);
    if (error) setAuthMsg(error.message);
    else { setAuthModalOpen(false); setAuthEmail(""); setAuthPassword(""); }
  }

  async function handleSignUp() {
    setAuthBusy(true); setAuthMsg(null);
    const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
    if (error) { setAuthBusy(false); setAuthMsg(error.message); return; }
    if (data.user && authName.trim()) {
      await supabase.from("profiles").upsert({ user_id: data.user.id, full_name: authName.trim() }, { onConflict: "user_id" });
    }
    setAuthBusy(false);
    setAuthMsg("Check your email to confirm!");
  }

  async function handleReset() {
    setAuthBusy(true); setResetMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
    setAuthBusy(false);
    setResetMsg(error ? error.message : "Check your email for reset link.");
  }

  async function saveProfile() {
    if (!user) return;
    setProfileLoading(true); setProfileMsg(null);
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id, full_name: fullName || null, phone_e164: phoneE164 || null,
      notif_email_enabled: notifEmail, notif_sms_enabled: notifSms, sms_consent: smsConsent,
      default_offsets_days: normalizeOffsets(offsetsDays),
    }, { onConflict: "user_id" });
    setProfileLoading(false);
    setProfileMsg(error ? error.message : "Saved!");
  }

  // Expiring
  const expiringSoon = useMemo(() => {
    const startStr = cardStartDates[activeCard.key];
    if (!startStr) return [];
    const start = new Date(startStr + "T00:00:00");
    const now = new Date();
    const results: { credit: Credit; due: Date }[] = [];
    for (const c of creditsSorted) {
      const k = `${activeCard.key}:${c.id}`;
      if (!remind[k] || used[k] || dontCare[k]) continue;
      const due = nextResetDate(c, start, now);
      if (!due) continue;
      const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (diff >= 0 && diff <= 14) results.push({ credit: c, due });
    }
    return results.sort((a, b) => a.due.getTime() - b.due.getTime());
  }, [activeCard.key, cardStartDates, creditsSorted, remind, used, dontCare]);

  // Filter
  const baseFiltered = useMemo(() => CARDS.filter(c => c.annualFee >= feeMin && c.annualFee <= feeMax && (search.trim() === "" || c.name.toLowerCase().includes(search.toLowerCase()) || c.issuer.toLowerCase().includes(search.toLowerCase()))), [feeMin, feeMax, search]);
  const topPicks = useMemo(() => pinnedOrder.map(k => CARDS.find(c => c.key === k)).filter(Boolean) as Card[], []);
  const topPicksVisible = topPicks.some(c => baseFiltered.some(b => b.key === c.key));
  const tier3 = baseFiltered.filter(c => c.annualFee >= 500 && !pinnedOrder.includes(c.key));
  const tier2 = baseFiltered.filter(c => c.annualFee >= 250 && c.annualFee < 500 && !pinnedOrder.includes(c.key));
  const tier1 = baseFiltered.filter(c => c.annualFee < 250 && !pinnedOrder.includes(c.key));

  // Category info for quiz
  const catInfo: Record<SpendCategory, { e: string; n: string }> = {
    dining: { e: "🍽️", n: "Dining" }, travel: { e: "✈️", n: "Travel" }, groceries: { e: "🛒", n: "Groceries" },
    gas: { e: "⛽", n: "Gas" }, online: { e: "🛍️", n: "Online" }, other: { e: "💳", n: "Other" },
  };

  // Components
  const CardRow = ({ card, badge }: { card: Card; badge?: boolean }) => {
    const active = activeCard.key === card.key;
    return (
      <button onClick={() => setActiveCardKey(card.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition border-b border-white/5 last:border-b-0 ${active ? "bg-white/10" : "hover:bg-white/5"}`}>
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30">
          <Image src={card.logo} alt={card.name} fill className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium line-clamp-1">{card.name}</span>
            {badge && <span className="rounded-full bg-amber-400/15 border border-amber-300/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">Top</span>}
          </div>
          <div className="text-xs text-white/50">{card.issuer} • {fmt(card.annualFee)}</div>
        </div>
      </button>
    );
  };

  const Section = ({ title, cards }: { title: string; cards: Card[] }) => cards.length === 0 ? null : (
    <div className="border-b border-white/10 last:border-b-0">
      <div className="px-3 py-2 text-xs font-semibold text-white/50 uppercase tracking-wider">{title}</div>
      {cards.map(c => <CardRow key={c.key} card={c} />)}
    </div>
  );

  // Top Right
  const TopRight = (
    <div className="flex items-center gap-2">
      <button onClick={() => { setQuizOpen(true); resetQuiz(); }} className="flex items-center gap-1.5 rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-2 text-sm text-purple-200 hover:bg-purple-500/20 transition">
        <Icon.Sparkles className="h-4 w-4" /><span className="hidden sm:inline">Find Card</span>
      </button>
      {user ? (
        <>
          <button onClick={() => setSettingsOpen(true)} className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10" aria-label="Settings">
            <Icon.Gear className="h-5 w-5" />
          </button>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/90">{displayName || 'User'}</div>
          <button onClick={() => supabase.auth.signOut()} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 hover:bg-white/10">Sign out</button>
        </>
      ) : (
        <>
          <button onClick={() => { setAuthModalOpen(true); setAuthMode("signin"); }} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10">Sign in</button>
          <button onClick={() => { setAuthModalOpen(true); setAuthMode("signup"); }} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90">Sign up</button>
        </>
      )}
    </div>
  );

  // Auth Modal
  const AuthModal = !authModalOpen ? null : (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAuthModalOpen(false)} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
        <div className={surface("p-6")}>
          <div className="text-xl font-semibold">{authMode === "signin" ? "Welcome back" : authMode === "signup" ? "Create account" : "Reset password"}</div>
          {authMode === "reset" ? (
            <div className="mt-4">
              <input type="email" placeholder="Email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2.5 text-sm outline-none" />
              <button onClick={handleReset} disabled={authBusy} className="mt-3 w-full rounded-xl bg-white py-3 text-sm font-semibold text-black disabled:opacity-50">{authBusy ? "..." : "Send reset link"}</button>
              {resetMsg && <div className="mt-2 text-sm text-white/70">{resetMsg}</div>}
              <button onClick={() => setAuthMode("signin")} className="mt-3 text-sm text-white/50">← Back</button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {authMode === "signup" && <input type="text" placeholder="Name" value={authName} onChange={e => setAuthName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2.5 text-sm outline-none" />}
              <input type="email" placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2.5 text-sm outline-none" />
              <input type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2.5 text-sm outline-none" />
              <button onClick={authMode === "signin" ? handleSignIn : handleSignUp} disabled={authBusy} className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black disabled:opacity-50">{authBusy ? "..." : authMode === "signin" ? "Sign in" : "Create account"}</button>
              {authMsg && <div className="text-sm text-white/70">{authMsg}</div>}
              <div className="flex justify-between text-sm">
                <button onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")} className="text-white/50 hover:text-white/80">{authMode === "signin" ? "Create account" : "Sign in"}</button>
                {authMode === "signin" && <button onClick={() => setAuthMode("reset")} className="text-white/50 hover:text-white/80">Forgot?</button>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Settings Modal
  const SettingsModal = !settingsOpen ? null : (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
      <div className="absolute left-1/2 top-8 w-[92vw] max-w-lg -translate-x-1/2 max-h-[90vh] overflow-auto">
        <div className={surface("p-5")}>
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xl font-semibold">Settings</div>
              <div className="text-sm text-white/50 mt-1">{user?.email}</div>
            </div>
            <button onClick={() => setSettingsOpen(false)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10">Close</button>
          </div>
          <div className="mt-5 space-y-4">
            <div>
              <div className="text-sm font-semibold text-white/90">Display name</div>
              <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white/90">Phone (for SMS)</div>
              <input value={phoneE164} onChange={e => setPhoneE164(e.target.value)} placeholder="+15551234567" className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none" />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-white/90">Notifications</div>
              <label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={notifEmail} onChange={e => setNotifEmail(e.target.checked)} /> Email reminders</label>
              <label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={notifSms} onChange={e => setNotifSms(e.target.checked)} /> SMS reminders</label>
              {notifSms && <label className="flex items-center gap-2 text-sm text-white/70 ml-5"><input type="checkbox" checked={smsConsent} onChange={e => setSmsConsent(e.target.checked)} /> I consent to SMS from ClawBack</label>}
            </div>
            <div>
              <div className="text-sm font-semibold text-white/90">Reminder schedule (days before)</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {[1, 3, 5, 7, 10, 14].map(d => (
                  <button key={d} onClick={() => setOffsetsDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${offsetsDays.includes(d) ? "border-purple-400/30 bg-purple-500/20 text-purple-200" : "border-white/10 bg-white/5 text-white/60"}`}>{d}d</button>
                ))}
              </div>
              <div className="mt-1 text-xs text-white/40">Active: {normalizeOffsets(offsetsDays).join(", ")} days</div>
            </div>
            <button onClick={saveProfile} disabled={profileLoading} className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black disabled:opacity-50">{profileLoading ? "..." : "Save settings"}</button>
            {profileMsg && <div className="text-sm text-white/70">{profileMsg}</div>}
          </div>
        </div>
      </div>
    </div>
  );

  // Quiz Modal
  const QuizModal = !quizOpen ? null : (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setQuizOpen(false)} />
      <div className="absolute left-1/2 top-8 w-[92vw] max-w-xl -translate-x-1/2 max-h-[90vh] overflow-auto">
        <div className={surface("p-6")}>
          {quizStep === 'intro' && (
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center mb-4"><Icon.Sparkles className="h-7 w-7 text-purple-300" /></div>
              <h2 className="text-2xl font-bold">Looking for a new card?</h2>
              <p className="mt-2 text-white/60">2 quick questions → personalized recommendation</p>
              <div className="mt-6 space-y-3">
                <button onClick={() => setQuizStep('spending')} className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 py-3.5 font-semibold text-white">Yes, find me a card →</button>
                <button onClick={() => setQuizOpen(false)} className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-white/60">Not now</button>
              </div>
            </div>
          )}
          {quizStep === 'spending' && (
            <div>
              <button onClick={() => setQuizStep('intro')} className="text-sm text-white/50 mb-3">← Back</button>
              <h2 className="text-xl font-bold">Where do you spend most?</h2>
              <p className="text-sm text-white/60 mt-1">Pick your top 2-3 categories</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {(Object.keys(catInfo) as SpendCategory[]).map(cat => {
                  const sel = topCategories.includes(cat);
                  return (
                    <button key={cat} onClick={() => setTopCategories(p => sel ? p.filter(c => c !== cat) : p.length < 3 ? [...p, cat] : p)} className={`rounded-xl border p-3 text-left ${sel ? "border-purple-400/30 bg-purple-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                      <span className="text-lg">{catInfo[cat].e}</span>
                      <div className="mt-1 text-sm font-medium">{catInfo[cat].n}</div>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => { const ns = { ...quiz.spend }; topCategories.forEach(c => ns[c] = 800); setQuiz(p => ({ ...p, spend: ns })); setQuizStep('fee'); }} disabled={topCategories.length === 0} className="mt-5 w-full rounded-xl bg-white py-3 font-semibold text-black disabled:opacity-40">Continue →</button>
            </div>
          )}
          {quizStep === 'fee' && (
            <div>
              <button onClick={() => setQuizStep('spending')} className="text-sm text-white/50 mb-3">← Back</button>
              <h2 className="text-xl font-bold">Annual fee comfort?</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[{ l: "Low", v: 200, d: "<$200" }, { l: "Mid", v: 400, d: "$200-500" }, { l: "Premium", v: 700, d: "$500-700" }, { l: "Any", v: 1000, d: "$700+" }].map(o => (
                  <button key={o.v} onClick={() => setQuiz(p => ({ ...p, feeTolerance: o.v }))} className={`rounded-xl border p-3 text-left ${quiz.feeTolerance === o.v ? "border-purple-400/30 bg-purple-500/15" : "border-white/10 bg-white/5"}`}>
                    <div className="text-sm font-medium">{o.l}</div>
                    <div className="text-xs text-white/50">{o.d}</div>
                  </button>
                ))}
              </div>
              <button onClick={() => setQuizStep('results')} className="mt-5 w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 py-3 font-semibold text-white">Show recommendations →</button>
            </div>
          )}
          {quizStep === 'results' && (
            <div>
              <h2 className="text-xl font-bold">Your Top Matches</h2>
              <p className="text-sm text-white/60 mt-1">Based on {topCategories.map(c => catInfo[c].n).join(', ')}</p>
              <div className="mt-4 space-y-3">
                {quizResults.map((r, i) => (
                  <div key={r.card.key} className={`rounded-xl border p-4 ${i === 0 ? "border-amber-400/30 bg-amber-500/10" : "border-white/10 bg-[#0F1218]"}`}>
                    <div className="flex items-start gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30"><Image src={r.card.logo} alt={r.card.name} fill className="object-cover" /></div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            {i === 0 && <span className="inline-block mb-1 rounded-full bg-amber-400/20 border border-amber-400/30 px-2 py-0.5 text-[10px] font-semibold text-amber-200">🏆 Best</span>}
                            <div className="font-semibold">{r.card.name}</div>
                            <div className="text-xs text-white/50">{r.card.issuer} • {fmt(r.card.annualFee)}/yr</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-emerald-300">+{fmt(r.value)}</div>
                            <div className="text-[10px] text-white/50">est/yr</div>
                          </div>
                        </div>
                        <button onClick={() => { setActiveCardKey(r.card.key); setQuizOpen(false); }} className="mt-2 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/15">View card →</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={resetQuiz} className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm text-white/60">Start over</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // LEFT PANEL
  const LeftPanel = (
    <aside className="lg:col-span-4">
      <div className={surface("p-4")}>
        {/* Active Card Header */}
        <div className="border-b border-white/10 pb-4">
          <div className="text-[10px] uppercase tracking-wider text-purple-300 font-semibold mb-2">Active Card</div>
          <div className="flex items-start gap-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-purple-500/30 bg-black/30">
              <Image src={activeCard.logo} alt={activeCard.name} fill className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold leading-tight line-clamp-2">{activeCard.name}</div>
              <div className="mt-1 text-sm text-white/50">{activeCard.issuer} • {fmt(activeCard.annualFee)}/yr</div>
              {activeCard.signupBonusEstUsd && <div className="mt-1 text-xs text-amber-300">Welcome bonus: ~{fmt(activeCard.signupBonusEstUsd)}</div>}
            </div>
          </div>
        </div>

        {/* Your Cards */}
        <div className="mt-4">
          <div className="text-base font-semibold">Your Cards</div>
          <div className="text-xs text-white/50 mt-0.5">{savedCards.length} saved • {isFounder ? "Unlimited" : "Free: 1"}</div>
          {!user && <div className="mt-2 rounded-xl border border-white/10 bg-black/25 p-2.5 text-xs text-white/60">Sign up free to save cards + get reminders</div>}
          {dbWarning && <div className="mt-2 rounded-xl border border-amber-300/20 bg-amber-300/10 p-2.5 text-xs text-amber-200">{dbWarning}</div>}
          <div className="mt-2 space-y-2">
            {savedCards.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/25 p-2.5 text-xs text-white/50">No saved cards yet</div>
            ) : savedCards.map(k => {
              const card = CARDS.find(c => c.key === k);
              if (!card) return null;
              const start = cardStartDates[k] ?? "";
              return (
                <div key={k} className="rounded-xl border border-white/10 bg-black/25 p-3">
                  <div className="flex items-center gap-2">
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30"><Image src={card.logo} alt={card.name} fill className="object-cover" /></div>
                    <div className="text-sm font-medium line-clamp-1">{card.name}</div>
                  </div>
                  <div className="mt-2">
                    <div className="text-[10px] text-white/40 uppercase">Cardmember year start</div>
                    <input type="date" value={start} onChange={e => updateStart(k, e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs outline-none" disabled={!user} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Browse Cards */}
        <div className="mt-4">
          <div className="text-base font-semibold">Browse Cards</div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="mt-2 w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none placeholder:text-white/30" />
          
          {/* Collapsible Filter */}
          <button onClick={() => setFilterOpen(!filterOpen)} className="mt-2 flex items-center justify-between w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10">
            <span>Annual fee filter</span>
            <Icon.ChevronDown className={`h-4 w-4 transition ${filterOpen ? 'rotate-180' : ''}`} />
          </button>
          {filterOpen && (
            <div className="mt-2 rounded-xl border border-white/10 bg-[#0F1218] p-3">
              <div className="flex flex-wrap gap-2">
                {[{ l: "All", mn: feeBounds.min, mx: feeBounds.max }, { l: "$0-250", mn: 0, mx: 250 }, { l: "$250-500", mn: 250, mx: 500 }, { l: "$500+", mn: 500, mx: feeBounds.max }].map(f => (
                  <button key={f.l} onClick={() => { setFeeMin(f.mn); setFeeMax(f.mx); }} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${feeMin === f.mn && feeMax === f.mx ? "border-purple-400/30 bg-purple-500/20 text-purple-200" : "border-white/10 bg-white/5 text-white/60"}`}>{f.l}</button>
                ))}
              </div>
            </div>
          )}

          {/* Card List */}
          <div className="mt-3 overflow-auto rounded-xl border border-white/10 bg-[#0F1218] max-h-[35vh]">
            {topPicksVisible && (
              <div className="border-b border-white/10 bg-amber-400/5">
                <div className="px-3 py-2 text-xs font-semibold text-amber-200 uppercase tracking-wider flex items-center gap-1"><Icon.Star className="h-3 w-3" /> Top Picks</div>
                {topPicks.filter(c => baseFiltered.some(b => b.key === c.key)).map(c => <CardRow key={c.key} card={c} badge />)}
              </div>
            )}
            <Section title="$500+" cards={tier3} />
            <Section title="$250-500" cards={tier2} />
            <Section title="Under $250" cards={tier1} />
            {baseFiltered.length === 0 && <div className="p-3 text-sm text-white/50">No cards match</div>}
          </div>

          <button onClick={notifyMe} className="mt-3 w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-black hover:bg-white/90">{savedCards.includes(activeCard.key) ? "Saved ✓" : "Save this card"}</button>
          {authMsg && <div className="mt-2 text-xs text-white/60">{authMsg}</div>}
        </div>
      </div>
    </aside>
  );

  // MIDDLE PANEL - Credits
  const MiddlePanel = (
    <main className="lg:col-span-5">
      {/* At a Glance Row */}
      <div className={surface("p-4 mb-4")}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-base font-semibold">Credits</div>
          {isProfit && <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">🎉 Profitable!</span>}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-white/50">Redeemed</span>
            <span className="ml-2 font-semibold text-emerald-300">{fmt(totals.redeemed)}</span>
          </div>
          <div className="text-white/20">•</div>
          <div>
            <span className="text-white/50">Available</span>
            <span className="ml-2 font-semibold">{fmt(totals.avail)}</span>
          </div>
          <div className="text-white/20">•</div>
          <div>
            <span className="text-white/50">Net</span>
            <span className={`ml-2 font-semibold ${isProfit ? 'text-emerald-300' : 'text-red-300'}`}>{isProfit ? '+' : ''}{fmt(netValue)}</span>
          </div>
          <div className="text-white/20">•</div>
          <div>
            <span className="text-white/50">{totals.pct}% used</span>
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full rounded-full bg-black/30">
          <div className="h-1.5 rounded-full bg-emerald-400/80 transition-all" style={{ width: `${totals.pct}%` }} />
        </div>
      </div>

      {/* Credit List */}
      <div className={surface("p-4")}>
        <div className="space-y-2">
          {creditsSorted.map(c => {
            const k = `${activeCard.key}:${c.id}`;
            const isUsed = !!used[k], isDC = !!dontCare[k], isRem = !!remind[k];
            return (
              <div key={c.id} className={`rounded-xl border p-3 transition ${isDC ? "border-white/5 bg-black/20 opacity-50" : isUsed ? "border-emerald-400/20 bg-emerald-500/8" : "border-white/10 bg-[#0F1218]"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{c.title}</div>
                    <div className="text-xs text-white/50 mt-0.5">{freqLabel(c.frequency)} • {fmtFull(c.amount)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold">{fmt(annualize(c.amount, c.frequency))}</div>
                    <div className="text-[10px] text-white/40">/year</div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button onClick={() => toggle(setUsed)(k)} className={`rounded-full border px-2.5 py-1 text-[11px] font-medium flex items-center gap-1 ${isUsed ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-200" : "border-white/10 bg-white/5 text-white/60"}`}><Icon.Check className="h-3 w-3" />Used</button>
                  <button onClick={() => toggle(setDontCare)(k)} className={`rounded-full border px-2.5 py-1 text-[11px] font-medium flex items-center gap-1 ${isDC ? "border-slate-400/30 bg-slate-500/20 text-slate-200" : "border-white/10 bg-white/5 text-white/60"}`}><Icon.EyeOff className="h-3 w-3" />Skip</button>
                  <button onClick={() => toggle(setRemind)(k)} className={`rounded-full border px-2.5 py-1 text-[11px] font-medium flex items-center gap-1 ${isRem ? "border-sky-400/30 bg-sky-500/20 text-sky-200" : "border-white/10 bg-white/5 text-white/60"}`}><Icon.Bell className="h-3 w-3" />Remind</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );

  // RIGHT PANEL
  const RightPanel = (
    <aside className="lg:col-span-3 space-y-4">
      {/* Summary */}
      <div className={surface("p-4")}>
        <div className="text-base font-semibold mb-3">Summary</div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-white/50">Card</span><span className="font-medium">{activeCard.name}</span></div>
          <div className="flex justify-between"><span className="text-white/50">Annual fee</span><span className="text-red-300">{fmt(activeCard.annualFee)}</span></div>
          <div className="flex justify-between"><span className="text-white/50">Credits available</span><span>{fmt(totals.avail)}</span></div>
          <div className="flex justify-between"><span className="text-white/50">Redeemed</span><span className="text-emerald-300">{fmt(totals.redeemed)}</span></div>
          <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
            <span>Net value</span>
            <span className={isProfit ? "text-emerald-300" : "text-red-300"}>{isProfit ? "+" : ""}{fmt(netValue)}</span>
          </div>
        </div>
      </div>

      {/* Points / Rewards */}
      <div className={surface("p-4")}>
        <div className="text-base font-semibold mb-3">Points & Rewards</div>
        <div className="text-xs text-white/50 mb-2">{activeCard.pointsProgram.replace('_', ' ').toUpperCase()}</div>
        <div className="space-y-1.5">
          {activeCard.multipliers.map((m, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="rounded-full bg-purple-500/20 border border-purple-400/30 px-2 py-0.5 text-[11px] font-bold text-purple-200">{m.x}x</span>
              <span className="text-white/70">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expiring Soon */}
      <div className={surface("p-4 border-sky-400/15 bg-sky-500/5")}>
        <div className="text-base font-semibold mb-2">Expiring Soon</div>
        <div className="text-xs text-white/50 mb-3">Next 14 days</div>
        {!cardStartDates[activeCard.key] ? (
          <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-2.5 text-xs text-amber-200">Set cardmember start date in "Your Cards" to enable</div>
        ) : expiringSoon.length === 0 ? (
          <div className="text-sm text-white/50">No credits expiring with Remind on</div>
        ) : (
          <div className="space-y-2">
            {expiringSoon.map(x => (
              <div key={x.credit.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0F1218] p-2.5">
                <div>
                  <div className="text-sm font-medium">{x.credit.title}</div>
                  <div className="text-xs text-white/50">{fmtFull(x.credit.amount)}</div>
                </div>
                <div className="rounded-full border border-sky-300/20 bg-sky-300/10 px-2 py-0.5 text-[10px] text-sky-200">{formatDateShort(x.due)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reminders Status */}
      <div className={surface("p-4")}>
        <div className="text-base font-semibold mb-2">Reminders</div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${notifEmail ? "bg-emerald-400" : "bg-white/20"}`} />
            <span className="text-white/70">Email</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${notifSms && smsConsent ? "bg-emerald-400" : "bg-white/20"}`} />
            <span className="text-white/70">SMS</span>
          </div>
        </div>
        <div className="text-xs text-white/40 mt-2">Schedule: {normalizeOffsets(offsetsDays).join(", ")}d before</div>
      </div>
    </aside>
  );

  return (
    <div className="relative min-h-screen text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#070A12]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_20%_20%,rgba(88,101,242,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_40%_at_80%_30%,rgba(139,92,246,0.16),transparent_60%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <a href="/" className="text-2xl font-semibold hover:text-white/80 transition">ClawBack</a>
            <div className="text-sm text-white/50">Track credits. Get reminders. Save money.</div>
          </div>
          {TopRight}
        </div>

        <div className="mb-4 flex gap-2 lg:hidden">
          {[{ k: "cards", l: "Cards" }, { k: "credits", l: "Credits" }, { k: "insights", l: "Insights" }].map(t => (
            <button key={t.k} onClick={() => setMobileView(t.k as any)} className={`flex-1 rounded-full border px-3 py-2 text-sm font-semibold ${mobileView === t.k ? "border-white/20 bg-white/10" : "border-white/10 bg-white/5 text-white/60"}`}>{t.l}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className={`${mobileView === "cards" ? "block" : "hidden"} lg:block lg:col-span-4`}>{LeftPanel}</div>
          <div className={`${mobileView === "credits" ? "block" : "hidden"} lg:block lg:col-span-5`}>{MiddlePanel}</div>
          <div className={`${mobileView === "insights" ? "block" : "hidden"} lg:block lg:col-span-3`}>{RightPanel}</div>
        </div>
      </div>

      {AuthModal}
      {SettingsModal}
      {QuizModal}
    </div>
  );
}
