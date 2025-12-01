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
      admin_setup: {
        Row: {
          billing_account_id: string | null
          created_at: string | null
          id: string
          mfa_enabled: boolean | null
          mfa_secret: string | null
          password_hash: string
          phone_number: string | null
          setup_completed: boolean | null
          updated_at: string | null
          username: string
        }
        Insert: {
          billing_account_id?: string | null
          created_at?: string | null
          id?: string
          mfa_enabled?: boolean | null
          mfa_secret?: string | null
          password_hash: string
          phone_number?: string | null
          setup_completed?: boolean | null
          updated_at?: string | null
          username: string
        }
        Update: {
          billing_account_id?: string | null
          created_at?: string | null
          id?: string
          mfa_enabled?: boolean | null
          mfa_secret?: string | null
          password_hash?: string
          phone_number?: string | null
          setup_completed?: boolean | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_setup_billing_account_id_fkey"
            columns: ["billing_account_id"]
            isOneToOne: false
            referencedRelation: "billing_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json
          id: string
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
      audit_trail: {
        Row: {
          action: string
          description: string
          endpoint_id: string | null
          event_category: string
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          severity: string | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          description: string
          endpoint_id?: string | null
          event_category: string
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          severity?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          description?: string
          endpoint_id?: string | null
          event_category?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          severity?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_trail_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_activity: string | null
          session_token: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity?: string | null
          session_token: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auth_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_accounts: {
        Row: {
          created_at: string | null
          id: string
          license_key: string
          plan_type: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          license_key: string
          plan_type?: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          license_key?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      collection_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          endpoints_processed: number | null
          error_message: string | null
          id: string
          metadata: Json | null
          packages_collected: number | null
          schedule_id: string | null
          started_at: string | null
          status: string | null
          vulnerabilities_found: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          endpoints_processed?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          packages_collected?: number | null
          schedule_id?: string | null
          started_at?: string | null
          status?: string | null
          vulnerabilities_found?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          endpoints_processed?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          packages_collected?: number | null
          schedule_id?: string | null
          started_at?: string | null
          status?: string | null
          vulnerabilities_found?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_jobs_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "collection_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_schedules: {
        Row: {
          collection_type: string | null
          created_at: string | null
          enabled: boolean | null
          endpoints: string[]
          frequency: string
          id: string
          last_run: string | null
          name: string
          next_run: string | null
          updated_at: string | null
        }
        Insert: {
          collection_type?: string | null
          created_at?: string | null
          enabled?: boolean | null
          endpoints?: string[]
          frequency: string
          id?: string
          last_run?: string | null
          name: string
          next_run?: string | null
          updated_at?: string | null
        }
        Update: {
          collection_type?: string | null
          created_at?: string | null
          enabled?: boolean | null
          endpoints?: string[]
          frequency?: string
          id?: string
          last_run?: string | null
          name?: string
          next_run?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      compliance_reports: {
        Row: {
          approved_by: string | null
          created_at: string | null
          description: string | null
          findings: Json | null
          framework: string
          generated_by: string | null
          id: string
          published_at: string | null
          recommendations: Json | null
          report_period_end: string | null
          report_period_start: string | null
          report_type: string
          reviewed_by: string | null
          scope: Json | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          description?: string | null
          findings?: Json | null
          framework: string
          generated_by?: string | null
          id?: string
          published_at?: string | null
          recommendations?: Json | null
          report_period_end?: string | null
          report_period_start?: string | null
          report_type: string
          reviewed_by?: string | null
          scope?: Json | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          description?: string | null
          findings?: Json | null
          framework?: string
          generated_by?: string | null
          id?: string
          published_at?: string | null
          recommendations?: Json | null
          report_period_end?: string | null
          report_period_start?: string | null
          report_type?: string
          reviewed_by?: string | null
          scope?: Json | null
          status?: string | null
          title?: string
          updated_at?: string | null
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
      email_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          html_content: string
          id: string
          recipient: string
          sent_at: string | null
          status: string
          subject: string
          text_content: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          html_content: string
          id?: string
          recipient: string
          sent_at?: string | null
          status?: string
          subject: string
          text_content: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          html_content?: string
          id?: string
          recipient?: string
          sent_at?: string | null
          status?: string
          subject?: string
          text_content?: string
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
          status: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint_id: string
          id?: string
          installed_date?: string | null
          package_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint_id?: string
          id?: string
          installed_date?: string | null
          package_id?: string
          status?: string | null
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
          description: string | null
          environment: string
          hostname: string
          id: string
          ip_address: unknown
          last_scan: string | null
          metadata: Json | null
          os_type: string
          os_version: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          environment: string
          hostname: string
          id?: string
          ip_address?: unknown
          last_scan?: string | null
          metadata?: Json | null
          os_type: string
          os_version?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          environment?: string
          hostname?: string
          id?: string
          ip_address?: unknown
          last_scan?: string | null
          metadata?: Json | null
          os_type?: string
          os_version?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      environment_provisioning: {
        Row: {
          billing_account_id: string | null
          created_at: string | null
          environment_id: string
          id: string
          provisioned_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          billing_account_id?: string | null
          created_at?: string | null
          environment_id: string
          id?: string
          provisioned_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          billing_account_id?: string | null
          created_at?: string | null
          environment_id?: string
          id?: string
          provisioned_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "environment_provisioning_billing_account_id_fkey"
            columns: ["billing_account_id"]
            isOneToOne: false
            referencedRelation: "billing_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      investigation_logs: {
        Row: {
          case_number: string | null
          closed_at: string | null
          created_at: string | null
          description: string | null
          evidence: Json | null
          findings: string | null
          id: string
          investigation_id: string | null
          investigator_id: string | null
          priority: string | null
          related_endpoints: string[] | null
          related_vulnerabilities: string[] | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          case_number?: string | null
          closed_at?: string | null
          created_at?: string | null
          description?: string | null
          evidence?: Json | null
          findings?: string | null
          id?: string
          investigation_id?: string | null
          investigator_id?: string | null
          priority?: string | null
          related_endpoints?: string[] | null
          related_vulnerabilities?: string[] | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          case_number?: string | null
          closed_at?: string | null
          created_at?: string | null
          description?: string | null
          evidence?: Json | null
          findings?: string | null
          id?: string
          investigation_id?: string | null
          investigator_id?: string | null
          priority?: string | null
          related_endpoints?: string[] | null
          related_vulnerabilities?: string[] | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mfa_audit_log: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          success: boolean | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          success?: boolean | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_secrets: {
        Row: {
          backup_codes: string[] | null
          created_at: string | null
          enabled: boolean | null
          id: string
          last_used: string | null
          secret: string
          user_id: string | null
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_used?: string | null
          secret: string
          user_id?: string | null
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_used?: string | null
          secret?: string
          user_id?: string | null
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
      permissions: {
        Row: {
          action: string
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          resource: string
        }
        Insert: {
          action: string
          category: string
          created_at?: string | null
          description?: string | null
          id: string
          name: string
          resource: string
        }
        Update: {
          action?: string
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          resource?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          p256dh_key: string
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          p256dh_key: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          p256dh_key?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
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
      role_permissions: {
        Row: {
          granted: boolean | null
          permission_id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          granted?: boolean | null
          permission_id: string
          role: string
          updated_at?: string | null
        }
        Update: {
          granted?: boolean | null
          permission_id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      system_metrics: {
        Row: {
          cpu_usage: number
          created_at: string | null
          disk_usage: number
          id: number
          memory_usage: number
          network_latency: number
          recorded_at: string | null
        }
        Insert: {
          cpu_usage: number
          created_at?: string | null
          disk_usage: number
          id?: number
          memory_usage: number
          network_latency: number
          recorded_at?: string | null
        }
        Update: {
          cpu_usage?: number
          created_at?: string | null
          disk_usage?: number
          id?: number
          memory_usage?: number
          network_latency?: number
          recorded_at?: string | null
        }
        Relationships: []
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
      user_passwords: {
        Row: {
          algorithm: string
          change_reason: string | null
          created_at: string | null
          failed_attempts: number | null
          id: string
          iterations: number
          last_changed: string | null
          locked_until: string | null
          memory_cost: number
          parallelism: number
          password_hash: string
          requires_change: boolean | null
          salt: string
          strength_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          algorithm?: string
          change_reason?: string | null
          created_at?: string | null
          failed_attempts?: number | null
          id?: string
          iterations?: number
          last_changed?: string | null
          locked_until?: string | null
          memory_cost?: number
          parallelism?: number
          password_hash: string
          requires_change?: boolean | null
          salt: string
          strength_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          algorithm?: string
          change_reason?: string | null
          created_at?: string | null
          failed_attempts?: number | null
          id?: string
          iterations?: number
          last_changed?: string | null
          locked_until?: string | null
          memory_cost?: number
          parallelism?: number
          password_hash?: string
          requires_change?: boolean | null
          salt?: string
          strength_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          failed_login_attempts: number | null
          full_name: string | null
          id: string
          last_activity: string | null
          locked_until: string | null
          mfa_backup_codes: string[] | null
          mfa_enabled: boolean | null
          mfa_enabled_at: string | null
          mfa_secret: string | null
          reset_token: string | null
          reset_token_expiry: string | null
          role: string | null
          session_timeout: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          failed_login_attempts?: number | null
          full_name?: string | null
          id?: string
          last_activity?: string | null
          locked_until?: string | null
          mfa_backup_codes?: string[] | null
          mfa_enabled?: boolean | null
          mfa_enabled_at?: string | null
          mfa_secret?: string | null
          reset_token?: string | null
          reset_token_expiry?: string | null
          role?: string | null
          session_timeout?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          failed_login_attempts?: number | null
          full_name?: string | null
          id?: string
          last_activity?: string | null
          locked_until?: string | null
          mfa_backup_codes?: string[] | null
          mfa_enabled?: boolean | null
          mfa_enabled_at?: string | null
          mfa_secret?: string | null
          reset_token?: string | null
          reset_token_expiry?: string | null
          role?: string | null
          session_timeout?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vulnerabilities: {
        Row: {
          created_at: string | null
          cve_id: string
          cvss_score: number | null
          description: string | null
          discovered_date: string | null
          endpoint_id: string
          id: string
          severity: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cve_id: string
          cvss_score?: number | null
          description?: string | null
          discovered_date?: string | null
          endpoint_id: string
          id?: string
          severity: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cve_id?: string
          cvss_score?: number | null
          description?: string | null
          discovered_date?: string | null
          endpoint_id?: string
          id?: string
          severity?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vulnerabilities_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          company: string | null
          company_size: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          job_title: string | null
          last_name: string | null
          referral_source: string | null
          updated_at: string | null
          use_case: string | null
        }
        Insert: {
          company?: string | null
          company_size?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          referral_source?: string | null
          updated_at?: string | null
          use_case?: string | null
        }
        Update: {
          company?: string | null
          company_size?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          referral_source?: string | null
          updated_at?: string | null
          use_case?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_password_strength: {
        Args: { password: string }
        Returns: {
          feedback: string[]
          is_strong: boolean
          score: number
        }[]
      }
      cleanup_expired_sessions: { Args: never; Returns: number }
      create_user_session: {
        Args: {
          p_ip_address?: string
          p_session_timeout?: number
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      hash_password: {
        Args: { password: string }
        Returns: {
          hash: string
          salt: string
        }[]
      }
      log_mfa_event: {
        Args: {
          p_event_type: string
          p_ip_address?: unknown
          p_metadata?: Json
          p_success?: boolean
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      terminate_all_user_sessions: {
        Args: { p_terminated_by?: string; p_user_id: string }
        Returns: number
      }
      terminate_user_session: {
        Args: { p_session_id: string; p_terminated_by?: string }
        Returns: boolean
      }
      update_user_password: {
        Args: { p_password: string; p_user_id: string }
        Returns: undefined
      }
      upgrade_password_security: {
        Args: { input_user_id: string; new_password: string }
        Returns: boolean
      }
      verify_user_password: {
        Args: { input_password: string; input_user_id: string }
        Returns: boolean
      }
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
