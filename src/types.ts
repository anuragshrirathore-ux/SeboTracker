export type FoodCategory = 
  | "Sugary Dairy" 
  | "Creamy Gravy" 
  | "Deep Fried" 
  | "Sweet Tea" 
  | "Home Meal/Veg" 
  | "Lean Protein/Grilled";

export const FOOD_SCORES: Record<FoodCategory, number> = {
  "Sugary Dairy": 4,
  "Creamy Gravy": 3,
  "Deep Fried": 2,
  "Sweet Tea": 1,
  "Home Meal/Veg": 0,
  "Lean Protein/Grilled": -1,
};

export type FoodFlag = "Red" | "Yellow" | "Green";

export interface FoodLogEntry {
  id: string;
  timestamp: string;
  category: FoodCategory;
  flag: FoodFlag;
  reason: string;
  regularity_warning?: string;
  image?: string;
  score: number;
  calories?: number;
}

export interface DailyLog {
  date: string;
  food_score: number;
  sleep_penalty: number;
  stress_penalty: number;
  medication_mitigation: number;
  total_srs: number;
  food_items: FoodLogEntry[];
  sleep_start?: string;
  sleep_end?: string;
  // New Biological & Lifestyle Flags
  slept_after_1am: boolean;
  travel_day: boolean;
  // Care Actions
  shampoo_done: boolean;
  cream_applied: boolean;
  // Skin Symptoms (ML Labels)
  itch_level: number;
  flakes: number;
  redness: number;
  calories?: number;
}

export interface Prediction {
  risk: "low" | "high";
  message: string;
  srs: number;
}
