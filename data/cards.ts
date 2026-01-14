// data/cards.ts

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
  amount: number; // amount PER period (NOT annualized)
  frequency: CreditFrequency;
  notes?: string; // any extra detail / label
  renews?: string; // display-only like "Renews Jan 1"
};

export type Multiplier = {
  label: string;
  x: number;
};

export type Card = {
  key: string;
  name: string;
  issuer: string;
  annualFee: number;
  creditsTrackedAnnualized: number; // display hint only (optional)
  logo: string; // "/logos/xxx.png"
  welcomeBonus?: {
    headline: string;
    details?: string;
    valueEstimateUsd?: number;
    note?: string;
  };
  multipliers: Multiplier[];
  credits: Credit[];
};

export const DEFAULT_POINT_VALUES_USD = {
  amex_mr: 0.015,
  chase_ur: 0.015,
  cap1_miles: 0.01,
  citi_typ: 0.012,
  aa_miles: 0.013,
  delta_miles: 0.012,
  marriott_points: 0.008,
  hilton_points: 0.006,
};

export const CARDS: Card[] = [
  {
    key: "amex-platinum",
    name: "Platinum Card",
    issuer: "American Express",
    annualFee: 895,
    creditsTrackedAnnualized: 3074,
    logo: "/logos/amex-platinum.png",
    welcomeBonus: {
      headline: "175,000 MR",
      details: "Spend $8,000 in 6 months",
      valueEstimateUsd: 2625,
      note: "Offers vary by applicant/time.",
    },
    multipliers: [
      { label: "Booked directly through flight or Amex Travel", x: 5 },
      { label: "Prepaid hotels on AmexTravel", x: 5 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "plat-airline-incidental", title: "Airline Incidental Fees", amount: 200, frequency: "annual" },
      { id: "plat-clear", title: "Clear Plus", amount: 209, frequency: "annual" },
      { id: "plat-digital-entertainment", title: "Digital Entertainment", amount: 25, frequency: "monthly", renews: "Renews Jan 1" },
      { id: "plat-fhr-hotel-collection", title: "Fine Hotels + Resorts® / Hotel Collection", amount: 300, frequency: "semiannual" },
      { id: "plat-lululemon", title: "Lululemon", amount: 75, frequency: "quarterly" },
      { id: "plat-oura", title: "Oura Ring", amount: 200, frequency: "annual" },
      { id: "plat-resy", title: "Resy Restaurants", amount: 100, frequency: "quarterly" },
      { id: "plat-saks", title: "Saks", amount: 50, frequency: "semiannual" },
      { id: "plat-uber-one", title: "Uber One Subscription", amount: 120, frequency: "annual" },
      { id: "plat-uber-cash-jan-nov", title: "Uber Cash (Jan–Nov)", amount: 15, frequency: "monthly" },
      { id: "plat-uber-cash-dec", title: "Uber Cash (Dec)", amount: 35, frequency: "monthly", notes: "December only" },
      { id: "plat-equinox", title: "Equinox", amount: 300, frequency: "annual" },
      { id: "plat-walmartplus", title: "Walmart+ Subscription", amount: 12.95, frequency: "monthly" },
    ],
  },

  {
    key: "chase-sapphire-reserve",
    name: "Chase Sapphire Reserve",
    issuer: "Chase",
    annualFee: 795,
    creditsTrackedAnnualized: 2817,
    logo: "/logos/chase-sapphire-reserve.png",
    multipliers: [
      { label: "Chase travel", x: 8 },
      { label: "Flights booked direct / Amex Travel (sheet)", x: 4 },
      { label: "Hotels booked direct (sheet)", x: 4 },
      { label: "Dining", x: 3 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "csr-apple-tv", title: "Apple TV+", amount: 288, frequency: "annual", notes: "Sheet: points" },
      { id: "csr-dining-credit", title: "Dining Credit", amount: 150, frequency: "semiannual" },
      { id: "csr-doordash-dashpass", title: "DoorDash DashPass Subscription", amount: 120, frequency: "annual" },
      { id: "csr-doordash-restaurants", title: "DoorDash Restaurant", amount: 5, frequency: "monthly" },
      { id: "csr-doordash-retail-10a", title: "DoorDash Retail", amount: 10, frequency: "monthly" },
      { id: "csr-doordash-retail-10b", title: "DoorDash Retail (2nd $10 line in sheet)", amount: 10, frequency: "monthly" },
      { id: "csr-hotel-the-edit", title: "Hotel (The Edit)", amount: 250, frequency: "semiannual" },
      { id: "csr-lyft", title: "Lyft", amount: 10, frequency: "monthly" },
      { id: "csr-stubhub", title: "StubHub", amount: 150, frequency: "semiannual" },
      { id: "csr-travel", title: "Travel", amount: 300, frequency: "annual" },
      { id: "csr-peloton", title: "Peloton", amount: 10, frequency: "monthly" },
      { id: "csr-global-entry", title: "Global Entry / TSA PreCheck / NEXUS fee", amount: 120, frequency: "every4years" },
      { id: "csr-priority-pass", title: "Priority Pass", amount: 469, frequency: "annual", notes: "Value line in sheet" },
    ],
  },

  {
    key: "capitalone-venture-x",
    name: "Venture X",
    issuer: "Capital One",
    annualFee: 395,
    creditsTrackedAnnualized: 400,
    logo: "/logos/capitalone-venture-x.png",
    multipliers: [
      { label: "Hotels & rental cars booked through Capital One Travel", x: 10 },
      { label: "Flights & vacation rentals booked through Capital One Travel", x: 5 },
      { label: "Everything else", x: 2 },
    ],
    credits: [
      { id: "vx-travel", title: "Travel", amount: 300, frequency: "annual" },
      { id: "vx-global-entry", title: "Global Entry / TSA PreCheck / NEXUS fee", amount: 120, frequency: "every4years" },
      // REQUIRED CHANGE: $100 anniversary bonus miles credit
      { id: "vx-anniversary-bonus", title: "Anniversary Bonus Miles", amount: 100, frequency: "annual" },
    ],
  },

  {
    key: "amex-gold",
    name: "American Express Gold",
    issuer: "American Express",
    annualFee: 325,
    creditsTrackedAnnualized: 424,
    logo: "/logos/amex-gold.png",
    multipliers: [
      { label: "Restaurant", x: 4 },
      { label: "Groceries", x: 4 },
      { label: "Booked directly through flight or Amex travel (sheet)", x: 3 },
      { label: "Prepaid hotels (sheet)", x: 2 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "gold-uber-cash", title: "Uber Cash", amount: 10, frequency: "monthly" },
      { id: "gold-dunkin", title: "Dunkin", amount: 7, frequency: "monthly" },
      { id: "gold-resy", title: "Resy Restaurants", amount: 50, frequency: "semiannual" },
      { id: "gold-dining", title: "Dining", amount: 10, frequency: "monthly" },
    ],
  },

  {
    key: "hilton-honors-aspire",
    name: "Hilton Honors Aspire",
    issuer: "American Express",
    annualFee: 550,
    creditsTrackedAnnualized: 909,
    logo: "/logos/hilton-honors.png",
    multipliers: [
      { label: "Hilton hotels & resorts (portfolio)", x: 14 },
      { label: "Booked through flight/Amex travel/car rentals (sheet)", x: 7 },
      { label: "Dining", x: 7 },
      { label: "Everything else", x: 3 },
    ],
    credits: [
      { id: "aspire-flights", title: "Flights", amount: 50, frequency: "quarterly" },
      { id: "aspire-clear", title: "Clear Plus", amount: 209, frequency: "annual" },
      { id: "aspire-conrad-waldorf-2night", title: "Conrad/Waldorf Astoria (2 Night)", amount: 100, frequency: "annual" },
      { id: "aspire-hilton-resort", title: "Hilton Resort", amount: 200, frequency: "semiannual" },
    ],
  },

  {
    key: "delta-reserve",
    name: "Delta SkyMiles® Reserve (Amex)",
    issuer: "American Express",
    annualFee: 650,
    creditsTrackedAnnualized: 560,
    logo: "/logos/delta-reserve.png",
    multipliers: [
      { label: "Delta purchases directly", x: 3 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "delta-reserve-resy", title: "Resy Restaurants", amount: 20, frequency: "monthly" },
      { id: "delta-reserve-rideshare", title: "Rideshare", amount: 10, frequency: "monthly" },
      { id: "delta-reserve-delta-stays", title: "Delta Stays", amount: 200, frequency: "annual" },
    ],
  },

  {
    key: "marriott-brilliant",
    name: "Marriott Bonvoy Brilliant® (Amex)",
    issuer: "American Express",
    annualFee: 650,
    creditsTrackedAnnualized: 400,
    logo: "/logos/marriott-brilliant.png",
    multipliers: [
      { label: "Marriott hotels & resorts", x: 6 },
      { label: "Restaurant", x: 3 },
      { label: "Flights", x: 3 },
      { label: "Everything else", x: 2 },
    ],
    credits: [
      { id: "brilliant-dining", title: "Dining", amount: 25, frequency: "monthly" },
      { id: "brilliant-ritz-stregis", title: "Ritz-Carlton® / St. Regis®", amount: 100, frequency: "annual" },
      { id: "brilliant-global-entry", title: "Global Entry", amount: 120, frequency: "every4years" },
      { id: "brilliant-tsa-precheck", title: "TSA PreCheck / NEXUS fee", amount: 85, frequency: "every5years" },
    ],
  },

  {
    key: "citi-strata-elite",
    name: "Citi Strata Elite℠",
    issuer: "Citi",
    annualFee: 595,
    creditsTrackedAnnualized: 1169,
    logo: "/logos/citi-strata-elite.png",
    multipliers: [
      { label: "Hotels/Car Rentals/Attractions on Citi travel", x: 12 },
      { label: "Air Travel on Citi travel", x: 6 },
      { label: "Restaurants on Citi Nights (Fri/Sat 6pm–6am ET)", x: 6 },
      { label: "Restaurants other times", x: 3 },
      { label: "Everything else", x: 1.5 },
    ],
    credits: [
      { id: "strata-hotel", title: "Hotel", amount: 300, frequency: "annual" },
      { id: "strata-splurge", title: "Splurge (1stDibs / AA / Best Buy / Future / Live Nation)", amount: 200, frequency: "annual" },
      { id: "strata-blacklane", title: "Annual Blacklane", amount: 200, frequency: "annual" },
      { id: "strata-priority-pass", title: "Priority Pass", amount: 469, frequency: "annual", notes: "Value line in sheet" },
    ],
  },

  {
    key: "citi-aa-executive",
    name: "Citi® / AAdvantage® Executive",
    issuer: "Citi",
    annualFee: 595,
    creditsTrackedAnnualized: 440,
    logo: "/logos/citi-aa-executive.png",
    multipliers: [
      { label: "American Airlines purchases", x: 4 },
      { label: "Hotels & car rentals via AA portal", x: 10 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "aaexec-lyft", title: "Lyft (after 3 rides exception)", amount: 10, frequency: "monthly" },
      { id: "aaexec-grubhub", title: "Grubhub", amount: 10, frequency: "monthly" },
      { id: "aaexec-car-rentals", title: "Car rentals", amount: 120, frequency: "annual", notes: "Sheet annualized shown as $200; keep per-sheet line amount=120" },
    ],
  },
];
