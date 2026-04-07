export const LPG_ENERGY_DENSITY_MJ_KG = 46;
export const STOVE_EFFICIENCY_DEFAULT = 0.58;
export const ELECTRICITY_PRICE_KWH = 12.5; // Average PHP per kWh
export const LPG_PRICE_PER_KG_DEFAULT = 105; // Average PHP per kg

export interface Ingredient {
  name: string;
  qty: number;
  unit: string;
  cost: number;
}

export interface Recipe {
  id: string;
  name: string;
  pax: number;
  ingredients: Ingredient[];
  instructions: string[];
  cookingMinutes: number;
  basePowerKw: number;
  totalCost: number;
}

export interface Appliance {
  id: string;
  name: string;
  category: string;
  efficiencyRating: string;
  annualKwh: number;
  typicalWattage: number;
  description: string;
}

export const APPLIANCE_DATABASE: Appliance[] = [
  {
    id: 'ref-1',
    name: 'Inverter Refrigerator (Standard)',
    category: 'Kitchen',
    efficiencyRating: 'Energy Star 5-Star',
    annualKwh: 350,
    typicalWattage: 150,
    description: 'Modern inverter model with high efficiency.'
  },
  {
    id: 'ac-1',
    name: 'Split-Type Aircon (1.5 HP)',
    category: 'HVAC',
    efficiencyRating: 'Energy Star 4-Star',
    annualKwh: 1200,
    typicalWattage: 1200,
    description: 'Inverter split-type for medium rooms.'
  },
  {
    id: 'wm-1',
    name: 'Front-Load Washing Machine',
    category: 'Laundry',
    efficiencyRating: 'Energy Star 5-Star',
    annualKwh: 180,
    typicalWattage: 500,
    description: 'Water and energy efficient front-loader.'
  },
  {
    id: 'tv-1',
    name: 'LED TV (55-inch)',
    category: 'Entertainment',
    efficiencyRating: 'Energy Star 4-Star',
    annualKwh: 120,
    typicalWattage: 80,
    description: 'Standard 4K LED television.'
  },
  {
    id: 'wh-1',
    name: 'Electric Water Heater',
    category: 'Bathroom',
    efficiencyRating: '3-Star',
    annualKwh: 2500,
    typicalWattage: 3500,
    description: 'Instant shower heater (high peak usage).'
  },
  {
    id: 'mw-1',
    name: 'Microwave Oven (20L)',
    category: 'Kitchen',
    efficiencyRating: 'Energy Star 4-Star',
    annualKwh: 150,
    typicalWattage: 800,
    description: 'Compact microwave for quick reheating.'
  },
  {
    id: 'dw-1',
    name: 'Dishwasher (Built-in)',
    category: 'Kitchen',
    efficiencyRating: 'Energy Star 5-Star',
    annualKwh: 270,
    typicalWattage: 1200,
    description: 'Water-saving dishwasher with eco-mode.'
  },
  {
    id: 'dry-1',
    name: 'Heat Pump Clothes Dryer',
    category: 'Laundry',
    efficiencyRating: 'Energy Star 6-Star',
    annualKwh: 210,
    typicalWattage: 900,
    description: 'Ultra-efficient heat pump drying technology.'
  }
];

export interface AuditQuestion {
  id: string;
  category: string;
  question: string;
  options: { label: string; value: string; impact: 'low' | 'medium' | 'high' }[];
}

export const AUDIT_QUESTIONS: AuditQuestion[] = [
  {
    id: 'ac-usage',
    category: 'Heating/Cooling',
    question: 'How many hours a day do you use your Air Conditioner?',
    options: [
      { label: 'None', value: '0', impact: 'low' },
      { label: '1-4 hours', value: '1-4', impact: 'low' },
      { label: '5-10 hours', value: '5-10', impact: 'medium' },
      { label: '10+ hours', value: '10+', impact: 'high' }
    ]
  },
  {
    id: 'lighting-type',
    category: 'Lighting',
    question: 'What type of bulbs do you primarily use?',
    options: [
      { label: 'All LED', value: 'led', impact: 'low' },
      { label: 'Mostly LED', value: 'mostly-led', impact: 'low' },
      { label: 'Compact Fluorescent (CFL)', value: 'cfl', impact: 'medium' },
      { label: 'Incandescent', value: 'incandescent', impact: 'high' }
    ]
  },
  {
    id: 'insulation',
    category: 'Insulation',
    question: 'How well-insulated is your home (roof/walls)?',
    options: [
      { label: 'Fully Insulated', value: 'full', impact: 'low' },
      { label: 'Partial Insulation', value: 'partial', impact: 'medium' },
      { label: 'No Insulation', value: 'none', impact: 'high' }
    ]
  },
  {
    id: 'appliance-age',
    category: 'Appliances',
    question: 'How old are your major appliances (Ref, AC)?',
    options: [
      { label: 'Less than 3 years', value: 'new', impact: 'low' },
      { label: '3-7 years', value: 'mid', impact: 'medium' },
      { label: '7+ years', value: 'old', impact: 'high' }
    ]
  }
];

export const HARDCODED_RECIPES: Record<string, (pax: number) => Recipe> = {
  "nilagang baka": (pax: number) => {
    const factor = pax / 8;
    const beefKg = 1.2 * factor;
    const potatoes = 4 * factor;
    const pechay = 3 * factor;
    const corn = 2 * factor;
    const onion = 2 * factor;
    const garlic = 5 * factor;
    const fishSauce = 0.1 * factor;

    const costBeef = 380 * beefKg;
    const costPotato = 15 * potatoes;
    const costPechay = 20 * pechay;
    const costCorn = 25 * corn;
    const costOnion = 10 * (onion / 2);
    const costGarlic = 3 * (garlic / 5);
    const costFishSauce = 12 * (fishSauce / 0.1);
    const costMisc = 15;

    return {
      id: "nilagang-baka",
      name: "Nilagang Baka",
      pax,
      ingredients: [
        { name: "Beef (brisket/chuck)", qty: beefKg, unit: "kg", cost: costBeef },
        { name: "Potato", qty: Math.round(potatoes), unit: "pcs", cost: costPotato },
        { name: "Pechay (bok choy)", qty: Math.round(pechay), unit: "bundles", cost: costPechay },
        { name: "Corn on cob", qty: Math.round(corn), unit: "pcs", cost: costCorn },
        { name: "Onion", qty: Math.round(onion), unit: "pcs", cost: costOnion },
        { name: "Garlic", qty: Math.round(garlic), unit: "cloves", cost: costGarlic },
        { name: "Fish sauce (patis)", qty: fishSauce, unit: "cup", cost: costFishSauce },
        { name: "Peppercorn, salt", qty: 1, unit: "to taste", cost: costMisc },
      ],
      instructions: [
        "Boil beef in 2L water with onion, garlic, peppercorn for 1.5 hours until tender.",
        "Add corn and potatoes, cook for 15 minutes.",
        "Season with fish sauce and salt.",
        "Add pechay leaves, cook for 2 more minutes.",
      ],
      cookingMinutes: 110,
      basePowerKw: 2.8,
      totalCost: costBeef + costPotato + costPechay + costCorn + costOnion + costGarlic + costFishSauce + costMisc,
    };
  },
  "pinapaitan": (pax: number) => {
    const factor = pax / 8;
    const tripe = 0.8 * factor;
    const liver = 0.4 * factor;
    const intestine = 0.6 * factor;
    const bile = 2 * factor;
    const onion = 2 * factor;
    const garlic = 6 * factor;
    const ginger = 0.05 * factor;
    const chili = 4 * factor;
    const vinegar = 0.2 * factor;

    const costTripe = 250 * tripe;
    const costLiver = 220 * liver;
    const costIntestine = 200 * intestine;
    const costBile = 15 * (bile / 2);
    const costOnion = 12 * (onion / 2);
    const costGarlic = 3 * (garlic / 6);
    const costGinger = 40 * ginger;
    const costChili = 2 * chili;
    const costVinegar = 10 * (vinegar / 0.2);

    return {
      id: "pinapaitan",
      name: "Pinapaitan",
      pax,
      ingredients: [
        { name: "Beef tripe", qty: tripe, unit: "kg", cost: costTripe },
        { name: "Beef liver", qty: liver, unit: "kg", cost: costLiver },
        { name: "Beef intestine", qty: intestine, unit: "kg", cost: costIntestine },
        { name: "Bile", qty: bile, unit: "tbsp", cost: costBile },
        { name: "Onion, garlic, ginger", qty: 1, unit: "set", cost: costOnion + costGarlic + costGinger },
        { name: "Chili & vinegar", qty: 1, unit: "set", cost: costChili + costVinegar },
      ],
      instructions: [
        "Boil tripe & intestine with ginger until tender (45 min). Slice.",
        "Sauté garlic, onion, ginger. Add liver and cook.",
        "Add tripe & intestine, pour vinegar (don't stir). Simmer 15 min.",
        "Add bile gradually to achieve bitterness, season with salt & chili.",
        "Simmer 10 min. Serve.",
      ],
      cookingMinutes: 85,
      basePowerKw: 2.9,
      totalCost: costTripe + costLiver + costIntestine + costBile + costOnion + costGarlic + costGinger + costChili + costVinegar + 15,
    };
  },
};

export function calculateLPGConsumption(minutes: number, powerKw: number, efficiency = STOVE_EFFICIENCY_DEFAULT) {
  const hours = minutes / 60;
  const usefulMJ = powerKw * hours * 3.6;
  const requiredChemicalMJ = usefulMJ / efficiency;
  const lpgKg = requiredChemicalMJ / LPG_ENERGY_DENSITY_MJ_KG;
  return Math.max(0.05, parseFloat(lpgKg.toFixed(3)));
}
