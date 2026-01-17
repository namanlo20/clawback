// data/cards.ts
// ClawBack card database with welcome bonus ranges and category classification

export type CreditFrequency =
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "annual"
  | "every4years"
  | "every5years"
  | "onetime";

export type Credit = {
  id: string;
  title: string;
  amount: number;
  frequency: CreditFrequency;
  notes?: string;
};

export type Multiplier = {
  label: string;
  x: number;
};

export type PointsProgram =
  | "cashback"
  | "amex_mr"
  | "chase_ur"
  | "cap1_miles"
  | "citi_typ"
  | "aa_miles"
  | "delta_miles"
  | "marriott_points"
  | "hilton_points";

export type SpendCategory = "dining" | "travel" | "groceries" | "gas" | "online" | "other";
export type EarnRates = Partial<Record<SpendCategory, number>>;

// Welcome bonus with USD value range
export type WelcomeBonus = {
  points?: string;              // e.g. "175,000 MR"
  spend?: string;               // e.g. "Spend $8,000"
  timeframeMonths?: number;     // e.g. 6
  estValueUsdLow?: number;      // e.g. 1800
  estValueUsdHigh?: number;     // e.g. 2600
  note?: string;                // "Offers vary..."
};

// Card category for tier organization
export type CardCategory = "popular" | "hotel" | "airline" | "other";

export type Card = {
  key: string;
  name: string;
  issuer: string;
  annualFee: number;
  creditsTrackedAnnualized: number;
  logo: string;
  pointsProgram: PointsProgram;
  earnRates: EarnRates;
  welcomeBonus?: WelcomeBonus;
  multipliers: Multiplier[];
  credits: Credit[];
  category: CardCategory;
};

// Point values for calculations (conservative estimates)
export const DEFAULT_POINT_VALUES_USD: Record<Exclude<PointsProgram, "cashback">, number> = {
  amex_mr: 0.015,
  chase_ur: 0.015,
  cap1_miles: 0.01,
  citi_typ: 0.012,
  aa_miles: 0.013,
  delta_miles: 0.012,
  marriott_points: 0.008,
  hilton_points: 0.006,
};

export function pointValueUsd(program: PointsProgram): number {
  if (program === "cashback") return 1.0;
  return DEFAULT_POINT_VALUES_USD[program];
}

// Helper to display welcome bonus range
export function getWelcomeBonusDisplay(card: Card): string | null {
  if (!card.welcomeBonus) return null;
  const { estValueUsdLow, estValueUsdHigh } = card.welcomeBonus;
  if (estValueUsdLow && estValueUsdHigh) {
    return `$${estValueUsdLow.toLocaleString()}–$${estValueUsdHigh.toLocaleString()}`;
  }
  return null;
}

// Pinned top 3 cards (always shown first in Tier 3 Popular)
export const PINNED_TOP_3: string[] = ["amex-platinum", "chase-sapphire-reserve", "capitalone-venture-x"];

export const CARDS: Card[] = [
  // ========== TIER 3: $500+ ==========
  {
    key: "amex-platinum",
    name: "The Platinum Card",
    issuer: "American Express",
    annualFee: 695,
    creditsTrackedAnnualized: 1800,
    logo: "/logos/amex-platinum.png",
    pointsProgram: "amex_mr",
    earnRates: { travel: 5, other: 1 },
    category: "popular",
    welcomeBonus: {
      points: "150,000 MR",
      spend: "$8,000",
      timeframeMonths: 6,
      estValueUsdLow: 2250,
      estValueUsdHigh: 3000,
      note: "Offers vary by applicant/time",
    },
    multipliers: [
      { label: "Flights booked direct or via Amex Travel", x: 5 },
      { label: "Prepaid hotels via Amex Travel", x: 5 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "plat-uber", title: "Uber Cash", amount: 15, frequency: "monthly", notes: "$35 in December" },
      { id: "plat-saks", title: "Saks Fifth Avenue", amount: 50, frequency: "semiannual" },
      { id: "plat-airline", title: "Airline Incidental Fee", amount: 200, frequency: "annual" },
      { id: "plat-hotel", title: "Hotel Credit (FHR/THC)", amount: 200, frequency: "annual" },
      { id: "plat-digital", title: "Digital Entertainment", amount: 20, frequency: "monthly" },
      { id: "plat-equinox", title: "Equinox", amount: 25, frequency: "monthly" },
      { id: "plat-clear", title: "CLEAR Plus", amount: 189, frequency: "annual" },
      { id: "plat-global-entry", title: "Global Entry/TSA PreCheck", amount: 100, frequency: "every5years" },
    ],
  },
  {
    key: "chase-sapphire-reserve",
    name: "Sapphire Reserve",
    issuer: "Chase",
    annualFee: 550,
    creditsTrackedAnnualized: 550,
    logo: "/logos/chase-sapphire-reserve.png",
    pointsProgram: "chase_ur",
    earnRates: { travel: 3, dining: 3, other: 1 },
    category: "popular",
    welcomeBonus: {
      points: "60,000 UR",
      spend: "$4,000",
      timeframeMonths: 3,
      estValueUsdLow: 900,
      estValueUsdHigh: 1200,
      note: "Standard offer",
    },
    multipliers: [
      { label: "Travel & dining", x: 3 },
      { label: "Everything else", x: 1 },
      { label: "1.5x when redeemed via Chase Travel", x: 1.5 },
    ],
    credits: [
      { id: "csr-travel", title: "Annual Travel Credit", amount: 300, frequency: "annual" },
      { id: "csr-doordash", title: "DoorDash DashPass", amount: 60, frequency: "annual", notes: "Complimentary membership" },
      { id: "csr-lyft", title: "Lyft Pink", amount: 60, frequency: "annual" },
      { id: "csr-global-entry", title: "Global Entry/TSA PreCheck", amount: 100, frequency: "every5years" },
    ],
  },
  {
    key: "capitalone-venture-x",
    name: "Venture X",
    issuer: "Capital One",
    annualFee: 395,
    creditsTrackedAnnualized: 500,
    logo: "/logos/capitalone-venture-x.png",
    pointsProgram: "cap1_miles",
    earnRates: { travel: 5, other: 2 },
    category: "popular",
    welcomeBonus: {
      points: "75,000 miles",
      spend: "$4,000",
      timeframeMonths: 3,
      estValueUsdLow: 750,
      estValueUsdHigh: 1125,
      note: "Standard offer",
    },
    multipliers: [
      { label: "Hotels & rental cars via Capital One Travel", x: 10 },
      { label: "Flights via Capital One Travel", x: 5 },
      { label: "Everything else", x: 2 },
    ],
    credits: [
      { id: "vx-travel", title: "Annual Travel Credit", amount: 300, frequency: "annual" },
      { id: "vx-anniversary", title: "Anniversary Bonus Miles", amount: 100, frequency: "annual", notes: "10,000 miles = $100" },
      { id: "vx-global-entry", title: "Global Entry/TSA PreCheck", amount: 100, frequency: "every5years" },
    ],
  },
  {
    key: "hilton-aspire",
    name: "Hilton Honors Aspire",
    issuer: "American Express",
    annualFee: 550,
    creditsTrackedAnnualized: 700,
    logo: "/logos/hilton-aspire.png",
    pointsProgram: "hilton_points",
    earnRates: { travel: 14, dining: 7, other: 3 },
    category: "hotel",
    welcomeBonus: {
      points: "175,000 Hilton",
      spend: "$6,000",
      timeframeMonths: 6,
      estValueUsdLow: 875,
      estValueUsdHigh: 1400,
      note: "Offers vary",
    },
    multipliers: [
      { label: "Hilton purchases", x: 14 },
      { label: "Flights, restaurants, car rentals", x: 7 },
      { label: "Everything else", x: 3 },
    ],
    credits: [
      { id: "aspire-resort", title: "Hilton Resort Credit", amount: 200, frequency: "annual" },
      { id: "aspire-airline", title: "Airline Incidental Fee", amount: 250, frequency: "annual" },
      { id: "aspire-freenight", title: "Free Night Award", amount: 200, frequency: "annual", notes: "Estimated value" },
    ],
  },
  {
    key: "marriott-brilliant",
    name: "Marriott Bonvoy Brilliant",
    issuer: "American Express",
    annualFee: 650,
    creditsTrackedAnnualized: 700,
    logo: "/logos/marriott-brilliant.png",
    pointsProgram: "marriott_points",
    earnRates: { travel: 6, dining: 3, other: 2 },
    category: "hotel",
    welcomeBonus: {
      points: "185,000 Marriott",
      spend: "$6,000",
      timeframeMonths: 6,
      estValueUsdLow: 1295,
      estValueUsdHigh: 1850,
      note: "Offers vary",
    },
    multipliers: [
      { label: "Marriott purchases", x: 6 },
      { label: "Flights, restaurants", x: 3 },
      { label: "Everything else", x: 2 },
    ],
    credits: [
      { id: "brilliant-dining", title: "Dining Credit", amount: 25, frequency: "monthly" },
      { id: "brilliant-freenight", title: "Free Night Award", amount: 300, frequency: "annual", notes: "85K cert value est." },
      { id: "brilliant-global-entry", title: "Global Entry/TSA PreCheck", amount: 100, frequency: "every5years" },
    ],
  },
  {
    key: "delta-reserve",
    name: "Delta SkyMiles Reserve",
    issuer: "American Express",
    annualFee: 650,
    creditsTrackedAnnualized: 400,
    logo: "/logos/delta-reserve.png",
    pointsProgram: "delta_miles",
    earnRates: { travel: 3, dining: 1, other: 1 },
    category: "airline",
    welcomeBonus: {
      points: "90,000 Delta Miles",
      spend: "$6,000",
      timeframeMonths: 6,
      estValueUsdLow: 1080,
      estValueUsdHigh: 1440,
      note: "Offers vary",
    },
    multipliers: [
      { label: "Delta purchases", x: 3 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "delta-companion", title: "Companion Certificate", amount: 300, frequency: "annual", notes: "Estimated value" },
      { id: "delta-global-entry", title: "Global Entry/TSA PreCheck", amount: 100, frequency: "every5years" },
    ],
  },
  {
    key: "citi-strata-premier",
    name: "Citi Strata Premier",
    issuer: "Citi",
    annualFee: 95,
    creditsTrackedAnnualized: 100,
    logo: "/logos/citi-strata.png",
    pointsProgram: "citi_typ",
    earnRates: { travel: 3, dining: 3, groceries: 3, gas: 3, other: 1 },
    category: "other",
    welcomeBonus: {
      points: "75,000 TYP",
      spend: "$4,000",
      timeframeMonths: 3,
      estValueUsdLow: 750,
      estValueUsdHigh: 1125,
      note: "Standard offer",
    },
    multipliers: [
      { label: "Travel, dining, groceries, gas", x: 3 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "strata-hotel", title: "Annual Hotel Savings", amount: 100, frequency: "annual", notes: "$100 off $500+ stay" },
    ],
  },
  // ========== TIER 2: $250-500 ==========
  {
    key: "amex-gold",
    name: "American Express Gold",
    issuer: "American Express",
    annualFee: 325,
    creditsTrackedAnnualized: 380,
    logo: "/logos/amex-gold.png",
    pointsProgram: "amex_mr",
    earnRates: { dining: 4, groceries: 4, travel: 3, other: 1 },
    category: "popular",
    welcomeBonus: {
      points: "60,000 MR",
      spend: "$6,000",
      timeframeMonths: 6,
      estValueUsdLow: 900,
      estValueUsdHigh: 1200,
      note: "Offers vary",
    },
    multipliers: [
      { label: "Restaurants worldwide", x: 4 },
      { label: "US supermarkets (up to $25K/yr)", x: 4 },
      { label: "Flights booked direct or via Amex Travel", x: 3 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "gold-uber", title: "Uber Cash", amount: 10, frequency: "monthly" },
      { id: "gold-dining", title: "Dining Credit", amount: 10, frequency: "monthly" },
      { id: "gold-dunkin", title: "Dunkin' Credit", amount: 7, frequency: "monthly" },
    ],
  },
  {
    key: "boa-premium-rewards",
    name: "Premium Rewards",
    issuer: "Bank of America",
    annualFee: 95,
    creditsTrackedAnnualized: 100,
    logo: "/logos/boa-premium.png",
    pointsProgram: "cashback",
    earnRates: { travel: 2, dining: 2, other: 1.5 },
    category: "other",
    welcomeBonus: {
      points: "60,000 points",
      spend: "$4,000",
      timeframeMonths: 3,
      estValueUsdLow: 600,
      estValueUsdHigh: 600,
      note: "Standard offer",
    },
    multipliers: [
      { label: "Travel & dining", x: 2 },
      { label: "Everything else", x: 1.5 },
    ],
    credits: [
      { id: "boa-airline", title: "Airline Incidental Credit", amount: 100, frequency: "annual" },
    ],
  },
  // ========== TIER 1: $0-250 ==========
  {
    key: "chase-sapphire-preferred",
    name: "Sapphire Preferred",
    issuer: "Chase",
    annualFee: 95,
    creditsTrackedAnnualized: 60,
    logo: "/logos/chase-sapphire-preferred.png",
    pointsProgram: "chase_ur",
    earnRates: { travel: 5, dining: 3, online: 3, other: 1 },
    category: "popular",
    welcomeBonus: {
      points: "60,000 UR",
      spend: "$4,000",
      timeframeMonths: 3,
      estValueUsdLow: 750,
      estValueUsdHigh: 1200,
      note: "Standard offer",
    },
    multipliers: [
      { label: "Travel via Chase Travel", x: 5 },
      { label: "Dining, online groceries, streaming", x: 3 },
      { label: "Other travel", x: 2 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "csp-hotel", title: "Annual Hotel Credit", amount: 50, frequency: "annual", notes: "Via Chase Travel" },
    ],
  },
  {
    key: "amex-green",
    name: "American Express Green",
    issuer: "American Express",
    annualFee: 150,
    creditsTrackedAnnualized: 200,
    logo: "/logos/amex-green.png",
    pointsProgram: "amex_mr",
    earnRates: { travel: 3, dining: 3, other: 1 },
    category: "popular",
    welcomeBonus: {
      points: "40,000 MR",
      spend: "$3,000",
      timeframeMonths: 6,
      estValueUsdLow: 600,
      estValueUsdHigh: 800,
      note: "Offers vary",
    },
    multipliers: [
      { label: "Travel & transit", x: 3 },
      { label: "Restaurants", x: 3 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "green-clear", title: "CLEAR Plus", amount: 189, frequency: "annual" },
      { id: "green-lounge", title: "LoungeBuddy", amount: 100, frequency: "annual", notes: "Airport lounge access" },
    ],
  },
  {
    key: "hilton-surpass",
    name: "Hilton Honors Surpass",
    issuer: "American Express",
    annualFee: 150,
    creditsTrackedAnnualized: 150,
    logo: "/logos/hilton-surpass.png",
    pointsProgram: "hilton_points",
    earnRates: { travel: 12, dining: 6, groceries: 6, gas: 6, other: 3 },
    category: "hotel",
    welcomeBonus: {
      points: "130,000 Hilton",
      spend: "$3,000",
      timeframeMonths: 6,
      estValueUsdLow: 650,
      estValueUsdHigh: 1040,
      note: "Offers vary",
    },
    multipliers: [
      { label: "Hilton purchases", x: 12 },
      { label: "Restaurants, supermarkets, gas", x: 6 },
      { label: "Everything else", x: 3 },
    ],
    credits: [
      { id: "surpass-freenight", title: "Free Night Reward", amount: 150, frequency: "annual", notes: "After $15K spend" },
    ],
  },
  {
    key: "united-quest",
    name: "United Quest",
    issuer: "Chase",
    annualFee: 250,
    creditsTrackedAnnualized: 275,
    logo: "/logos/united-quest.png",
    pointsProgram: "chase_ur",
    earnRates: { travel: 3, dining: 2, other: 1 },
    category: "airline",
    welcomeBonus: {
      points: "70,000 United Miles",
      spend: "$4,000",
      timeframeMonths: 3,
      estValueUsdLow: 840,
      estValueUsdHigh: 1120,
      note: "Standard offer",
    },
    multipliers: [
      { label: "United purchases", x: 3 },
      { label: "Dining, hotels", x: 2 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "quest-tsa", title: "TSA PreCheck/Global Entry", amount: 125, frequency: "every5years" },
      { id: "quest-award", title: "Award Flight Credit", amount: 125, frequency: "annual", notes: "Up to $125 back" },
    ],
  },
  {
    key: "delta-gold",
    name: "Delta SkyMiles Gold",
    issuer: "American Express",
    annualFee: 150,
    creditsTrackedAnnualized: 0,
    logo: "/logos/delta-gold.png",
    pointsProgram: "delta_miles",
    earnRates: { travel: 2, dining: 2, groceries: 2, other: 1 },
    category: "airline",
    welcomeBonus: {
      points: "70,000 Delta Miles",
      spend: "$3,000",
      timeframeMonths: 6,
      estValueUsdLow: 840,
      estValueUsdHigh: 1120,
      note: "Offers vary",
    },
    multipliers: [
      { label: "Delta purchases", x: 2 },
      { label: "Restaurants, US supermarkets", x: 2 },
      { label: "Everything else", x: 1 },
    ],
    credits: [],
  },
  {
    key: "marriott-boundless",
    name: "Marriott Bonvoy Boundless",
    issuer: "Chase",
    annualFee: 95,
    creditsTrackedAnnualized: 250,
    logo: "/logos/marriott-boundless.png",
    pointsProgram: "marriott_points",
    earnRates: { travel: 6, other: 2 },
    category: "hotel",
    welcomeBonus: {
      points: "85,000 Marriott",
      spend: "$4,000",
      timeframeMonths: 3,
      estValueUsdLow: 595,
      estValueUsdHigh: 850,
      note: "Standard offer",
    },
    multipliers: [
      { label: "Marriott purchases", x: 6 },
      { label: "Everything else", x: 2 },
    ],
    credits: [
      { id: "boundless-freenight", title: "Free Night Award", amount: 250, frequency: "annual", notes: "35K cert value est." },
    ],
  },
];
