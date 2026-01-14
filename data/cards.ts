// data/cards.ts

export type CreditFrequency = "monthly" | "quarterly" | "semiannual" | "annual" | "one-time";

export type Credit = {
  id: string;
  name: string;

  // how often it resets
  frequency: CreditFrequency;

  // IMPORTANT:
  // - amount: the "real" amount per cycle (ex: $75 quarterly)
  // - amountAnnual: the annualized value (ex: $300)
  amount: number;
  amountAnnual: number;

  // Simple v1 "renews" anchor (we will later compute real resets vs cardmember year)
  renews?: { month: number; day: number };

  // Optional: short cap/notes
  capNote?: string;
};

export type Multiplier = {
  label: string; // "Dining", "Flights", "Hotels", etc.
  rate: string;  // "4x", "5x", "5% up to $X", etc.
  details?: string;
};

export type Card = {
  key: string;
  name: string;
  issuer?: string;

  annualFee: number;

  // local image path in /public
  // example: "/logos/amex-platinum.png"
  logo?: string;

  credits: Credit[];

  welcomeOffer?: {
    amount: number;
    currency: string;
    spend: string;
    sourceLabel: string;
    notes?: string;
  };

  multipliers?: Multiplier[];
};

// Point value map used for welcome offer valuation in UI
export const DEFAULT_POINT_VALUES_USD: Record<string, number> = {
  MR: 0.015,     // Amex MR (placeholder)
  UR: 0.015,     // Chase UR (placeholder)
  C1: 0.012,     // Capital One miles (placeholder)
  AA: 0.013,     // AAdvantage miles (placeholder)
  HH: 0.005,     // Hilton points (placeholder)
  BONVOY: 0.008, // Marriott points (placeholder)
  DL: 0.012,     // Delta miles (placeholder)
};

function annualize(amount: number, freq: CreditFrequency) {
  const m = {
    monthly: 12,
    quarterly: 4,
    semiannual: 2,
    annual: 1,
    "one-time": 1,
  }[freq];
  return Math.round(amount * m);
}

// If you want ALL cards to use a common anchor date initially,
// keep renews = { month: 1, day: 1 } and we’ll later switch to per-user cardmember-year start.
const DEFAULT_RENEWS = { month: 1, day: 1 };

// --- TOP PICKS pinned in sidebar ---
export const TOP_PICKS: string[] = [
  "amex-platinum",
  "chase-sapphire-reserve",
  "capitalone-venture-x",
];

// --- 9 cards you’re using right now ---
// NOTE: credits/multipliers here are *starter data*.
// If your sheet differs, treat your sheet as source-of-truth until we reconcile.
export const CARDS: Card[] = [
  {
    key: "amex-platinum",
    name: "Platinum Card",
    issuer: "American Express",
    annualFee: 895,
    logo: "/logos/amex-platinum.png",
    welcomeOffer: {
      amount: 175_000,
      currency: "MR",
      spend: "Spend $8,000 in 6 months",
      sourceLabel: "Amex page (offer varies)",
      notes: "Welcome offer can vary by applicant.",
    },
    credits: [
      { id: "plat-airline", name: "Airline incidental fees", frequency: "annual", amount: 200, amountAnnual: annualize(200, "annual"), renews: DEFAULT_RENEWS },
      { id: "plat-fhr", name: "Fine Hotels + Resorts / Hotel Collection", frequency: "semiannual", amount: 200, amountAnnual: annualize(200, "semiannual"), renews: DEFAULT_RENEWS },
      { id: "plat-digital", name: "Digital entertainment", frequency: "monthly", amount: 25, amountAnnual: annualize(25, "monthly"), renews: DEFAULT_RENEWS },
      { id: "plat-uber", name: "Uber Cash", frequency: "monthly", amount: 15, amountAnnual: annualize(15, "monthly"), renews: DEFAULT_RENEWS },
      { id: "plat-saks", name: "Saks", frequency: "semiannual", amount: 50, amountAnnual: annualize(50, "semiannual"), renews: DEFAULT_RENEWS },
      { id: "plat-lulu", name: "Lululemon", frequency: "quarterly", amount: 75, amountAnnual: annualize(75, "quarterly"), renews: DEFAULT_RENEWS, capNote: "Quarterly credit" },
      { id: "plat-clear", name: "Clear Plus", frequency: "annual", amount: 209, amountAnnual: annualize(209, "annual"), renews: DEFAULT_RENEWS },
      { id: "plat-resy", name: "Resy restaurants", frequency: "annual", amount: 0, amountAnnual: 0, renews: DEFAULT_RENEWS, capNote: "Fill with your exact credit if tracking it" },
      { id: "plat-oura", name: "Oura Ring", frequency: "annual", amount: 0, amountAnnual: 0, renews: DEFAULT_RENEWS, capNote: "Optional / if you track it" },
    ],
    multipliers: [
      { label: "Flights booked direct / Amex Travel", rate: "5x" },
      { label: "Prepaid hotels on AmexTravel", rate: "5x" },
      { label: "Everything else", rate: "1x" },
    ],
  },

  {
    key: "chase-sapphire-reserve",
    name: "Chase Sapphire Reserve",
    issuer: "Chase",
    annualFee: 795,
    logo: "/logos/chase-sapphire-reserve.png",
    credits: [
      { id: "csr-travel", name: "Annual travel credit", frequency: "annual", amount: 300, amountAnnual: annualize(300, "annual"), renews: DEFAULT_RENEWS },
    ],
    multipliers: [
      { label: "Chase Travel", rate: "8x", details: "when booked via Chase Travel (confirm exact earn table)" },
      { label: "Dining", rate: "3x" },
      { label: "Travel", rate: "3x" },
      { label: "Everything else", rate: "1x" },
    ],
  },

  {
    key: "capitalone-venture-x",
    name: "Venture X",
    issuer: "Capital One",
    annualFee: 395,
    logo: "/logos/capitalone-venture-x.png",
    credits: [
      { id: "vx-travel", name: "Capital One Travel credit", frequency: "annual", amount: 300, amountAnnual: annualize(300, "annual"), renews: DEFAULT_RENEWS },
      { id: "vx-anniversary", name: "Anniversary bonus miles", frequency: "annual", amount: 100, amountAnnual: annualize(100, "annual"), renews: DEFAULT_RENEWS, capNote: "10,000 miles ≈ $100 (value depends on redemption)" },
    ],
    multipliers: [
      { label: "Hotels & rental cars via Capital One Travel", rate: "10x" },
      { label: "Flights via Capital One Travel", rate: "5x" },
      { label: "Everything else", rate: "2x" },
    ],
  },

  {
    key: "amex-gold",
    name: "Amex Gold",
    issuer: "American Express",
    annualFee: 325,
    logo: "/logos/amex-gold.png",
    credits: [
      { id: "gold-dining", name: "Dining credit", frequency: "monthly", amount: 10, amountAnnual: annualize(10, "monthly"), renews: DEFAULT_RENEWS },
      { id: "gold-uber", name: "Uber Cash", frequency: "monthly", amount: 10, amountAnnual: annualize(10, "monthly"), renews: DEFAULT_RENEWS },
    ],
    multipliers: [
      { label: "Restaurants", rate: "4x" },
      { label: "U.S. supermarkets", rate: "4x" },
      { label: "Flights (airlines / Amex Travel)", rate: "3x" },
      { label: "Everything else", rate: "1x" },
    ],
  },

  {
    key: "hilton-honors",
    name: "Hilton Honors Card",
    issuer: "American Express",
    annualFee: 550,
    logo: "/logos/hilton-honors.png",
    credits: [
      { id: "hilton-resort", name: "Hilton resort credit", frequency: "quarterly", amount: 50, amountAnnual: annualize(50, "quarterly"), renews: DEFAULT_RENEWS },
      { id: "hilton-airline", name: "Airline credit", frequency: "quarterly", amount: 50, amountAnnual: annualize(50, "quarterly"), renews: DEFAULT_RENEWS },
    ],
    multipliers: [
      { label: "Hilton purchases", rate: "14x" },
      { label: "Flights", rate: "7x" },
      { label: "Car rentals", rate: "7x" },
      { label: "Restaurants", rate: "7x" },
      { label: "Everything else", rate: "3x" },
    ],
  },

  {
    key: "delta-reserve",
    name: "Delta SkyMiles Reserve (Amex)",
    issuer: "American Express",
    annualFee: 650,
    logo: "/logos/delta-reserve.png",
    credits: [
      { id: "delta-companion", name: "Companion certificate (value varies)", frequency: "annual", amount: 0, amountAnnual: 0, renews: DEFAULT_RENEWS, capNote: "Track as non-cash perk if you want" },
    ],
    multipliers: [
      { label: "Delta purchases", rate: "3x" },
      { label: "Everything else", rate: "1x" },
    ],
  },

  {
    key: "marriott-brilliant",
    name: "Marriott Bonvoy Brilliant (Amex)",
    issuer: "American Express",
    annualFee: 650,
    logo: "/logos/marriott-brilliant.png",
    credits: [
      { id: "brilliant-dining", name: "Dining credit", frequency: "monthly", amount: 25, amountAnnual: annualize(25, "monthly"), renews: DEFAULT_RENEWS },
      { id: "brilliant-freenight", name: "Free night award (value varies)", frequency: "annual", amount: 0, amountAnnual: 0, renews: DEFAULT_RENEWS, capNote: "Track as perk if you want" },
    ],
    multipliers: [
      { label: "Marriott purchases", rate: "6x" },
      { label: "Restaurants worldwide", rate: "3x" },
      { label: "Flights booked directly", rate: "3x" },
      { label: "Everything else", rate: "2x" },
    ],
  },

  {
    key: "citi-strata-elite",
    name: "Citi Strata Elite",
    issuer: "Citi",
    annualFee: 595,
    logo: "/logos/citi-strata-elite.png",
    credits: [
      { id: "strata-blacklane", name: "Blacklane credit", frequency: "semiannual", amount: 100, amountAnnual: annualize(100, "semiannual"), renews: DEFAULT_RENEWS },
      { id: "strata-globalentry", name: "Global Entry / TSA PreCheck", frequency: "one-time", amount: 120, amountAnnual: 120, renews: DEFAULT_RENEWS, capNote: "Every 4 years (track separately later)" },
    ],
    multipliers: [
      { label: "Citi Travel portal hotels/cars/attractions", rate: "12x", details: "when booked on cititravel.com (verify exact categories)" },
      { label: "Air travel via Citi Travel portal", rate: "6x" },
      { label: "Dining", rate: "6x" },
      { label: "Everything else", rate: "1x" },
    ],
  },

  {
    key: "citi-aa-executive",
    name: "Citi / AAdvantage Executive",
    issuer: "Citi",
    annualFee: 595,
    logo: "/logos/citi-aa-executive.png",
    credits: [
      { id: "aa-admirals", name: "Admirals Club access (perk)", frequency: "annual", amount: 0, amountAnnual: 0, renews: DEFAULT_RENEWS, capNote: "Not a statement credit, but core value" },
    ],
    multipliers: [
      { label: "American Airlines purchases", rate: "4x", details: "verify earn table" },
      { label: "Everything else", rate: "1x" },
    ],
  },
];
