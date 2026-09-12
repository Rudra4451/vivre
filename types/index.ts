import type { Database } from "./database.types";

// --- Table Row Types ---
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Attribute = Database["public"]["Tables"]["attributes"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskCompletion = Database["public"]["Tables"]["task_completions"]["Row"];
export type ShopItem = Database["public"]["Tables"]["shop_items"]["Row"];
export type InventoryItem = Database["public"]["Tables"]["inventory"]["Row"];

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
