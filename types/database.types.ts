export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          level: number;
          current_xp: number;
          soft_currency: number;
          rare_currency: number;
          current_streak: number;
          longest_streak: number;
          streak_shield_available: boolean;
          streak_shield_refill_at: string | null;
          last_completion_at: string | null;
          timezone: string;
          theme_preference: string;
          sound_enabled: boolean;
          calm_mode: boolean;
          email: string | null;
          notification_email_comeback: boolean;
          notification_email_weekly_recap: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          level?: number;
          current_xp?: number;
          soft_currency?: number;
          rare_currency?: number;
          current_streak?: number;
          longest_streak?: number;
          streak_shield_available?: boolean;
          streak_shield_refill_at?: string | null;
          last_completion_at?: string | null;
          timezone?: string;
          theme_preference?: string;
          sound_enabled?: boolean;
          calm_mode?: boolean;
          email?: string | null;
          notification_email_comeback?: boolean;
          notification_email_weekly_recap?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          level?: number;
          current_xp?: number;
          soft_currency?: number;
          rare_currency?: number;
          current_streak?: number;
          longest_streak?: number;
          streak_shield_available?: boolean;
          streak_shield_refill_at?: string | null;
          last_completion_at?: string | null;
          timezone?: string;
          theme_preference?: string;
          sound_enabled?: boolean;
          calm_mode?: boolean;
          email?: string | null;
          notification_email_comeback?: boolean;
          notification_email_weekly_recap?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      attributes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          value: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          value?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "attributes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: string;
          is_recurring: boolean;
          archived_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          category: string;
          is_recurring?: boolean;
          archived_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          category?: string;
          is_recurring?: boolean;
          archived_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      task_completions: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          completed_at: string;
          xp_awarded: number;
          bonus_roll: string;
          category: string;
          idempotency_key: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          completed_at?: string;
          xp_awarded?: number;
          bonus_roll: string;
          category: string;
          idempotency_key: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          completed_at?: string;
          xp_awarded?: number;
          bonus_roll?: string;
          category?: string;
          idempotency_key?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_completions_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_completions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      shop_items: {
        Row: {
          id: string;
          name: string | null;
          description: string | null;
          cost: number | null;
          currency_type: string | null;
          category: string | null;
          active: boolean;
        };
        Insert: {
          id?: string;
          name?: string | null;
          description?: string | null;
          cost?: number | null;
          currency_type?: string | null;
          category?: string | null;
          active?: boolean;
        };
        Update: {
          id?: string;
          name?: string | null;
          description?: string | null;
          cost?: number | null;
          currency_type?: string | null;
          category?: string | null;
          active?: boolean;
        };
        Relationships: [];
      };
      inventory: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          equipped: boolean;
          acquired_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          equipped?: boolean;
          acquired_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_id?: string;
          equipped?: boolean;
          acquired_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "shop_items";
            referencedColumns: ["id"];
          },
        ];
      };
      completion_reversals: {
        Row: {
          id: string;
          completion_id: string;
          user_id: string;
          xp_reversed: number;
          reversed_at: string;
        };
        Insert: {
          id?: string;
          completion_id: string;
          user_id: string;
          xp_reversed?: number;
          reversed_at?: string;
        };
        Update: {
          id?: string;
          completion_id?: string;
          user_id?: string;
          xp_reversed?: number;
          reversed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "completion_reversals_completion_id_fkey";
            columns: ["completion_id"];
            isOneToOne: true;
            referencedRelation: "task_completions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "completion_reversals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      shop_purchases: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          cost: number;
          currency_type: string;
          idempotency_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          cost: number;
          currency_type: string;
          idempotency_key: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_id?: string;
          cost?: number;
          currency_type?: string;
          idempotency_key?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      weekly_challenges: {
        Row: {
          id: string;
          week_number: number;
          week_start_date: string;
          week_end_date: string;
          title: string;
          description: string;
          requirement_type: string;
          target_category: string | null;
          target_count: number;
          reward_rare_currency: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          week_number: number;
          week_start_date: string;
          week_end_date: string;
          title: string;
          description: string;
          requirement_type: string;
          target_category?: string | null;
          target_count: number;
          reward_rare_currency: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          week_number?: number;
          week_start_date?: string;
          week_end_date?: string;
          title?: string;
          description?: string;
          requirement_type?: string;
          target_category?: string | null;
          target_count?: number;
          reward_rare_currency?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      weekly_challenge_progress: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          current_count?: number;
          completed?: boolean;
          completed_at?: string | null;
          claimed?: boolean;
          claimed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          challenge_id?: string;
          current_count?: number;
          completed?: boolean;
          completed_at?: string | null;
          claimed?: boolean;
          claimed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_deliveries: {
        Row: {
          id: string;
          user_id: string;
          notification_type: string;
          sent_at: string;
          local_date: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          notification_type: string;
          sent_at?: string;
          local_date: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          notification_type?: string;
          sent_at?: string;
          local_date?: string;
          metadata?: Json | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      complete_task_v1: {
        Args: {
          p_task_id: string;
          p_idempotency_key: string;
        };
        Returns: Json;
      };
      reverse_completion_v1: {
        Args: {
          p_completion_id: string;
        };
        Returns: Json;
      };
      complete_task: {
        Args: {
          p_task_id: string;
          p_user_id: string;
          p_idempotency_key: string;
          p_xp_awarded: number;
          p_bonus_roll: string;
        };
        Returns: string | null;
      };
      purchase_item: {
        Args: {
          p_item_id: string;
          p_user_id: string;
        };
        Returns: string | null;
      };
      purchase_item_v1: {
        Args: {
          p_item_id: string;
          p_idempotency_key: string;
        };
        Returns: Json;
      };
      equip_cosmetic_v1: {
        Args: {
          p_inventory_id: string;
        };
        Returns: Json;
      };
      claim_weekly_challenge_v1: {
        Args: {
          p_challenge_id: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
