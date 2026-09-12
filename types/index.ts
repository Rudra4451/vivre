import type { Database } from "./database.types";

// --- Table Row Types ---
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Attribute = Database["public"]["Tables"]["attributes"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskCompletion = Database["public"]["Tables"]["task_completions"]["Row"];
export type ShopItem = Database["public"]["Tables"]["shop_items"]["Row"];
export type InventoryItem = Database["public"]["Tables"]["inventory"]["Row"];
export type CompletionReversal = Database["public"]["Tables"]["completion_reversals"]["Row"];

// --- Insert Types ---
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];

// --- API Response Types ---
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface HealthCheckResponse {
  status: "ok" | "degraded" | "error";
  uptime: number;
  timestamp: string;
  version: string;
}

// --- Auth Action Results ---
export interface AuthActionResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

// --- Progression Engine Authoritative State ---
export interface AuthoritativeProgressionState {
  success: boolean;
  is_duplicate: boolean;
  completion_id: string;
  task_id: string;
  category: string;
  base_xp?: number;
  multiplier?: number;
  bonus_roll: string;
  xp_awarded: number;
  is_capped?: boolean;
  daily_category_completions?: number;
  level: number;
  current_xp: number;
  xp_to_next: number;
  leveled_up: boolean;
  levels_gained: number;
  current_streak: number;
  longest_streak: number;
  streak_shield_available: boolean;
  streak_shield_refill_at: string | null;
  shield_consumed: boolean;
  attribute: {
    name: string;
    value: number;
  };
  completed_at: string;
}

export interface CompleteTaskResult {
  success: boolean;
  data?: AuthoritativeProgressionState;
  error?: string;
}

export interface AuthoritativeReversalState {
  success: boolean;
  reversal_id: string;
  completion_id: string;
  task_id: string;
  category: string;
  xp_reversed: number;
  level: number;
  current_xp: number;
  xp_to_next: number;
  current_streak: number;
  longest_streak: number;
  streak_shield_available: boolean;
  attribute: {
    name: string;
    value: number;
  };
  reversed_at: string;
}

export interface ReverseCompletionResult {
  success: boolean;
  data?: AuthoritativeReversalState;
  error?: string;
}

export interface CreateTaskResult {
  success: boolean;
  task?: Task;
  error?: string;
}

// --- Weekly Challenges ---
export interface WeeklyChallenge {
  id: string;
  week_number: number;
  week_start_date: string;
  week_end_date: string;
  title: string;
  description: string;
  requirement_type: "category_count" | "total_count";
  target_category: string | null;
  target_count: number;
  reward_rare_currency: number;
  is_active: boolean;
  created_at: string;
}

export interface WeeklyChallengeProgress {
  id: string;
  user_id: string;
  challenge_id: string;
  current_count: number;
  completed: boolean;
  completed_at: string | null;
  claimed: boolean;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyChallengeWithProgress extends WeeklyChallenge {
  current_count: number;
  completed: boolean;
  claimed: boolean;
  percent: number;
}

export interface ClaimWeeklyChallengeResult {
  success: boolean;
  data?: {
    challenge_id: string;
    rare_currency_awarded: number;
    rare_currency: number;
    claimed_at: string;
  };
  error?: string;
}

// --- Cosmetic Shop & Purchases ---
export type CosmeticCategory =
  | "sky_overlay"
  | "star_color"
  | "avatar_frame"
  | "constellation_style";

export interface AuthoritativePurchaseState {
  success: boolean;
  is_duplicate: boolean;
  inventory_id: string;
  item_id: string;
  item_name: string;
  cost: number;
  currency_type: string;
  soft_currency: number;
  rare_currency: number;
  purchased_at: string;
}

export interface PurchaseItemResult {
  success: boolean;
  data?: AuthoritativePurchaseState;
  error?: string;
}

export interface AuthoritativeEquipState {
  success: boolean;
  inventory_id: string;
  item_id: string;
  category: string;
  equipped: boolean;
}

export interface EquipCosmeticResult {
  success: boolean;
  data?: AuthoritativeEquipState;
  error?: string;
}

export interface InventoryItemWithDetails extends InventoryItem {
  item: ShopItem;
}

