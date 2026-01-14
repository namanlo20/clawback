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

// ---------- LocalStorage helpers ----------
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
  remind: "clawback_remind_by_credit", // NEW
};

// ---------- Renewal date helpers (simple v1) ----------
function nextRenewalDate(renews?: { month: number; day: number }) {
  if (!renews) return null;
  const now = new Date();
  const y = now.getFullYear();

  // months are 1-12 in our model
  const candidate = new Date(y, renews.month - 1, renews.day, 12, 0, 0);
  if (candidate.getTime() >= now.getTime()) return candidate;

  return new Date(y + 1, renews.month - 1, renews.day, 12, 0, 0);
}

function fmtMonthDay(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const PINNED_TOP3_KEYS = ["amex_platinum", "chase_sapphire_reserve", "capitalone_venturex"];

export default function DashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [plan, setPlan] = useState<Plan>("free");

  const [query, setQuery] = useState("");
  const [activeKey, setActiveKey] = useState<string>(() => CARDS[0]?.key ?? "");

  const [savedKeys, setSavedKeys] = useState<string[]>([]);

  const [usedByCredit, setUsedByCredit] = useState<Record<string, boolean>>({});
  const [dontCareByCredit, setDontCareByCredit] = useState<Record<string, boolean>>({});
  const [remindByCredit, setRemindByCredit] = useState<Record<string, boolean>>({}); // NEW

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

  const cardsByKey = useMemo(() => new Map(CARDS.map((c) => [c.key, c])), []);
  const activeCard = useMemo(() => cardsByKey.get(activeKey) ?? CARDS[0], [activeKey, cardsByKey]);

  const pinned = useMemo(() => {
    const arr = PINNED_TOP3_KEYS.map((k) => cardsByKey.get(k)).filter(Boolean) as Card[];
    return arr;
  }, [cardsByKey]);

  const nonPinned = useMemo(() => {
    const pinnedSet = new Set(PINNED_TOP3_KEYS);
    return CARDS.filter((c) => !pinnedSet.has(c.key));
  }, []);

  const filteredNonPinned = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return nonPinned;
    return nonPinned.filter((c) => `${c.name} ${c.key}`.toLowerCase().includes(q));
  }, [query, nonPinned]);

  const savedCards = useMemo(() => {
    return savedKeys.map((k) => cardsByKey.get(k)).filter(Boolean) as Card[];
  }, [savedKeys, cardsByKey]);

  function toggleUsed(creditId: string) {
    setUsedByCredit((prev) => {
      const next = { ...prev, [creditId]: !prev[creditId] };
      if (next[creditId]) {
        // used => no remind
        setRemindByCredit((r) => ({ ...r, [creditId]: false }));
      }
      return next;
    });
  }

  function toggleDontCare(creditId: string) {
    setDontCareByCredit((prev) => {
      const next = { ...prev, [creditId]: !prev[creditId] };
      if (next[creditId]) {
        // don't care => no used and no remind
        setUsedByCredit((u) => ({ ...u, [creditId]: false }));
        setRemindByCredit((r) => ({ ...r, [creditId]: false }));
      }
      return next;
    });
  }

  function toggleRemind(creditId: string) {
    // remind only if not used / not dont care
    if (dontCareByCredit[creditId] || usedByCredit[creditId]) return;
    setRemindByCredit((prev) => ({ ...prev, [creditId]: !prev[creditId] }));
  }

  function addToDashboard(cardKey: string) {
    if (savedKeys.includes(cardKey)) return;

    if (!isLoggedIn && !isFounder) {
      setModal({
        title: "Login required",
        body: "To save cards and enable reminders, you need to log in (Supabase later). For now, use Mock Login.",
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
    const used = caredCredits.reduce((s, c) => s + (usedByCredit[c.id] ? (c.amountAnnual || 0) : 0), 0);
    const pct = total === 0 ? 0 : Math.round((used / total) * 100);
    return { total, used, pct: clampPct(pct) };
  }

  const activeProgress = activeCard ? calcProgressForCard(activeCard) : { total: 0, used: 0, pct: 0 };

  const expiringSoon = useMemo(() => {
    const rows: { cardName: string; creditName: string; amountAnnual: number; nextDate: Date }[] = [];
    const cardsToScan = savedCards.length ? savedCards : activeCard ? [activeCard] : [];

    for (const card of cardsToScan) {
      for (const credit of card.credits || []) {
        const id = credit.id;
        if (!remindByCredit[id]) continue;
        if (usedByCredit[id]) continue;
        if (dontCareByCredit[id]) continue;

        const d = nextRenewalDate(credit.renews);
        if (!d) continue;

        rows.push({
          cardName: card.name,
          creditName: credit.name,
          amountAnnual: credit.amountAnnual || 0,
          nextDate: d,
        });
      }
    }

    rows.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
    return rows.slice(0, 8);
  }, [savedCards, activeCard, remindByCredit, usedByCredit, dontCareByCredit]);

  const totalAnnualFeesSelected = useMemo(() => savedCards.reduce((s, c) => s + (c.annualFee || 0), 0), [savedCards]);

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

      {/* tighter outer padding so sidebar feels more left */}
      <div className="mx-auto max-w-[1500px] px-4 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold tracking-tight">ClawBack</div>
            <div className="text-sm text-white/60">
              Track credits. Mark used. Never waste money again.{" "}
              <span className="text-white/45">No banking info or SSN required.</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLoggedIn((v) => !v)}
              className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/80 hover:bg-white/5"
            >
              {isLoggedIn ? "Logged in (mock)" : "Login (mock)"}
            </button>
            <button
              onClick={() => setIsFounder((v) => !v)}
              className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/80 hover:bg-white/5"
            >
              {isFounder ? "Founder ✓" : "Founder off"}
            </button>
            <button
              onClick={() => setPlan((p) => (p === "free" ? "paid" : "free"))}
              className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/80 hover:bg-white/5"
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

        {/* 3-column layout */}
        <div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr_360px]">
          {/* LEFT: Catalog */}
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-white/85">Choose your card</div>
            <div className="mt-1 text-xs text-white/60">
              Browse any card free. “Notify me” saves it to your dashboard.
            </div>

            <div className="mt-3">
              <div className="text-[11px] uppercase tracking-wide text-white/40">Top picks</div>
              <div className="mt-2 overflow-hidden rounded-2xl border border-white/10">
                {pinned.map((c) => {
                  const isActive = c.key === activeKey;
                  const isSaved = savedKeys.includes(c.key);
                  return (
                    <button
                      key={c.key}
                      onClick={() => setActiveKey(c.key)}
                      className={[
                        "w-full border-b border-white/10 px-3 py-3 text-left transition last:border-b-0",
                        isActive ? "bg-white/10" : "hover:bg-white/5",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium">{c.name}</div>
                          <div className="text-xs text-white/60">
                            Fee: ${money(c.annualFee)} • Credits: ${money(sumCreditsAnnual(c))}
                          </div>
                        </div>
                        <div className="text-[11px] text-white/55">{isSaved ? "Saved ✓" : isActive ? "Viewing" : ""}</div>
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

            <div className="mt-3 max-h-[520px] overflow-auto rounded-2xl border border-white/10">
              {filteredNonPinned.map((c) => {
                const isActive = c.key === activeKey;
                const isSaved = savedKeys.includes(c.key);
                return (
                  <button
                    key={c.key}
                    onClick={() => setActiveKey(c.key)}
                    className={[
                      "w-full border-b border-white/10 px-3 py-3 text-left transition last:border-b-0",
                      isActive ? "bg-white/10" : "hover:bg-white/5",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">{c.name}</div>
                        <div className="text-xs text-white/60">
                          Fee: ${money(c.annualFee)} • Credits: ${money(sumCreditsAnnual(c))}
                        </div>
                      </div>
                      <div className="text-[11px] text-white/55">{isSaved ? "Saved ✓" : ""}</div>
                    </div>
                  </button>
                );
              })}
              {filteredNonPinned.length === 0 && (
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

          {/* MIDDLE: Credits for active card */}
          <section className="space-y-4">
            {/* top trackers */}
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                <div className="text-xs text-white/70">Credits Redeemed (Active)</div>
                <div className="mt-1 text-2xl font-semibold">${money(activeProgress.used)}</div>
                <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${activeProgress.pct}%` }} />
                </div>
                <div className="mt-1 text-xs text-white/60">{activeProgress.pct}% used</div>
              </div>

              <div className="rounded-3xl border border-white/15 bg-white/5 p-5">
                <div className="text-xs text-white/60">Total Credits Available (Active)</div>
                <div className="mt-1 text-2xl font-semibold">${money(activeProgress.total)}</div>
                <div className="mt-1 text-xs text-white/50">excludes credits marked “don’t care”</div>
              </div>

              <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-5">
                <div className="text-xs text-white/70">Annual Fee (Active)</div>
                <div className="mt-1 text-2xl font-semibold">${money(activeCard?.annualFee || 0)}</div>
                <div className="mt-1 text-xs text-white/50">later: net value vs fee</div>
              </div>
            </div>

            {/* active card header */}
            {activeCard && (
              <div className="rounded-3xl border border-white/12 bg-gradient-to-b from-white/10 to-white/5 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xl font-semibold">{activeCard.name}</div>
                    <div className="mt-1 text-sm text-white/60">
                      Annual fee: ${money(activeCard.annualFee)} • Credits tracked: ${money(sumCreditsAnnual(activeCard))}
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
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-white/85">Credits</div>
                      <div className="mt-1 text-xs text-white/55">
                        Use <span className="text-white/80">Remind me</span> to show up in “Expiring soon”.
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-3">
                    {(activeCard.credits || []).map((credit) => {
                      const used = !!usedByCredit[credit.id];
                      const dc = !!dontCareByCredit[credit.id];
                      const rm = !!remindByCredit[credit.id];
                      const next = nextRenewalDate(credit.renews);

                      return (
                        <div
                          key={credit.id}
                          className={[
                            "rounded-2xl border p-4",
                            dc
                              ? "border-white/10 bg-white/5 opacity-70"
                              : used
                              ? "border-emerald-400/25 bg-emerald-400/10"
                              : rm
                              ? "border-sky-400/25 bg-sky-400/10"
                              : "border-white/10 bg-black/25",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-sm font-medium">{credit.name}</div>
                              <div className="mt-1 text-xs text-white/60">
                                {credit.frequency} • Annualized: ${money(credit.amountAnnual || 0)}
                                {next ? <span className="text-white/45"> • Renews {fmtMonthDay(next)}</span> : null}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleRemind(credit.id)}
                                disabled={dc || used}
                                className={[
                                  "rounded-xl border px-3 py-2 text-xs",
                                  dc || used
                                    ? "cursor-not-allowed border-white/10 text-white/40"
                                    : rm
                                    ? "border-sky-400/30 bg-sky-400/15"
                                    : "border-white/10 hover:bg-white/5",
                                ].join(" ")}
                              >
                                {rm ? "Remind ✓" : "Remind me"}
                              </button>

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
                      );
                    })}
                  </div>

                  <div className="mt-4 text-xs text-white/50">
                    “Don’t care” removes a credit from progress + reminders. “Used” marks it done for this cycle.
                  </div>
                </div>
              </div>
            )}

            {/* saved cards list */}
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

                    return (
                      <div key={card.key} className="rounded-3xl border border-white/12 bg-black/25 p-5">
                        <div className="flex items-start justify-between gap-4">
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

                          <button
                            onClick={() => removeFromDashboard(card.key)}
                            className="rounded-2xl border border-white/15 px-3 py-2 text-xs hover:bg-white/5"
                          >
                            Remove
                          </button>
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

          {/* RIGHT: Expiring soon + Multipliers */}
          <aside className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white/85">Expiring soon</div>
                <div className="text-[11px] text-white/45">{savedCards.length ? "Saved cards" : "Active card"}</div>
              </div>
              <div className="mt-2 text-xs text-white/60">
                Shows credits marked <span className="text-white/80">Remind me</span>, excluding Used / Don’t care.
              </div>

              {expiringSoon.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
                  Nothing queued. Set “Remind me” on a credit to see it here.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {expiringSoon.map((r, idx) => (
                    <div key={idx} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">{r.creditName}</div>
                          <div className="mt-1 text-xs text-white/55">{r.cardName}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-white/60">Renews</div>
                          <div className="text-sm font-semibold">{fmtMonthDay(r.nextDate)}</div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-white/60">Value: ${money(r.amountAnnual)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold text-white/85">Points / cash back</div>
              <div className="mt-2 text-xs text-white/60">
                Add category multipliers per card (Dining, Travel, Grocery, etc).
              </div>

              {activeCard?.multipliers?.length ? (
                <div className="mt-4 space-y-2">
                  {activeCard.multipliers.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                      <div className="text-sm">{m.label}</div>
                      <div className="text-sm font-semibold text-white/85">{m.rate}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
                  No multipliers yet for this card. Add <code className="text-white/70">multipliers</code> in{" "}
                  <code className="text-white/70">data/cards.ts</code>.
                </div>
              )}

              <div className="mt-4 text-xs text-white/45">
                Next: add “Estimated yearly points” once you collect monthly spend inputs.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
