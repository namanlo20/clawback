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
  amount: number; // amount PER period (not annualized)
  frequency: CreditFrequency;
  notes?: string;
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
  creditsTrackedAnnualized: number; // from your sheet totals
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
  // -------------------------
  // Chase Sapphire Reserve
  // -------------------------
  {
    key: "chase-sapphire-reserve",
    name: "Chase Sapphire Reserve",
    issuer: "Chase",
    annualFee: 795,
    creditsTrackedAnnualized: 2817,
    logo: "/logos/chase-sapphire-reserve.png",
    multipliers: [
      { label: "Chase travel", x: 8 },
      { label: "Flights booked direct", x: 4 },
      { label: "Hotels booked direct", x: 4 },
      { label: "Dining", x: 3 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "csr-apple-tv", title: "Apple TV+", amount: 288, frequency: "annual", notes: "Sheet: points" }, // :contentReference[oaicite:3]{index=3}
      { id: "csr-dining", title: "Dining Credit", amount: 150, frequency: "semiannual" }, // :contentReference[oaicite:4]{index=4}
      { id: "csr-doordash-dashpass", title: "DoorDash Dashpass Subscription", amount: 120, frequency: "annual" }, // :contentReference[oaicite:5]{index=5}
      { id: "csr-doordash-restaurant", title: "DoorDash Restaurant", amount: 5, frequency: "monthly" }, // :contentReference[oaicite:6]{index=6}
      { id: "csr-doordash-retail-a", title: "DoorDash Retail", amount: 10, frequency: "monthly" }, // :contentReference[oaicite:7]{index=7}
      { id: "csr-doordash-retail-b", title: "DoorDash Retail (second line)", amount: 10, frequency: "monthly" }, // :contentReference[oaicite:8]{index=8}
      { id: "csr-hotel-the-edit", title: "Hotel (The Edit)", amount: 250, frequency: "semiannual" }, // :contentReference[oaicite:9]{index=9}
      { id: "csr-lyft", title: "Lyft", amount: 10, frequency: "monthly" }, // :contentReference[oaicite:10]{index=10}
      { id: "csr-stubhub", title: "Stubhub", amount: 150, frequency: "semiannual" }, // :contentReference[oaicite:11]{index=11}
      { id: "csr-travel", title: "Travel", amount: 300, frequency: "annual" }, // :contentReference[oaicite:12]{index=12}
      { id: "csr-peloton", title: "Peloton", amount: 10, frequency: "monthly" }, // :contentReference[oaicite:13]{index=13}
      { id: "csr-global-entry", title: "Global Entry / TSA PreCheck / NEXUS fee", amount: 120, frequency: "every4years" }, // :contentReference[oaicite:14]{index=14}
      { id: "csr-priority-pass", title: "Priority Pass", amount: 469, frequency: "annual" }, // sheet lists $469 as a line item :contentReference[oaicite:15]{index=15}
    ],
  },

  // -------------------------
  // Hilton Aspire
  // -------------------------
  {
    key: "hilton-honors-aspire",
    name: "Hilton Honors Aspire",
    issuer: "American Express",
    annualFee: 550,
    creditsTrackedAnnualized: 909,
    logo: "/logos/hilton-honors.png",
    multipliers: [
      { label: "Hilton portfolio purchases", x: 14 },
      { label: "Flights/AmexTravel/Car rentals", x: 7 },
      { label: "Dining", x: 7 },
      { label: "Everything else", x: 3 },
    ],
    credits: [
      { id: "aspire-flights", title: "Flights", amount: 50, frequency: "quarterly" }, // :contentReference[oaicite:16]{index=16}
      { id: "aspire-clear", title: "Clear Plus", amount: 209, frequency: "annual" }, // :contentReference[oaicite:17]{index=17}
      { id: "aspire-conrad-waldorf", title: "Conrad/Waldorf Astoria 2 Night", amount: 100, frequency: "annual" }, // :contentReference[oaicite:18]{index=18}
      { id: "aspire-hilton-resort", title: "Hilton Resort", amount: 200, frequency: "semiannual" }, // :contentReference[oaicite:19]{index=19}
    ],
  },

  // -------------------------
  // Amex Platinum
  // -------------------------
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
      { label: "Flights booked direct / Amex Travel", x: 5 },
      { label: "Prepaid hotels on AmexTravel", x: 5 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "plat-airline", title: "Airline Incidental Fees", amount: 200, frequency: "annual" }, // :contentReference[oaicite:20]{index=20}
      { id: "plat-clear", title: "Clear Plus", amount: 209, frequency: "annual" }, // :contentReference[oaicite:21]{index=21}
      { id: "plat-digital", title: "Digital Entertainment", amount: 25, frequency: "monthly" }, // :contentReference[oaicite:22]{index=22}
      { id: "plat-fhr-hotel", title: "Fine Hotels + Resorts / Hotel Collection", amount: 300, frequency: "semiannual" }, // :contentReference[oaicite:23]{index=23}
      { id: "plat-lululemon", title: "Lululemon", amount: 75, frequency: "quarterly" }, // :contentReference[oaicite:24]{index=24}
      { id: "plat-oura", title: "Oura Ring", amount: 200, frequency: "annual" }, // :contentReference[oaicite:25]{index=25}
      { id: "plat-resy", title: "Resy Restaurants", amount: 100, frequency: "quarterly" }, // :contentReference[oaicite:26]{index=26}
      { id: "plat-saks", title: "Saks", amount: 50, frequency: "semiannual" }, // :contentReference[oaicite:27]{index=27}
      { id: "plat-uber-one", title: "Uber One Subscription", amount: 120, frequency: "annual" }, // :contentReference[oaicite:28]{index=28}
      { id: "plat-uber-jan-nov", title: "Uber Cash (Jan–Nov)", amount: 15, frequency: "monthly" }, // :contentReference[oaicite:29]{index=29}
      { id: "plat-uber-dec", title: "Uber Cash (Dec)", amount: 35, frequency: "monthly", notes: "December only" }, // :contentReference[oaicite:30]{index=30}
      { id: "plat-equinox", title: "Equinox", amount: 300, frequency: "annual" }, // :contentReference[oaicite:31]{index=31}
      { id: "plat-walmartplus", title: "Walmart+ Subscription", amount: 12.95, frequency: "monthly" }, // :contentReference[oaicite:32]{index=32}
    ],
  },

  // -------------------------
  // Amex Gold
  // -------------------------
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
      { label: "Flights (direct/Amex travel)", x: 3 },
      { label: "Prepaid hotels", x: 2 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "gold-uber", title: "Uber Cash", amount: 10, frequency: "monthly" }, // :contentReference[oaicite:33]{index=33}
      { id: "gold-dunkin", title: "Dunkin", amount: 7, frequency: "monthly" }, // :contentReference[oaicite:34]{index=34}
      { id: "gold-resy", title: "Resy Restaurants", amount: 50, frequency: "semiannual" }, // :contentReference[oaicite:35]{index=35}
      { id: "gold-dining", title: "Dining", amount: 10, frequency: "monthly" }, // :contentReference[oaicite:36]{index=36}
    ],
  },

  // -------------------------
  // Venture X
  // -------------------------
  {
    key: "capitalone-venture-x",
    name: "Venture X",
    issuer: "Capital One",
    annualFee: 395,
    creditsTrackedAnnualized: 400,
    logo: "/logos/capitalone-venture-x.png",
    multipliers: [
      { label: "Hotels & rental cars via Capital One Travel", x: 10 },
      { label: "Flights & vacation rentals via Capital One Travel", x: 5 },
      { label: "Everything else", x: 2 },
    ],
    credits: [
      { id: "vx-travel", title: "Travel", amount: 300, frequency: "annual" }, // :contentReference[oaicite:37]{index=37}
      { id: "vx-global-entry", title: "Global Entry / TSA PreCheck / NEXUS fee", amount: 120, frequency: "every4years" }, // :contentReference[oaicite:38]{index=38}
      { id: "vx-anniversary", title: "Anniversary Bonus Miles", amount: 100, frequency: "annual" }, // REQUIRED: $100 :contentReference[oaicite:39]{index=39}
    ],
  },

  // -------------------------
  // Delta Reserve
  // -------------------------
  {
    key: "delta-reserve",
    name: "Delta SkyMiles Reserve (Amex)",
    issuer: "American Express",
    annualFee: 650,
    creditsTrackedAnnualized: 560,
    logo: "/logos/delta-reserve.png",
    multipliers: [
      { label: "Delta purchases directly", x: 3 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "delta-resy", title: "Resy Restaurants", amount: 20, frequency: "monthly" }, // :contentReference[oaicite:40]{index=40}
      { id: "delta-rideshare", title: "Rideshare", amount: 10, frequency: "monthly" }, // :contentReference[oaicite:41]{index=41}
      { id: "delta-stays", title: "Delta Stays", amount: 200, frequency: "annual" }, // :contentReference[oaicite:42]{index=42}
    ],
  },

  // -------------------------
  // Marriott Brilliant
  // -------------------------
  {
    key: "marriott-brilliant",
    name: "Marriott Bonvoy Brilliant (Amex)",
    issuer: "American Express",
    annualFee: 650,
    creditsTrackedAnnualized: 400,
    logo: "/logos/marriott-brilliant.png",
    multipliers: [
      { label: "Marriott portfolio purchases", x: 6 },
      { label: "Restaurant", x: 3 },
      { label: "Flights", x: 3 },
      { label: "Everything else", x: 2 },
    ],
    credits: [
      { id: "brilliant-dining", title: "Dining", amount: 25, frequency: "monthly" }, // :contentReference[oaicite:43]{index=43}
      { id: "brilliant-ritz-stregis", title: "The Ritz-Carlton / St. Regis", amount: 100, frequency: "annual" }, // :contentReference[oaicite:44]{index=44}
      { id: "brilliant-global-entry", title: "Global Entry", amount: 120, frequency: "every4years" }, // :contentReference[oaicite:45]{index=45}
      { id: "brilliant-tsa", title: "TSA PreCheck / NEXUS fee", amount: 85, frequency: "every5years" }, // :contentReference[oaicite:46]{index=46}
    ],
  },

  // -------------------------
  // Citi Strata Elite
  // -------------------------
  {
    key: "citi-strata-elite",
    name: "Citi Strata Elite",
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
      { id: "strata-hotel", title: "Hotel", amount: 300, frequency: "annual" }, // :contentReference[oaicite:47]{index=47}
      { id: "strata-splurge", title: "Splurge (1stDibs / AA / Best Buy / Future / Live Nation)", amount: 200, frequency: "annual" }, // :contentReference[oaicite:48]{index=48}
      { id: "strata-blacklane", title: "Annual Blacklane", amount: 200, frequency: "annual" }, // :contentReference[oaicite:49]{index=49}
      { id: "strata-priority-pass", title: "Priority Pass", amount: 469, frequency: "annual" }, // :contentReference[oaicite:50]{index=50}
    ],
  },

  // -------------------------
  // Citi AA Executive
  // -------------------------
  {
    key: "citi-aa-executive",
    name: "Citi / AAdvantage Executive",
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
      { id: "aaexec-lyft", title: "Lyft (after 3 rides exception)", amount: 10, frequency: "monthly" }, // :contentReference[oaicite:51]{index=51}
      { id: "aaexec-grubhub", title: "Grubhub", amount: 10, frequency: "monthly" }, // :contentReference[oaicite:52]{index=52}
      { id: "aaexec-car-rentals", title: "Car rentals", amount: 120, frequency: "annual", notes: "Sheet shows annualized $200 but line item $120" }, // :contentReference[oaicite:53]{index=53}
    ],
  },
];
