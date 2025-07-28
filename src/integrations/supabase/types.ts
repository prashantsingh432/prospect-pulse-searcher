export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string | null
          details: Json | null
          id: number
          prospect_id: number | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          details?: Json | null
          id?: number
          prospect_id?: number | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          details?: Json | null
          id?: number
          prospect_id?: number | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dispositions: {
        Row: {
          created_at: string
          custom_reason: string | null
          disposition_type: Database["public"]["Enums"]["disposition_type"]
          id: string
          prospect_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_reason?: string | null
          disposition_type: Database["public"]["Enums"]["disposition_type"]
          id?: string
          prospect_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_reason?: string | null
          disposition_type?: Database["public"]["Enums"]["disposition_type"]
          id?: string
          prospect_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispositions_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      exports: {
        Row: {
          format: string | null
          id: number
          prospect_ids: number[] | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          format?: string | null
          id?: number
          prospect_ids?: number[] | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          format?: string | null
          id?: number
          prospect_ids?: number[] | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prospects: {
        Row: {
          company_name: string
          full_name: string
          id: number
          prospect_city: string | null
          prospect_designation: string | null
          prospect_email: string | null
          prospect_linkedin: string | null
          prospect_number: string | null
          prospect_number2: string | null
          prospect_number3: string | null
          prospect_number4: string | null
        }
        Insert: {
          company_name: string
          full_name: string
          id?: number
          prospect_city?: string | null
          prospect_designation?: string | null
          prospect_email?: string | null
          prospect_linkedin?: string | null
          prospect_number?: string | null
          prospect_number2?: string | null
          prospect_number3?: string | null
          prospect_number4?: string | null
        }
        Update: {
          company_name?: string
          full_name?: string
          id?: number
          prospect_city?: string | null
          prospect_designation?: string | null
          prospect_email?: string | null
          prospect_linkedin?: string | null
          prospect_number?: string | null
          prospect_number2?: string | null
          prospect_number3?: string | null
          prospect_number4?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          email: string
          id: string
          last_active: string | null
          name: string | null
          role: string
          status: string | null
        }
        Insert: {
          email: string
          id?: string
          last_active?: string | null
          name?: string | null
          role?: string
          status?: string | null
        }
        Update: {
          email?: string
          id?: string
          last_active?: string | null
          name?: string | null
          role?: string
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      sync_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      disposition_type:
        | "not_interested"
        | "wrong_number"
        | "dnc"
        | "call_back_later"
        | "not_relevant"
        | "others"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      disposition_type: [
        "not_interested",
        "wrong_number",
        "dnc",
        "call_back_later",
        "not_relevant",
        "others",
      ],
    },
  },
} as const
