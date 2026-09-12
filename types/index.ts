import type { Database } from "./database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type GameAuditLog = Database["public"]["Tables"]["game_audit_logs"]["Row"];

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

export interface StarmapNode {
  id: string;
  name: string;
  coordinates: [number, number, number];
  status: "locked" | "unlocked" | "completed";
}

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  rewardXp: number;
  isCompleted: boolean;
}
