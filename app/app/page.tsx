"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CARDS, DEFAULT_POINT_VALUES_USD, type Card, type Credit } from "../../data/cards";

type Modal =
  | null
  | { title: string; body: string; primaryText?: string; onPrimary?: () => void };

type Plan = "free" | "paid";

const LS = {
  loggedIn: "clawback_logged_in_mock",
  isFounder: "clawback_founder_mock",
  plan: "clawback_plan_mock",
  saved: "clawback_saved_cards",
  used: "clawback_used_by_credit",
  dontCare: "clawback_dontcare_by_credit",
  remind: "clawback_remind_by_credit",
};

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

function money(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  if (Math.abs(v) >= 1000) return Math.round(v).toLocaleString();
  if (v % 1 !== 0) return v.toFixed(2);
  return v.toLocaleString();
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
};

function freqLabel(freq: Credit["frequency"]) {
  switch (freq) {
    case "monthly":
      return "Monthly";
    case "quarterly":
      return "Quarterly";
    case "semiannual":
      return "Semiannual";
    case "annual":
      return "Annual";
    case "one-time":
      return "One-time";
    default:
      return String(freq);
  }
}

function annualized(credit: Credit) {
  const amt = credit.amount || 0;
  switch (credit.frequency) {
    case "monthly":
      return amt * 12;
    case "quarterly":
      return amt * 4;
    case "semiannual":
      return amt * 2;
    case "annual":
    case "one-time":
    default:
      return amt;
  }
}

function monthName(m: number) {
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return names[(m - 1 + 12) % 12] ?? "—";
}

function formatRenews(credit: Credit) {
  if (!credit.renews) return "";
  return `Renews ${monthName(credit.renews.month)} ${credit.renews.day}`;
}

function sumCreditsAnnual(card: Card) {
  return (card.credits || []).reduce((s, c) => s + annualized(c), 0);
}

function estimateWelcomeValueUSD(card: Card) {
  const offer = card.welcomeOffer;
  if (!offer) return null;
  const v = (DEFAULT_POINT_VALUES_USD as Record<string, number | undefined>)[offer.currency];
  if (!v) return null;
  return Math.round(offer.amount * v);
}

export default function DashboardPage() {
  // Mock auth states (swap to Supabase later)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [plan, setPlan] = useState<Plan>("free");

  // Sidebar selection
  const [query, setQuery] = useState("");
  const [activeKey, setActiveKey] = useState<string>(() => CARDS[0]?.key ?? "");

  // Saved dashboard cards
  const [savedKeys, setSavedKeys] = useState<string[]>([]);

  // Per-credit state
  const [usedByCredit, setUsedByCredit] = useState<Record<string, boolean>>({});
  const [dontCareByCredit, setDontCareByCredit] = useState<Record<string, boolean>>({});
  const [remindByCredit, setRemindByCredit] = useState<Record<string, boolean>>({});

  const [modal, setModal] = useState<Modal>(null);

  // Load persisted state
  useEffect(() => {
    setIsLoggedIn(loadLS<boolean>(LS.loggedIn, false));
    setIsFounder(loadLS<boolean>(LS.isFounder, false));
    setPlan(loadLS<Plan>(LS.plan, "free"));
    setSavedKeys(loadLS<string[]>(LS.saved, []));
    setUsedByCredit(loadLS<Record<string, boolean>>(LS.used, {}));
    setDontCareByCredit(loadLS<Record<string, boolean>>(LS.dontCare, {}));
    setRemindByCredit(loadLS<Record<string, boolean>>(LS.remind, {}));
  }, []);

  // Persist state
  useEffect(() => saveLS(LS.loggedIn, isLoggedIn), [isLoggedIn]);
  useEffect(() => saveLS(LS.isFounder, isFounder), [isFounder]);
  useEffect(() => saveLS(LS.plan, plan), [plan]);
  useEffect(() => saveLS(LS.saved, savedKeys), [savedKeys]);
  useEffect(() => saveLS(LS.used, usedByCredit), [usedByCredit]);
  useEffect(() => saveLS(LS.dontCare, dontCareByCredit), [dontCareByCredit]);
  useEffect(() => saveLS(LS.remind, remindByCredit), [remindByCredit]);

  const cardsOrdered = useMemo(() => {
    const top = CARDS.filter((c) => (c as any).isTopPick);
    const rest = CARDS.filter((c) => !(c as any).isTopPick);
    return [...top, ...rest];
  }, []);

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cardsOrdered;
    return cardsOrdered.filter((c) => {
      const hay = `${c.name} ${c.issuer} ${c.key}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, cardsOrdered]);

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
        // If "Don't care", remove from used/remind
        setUsedByCredit((u) => ({ ...u, [creditId]: false }));
        setRemindByCredit((r) => ({ ...r, [creditId]: false }));
      }
      return next;
    });
  }

  function toggleRemind(creditId: string) {
    setRemindByCredit((prev) => ({ ...prev, [creditId]: !prev[creditId] }));
  }

  function addToDashboard(cardKey: string) {
    if (savedKeys.includes(cardKey)) return;

    // Must login unless founder
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

    // Paywall: multiple cards requires $5 (unless founder)
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
    const total = caredCredits.reduce((s, c) => s + annualized(c), 0);
    const used = caredCredits.reduce((s, c) => s + (usedByCredit[c.id] ? annualized(c) : 0), 0);
    const pct = total === 0 ? 0 : Math.round((used / total) * 100);
    return { total, used, pct: clampPct(pct) };
  }

  const activeProgress = activeCard ? calcProgressForCard(activeCard) : { total: 0, used: 0, pct: 0 };

  const totalAnnualFeesSelected = useMemo(() => {
    return savedCards.reduce((s, c) => s + (c.annualFee || 0), 0);
  }, [savedCards]);

  const activeCreditsSorted = useMemo(() => {
    const list = [...(activeCard?.credits || [])];
    return list.sort((a, b) => (FREQ_ORDER[a.frequency] ?? 999) - (FREQ_ORDER[b.frequency] ?? 999));
  }, [activeCard]);

  const expiringSoon = useMemo(() => {
    // v1: "expiring soon" is Remind-only and excludes Used / Don’t care
    // Real date math comes next iteration once we store cardmember-year start dates.
    const list = (activeCard?.credits || []).filter((c) => {
      const used = !!usedByCredit[c.id];
      const dc = !!dontCareByCredit[c.id];
      const rm = !!remindByCredit[c.id];
      return rm && !used && !dc;
    });
    return list.sort((a, b) => (FREQ_ORDER[a.frequency] ?? 999) - (FREQ_ORDER[b.frequency] ?? 999));
  }, [activeCard, usedByCredit, dontCareByCredit, remindByCredit]);

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
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold tracking-tight">ClawBack</div>
            <div className="text-sm text-white/60">
              No bank logins. No SSN. Just credits, reminders, and savings.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Mock controls (remove later) */}
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

        {/* Layout: 3 columns (left sidebar, middle credits, right panel) */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr_360px]">
          {/* LEFT SIDEBAR */}
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold text-white/85">Choose your card</div>
            <div className="mt-2 text-xs text-white/60">
              Browse any card free. “Notify me” saves it to your dashboard.
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cards..."
              className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
            />

            <div className="mt-4 max-h-[520px] overflow-auto rounded-2xl border border-white/10">
              {filteredCards.map((c) => {
                const isActive = c.key === activeKey;
                const isSaved = savedKeys.includes(c.key);
                const logo = (c as any).logo as string | undefined;

                return (
                  <button
                    key={c.key}
                    onClick={() => setActiveKey(c.key)}
                    className={[
                      "w-full border-b border-white/10 px-4 py-3 text-left transition last:border-b-0",
                      isActive ? "bg-white/10" : "hover:bg-white/5",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-8 w-14 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                          {logo ? (
                            <Image
                              src={logo}
                              alt={`${c.name} card`}
                              fill
                              className="object-cover"
                              sizes="56px"
                              priority={isActive}
                            />
                          ) : null}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{c.name}</div>
                          <div className="text-xs text-white/60">
                            Fee: ${money(c.annualFee)} • Credits: ${money(sumCreditsAnnual(c))}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-white/60">{isSaved ? "Saved ✓" : isActive ? "Viewing" : ""}</div>
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

          {/* MIDDLE: ACTIVE CARD + CREDITS */}
          <section className="space-y-6">
            {/* Trackers */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                <div className="text-xs text-white/70">Credits Redeemed (Active Card)</div>
                <div className="mt-1 text-2xl font-semibold">${money(activeProgress.used)}</div>
                <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${activeProgress.pct}%` }} />
                </div>
                <div className="mt-1 text-xs text-white/60">{activeProgress.pct}% used</div>
              </div>

              <div className="rounded-3xl border border-white/15 bg-white/5 p-5">
                <div className="text-xs text-white/60">Total Credits Available (Active Card)</div>
                <div className="mt-1 text-2xl font-semibold">${money(activeProgress.total)}</div>
                <div className="mt-1 text-xs text-white/50">excludes credits marked “Don’t care”</div>
              </div>

              <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-5">
                <div className="text-xs text-white/70">Annual Fee (Active Card)</div>
                <div className="mt-1 text-2xl font-semibold">${money(activeCard?.annualFee || 0)}</div>
                <div className="mt-1 text-xs text-white/50">next: net value vs fee</div>
              </div>
            </div>

            {/* Active card header */}
            {activeCard && (
              <div className="rounded-3xl border border-white/12 bg-gradient-to-b from-white/10 to-white/5 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="relative h-16 w-28 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                      {(activeCard as any).logo ? (
                        <Image
                          src={(activeCard as any).logo}
                          alt={`${activeCard.name} card`}
                          fill
                          className="object-cover"
                          sizes="112px"
                          priority
                        />
                      ) : null}
                    </div>

                    <div>
                      <div className="text-xl font-semibold">{activeCard.name}</div>
                      <div className="mt-1 text-sm text-white/60">
                        Annual fee: ${money(activeCard.annualFee)} • Credits tracked (annualized): ${money(sumCreditsAnnual(activeCard))}
                      </div>

                      {activeCard.welcomeOffer && (
                        <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                          <div className="text-sm font-semibold">Welcome bonus</div>
                          <div className="mt-1 text-sm text-white/70">
                            {activeCard.welcomeOffer.amount.toLocaleString()} {activeCard.welcomeOffer.currency} •{" "}
                            {activeCard.welcomeOffer.spend}
                          </div>
                          <div className="mt-1 text-xs text-white/55">
                            Est. value:{" "}
                            <span className="text-white/85">
                              {estimateWelcomeValueUSD(activeCard)
                                ? `$${money(estimateWelcomeValueUSD(activeCard) as number)}`
                                : "—"}
                            </span>{" "}
                            <span className="text-white/40">(editable later)</span>
                          </div>
                          <div className="mt-2 text-xs text-white/50">
                            Source: {activeCard.welcomeOffer.sourceLabel}
                            {activeCard.welcomeOffer.notes ? ` • ${activeCard.welcomeOffer.notes}` : ""}
                          </div>
                        </div>
                      )}
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
                <div className="mt-6">
                  <div className="text-sm font-semibold text-white/85">Credits (Active Card)</div>
                  <div className="mt-3 space-y-3">
                    {activeCreditsSorted.map((credit) => {
                      const used = !!usedByCredit[credit.id];
                      const dc = !!dontCareByCredit[credit.id];
                      const rm = !!remindByCredit[credit.id];

                      const line = `${freqLabel(credit.frequency)} • $${money(credit.amount)} • Annualized: $${money(
                        annualized(credit)
                      )}${credit.renews ? ` • ${formatRenews(credit)}` : ""}`;

                      return (
                        <div
                          key={credit.id}
                          className={[
                            "rounded-2xl border p-4",
                            dc
                              ? "border-white/10 bg-white/5 opacity-70"
                              : used
                              ? "border-emerald-400/25 bg-emerald-400/10"
                              : "border-white/10 bg-black/25",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-sm font-medium">{credit.name}</div>
                              <div className="mt-1 text-xs text-white/60">{line}</div>
                              {credit.note ? (
                                <div className="mt-1 text-xs text-white/45">{credit.note}</div>
                              ) : null}
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <button
                                onClick={() => toggleRemind(credit.id)}
                                disabled={dc}
                                className={[
                                  "rounded-xl border px-3 py-2 text-xs",
                                  dc
                                    ? "cursor-not-allowed border-white/10 text-white/40"
                                    : rm
                                    ? "border-sky-400/30 bg-sky-400/15"
                                    : "border-white/10 hover:bg-white/5",
                                ].join(" ")}
                              >
                                {rm ? "Remind ✓" : "Remind"}
                              </button>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleDontCare(credit.id)}
                                  className={[
                                    "rounded-xl border px-3 py-2 text-xs",
                                    dc ? "border-white/15 bg-white/10" : "border-white/10 hover:bg-white/5",
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
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 text-xs text-white/50">
                    “Don’t care” removes a credit from progress + reminders. “Remind” powers the “Expiring soon” panel.
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* RIGHT PANEL */}
          <aside className="space-y-6">
            {/* Yellow points/multipliers box */}
            <div className="rounded-3xl border border-yellow-400/25 bg-yellow-400/10 p-6">
              <div className="text-sm font-semibold text-white/90">Points / Cash Back</div>
              <div className="mt-1 text-xs text-white/70">Category multipliers for the active card</div>

              <div className="mt-4 space-y-2">
                {(activeCard?.multipliers || []).length ? (
                  (activeCard.multipliers || []).map((m, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <div className="text-sm text-white/85">{m.label}</div>
                      <div className="text-sm font-semibold text-white">{m.rate}</div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
                    No multipliers added yet for this card.
                  </div>
                )}
              </div>
            </div>

            {/* Expiring soon */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold text-white/85">Expiring soon</div>
              <div className="mt-1 text-xs text-white/60">
                Shows credits marked “Remind” (and not Used / Don’t care). Next step: true date math.
              </div>

              {expiringSoon.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
                  No reminders set yet for this card. Toggle “Remind” on any credit.
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {expiringSoon.map((c) => (
                    <div key={c.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="mt-1 text-xs text-white/60">
                        {freqLabel(c.frequency)} • ${money(c.amount)} • Annualized: ${money(annualized(c))}
                        {c.renews ? ` • ${formatRenews(c)}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved dashboard cards */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white/85">Your Dashboard Cards</div>
                  <div className="mt-1 text-xs text-white/60">
                    Saved cards are what you’ll get reminders for (once Supabase + email/SMS is added).
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
                    const logo = (card as any).logo as string | undefined;

                    return (
                      <div key={card.key} className="rounded-3xl border border-white/12 bg-black/25 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="relative h-12 w-20 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                              {logo ? (
                                <Image src={logo} alt={`${card.name} card`} fill className="object-cover" sizes="80px" />
                              ) : null}
                            </div>

                            <div>
                              <div className="text-lg font-semibold">{card.name}</div>
                              <div className="mt-1 text-xs text-white/60">
                                Fee: ${money(card.annualFee)} • Credits (care, annualized): ${money(prog.total)}
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

              <div className="mt-6 text-xs text-white/50">Next: Supabase login + persistence, then reminder scheduling (email + SMS).</div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
