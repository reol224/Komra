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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          session_id: string | null
          severity: string
          status: string
          timestamp: string
          user_agent: string | null
          user_email: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          severity: string
          status: string
          timestamp?: string
          user_agent?: string | null
          user_email: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          severity?: string
          status?: string
          timestamp?: string
          user_agent?: string | null
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      cves: {
        Row: {
          created_at: string | null
          cve_id: string
          cvss_score: number | null
          description: string | null
          id: string
          modified_date: string | null
          published_date: string | null
          reference_urls: string[] | null
          severity: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cve_id: string
          cvss_score?: number | null
          description?: string | null
          id?: string
          modified_date?: string | null
          published_date?: string | null
          reference_urls?: string[] | null
          severity: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cve_id?: string
          cvss_score?: number | null
          description?: string | null
          id?: string
          modified_date?: string | null
          published_date?: string | null
          reference_urls?: string[] | null
          severity?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      endpoint_packages: {
        Row: {
          created_at: string | null
          endpoint_id: string
          id: string
          installed_date: string | null
          package_id: string
        }
        Insert: {
          created_at?: string | null
          endpoint_id: string
          id?: string
          installed_date?: string | null
          package_id: string
        }
        Update: {
          created_at?: string | null
          endpoint_id?: string
          id?: string
          installed_date?: string | null
          package_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "endpoint_packages_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "endpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "endpoint_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      endpoints: {
        Row: {
          created_at: string | null
          environment: string
          hostname: string
          id: string
          ip_address: unknown | null
          last_scan: string | null
          os_type: string
          os_version: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          environment: string
          hostname: string
          id?: string
          ip_address?: unknown | null
          last_scan?: string | null
          os_type: string
          os_version?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          environment?: string
          hostname?: string
          id?: string
          ip_address?: unknown | null
          last_scan?: string | null
          os_type?: string
          os_version?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      package_vulnerabilities: {
        Row: {
          affected_versions: string[] | null
          created_at: string | null
          cve_id: string
          fixed_version: string | null
          id: string
          package_id: string
        }
        Insert: {
          affected_versions?: string[] | null
          created_at?: string | null
          cve_id: string
          fixed_version?: string | null
          id?: string
          package_id: string
        }
        Update: {
          affected_versions?: string[] | null
          created_at?: string | null
          cve_id?: string
          fixed_version?: string | null
          id?: string
          package_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_vulnerabilities_cve_id_fkey"
            columns: ["cve_id"]
            isOneToOne: false
            referencedRelation: "cves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_vulnerabilities_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string | null
          id: string
          name: string
          package_type: string | null
          vendor: string | null
          version: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          package_type?: string | null
          vendor?: string | null
          version: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          package_type?: string | null
          vendor?: string | null
          version?: string
        }
        Relationships: []
      }
      remediation_plans: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "remediation_plans_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remediation_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      triage_actions: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          cve_id: string
          endpoint_id: string
          id: string
          notes: string | null
          priority: string | null
          remediation_plan_id: string | null
          status: string | null
          triaged_at: string | null
          triaged_by: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          cve_id: string
          endpoint_id: string
          id?: string
          notes?: string | null
          priority?: string | null
          remediation_plan_id?: string | null
          status?: string | null
          triaged_at?: string | null
          triaged_by?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          cve_id?: string
          endpoint_id?: string
          id?: string
          notes?: string | null
          priority?: string | null
          remediation_plan_id?: string | null
          status?: string | null
          triaged_at?: string | null
          triaged_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "triage_actions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "triage_actions_cve_id_fkey"
            columns: ["cve_id"]
            isOneToOne: false
            referencedRelation: "cves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "triage_actions_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "endpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "triage_actions_remediation_plan_id_fkey"
            columns: ["remediation_plan_id"]
            isOneToOne: false
            referencedRelation: "remediation_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "triage_actions_triaged_by_fkey"
            columns: ["triaged_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
