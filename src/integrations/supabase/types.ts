export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_table: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chrome_extension_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          password_hash: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          password_hash: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          password_hash?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chrome_prospects: {
        Row: {
          company: string | null
          created_at: string | null
          id: string
          job_title: string | null
          linkedin_url: string
          location: string | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          id?: string
          job_title?: string | null
          linkedin_url: string
          location?: string | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          id?: string
          job_title?: string | null
          linkedin_url?: string
          location?: string | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chrome_prospects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "chrome_extension_users"
            referencedColumns: ["id"]
          },
        ]
      }
      credits_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          master_prospect_id: string
          project_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          master_prospect_id: string
          project_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          master_prospect_id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credits_log_master_prospect_id_fkey"
            columns: ["master_prospect_id"]
            isOneToOne: false
            referencedRelation: "master_prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credits_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credits_log_user_id_fkey"
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
          project_name: string | null
          prospect_id: number
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          custom_reason?: string | null
          disposition_type: Database["public"]["Enums"]["disposition_type"]
          id?: string
          project_name?: string | null
          prospect_id: number
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          custom_reason?: string | null
          disposition_type?: Database["public"]["Enums"]["disposition_type"]
          id?: string
          project_name?: string | null
          prospect_id?: number
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispositions_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispositions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      enrichment_jobs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          master_prospect_id: string
          provider: string | null
          result: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          master_prospect_id: string
          provider?: string | null
          result?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          master_prospect_id?: string
          provider?: string | null
          result?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrichment_jobs_master_prospect_id_fkey"
            columns: ["master_prospect_id"]
            isOneToOne: false
            referencedRelation: "master_prospects"
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
      lusha_api_keys: {
        Row: {
          category: string
          created_at: string | null
          credits_remaining: number | null
          id: string
          is_active: boolean | null
          key_value: string
          last_used_at: string | null
          status: string
        }
        Insert: {
          category: string
          created_at?: string | null
          credits_remaining?: number | null
          id?: string
          is_active?: boolean | null
          key_value: string
          last_used_at?: string | null
          status?: string
        }
        Update: {
          category?: string
          created_at?: string | null
          credits_remaining?: number | null
          id?: string
          is_active?: boolean | null
          key_value?: string
          last_used_at?: string | null
          status?: string
        }
        Relationships: []
      }
      master_prospects: {
        Row: {
          canonical_url: string
          company_name: string | null
          created_at: string
          created_by: string | null
          full_name: string | null
          id: string
          linkedin_id: string
          prospect_city: string | null
          prospect_designation: string | null
          prospect_email: string | null
          prospect_number: string | null
          prospect_number2: string | null
          prospect_number3: string | null
          prospect_number4: string | null
          row_number: number | null
          updated_at: string
          verified: boolean
        }
        Insert: {
          canonical_url: string
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          full_name?: string | null
          id?: string
          linkedin_id: string
          prospect_city?: string | null
          prospect_designation?: string | null
          prospect_email?: string | null
          prospect_number?: string | null
          prospect_number2?: string | null
          prospect_number3?: string | null
          prospect_number4?: string | null
          row_number?: number | null
          updated_at?: string
          verified?: boolean
        }
        Update: {
          canonical_url?: string
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          full_name?: string | null
          id?: string
          linkedin_id?: string
          prospect_city?: string | null
          prospect_designation?: string | null
          prospect_email?: string | null
          prospect_number?: string | null
          prospect_number2?: string | null
          prospect_number3?: string | null
          prospect_number4?: string | null
          row_number?: number | null
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "master_prospects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json | null
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json | null
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json | null
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_prospects: {
        Row: {
          added_by: string
          created_at: string
          credit_allocated: boolean
          credited_at: string | null
          id: string
          master_prospect_id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          added_by: string
          created_at?: string
          credit_allocated?: boolean
          credited_at?: string | null
          id?: string
          master_prospect_id: string
          project_id: string
          updated_at?: string
        }
        Update: {
          added_by?: string
          created_at?: string
          credit_allocated?: boolean
          credited_at?: string | null
          id?: string
          master_prospect_id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_prospects_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_prospects_master_prospect_id_fkey"
            columns: ["master_prospect_id"]
            isOneToOne: false
            referencedRelation: "master_prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_prospects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_users: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_users_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
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
      rtne_requests: {
        Row: {
          city: string | null
          company_linkedin_url: string | null
          company_name: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          email_address: string | null
          full_name: string | null
          id: string
          job_title: string | null
          linkedin_url: string
          primary_phone: string | null
          project_name: string
          row_number: number
          status: string
          updated_at: string
          user_id: string
          user_name: string
        }
        Insert: {
          city?: string | null
          company_linkedin_url?: string | null
          company_name?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          email_address?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          linkedin_url: string
          primary_phone?: string | null
          project_name: string
          row_number: number
          status?: string
          updated_at?: string
          user_id: string
          user_name: string
        }
        Update: {
          city?: string | null
          company_linkedin_url?: string | null
          company_name?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          email_address?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          linkedin_url?: string
          primary_phone?: string | null
          project_name?: string
          row_number?: number
          status?: string
          updated_at?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          last_login: string | null
          project: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          last_login?: string | null
          project?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          last_login?: string | null
          project?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          email: string
          id: string
          last_active: string | null
          name: string | null
          project_name: string | null
          role: string
          status: string | null
        }
        Insert: {
          email: string
          id?: string
          last_active?: string | null
          name?: string | null
          project_name?: string | null
          role?: string
          status?: string | null
        }
        Update: {
          email?: string
          id?: string
          last_active?: string | null
          name?: string | null
          project_name?: string | null
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
      admin_delete_user_cascade: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      get_current_user_role: { Args: never; Returns: string }
      get_user_role_safe: { Args: never; Returns: string }
      is_admin_user: { Args: never; Returns: boolean }
      sync_user_profile: { Args: never; Returns: undefined }
    }
    Enums: {
      disposition_type:
        | "not_interested"
        | "wrong_number"
        | "dnc"
        | "call_back_later"
        | "not_relevant"
        | "others"
        | "not_connected"
        | "duplicate_prospect"
        | "irrelevant_company"
        | "contact_details_irrelevant"
        | "not_interested_in_company"
        | "reception_call_with_receptionist"
        | "hold_for_now"
        | "irrelevant_designation"
        | "irrelevant_location"
        | "do_not_call"
        | "contract_renewal_year"
        | "long_term_contract"
        | "no_requirements"
        | "call_back"
        | "follow_up"
        | "mail_sent"
        | "meeting_scheduled"
        | "meeting_successful"
        | "meeting_cancel"
        | "using_our_services"
        | "already_in_touch_with_team"
        | "person_irrelevant"
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
        "not_connected",
        "duplicate_prospect",
        "irrelevant_company",
        "contact_details_irrelevant",
        "not_interested_in_company",
        "reception_call_with_receptionist",
        "hold_for_now",
        "irrelevant_designation",
        "irrelevant_location",
        "do_not_call",
        "contract_renewal_year",
        "long_term_contract",
        "no_requirements",
        "call_back",
        "follow_up",
        "mail_sent",
        "meeting_scheduled",
        "meeting_successful",
        "meeting_cancel",
        "using_our_services",
        "already_in_touch_with_team",
        "person_irrelevant",
      ],
    },
  },
} as const
