// data/cards.ts

export type CreditFrequency = "monthly" | "quarterly" | "semiannual" | "annual" | "one-time";

export type Credit = {
  id: string;
  name: string;

  // How often it resets
  frequency: CreditFrequency;

  // Amount PER period (this is the main number the UI should show)
  amount: number;

  // Optional renewal (simple v1)
  renews?: { month: number; day: number };

  // Optional note shown in UI
  note?: string;
};

export type Multiplier = {
  label: string; // e.g. "Dining"
  rate: string; // e.g. "4x", "3x", "5% up to $X"
  note?: string;
};

export type Card = {
  key: string;
  name: string;
  issuer: string;
  annualFee: number;

  // Show a real card image
  logo?: string; // e.g. "/logos/amex-platinum.png"

  // Credits + points
  credits: Credit[];
  multipliers?: Multiplier[];

  // Optional welcome offer
  welcomeOffer?: {
    amount: number;
    currency: string; // e.g. "MR", "UR", "Miles"
    spend: string;
    sourceLabel: string;
    notes?: string;
  };

  // Optional pinning for sidebar
  isTopPick?: boolean;
};

export const DEFAULT_POINT_VALUES_USD: Record<string, number> = {
  MR: 0.015, // rough default, editable later
  UR: 0.015,
  Miles: 0.012,
  Hilton: 0.006,
  Marriott: 0.008,
  AA: 0.014,
};

export const CARDS: Card[] = [
  // ---------------- TOP PICKS (pinned) ----------------
  {
    key: "amex-platinum",
    name: "Platinum Card",
    issuer: "American Express",
    annualFee: 895,
    logo: "/logos/amex-platinum.png",
    isTopPick: true,
    welcomeOffer: {
      amount: 175000,
      currency: "MR",
      spend: "Spend $8,000 in 6 months",
      sourceLabel: "Amex page (offers vary)",
      notes: "Offer can vary by applicant.",
    },
    credits: [
      { id: "plat-airline", name: "Airline Incidental Fees", frequency: "annual", amount: 200, renews: { month: 1, day: 1 } },
      { id: "plat-fhr-hotel", name: "Fine Hotels + Resorts / Hotel Collection", frequency: "semiannual", amount: 200, renews: { month: 1, day: 1 } },
      { id: "plat-digital", name: "Digital Entertainment", frequency: "monthly", amount: 25, renews: { month: 1, day: 1 } },
      { id: "plat-uber", name: "Uber Cash", frequency: "monthly", amount: 15, renews: { month: 1, day: 1 }, note: "Some months may differ by program terms." },
      { id: "plat-saks", name: "Saks", frequency: "semiannual", amount: 50, renews: { month: 1, day: 1 } },
      { id: "plat-clear", name: "CLEAR Plus", frequency: "annual", amount: 209, renews: { month: 1, day: 1 } },
      { id: "plat-lululemon", name: "Lululemon", frequency: "quarterly", amount: 75, renews: { month: 1, day: 1 } },
      { id: "plat-walmart", name: "Walmart+ (statement credit)", frequency: "monthly", amount: 12.95, renews: { month: 1, day: 1 } },
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
    isTopPick: true,
    credits: [
      { id: "csr-travel", name: "Annual Travel Credit", frequency: "annual", amount: 300, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "Chase Travel", rate: "8x" },
      { label: "Dining", rate: "3x" },
      { label: "Everything else", rate: "1x" },
    ],
  },
  {
    key: "capitalone-venture-x",
    name: "Venture X",
    issuer: "Capital One",
    annualFee: 395,
    logo: "/logos/capitalone-venture-x.png",
    isTopPick: true,
    credits: [
      { id: "vx-travel", name: "Annual Travel Credit", frequency: "annual", amount: 300, renews: { month: 1, day: 1 } },
      { id: "vx-anniversary", name: "Anniversary Bonus Miles", frequency: "annual", amount: 10000, renews: { month: 1, day: 1 }, note: "Miles, not dollars." },
    ],
    multipliers: [
      { label: "Hotels & rental cars (Capital One Travel)", rate: "10x" },
      { label: "Flights (Capital One Travel)", rate: "5x" },
      { label: "Everything else", rate: "2x" },
    ],
  },

  // ---------------- OTHER 6 ----------------
  {
    key: "amex-gold",
    name: "American Express Gold",
    issuer: "American Express",
    annualFee: 325,
    logo: "/logos/amex-gold.png",
    credits: [
      { id: "gold-dining", name: "Dining Credit", frequency: "monthly", amount: 10, renews: { month: 1, day: 1 } },
      { id: "gold-uber", name: "Uber Cash", frequency: "monthly", amount: 10, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "Restaurants", rate: "4x" },
      { label: "U.S. supermarkets", rate: "4x" },
      { label: "Flights", rate: "3x" },
      { label: "Everything else", rate: "1x" },
    ],
  },
  {
    key: "hilton-honors",
    name: "Hilton Honors Aspire",
    issuer: "American Express",
    annualFee: 550,
    logo: "/logos/hilton-honors.png",
    credits: [
      { id: "aspire-resort", name: "Hilton Resort Credit", frequency: "semiannual", amount: 200, renews: { month: 1, day: 1 } },
      { id: "aspire-airline", name: "Airline Fee Credit", frequency: "quarterly", amount: 50, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "Hilton purchases", rate: "14x" },
      { label: "Flights", rate: "7x" },
      { label: "Dining", rate: "7x" },
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
      { id: "delta-rideshare", name: "Rideshare credit", frequency: "monthly", amount: 10, renews: { month: 1, day: 1 } },
      { id: "delta-resy", name: "Resy dining credit", frequency: "monthly", amount: 20, renews: { month: 1, day: 1 } },
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
      { id: "brilliant-dining", name: "Dining credit", frequency: "monthly", amount: 25, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "Marriott purchases", rate: "6x" },
      { label: "Dining", rate: "3x" },
      { label: "Flights", rate: "3x" },
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
      { id: "strata-hotel", name: "Hotel credit (Citi Travel)", frequency: "annual", amount: 300, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "Travel", rate: "3x" },
      { label: "Dining", rate: "3x" },
      { label: "Everything else", rate: "1x" },
    ],
  },
  {
    key: "citi-aa-executive",
    name: "Citi / AAdvantage Executive World Elite",
    issuer: "Citi",
    annualFee: 595,
    logo: "/logos/citi-aa-executive.png",
    credits: [
      { id: "aa-inflight", name: "In-flight Wi-Fi credit", frequency: "annual", amount: 120, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "American Airlines purchases", rate: "4x" },
      { label: "Everything else", rate: "1x" },
    ],
  },
];
