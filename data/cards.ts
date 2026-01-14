// data/cards.ts

export type CreditFrequency = "monthly" | "quarterly" | "semiannual" | "annual" | "one-time";

export type Credit = {
  id: string;
  name: string;

  // How often it resets
  frequency: CreditFrequency;

  // Amount PER period (e.g. Quarterly $75)
  amount: number;

  // Optional renewal label (simple v1)
  renews?: { month: number; day: number };

  // Optional note for clarity
  note?: string;
};

export type Multiplier = {
  label: string; // e.g. "Dining"
  rate: string;  // e.g. "4x"
  note?: string;
};

export type Card = {
  key: string;
  name: string;
  issuer: string;
  annualFee: number;

  // Card art image path
  logo?: string; // e.g. "/logos/amex-platinum.png"

  // Pin top 3 at top
  isTopPick?: boolean;

  credits: Credit[];
  multipliers?: Multiplier[];

  welcomeOffer?: {
    amount: number;
    currency: string; // e.g. "MR", "UR", "Miles"
    spend: string;
    sourceLabel: string;
    notes?: string;
  };
};

// Default point value assumptions (editable later)
export const DEFAULT_POINT_VALUES_USD: Record<string, number> = {
  MR: 0.015,     // Amex Membership Rewards (rough baseline)
  UR: 0.015,     // Chase Ultimate Rewards (rough baseline)
  Miles: 0.012,  // Generic miles baseline
  Hilton: 0.006,
  Marriott: 0.008,
  AA: 0.014,
};

const JAN1 = { month: 1, day: 1 };

export const CARDS: Card[] = [
  // ---------------- TOP 3 (pinned) ----------------
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
      notes: "Offer varies by applicant/time.",
    },
    credits: [
      { id: "plat-airline", name: "Airline incidental fees", frequency: "annual", amount: 200, renews: JAN1 },
      { id: "plat-hotel", name: "Hotel credit (FHR/THC)", frequency: "semiannual", amount: 200, renews: JAN1 },
      { id: "plat-digital", name: "Digital entertainment", frequency: "monthly", amount: 25, renews: JAN1 },
      { id: "plat-uber", name: "Uber Cash", frequency: "monthly", amount: 15, renews: JAN1 },
      { id: "plat-saks", name: "Saks", frequency: "semiannual", amount: 50, renews: JAN1 },
      { id: "plat-clear", name: "CLEAR Plus", frequency: "annual", amount: 209, renews: JAN1 },
      { id: "plat-lulu", name: "Lululemon", frequency: "quarterly", amount: 75, renews: JAN1 },
      { id: "plat-walmart", name: "Walmart+ (statement credit)", frequency: "monthly", amount: 12.95, renews: JAN1 },
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
    welcomeOffer: {
      amount: 60000,
      currency: "UR",
      spend: "Spend $4,000 in 3 months",
      sourceLabel: "Chase page (offers vary)",
      notes: "Offer varies by applicant/time.",
    },
    credits: [
      { id: "csr-travel", name: "Travel credit", frequency: "annual", amount: 300, renews: JAN1 },
    ],
    multipliers: [
      { label: "Chase Travel", rate: "8x" },
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
    isTopPick: true,
    welcomeOffer: {
      amount: 75000,
      currency: "Miles",
      spend: "Spend $4,000 in 3 months",
      sourceLabel: "Capital One page (offers vary)",
      notes: "Offer varies by applicant/time.",
    },
    credits: [
      { id: "vx-travel", name: "Capital One Travel credit", frequency: "annual", amount: 300, renews: JAN1 },
      {
        id: "vx-anniversary",
        name: "Anniversary bonus miles",
        frequency: "annual",
        amount: 10000,
        renews: JAN1,
        note: "This is miles (not dollars). We’ll add a miles→$ toggle later.",
      },
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
    welcomeOffer: {
      amount: 60000,
      currency: "MR",
      spend: "Spend $6,000 in 6 months",
      sourceLabel: "Amex page (offers vary)",
      notes: "Offer varies by applicant/time.",
    },
    credits: [
      { id: "gold-dining", name: "Dining credit", frequency: "monthly", amount: 10, renews: JAN1 },
      { id: "gold-uber", name: "Uber Cash", frequency: "monthly", amount: 10, renews: JAN1 },
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
    welcomeOffer: {
      amount: 175000,
      currency: "Hilton",
      spend: "Spend $6,000 in 6 months",
      sourceLabel: "Amex/Hilton page (offers vary)",
      notes: "Offer varies by applicant/time.",
    },
    credits: [
      { id: "aspire-resort", name: "Hilton resort credit", frequency: "semiannual", amount: 200, renews: JAN1 },
      { id: "aspire-airline", name: "Airline fee credit", frequency: "quarterly", amount: 50, renews: JAN1 },
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
    welcomeOffer: {
      amount: 60000,
      currency: "Miles",
      spend: "Spend $5,000 in 6 months",
      sourceLabel: "Delta/Amex page (offers vary)",
      notes: "Offer varies by applicant/time.",
    },
    credits: [
      { id: "delta-rideshare", name: "Rideshare credit", frequency: "monthly", amount: 10, renews: JAN1 },
      { id: "delta-resy", name: "Resy dining credit", frequency: "monthly", amount: 20, renews: JAN1 },
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
    welcomeOffer: {
      amount: 95000,
      currency: "Marriott",
      spend: "Spend $6,000 in 6 months",
      sourceLabel: "Amex/Marriott page (offers vary)",
      notes: "Offer varies by applicant/time.",
    },
    credits: [
      { id: "brilliant-dining", name: "Dining credit", frequency: "monthly", amount: 25, renews: JAN1 },
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
    welcomeOffer: {
      amount: 75000,
      currency: "Miles",
      spend: "Spend $4,000 in 3 months",
      sourceLabel: "Citi page (offers vary)",
      notes: "Offer varies by applicant/time.",
    },
    credits: [
      { id: "strata-hotel", name: "Hotel credit (Citi Travel)", frequency: "annual", amount: 300, renews: JAN1 },
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
    welcomeOffer: {
      amount: 70000,
      currency: "AA",
      spend: "Spend $7,000 in 3 months",
      sourceLabel: "AA/Citi page (offers vary)",
      notes: "Offer varies by applicant/time.",
    },
    credits: [
      { id: "aa-wifi", name: "In-flight Wi-Fi credit", frequency: "annual", amount: 120, renews: JAN1 },
    ],
    multipliers: [
      { label: "American Airlines purchases", rate: "4x" },
      { label: "Everything else", rate: "1x" },
    ],
  },
];
