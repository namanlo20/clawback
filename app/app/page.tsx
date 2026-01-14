"use client";

import { useEffect, useMemo, useState } from "react";
import { CARDS, DEFAULT_POINT_VALUES_USD, type Card } from "../../data/cards";

type Modal =
  | null
  | { title: string; body: string; primaryText?: string; onPrimary?: () => void };

type Plan = "free" | "paid";

function money(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function clampPct(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

const FREQ_ORDER: Record<string, number> = {
  monthly: 1,
  quarterly: 2,
  semiannual: 3,
  annual: 4,
  "one-time": 5,
  every_4_years: 6,
  every_5_years: 7,
};

function capFirst(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function freqLabel(freq: string) {
  if (freq === "semiannual") return "Semiannual";
  if (freq === "one-time") return "One-time";
  if (freq === "every_4_years") return "Every 4 years";
  if (freq === "every_5_years") return "Every 5 years";
  return capFirst(freq); // Monthly, Quarterly, Annual
}

function renewLabel(renews?: { month: number; day: number }) {
  if (!renews?.month || !renews?.day) return null;
  const d = new Date(2026, renews.month - 1, renews.day);
  const mon = d.toLocaleString(undefined, { month: "short" });
  return `Renews ${mon} ${renews.day}`;
}

function sumCreditsAnnual(card: Card) {
  return (card.credits || []).reduce((s, c) => s + (c.amountAnnual || 0), 0);
}

function estimateWelcomeValueUSD(card: Card) {
  const offer = card.welcomeOffer;
  if (!offer) return null;

  const map = DEFAULT_POINT_VALUES_USD as Record<string, number | undefined>;
  const v = map[offer.currency];
  if (!v) return null;

  return Math.round(offer.amount * v);
}

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveLS(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

const LS = {
  loggedIn: "clawback_logged_in_mock",
  isFounder: "clawback_founder_mock",
  plan: "clawback_plan_mock",
  saved: "clawback_saved_cards",
  used: "clawback_used_by_credit",
  dontCare: "clawback_dontcare_by_credit",
  remind: "clawback_remind_by_credit",
};

// ✅ Top 3 pinned
const TOP_PICKS = ["amex_platinum", "chase_sapphire_reserve", "capitalone_venturex"];

export default function DashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [plan, setPlan] = useState<Plan>("free");

  const [query, setQuery] = useState("");
  const [activeKey, setActiveKey] = useState<string>(() => CARDS[0]?.key ?? "");

  const [savedKeys, setSavedKeys] = useState<string[]>([]);

  const [usedByCredit, setUsedByCredit] = useState<Record<string, boolean>>({});
  const [dontCareByCredit, setDontCareByCredit] = useState<Record<string, boolean>>({});
  const [remindByCredit, setRemindByCredit] = useState<Record<string, boolean>>({});

  const [modal, setModal] = useState<Modal>(null);

  useEffect(() => {
    setIsLoggedIn(loadLS<boolean>(LS.loggedIn, false));
    setIsFounder(loadLS<boolean>(LS.isFounder, false));
    setPlan(loadLS<Plan>(LS.plan, "free"));
    setSavedKeys(loadLS<string[]>(LS.saved, []));
    setUsedByCredit(loadLS<Record<string, boolean>>(LS.used, {}));
    setDontCareByCredit(loadLS<Record<string, boolean>>(LS.dontCare, {}));
    setRemindByCredit(loadLS<Record<string, boolean>>(LS.remind, {}));
  }, []);

  useEffect(() => saveLS(LS.loggedIn, isLoggedIn), [isLoggedIn]);
  useEffect(() => saveLS(LS.isFounder, isFounder), [isFounder]);
  useEffect(() => saveLS(LS.plan, plan), [plan]);
  useEffect(() => saveLS(LS.saved, savedKeys), [savedKeys]);
  useEffect(() => saveLS(LS.used, usedByCredit), [usedByCredit]);
  useEffect(() => saveLS(LS.dontCare, dontCareByCredit), [dontCareByCredit]);
  useEffect(() => saveLS(LS.remind, remindByCredit), [remindByCredit]);

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CARDS;

    return CARDS.filter((c) => {
      const hay = `${c.name} ${c.key}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  const activeCard = useMemo(() => {
    return CARDS.find((c) => c.key === activeKey) ?? CARDS[0];
  }, [activeKey]);

  const savedCards = useMemo(() => {
    const map = new Map(CARDS.map((c) => [c.key, c]));
    return savedKeys.map((k) => map.get(k)).filter(Boolean) as Card[];
  }, [savedKeys]);

  function toggleUsed(creditId: string) {
    setUsedByCredit((prev) => ({ ...prev, [creditId]: !prev[creditId] }));
  }

  function toggleDontCare(creditId: string) {
    setDontCareByCredit((prev) => {
      const next = { ...prev, [creditId]: !prev[creditId] };
      if (next[creditId]) {
        setUsedByCredit((u) => ({ ...u, [creditId]: false }));
        setRemindByCredit((r) => ({ ...r, [creditId]: false }));
      }
      return next;
    });
  }

  function toggleRemind(creditId: string) {
    setRemindByCredit((prev) => {
      const next = { ...prev, [creditId]: !prev[creditId] };
      // If you set remind, also ensure it's not used/don't-care
      if (next[creditId]) {
        setUsedByCredit((u) => ({ ...u, [creditId]: false }));
        setDontCareByCredit((d) => ({ ...d, [creditId]: false }));
      }
      return next;
    });
  }

  function addToDashboard(cardKey: string) {
    const already = savedKeys.includes(cardKey);
    if (already) return;

    if (!isLoggedIn && !isFounder) {
      setModal({
        title: "Login required",
        body: "To save cards and enable reminders, you need to log in (Supabase will handle this). For now, use Mock Login.",
        primaryText: "Mock Login",
        onPrimary: () => {
          setIsLoggedIn(true);
          setModal(null);
        },
      });
      return;
    }

    if (!isFounder && plan === "free" && savedKeys.length >= 1) {
      setModal({
        title: "Track multiple cards — $5 flat",
        body: "Free plan lets you save 1 card. Upgrade $5 (flat) to save multiple cards and get reminders for all of them.",
        primaryText: "Mock Upgrade ($5)",
        onPrimary: () => {
          setPlan("paid");
          setModal(null);
        },
      });
      return;
    }

    setSavedKeys((prev) => [...prev, cardKey]);
  }

  function removeFromDashboard(cardKey: string) {
    setSavedKeys((prev) => prev.filter((k) => k !== cardKey));
  }

  function calcProgressForCard(card: Card) {
    const caredCredits = (card.credits || []).filter((c) => !dontCareByCredit[c.id]);
    const total = caredCredits.reduce((s, c) => s + (c.amountAnnual || 0), 0);
    const used = caredCredits.reduce(
      (s, c) => s + (usedByCredit[c.id] ? c.amountAnnual || 0 : 0),
      0
    );
    const pct = total === 0 ? 0 : Math.round((used / total) * 100);
    return { total, used, pct: clampPct(pct) };
  }

  const activeProgress = activeCard
    ? calcProgressForCard(activeCard)
    : { total: 0, used: 0, pct: 0 };

  // Suggested “net value” (credits you care about minus annual fee)
  const activeNetValue = useMemo(() => {
    if (!activeCard) return 0;
    const caredTotal = (activeCard.credits || [])
      .filter((c) => !dontCareByCredit[c.id])
      .reduce((s, c) => s + (c.amountAnnual || 0), 0);
    return caredTotal - (activeCard.annualFee || 0);
  }, [activeCard, dontCareByCredit]);

  const totalAnnualFeesSelected = useMemo(() => {
    return savedCards.reduce((s, c) => s + (c.annualFee || 0), 0);
  }, [savedCards]);

  // Expiring soon (simple v1): only show credits marked Remind me,
  // excluding Used / Don't care. Sort by month/day.
  const expiringSoon = useMemo(() => {
    if (!activeCard) return [];
    return (activeCard.credits || [])
      .filter((c) => remindByCredit[c.id])
      .filter((c) => !usedByCredit[c.id] && !dontCareByCredit[c.id])
      .sort((a, b) => {
        const am = a.renews?.month ?? 99;
        const ad = a.renews?.day ?? 99;
        const bm = b.renews?.month ?? 99;
        const bd = b.renews?.day ?? 99;
        if (am !== bm) return am - bm;
        return ad - bd;
      });
  }, [activeCard, remindByCredit, usedByCredit, dontCareByCredit]);

  const topPickCards = useMemo(() => CARDS.filter((c) => TOP_PICKS.includes(c.key)), []);
  const nonTopPickCards = useMemo(() => CARDS.filter((c) => !TOP_PICKS.includes(c.key)), []);

  // ---------- UI ----------
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-zinc-950 p-6 shadow-2xl">
            <div className="text-lg font-semibold">{modal.title}</div>
            <div className="mt-2 text-sm text-white/70">{modal.body}</div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setModal(null)}
                className="rounded-2xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
              >
                Close
              </button>
              {modal.primaryText && modal.onPrimary && (
                <button
                  onClick={modal.onPrimary}
                  className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
                >
                  {modal.primaryText}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight">ClawBack</div>
            <div className="text-sm text-white/60">
              Track credits. Mark used. Never waste money again.{" "}
              <span className="text-white/50">No banking info or SSN required.</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLoggedIn((v) => !v)}
              className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/80 hover:bg-white/5"
              title="Mock login toggle (replace with Supabase)"
            >
              {isLoggedIn ? "Logged in (mock)" : "Login (mock)"}
            </button>
            <button
              onClick={() => setIsFounder((v) => !v)}
              className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/80 hover:bg-white/5"
              title="Mock founder bypass toggle"
            >
              {isFounder ? "Founder ✓" : "Founder off"}
            </button>
            <button
              onClick={() => setPlan((p) => (p === "free" ? "paid" : "free"))}
              className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/80 hover:bg-white/5"
              title="Mock plan toggle"
            >
              Plan: {plan === "free" ? "Free" : "Paid"}
            </button>
            <a
              href="/"
              className="ml-2 rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
            >
              ← Back
            </a>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr_360px]">
          {/* LEFT SIDEBAR */}
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold text-white/85">Choose your card</div>
            <div className="mt-2 text-xs text-white/60">
              Browse any card free. “Notify me” saves it to your dashboard.
            </div>

            {/* Top Picks */}
            <div className="mt-4">
              <div className="mb-2 text-xs font-semibold text-white/70">TOP PICKS</div>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                {topPickCards.map((c) => {
                  const isActive = c.key === activeKey;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setActiveKey(c.key)}
                      className={[
                        "w-full border-b border-white/10 px-4 py-3 text-left transition last:border-b-0",
                        isActive ? "bg-white/10" : "hover:bg-white/5",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        {c.logo ? (
                          <img src={c.logo} alt="" className="h-8 w-8 rounded-xl object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-xl bg-white/10" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate text-sm font-medium">{c.name}</div>
                            <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-semibold text-black">
                              Top
                            </span>
                          </div>
                          <div className="text-xs text-white/60">
                            Fee: ${money(c.annualFee)} • Credits: ${money(sumCreditsAnnual(c))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all cards..."
              className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
            />

            <div className="mt-4 max-h-[420px] overflow-auto rounded-2xl border border-white/10">
              {filteredCards
                .filter((c) => !TOP_PICKS.includes(c.key))
                .map((c) => {
                  const isActive = c.key === activeKey;
                  const isSaved = savedKeys.includes(c.key);
                  return (
                    <button
                      key={c.key}
                      onClick={() => setActiveKey(c.key)}
                      className={[
                        "w-full border-b border-white/10 px-4 py-3 text-left transition last:border-b-0",
                        isActive ? "bg-white/10" : "hover:bg-white/5",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        {c.logo ? (
                          <img src={c.logo} alt="" className="h-8 w-8 rounded-xl object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-xl bg-white/10" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate text-sm font-medium">{c.name}</div>
                            <div className="text-xs text-white/60">{isSaved ? "Saved ✓" : ""}</div>
                          </div>
                          <div className="text-xs text-white/60">
                            Fee: ${money(c.annualFee)} • Credits: ${money(sumCreditsAnnual(c))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}

              {filteredCards.length === 0 && (
                <div className="px-4 py-6 text-sm text-white/60">No cards match that search.</div>
              )}
            </div>

            <button
              onClick={() => addToDashboard(activeKey)}
              className="mt-4 w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90"
            >
              Notify me for this card
            </button>

            <div className="mt-3 text-xs text-white/55">
              {isFounder ? (
                <span className="text-emerald-300">Founder bypass: unlimited cards</span>
              ) : plan === "free" ? (
                <span>Free: save 1 card • Multi-card is $5 flat</span>
              ) : (
                <span className="text-emerald-300">Paid: save multiple cards</span>
              )}
            </div>
          </aside>

          {/* MIDDLE */}
          <section className="space-y-6">
            {/* TOP TRACKERS */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                <div className="text-xs text-white/70">Credits Redeemed (Active)</div>
                <div className="mt-1 text-2xl font-semibold">${money(activeProgress.used)}</div>
                <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-emerald-400"
                    style={{ width: `${activeProgress.pct}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-white/60">{activeProgress.pct}% used</div>
              </div>

              <div className="rounded-3xl border border-white/15 bg-white/5 p-5">
                <div className="text-xs text-white/60">Total Credits Available (Active)</div>
                <div className="mt-1 text-2xl font-semibold">${money(activeProgress.total)}</div>
                <div className="mt-1 text-xs text-white/50">excludes credits marked “Don’t care”</div>
              </div>

              <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-5">
                <div className="text-xs text-white/70">Annual Fee (Active)</div>
                <div className="mt-1 text-2xl font-semibold">${money(activeCard?.annualFee || 0)}</div>
                <div className="mt-1 text-xs text-white/50">later: pro-rate fee + net per month</div>
              </div>
            </div>

            {/* ACTIVE CARD PREVIEW */}
            {activeCard && (
              <div className="rounded-3xl border border-white/12 bg-gradient-to-b from-white/10 to-white/5 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {activeCard.logo ? (
                      <img
                        src={activeCard.logo}
                        alt=""
                        className="mt-1 h-10 w-10 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="mt-1 h-10 w-10 rounded-2xl bg-white/10" />
                    )}
                    <div>
                      <div className="text-xl font-semibold">{activeCard.name}</div>
                      <div className="mt-1 text-sm text-white/60">
                        Annual fee: ${money(activeCard.annualFee)} • Credits tracked: $
                        {money(sumCreditsAnnual(activeCard))}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-white/60">Status</div>
                    <div className="mt-1 text-sm">
                      {savedKeys.includes(activeCard.key) ? (
                        <span className="text-emerald-300">On dashboard ✓</span>
                      ) : (
                        <span className="text-white/50">Preview only</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Credits list */}
                <div className="mt-5">
                  <div className="text-sm font-semibold text-white/85">Credits</div>
                  <div className="mt-1 text-xs text-white/55">
                    Use <span className="text-white/80">Remind me</span> to show up in{" "}
                    <span className="text-white/80">Expiring soon</span>.
                  </div>

                  <div className="mt-3 space-y-3">
                    {[...(activeCard.credits || [])]
                      .sort((a, b) => (FREQ_ORDER[a.frequency] ?? 999) - (FREQ_ORDER[b.frequency] ?? 999))
                      .map((credit) => {
                        const used = !!usedByCredit[credit.id];
                        const dc = !!dontCareByCredit[credit.id];
                        const rm = !!remindByCredit[credit.id];

                        const rLabel = renewLabel(credit.renews);

                        return (
                          <div
                            key={credit.id}
                            className={[
                              "rounded-2xl border p-4 transition",
                              "hover:border-white/20 hover:bg-white/5", // ✅ hover glow feel
                              dc
                                ? "border-white/10 bg-white/5 opacity-70"
                                : used
                                ? "border-emerald-400/25 bg-emerald-400/10"
                                : rm
                                ? "border-yellow-400/25 bg-yellow-400/10"
                                : "border-white/10 bg-black/25",
                            ].join(" ")}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="text-sm font-medium">{credit.name}</div>
                                <div className="mt-1 text-xs text-white/60">
                                  {freqLabel(credit.frequency)} • ${money(credit.amount)}
                                  {rLabel ? ` • ${rLabel}` : ""}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="hidden sm:block rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/70">
                                  Annualized:{" "}
                                  <span className="text-white/90">${money(credit.amountAnnual || 0)}</span>
                                </div>

                                <button
                                  onClick={() => toggleRemind(credit.id)}
                                  disabled={dc}
                                  className={[
                                    "rounded-xl border px-3 py-2 text-xs",
                                    dc
                                      ? "cursor-not-allowed border-white/10 text-white/40"
                                      : rm
                                      ? "border-yellow-400/30 bg-yellow-400/15"
                                      : "border-white/10 hover:bg-white/5",
                                  ].join(" ")}
                                >
                                  {rm ? "Remind ✓" : "Remind me"}
                                </button>

                                <button
                                  onClick={() => toggleDontCare(credit.id)}
                                  className={[
                                    "rounded-xl border px-3 py-2 text-xs",
                                    dc
                                      ? "border-white/15 bg-white/10"
                                      : "border-white/10 hover:bg-white/5",
                                  ].join(" ")}
                                >
                                  {dc ? "Don’t care ✓" : "Don’t care"}
                                </button>

                                <button
                                  onClick={() => toggleUsed(credit.id)}
                                  disabled={dc}
                                  className={[
                                    "rounded-xl border px-3 py-2 text-xs",
                                    dc
                                      ? "cursor-not-allowed border-white/10 text-white/40"
                                      : used
                                      ? "border-emerald-400/30 bg-emerald-400/15"
                                      : "border-white/10 hover:bg-white/5",
                                  ].join(" ")}
                                >
                                  {used ? "Used ✓" : "Mark used"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  <div className="mt-4 text-xs text-white/50">
                    “Don’t care” removes a credit from progress + reminders.
                  </div>
                </div>
              </div>
            )}

            {/* SAVED DASHBOARD CARDS LIST */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white/85">Your Dashboard Cards</div>
                  <div className="mt-1 text-xs text-white/60">
                    Saved cards are what you’ll get reminders for (once Supabase + SMS/email is added).
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-white/60">Annual Fees (Saved)</div>
                  <div className="mt-1 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-semibold">
                    ${money(totalAnnualFeesSelected)}
                  </div>
                </div>
              </div>

              {savedCards.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-white/60">
                  No saved cards yet. Pick a card on the left and click “Notify me for this card”.
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {savedCards.map((card) => {
                    const prog = calcProgressForCard(card);
                    const welcomeUSD = estimateWelcomeValueUSD(card);

                    return (
                      <div key={card.key} className="rounded-3xl border border-white/12 bg-black/25 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            {card.logo ? (
                              <img src={card.logo} alt="" className="mt-1 h-9 w-9 rounded-2xl object-cover" />
                            ) : (
                              <div className="mt-1 h-9 w-9 rounded-2xl bg-white/10" />
                            )}
                            <div>
                              <div className="text-lg font-semibold">{card.name}</div>
                              <div className="mt-1 text-xs text-white/60">
                                Fee: ${money(card.annualFee)} • Credits (care): ${money(prog.total)}
                              </div>
                              {card.welcomeOffer && (
                                <div className="mt-2 text-xs text-white/60">
                                  Bonus: {card.welcomeOffer.amount.toLocaleString()} {card.welcomeOffer.currency} •{" "}
                                  {card.welcomeOffer.spend}
                                  {welcomeUSD ? (
                                    <>
                                      {" "}
                                      • Est: <span className="text-white/85">${money(welcomeUSD)}</span>
                                    </>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <button
                              onClick={() => removeFromDashboard(card.key)}
                              className="rounded-2xl border border-white/15 px-3 py-2 text-xs hover:bg-white/5"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-white/60">
                            <span>Credits redeemed</span>
                            <span>
                              ${money(prog.used)} / ${money(prog.total)} ({prog.pct}%)
                            </span>
                          </div>
                          <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                            <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${prog.pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 text-xs text-white/50">
                Next: Supabase login + persistence, then reminder scheduling (email + SMS).
              </div>
            </div>
          </section>

          {/* RIGHT */}
          <aside className="space-y-6">
            {/* Expiring Soon */}
            <div className="rounded-3xl border border-white/12 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white/90">Expiring soon</div>
                <div className="text-xs text-white/50">Active card</div>
              </div>
              <div className="mt-2 text-xs text-white/60">
                Shows credits marked Remind me, excluding Used / Don’t care.
              </div>

              {expiringSoon.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
                  Nothing queued. Set “Remind me” on a credit to see it here.
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {expiringSoon.slice(0, 6).map((c) => (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-yellow-400/15 bg-yellow-400/10 px-4 py-3"
                    >
                      <div className="text-sm text-white/90">{c.name}</div>
                      <div className="mt-1 text-xs text-white/70">
                        {freqLabel(c.frequency)} • ${money(c.amount)} • {renewLabel(c.renews) ?? "Renew date TBD"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ✅ Net Value (high impact) */}
            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
              <div className="text-xs text-white/70">Net value (Active)</div>
              <div className="mt-1 text-2xl font-semibold">
                {activeNetValue >= 0 ? "+" : "−"}${money(Math.abs(activeNetValue))}
              </div>
              <div className="mt-1 text-xs text-white/60">
                (Credits you care about) − (Annual fee)
              </div>
            </div>

            {/* ✅ Yellow multipliers box */}
            <div className="rounded-3xl border border-yellow-400/25 bg-yellow-400/10 p-5">
              <div className="text-sm font-semibold text-white/90">Points / cash back</div>
              <div className="mt-1 text-xs text-white/70">
                Category multipliers for this card.
              </div>

              <div className="mt-4 space-y-2">
                {(activeCard?.multipliers || []).map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-2xl border border-yellow-400/15 bg-black/30 px-4 py-3"
                  >
                    <div className="text-sm text-white/85">{m.label}</div>
                    <div className="rounded-xl bg-yellow-400 px-3 py-1 text-xs font-semibold text-black">
                      {m.rate}
                    </div>
                  </div>
                ))}

                {(activeCard?.multipliers || []).length === 0 && (
                  <div className="rounded-2xl border border-yellow-400/15 bg-black/30 p-4 text-sm text-white/70">
                    No multipliers added yet.
                  </div>
                )}
              </div>

              <div className="mt-3 text-xs text-white/60">
                Next: add “Estimated yearly points” once you collect spend inputs.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
