// app/app/page.tsx
// ClawBack Dashboard - routes to /app
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient, type Session, type User } from "@supabase/supabase-js";
import { CARDS, PINNED_TOP_3, pointValueUsd, getWelcomeBonusDisplay, type Card, type Credit, type CreditFrequency, type SpendCategory, type CardCategory } from "../../data/cards";

// ============ SUPABASE ============
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============ CONFETTI ============
function fireConfetti() {
  const colors = ['#10b981', '#34d399', '#fbbf24', '#f59e0b', '#8b5cf6', '#a78bfa'];
  for (let i = 0; i < 60; i++) {
    setTimeout(() => {
      const p = document.createElement('div');
      p.style.cssText = `position:fixed;left:${Math.random()*100}vw;top:${Math.random()*40}vh;width:${Math.random()*8+4}px;height:${Math.random()*8+4}px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:${Math.random()>0.5?'50%':'2px'};pointer-events:none;z-index:9999;animation:confetti-fall 3s ease-out forwards;`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 3000);
    }, i * 25);
  }
}
if (typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.textContent = `@keyframes confetti-fall{0%{opacity:1;transform:translateY(0) rotate(0deg)}100%{opacity:0;transform:translateY(100vh) rotate(720deg)}}`;
  document.head.appendChild(s);
}

// ============ TYPES ============
type ToggleState = Record<string, boolean>;
type Tab = 'dashboard' | 'quiz' | 'coming-soon' | 'settings';

// ============ HELPERS ============
const fmt = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtFull = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const clampDay = (y: number, m: number, d: number) => Math.min(d, new Date(y, m + 1, 0).getDate());

function annualize(amt: number, freq: CreditFrequency): number {
  // Consistent basis: all amounts annualized for comparison
  const m: Record<CreditFrequency, number> = { monthly: 12, quarterly: 4, semiannual: 2, annual: 1, every4years: 0.25, every5years: 0.2, onetime: 1 };
  return amt * m[freq];
}

function freqLabel(f: CreditFrequency): string {
  const m: Record<CreditFrequency, string> = { monthly: "Monthly", quarterly: "Quarterly", semiannual: "Semiannual", annual: "Annual", every4years: "Every 4 yrs", every5years: "Every 5 yrs", onetime: "One-time" };
  return m[f];
}

const freqSort = (f: CreditFrequency) => ["monthly", "quarterly", "semiannual", "annual", "every4years", "every5years", "onetime"].indexOf(f);
const surface = (extra = "") => `rounded-2xl border border-white/10 bg-[#0C0F15]/90 backdrop-blur-md ${extra}`;
const formatDateShort = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

// Next reset date calculation
function nextResetDate(credit: Credit, cardStart: Date, now: Date): Date | null {
  if (credit.frequency === "onetime") return null;
  
  const make = (y: number, m: number, d: number) => new Date(y, m, clampDay(y, m, d), 0, 0, 0, 0);
  const sm = cardStart.getMonth(), sd = cardStart.getDate();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (credit.frequency === "monthly") {
    // Monthly: reset on the same day each month
    let cand = make(now.getFullYear(), now.getMonth(), sd);
    if (cand <= today) {
      const nm = now.getMonth() + 1;
      cand = make(now.getFullYear() + Math.floor(nm / 12), nm % 12, sd);
    }
    return cand;
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

  // Quarterly, semiannual, annual
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

const normalizeOffsets = (arr: number[]) => [...new Set(arr.map(Number).filter(x => Number.isFinite(x) && x > 0 && x <= 60))].sort((a, b) => b - a).slice(0, 5) || [7, 1];

// Pro localStorage helpers
const getIsPro = () => typeof localStorage !== 'undefined' && localStorage.getItem('clawback_isPro') === 'true';
const setIsPro = () => { if (typeof localStorage !== 'undefined') localStorage.setItem('clawback_isPro', 'true'); };

// ============ QUIZ TYPES ============
type QuizData = {
  diningSpend: number;
  travelSpend: number;
  travelFreq: string;
  feeTolerance: string;
  usesDelivery: boolean;
  preference: string;
  ecosystem: string;
};

function scoreCardQuiz(card: Card, q: QuizData) {
  const pv = pointValueUsd(card.pointsProgram);
  const util = 0.5; // Conservative 50% credit utilization for quiz
  
  // Rewards value
  const dining = q.diningSpend * 12 * (card.earnRates.dining ?? card.earnRates.other ?? 1) * pv;
  const travel = q.travelSpend * 12 * (card.earnRates.travel ?? card.earnRates.other ?? 1) * pv;
  
  // Credits value
  const credits = card.creditsTrackedAnnualized * util;
  
  // Fee tolerance penalty
  const feeTol = q.feeTolerance === "0-250" ? 250 : q.feeTolerance === "250-500" ? 500 : 1000;
  const penalty = card.annualFee > feeTol ? (card.annualFee - feeTol) * 1.2 : 0;
  
  // Ecosystem boost/penalty
  let ecoBoost = 0;
  if (q.ecosystem === "chase" && card.pointsProgram === "chase_ur") ecoBoost = 200;
  if (q.ecosystem === "amex" && (card.pointsProgram === "amex_mr" || card.issuer === "American Express")) ecoBoost = 200;
  if (q.ecosystem === "cap1" && card.pointsProgram === "cap1_miles") ecoBoost = 200;
  if (q.ecosystem === "citi" && card.pointsProgram === "citi_typ") ecoBoost = 200;
  if (q.ecosystem === "avoid-amex" && card.issuer === "American Express") return { score: -9999, value: 0, breakdown: [] };
  
  const value = dining + travel + credits - card.annualFee + ecoBoost;
  const breakdown = [
    `Rewards: ${fmt(dining + travel)}`,
    `Credits: ${fmt(credits)}`,
    `Fee: -${fmt(card.annualFee)}`,
  ];
  
  return { score: value - penalty, value, breakdown };
}

// ============ MAIN COMPONENT ============
export default function AppDashboardPage() {
  // ============ STATE ============
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [mobileView, setMobileView] = useState<"cards" | "credits" | "insights">("credits");
  const [proEnabled, setProEnabled] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Auth state
  const [session, setSession] = useState<Session | null>(null);
  const user: User | null = session?.user ?? null;
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMsg, setAuthMsg] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "reset">("signin");

  // Profile/Settings state
  const [fullName, setFullName] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [offsetsDays, setOffsetsDays] = useState<number[]>([7, 1]);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const displayName = useMemo(() => fullName.trim().split(' ')[0] || "", [fullName]);
  const FOUNDER = "namanlohia02@gmail.com";
  const isFounder = (user?.email ?? "").toLowerCase() === FOUNDER.toLowerCase();

  // Card state
  const [search, setSearch] = useState("");
  const [activeCardKey, setActiveCardKey] = useState<Card["key"]>("amex-platinum");
  const [savedCards, setSavedCards] = useState<string[]>([]);
  const [cardStartDates, setCardStartDates] = useState<Record<string, string>>({});
  const [used, setUsed] = useState<ToggleState>({});
  const [dontCare, setDontCare] = useState<ToggleState>({});
  const [remind, setRemind] = useState<ToggleState>({});
  const [hasCelebrated, setHasCelebrated] = useState<Record<string, boolean>>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [feeDefenseUtil, setFeeDefenseUtil] = useState(0.5);

  const feeBounds = useMemo(() => ({ min: Math.min(...CARDS.map(c => c.annualFee)), max: Math.max(...CARDS.map(c => c.annualFee)) }), []);
  const [feeMin, setFeeMin] = useState(feeBounds.min);
  const [feeMax, setFeeMax] = useState(feeBounds.max);

  const activeCard = useMemo(() => CARDS.find(c => c.key === activeCardKey) ?? CARDS[0], [activeCardKey]);
  const creditsSorted = useMemo(() => activeCard.credits.slice().sort((a, b) => freqSort(a.frequency) - freqSort(b.frequency) || a.title.localeCompare(b.title)), [activeCard]);

  // Totals - annualized basis for captured/available
  const totals = useMemo(() => {
    let avail = 0, captured = 0;
    for (const c of creditsSorted) {
      const k = `${activeCard.key}:${c.id}`;
      if (!dontCare[k]) {
        const a = annualize(c.amount, c.frequency);
        avail += a;
        if (used[k]) captured += a;
      }
    }
    return { avail, captured, pct: avail > 0 ? Math.min(100, Math.round((captured / avail) * 100)) : 0 };
  }, [creditsSorted, activeCard.key, dontCare, used]);

  // Fee Defense calculation
  const feeDefense = useMemo(() => {
    const creditsVal = activeCard.creditsTrackedAnnualized * feeDefenseUtil;
    const net = creditsVal - activeCard.annualFee;
    const breakEven = activeCard.creditsTrackedAnnualized > 0 ? Math.round((activeCard.annualFee / activeCard.creditsTrackedAnnualized) * 100) : 100;
    return { creditsVal, net, breakEven };
  }, [activeCard, feeDefenseUtil]);

  const isProfit = totals.captured > activeCard.annualFee;

  // Confetti trigger
  useEffect(() => {
    if (isProfit && !hasCelebrated[activeCard.key] && totals.captured > 0) {
      fireConfetti();
      setHasCelebrated(p => ({ ...p, [activeCard.key]: true }));
    }
  }, [totals.captured, activeCard.key, hasCelebrated, isProfit]);

  // Pro check on mount
  useEffect(() => { setProEnabled(getIsPro()); }, []);

  // Quiz state
  const [quizStep, setQuizStep] = useState(0);
  const [quiz, setQuiz] = useState<QuizData>({
    diningSpend: 400, travelSpend: 300, travelFreq: "2-4", feeTolerance: "250-500", usesDelivery: true, preference: "maximize", ecosystem: "any"
  });
  const quizResults = useMemo(() => {
    return CARDS.map(c => ({ card: c, ...scoreCardQuiz(c, quiz) })).filter(r => r.score > -9000).sort((a, b) => b.score - a.score).slice(0, 3);
  }, [quiz]);

  // ============ AUTH & DATA LOADING ============
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const didLoad = useRef(false);
  useEffect(() => {
    if (!user) {
      setSavedCards([]); setCardStartDates({}); setUsed({}); setDontCare({}); setRemind({});
      setFullName(""); setPhoneE164(""); setNotifEmail(true); setNotifSms(false); setSmsConsent(false); setOffsetsDays([7, 1]);
      didLoad.current = false;
      return;
    }
    if (didLoad.current) return;
    didLoad.current = true;
    (async () => {
      const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (prof) {
        setFullName(prof.full_name ?? ""); setPhoneE164(prof.phone_e164 ?? "");
        setNotifEmail(prof.notif_email_enabled ?? true); setNotifSms(prof.notif_sms_enabled ?? false);
        setSmsConsent(prof.sms_consent ?? false); setOffsetsDays(prof.default_offsets_days ?? [7, 1]);
      }
      const { data: uc } = await supabase.from("user_cards").select("card_key, card_start_date").eq("user_id", user.id);
      if (uc) {
        setSavedCards(uc.map((x: any) => x.card_key));
        const starts: Record<string, string> = {};
        uc.forEach((r: any) => { if (r.card_start_date) starts[r.card_key] = r.card_start_date; });
        setCardStartDates(starts);
      }
      const { data: cs } = await supabase.from("credit_states").select("state_key, used, dont_care, remind").eq("user_id", user.id);
      if (cs) {
        const u: ToggleState = {}, dc: ToggleState = {}, rm: ToggleState = {};
        cs.forEach((s: any) => { u[s.state_key] = s.used; dc[s.state_key] = s.dont_care; rm[s.state_key] = s.remind; });
        setUsed(u); setDontCare(dc); setRemind(rm);
      }
    })();
  }, [user]);

  // Save toggles
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

  // ============ ACTIONS ============
  async function saveCard() {
    if (!user) { setAuthModalOpen(true); setAuthMode("signup"); return; }
    if (savedCards.includes(activeCard.key)) { showToast("Already saved!"); return; }
    // Gate: free users can only save 1 card
    if (!proEnabled && !isFounder && savedCards.length >= 1) { setUpgradeOpen(true); return; }
    await supabase.from("user_cards").insert({ user_id: user.id, card_key: activeCard.key, card_start_date: null });
    setSavedCards(p => [...p, activeCard.key]);
    showToast("Card saved!");
  }

  async function updateStartDate(k: string, v: string) {
    // Gate: Expiring Soon requires Pro
    if (!proEnabled && !isFounder) { setUpgradeOpen(true); return; }
    setCardStartDates(p => ({ ...p, [k]: v }));
    if (user) await supabase.from("user_cards").update({ card_start_date: v || null }).eq("user_id", user.id).eq("card_key", k);
  }

  const toggle = (setter: React.Dispatch<React.SetStateAction<ToggleState>>) => (k: string) => setter(p => ({ ...p, [k]: !p[k] }));

  async function handleAuth() {
    setAuthBusy(true); setAuthMsg(null);
    if (authMode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) setAuthMsg(error.message); else { setAuthModalOpen(false); setAuthEmail(""); setAuthPassword(""); }
    } else if (authMode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      if (error) setAuthMsg(error.message);
      else {
        if (data.user && authName) await supabase.from("profiles").upsert({ user_id: data.user.id, full_name: authName }, { onConflict: "user_id" });
        setAuthMsg("Check email to confirm!");
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail);
      setAuthMsg(error ? error.message : "Check email for reset link.");
    }
    setAuthBusy(false);
  }

  async function saveProfile() {
    if (!user) return;
    // Gate: custom offsets require Pro
    if (!proEnabled && !isFounder && (offsetsDays.length > 2 || !offsetsDays.includes(7) || !offsetsDays.includes(1))) {
      setUpgradeOpen(true); return;
    }
    setProfileMsg(null);
    await supabase.from("profiles").upsert({
      user_id: user.id, full_name: fullName || null, phone_e164: phoneE164 || null,
      notif_email_enabled: notifEmail, notif_sms_enabled: notifSms, sms_consent: smsConsent, default_offsets_days: normalizeOffsets(offsetsDays),
    }, { onConflict: "user_id" });
    setProfileMsg("Settings saved!");
  }

  function exportCSV() {
    // Gate: CSV export requires Pro
    if (!proEnabled && !isFounder) { setUpgradeOpen(true); return; }
    const rows = [["Card", "Credit", "Frequency", "Amount", "Annualized", "Remind", "Used", "DontCare", "NextReset"]];
    const startStr = cardStartDates[activeCard.key];
    const start = startStr ? new Date(startStr + "T00:00:00") : null;
    const now = new Date();
    creditsSorted.forEach(c => {
      const k = `${activeCard.key}:${c.id}`;
      const reset = start ? nextResetDate(c, start, now) : null;
      rows.push([activeCard.name, c.title, c.frequency, c.amount.toString(), annualize(c.amount, c.frequency).toString(), remind[k] ? "Y" : "N", used[k] ? "Y" : "N", dontCare[k] ? "Y" : "N", reset ? reset.toISOString().slice(0, 10) : ""]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `clawback-${activeCard.key}.csv`; a.click();
    showToast("CSV downloaded!");
  }

  function handleUpgrade() {
    setIsPro();
    setProEnabled(true);
    setUpgradeOpen(false);
    showToast("🎉 Pro enabled! Enjoy unlimited features.");
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // ============ EXPIRING SOON ============
  const { expiringSoon, next7Days } = useMemo(() => {
    const startStr = cardStartDates[activeCard.key];
    if (!startStr) return { expiringSoon: [], next7Days: [] };
    const start = new Date(startStr + "T00:00:00");
    const now = new Date();
    const all: { credit: Credit; due: Date; daysLeft: number }[] = [];
    for (const c of creditsSorted) {
      const k = `${activeCard.key}:${c.id}`;
      // Inclusion rules: remind=true, used=false, dontCare=false
      if (!remind[k] || used[k] || dontCare[k]) continue;
      const due = nextResetDate(c, start, now);
      if (!due) continue;
      const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft >= 0 && daysLeft <= 14) all.push({ credit: c, due, daysLeft });
    }
    all.sort((a, b) => a.due.getTime() - b.due.getTime());
    return { 
      expiringSoon: all, 
      next7Days: all.filter(x => x.daysLeft <= 7).slice(0, 5) 
    };
  }, [activeCard.key, cardStartDates, creditsSorted, remind, used, dontCare]);

  // ============ CARD FILTERING ============
  const baseFiltered = useMemo(() => CARDS.filter(c => c.annualFee >= feeMin && c.annualFee <= feeMax && (search === "" || c.name.toLowerCase().includes(search.toLowerCase()) || c.issuer.toLowerCase().includes(search.toLowerCase()))), [feeMin, feeMax, search]);

  // Organize by tier and category
  const cardsByTierCategory = useMemo(() => {
    const tiers: Record<string, Record<CardCategory, Card[]>> = {
      tier3: { popular: [], hotel: [], airline: [], other: [] },
      tier2: { popular: [], hotel: [], airline: [], other: [] },
      tier1: { popular: [], hotel: [], airline: [], other: [] },
    };
    baseFiltered.forEach(c => {
      const tier = c.annualFee >= 500 ? "tier3" : c.annualFee >= 250 ? "tier2" : "tier1";
      tiers[tier][c.category].push(c);
    });
    // Sort alphabetically within each category
    Object.values(tiers).forEach(cats => Object.values(cats).forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name))));
    // Pin top 3 in tier3.popular
    const pinned = PINNED_TOP_3.map(k => tiers.tier3.popular.find(c => c.key === k)).filter(Boolean) as Card[];
    tiers.tier3.popular = [...pinned, ...tiers.tier3.popular.filter(c => !PINNED_TOP_3.includes(c.key))];
    return tiers;
  }, [baseFiltered]);

  // ============ UI COMPONENTS ============
  const CardRow = ({ card, showBadge }: { card: Card; showBadge?: boolean }) => {
    const active = activeCard.key === card.key;
    const isPinned = PINNED_TOP_3.includes(card.key);
    const bonusDisplay = getWelcomeBonusDisplay(card);
    return (
      <button onClick={() => setActiveCardKey(card.key)} className={`w-full flex items-center gap-4 px-5 py-4 text-left transition border-b border-white/5 last:border-b-0 ${active ? "bg-white/10" : "hover:bg-white/5"}`}>
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">
          <Image src={card.logo} alt={card.name} fill className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{card.name}</span>
            {showBadge && isPinned && <span className="rounded-full bg-amber-400/15 border border-amber-300/20 px-2 py-0.5 text-[10px] font-semibold text-amber-200">⭐ Top Pick</span>}
          </div>
          <div className="text-xs text-white/50 mt-1">{card.issuer} • {fmt(card.annualFee)}/yr</div>
          {bonusDisplay && <div className="text-[11px] text-emerald-400 mt-1">Welcome ≈ {bonusDisplay}</div>}
        </div>
      </button>
    );
  };

  const CategorySection = ({ title, cards, showBadge }: { title: string; cards: Card[]; showBadge?: boolean }) => cards.length === 0 ? null : (
    <div className="border-b border-white/5 last:border-b-0">
      <div className="px-5 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider bg-white/[0.02]">{title}</div>
      {cards.map(c => <CardRow key={c.key} card={c} showBadge={showBadge} />)}
    </div>
  );

  const TierSection = ({ tier, label, cards }: { tier: string; label: string; cards: Record<CardCategory, Card[]> }) => {
    const hasCards = Object.values(cards).some(arr => arr.length > 0);
    if (!hasCards) return null;
    return (
      <div className="border-b border-white/10 last:border-b-0">
        <div className="px-5 py-4 bg-gradient-to-r from-white/5 to-transparent">
          <div className="text-base font-semibold">{label}</div>
        </div>
        <CategorySection title="Popular Premium" cards={cards.popular} showBadge={tier === "tier3"} />
        <CategorySection title="Hotel Cards" cards={cards.hotel} />
        <CategorySection title="Airline Cards" cards={cards.airline} />
        <CategorySection title="Other Cards" cards={cards.other} />
      </div>
    );
  };

  // ============ NAV TABS ============
  const NavTabs = (
    <div className="flex items-center gap-1 bg-white/5 rounded-full p-1">
      {[{ k: 'dashboard', l: 'Dashboard' }, { k: 'quiz', l: 'Quiz' }, { k: 'coming-soon', l: 'Coming Soon' }, { k: 'settings', l: 'Settings' }].map(t => (
        <button key={t.k} onClick={() => setActiveTab(t.k as Tab)} className={`px-5 py-2.5 rounded-full text-sm font-medium transition ${activeTab === t.k ? "bg-white text-black shadow-lg" : "text-white/70 hover:text-white"}`}>{t.l}</button>
      ))}
    </div>
  );

  // ============ DASHBOARD CONTENT ============
  const DashboardContent = (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* LEFT - Cards */}
      <aside className={`${mobileView === "cards" ? "block" : "hidden"} lg:block lg:col-span-4`}>
        <div className={surface("p-6")}>
          {/* Active Card Header */}
          <div className="border-b border-white/10 pb-6 mb-6">
            <div className="text-xs uppercase tracking-wider text-purple-400 font-semibold mb-4">Active Card</div>
            <div className="flex items-start gap-5">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-purple-500/40 bg-black/30 shadow-lg shadow-purple-500/10">
                <Image src={activeCard.logo} alt={activeCard.name} fill className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xl font-bold leading-tight">{activeCard.name}</div>
                <div className="text-sm text-white/50 mt-2">{activeCard.issuer} • {fmt(activeCard.annualFee)}/yr</div>
                {activeCard.welcomeBonus && (
                  <div className="mt-3 text-sm text-emerald-400">
                    Welcome bonus ≈ {getWelcomeBonusDisplay(activeCard)}
                    <span className="text-white/40 text-xs ml-1">(est., offers vary)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Your Cards */}
          <div className="mb-6">
            <div className="text-lg font-semibold mb-4">Your Cards</div>
            {!user && <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/60 mb-4">Sign up free to save cards + get reminders</div>}
            <div className="space-y-4">
              {savedCards.length === 0 ? (
                <div className="text-sm text-white/40">No saved cards yet</div>
              ) : savedCards.map(k => {
                const card = CARDS.find(c => c.key === k);
                if (!card) return null;
                return (
                  <div key={k} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10"><Image src={card.logo} alt={card.name} fill className="object-cover" /></div>
                      <span className="text-sm font-semibold">{card.name}</span>
                    </div>
                    <div>
                      <div className="text-xs text-white/40 mb-2">Cardmember year start date</div>
                      <input type="date" value={cardStartDates[k] ?? ""} onChange={e => updateStartDate(k, e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-purple-500/50 transition" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Browse Cards */}
          <div>
            <div className="text-lg font-semibold mb-4">Browse Cards</div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cards..." className="w-full rounded-xl border border-white/10 bg-[#0A0D12] px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-purple-500/50 transition mb-4" />
            
            <button onClick={() => setFilterOpen(!filterOpen)} className="flex items-center justify-between w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 hover:bg-white/10 transition mb-4">
              <span>Annual fee filter</span>
              <svg className={`h-4 w-4 transition ${filterOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {filterOpen && (
              <div className="rounded-xl border border-white/10 bg-[#0A0D12] p-4 mb-4 flex flex-wrap gap-2">
                {[{ l: "All", mn: feeBounds.min, mx: feeBounds.max }, { l: "$0-250", mn: 0, mx: 250 }, { l: "$250-500", mn: 250, mx: 500 }, { l: "$500+", mn: 500, mx: feeBounds.max }].map(f => (
                  <button key={f.l} onClick={() => { setFeeMin(f.mn); setFeeMax(f.mx); }} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${feeMin === f.mn && feeMax === f.mx ? "border-purple-400/30 bg-purple-500/20 text-purple-200" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"}`}>{f.l}</button>
                ))}
              </div>
            )}

            <div className="overflow-auto rounded-xl border border-white/10 bg-[#0A0D12] max-h-[50vh]">
              <TierSection tier="tier3" label="Tier 3: $500+" cards={cardsByTierCategory.tier3} />
              <TierSection tier="tier2" label="Tier 2: $250–500" cards={cardsByTierCategory.tier2} />
              <TierSection tier="tier1" label="Tier 1: Under $250" cards={cardsByTierCategory.tier1} />
              {baseFiltered.length === 0 && <div className="p-5 text-sm text-white/50">No cards match your search</div>}
            </div>

            <button onClick={saveCard} className="mt-5 w-full rounded-xl bg-white py-3.5 text-sm font-semibold text-black hover:bg-white/90 transition shadow-lg shadow-white/5">{savedCards.includes(activeCard.key) ? "✓ Saved" : "Save this card"}</button>
          </div>
        </div>
      </aside>

      {/* MIDDLE - Credits */}
      <main className={`${mobileView === "credits" ? "block" : "hidden"} lg:block lg:col-span-5`}>
        {/* At a Glance Bar */}
        <div className={surface("p-6 mb-6")}>
          <div className="flex items-center justify-between mb-5">
            <div className="text-lg font-semibold">Credits</div>
            <div className="flex items-center gap-3">
              {isProfit && <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-semibold text-emerald-300">🎉 Profitable!</span>}
              <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60 hover:bg-white/10 transition">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                CSV
              </button>
            </div>
          </div>
          
          {/* At a Glance Row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm mb-5">
            <div><span className="text-white/50">Captured</span> <span className="ml-2 font-bold text-lg text-emerald-300">{fmt(totals.captured)}</span></div>
            <div className="text-white/20">•</div>
            <div><span className="text-white/50">Available</span> <span className="ml-2 font-bold text-lg">{fmt(totals.avail)}</span></div>
            <div className="text-white/20">•</div>
            <div><span className="text-white/50">Fee</span> <span className="ml-2 font-semibold text-red-300">{fmt(activeCard.annualFee)}</span></div>
            <div className="text-white/20">•</div>
            <div><span className="text-white/50">{totals.pct}% used</span></div>
          </div>
          
          <div className="h-2.5 w-full rounded-full bg-black/30">
            <div className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all" style={{ width: `${totals.pct}%` }} />
          </div>
        </div>

        {/* Credit List */}
        <div className={surface("p-6")}>
          <div className="space-y-4">
            {creditsSorted.map(c => {
              const k = `${activeCard.key}:${c.id}`;
              const isUsed = !!used[k], isDC = !!dontCare[k], isRem = !!remind[k];
              return (
                <div key={c.id} className={`rounded-xl border p-5 transition ${isDC ? "border-white/5 bg-black/20 opacity-50" : isUsed ? "border-emerald-400/20 bg-emerald-500/8" : "border-white/10 bg-[#0A0D12]"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-base font-semibold">{c.title}</div>
                      <div className="text-sm text-white/50 mt-1">{freqLabel(c.frequency)} • {fmtFull(c.amount)}</div>
                      {c.notes && <div className="text-xs text-white/40 mt-1">{c.notes}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold">{fmt(annualize(c.amount, c.frequency))}</div>
                      <div className="text-xs text-white/40">/year</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => toggle(setUsed)(k)} className={`rounded-full border px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition ${isUsed ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-200" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"}`}>
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Used
                    </button>
                    <button onClick={() => toggle(setDontCare)(k)} className={`rounded-full border px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition ${isDC ? "border-slate-400/30 bg-slate-500/20 text-slate-200" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"}`}>
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18M10.6 10.6a3 3 0 004.24 4.24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                      Skip
                    </button>
                    <button onClick={() => toggle(setRemind)(k)} className={`rounded-full border px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition ${isRem ? "border-sky-400/30 bg-sky-500/20 text-sky-200" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"}`}>
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><path d="M15 17H9m10-2V11a7 7 0 10-14 0v4l-2 2h18l-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Remind
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* RIGHT - Insights */}
      <aside className={`${mobileView === "insights" ? "block" : "hidden"} lg:block lg:col-span-3 space-y-6`}>
        {/* My Savings Ring */}
        <div className={surface("p-6")}>
          <div className="text-lg font-semibold mb-5">My Savings</div>
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-white/10" />
                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-emerald-400" strokeLinecap="round" strokeDasharray={`${totals.pct * 2.51} 251`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-emerald-300">{totals.pct}%</div>
            </div>
            <div>
              <div className="text-sm"><span className="text-white/50">Captured:</span> <span className="font-bold text-emerald-300 text-lg">{fmt(totals.captured)}</span></div>
              <div className="text-sm mt-2"><span className="text-white/50">Remaining:</span> <span className="font-semibold text-lg">{fmt(totals.avail - totals.captured)}</span></div>
            </div>
          </div>
        </div>

        {/* Fee Defense */}
        <div className={surface("p-6")}>
          <div className="text-lg font-semibold mb-4">Fee Defense</div>
          <div className="text-sm text-white/60 mb-4">Break-even at <span className="font-bold text-white text-lg">{feeDefense.breakEven}%</span> credit usage</div>
          <div className="flex gap-2 mb-5">
            {[0.25, 0.5, 0.75].map(u => (
              <button key={u} onClick={() => setFeeDefenseUtil(u)} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${feeDefenseUtil === u ? "border-purple-400/30 bg-purple-500/20 text-purple-200" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"}`}>{u * 100}%</button>
            ))}
          </div>
          <div className="text-sm space-y-2">
            <div className="flex justify-between"><span className="text-white/50">Credits value</span><span className="font-semibold">{fmt(feeDefense.creditsVal)}</span></div>
            <div className="flex justify-between"><span className="text-white/50">Annual fee</span><span className="text-red-300">-{fmt(activeCard.annualFee)}</span></div>
            <div className="flex justify-between pt-3 border-t border-white/10 text-base font-bold"><span>Net</span><span className={feeDefense.net >= 0 ? "text-emerald-300" : "text-red-300"}>{feeDefense.net >= 0 ? "+" : ""}{fmt(feeDefense.net)}</span></div>
          </div>
        </div>

        {/* Points / Rewards */}
        <div className={surface("p-6")}>
          <div className="text-lg font-semibold mb-4">Points & Rewards</div>
          <div className="text-xs text-white/40 uppercase tracking-wider mb-4">{activeCard.pointsProgram.replace('_', ' ')}</div>
          <div className="space-y-3">
            {activeCard.multipliers.map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="rounded-full bg-purple-500/20 border border-purple-400/30 px-3 py-1 text-sm font-bold text-purple-200 min-w-[48px] text-center">{m.x}x</span>
                <span className="text-sm text-white/70">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Next 7 Days */}
        {next7Days.length > 0 && (
          <div className={surface("p-6 border-amber-400/20 bg-amber-500/5")}>
            <div className="flex items-center gap-2 text-lg font-semibold mb-4">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              Next 7 Days
            </div>
            <div className="space-y-3">
              {next7Days.map(x => (
                <div key={x.credit.id} className="flex items-center justify-between text-sm">
                  <span className="text-white/80">{x.credit.title}</span>
                  <span className="text-amber-300 text-xs font-medium">{formatDateShort(x.due)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expiring Soon */}
        <div className={surface("p-6 border-sky-400/15 bg-sky-500/5")}>
          <div className="text-lg font-semibold mb-4">Expiring Soon</div>
          {!cardStartDates[activeCard.key] ? (
            <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-200">
              Add cardmember year start date in "Your Cards" to enable Expiring Soon.
            </div>
          ) : expiringSoon.length === 0 ? (
            <div className="text-sm text-white/50">No credits expiring in next 14 days</div>
          ) : (
            <div className="space-y-3">
              {expiringSoon.slice(0, 5).map(x => (
                <div key={x.credit.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0A0D12] p-4">
                  <div>
                    <div className="text-sm font-semibold">{x.credit.title}</div>
                    <div className="text-xs text-white/50">{fmtFull(x.credit.amount)}</div>
                  </div>
                  <div className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs text-sky-200">{formatDateShort(x.due)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reminders Status */}
        <div className={surface("p-6")}>
          <div className="text-lg font-semibold mb-4">Reminders</div>
          <div className="flex items-center gap-5 text-sm mb-3">
            <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${notifEmail ? "bg-emerald-400" : "bg-white/20"}`} /><span className="text-white/70">Email</span></div>
            <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${notifSms && smsConsent ? "bg-emerald-400" : "bg-white/20"}`} /><span className="text-white/70">SMS</span></div>
          </div>
          <div className="text-xs text-white/40">Schedule: {normalizeOffsets(offsetsDays).join(", ")}d before reset</div>
        </div>

        {/* Trust */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 text-center">
          <div className="flex items-center justify-center gap-2 text-emerald-400 mb-3">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            <span className="text-xs font-semibold">Your data is safe</span>
          </div>
          <div className="text-xs text-white/40 leading-relaxed">No bank logins. No SSN. No credit score access. Ever.<br/>We only store your selected cards + reminder preferences.</div>
        </div>
      </aside>
    </div>
  );

  // ============ QUIZ CONTENT ============
  const quizQuestions = [
    { q: "What's your monthly dining spend?", type: "number", key: "diningSpend", placeholder: "e.g. 400" },
    { q: "What's your monthly travel spend?", type: "number", key: "travelSpend", placeholder: "e.g. 300" },
    { q: "How often do you travel per year?", type: "select", key: "travelFreq", options: [{ v: "0-1", l: "0-1 trips" }, { v: "2-4", l: "2-4 trips" }, { v: "5-10", l: "5-10 trips" }, { v: "10+", l: "10+ trips" }] },
    { q: "What's your annual fee tolerance?", type: "select", key: "feeTolerance", options: [{ v: "0-250", l: "$0–250/year" }, { v: "250-500", l: "$250–500/year" }, { v: "500+", l: "$500+/year" }] },
    { q: "Do you use Uber / DoorDash / Instacart?", type: "bool", key: "usesDelivery" },
    { q: "What's your optimization preference?", type: "select", key: "preference", options: [{ v: "simple", l: "Keep it simple" }, { v: "maximize", l: "Maximize value" }] },
    { q: "Preferred points ecosystem?", type: "select", key: "ecosystem", options: [{ v: "any", l: "Open to any" }, { v: "chase", l: "Prefer Chase" }, { v: "amex", l: "Prefer Amex" }, { v: "cap1", l: "Prefer Capital One" }, { v: "citi", l: "Prefer Citi" }, { v: "avoid-amex", l: "Avoid Amex (acceptance)" }] },
  ];

  const QuizContent = (
    <div className="max-w-2xl mx-auto">
      <div className={surface("p-8")}>
        {quizStep < quizQuestions.length ? (
          <>
            <div className="text-xs text-white/40 mb-2">Question {quizStep + 1} of {quizQuestions.length}</div>
            <div className="h-1.5 bg-white/10 rounded-full mb-8"><div className="h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all" style={{ width: `${((quizStep + 1) / quizQuestions.length) * 100}%` }} /></div>
            <div className="text-2xl font-bold mb-8">{quizQuestions[quizStep].q}</div>
            {quizQuestions[quizStep].type === "number" && (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                <input type="number" value={(quiz as any)[quizQuestions[quizStep].key]} onChange={e => setQuiz(p => ({ ...p, [quizQuestions[quizStep].key]: Number(e.target.value) }))} className="w-full rounded-xl border border-white/10 bg-[#0A0D12] pl-8 pr-4 py-4 text-xl outline-none focus:border-purple-500/50" placeholder={quizQuestions[quizStep].placeholder} />
              </div>
            )}
            {quizQuestions[quizStep].type === "select" && (
              <div className="grid grid-cols-2 gap-4">
                {quizQuestions[quizStep].options?.map(o => (
                  <button key={o.v} onClick={() => setQuiz(p => ({ ...p, [quizQuestions[quizStep].key]: o.v }))} className={`rounded-xl border p-5 text-left transition ${(quiz as any)[quizQuestions[quizStep].key] === o.v ? "border-purple-400/40 bg-purple-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>{o.l}</button>
                ))}
              </div>
            )}
            {quizQuestions[quizStep].type === "bool" && (
              <div className="flex gap-4">
                <button onClick={() => setQuiz(p => ({ ...p, [quizQuestions[quizStep].key]: true }))} className={`flex-1 rounded-xl border p-5 text-lg font-medium ${(quiz as any)[quizQuestions[quizStep].key] === true ? "border-purple-400/40 bg-purple-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>Yes</button>
                <button onClick={() => setQuiz(p => ({ ...p, [quizQuestions[quizStep].key]: false }))} className={`flex-1 rounded-xl border p-5 text-lg font-medium ${(quiz as any)[quizQuestions[quizStep].key] === false ? "border-purple-400/40 bg-purple-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>No</button>
              </div>
            )}
            <div className="flex gap-4 mt-8">
              {quizStep > 0 && <button onClick={() => setQuizStep(s => s - 1)} className="rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-medium hover:bg-white/10">Back</button>}
              <button onClick={() => setQuizStep(s => s + 1)} className="flex-1 rounded-xl bg-white py-4 text-sm font-semibold text-black hover:bg-white/90">Next</button>
            </div>
          </>
        ) : (
          <>
            <div className="text-2xl font-bold mb-8">Your Top Card Matches</div>
            <div className="space-y-5">
              {quizResults.map((r, i) => (
                <div key={r.card.key} className={`rounded-xl border p-6 ${i === 0 ? "border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-transparent" : "border-white/10 bg-[#0A0D12]"}`}>
                  <div className="flex items-start gap-5">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10"><Image src={r.card.logo} alt={r.card.name} fill className="object-cover" /></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          {i === 0 && <span className="inline-block mb-2 rounded-full bg-amber-400/20 border border-amber-400/30 px-3 py-1 text-xs font-semibold text-amber-200">🏆 Best Match</span>}
                          <div className="text-xl font-bold">{r.card.name}</div>
                          <div className="text-sm text-white/50 mt-1">{r.card.issuer} • {fmt(r.card.annualFee)}/yr</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-emerald-300">+{fmt(r.value)}</div>
                          <div className="text-xs text-white/40">est. annual value</div>
                        </div>
                      </div>
                      <button onClick={() => { setActiveCardKey(r.card.key); setActiveTab('dashboard'); }} className="mt-4 rounded-lg border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-medium hover:bg-white/15 transition">View card →</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setQuizStep(0)} className="mt-8 w-full rounded-xl border border-white/10 bg-white/5 py-4 text-sm text-white/60 hover:bg-white/10">Start over</button>
          </>
        )}
      </div>
    </div>
  );

  // ============ COMING SOON CONTENT ============
  const ComingSoonContent = (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className="text-3xl font-bold mb-3">Coming Soon</div>
        <div className="text-white/50">Features we're building to help you capture even more value</div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {[
          { icon: "📷", title: "Receipt Scan", desc: "Snap a photo of your statement → auto-mark credits as Used. No more manual tracking." },
          { icon: "💳", title: "Best Card Now", desc: "At a restaurant or hotel? We'll tell you which card to use for maximum points." },
          { icon: "✈️", title: "Airport Mode", desc: "See your lounge access + travel benefits in one tap. Perfect for travel day." },
          { icon: "📧", title: "Email Forward", desc: "Forward confirmation emails → we detect credits posted automatically." },
          { icon: "🔔", title: "Smart Reminders", desc: "\"Your Uber credit expires tomorrow — here's what to order.\" Actionable alerts." },
          { icon: "📊", title: "Annual Report", desc: "See exactly how much you saved (and left on the table) at year-end." },
        ].map(item => (
          <div key={item.title} className={surface("p-6 hover:bg-white/[0.03] transition")}>
            <div className="text-3xl mb-4">{item.icon}</div>
            <div className="text-lg font-semibold mb-2">{item.title}</div>
            <div className="text-sm text-white/50 leading-relaxed">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ============ SETTINGS CONTENT ============
  const SettingsContent = (
    <div className="max-w-lg mx-auto">
      <div className={surface("p-8")}>
        <div className="text-2xl font-bold mb-8">Settings</div>
        <div className="space-y-6">
          <div>
            <div className="text-sm font-semibold mb-3">Display name</div>
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" className="w-full rounded-xl border border-white/10 bg-[#0A0D12] px-4 py-3.5 text-sm outline-none focus:border-purple-500/50" />
          </div>
          <div>
            <div className="text-sm font-semibold mb-3">Phone (for SMS reminders)</div>
            <input value={phoneE164} onChange={e => setPhoneE164(e.target.value)} placeholder="+15551234567" className="w-full rounded-xl border border-white/10 bg-[#0A0D12] px-4 py-3.5 text-sm outline-none focus:border-purple-500/50" />
          </div>
          <div className="space-y-4">
            <div className="text-sm font-semibold">Notifications</div>
            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={notifEmail} onChange={e => setNotifEmail(e.target.checked)} className="w-5 h-5 rounded accent-purple-500" /><span className="text-sm text-white/80">Email reminders (default ON)</span></label>
            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={notifSms} onChange={e => setNotifSms(e.target.checked)} className="w-5 h-5 rounded accent-purple-500" /><span className="text-sm text-white/80">SMS reminders (requires phone)</span></label>
            {notifSms && (
              <label className="flex items-center gap-3 cursor-pointer ml-8"><input type="checkbox" checked={smsConsent} onChange={e => setSmsConsent(e.target.checked)} className="w-5 h-5 rounded accent-purple-500" /><span className="text-sm text-white/80">I consent to receive SMS from ClawBack</span></label>
            )}
          </div>
          <div>
            <div className="text-sm font-semibold mb-3">Reminder schedule (days before reset)</div>
            <div className="flex flex-wrap gap-2">
              {[1, 3, 5, 7, 10, 14].map(d => (
                <button key={d} onClick={() => setOffsetsDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])} className={`rounded-full border px-5 py-2.5 text-sm font-medium transition ${offsetsDays.includes(d) ? "border-purple-400/30 bg-purple-500/20 text-purple-200" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"}`}>{d}d</button>
              ))}
            </div>
            <div className="mt-3 text-xs text-white/40">Active: {normalizeOffsets(offsetsDays).join(", ")} days before</div>
          </div>
          <button onClick={saveProfile} className="w-full rounded-xl bg-white py-4 text-sm font-semibold text-black hover:bg-white/90">Save settings</button>
          {profileMsg && <div className="text-sm text-emerald-400 text-center">{profileMsg}</div>}
        </div>
      </div>
    </div>
  );

  // ============ MODALS ============
  const AuthModal = !authModalOpen ? null : (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setAuthModalOpen(false)} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
        <div className={surface("p-8")}>
          <div className="text-2xl font-bold mb-6">{authMode === "signin" ? "Welcome back" : authMode === "signup" ? "Create account" : "Reset password"}</div>
          <div className="space-y-4">
            {authMode === "signup" && <input type="text" placeholder="Name" value={authName} onChange={e => setAuthName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0A0D12] px-4 py-3.5 text-sm outline-none" />}
            <input type="email" placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0A0D12] px-4 py-3.5 text-sm outline-none" />
            {authMode !== "reset" && <input type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0A0D12] px-4 py-3.5 text-sm outline-none" />}
            <button onClick={handleAuth} disabled={authBusy} className="w-full rounded-xl bg-white py-4 text-sm font-semibold text-black disabled:opacity-50">{authBusy ? "..." : authMode === "signin" ? "Sign in" : authMode === "signup" ? "Create account" : "Send reset link"}</button>
            {authMsg && <div className="text-sm text-white/70">{authMsg}</div>}
            <div className="flex justify-between text-sm">
              <button onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")} className="text-white/50 hover:text-white">{authMode === "signin" ? "Create account" : "Sign in"}</button>
              {authMode !== "reset" && <button onClick={() => setAuthMode("reset")} className="text-white/50 hover:text-white">Forgot?</button>}
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-white/40">
            No bank logins. No SSN. No credit score access. Ever.
          </div>
        </div>
      </div>
    </div>
  );

  const UpgradeModal = !upgradeOpen ? null : (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setUpgradeOpen(false)} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
        <div className={surface("p-8 text-center")}>
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30">
            <svg className="h-10 w-10 text-black" viewBox="0 0 24 24" fill="currentColor"><path d="M2 8l4 12h12l4-12-5 4-5-8-5 8-5-4z"/></svg>
          </div>
          <div className="text-2xl font-bold mb-2">Unlock Pro Lifetime</div>
          <ul className="text-left space-y-3 my-8">
            {["Track unlimited cards", "Expiring Soon alerts (real reset dates)", "Custom reminder schedule", "Export credits + reminders (CSV)"].map(f => (
              <li key={f} className="flex items-center gap-3 text-sm"><svg className="h-5 w-5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>{f}</li>
            ))}
          </ul>
          <div className="text-4xl font-bold mb-2">$9.99</div>
          <div className="text-sm text-white/50 mb-8">one-time payment</div>
          <button onClick={handleUpgrade} className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 py-4 text-sm font-bold text-black shadow-lg shadow-amber-500/20 hover:opacity-90 mb-4">Upgrade for $9.99</button>
          <button onClick={() => setUpgradeOpen(false)} className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 text-sm text-white/60 hover:bg-white/10">Not now</button>
          <div className="mt-6 text-xs text-white/40">No subscriptions. No bank connections.</div>
        </div>
      </div>
    </div>
  );

  const Toast = !toast ? null : (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-medium text-white shadow-lg">{toast}</div>
    </div>
  );

  // ============ RENDER ============
  return (
    <div className="relative min-h-screen text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050709]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_25%_15%,rgba(88,101,242,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_75%_25%,rgba(139,92,246,0.10),transparent_60%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-10">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logos/clawback-logo.png" alt="ClawBack" width={40} height={40} className="rounded-xl" />
            <span className="text-2xl font-bold tracking-tight">ClawBack</span>
          </Link>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {user && NavTabs}
            <div className="flex items-center gap-4">
              {proEnabled && <span className="rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-1.5 text-xs font-bold text-black shadow-lg shadow-amber-500/20">PRO Lifetime</span>}
              {user ? (
                <>
                  <div className="text-sm font-medium text-white/90">{displayName || 'User'}</div>
                  <button onClick={() => supabase.auth.signOut()} className="text-sm text-white/50 hover:text-white">Sign out</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setAuthModalOpen(true); setAuthMode("signin"); }} className="text-sm text-white/70 hover:text-white">Sign in</button>
                  <button onClick={() => { setAuthModalOpen(true); setAuthMode("signup"); }} className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90">Sign up</button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile tabs for dashboard */}
        {activeTab === 'dashboard' && (
          <div className="flex gap-2 mb-8 lg:hidden">
            {[{ k: "cards", l: "Cards" }, { k: "credits", l: "Credits" }, { k: "insights", l: "Insights" }].map(t => (
              <button key={t.k} onClick={() => setMobileView(t.k as any)} className={`flex-1 rounded-full border px-4 py-3 text-sm font-semibold transition ${mobileView === t.k ? "border-white/20 bg-white/10" : "border-white/10 bg-white/5 text-white/60"}`}>{t.l}</button>
            ))}
          </div>
        )}

        {/* Content */}
        {activeTab === 'dashboard' && DashboardContent}
        {activeTab === 'quiz' && QuizContent}
        {activeTab === 'coming-soon' && ComingSoonContent}
        {activeTab === 'settings' && SettingsContent}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 text-xs text-white/40">
            <div className="flex items-center gap-3">
              <Image src="/logos/clawback-logo.png" alt="ClawBack" width={20} height={20} className="rounded-lg" />
              <span>© 2026 ClawBack</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              <span>No bank logins. No SSN. We only store your card selections.</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="/privacy" className="hover:text-white/70 transition">Privacy</a>
              <a href="/terms" className="hover:text-white/70 transition">Terms</a>
              <a href="mailto:hello@clawback.app" className="hover:text-white/70 transition">Contact</a>
            </div>
          </div>
        </footer>
      </div>

      {AuthModal}
      {UpgradeModal}
      {Toast}
    </div>
  );
}
