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
      agent_banks_memories: {
        Row: {
          access_count: number | null
          content: string
          created_at: string | null
          id: string
          memory_type: string | null
          metadata: Json | null
          project_ref: string | null
          relevance_score: number | null
          source_url: string | null
          status: string | null
          summary: string | null
          tags: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          access_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          memory_type?: string | null
          metadata?: Json | null
          project_ref?: string | null
          relevance_score?: number | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          tags?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          access_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          memory_type?: string | null
          metadata?: Json | null
          project_ref?: string | null
          relevance_score?: number | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          tags?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_banks_sessions: {
        Row: {
          completed_at: string | null
          description: string | null
          id: string
          last_activity: string | null
          memory_count: number | null
          metadata: Json | null
          session_name: string
          session_type: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          description?: string | null
          id?: string
          last_activity?: string | null
          memory_count?: number | null
          metadata?: Json | null
          session_name: string
          session_type?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          description?: string | null
          id?: string
          last_activity?: string | null
          memory_count?: number | null
          metadata?: Json | null
          session_name?: string
          session_type?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      ai_response_cache: {
        Row: {
          created_at: string
          expires_at: string | null
          hit_count: number | null
          id: string
          model_used: string
          prompt: string
          prompt_hash: string
          response: string
          tokens_used: number | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          hit_count?: number | null
          id?: string
          model_used: string
          prompt: string
          prompt_hash: string
          response: string
          tokens_used?: number | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          hit_count?: number | null
          id?: string
          model_used?: string
          prompt?: string
          prompt_hash?: string
          response?: string
          tokens_used?: number | null
        }
        Relationships: []
      }
      api_key_projects: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          owner_id: string
          settings: Json | null
          team_members: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          owner_id: string
          settings?: Json | null
          team_members?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          owner_id?: string
          settings?: Json | null
          team_members?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      api_key_scopes: {
        Row: {
          allowed_actions: string[] | null
          api_key_id: string
          created_at: string | null
          id: string
          max_calls_per_day: number | null
          max_calls_per_minute: number | null
          service_key: string
        }
        Insert: {
          allowed_actions?: string[] | null
          api_key_id: string
          created_at?: string | null
          id?: string
          max_calls_per_day?: number | null
          max_calls_per_minute?: number | null
          service_key: string
        }
        Update: {
          allowed_actions?: string[] | null
          api_key_id?: string
          created_at?: string | null
          id?: string
          max_calls_per_day?: number | null
          max_calls_per_minute?: number | null
          service_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_key_scopes_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_key_scopes_service_key_fkey"
            columns: ["service_key"]
            isOneToOne: false
            referencedRelation: "mcp_service_catalog"
            referencedColumns: ["service_key"]
          },
        ]
      }
      api_keys: {
        Row: {
          access_level: string | null
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key: string
          key_hash: string | null
          last_used_at: string | null
          name: string
          organization_id: string | null
          permissions: Json | null
          service: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_level?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          key_hash?: string | null
          last_used_at?: string | null
          name: string
          organization_id?: string | null
          permissions?: Json | null
          service?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_level?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          key_hash?: string | null
          last_used_at?: string | null
          name?: string
          organization_id?: string | null
          permissions?: Json | null
          service?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      autonomous_agent_runs: {
        Row: {
          actions_log: Json | null
          completed_at: string | null
          duplicates_merged: number | null
          id: string
          memories_categorized: number | null
          memories_tagged: number | null
          run_type: string | null
          started_at: string | null
          success: boolean | null
          suggestions_created: number | null
          user_id: string
        }
        Insert: {
          actions_log?: Json | null
          completed_at?: string | null
          duplicates_merged?: number | null
          id?: string
          memories_categorized?: number | null
          memories_tagged?: number | null
          run_type?: string | null
          started_at?: string | null
          success?: boolean | null
          suggestions_created?: number | null
          user_id: string
        }
        Update: {
          actions_log?: Json | null
          completed_at?: string | null
          duplicates_merged?: number | null
          id?: string
          memories_categorized?: number | null
          memories_tagged?: number | null
          run_type?: string | null
          started_at?: string | null
          success?: boolean | null
          suggestions_created?: number | null
          user_id?: string
        }
        Relationships: []
      }
      beneficiaries: {
        Row: {
          account_number: string
          bank_code: string
          category: string | null
          created_at: string
          id: string
          is_archived: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number: string
          bank_code: string
          category?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string
          bank_code?: string
          category?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_financial_insights: {
        Row: {
          data: Json
          generated_at: string | null
          id: number
          insight_type: string
          period_end: string | null
          period_start: string | null
          user_id: string | null
        }
        Insert: {
          data: Json
          generated_at?: string | null
          id?: number
          insight_type: string
          period_end?: string | null
          period_start?: string | null
          user_id?: string | null
        }
        Update: {
          data?: Json
          generated_at?: string | null
          id?: number
          insight_type?: string
          period_end?: string | null
          period_start?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      business_metrics: {
        Row: {
          active_customers: number | null
          cash_on_hand: number | null
          created_at: string | null
          id: string
          inventory_value: number | null
          low_stock_items: number | null
          metadata: Json | null
          metric_date: string
          net_profit: number | null
          out_of_stock_items: number | null
          outstanding_payables: number | null
          outstanding_receivables: number | null
          overdue_invoices: number | null
          total_customers: number | null
          total_expenses: number | null
          total_products: number | null
          total_revenue: number | null
          user_id: string
        }
        Insert: {
          active_customers?: number | null
          cash_on_hand?: number | null
          created_at?: string | null
          id?: string
          inventory_value?: number | null
          low_stock_items?: number | null
          metadata?: Json | null
          metric_date?: string
          net_profit?: number | null
          out_of_stock_items?: number | null
          outstanding_payables?: number | null
          outstanding_receivables?: number | null
          overdue_invoices?: number | null
          total_customers?: number | null
          total_expenses?: number | null
          total_products?: number | null
          total_revenue?: number | null
          user_id: string
        }
        Update: {
          active_customers?: number | null
          cash_on_hand?: number | null
          created_at?: string | null
          id?: string
          inventory_value?: number | null
          low_stock_items?: number | null
          metadata?: Json | null
          metric_date?: string
          net_profit?: number | null
          out_of_stock_items?: number | null
          outstanding_payables?: number | null
          outstanding_receivables?: number | null
          overdue_invoices?: number | null
          total_customers?: number | null
          total_expenses?: number | null
          total_products?: number | null
          total_revenue?: number | null
          user_id?: string
        }
        Relationships: []
      }
      business_profiles: {
        Row: {
          address: Json | null
          business_name: string
          business_type: string | null
          created_at: string | null
          id: number
          industry: string | null
          registration_number: string | null
          tax_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: Json | null
          business_name: string
          business_type?: string | null
          created_at?: string | null
          id?: number
          industry?: string | null
          registration_number?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: Json | null
          business_name?: string
          business_type?: string | null
          created_at?: string | null
          id?: number
          industry?: string | null
          registration_number?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      capability_tiers: {
        Row: {
          cards_enabled: boolean | null
          created_at: string | null
          daily_transfer_limit: number | null
          display_name: string
          id: string
          kyc_enabled: boolean | null
          monthly_fee: number | null
          monthly_volume_limit: number | null
          payments_enabled: boolean | null
          per_transfer_limit: number | null
          requests_per_hour: number | null
          requests_per_minute: number | null
          tier_name: string
          transaction_fee_cap: number | null
          transaction_fee_percent: number | null
          transfers_enabled: boolean | null
          wallet_enabled: boolean | null
        }
        Insert: {
          cards_enabled?: boolean | null
          created_at?: string | null
          daily_transfer_limit?: number | null
          display_name: string
          id?: string
          kyc_enabled?: boolean | null
          monthly_fee?: number | null
          monthly_volume_limit?: number | null
          payments_enabled?: boolean | null
          per_transfer_limit?: number | null
          requests_per_hour?: number | null
          requests_per_minute?: number | null
          tier_name: string
          transaction_fee_cap?: number | null
          transaction_fee_percent?: number | null
          transfers_enabled?: boolean | null
          wallet_enabled?: boolean | null
        }
        Update: {
          cards_enabled?: boolean | null
          created_at?: string | null
          daily_transfer_limit?: number | null
          display_name?: string
          id?: string
          kyc_enabled?: boolean | null
          monthly_fee?: number | null
          monthly_volume_limit?: number | null
          payments_enabled?: boolean | null
          per_transfer_limit?: number | null
          requests_per_hour?: number | null
          requests_per_minute?: number | null
          tier_name?: string
          transaction_fee_cap?: number | null
          transaction_fee_percent?: number | null
          transfers_enabled?: boolean | null
          wallet_enabled?: boolean | null
        }
        Relationships: []
      }
      card_authorizations: {
        Row: {
          amount: number
          approved: boolean
          created_at: string | null
          currency: string | null
          id: string
          merchant_category: string | null
          merchant_name: string
          stripe_authorization_id: string
          stripe_card_id: string
          transaction_date: string
        }
        Insert: {
          amount: number
          approved: boolean
          created_at?: string | null
          currency?: string | null
          id?: string
          merchant_category?: string | null
          merchant_name: string
          stripe_authorization_id: string
          stripe_card_id: string
          transaction_date: string
        }
        Update: {
          amount?: number
          approved?: boolean
          created_at?: string | null
          currency?: string | null
          id?: string
          merchant_category?: string | null
          merchant_name?: string
          stripe_authorization_id?: string
          stripe_card_id?: string
          transaction_date?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          title: string
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          encrypted: boolean
          id: string
          role: string
          timestamp: string
        }
        Insert: {
          content: string
          conversation_id: string
          encrypted?: boolean
          id: string
          role: string
          timestamp?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          encrypted?: boolean
          id?: string
          role?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      company_endpoints: {
        Row: {
          auth_required: boolean
          created_at: string
          description: string | null
          id: string
          method: string
          path: string
          rate_limit: number | null
          service_id: string
          updated_at: string
        }
        Insert: {
          auth_required?: boolean
          created_at?: string
          description?: string | null
          id?: string
          method: string
          path: string
          rate_limit?: number | null
          service_id: string
          updated_at?: string
        }
        Update: {
          auth_required?: boolean
          created_at?: string
          description?: string | null
          id?: string
          method?: string
          path?: string
          rate_limit?: number | null
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_endpoints_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "company_services"
            referencedColumns: ["id"]
          },
        ]
      }
      company_projects: {
        Row: {
          api_key: string
          created_at: string
          description: string | null
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          api_key?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          api_key?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_services: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          name: string
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          name: string
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_services_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "company_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      configurations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_sensitive: boolean | null
          key: string
          organization_id: string | null
          type: string | null
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_sensitive?: boolean | null
          key: string
          organization_id?: string | null
          type?: string | null
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_sensitive?: boolean | null
          key?: string
          organization_id?: string | null
          type?: string | null
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          bvn: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          first_name: string
          id: string
          kyc_level: string | null
          kyc_status: string
          last_name: string
          metadata: Json | null
          phone_number: string
          provider: string
          provider_customer_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          bvn?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          first_name: string
          id?: string
          kyc_level?: string | null
          kyc_status?: string
          last_name: string
          metadata?: Json | null
          phone_number: string
          provider?: string
          provider_customer_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          bvn?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          first_name?: string
          id?: string
          kyc_level?: string | null
          kyc_status?: string
          last_name?: string
          metadata?: Json | null
          phone_number?: string
          provider?: string
          provider_customer_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      edoc_consents: {
        Row: {
          consent_type: string
          created_at: string | null
          expires_at: string | null
          id: number
          metadata: Json | null
          status: string
          user_id: string | null
        }
        Insert: {
          consent_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: number
          metadata?: Json | null
          status: string
          user_id?: string | null
        }
        Update: {
          consent_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: number
          metadata?: Json | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      edoc_financial_analysis: {
        Row: {
          analysis_type: string
          created_at: string | null
          data: Json
          id: number
          user_id: string | null
        }
        Insert: {
          analysis_type: string
          created_at?: string | null
          data: Json
          id?: number
          user_id?: string | null
        }
        Update: {
          analysis_type?: string
          created_at?: string | null
          data?: Json
          id?: number
          user_id?: string | null
        }
        Relationships: []
      }
      edoc_transactions: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          id: number
          metadata: Json | null
          status: string
          transaction_id: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: number
          metadata?: Json | null
          status: string
          transaction_id: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: number
          metadata?: Json | null
          status?: string
          transaction_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      expert_sessions: {
        Row: {
          client_id: string
          client_rating: number | null
          client_review: string | null
          completed_at: string | null
          created_at: string | null
          duration_minutes: number | null
          expert_id: string
          expert_payout_usd: number | null
          id: string
          platform_commission_percent: number | null
          platform_commission_usd: number | null
          rate_usd: number | null
          scheduled_at: string | null
          status: string | null
          total_amount_usd: number | null
        }
        Insert: {
          client_id: string
          client_rating?: number | null
          client_review?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          expert_id: string
          expert_payout_usd?: number | null
          id?: string
          platform_commission_percent?: number | null
          platform_commission_usd?: number | null
          rate_usd?: number | null
          scheduled_at?: string | null
          status?: string | null
          total_amount_usd?: number | null
        }
        Update: {
          client_id?: string
          client_rating?: number | null
          client_review?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          expert_id?: string
          expert_payout_usd?: number | null
          id?: string
          platform_commission_percent?: number | null
          platform_commission_usd?: number | null
          rate_usd?: number | null
          scheduled_at?: string | null
          status?: string | null
          total_amount_usd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_sessions_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "expert_marketplace_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: number
          name: string
          rollout_percentage: number | null
          updated_at: string | null
          user_groups: string[] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: number
          name: string
          rollout_percentage?: number | null
          updated_at?: string | null
          user_groups?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: number
          name?: string
          rollout_percentage?: number | null
          updated_at?: string | null
          user_groups?: string[] | null
        }
        Relationships: []
      }
      imported_data: {
        Row: {
          content: string | null
          created_at: string | null
          file_url: string | null
          id: string
          metadata: Json | null
          source_type: string
          title: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          source_type: string
          title?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          source_type?: string
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      intelligence_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          expires_at: string | null
          hit_count: number | null
          id: string
          result: Json
          tokens_saved: number | null
          tool_name: string
          user_id: string | null
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          expires_at?: string | null
          hit_count?: number | null
          id?: string
          result: Json
          tokens_saved?: number | null
          tool_name: string
          user_id?: string | null
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          expires_at?: string | null
          hit_count?: number | null
          id?: string
          result?: Json
          tokens_saved?: number | null
          tool_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      intelligence_cost_reference: {
        Row: {
          avg_embeddings: number | null
          avg_input_tokens: number | null
          avg_output_tokens: number | null
          embedding_cost_per_1k: number | null
          estimated_cost_per_call: number | null
          id: string
          input_cost_per_1k: number | null
          model_used: string
          output_cost_per_1k: number | null
          tool_name: string
          updated_at: string | null
        }
        Insert: {
          avg_embeddings?: number | null
          avg_input_tokens?: number | null
          avg_output_tokens?: number | null
          embedding_cost_per_1k?: number | null
          estimated_cost_per_call?: number | null
          id?: string
          input_cost_per_1k?: number | null
          model_used: string
          output_cost_per_1k?: number | null
          tool_name: string
          updated_at?: string | null
        }
        Update: {
          avg_embeddings?: number | null
          avg_input_tokens?: number | null
          avg_output_tokens?: number | null
          embedding_cost_per_1k?: number | null
          estimated_cost_per_call?: number | null
          id?: string
          input_cost_per_1k?: number | null
          model_used?: string
          output_cost_per_1k?: number | null
          tool_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      key_rotation_policies: {
        Row: {
          auto_rotate: boolean | null
          created_at: string | null
          frequency_days: number
          id: string
          key_id: string
          last_rotation: string | null
          next_rotation: string | null
          rotation_history: Json | null
          updated_at: string | null
        }
        Insert: {
          auto_rotate?: boolean | null
          created_at?: string | null
          frequency_days?: number
          id?: string
          key_id: string
          last_rotation?: string | null
          next_rotation?: string | null
          rotation_history?: Json | null
          updated_at?: string | null
        }
        Update: {
          auto_rotate?: boolean | null
          created_at?: string | null
          frequency_days?: number
          id?: string
          key_id?: string
          last_rotation?: string | null
          next_rotation?: string | null
          rotation_history?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_rotation_policies_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: true
            referencedRelation: "api_keys_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_rotation_policies_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: true
            referencedRelation: "stored_api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      key_security_events: {
        Row: {
          description: string
          event_type: string
          id: string
          key_id: string | null
          metadata: Json | null
          organization_id: string | null
          severity: string
          timestamp: string | null
        }
        Insert: {
          description: string
          event_type: string
          id?: string
          key_id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          severity: string
          timestamp?: string | null
        }
        Update: {
          description?: string
          event_type?: string
          id?: string
          key_id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          severity?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_security_events_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "api_keys_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_security_events_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "stored_api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_gaps: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          filled_at: string | null
          gap_description: string | null
          id: string
          related_memories: string[] | null
          status: string | null
          suggested_resources: Json | null
          topic: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          filled_at?: string | null
          gap_description?: string | null
          id?: string
          related_memories?: string[] | null
          status?: string | null
          suggested_resources?: Json | null
          topic: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          filled_at?: string | null
          gap_description?: string | null
          id?: string
          related_memories?: string[] | null
          status?: string | null
          suggested_resources?: Json | null
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      mcp_key_access_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          context: Json | null
          created_at: string | null
          environment: string
          estimated_duration: number
          id: string
          justification: string
          key_names: string[]
          organization_id: string
          requires_approval: boolean | null
          status: string
          tool_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          context?: Json | null
          created_at?: string | null
          environment: string
          estimated_duration: number
          id: string
          justification: string
          key_names: string[]
          organization_id: string
          requires_approval?: boolean | null
          status?: string
          tool_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          context?: Json | null
          created_at?: string | null
          environment?: string
          estimated_duration?: number
          id?: string
          justification?: string
          key_names?: string[]
          organization_id?: string
          requires_approval?: boolean | null
          status?: string
          tool_id?: string
        }
        Relationships: []
      }
      mcp_key_sessions: {
        Row: {
          created_at: string | null
          ended_at: string | null
          environment: string
          expires_at: string
          id: string
          key_names: string[]
          organization_id: string
          request_id: string
          session_id: string
          tool_id: string
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          environment: string
          expires_at: string
          id?: string
          key_names: string[]
          organization_id: string
          request_id: string
          session_id: string
          tool_id: string
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          environment?: string
          expires_at?: string
          id?: string
          key_names?: string[]
          organization_id?: string
          request_id?: string
          session_id?: string
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_key_sessions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "mcp_key_access_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_key_tools: {
        Row: {
          auto_approve: boolean | null
          created_at: string | null
          created_by: string
          id: string
          organization_id: string
          permissions: Json
          risk_level: string
          status: string
          tool_id: string
          tool_name: string
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          auto_approve?: boolean | null
          created_at?: string | null
          created_by: string
          id?: string
          organization_id: string
          permissions?: Json
          risk_level?: string
          status?: string
          tool_id: string
          tool_name: string
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          auto_approve?: boolean | null
          created_at?: string | null
          created_by?: string
          id?: string
          organization_id?: string
          permissions?: Json
          risk_level?: string
          status?: string
          tool_id?: string
          tool_name?: string
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      mcp_process_pool: {
        Row: {
          active_requests: number | null
          cpu_percent: number | null
          id: string
          idle_timeout_seconds: number | null
          last_activity_at: string | null
          memory_mb: number | null
          pid: number | null
          process_id: string
          service_key: string
          started_at: string | null
          status: string | null
          terminated_at: string | null
          termination_reason: string | null
          total_requests: number | null
          user_id: string
        }
        Insert: {
          active_requests?: number | null
          cpu_percent?: number | null
          id?: string
          idle_timeout_seconds?: number | null
          last_activity_at?: string | null
          memory_mb?: number | null
          pid?: number | null
          process_id: string
          service_key: string
          started_at?: string | null
          status?: string | null
          terminated_at?: string | null
          termination_reason?: string | null
          total_requests?: number | null
          user_id: string
        }
        Update: {
          active_requests?: number | null
          cpu_percent?: number | null
          id?: string
          idle_timeout_seconds?: number | null
          last_activity_at?: string | null
          memory_mb?: number | null
          pid?: number | null
          process_id?: string
          service_key?: string
          started_at?: string | null
          status?: string | null
          terminated_at?: string | null
          termination_reason?: string | null
          total_requests?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_process_pool_service_key_fkey"
            columns: ["service_key"]
            isOneToOne: false
            referencedRelation: "mcp_service_catalog"
            referencedColumns: ["service_key"]
          },
        ]
      }
      mcp_proxy_tokens: {
        Row: {
          created_at: string | null
          encrypted_mapping: string
          expires_at: string
          id: string
          key_name: string
          proxy_value: string
          revoked_at: string | null
          session_id: string
        }
        Insert: {
          created_at?: string | null
          encrypted_mapping: string
          expires_at: string
          id?: string
          key_name: string
          proxy_value: string
          revoked_at?: string | null
          session_id: string
        }
        Update: {
          created_at?: string | null
          encrypted_mapping?: string
          expires_at?: string
          id?: string
          key_name?: string
          proxy_value?: string
          revoked_at?: string | null
          session_id?: string
        }
        Relationships: []
      }
      mcp_rate_limits: {
        Row: {
          api_key_id: string
          id: string
          request_count: number | null
          window_start: string
          window_type: string
        }
        Insert: {
          api_key_id: string
          id?: string
          request_count?: number | null
          window_start: string
          window_type: string
        }
        Update: {
          api_key_id?: string
          id?: string
          request_count?: number | null
          window_start?: string
          window_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_rate_limits_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_service_catalog: {
        Row: {
          base_url: string | null
          category: string | null
          created_at: string | null
          credential_fields: Json
          description: string | null
          display_name: string
          documentation_url: string | null
          health_check_endpoint: string | null
          icon: string | null
          id: string
          is_available: boolean | null
          is_beta: boolean | null
          mcp_args: Json | null
          mcp_command: string | null
          mcp_env_mapping: Json | null
          requires_approval: boolean | null
          service_key: string
          updated_at: string | null
        }
        Insert: {
          base_url?: string | null
          category?: string | null
          created_at?: string | null
          credential_fields?: Json
          description?: string | null
          display_name: string
          documentation_url?: string | null
          health_check_endpoint?: string | null
          icon?: string | null
          id?: string
          is_available?: boolean | null
          is_beta?: boolean | null
          mcp_args?: Json | null
          mcp_command?: string | null
          mcp_env_mapping?: Json | null
          requires_approval?: boolean | null
          service_key: string
          updated_at?: string | null
        }
        Update: {
          base_url?: string | null
          category?: string | null
          created_at?: string | null
          credential_fields?: Json
          description?: string | null
          display_name?: string
          documentation_url?: string | null
          health_check_endpoint?: string | null
          icon?: string | null
          id?: string
          is_available?: boolean | null
          is_beta?: boolean | null
          mcp_args?: Json | null
          mcp_command?: string | null
          mcp_env_mapping?: Json | null
          requires_approval?: boolean | null
          service_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      memory_access_patterns: {
        Row: {
          access_method: string | null
          access_type: string
          created_at: string | null
          id: string
          memory_id: string | null
          user_id: string
        }
        Insert: {
          access_method?: string | null
          access_type: string
          created_at?: string | null
          id?: string
          memory_id?: string | null
          user_id: string
        }
        Update: {
          access_method?: string | null
          access_type?: string
          created_at?: string | null
          id?: string
          memory_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_access_patterns_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memory_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_chunks: {
        Row: {
          access_count: number | null
          chunk_index: number
          content: string
          created_at: string
          embedding: string | null
          end_offset: number
          id: string
          last_accessed_at: string | null
          memory_id: string
          metadata: Json
          organization_id: string
          start_offset: number
          token_count: number | null
          updated_at: string
        }
        Insert: {
          access_count?: number | null
          chunk_index: number
          content: string
          created_at?: string
          embedding?: string | null
          end_offset: number
          id?: string
          last_accessed_at?: string | null
          memory_id: string
          metadata?: Json
          organization_id: string
          start_offset: number
          token_count?: number | null
          updated_at?: string
        }
        Update: {
          access_count?: number | null
          chunk_index?: number
          content?: string
          created_at?: string
          embedding?: string | null
          end_offset?: number
          id?: string
          last_accessed_at?: string | null
          memory_id?: string
          metadata?: Json
          organization_id?: string
          start_offset?: number
          token_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_chunks_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memory_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_chunks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_versions: {
        Row: {
          change_summary: string | null
          change_type: string
          changed_fields: string[] | null
          content: string
          created_at: string
          created_by: string
          id: string
          memory_id: string
          metadata: Json | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          change_type: string
          changed_fields?: string[] | null
          content: string
          created_at?: string
          created_by: string
          id?: string
          memory_id: string
          metadata?: Json | null
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string
          version_number: number
        }
        Update: {
          change_summary?: string | null
          change_type?: string
          changed_fields?: string[] | null
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          memory_id?: string
          metadata?: Json | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "memory_versions_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memory_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string
          error_enabled: boolean
          id: string
          info_enabled: boolean
          success_enabled: boolean
          updated_at: string
          user_id: string
          warning_enabled: boolean
        }
        Insert: {
          created_at?: string
          error_enabled?: boolean
          id?: string
          info_enabled?: boolean
          success_enabled?: boolean
          updated_at?: string
          user_id: string
          warning_enabled?: boolean
        }
        Update: {
          created_at?: string
          error_enabled?: boolean
          id?: string
          info_enabled?: boolean
          success_enabled?: boolean
          updated_at?: string
          user_id?: string
          warning_enabled?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean
          message: string
          notification_group: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          notification_group?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          notification_group?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offline_sync_queue: {
        Row: {
          client_id: string
          conflict_details: Json | null
          conflict_resolution: string | null
          created_at: string | null
          id: string
          local_timestamp: string
          memory_data: Json
          sync_error: string | null
          sync_status: string | null
          synced_at: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          conflict_details?: Json | null
          conflict_resolution?: string | null
          created_at?: string | null
          id?: string
          local_timestamp: string
          memory_data: Json
          sync_error?: string | null
          sync_status?: string | null
          synced_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          conflict_details?: Json | null
          conflict_resolution?: string | null
          created_at?: string | null
          id?: string
          local_timestamp?: string
          memory_data?: Json
          sync_error?: string | null
          sync_status?: string | null
          synced_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      predictive_memory_suggestions: {
        Row: {
          accepted: boolean | null
          based_on_patterns: Json | null
          context_memories: string[] | null
          created_at: string | null
          feedback_at: string | null
          id: string
          prediction_confidence: number | null
          prediction_reason: string | null
          suggested_memory: Json
          user_id: string
        }
        Insert: {
          accepted?: boolean | null
          based_on_patterns?: Json | null
          context_memories?: string[] | null
          created_at?: string | null
          feedback_at?: string | null
          id?: string
          prediction_confidence?: number | null
          prediction_reason?: string | null
          suggested_memory: Json
          user_id: string
        }
        Update: {
          accepted?: boolean | null
          based_on_patterns?: Json | null
          context_memories?: string[] | null
          created_at?: string | null
          feedback_at?: string | null
          id?: string
          prediction_confidence?: number | null
          prediction_reason?: string | null
          suggested_memory?: Json
          user_id?: string
        }
        Relationships: []
      }
      pricing_insights: {
        Row: {
          confidence_score: number
          created_at: string | null
          expires_at: string | null
          id: string
          market_trend: string | null
          max_viable_price: number | null
          min_viable_price: number | null
          price_elasticity: number | null
          product_id: string
          reasoning: string | null
          suggested_price: number
        }
        Insert: {
          confidence_score: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          market_trend?: string | null
          max_viable_price?: number | null
          min_viable_price?: number | null
          price_elasticity?: number | null
          product_id: string
          reasoning?: string | null
          suggested_price: number
        }
        Update: {
          confidence_score?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          market_trend?: string | null
          max_viable_price?: number | null
          min_viable_price?: number | null
          price_elasticity?: number | null
          product_id?: string
          reasoning?: string | null
          suggested_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pricing_insights_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_type: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_vendor: boolean | null
          last_name: string | null
          organization_id: string | null
          stripe_customer_id: string | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          business_type?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          is_vendor?: boolean | null
          last_name?: string | null
          organization_id?: string | null
          stripe_customer_id?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          business_type?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_vendor?: boolean | null
          last_name?: string | null
          organization_id?: string | null
          stripe_customer_id?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_capabilities: {
        Row: {
          allowed_currencies: string[] | null
          cards_enabled: boolean | null
          created_at: string | null
          daily_payment_limit: number | null
          daily_transfer_limit: number | null
          id: string
          kyc_enabled: boolean | null
          kyc_types: string[] | null
          monthly_volume_limit: number | null
          payments_enabled: boolean | null
          per_payment_limit: number | null
          per_transfer_limit: number | null
          project_id: string
          requests_per_hour: number | null
          requests_per_minute: number | null
          tier: string | null
          transfers_enabled: boolean | null
          updated_at: string | null
          wallet_enabled: boolean | null
          webhooks_enabled: boolean | null
        }
        Insert: {
          allowed_currencies?: string[] | null
          cards_enabled?: boolean | null
          created_at?: string | null
          daily_payment_limit?: number | null
          daily_transfer_limit?: number | null
          id?: string
          kyc_enabled?: boolean | null
          kyc_types?: string[] | null
          monthly_volume_limit?: number | null
          payments_enabled?: boolean | null
          per_payment_limit?: number | null
          per_transfer_limit?: number | null
          project_id: string
          requests_per_hour?: number | null
          requests_per_minute?: number | null
          tier?: string | null
          transfers_enabled?: boolean | null
          updated_at?: string | null
          wallet_enabled?: boolean | null
          webhooks_enabled?: boolean | null
        }
        Update: {
          allowed_currencies?: string[] | null
          cards_enabled?: boolean | null
          created_at?: string | null
          daily_payment_limit?: number | null
          daily_transfer_limit?: number | null
          id?: string
          kyc_enabled?: boolean | null
          kyc_types?: string[] | null
          monthly_volume_limit?: number | null
          payments_enabled?: boolean | null
          per_payment_limit?: number | null
          per_transfer_limit?: number | null
          project_id?: string
          requests_per_hour?: number | null
          requests_per_minute?: number | null
          tier?: string | null
          transfers_enabled?: boolean | null
          updated_at?: string | null
          wallet_enabled?: boolean | null
          webhooks_enabled?: boolean | null
        }
        Relationships: []
      }
      provider_accounts: {
        Row: {
          base_url: string | null
          config: Json
          created_at: string | null
          created_by: string | null
          daily_limit_amount: number | null
          environment: Database["public"]["Enums"]["environment_type"]
          health_check_url: string | null
          id: string
          last_health_check_at: string | null
          last_health_status: string | null
          per_transaction_limit: number | null
          priority: number | null
          project_id: string
          provider_name: string
          provider_type: Database["public"]["Enums"]["provider_type"]
          status: Database["public"]["Enums"]["provider_status"]
          supported_countries: string[] | null
          supported_currencies: string[] | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          base_url?: string | null
          config?: Json
          created_at?: string | null
          created_by?: string | null
          daily_limit_amount?: number | null
          environment?: Database["public"]["Enums"]["environment_type"]
          health_check_url?: string | null
          id?: string
          last_health_check_at?: string | null
          last_health_status?: string | null
          per_transaction_limit?: number | null
          priority?: number | null
          project_id: string
          provider_name: string
          provider_type: Database["public"]["Enums"]["provider_type"]
          status?: Database["public"]["Enums"]["provider_status"]
          supported_countries?: string[] | null
          supported_currencies?: string[] | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          base_url?: string | null
          config?: Json
          created_at?: string | null
          created_by?: string | null
          daily_limit_amount?: number | null
          environment?: Database["public"]["Enums"]["environment_type"]
          health_check_url?: string | null
          id?: string
          last_health_check_at?: string | null
          last_health_status?: string | null
          per_transaction_limit?: number | null
          priority?: number | null
          project_id?: string
          provider_name?: string
          provider_type?: Database["public"]["Enums"]["provider_type"]
          status?: Database["public"]["Enums"]["provider_status"]
          supported_countries?: string[] | null
          supported_currencies?: string[] | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      provider_references: {
        Row: {
          created_at: string | null
          id: string
          internal_ref: string
          internal_type: string
          normalized_status: string
          provider_name: string
          provider_ref: string | null
          provider_session_id: string | null
          provider_status: string | null
          raw_request: Json | null
          raw_response: Json | null
          response_at: string | null
          sent_at: string | null
          settled_at: string | null
          status_reason: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          internal_ref: string
          internal_type: string
          normalized_status: string
          provider_name: string
          provider_ref?: string | null
          provider_session_id?: string | null
          provider_status?: string | null
          raw_request?: Json | null
          raw_response?: Json | null
          response_at?: string | null
          sent_at?: string | null
          settled_at?: string | null
          status_reason?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          internal_ref?: string
          internal_type?: string
          normalized_status?: string
          provider_name?: string
          provider_ref?: string | null
          provider_session_id?: string | null
          provider_status?: string | null
          raw_request?: Json | null
          raw_response?: Json | null
          response_at?: string | null
          sent_at?: string | null
          settled_at?: string | null
          status_reason?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      query_classifications: {
        Row: {
          actual_complexity: string | null
          classified_complexity: string
          created_at: string
          feedback_score: number | null
          id: string
          prompt: string
          tokens_used: number | null
          was_escalated: boolean | null
        }
        Insert: {
          actual_complexity?: string | null
          classified_complexity: string
          created_at?: string
          feedback_score?: number | null
          id?: string
          prompt: string
          tokens_used?: number | null
          was_escalated?: boolean | null
        }
        Update: {
          actual_complexity?: string | null
          classified_complexity?: string
          created_at?: string
          feedback_score?: number | null
          id?: string
          prompt?: string
          tokens_used?: number | null
          was_escalated?: boolean | null
        }
        Relationships: []
      }
      risk_analysis: {
        Row: {
          created_at: string | null
          id: string
          is_flagged: boolean | null
          order_id: string | null
          review_status: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          risk_factors: Json | null
          risk_score: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_flagged?: boolean | null
          order_id?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          risk_factors?: Json | null
          risk_score: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_flagged?: boolean | null
          order_id?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          risk_factors?: Json | null
          risk_score?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_analysis_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_analysis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      say_bills: {
        Row: {
          amount: number
          bill_type: string
          completed_at: string | null
          created_at: string | null
          currency: string | null
          customer_id: string
          id: number
          raw_response: Json | null
          reference: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          bill_type: string
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id: string
          id?: number
          raw_response?: Json | null
          reference: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          bill_type?: string
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string
          id?: number
          raw_response?: Json | null
          reference?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      say_transfers: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          currency: string | null
          id: number
          raw_response: Json | null
          recipient_account: string | null
          recipient_name: string | null
          reference: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: number
          raw_response?: Json | null
          recipient_account?: string | null
          recipient_name?: string | null
          reference: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: number
          raw_response?: Json | null
          recipient_account?: string | null
          recipient_name?: string | null
          reference?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      screenshot_memories: {
        Row: {
          created_at: string | null
          detected_objects: string[] | null
          detected_text_regions: Json | null
          extracted_text: string | null
          id: string
          image_format: string | null
          image_size_bytes: number | null
          image_url: string
          memory_id: string
          ocr_confidence: number | null
          processing_status: string | null
          vision_analysis: Json | null
          vision_model: string | null
        }
        Insert: {
          created_at?: string | null
          detected_objects?: string[] | null
          detected_text_regions?: Json | null
          extracted_text?: string | null
          id?: string
          image_format?: string | null
          image_size_bytes?: number | null
          image_url: string
          memory_id: string
          ocr_confidence?: number | null
          processing_status?: string | null
          vision_analysis?: Json | null
          vision_model?: string | null
        }
        Update: {
          created_at?: string | null
          detected_objects?: string[] | null
          detected_text_regions?: Json | null
          extracted_text?: string | null
          id?: string
          image_format?: string | null
          image_size_bytes?: number | null
          image_url?: string
          memory_id?: string
          ocr_confidence?: number | null
          processing_status?: string | null
          vision_analysis?: Json | null
          vision_model?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "screenshot_memories_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memory_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          category: string | null
          created_at: string | null
          filters: Json | null
          id: string
          results_count: number | null
          search_query: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          filters?: Json | null
          id?: string
          results_count?: number | null
          search_query: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          filters?: Json | null
          id?: string
          results_count?: number | null
          search_query?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      simple_users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          password_hash: string
          project_scope: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          password_hash: string
          project_scope?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          password_hash?: string
          project_scope?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sm_feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          enabled: boolean
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sm_payment_records: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          status: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sm_payment_records_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "sm_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sm_payment_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sm_subscriptions: {
        Row: {
          billing_cycle: string | null
          category: string
          color: string | null
          created_at: string | null
          currency: string | null
          deactivation_date: string | null
          id: string
          last_used: string | null
          logo_url: string | null
          monthly_cost: number
          name: string
          notes: string | null
          payment_method: string
          plan_name: string
          priority: string | null
          renewal_date: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          category: string
          color?: string | null
          created_at?: string | null
          currency?: string | null
          deactivation_date?: string | null
          id?: string
          last_used?: string | null
          logo_url?: string | null
          monthly_cost: number
          name: string
          notes?: string | null
          payment_method: string
          plan_name: string
          priority?: string | null
          renewal_date: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          category?: string
          color?: string | null
          created_at?: string | null
          currency?: string | null
          deactivation_date?: string | null
          id?: string
          last_used?: string | null
          logo_url?: string | null
          monthly_cost?: number
          name?: string
          notes?: string | null
          payment_method?: string
          plan_name?: string
          priority?: string | null
          renewal_date?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sm_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_recall_history: {
        Row: {
          clicked_at: string | null
          created_at: string | null
          id: string
          memories_clicked: string[] | null
          memory_ids: string[]
          opened_at: string | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string | null
          id?: string
          memories_clicked?: string[] | null
          memory_ids: string[]
          opened_at?: string | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          clicked_at?: string | null
          created_at?: string | null
          id?: string
          memories_clicked?: string[] | null
          memory_ids?: string[]
          opened_at?: string | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      smart_recall_schedule: {
        Row: {
          created_at: string | null
          email: string
          enabled: boolean | null
          frequency: string | null
          id: string
          include_insights: boolean | null
          last_sent_at: string | null
          max_memories_per_email: number | null
          next_send_at: string | null
          preferred_time: string | null
          timezone: string | null
          total_clicked: number | null
          total_opened: number | null
          total_sent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          enabled?: boolean | null
          frequency?: string | null
          id?: string
          include_insights?: boolean | null
          last_sent_at?: string | null
          max_memories_per_email?: number | null
          next_send_at?: string | null
          preferred_time?: string | null
          timezone?: string | null
          total_clicked?: number | null
          total_opened?: number | null
          total_sent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          enabled?: boolean | null
          frequency?: string | null
          id?: string
          include_insights?: boolean | null
          last_sent_at?: string | null
          max_memories_per_email?: number | null
          next_send_at?: string | null
          preferred_time?: string | null
          timezone?: string | null
          total_clicked?: number | null
          total_opened?: number | null
          total_sent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          customer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          user_id?: string
        }
        Relationships: []
      }
      stripe_subscriptions: {
        Row: {
          cancel_at: string | null
          created_at: string | null
          current_period_end: string | null
          customer_id: string
          id: string
          price_id: string | null
          status: string
          stripe_subscription_id: string
          updated_at: string | null
        }
        Insert: {
          cancel_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          customer_id: string
          id?: string
          price_id?: string | null
          status: string
          stripe_subscription_id: string
          updated_at?: string | null
        }
        Update: {
          cancel_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          customer_id?: string
          id?: string
          price_id?: string | null
          status?: string
          stripe_subscription_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "stripe_customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      sync_config: {
        Row: {
          created_at: string | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          id: string
          joined_at: string | null
          role: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          id?: string
          joined_at?: string | null
          role?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          id?: string
          joined_at?: string | null
          role?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_shared_memories: {
        Row: {
          created_at: string | null
          id: string
          memory_id: string
          shared_by: string | null
          team_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          memory_id: string
          shared_by?: string | null
          team_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          memory_id?: string
          shared_by?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_shared_memories_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memory_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_shared_memories_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      topics: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json
          name: string
          organization_id: string
          parent_id: string | null
          sort_order: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          name: string
          organization_id: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_number: string | null
          amount: number
          bank_code: string | null
          completed_at: string | null
          created_at: string
          currency: string
          destination_id: string
          destination_name: string | null
          destination_type: string
          failure_reason: string | null
          fee: number
          id: string
          metadata: Json | null
          narration: string | null
          provider: string
          provider_transaction_id: string | null
          reference: string
          session_id: string | null
          sort_code: string | null
          source_wallet_id: string
          status: string
          total_amount: number
          updated_at: string
          vat: number
        }
        Insert: {
          account_number?: string | null
          amount: number
          bank_code?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          destination_id: string
          destination_name?: string | null
          destination_type: string
          failure_reason?: string | null
          fee?: number
          id?: string
          metadata?: Json | null
          narration?: string | null
          provider?: string
          provider_transaction_id?: string | null
          reference: string
          session_id?: string | null
          sort_code?: string | null
          source_wallet_id: string
          status?: string
          total_amount: number
          updated_at?: string
          vat?: number
        }
        Update: {
          account_number?: string | null
          amount?: number
          bank_code?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          destination_id?: string
          destination_name?: string | null
          destination_type?: string
          failure_reason?: string | null
          fee?: number
          id?: string
          metadata?: Json | null
          narration?: string | null
          provider?: string
          provider_transaction_id?: string | null
          reference?: string
          session_id?: string | null
          sort_code?: string | null
          source_wallet_id?: string
          status?: string
          total_amount?: number
          updated_at?: string
          vat?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_source_wallet_id_fkey"
            columns: ["source_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_config: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          user_id: string
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          user_id: string
          value: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          consent_type: string
          created_at: string | null
          granted: boolean
          id: number
          metadata: Json | null
          updated_at: string | null
          user_id: string | null
          version: string | null
        }
        Insert: {
          consent_type: string
          created_at?: string | null
          granted: boolean
          id?: number
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string | null
          version?: string | null
        }
        Update: {
          consent_type?: string
          created_at?: string | null
          granted?: boolean
          id?: number
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string | null
          version?: string | null
        }
        Relationships: []
      }
      user_mcp_services: {
        Row: {
          alias: string | null
          created_at: string | null
          encrypted_credentials: string
          encryption_key_id: string | null
          encryption_version: number | null
          environment: string | null
          failed_calls: number | null
          health_status: string | null
          id: string
          is_enabled: boolean | null
          last_health_check: string | null
          last_used_at: string | null
          service_key: string
          successful_calls: number | null
          total_calls: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alias?: string | null
          created_at?: string | null
          encrypted_credentials: string
          encryption_key_id?: string | null
          encryption_version?: number | null
          environment?: string | null
          failed_calls?: number | null
          health_status?: string | null
          id?: string
          is_enabled?: boolean | null
          last_health_check?: string | null
          last_used_at?: string | null
          service_key: string
          successful_calls?: number | null
          total_calls?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alias?: string | null
          created_at?: string | null
          encrypted_credentials?: string
          encryption_key_id?: string | null
          encryption_version?: number | null
          environment?: string | null
          failed_calls?: number | null
          health_status?: string | null
          id?: string
          is_enabled?: boolean | null
          last_health_check?: string | null
          last_used_at?: string | null
          service_key?: string
          successful_calls?: number | null
          total_calls?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mcp_services_service_key_fkey"
            columns: ["service_key"]
            isOneToOne: false
            referencedRelation: "mcp_service_catalog"
            referencedColumns: ["service_key"]
          },
        ]
      }
      user_preferences: {
        Row: {
          business_size: string | null
          created_at: string
          id: string
          industry_focus: string[] | null
          payment_methods: string[] | null
          preferred_currencies: string[] | null
          regions_of_interest: string[] | null
          risk_tolerance: string | null
          trade_frequency: string | null
          trade_volume: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_size?: string | null
          created_at?: string
          id?: string
          industry_focus?: string[] | null
          payment_methods?: string[] | null
          preferred_currencies?: string[] | null
          regions_of_interest?: string[] | null
          risk_tolerance?: string | null
          trade_frequency?: string | null
          trade_volume?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_size?: string | null
          created_at?: string
          id?: string
          industry_focus?: string[] | null
          payment_methods?: string[] | null
          preferred_currencies?: string[] | null
          regions_of_interest?: string[] | null
          risk_tolerance?: string | null
          trade_frequency?: string | null
          trade_volume?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: number
          role: string
          user_id: string | null
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: number
          role: string
          user_id?: string | null
        }
        Update: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: number
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_sync_log: {
        Row: {
          completed_at: string | null
          errors: Json | null
          id: number
          metadata: Json | null
          started_at: string | null
          status: string | null
          sync_type: string
          users_synced: number | null
        }
        Insert: {
          completed_at?: string | null
          errors?: Json | null
          id?: number
          metadata?: Json | null
          started_at?: string | null
          status?: string | null
          sync_type: string
          users_synced?: number | null
        }
        Update: {
          completed_at?: string | null
          errors?: Json | null
          id?: number
          metadata?: Json | null
          started_at?: string | null
          status?: string | null
          sync_type?: string
          users_synced?: number | null
        }
        Relationships: []
      }
      user_tiers: {
        Row: {
          can_use_advanced_models: boolean
          created_at: string
          expires_at: string | null
          id: string
          max_queries_per_day: number
          tier_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_use_advanced_models?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          max_queries_per_day?: number
          tier_name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_use_advanced_models?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          max_queries_per_day?: number
          tier_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vendor_api_keys: {
        Row: {
          created_at: string | null
          description: string | null
          encrypted_key: string
          id: string
          is_active: boolean | null
          key_name: string
          last_used_at: string | null
          updated_at: string | null
          vendor_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          encrypted_key: string
          id?: string
          is_active?: boolean | null
          key_name: string
          last_used_at?: string | null
          updated_at?: string | null
          vendor_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          encrypted_key?: string
          id?: string
          is_active?: boolean | null
          key_name?: string
          last_used_at?: string | null
          updated_at?: string | null
          vendor_name?: string
        }
        Relationships: []
      }
      vendor_api_keys_v2: {
        Row: {
          allowed_ip_ranges: Json | null
          allowed_platforms: Json | null
          allowed_services: Json | null
          created_at: string | null
          environment: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_description: string | null
          key_id: string
          key_name: string
          key_secret_hash: string
          key_type: string | null
          last_request_at: string | null
          last_used_at: string | null
          monthly_requests: number | null
          rate_limit_override: number | null
          requires_signature: boolean | null
          total_requests: number | null
          updated_at: string | null
          vendor_org_id: string
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          allowed_ip_ranges?: Json | null
          allowed_platforms?: Json | null
          allowed_services?: Json | null
          created_at?: string | null
          environment?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_description?: string | null
          key_id: string
          key_name?: string
          key_secret_hash: string
          key_type?: string | null
          last_request_at?: string | null
          last_used_at?: string | null
          monthly_requests?: number | null
          rate_limit_override?: number | null
          requires_signature?: boolean | null
          total_requests?: number | null
          updated_at?: string | null
          vendor_org_id: string
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          allowed_ip_ranges?: Json | null
          allowed_platforms?: Json | null
          allowed_services?: Json | null
          created_at?: string | null
          environment?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_description?: string | null
          key_id?: string
          key_name?: string
          key_secret_hash?: string
          key_type?: string | null
          last_request_at?: string | null
          last_used_at?: string | null
          monthly_requests?: number | null
          rate_limit_override?: number | null
          requires_signature?: boolean | null
          total_requests?: number | null
          updated_at?: string | null
          vendor_org_id?: string
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_api_keys_v2_vendor_org_id_fkey"
            columns: ["vendor_org_id"]
            isOneToOne: false
            referencedRelation: "vendor_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_organizations: {
        Row: {
          billing_address: Json | null
          billing_model: string | null
          billing_tier: string | null
          business_registration: string | null
          compliance_requirements: Json | null
          contact_email: string
          contact_name: string | null
          created_at: string | null
          created_by: string | null
          credit_balance: number | null
          currency: string | null
          data_retention_days: number | null
          id: string
          monthly_limit: number | null
          monthly_spend_limit: number | null
          organization_name: string
          organization_type: string
          platform_access: Json | null
          privacy_level: string | null
          rate_limit_per_minute: number | null
          service_permissions: Json | null
          status: string | null
          tax_id: string | null
          trial_ends_at: string | null
          updated_at: string | null
          vendor_code: string
          website_url: string | null
        }
        Insert: {
          billing_address?: Json | null
          billing_model?: string | null
          billing_tier?: string | null
          business_registration?: string | null
          compliance_requirements?: Json | null
          contact_email: string
          contact_name?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_balance?: number | null
          currency?: string | null
          data_retention_days?: number | null
          id?: string
          monthly_limit?: number | null
          monthly_spend_limit?: number | null
          organization_name: string
          organization_type: string
          platform_access?: Json | null
          privacy_level?: string | null
          rate_limit_per_minute?: number | null
          service_permissions?: Json | null
          status?: string | null
          tax_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          vendor_code: string
          website_url?: string | null
        }
        Update: {
          billing_address?: Json | null
          billing_model?: string | null
          billing_tier?: string | null
          business_registration?: string | null
          compliance_requirements?: Json | null
          contact_email?: string
          contact_name?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_balance?: number | null
          currency?: string | null
          data_retention_days?: number | null
          id?: string
          monthly_limit?: number | null
          monthly_spend_limit?: number | null
          organization_name?: string
          organization_type?: string
          platform_access?: Json | null
          privacy_level?: string | null
          rate_limit_per_minute?: number | null
          service_permissions?: Json | null
          status?: string | null
          tax_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          vendor_code?: string
          website_url?: string | null
        }
        Relationships: []
      }
      vendor_platform_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_activity_at: string | null
          mfa_verified_at: string | null
          platform: string
          requires_mfa: boolean | null
          session_metadata: Json | null
          session_token: string
          user_agent: string | null
          user_id: string | null
          vendor_org_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity_at?: string | null
          mfa_verified_at?: string | null
          platform: string
          requires_mfa?: boolean | null
          session_metadata?: Json | null
          session_token: string
          user_agent?: string | null
          user_id?: string | null
          vendor_org_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity_at?: string | null
          mfa_verified_at?: string | null
          platform?: string
          requires_mfa?: boolean | null
          session_metadata?: Json | null
          session_token?: string
          user_agent?: string | null
          user_id?: string | null
          vendor_org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_platform_sessions_vendor_org_id_fkey"
            columns: ["vendor_org_id"]
            isOneToOne: false
            referencedRelation: "vendor_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_cards: {
        Row: {
          brand: string | null
          card_id: string | null
          cardholder_id: string | null
          created_at: string
          id: string
          is_locked: boolean
          last4: string | null
          status: string
          subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          brand?: string | null
          card_id?: string | null
          cardholder_id?: string | null
          created_at?: string
          id?: string
          is_locked?: boolean
          last4?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          brand?: string | null
          card_id?: string | null
          cardholder_id?: string | null
          created_at?: string
          id?: string
          is_locked?: boolean
          last4?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "virtual_cards_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "sm_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_memories: {
        Row: {
          audio_duration_seconds: number | null
          audio_format: string | null
          audio_url: string | null
          created_at: string | null
          id: string
          memory_id: string | null
          processing_error: string | null
          processing_status: string | null
          transcript: string
          transcript_confidence: number | null
          transcript_language: string | null
          user_id: string
        }
        Insert: {
          audio_duration_seconds?: number | null
          audio_format?: string | null
          audio_url?: string | null
          created_at?: string | null
          id?: string
          memory_id?: string | null
          processing_error?: string | null
          processing_status?: string | null
          transcript: string
          transcript_confidence?: number | null
          transcript_language?: string | null
          user_id: string
        }
        Update: {
          audio_duration_seconds?: number | null
          audio_format?: string | null
          audio_url?: string | null
          created_at?: string | null
          id?: string
          memory_id?: string | null
          processing_error?: string | null
          processing_status?: string | null
          transcript?: string
          transcript_confidence?: number | null
          transcript_language?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_memories_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memory_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      vortex_items: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          keywords: string[] | null
          owner_id: string | null
          pitch: string | null
          source: string | null
          status: string | null
          title: string
          type: string | null
          updated_at: string | null
          url: string | null
          writer: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          owner_id?: string | null
          pitch?: string | null
          source?: string | null
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          url?: string | null
          writer?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          owner_id?: string | null
          pitch?: string | null
          source?: string | null
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          url?: string | null
          writer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vortex_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          account_name: string | null
          account_number: string | null
          available_balance: number
          created_at: string
          currency: string
          customer_id: string
          id: string
          last_balance_update: string | null
          ledger_balance: number
          metadata: Json | null
          provider: string
          provider_wallet_id: string
          reserved_balance: number
          status: string
          updated_at: string
          wallet_type: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          available_balance?: number
          created_at?: string
          currency?: string
          customer_id: string
          id?: string
          last_balance_update?: string | null
          ledger_balance?: number
          metadata?: Json | null
          provider?: string
          provider_wallet_id: string
          reserved_balance?: number
          status?: string
          updated_at?: string
          wallet_type?: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          available_balance?: number
          created_at?: string
          currency?: string
          customer_id?: string
          id?: string
          last_balance_update?: string | null
          ledger_balance?: number
          metadata?: Json | null
          provider?: string
          provider_wallet_id?: string
          reserved_balance?: number
          status?: string
          updated_at?: string
          wallet_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          endpoint_id: string
          event_id: string
          id: string
          last_attempt_at: string | null
          last_error: string | null
          last_response_body: string | null
          last_status_code: number | null
          max_attempts: number | null
          next_retry_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          endpoint_id: string
          event_id: string
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          last_response_body?: string | null
          last_status_code?: number | null
          max_attempts?: number | null
          next_retry_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          endpoint_id?: string
          event_id?: string
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          last_response_body?: string | null
          last_status_code?: number | null
          max_attempts?: number | null
          next_retry_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "webhook_events"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          events: string[] | null
          failed_deliveries: number | null
          id: string
          project_id: string
          retry_count: number | null
          secret: string
          signature_header: string | null
          status: Database["public"]["Enums"]["webhook_status"]
          successful_deliveries: number | null
          timeout_seconds: number | null
          total_deliveries: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          events?: string[] | null
          failed_deliveries?: number | null
          id?: string
          project_id: string
          retry_count?: number | null
          secret: string
          signature_header?: string | null
          status?: Database["public"]["Enums"]["webhook_status"]
          successful_deliveries?: number | null
          timeout_seconds?: number | null
          total_deliveries?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          events?: string[] | null
          failed_deliveries?: number | null
          id?: string
          project_id?: string
          retry_count?: number | null
          secret?: string
          signature_header?: string | null
          status?: Database["public"]["Enums"]["webhook_status"]
          successful_deliveries?: number | null
          timeout_seconds?: number | null
          total_deliveries?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload: Json
          processed: boolean | null
          processed_at: string | null
          source_id: string | null
          source_type: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          payload: Json
          processed?: boolean | null
          processed_at?: string | null
          source_id?: string | null
          source_type?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          source_id?: string | null
          source_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      accounts: {
        Row: {
          account_name: string | null
          account_type: string | null
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string | null
          is_active: boolean | null
          metadata: Json | null
          provider: string | null
          provider_account_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_name?: string | null
          account_type?: string | null
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          provider?: string | null
          provider_account_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_name?: string | null
          account_type?: string | null
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          provider?: string | null
          provider_account_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      agent_banks_memory_search_logs: {
        Row: {
          created_at: string | null
          execution_time_ms: number | null
          filters: Json | null
          id: string | null
          limit_requested: number | null
          query: string | null
          results_count: number | null
          search_type: string | null
          session_id: string | null
          threshold: number | null
          top_similarity_score: number | null
          user_context: string | null
        }
        Insert: {
          created_at?: string | null
          execution_time_ms?: number | null
          filters?: Json | null
          id?: string | null
          limit_requested?: number | null
          query?: string | null
          results_count?: number | null
          search_type?: string | null
          session_id?: string | null
          threshold?: number | null
          top_similarity_score?: number | null
          user_context?: string | null
        }
        Update: {
          created_at?: string | null
          execution_time_ms?: number | null
          filters?: Json | null
          id?: string | null
          limit_requested?: number | null
          query?: string | null
          results_count?: number | null
          search_type?: string | null
          session_id?: string | null
          threshold?: number | null
          top_similarity_score?: number | null
          user_context?: string | null
        }
        Relationships: []
      }
      ai_brainbox_ai_response_cache: {
        Row: {
          created_at: string | null
          expires_at: string | null
          hit_count: number | null
          id: string | null
          model_used: string | null
          prompt: string | null
          prompt_hash: string | null
          response: string | null
          tokens_used: number | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          hit_count?: number | null
          id?: string | null
          model_used?: string | null
          prompt?: string | null
          prompt_hash?: string | null
          response?: string | null
          tokens_used?: number | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          hit_count?: number | null
          id?: string | null
          model_used?: string | null
          prompt?: string | null
          prompt_hash?: string | null
          response?: string | null
          tokens_used?: number | null
        }
        Relationships: []
      }
      ai_brainbox_chat_conversations: {
        Row: {
          created_at: string | null
          id: string | null
          title: string | null
          topic: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          title?: string | null
          topic?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          title?: string | null
          topic?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_brainbox_chat_messages: {
        Row: {
          content: string | null
          conversation_id: string | null
          encrypted: boolean | null
          id: string | null
          role: string | null
          timestamp: string | null
        }
        Insert: {
          content?: string | null
          conversation_id?: string | null
          encrypted?: boolean | null
          id?: string | null
          role?: string | null
          timestamp?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string | null
          encrypted?: boolean | null
          id?: string | null
          role?: string | null
          timestamp?: string | null
        }
        Relationships: []
      }
      ai_brainbox_imported_data: {
        Row: {
          content: string | null
          created_at: string | null
          file_url: string | null
          id: string | null
          metadata: Json | null
          source_type: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string | null
          metadata?: Json | null
          source_type?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string | null
          metadata?: Json | null
          source_type?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_brainbox_memories: {
        Row: {
          access_count: number | null
          content: string | null
          created_at: string | null
          id: string | null
          memory_type: string | null
          metadata: Json | null
          project_ref: string | null
          relevance_score: number | null
          source_url: string | null
          status: string | null
          summary: string | null
          tags: Json | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          access_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          memory_type?: string | null
          metadata?: Json | null
          project_ref?: string | null
          relevance_score?: number | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          tags?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          access_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          memory_type?: string | null
          metadata?: Json | null
          project_ref?: string | null
          relevance_score?: number | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          tags?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_brainbox_sessions: {
        Row: {
          completed_at: string | null
          description: string | null
          id: string | null
          last_activity: string | null
          memory_count: number | null
          metadata: Json | null
          session_name: string | null
          session_type: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          description?: string | null
          id?: string | null
          last_activity?: string | null
          memory_count?: number | null
          metadata?: Json | null
          session_name?: string | null
          session_type?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          description?: string | null
          id?: string | null
          last_activity?: string | null
          memory_count?: number | null
          metadata?: Json | null
          session_name?: string | null
          session_type?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      ai_brainbox_vortex_items: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string | null
          keywords: string[] | null
          owner_id: string | null
          pitch: string | null
          source: string | null
          status: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          url: string | null
          writer: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string | null
          keywords?: string[] | null
          owner_id?: string | null
          pitch?: string | null
          source?: string | null
          status?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          url?: string | null
          writer?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string | null
          keywords?: string[] | null
          owner_id?: string | null
          pitch?: string | null
          source?: string | null
          status?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          url?: string | null
          writer?: string | null
        }
        Relationships: []
      }
      ai_chat_sessions: {
        Row: {
          created_at: string | null
          id: string | null
          last_message_at: string | null
          metadata: Json | null
          model: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          last_message_at?: string | null
          metadata?: Json | null
          model?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          last_message_at?: string | null
          metadata?: Json | null
          model?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          confidence_score: number | null
          content: Json | null
          created_at: string | null
          expires_at: string | null
          id: number | null
          recommendation_type: string | null
          used: boolean | null
          user_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          content?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: number | null
          recommendation_type?: string | null
          used?: boolean | null
          user_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          content?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: number | null
          recommendation_type?: string | null
          used?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          created_at: string | null
          estimated_cost: number | null
          feedback_text: string | null
          id: string | null
          model_used: string | null
          prompt: string | null
          query_complexity: string | null
          response_time_ms: number | null
          tokens_used: number | null
          user_feedback: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          estimated_cost?: number | null
          feedback_text?: string | null
          id?: string | null
          model_used?: string | null
          prompt?: string | null
          query_complexity?: string | null
          response_time_ms?: number | null
          tokens_used?: number | null
          user_feedback?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          estimated_cost?: number | null
          feedback_text?: string | null
          id?: string | null
          model_used?: string | null
          prompt?: string | null
          query_complexity?: string | null
          response_time_ms?: number | null
          tokens_used?: number | null
          user_feedback?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_keys_compat: {
        Row: {
          access_level: string | null
          created_at: string | null
          expires_at: string | null
          id: string | null
          is_active: boolean | null
          key: string | null
          name: string | null
          organization_id: string | null
          project_id: string | null
          service: string | null
          user_id: string | null
        }
        Insert: {
          access_level?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          is_active?: never
          key?: never
          name?: string | null
          organization_id?: string | null
          project_id?: string | null
          service?: never
          user_id?: string | null
        }
        Update: {
          access_level?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          is_active?: never
          key?: never
          name?: string | null
          organization_id?: string | null
          project_id?: string | null
          service?: never
          user_id?: string | null
        }
        Relationships: []
      }
      api_marketplace_products: {
        Row: {
          api_endpoint: string | null
          average_rating: number | null
          created_at: string | null
          description: string | null
          developer_id: string | null
          developer_revenue_percent: number | null
          documentation_url: string | null
          id: string | null
          monthly_subscription_usd: number | null
          name: string | null
          platform_revenue_percent: number | null
          price_per_call_usd: number | null
          pricing_model: string | null
          status: string | null
          total_calls: number | null
          total_revenue_usd: number | null
          updated_at: string | null
        }
        Insert: {
          api_endpoint?: string | null
          average_rating?: number | null
          created_at?: string | null
          description?: string | null
          developer_id?: string | null
          developer_revenue_percent?: number | null
          documentation_url?: string | null
          id?: string | null
          monthly_subscription_usd?: number | null
          name?: string | null
          platform_revenue_percent?: number | null
          price_per_call_usd?: number | null
          pricing_model?: string | null
          status?: string | null
          total_calls?: number | null
          total_revenue_usd?: number | null
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string | null
          average_rating?: number | null
          created_at?: string | null
          description?: string | null
          developer_id?: string | null
          developer_revenue_percent?: number | null
          documentation_url?: string | null
          id?: string | null
          monthly_subscription_usd?: number | null
          name?: string | null
          platform_revenue_percent?: number | null
          price_per_call_usd?: number | null
          pricing_model?: string | null
          status?: string | null
          total_calls?: number | null
          total_revenue_usd?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      api_marketplace_usage: {
        Row: {
          calls_count: number | null
          created_at: string | null
          developer_revenue_usd: number | null
          id: string | null
          platform_revenue_usd: number | null
          product_id: string | null
          total_cost_usd: number | null
          user_id: string | null
        }
        Insert: {
          calls_count?: number | null
          created_at?: string | null
          developer_revenue_usd?: number | null
          id?: string | null
          platform_revenue_usd?: number | null
          product_id?: string | null
          total_cost_usd?: number | null
          user_id?: string | null
        }
        Update: {
          calls_count?: number | null
          created_at?: string | null
          developer_revenue_usd?: number | null
          id?: string | null
          platform_revenue_usd?: number | null
          product_id?: string | null
          total_cost_usd?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      apps: {
        Row: {
          api_url: string | null
          app_id: string | null
          certified: boolean | null
          created_at: string | null
          description: string | null
          github_path: string | null
          github_repo: string | null
          health_endpoint: string | null
          id: string | null
          is_active: boolean | null
          metadata: Json | null
          migration_status: string | null
          name: string | null
          original_project_ref: string | null
          schema_name: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          api_url?: string | null
          app_id?: string | null
          certified?: boolean | null
          created_at?: string | null
          description?: string | null
          github_path?: string | null
          github_repo?: string | null
          health_endpoint?: string | null
          id?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          migration_status?: string | null
          name?: string | null
          original_project_ref?: string | null
          schema_name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          api_url?: string | null
          app_id?: string | null
          certified?: boolean | null
          created_at?: string | null
          description?: string | null
          github_path?: string | null
          github_repo?: string | null
          health_endpoint?: string | null
          id?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          migration_status?: string | null
          name?: string | null
          original_project_ref?: string | null
          schema_name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string | null
          actor_id: string | null
          actor_type: string | null
          agent_id: string | null
          api_key_id: string | null
          auth_source: string | null
          channel_id: string | null
          created_at: string | null
          failure_reason: string | null
          id: string | null
          ip_address: unknown
          metadata: Json | null
          organization_id: string | null
          project_scope: string | null
          request_id: string | null
          resource_id: string | null
          resource_type: string | null
          result: string | null
          route_source: string | null
          team_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          actor_id?: string | null
          actor_type?: string | null
          agent_id?: string | null
          api_key_id?: string | null
          auth_source?: string | null
          channel_id?: string | null
          created_at?: string | null
          failure_reason?: string | null
          id?: string | null
          ip_address?: unknown
          metadata?: Json | null
          organization_id?: string | null
          project_scope?: string | null
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          result?: string | null
          route_source?: string | null
          team_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          actor_id?: string | null
          actor_type?: string | null
          agent_id?: string | null
          api_key_id?: string | null
          auth_source?: string | null
          channel_id?: string | null
          created_at?: string | null
          failure_reason?: string | null
          id?: string | null
          ip_address?: unknown
          metadata?: Json | null
          organization_id?: string | null
          project_scope?: string | null
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          result?: string | null
          route_source?: string | null
          team_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_api_keys_view: {
        Row: {
          access_level: string | null
          api_key_id: string | null
          created_at: string | null
          current_status: string | null
          expires_at: string | null
          is_active: boolean | null
          last_event_at: string | null
          name: string | null
          user_id: string | null
        }
        Relationships: []
      }
      auth_audit_view: {
        Row: {
          additional_metadata: Json | null
          audit_event_type: string | null
          error_message: string | null
          event_id: string | null
          ip_address: unknown
          occurred_at: string | null
          platform: string | null
          subject_id: string | null
          subject_type: string | null
          success: boolean | null
          user_agent: string | null
        }
        Insert: {
          additional_metadata?: never
          audit_event_type?: never
          error_message?: never
          event_id?: string | null
          ip_address?: never
          occurred_at?: string | null
          platform?: never
          subject_id?: string | null
          subject_type?: string | null
          success?: never
          user_agent?: never
        }
        Update: {
          additional_metadata?: never
          audit_event_type?: never
          error_message?: never
          event_id?: string | null
          ip_address?: never
          occurred_at?: string | null
          platform?: never
          subject_id?: string | null
          subject_type?: string | null
          success?: never
          user_agent?: never
        }
        Relationships: []
      }
      auth_events: {
        Row: {
          aggregate_id: string | null
          aggregate_type: string | null
          event_id: string | null
          event_type: string | null
          event_type_version: number | null
          ingested_at: string | null
          metadata: Json | null
          occurred_at: string | null
          payload: Json | null
          version: number | null
        }
        Insert: {
          aggregate_id?: string | null
          aggregate_type?: string | null
          event_id?: string | null
          event_type?: string | null
          event_type_version?: number | null
          ingested_at?: string | null
          metadata?: Json | null
          occurred_at?: string | null
          payload?: Json | null
          version?: number | null
        }
        Update: {
          aggregate_id?: string | null
          aggregate_type?: string | null
          event_id?: string | null
          event_type?: string | null
          event_type_version?: number | null
          ingested_at?: string | null
          metadata?: Json | null
          occurred_at?: string | null
          payload?: Json | null
          version?: number | null
        }
        Relationships: []
      }
      auth_sessions_view: {
        Row: {
          created_at: string | null
          expires_at: string | null
          ip_address: unknown
          platform: string | null
          scope: Json | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Relationships: []
      }
      auth_users_view: {
        Row: {
          email: string | null
          event_metadata: Json | null
          last_sign_in_at: string | null
          last_updated_at: string | null
          provider: string | null
          raw_payload: Json | null
          role: string | null
          user_id: string | null
        }
        Relationships: []
      }
      behavior_patterns: {
        Row: {
          actions: Json | null
          confidence: number | null
          context: Json | null
          created_at: string | null
          final_outcome: string | null
          id: string | null
          last_used_at: string | null
          trigger: string | null
          trigger_embedding: string | null
          updated_at: string | null
          use_count: number | null
          user_id: string | null
          voyage_trigger_embedding: string | null
        }
        Insert: {
          actions?: Json | null
          confidence?: number | null
          context?: Json | null
          created_at?: string | null
          final_outcome?: string | null
          id?: string | null
          last_used_at?: string | null
          trigger?: string | null
          trigger_embedding?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string | null
          voyage_trigger_embedding?: string | null
        }
        Update: {
          actions?: Json | null
          confidence?: number | null
          context?: Json | null
          created_at?: string | null
          final_outcome?: string | null
          id?: string | null
          last_used_at?: string | null
          trigger?: string | null
          trigger_embedding?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string | null
          voyage_trigger_embedding?: string | null
        }
        Relationships: []
      }
      bulk_payments: {
        Row: {
          created_at: string | null
          currency_code: string | null
          id: string | null
          last_error: string | null
          modified_by: string | null
          processed_at: string | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          title: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency_code?: string | null
          id?: string | null
          last_error?: string | null
          modified_by?: string | null
          processed_at?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          title?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency_code?: string | null
          id?: string | null
          last_error?: string | null
          modified_by?: string | null
          processed_at?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          title?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      business_recommendations: {
        Row: {
          action_items: Json | null
          confidence_score: number | null
          created_at: string | null
          description: string | null
          estimated_value: number | null
          expires_at: string | null
          id: string | null
          impact_level: string | null
          implementation_effort: string | null
          implemented_at: string | null
          recommendation_type: string | null
          reviewed_at: string | null
          status: string | null
          supporting_data: Json | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          action_items?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          estimated_value?: number | null
          expires_at?: string | null
          id?: string | null
          impact_level?: string | null
          implementation_effort?: string | null
          implemented_at?: string | null
          recommendation_type?: string | null
          reviewed_at?: string | null
          status?: string | null
          supporting_data?: Json | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          action_items?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          estimated_value?: number | null
          expires_at?: string | null
          id?: string | null
          impact_level?: string | null
          implementation_effort?: string | null
          implemented_at?: string | null
          recommendation_type?: string | null
          reviewed_at?: string | null
          status?: string | null
          supporting_data?: Json | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          id: string | null
          metadata: Json | null
          name: string | null
          status: string | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          metadata?: Json | null
          name?: string | null
          status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          metadata?: Json | null
          name?: string | null
          status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      company_usage_logs: {
        Row: {
          endpoint_id: string | null
          execution_time_ms: number | null
          id: string | null
          metadata: Json | null
          project_id: string | null
          request_method: string | null
          request_path: string | null
          request_size_bytes: number | null
          response_size_bytes: number | null
          response_status: number | null
          service_id: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          endpoint_id?: string | null
          execution_time_ms?: number | null
          id?: string | null
          metadata?: Json | null
          project_id?: string | null
          request_method?: string | null
          request_path?: string | null
          request_size_bytes?: number | null
          response_size_bytes?: number | null
          response_status?: number | null
          service_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          endpoint_id?: string | null
          execution_time_ms?: number | null
          id?: string | null
          metadata?: Json | null
          project_id?: string | null
          request_method?: string | null
          request_path?: string | null
          request_size_bytes?: number | null
          response_size_bytes?: number | null
          response_status?: number | null
          service_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      edoc_usage_logs: {
        Row: {
          action: string | null
          created_at: string | null
          id: number | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id?: number | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: number | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      expert_marketplace_profiles: {
        Row: {
          active: boolean | null
          average_rating: number | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          expertise_areas: string[] | null
          hourly_rate_usd: number | null
          id: string | null
          total_revenue_usd: number | null
          total_sessions: number | null
          updated_at: string | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          active?: boolean | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          expertise_areas?: string[] | null
          hourly_rate_usd?: number | null
          id?: string | null
          total_revenue_usd?: number | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          active?: boolean | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          expertise_areas?: string[] | null
          hourly_rate_usd?: number | null
          id?: string | null
          total_revenue_usd?: number | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      gcp_billing_alerts: {
        Row: {
          alert_type: string | null
          created_at: string | null
          details: Json | null
          id: string | null
          message: string | null
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          title: string | null
          vendor_id: string | null
        }
        Insert: {
          alert_type?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string | null
          message?: string | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          title?: string | null
          vendor_id?: string | null
        }
        Update: {
          alert_type?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string | null
          message?: string | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          title?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      gcp_billing_history: {
        Row: {
          ai_services_cost: number | null
          ai_services_enabled: number | null
          alert_triggered: boolean | null
          billing_account: string | null
          compute_cost: number | null
          created_at: string | null
          id: string | null
          notes: string | null
          other_cost: number | null
          running_vms: number | null
          services_enabled: number | null
          snapshot_data: Json | null
          storage_cost: number | null
          total_cost: number | null
          user_managed_keys: number | null
          vendor_id: string | null
        }
        Insert: {
          ai_services_cost?: number | null
          ai_services_enabled?: number | null
          alert_triggered?: boolean | null
          billing_account?: string | null
          compute_cost?: number | null
          created_at?: string | null
          id?: string | null
          notes?: string | null
          other_cost?: number | null
          running_vms?: number | null
          services_enabled?: number | null
          snapshot_data?: Json | null
          storage_cost?: number | null
          total_cost?: number | null
          user_managed_keys?: number | null
          vendor_id?: string | null
        }
        Update: {
          ai_services_cost?: number | null
          ai_services_enabled?: number | null
          alert_triggered?: boolean | null
          billing_account?: string | null
          compute_cost?: number | null
          created_at?: string | null
          id?: string | null
          notes?: string | null
          other_cost?: number | null
          running_vms?: number | null
          services_enabled?: number | null
          snapshot_data?: Json | null
          storage_cost?: number | null
          total_cost?: number | null
          user_managed_keys?: number | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      gcp_service_account_keys: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          expires_at: string | null
          has_ai_permissions: boolean | null
          id: string | null
          key_id: string | null
          key_type: string | null
          last_checked_at: string | null
          project_id: string | null
          service_account_email: string | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          has_ai_permissions?: boolean | null
          id?: string | null
          key_id?: string | null
          key_type?: string | null
          last_checked_at?: string | null
          project_id?: string | null
          service_account_email?: string | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          has_ai_permissions?: boolean | null
          id?: string | null
          key_id?: string | null
          key_type?: string | null
          last_checked_at?: string | null
          project_id?: string | null
          service_account_email?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      gcp_service_status: {
        Row: {
          enabled: boolean | null
          id: string | null
          is_ai_service: boolean | null
          last_checked_at: string | null
          project_id: string | null
          service_name: string | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          enabled?: boolean | null
          id?: string | null
          is_ai_service?: boolean | null
          last_checked_at?: string | null
          project_id?: string | null
          service_name?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          enabled?: boolean | null
          id?: string | null
          is_ai_service?: boolean | null
          last_checked_at?: string | null
          project_id?: string | null
          service_name?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      intelligence_usage_logs: {
        Row: {
          cache_hit: boolean | null
          created_at: string | null
          error_message: string | null
          id: string | null
          openai_cost_usd: number | null
          openai_model: string | null
          openai_tokens_used: number | null
          request_params: Json | null
          response_data: Json | null
          response_time_ms: number | null
          success: boolean | null
          tool_name: string | null
          user_id: string | null
        }
        Insert: {
          cache_hit?: boolean | null
          created_at?: string | null
          error_message?: string | null
          id?: string | null
          openai_cost_usd?: number | null
          openai_model?: string | null
          openai_tokens_used?: number | null
          request_params?: Json | null
          response_data?: Json | null
          response_time_ms?: number | null
          success?: boolean | null
          tool_name?: string | null
          user_id?: string | null
        }
        Update: {
          cache_hit?: boolean | null
          created_at?: string | null
          error_message?: string | null
          id?: string | null
          openai_cost_usd?: number | null
          openai_model?: string | null
          openai_tokens_used?: number | null
          request_params?: Json | null
          response_data?: Json | null
          response_time_ms?: number | null
          success?: boolean | null
          tool_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      intelligence_usage_summary: {
        Row: {
          avg_response_time: number | null
          cache_hits: number | null
          day: string | null
          success_rate: number | null
          tool_name: string | null
          total_calls: number | null
          total_cost: number | null
          total_tokens: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      key_usage_analytics: {
        Row: {
          id: string | null
          key_id: string | null
          metadata: Json | null
          operation: string | null
          organization_id: string | null
          success: boolean | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          id?: string | null
          key_id?: string | null
          metadata?: Json | null
          operation?: string | null
          organization_id?: string | null
          success?: boolean | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string | null
          key_id?: string | null
          metadata?: Json | null
          operation?: string | null
          organization_id?: string | null
          success?: boolean | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      legacy_plan_mapping: {
        Row: {
          legacy_org_id: string | null
          legacy_plan: string | null
          new_tier_name: string | null
          org_name: string | null
        }
        Insert: {
          legacy_org_id?: string | null
          legacy_plan?: string | null
          new_tier_name?: never
          org_name?: string | null
        }
        Update: {
          legacy_org_id?: string | null
          legacy_plan?: string | null
          new_tier_name?: never
          org_name?: string | null
        }
        Relationships: []
      }
      maple_brief_subscribers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
        }
        Relationships: []
      }
      marketplace_transactions: {
        Row: {
          amount: number | null
          buyer_id: string | null
          created_at: string | null
          id: string | null
          order_id: string | null
          platform_fee: number | null
          seller_amount: number | null
          seller_id: string | null
          status: string | null
          stripe_charge_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          buyer_id?: string | null
          created_at?: string | null
          id?: string | null
          order_id?: string | null
          platform_fee?: number | null
          seller_amount?: number | null
          seller_id?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          buyer_id?: string | null
          created_at?: string | null
          id?: string | null
          order_id?: string | null
          platform_fee?: number | null
          seller_amount?: number | null
          seller_id?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mcp_key_audit_log: {
        Row: {
          event_type: string | null
          id: string | null
          metadata: Json | null
          organization_id: string | null
          session_id: string | null
          timestamp: string | null
          tool_id: string | null
          user_id: string | null
        }
        Insert: {
          event_type?: string | null
          id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          session_id?: string | null
          timestamp?: string | null
          tool_id?: string | null
          user_id?: string | null
        }
        Update: {
          event_type?: string | null
          id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          session_id?: string | null
          timestamp?: string | null
          tool_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      mcp_usage_logs: {
        Row: {
          action: string | null
          api_key_id: string | null
          billable: boolean | null
          billing_amount_cents: number | null
          client_ip: unknown
          error_code: string | null
          error_message: string | null
          external_api_time_ms: number | null
          id: string | null
          mcp_spawn_time_ms: number | null
          method: string | null
          origin: string | null
          request_body: Json | null
          request_headers: Json | null
          request_id: string | null
          response_body: Json | null
          response_status: number | null
          response_time_ms: number | null
          service_key: string | null
          status: string | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          api_key_id?: string | null
          billable?: boolean | null
          billing_amount_cents?: number | null
          client_ip?: unknown
          error_code?: string | null
          error_message?: string | null
          external_api_time_ms?: number | null
          id?: string | null
          mcp_spawn_time_ms?: number | null
          method?: string | null
          origin?: string | null
          request_body?: Json | null
          request_headers?: Json | null
          request_id?: string | null
          response_body?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          service_key?: string | null
          status?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          api_key_id?: string | null
          billable?: boolean | null
          billing_amount_cents?: number | null
          client_ip?: unknown
          error_code?: string | null
          error_message?: string | null
          external_api_time_ms?: number | null
          id?: string | null
          mcp_spawn_time_ms?: number | null
          method?: string | null
          origin?: string | null
          request_body?: Json | null
          request_headers?: Json | null
          request_id?: string | null
          response_body?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          service_key?: string | null
          status?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      memory_access_grants: {
        Row: {
          created_at: string | null
          granted_by: string | null
          id: string | null
          memory_id: string | null
          metadata: Json | null
          organization_id: string | null
          permissions: Database["public"]["Enums"]["memory_permission"][] | null
          principal_id: string | null
          principal_type:
            | Database["public"]["Enums"]["memory_grant_principal_type"]
            | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          granted_by?: string | null
          id?: string | null
          memory_id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          permissions?:
            | Database["public"]["Enums"]["memory_permission"][]
            | null
          principal_id?: string | null
          principal_type?:
            | Database["public"]["Enums"]["memory_grant_principal_type"]
            | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          granted_by?: string | null
          id?: string | null
          memory_id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          permissions?:
            | Database["public"]["Enums"]["memory_permission"][]
            | null
          principal_id?: string | null
          principal_type?:
            | Database["public"]["Enums"]["memory_grant_principal_type"]
            | null
          updated_at?: string | null
        }
        Relationships: []
      }
      memory_entries: {
        Row: {
          access_count: number | null
          access_mode: Database["public"]["Enums"]["memory_access_mode"] | null
          agent_id: string | null
          archived_at: string | null
          channel_id: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          duplicate_count: number | null
          embedding: string | null
          embedding_model: string | null
          embedding_provider: string | null
          id: string | null
          last_accessed: string | null
          last_seen_at: string | null
          memory_type: Database["public"]["Enums"]["memory_type"] | null
          metadata: Json | null
          organization_id: string | null
          owner_id: string | null
          owner_type: Database["public"]["Enums"]["memory_owner_type"] | null
          revision_count: number | null
          scope: Database["public"]["Enums"]["memory_scope"] | null
          superseded_by: string | null
          tags: string[] | null
          team_id: string | null
          title: string | null
          topic_id: string | null
          topic_key: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
          voyage_embedding: string | null
        }
        Insert: {
          access_count?: number | null
          access_mode?: Database["public"]["Enums"]["memory_access_mode"] | null
          agent_id?: string | null
          archived_at?: string | null
          channel_id?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          duplicate_count?: number | null
          embedding?: string | null
          embedding_model?: string | null
          embedding_provider?: string | null
          id?: string | null
          last_accessed?: string | null
          last_seen_at?: string | null
          memory_type?: Database["public"]["Enums"]["memory_type"] | null
          metadata?: Json | null
          organization_id?: string | null
          owner_id?: string | null
          owner_type?: Database["public"]["Enums"]["memory_owner_type"] | null
          revision_count?: number | null
          scope?: Database["public"]["Enums"]["memory_scope"] | null
          superseded_by?: string | null
          tags?: string[] | null
          team_id?: string | null
          title?: string | null
          topic_id?: string | null
          topic_key?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          voyage_embedding?: string | null
        }
        Update: {
          access_count?: number | null
          access_mode?: Database["public"]["Enums"]["memory_access_mode"] | null
          agent_id?: string | null
          archived_at?: string | null
          channel_id?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          duplicate_count?: number | null
          embedding?: string | null
          embedding_model?: string | null
          embedding_provider?: string | null
          id?: string | null
          last_accessed?: string | null
          last_seen_at?: string | null
          memory_type?: Database["public"]["Enums"]["memory_type"] | null
          metadata?: Json | null
          organization_id?: string | null
          owner_id?: string | null
          owner_type?: Database["public"]["Enums"]["memory_owner_type"] | null
          revision_count?: number | null
          scope?: Database["public"]["Enums"]["memory_scope"] | null
          superseded_by?: string | null
          tags?: string[] | null
          team_id?: string | null
          title?: string | null
          topic_id?: string | null
          topic_key?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          voyage_embedding?: string | null
        }
        Relationships: []
      }
      memory_revisions: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          content: string | null
          created_at: string | null
          id: string | null
          memory_id: string | null
          metadata: Json | null
          organization_id: string | null
          revision_number: number | null
          tags: string[] | null
          title: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          memory_id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          revision_number?: number | null
          tags?: string[] | null
          title?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          memory_id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          revision_number?: number | null
          tags?: string[] | null
          title?: string | null
        }
        Relationships: []
      }
      memory_search_analytics: {
        Row: {
          created_at: string | null
          execution_time_ms: number | null
          id: string | null
          query: string | null
          results_count: number | null
          search_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string | null
          query?: string | null
          results_count?: number | null
          search_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string | null
          query?: string | null
          results_count?: number | null
          search_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      mrr_projection: {
        Row: {
          price_monthly_usd: number | null
          subscribers: number | null
          tier_mrr: number | null
          tier_name: string | null
        }
        Relationships: []
      }
      oauth_sessions: {
        Row: {
          client_id: string | null
          code_challenge: string | null
          code_verifier: string | null
          created_at: string | null
          expires_at: string | null
          id: string | null
          is_used: boolean | null
          redirect_uri: string | null
          scope: string | null
          session_data: Json | null
          state: string | null
          used_at: string | null
        }
        Insert: {
          client_id?: string | null
          code_challenge?: string | null
          code_verifier?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          is_used?: boolean | null
          redirect_uri?: string | null
          scope?: string | null
          session_data?: Json | null
          state?: string | null
          used_at?: string | null
        }
        Update: {
          client_id?: string | null
          code_challenge?: string | null
          code_verifier?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          is_used?: boolean | null
          redirect_uri?: string | null
          scope?: string | null
          session_data?: Json | null
          state?: string | null
          used_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string | null
          order_id: string | null
          product_id: string | null
          quantity: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          order_id?: string | null
          product_id?: string | null
          quantity?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          order_id?: string | null
          product_id?: string | null
          quantity?: number | null
          unit_price?: number | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string | null
          order_date: string | null
          shipping_address: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string | null
          order_date?: string | null
          shipping_address?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string | null
          order_date?: string | null
          shipping_address?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      org_members: {
        Row: {
          created_at: string | null
          id: string | null
          invited_by: string | null
          is_active: boolean | null
          is_default: boolean | null
          joined_at: string | null
          metadata: Json | null
          organization_id: string | null
          role: Database["public"]["Enums"]["org_member_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          joined_at?: string | null
          metadata?: Json | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["org_member_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          joined_at?: string | null
          metadata?: Json | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["org_member_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_audit: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string | null
          new_status: Database["public"]["Enums"]["payment_status"] | null
          old_status: Database["public"]["Enums"]["payment_status"] | null
          payment_id: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string | null
          new_status?: Database["public"]["Enums"]["payment_status"] | null
          old_status?: Database["public"]["Enums"]["payment_status"] | null
          payment_id?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string | null
          new_status?: Database["public"]["Enums"]["payment_status"] | null
          old_status?: Database["public"]["Enums"]["payment_status"] | null
          payment_id?: string | null
        }
        Relationships: []
      }
      payment_items: {
        Row: {
          amount: number | null
          beneficiary_id: string | null
          bulk_payment_id: string | null
          created_at: string | null
          currency_code: string | null
          description: string | null
          error_message: string | null
          id: string | null
          processed_at: string | null
          retry_count: number | null
          status: Database["public"]["Enums"]["payment_status"] | null
        }
        Insert: {
          amount?: number | null
          beneficiary_id?: string | null
          bulk_payment_id?: string | null
          created_at?: string | null
          currency_code?: string | null
          description?: string | null
          error_message?: string | null
          id?: string | null
          processed_at?: string | null
          retry_count?: number | null
          status?: Database["public"]["Enums"]["payment_status"] | null
        }
        Update: {
          amount?: number | null
          beneficiary_id?: string | null
          bulk_payment_id?: string | null
          created_at?: string | null
          currency_code?: string | null
          description?: string | null
          error_message?: string | null
          id?: string | null
          processed_at?: string | null
          retry_count?: number | null
          status?: Database["public"]["Enums"]["payment_status"] | null
        }
        Relationships: []
      }
      privacy_processing_logs: {
        Row: {
          consent_given: boolean | null
          created_at: string | null
          data_type: string | null
          id: string | null
          pii_detected: boolean | null
          pii_redacted: boolean | null
          processing_type: string | null
          retention_days: number | null
          user_id: string | null
        }
        Insert: {
          consent_given?: boolean | null
          created_at?: string | null
          data_type?: string | null
          id?: string | null
          pii_detected?: boolean | null
          pii_redacted?: boolean | null
          processing_type?: string | null
          retention_days?: number | null
          user_id?: string | null
        }
        Update: {
          consent_given?: boolean | null
          created_at?: string | null
          data_type?: string | null
          id?: string | null
          pii_detected?: boolean | null
          pii_redacted?: boolean | null
          processing_type?: string | null
          retention_days?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      product_embeddings: {
        Row: {
          created_at: string | null
          embedding: string | null
          id: string | null
          product_id: string | null
          text_content: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          id?: string | null
          product_id?: string | null
          text_content?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          id?: string | null
          product_id?: string | null
          text_content?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          name: string | null
          price: number | null
          stock_quantity: number | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          name?: string | null
          price?: number | null
          stock_quantity?: number | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          name?: string | null
          price?: number | null
          stock_quantity?: number | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      project_capabilities_with_tier: {
        Row: {
          allowed_currencies: string[] | null
          cards_enabled: boolean | null
          created_at: string | null
          daily_payment_limit: number | null
          daily_transfer_limit: number | null
          id: string | null
          kyc_enabled: boolean | null
          kyc_types: string[] | null
          monthly_volume_limit: number | null
          payments_enabled: boolean | null
          per_payment_limit: number | null
          per_transfer_limit: number | null
          project_id: string | null
          requests_per_hour: number | null
          requests_per_minute: number | null
          tier: string | null
          tier_daily_transfer_limit: number | null
          tier_display_name: string | null
          tier_monthly_volume_limit: number | null
          tier_requests_per_minute: number | null
          transfers_enabled: boolean | null
          updated_at: string | null
          wallet_enabled: boolean | null
          webhooks_enabled: boolean | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          api_key: string | null
          created_at: string | null
          description: string | null
          id: string | null
          metadata: Json | null
          name: string | null
          status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          api_key?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          metadata?: Json | null
          name?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          metadata?: Json | null
          name?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          clicked: boolean | null
          created_at: string | null
          id: string | null
          product_id: string | null
          reason: string | null
          recommendation_type: string | null
          relevance_score: number | null
          supplier_id: string | null
          updated_at: string | null
          user_id: string | null
          viewed: boolean | null
        }
        Insert: {
          clicked?: boolean | null
          created_at?: string | null
          id?: string | null
          product_id?: string | null
          reason?: string | null
          recommendation_type?: string | null
          relevance_score?: number | null
          supplier_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          viewed?: boolean | null
        }
        Update: {
          clicked?: boolean | null
          created_at?: string | null
          id?: string | null
          product_id?: string | null
          reason?: string | null
          recommendation_type?: string | null
          relevance_score?: number | null
          supplier_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          viewed?: boolean | null
        }
        Relationships: []
      }
      render_services: {
        Row: {
          app_id: string | null
          created_at: string | null
          id: string | null
          metadata: Json | null
          name: string | null
          project_id: string | null
          status: string | null
          type: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          app_id?: string | null
          created_at?: string | null
          id?: string | null
          metadata?: Json | null
          name?: string | null
          project_id?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          app_id?: string | null
          created_at?: string | null
          id?: string | null
          metadata?: Json | null
          name?: string | null
          project_id?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      say_orders: {
        Row: {
          amount: number | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          id: number | null
          raw_response: Json | null
          reference: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: number | null
          raw_response?: Json | null
          reference?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: number | null
          raw_response?: Json | null
          reference?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string | null
          is_active: boolean | null
          last_activity: string | null
          token_hash: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          token_hash?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          token_hash?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stored_api_keys: {
        Row: {
          access_level: string | null
          created_at: string | null
          created_by: string | null
          encrypted_value: string | null
          environment: string | null
          expires_at: string | null
          id: string | null
          key_type: string | null
          last_rotated: string | null
          metadata: Json | null
          name: string | null
          organization_id: string | null
          project_id: string | null
          rotation_frequency: number | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          access_level?: string | null
          created_at?: string | null
          created_by?: string | null
          encrypted_value?: string | null
          environment?: string | null
          expires_at?: string | null
          id?: string | null
          key_type?: string | null
          last_rotated?: string | null
          metadata?: Json | null
          name?: string | null
          organization_id?: string | null
          project_id?: string | null
          rotation_frequency?: number | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          access_level?: string | null
          created_at?: string | null
          created_by?: string | null
          encrypted_value?: string | null
          environment?: string | null
          expires_at?: string | null
          id?: string | null
          key_type?: string | null
          last_rotated?: string | null
          metadata?: Json | null
          name?: string | null
          organization_id?: string | null
          project_id?: string | null
          rotation_frequency?: number | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      stripe_connect_accounts: {
        Row: {
          created_at: string | null
          id: string | null
          onboarding_complete: boolean | null
          stripe_account_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          onboarding_complete?: boolean | null
          stripe_account_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          onboarding_complete?: boolean | null
          stripe_account_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_tiers: {
        Row: {
          created_at: string | null
          display_name: string | null
          features: Json | null
          id: string | null
          intelligence_features: Json | null
          intelligence_quota_monthly: number | null
          name: string | null
          price_monthly_usd: number | null
          price_yearly_usd: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          features?: Json | null
          id?: string | null
          intelligence_features?: Json | null
          intelligence_quota_monthly?: number | null
          name?: string | null
          price_monthly_usd?: number | null
          price_yearly_usd?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          features?: Json | null
          id?: string | null
          intelligence_features?: Json | null
          intelligence_quota_monthly?: number | null
          name?: string | null
          price_monthly_usd?: number | null
          price_yearly_usd?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string | null
          plan_name: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string | null
          plan_name?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string | null
          plan_name?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_error_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          error_type: string | null
          function_name: string | null
          id: number | null
          request_data: Json | null
          stack_trace: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          error_type?: string | null
          function_name?: string | null
          id?: number | null
          request_data?: Json | null
          stack_trace?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          error_type?: string | null
          function_name?: string | null
          id?: number | null
          request_data?: Json | null
          stack_trace?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tier_distribution: {
        Row: {
          avg_usage: number | null
          display_name: string | null
          price_monthly_usd: number | null
          subscriber_count: number | null
          tier_name: string | null
          total_usage: number | null
        }
        Relationships: []
      }
      usage_analytics: {
        Row: {
          created_at: string | null
          dimensions: Json | null
          id: string | null
          metric_type: string | null
          metric_value: number | null
          organization_id: string | null
          partition_month: string | null
          recorded_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          dimensions?: Json | null
          id?: string | null
          metric_type?: string | null
          metric_value?: number | null
          organization_id?: string | null
          partition_month?: string | null
          recorded_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          dimensions?: Json | null
          id?: string | null
          metric_type?: string | null
          metric_value?: number | null
          organization_id?: string | null
          partition_month?: string | null
          recorded_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          action: string | null
          created_at: string | null
          id: string | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          action: string | null
          created_at: string | null
          id: number | null
          ip_address: unknown
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id?: number | null
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: number | null
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_payments: {
        Row: {
          amount: number | null
          currency: string | null
          id: number | null
          metadata: Json | null
          payment_date: string | null
          payment_method: string | null
          payment_type: string | null
          provider: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          currency?: string | null
          id?: number | null
          metadata?: Json | null
          payment_date?: string | null
          payment_method?: string | null
          payment_type?: string | null
          provider?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          currency?: string | null
          id?: number | null
          metadata?: Json | null
          payment_date?: string | null
          payment_method?: string | null
          payment_type?: string | null
          provider?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_product_interactions: {
        Row: {
          created_at: string | null
          id: number | null
          interaction_type: string | null
          metadata: Json | null
          product_id: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number | null
          interaction_type?: string | null
          metadata?: Json | null
          product_id?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number | null
          interaction_type?: string | null
          metadata?: Json | null
          product_id?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_quota_status: {
        Row: {
          email: string | null
          quota_limit: number | null
          quota_resets_at: string | null
          status: string | null
          tier_name: string | null
          usage: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: number | null
          ip_address: unknown
          last_accessed: string | null
          session_token: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: number | null
          ip_address?: unknown
          last_accessed?: string | null
          session_token?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: number | null
          ip_address?: unknown
          last_accessed?: string | null
          session_token?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string | null
          intelligence_usage_current: number | null
          quota_resets_at: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier_id: string | null
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string | null
          intelligence_usage_current?: number | null
          quota_resets_at?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string | null
          intelligence_usage_current?: number | null
          quota_resets_at?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_tool_configs: {
        Row: {
          api_key: string | null
          config: Json | null
          created_at: string | null
          enabled: boolean | null
          id: string | null
          permissions: string[] | null
          tool_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          api_key?: string | null
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string | null
          permissions?: string[] | null
          tool_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          api_key?: string | null
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string | null
          permissions?: string[] | null
          tool_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          last_login: string | null
          organization_id: string | null
          password_hash: string | null
          plan: Database["public"]["Enums"]["plan_type"] | null
          role: Database["public"]["Enums"]["user_role"] | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          last_login?: string | null
          organization_id?: string | null
          password_hash?: string | null
          plan?: Database["public"]["Enums"]["plan_type"] | null
          role?: Database["public"]["Enums"]["user_role"] | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          last_login?: string | null
          organization_id?: string | null
          password_hash?: string | null
          plan?: Database["public"]["Enums"]["plan_type"] | null
          role?: Database["public"]["Enums"]["user_role"] | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_address_verifications: {
        Row: {
          address_valid: boolean | null
          city: string | null
          country: string | null
          created_at: string | null
          document_authentic: boolean | null
          document_date: string | null
          document_url: string | null
          full_address: string | null
          geo_coordinates: Json | null
          id: string | null
          issuer: string | null
          lga: string | null
          postal_code: string | null
          resident_confirmed: boolean | null
          state_province: string | null
          street_address: string | null
          verification_record_id: string | null
          verification_type:
            | "utility_bill"
            | "bank_statement"
            | "government_document"
            | null
        }
        Insert: {
          address_valid?: boolean | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          document_authentic?: boolean | null
          document_date?: string | null
          document_url?: string | null
          full_address?: string | null
          geo_coordinates?: Json | null
          id?: string | null
          issuer?: string | null
          lga?: string | null
          postal_code?: string | null
          resident_confirmed?: boolean | null
          state_province?: string | null
          street_address?: string | null
          verification_record_id?: string | null
          verification_type?:
            | "utility_bill"
            | "bank_statement"
            | "government_document"
            | null
        }
        Update: {
          address_valid?: boolean | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          document_authentic?: boolean | null
          document_date?: string | null
          document_url?: string | null
          full_address?: string | null
          geo_coordinates?: Json | null
          id?: string | null
          issuer?: string | null
          lga?: string | null
          postal_code?: string | null
          resident_confirmed?: boolean | null
          state_province?: string | null
          street_address?: string | null
          verification_record_id?: string | null
          verification_type?:
            | "utility_bill"
            | "bank_statement"
            | "government_document"
            | null
        }
        Relationships: []
      }
      v_background_checks: {
        Row: {
          check_type:
            | "criminal_record"
            | "credit_history"
            | "employment_history"
            | "education_verification"
            | null
          coverage_period_months: number | null
          created_at: string | null
          data_sources: string[] | null
          detailed_report: Json | null
          flags: Json | null
          id: string | null
          is_clean: boolean | null
          records_found: number | null
          risk_level: string | null
          search_criteria: Json | null
          summary_report: string | null
          verification_record_id: string | null
        }
        Insert: {
          check_type?:
            | "criminal_record"
            | "credit_history"
            | "employment_history"
            | "education_verification"
            | null
          coverage_period_months?: number | null
          created_at?: string | null
          data_sources?: string[] | null
          detailed_report?: Json | null
          flags?: Json | null
          id?: string | null
          is_clean?: boolean | null
          records_found?: number | null
          risk_level?: string | null
          search_criteria?: Json | null
          summary_report?: string | null
          verification_record_id?: string | null
        }
        Update: {
          check_type?:
            | "criminal_record"
            | "credit_history"
            | "employment_history"
            | "education_verification"
            | null
          coverage_period_months?: number | null
          created_at?: string | null
          data_sources?: string[] | null
          detailed_report?: Json | null
          flags?: Json | null
          id?: string | null
          is_clean?: boolean | null
          records_found?: number | null
          risk_level?: string | null
          search_criteria?: Json | null
          summary_report?: string | null
          verification_record_id?: string | null
        }
        Relationships: []
      }
      v_biometric_verifications: {
        Row: {
          biometric_template: string | null
          biometric_type:
            | "face_match"
            | "liveness_check"
            | "fingerprint"
            | "voice_recognition"
            | null
          created_at: string | null
          id: string | null
          is_live: boolean | null
          is_match: boolean | null
          liveness_score: number | null
          match_score: number | null
          metadata: Json | null
          quality_score: number | null
          reference_image_url: string | null
          template_encrypted: boolean | null
          verification_image_url: string | null
          verification_record_id: string | null
        }
        Insert: {
          biometric_template?: string | null
          biometric_type?:
            | "face_match"
            | "liveness_check"
            | "fingerprint"
            | "voice_recognition"
            | null
          created_at?: string | null
          id?: string | null
          is_live?: boolean | null
          is_match?: boolean | null
          liveness_score?: number | null
          match_score?: number | null
          metadata?: Json | null
          quality_score?: number | null
          reference_image_url?: string | null
          template_encrypted?: boolean | null
          verification_image_url?: string | null
          verification_record_id?: string | null
        }
        Update: {
          biometric_template?: string | null
          biometric_type?:
            | "face_match"
            | "liveness_check"
            | "fingerprint"
            | "voice_recognition"
            | null
          created_at?: string | null
          id?: string | null
          is_live?: boolean | null
          is_match?: boolean | null
          liveness_score?: number | null
          match_score?: number | null
          metadata?: Json | null
          quality_score?: number | null
          reference_image_url?: string | null
          template_encrypted?: boolean | null
          verification_image_url?: string | null
          verification_record_id?: string | null
        }
        Relationships: []
      }
      v_business_verifications: {
        Row: {
          business_address: string | null
          business_exists: boolean | null
          business_name: string | null
          business_status: string | null
          business_type:
            | "company"
            | "business_registration"
            | "tax_identification"
            | "bank_verification"
            | null
          created_at: string | null
          directors: Json | null
          directors_verified: boolean | null
          email_address: string | null
          id: string | null
          incorporation_date: string | null
          industry_code: string | null
          phone_number: string | null
          registrar: string | null
          registration_number: string | null
          registration_valid: boolean | null
          shareholders: Json | null
          status_active: boolean | null
          tax_id: string | null
          verification_record_id: string | null
          website_url: string | null
        }
        Insert: {
          business_address?: string | null
          business_exists?: boolean | null
          business_name?: string | null
          business_status?: string | null
          business_type?:
            | "company"
            | "business_registration"
            | "tax_identification"
            | "bank_verification"
            | null
          created_at?: string | null
          directors?: Json | null
          directors_verified?: boolean | null
          email_address?: string | null
          id?: string | null
          incorporation_date?: string | null
          industry_code?: string | null
          phone_number?: string | null
          registrar?: string | null
          registration_number?: string | null
          registration_valid?: boolean | null
          shareholders?: Json | null
          status_active?: boolean | null
          tax_id?: string | null
          verification_record_id?: string | null
          website_url?: string | null
        }
        Update: {
          business_address?: string | null
          business_exists?: boolean | null
          business_name?: string | null
          business_status?: string | null
          business_type?:
            | "company"
            | "business_registration"
            | "tax_identification"
            | "bank_verification"
            | null
          created_at?: string | null
          directors?: Json | null
          directors_verified?: boolean | null
          email_address?: string | null
          id?: string | null
          incorporation_date?: string | null
          industry_code?: string | null
          phone_number?: string | null
          registrar?: string | null
          registration_number?: string | null
          registration_valid?: boolean | null
          shareholders?: Json | null
          status_active?: boolean | null
          tax_id?: string | null
          verification_record_id?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      v_credit_applications: {
        Row: {
          amount_requested: number | null
          business_id: string | null
          created_at: string | null
          currency: string | null
          id: string | null
          loan_term_months: number | null
          metadata: Json | null
          purpose: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount_requested?: number | null
          business_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          loan_term_months?: number | null
          metadata?: Json | null
          purpose?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount_requested?: number | null
          business_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          loan_term_months?: number | null
          metadata?: Json | null
          purpose?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      v_credit_bids: {
        Row: {
          application_id: string | null
          created_at: string | null
          id: string | null
          interest_rate: number | null
          loan_term_months: number | null
          monthly_repayment: number | null
          offered_amount: number | null
          processing_fee: number | null
          provider_id: string | null
          special_conditions: Json | null
          status: string | null
          total_repayment: number | null
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string | null
          id?: string | null
          interest_rate?: number | null
          loan_term_months?: number | null
          monthly_repayment?: number | null
          offered_amount?: number | null
          processing_fee?: number | null
          provider_id?: string | null
          special_conditions?: Json | null
          status?: string | null
          total_repayment?: number | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string | null
          id?: string | null
          interest_rate?: number | null
          loan_term_months?: number | null
          monthly_repayment?: number | null
          offered_amount?: number | null
          processing_fee?: number | null
          provider_id?: string | null
          special_conditions?: Json | null
          status?: string | null
          total_repayment?: number | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      v_credit_limits: {
        Row: {
          available_limit: number | null
          business_id: string | null
          created_at: string | null
          currency: string | null
          id: string | null
          limit_type: string | null
          project_id: string | null
          status: string | null
          total_limit: number | null
          updated_at: string | null
          used_limit: number | null
          user_id: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          available_limit?: number | null
          business_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          limit_type?: string | null
          project_id?: string | null
          status?: string | null
          total_limit?: number | null
          updated_at?: string | null
          used_limit?: number | null
          user_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          available_limit?: number | null
          business_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          limit_type?: string | null
          project_id?: string | null
          status?: string | null
          total_limit?: number | null
          updated_at?: string | null
          used_limit?: number | null
          user_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      v_credit_providers: {
        Row: {
          address: Json | null
          api_endpoint: string | null
          company_name: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string | null
          interest_rate_range: Json | null
          maximum_loan_amount: number | null
          metadata: Json | null
          minimum_loan_amount: number | null
          processing_fee_percentage: number | null
          provider_code: string | null
          registration_number: string | null
          status: string | null
          supported_currencies: string[] | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          address?: Json | null
          api_endpoint?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string | null
          interest_rate_range?: Json | null
          maximum_loan_amount?: number | null
          metadata?: Json | null
          minimum_loan_amount?: number | null
          processing_fee_percentage?: number | null
          provider_code?: string | null
          registration_number?: string | null
          status?: string | null
          supported_currencies?: string[] | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          address?: Json | null
          api_endpoint?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string | null
          interest_rate_range?: Json | null
          maximum_loan_amount?: number | null
          metadata?: Json | null
          minimum_loan_amount?: number | null
          processing_fee_percentage?: number | null
          provider_code?: string | null
          registration_number?: string | null
          status?: string | null
          supported_currencies?: string[] | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      v_credit_repayment_schedules: {
        Row: {
          application_id: string | null
          bid_id: string | null
          created_at: string | null
          days_overdue: number | null
          due_date: string | null
          id: string | null
          installment_number: number | null
          interest_amount: number | null
          outstanding_amount: number | null
          paid_amount: number | null
          paid_at: string | null
          penalty_amount: number | null
          principal_amount: number | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          application_id?: string | null
          bid_id?: string | null
          created_at?: string | null
          days_overdue?: number | null
          due_date?: string | null
          id?: string | null
          installment_number?: number | null
          interest_amount?: number | null
          outstanding_amount?: number | null
          paid_amount?: number | null
          paid_at?: string | null
          penalty_amount?: number | null
          principal_amount?: number | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string | null
          bid_id?: string | null
          created_at?: string | null
          days_overdue?: number | null
          due_date?: string | null
          id?: string | null
          installment_number?: number | null
          interest_amount?: number | null
          outstanding_amount?: number | null
          paid_amount?: number | null
          paid_at?: string | null
          penalty_amount?: number | null
          principal_amount?: number | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_credit_scores: {
        Row: {
          bureau: string | null
          business_id: string | null
          created_at: string | null
          id: string | null
          report_data: Json | null
          score: number | null
          user_id: string | null
        }
        Insert: {
          bureau?: string | null
          business_id?: string | null
          created_at?: string | null
          id?: string | null
          report_data?: Json | null
          score?: number | null
          user_id?: string | null
        }
        Update: {
          bureau?: string | null
          business_id?: string | null
          created_at?: string | null
          id?: string | null
          report_data?: Json | null
          score?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      v_credit_status_history: {
        Row: {
          application_id: string | null
          changed_by: string | null
          created_at: string | null
          id: string | null
          new_status: string | null
          notes: string | null
          old_status: string | null
        }
        Insert: {
          application_id?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string | null
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
        }
        Update: {
          application_id?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string | null
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
        }
        Relationships: []
      }
      v_credit_transactions: {
        Row: {
          amount: number | null
          application_id: string | null
          bid_id: string | null
          created_at: string | null
          currency: string | null
          id: string | null
          metadata: Json | null
          payment_method: string | null
          processed_at: string | null
          provider_id: string | null
          reference_number: string | null
          status: string | null
          transaction_type: string | null
        }
        Insert: {
          amount?: number | null
          application_id?: string | null
          bid_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          metadata?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          provider_id?: string | null
          reference_number?: string | null
          status?: string | null
          transaction_type?: string | null
        }
        Update: {
          amount?: number | null
          application_id?: string | null
          bid_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          metadata?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          provider_id?: string | null
          reference_number?: string | null
          status?: string | null
          transaction_type?: string | null
        }
        Relationships: []
      }
      v_identity_verifications: {
        Row: {
          address: string | null
          created_at: string | null
          data_match_score: number | null
          date_of_birth: string | null
          document_image_url: string | null
          document_number: string | null
          document_type:
            | "passport"
            | "drivers_license"
            | "national_id"
            | "voters_card"
            | "permanent_voters_card"
            | "bvn"
            | "nin"
            | null
          document_valid: boolean | null
          email: string | null
          expiry_date: string | null
          face_match_score: number | null
          first_name: string | null
          gender: string | null
          id: string | null
          issue_date: string | null
          issuing_authority: string | null
          last_name: string | null
          middle_name: string | null
          nationality: string | null
          person_exists: boolean | null
          phone_number: string | null
          photo_url: string | null
          place_of_birth: string | null
          verification_record_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          data_match_score?: number | null
          date_of_birth?: string | null
          document_image_url?: string | null
          document_number?: string | null
          document_type?:
            | "passport"
            | "drivers_license"
            | "national_id"
            | "voters_card"
            | "permanent_voters_card"
            | "bvn"
            | "nin"
            | null
          document_valid?: boolean | null
          email?: string | null
          expiry_date?: string | null
          face_match_score?: number | null
          first_name?: string | null
          gender?: string | null
          id?: string | null
          issue_date?: string | null
          issuing_authority?: string | null
          last_name?: string | null
          middle_name?: string | null
          nationality?: string | null
          person_exists?: boolean | null
          phone_number?: string | null
          photo_url?: string | null
          place_of_birth?: string | null
          verification_record_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          data_match_score?: number | null
          date_of_birth?: string | null
          document_image_url?: string | null
          document_number?: string | null
          document_type?:
            | "passport"
            | "drivers_license"
            | "national_id"
            | "voters_card"
            | "permanent_voters_card"
            | "bvn"
            | "nin"
            | null
          document_valid?: boolean | null
          email?: string | null
          expiry_date?: string | null
          face_match_score?: number | null
          first_name?: string | null
          gender?: string | null
          id?: string | null
          issue_date?: string | null
          issuing_authority?: string | null
          last_name?: string | null
          middle_name?: string | null
          nationality?: string | null
          person_exists?: boolean | null
          phone_number?: string | null
          photo_url?: string | null
          place_of_birth?: string | null
          verification_record_id?: string | null
        }
        Relationships: []
      }
      v_phone_verifications: {
        Row: {
          attempts_count: number | null
          carrier_name: string | null
          code_expires_at: string | null
          code_sent_at: string | null
          code_verified_at: string | null
          country_code: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          is_mobile: boolean | null
          is_ported: boolean | null
          is_valid: boolean | null
          line_type: string | null
          max_attempts: number | null
          phone_number: string | null
          verification_code: string | null
          verification_method:
            | "sms"
            | "voice_call"
            | "missed_call"
            | "otp"
            | null
          verification_record_id: string | null
        }
        Insert: {
          attempts_count?: number | null
          carrier_name?: string | null
          code_expires_at?: string | null
          code_sent_at?: string | null
          code_verified_at?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          is_mobile?: boolean | null
          is_ported?: boolean | null
          is_valid?: boolean | null
          line_type?: string | null
          max_attempts?: number | null
          phone_number?: string | null
          verification_code?: string | null
          verification_method?:
            | "sms"
            | "voice_call"
            | "missed_call"
            | "otp"
            | null
          verification_record_id?: string | null
        }
        Update: {
          attempts_count?: number | null
          carrier_name?: string | null
          code_expires_at?: string | null
          code_sent_at?: string | null
          code_verified_at?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          is_mobile?: boolean | null
          is_ported?: boolean | null
          is_valid?: boolean | null
          line_type?: string | null
          max_attempts?: number | null
          phone_number?: string | null
          verification_code?: string | null
          verification_method?:
            | "sms"
            | "voice_call"
            | "missed_call"
            | "otp"
            | null
          verification_record_id?: string | null
        }
        Relationships: []
      }
      v_user_verification_status: {
        Row: {
          address_verification_id: string | null
          address_verified: boolean | null
          background_check_id: string | null
          background_check_passed: boolean | null
          biometric_verification_id: string | null
          biometric_verified: boolean | null
          business_verification_id: string | null
          business_verified: boolean | null
          created_at: string | null
          id: string | null
          identity_verification_id: string | null
          identity_verified: boolean | null
          last_verification_date: string | null
          phone_verification_id: string | null
          phone_verified: boolean | null
          project_id: string | null
          trust_score: number | null
          updated_at: string | null
          user_id: string | null
          verification_expires_at: string | null
          verification_level: number | null
        }
        Insert: {
          address_verification_id?: string | null
          address_verified?: boolean | null
          background_check_id?: string | null
          background_check_passed?: boolean | null
          biometric_verification_id?: string | null
          biometric_verified?: boolean | null
          business_verification_id?: string | null
          business_verified?: boolean | null
          created_at?: string | null
          id?: string | null
          identity_verification_id?: string | null
          identity_verified?: boolean | null
          last_verification_date?: string | null
          phone_verification_id?: string | null
          phone_verified?: boolean | null
          project_id?: string | null
          trust_score?: number | null
          updated_at?: string | null
          user_id?: string | null
          verification_expires_at?: string | null
          verification_level?: number | null
        }
        Update: {
          address_verification_id?: string | null
          address_verified?: boolean | null
          background_check_id?: string | null
          background_check_passed?: boolean | null
          biometric_verification_id?: string | null
          biometric_verified?: boolean | null
          business_verification_id?: string | null
          business_verified?: boolean | null
          created_at?: string | null
          id?: string | null
          identity_verification_id?: string | null
          identity_verified?: boolean | null
          last_verification_date?: string | null
          phone_verification_id?: string | null
          phone_verified?: boolean | null
          project_id?: string | null
          trust_score?: number | null
          updated_at?: string | null
          user_id?: string | null
          verification_expires_at?: string | null
          verification_level?: number | null
        }
        Relationships: []
      }
      v_verification_audit_log: {
        Row: {
          action: string | null
          created_at: string | null
          details: Json | null
          id: string | null
          ip_address: unknown
          new_status: string | null
          old_status: string | null
          user_agent: string | null
          user_id: string | null
          verification_record_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string | null
          ip_address?: unknown
          new_status?: string | null
          old_status?: string | null
          user_agent?: string | null
          user_id?: string | null
          verification_record_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string | null
          ip_address?: unknown
          new_status?: string | null
          old_status?: string | null
          user_agent?: string | null
          user_id?: string | null
          verification_record_id?: string | null
        }
        Relationships: []
      }
      v_verification_metrics: {
        Row: {
          average_confidence_score: number | null
          average_response_time_ms: number | null
          country_code: string | null
          created_at: string | null
          date_recorded: string | null
          failed_verifications: number | null
          id: string | null
          pending_verifications: number | null
          service_category: string | null
          successful_verifications: number | null
          total_attempts: number | null
          verification_type: string | null
        }
        Insert: {
          average_confidence_score?: number | null
          average_response_time_ms?: number | null
          country_code?: string | null
          created_at?: string | null
          date_recorded?: string | null
          failed_verifications?: number | null
          id?: string | null
          pending_verifications?: number | null
          service_category?: string | null
          successful_verifications?: number | null
          total_attempts?: number | null
          verification_type?: string | null
        }
        Update: {
          average_confidence_score?: number | null
          average_response_time_ms?: number | null
          country_code?: string | null
          created_at?: string | null
          date_recorded?: string | null
          failed_verifications?: number | null
          id?: string | null
          pending_verifications?: number | null
          service_category?: string | null
          successful_verifications?: number | null
          total_attempts?: number | null
          verification_type?: string | null
        }
        Relationships: []
      }
      v_verification_records: {
        Row: {
          completed_at: string | null
          confidence_score: number | null
          country_code: string | null
          created_at: string | null
          error_code: string | null
          error_message: string | null
          expires_at: string | null
          id: string | null
          ip_address: unknown
          metadata: Json | null
          project_id: string | null
          provider_request_id: string | null
          reference_number: string | null
          request_data: Json | null
          request_id: string | null
          response_data: Json | null
          retry_count: number | null
          service_category: string | null
          status:
            | "pending"
            | "processing"
            | "completed"
            | "failed"
            | "expired"
            | null
          user_agent: string | null
          user_id: string | null
          verification_type:
            | "identity"
            | "business"
            | "phone"
            | "address"
            | "biometric"
            | "background_check"
            | null
        }
        Insert: {
          completed_at?: string | null
          confidence_score?: number | null
          country_code?: string | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string | null
          ip_address?: unknown
          metadata?: Json | null
          project_id?: string | null
          provider_request_id?: string | null
          reference_number?: string | null
          request_data?: Json | null
          request_id?: string | null
          response_data?: Json | null
          retry_count?: number | null
          service_category?: string | null
          status?:
            | "pending"
            | "processing"
            | "completed"
            | "failed"
            | "expired"
            | null
          user_agent?: string | null
          user_id?: string | null
          verification_type?:
            | "identity"
            | "business"
            | "phone"
            | "address"
            | "biometric"
            | "background_check"
            | null
        }
        Update: {
          completed_at?: string | null
          confidence_score?: number | null
          country_code?: string | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string | null
          ip_address?: unknown
          metadata?: Json | null
          project_id?: string | null
          provider_request_id?: string | null
          reference_number?: string | null
          request_data?: Json | null
          request_id?: string | null
          response_data?: Json | null
          retry_count?: number | null
          service_category?: string | null
          status?:
            | "pending"
            | "processing"
            | "completed"
            | "failed"
            | "expired"
            | null
          user_agent?: string | null
          user_id?: string | null
          verification_type?:
            | "identity"
            | "business"
            | "phone"
            | "address"
            | "biometric"
            | "background_check"
            | null
        }
        Relationships: []
      }
      v_verification_requests: {
        Row: {
          country: string | null
          created_at: string | null
          endpoint: string | null
          id: string | null
          request_payload: Json | null
          response_payload: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          endpoint?: string | null
          id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          endpoint?: string | null
          id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_verification_requirements: {
        Row: {
          confidence_threshold: number | null
          cost_ngn: number | null
          cost_usd: number | null
          country_code: string | null
          created_at: string | null
          estimated_processing_time_seconds: number | null
          id: string | null
          is_available: boolean | null
          is_required: boolean | null
          minimum_age: number | null
          optional_documents: string[] | null
          provider_endpoint: string | null
          provider_name: string | null
          required_documents: string[] | null
          service_category: string | null
          updated_at: string | null
          verification_type: string | null
        }
        Insert: {
          confidence_threshold?: number | null
          cost_ngn?: number | null
          cost_usd?: number | null
          country_code?: string | null
          created_at?: string | null
          estimated_processing_time_seconds?: number | null
          id?: string | null
          is_available?: boolean | null
          is_required?: boolean | null
          minimum_age?: number | null
          optional_documents?: string[] | null
          provider_endpoint?: string | null
          provider_name?: string | null
          required_documents?: string[] | null
          service_category?: string | null
          updated_at?: string | null
          verification_type?: string | null
        }
        Update: {
          confidence_threshold?: number | null
          cost_ngn?: number | null
          cost_usd?: number | null
          country_code?: string | null
          created_at?: string | null
          estimated_processing_time_seconds?: number | null
          id?: string | null
          is_available?: boolean | null
          is_required?: boolean | null
          minimum_age?: number | null
          optional_documents?: string[] | null
          provider_endpoint?: string | null
          provider_name?: string | null
          required_documents?: string[] | null
          service_category?: string | null
          updated_at?: string | null
          verification_type?: string | null
        }
        Relationships: []
      }
      vendor_billing_records: {
        Row: {
          base_cost: number | null
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string | null
          currency: string | null
          discount_amount: number | null
          id: string | null
          invoice_number: string | null
          invoice_url: string | null
          overage_cost: number | null
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          tax_amount: number | null
          total_amount: number | null
          total_compute_hours: number | null
          total_requests: number | null
          total_tokens: number | null
          updated_at: string | null
          usage_cost: number | null
          vendor_org_id: string | null
        }
        Insert: {
          base_cost?: number | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          id?: string | null
          invoice_number?: string | null
          invoice_url?: string | null
          overage_cost?: number | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          total_compute_hours?: number | null
          total_requests?: number | null
          total_tokens?: number | null
          updated_at?: string | null
          usage_cost?: number | null
          vendor_org_id?: string | null
        }
        Update: {
          base_cost?: number | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          id?: string | null
          invoice_number?: string | null
          invoice_url?: string | null
          overage_cost?: number | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          total_compute_hours?: number | null
          total_requests?: number | null
          total_tokens?: number | null
          updated_at?: string | null
          usage_cost?: number | null
          vendor_org_id?: string | null
        }
        Relationships: []
      }
      vendor_key_audit_log: {
        Row: {
          action: string | null
          id: string | null
          ip_address: unknown
          key_id: string | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          id?: string | null
          ip_address?: unknown
          key_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          id?: string | null
          ip_address?: unknown
          key_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vendor_usage_logs: {
        Row: {
          api_key_id: string | null
          billing_tier: string | null
          compute_units: number | null
          cost_amount: number | null
          cost_currency: string | null
          endpoint: string | null
          error_message: string | null
          id: string | null
          ip_address: unknown
          method: string | null
          platform: string | null
          processed_at: string | null
          processing_time_ms: number | null
          request_id: string | null
          request_metadata: Json | null
          request_size_bytes: number | null
          request_timestamp: string | null
          response_metadata: Json | null
          response_size_bytes: number | null
          service: string | null
          status_code: number | null
          success: boolean | null
          tokens_consumed: number | null
          user_agent: string | null
          vendor_org_id: string | null
        }
        Insert: {
          api_key_id?: string | null
          billing_tier?: string | null
          compute_units?: number | null
          cost_amount?: number | null
          cost_currency?: string | null
          endpoint?: string | null
          error_message?: string | null
          id?: string | null
          ip_address?: unknown
          method?: string | null
          platform?: string | null
          processed_at?: string | null
          processing_time_ms?: number | null
          request_id?: string | null
          request_metadata?: Json | null
          request_size_bytes?: number | null
          request_timestamp?: string | null
          response_metadata?: Json | null
          response_size_bytes?: number | null
          service?: string | null
          status_code?: number | null
          success?: boolean | null
          tokens_consumed?: number | null
          user_agent?: string | null
          vendor_org_id?: string | null
        }
        Update: {
          api_key_id?: string | null
          billing_tier?: string | null
          compute_units?: number | null
          cost_amount?: number | null
          cost_currency?: string | null
          endpoint?: string | null
          error_message?: string | null
          id?: string | null
          ip_address?: unknown
          method?: string | null
          platform?: string | null
          processed_at?: string | null
          processing_time_ms?: number | null
          request_id?: string | null
          request_metadata?: Json | null
          request_size_bytes?: number | null
          request_timestamp?: string | null
          response_metadata?: Json | null
          response_size_bytes?: number | null
          service?: string | null
          status_code?: number | null
          success?: boolean | null
          tokens_consumed?: number | null
          user_agent?: string | null
          vendor_org_id?: string | null
        }
        Relationships: []
      }
      vendors: {
        Row: {
          api_key: string | null
          api_secret: string | null
          base_url: string | null
          config: Json | null
          created_at: string | null
          id: string | null
          name: string | null
          status: string | null
          updated_at: string | null
          vendor_type: string | null
        }
        Insert: {
          api_key?: string | null
          api_secret?: string | null
          base_url?: string | null
          config?: Json | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          status?: string | null
          updated_at?: string | null
          vendor_type?: string | null
        }
        Update: {
          api_key?: string | null
          api_secret?: string | null
          base_url?: string | null
          config?: Json | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          status?: string | null
          updated_at?: string | null
          vendor_type?: string | null
        }
        Relationships: []
      }
      vortex_settings: {
        Row: {
          created_at: string | null
          id: string | null
          key: string | null
          updated_at: string | null
          user_id: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          key?: string | null
          updated_at?: string | null
          user_id?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          key?: string | null
          updated_at?: string | null
          user_id?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      vortex_transactions: {
        Row: {
          amount: number | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string | null
          metadata: Json | null
          reference: string | null
          status: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
          wallet_id: string | null
        }
        Insert: {
          amount?: number | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string | null
          metadata?: Json | null
          reference?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Update: {
          amount?: number | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string | null
          metadata?: Json | null
          reference?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Relationships: []
      }
      vortex_wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string | null
          is_locked: boolean | null
          metadata: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          is_locked?: boolean | null
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          is_locked?: boolean | null
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          event_type: string | null
          id: number | null
          processed_at: string | null
          provider: string | null
          raw_event: Json | null
          resource_id: string | null
          resource_type: string | null
        }
        Insert: {
          event_type?: string | null
          id?: number | null
          processed_at?: string | null
          provider?: string | null
          raw_event?: Json | null
          resource_id?: string | null
          resource_type?: string | null
        }
        Update: {
          event_type?: string | null
          id?: number | null
          processed_at?: string | null
          provider?: string | null
          raw_event?: Json | null
          resource_id?: string | null
          resource_type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_auth_event: {
        Args: {
          p_aggregate_id: string
          p_aggregate_type: string
          p_event_id: string
          p_event_type: string
          p_event_type_version: number
          p_metadata: Json
          p_occurred_at: string
          p_payload: Json
          p_version: number
        }
        Returns: Json
      }
      check_intelligence_access: {
        Args: { p_tool_name: string; p_user_id: string }
        Returns: {
          allowed: boolean
          reason: string
          usage_remaining: number
        }[]
      }
      check_rate_limits: {
        Args: { p_api_key_id: string }
        Returns: {
          request_count: number
          window_start: string
          window_type: string
        }[]
      }
      clean_expired_cache: { Args: never; Returns: undefined }
      cleanup_expired_mcp_resources: { Args: never; Returns: undefined }
      cleanup_expired_oauth_sessions: { Args: never; Returns: undefined }
      count_memories: {
        Args: {
          filter_organization_id?: string
          filter_type?: string
          filter_user_id?: string
        }
        Returns: Json
      }
      create_control_room_app: {
        Args: {
          p_api_url?: string
          p_description?: string
          p_health_endpoint?: string
          p_id: string
          p_metadata?: Json
          p_name: string
          p_render_database_id?: string
          p_render_service_id?: string
          p_schema_name?: string
          p_status?: string
        }
        Returns: Database["public"]["Views"]["apps"]["Row"]
        SetofOptions: {
          from: "*"
          to: "apps"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_control_room_app: {
        Args: { p_hard_delete?: boolean; p_id: string }
        Returns: Json
      }
      execute_safe_query:
        | { Args: { query_text: string }; Returns: Json }
        | { Args: { query_params?: Json; query_text: string }; Returns: Json }
      find_duplicate_memories: {
        Args: {
          p_limit?: number
          p_max_memories?: number
          p_threshold?: number
          p_user_id: string
        }
        Returns: {
          duplicate_created_at: string
          duplicate_id: string
          duplicate_title: string
          primary_id: string
          primary_title: string
          similarity: number
        }[]
      }
      find_similar_patterns: {
        Args: {
          match_count?: number
          match_threshold?: number
          p_user_id?: string
          query_embedding: string
        }
        Returns: {
          actions: Json
          confidence: number
          context: Json
          final_outcome: string
          id: string
          similarity: number
          trigger: string
          use_count: number
        }[]
      }
      generate_vendor_api_key: {
        Args: {
          p_environment?: string
          p_key_name?: string
          p_key_type?: string
          p_vendor_org_id: string
        }
        Returns: {
          api_key_record_id: string
          key_id: string
          key_secret: string
        }[]
      }
      get_api_key_scopes: {
        Args: { p_api_key_id: string }
        Returns: {
          allowed_actions: string[]
          max_calls_per_day: number
          max_calls_per_minute: number
          service_key: string
        }[]
      }
      get_auth_events_stats: { Args: never; Returns: Json }
      get_central_audit_projection_stats: { Args: never; Returns: Json }
      get_central_audit_request: {
        Args: { p_request_id: string }
        Returns: {
          action: string
          actor_id: string
          actor_type: string
          auth_source: string
          created_at: string
          failure_reason: string
          metadata: Json
          organization_id: string
          resource_id: string
          resource_type: string
          result: string
          route_source: string
        }[]
      }
      get_central_mcp_audit_stats: { Args: never; Returns: Json }
      get_control_room_app: {
        Args: { p_id: string }
        Returns: Database["public"]["Views"]["apps"]["Row"]
        SetofOptions: {
          from: "*"
          to: "apps"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_control_room_apps: {
        Args: { p_search?: string; p_status?: string }
        Returns: Database["public"]["Views"]["apps"]["Row"][]
        SetofOptions: {
          from: "*"
          to: "apps"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_current_org: { Args: never; Returns: string }
      get_key_for_mcp_session: {
        Args: { key_name_param: string; session_id_param: string }
        Returns: {
          expires_at: string
          proxy_token: string
        }[]
      }
      get_memories_needing_voyage_migration: {
        Args: { p_limit?: number }
        Returns: {
          content: string
          id: string
        }[]
      }
      get_memory_stats: {
        Args: { filter_user_id?: string }
        Returns: {
          by_type: Json
          recent_activity: Json
          total_memories: number
        }[]
      }
      get_product_image_url: { Args: { image_path: string }; Returns: string }
      get_user_service_for_routing: {
        Args: {
          p_environment: string
          p_service_key: string
          p_user_id: string
        }
        Returns: {
          encrypted_credentials: string
          is_enabled: boolean
        }[]
      }
      get_user_tier_info: {
        Args: { p_user_id: string }
        Returns: {
          display_name: string
          features: Json
          intelligence_features: Json
          intelligence_quota: number
          intelligence_remaining: number
          intelligence_usage: number
          quota_resets_at: string
          tier_name: string
        }[]
      }
      hash_api_key: { Args: { p_key: string }; Returns: string }
      hybrid_search_memories: {
        Args: {
          filter_user_id?: string
          keyword_weight?: number
          match_count?: number
          min_similarity?: number
          query_embedding: string
          query_text: string
          semantic_weight?: number
        }
        Returns: {
          combined_score: number
          content: string
          created_at: string
          id: string
          keyword_rank: number
          metadata: Json
          semantic_similarity: number
          tags: string[]
          title: string
          type: string
          updated_at: string
        }[]
      }
      hybrid_search_voyage: {
        Args: {
          filter_user_id?: string
          keyword_weight?: number
          match_count?: number
          min_similarity?: number
          query_embedding: string
          query_text: string
          semantic_weight?: number
        }
        Returns: {
          combined_score: number
          content: string
          created_at: string
          id: string
          keyword_rank: number
          metadata: Json
          organization_id: string
          semantic_similarity: number
          tags: string[]
          title: string
          type: string
          updated_at: string
          user_id: string
        }[]
      }
      increment_intelligence_usage: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      increment_pattern_use_count: {
        Args: { pattern_id: string }
        Returns: undefined
      }
      increment_rate_limit: {
        Args: {
          p_api_key_id: string
          p_window_start: string
          p_window_type: string
        }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_org_member: {
        Args: { p_organization_id: string; p_user_id: string }
        Returns: boolean
      }
      is_owner: { Args: { bulk_id: string }; Returns: boolean }
      keyword_search_memories: {
        Args: {
          match_count?: number
          p_memory_types?: string[]
          p_organization_id?: string
          p_tags?: string[]
          p_topic_id?: string
          p_user_id?: string
          query_text: string
        }
        Returns: {
          access_count: number
          content: string
          created_at: string
          headline: string
          id: string
          metadata: Json
          organization_id: string
          rank: number
          summary: string
          tags: string[]
          title: string
          topic_id: string
          type: string
          user_id: string
        }[]
      }
      log_intelligence_usage: {
        Args: {
          p_cache_hit?: boolean
          p_cost_usd?: number
          p_error_message?: string
          p_response_time_ms?: number
          p_success?: boolean
          p_tokens_used?: number
          p_tool_name: string
          p_user_id: string
        }
        Returns: undefined
      }
      log_mcp_usage: {
        Args: {
          p_action: string
          p_api_key_id: string
          p_client_ip: unknown
          p_error_code: string
          p_error_message: string
          p_external_api_time_ms: number
          p_mcp_spawn_time_ms: number
          p_method: string
          p_request_id: string
          p_response_status: number
          p_response_time_ms: number
          p_service_key: string
          p_status: string
          p_user_agent: string
          p_user_id: string
        }
        Returns: undefined
      }
      log_search_analytics: {
        Args: {
          p_avg_similarity?: number
          p_distance_metric: string
          p_execution_time_ms: number
          p_filters: Json
          p_organization_id: string
          p_query_text: string
          p_results_count: number
          p_search_type: string
          p_top_similarity?: number
          p_user_id: string
        }
        Returns: string
      }
      log_vendor_usage: {
        Args: {
          p_api_key_id: string
          p_platform: string
          p_processing_time_ms?: number
          p_request_id: string
          p_service: string
          p_status_code?: number
          p_success?: boolean
          p_tokens_consumed?: number
          p_vendor_org_id: string
        }
        Returns: string
      }
      match_memories: {
        Args: {
          distance_metric?: string
          filter_user_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          created_at: string
          distance: number
          id: string
          metadata: Json
          similarity: number
          tags: string[]
          title: string
          type: string
          updated_at: string
        }[]
      }
      match_memories_advanced: {
        Args: {
          distance_metric?: string
          include_archived?: boolean
          match_count?: number
          match_threshold?: number
          p_memory_types?: string[]
          p_organization_id?: string
          p_tags?: string[]
          p_topic_id?: string
          p_user_id?: string
          query_embedding: string
        }
        Returns: {
          access_count: number
          content: string
          created_at: string
          distance: number
          id: string
          metadata: Json
          organization_id: string
          similarity: number
          summary: string
          tags: string[]
          title: string
          topic_id: string
          type: string
          updated_at: string
          user_id: string
        }[]
      }
      match_memories_voyage: {
        Args: {
          distance_metric?: string
          filter_user_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          created_at: string
          id: string
          metadata: Json
          organization_id: string
          similarity: number
          tags: string[]
          title: string
          type: string
          updated_at: string
          user_id: string
        }[]
      }
      memory_stats: {
        Args: { filter_organization_id?: string; filter_user_id?: string }
        Returns: Json
      }
      project_auth_event_to_audit_log: {
        Args: {
          p_aggregate_id: string
          p_aggregate_type: string
          p_event_id: string
          p_event_type: string
          p_metadata: Json
          p_occurred_at: string
          p_payload: Json
        }
        Returns: boolean
      }
      request_password_reset: { Args: { email: string }; Returns: boolean }
      reset_intelligence_quota: { Args: never; Returns: undefined }
      scheduled_intelligence_maintenance: { Args: never; Returns: undefined }
      search_memories: {
        Args: {
          filter_organization_id?: string
          filter_type?: string
          filter_user_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          created_at: string
          id: string
          memory_type: string
          metadata: Json
          similarity: number
          tags: string[]
          title: string
          updated_at: string
        }[]
      }
      search_memories_voyage: {
        Args: {
          filter_organization_id?: string
          filter_type?: string
          filter_user_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          created_at: string
          id: string
          memory_type: string
          metadata: Json
          organization_id: string
          similarity_score: number
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }[]
      }
      search_vectors: {
        Args: {
          match_count?: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          content: string
          created_at: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      sm_update_feature_flag: {
        Args: { flag_enabled: boolean; flag_name: string }
        Returns: boolean
      }
      text_search_memories: {
        Args: {
          filter_type?: string
          filter_user_id?: string
          max_results?: number
          search_query: string
        }
        Returns: {
          content: string
          created_at: string
          id: string
          rank: number
          tags: string[]
          title: string
          type: string
          updated_at: string
        }[]
      }
      track_memory_access: {
        Args: {
          p_access_method?: string
          p_access_type: string
          p_memory_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      track_search_analytics: {
        Args: {
          p_execution_time_ms?: number
          p_query: string
          p_results_count: number
          p_search_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      trigger_user_sync_to_auth_gateway: { Args: never; Returns: undefined }
      try_inet: { Args: { p_value: string }; Returns: unknown }
      try_uuid: { Args: { p_value: string }; Returns: string }
      update_control_room_app: {
        Args: { p_id: string; p_updates: Json }
        Returns: Database["public"]["Views"]["apps"]["Row"]
        SetofOptions: {
          from: "*"
          to: "apps"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_memory_access: { Args: { memory_id: string }; Returns: undefined }
      update_memory_voyage_embedding: {
        Args: {
          p_embedding_model?: string
          p_memory_id: string
          p_voyage_embedding: string
        }
        Returns: boolean
      }
      user_has_memory_grant: {
        Args: {
          p_memory_id: string
          p_permission?: Database["public"]["Enums"]["memory_permission"]
          p_user_id: string
        }
        Returns: boolean
      }
      validate_api_key: {
        Args: { p_key_hash: string }
        Returns: {
          allowed_environments: string[]
          allowed_ips: unknown[]
          expires_at: string
          id: string
          is_active: boolean
          key_prefix: string
          name: string
          rate_limit_per_day: number
          rate_limit_per_minute: number
          revoked_at: string
          revoked_reason: string
          scope_type: string
          user_id: string
        }[]
      }
      validate_vendor_api_key:
        | {
            Args: { p_key_id: string; p_key_secret: string }
            Returns: {
              allowed_platforms: Json
              allowed_services: Json
              is_valid: boolean
              rate_limit: number
              vendor_code: string
              vendor_org_id: string
            }[]
          }
        | {
            Args: { p_key_id: string; p_key_secret: string }
            Returns: {
              is_valid: boolean
              organization_id: string
              permissions: Json
              user_id: string
            }[]
          }
    }
    Enums: {
      environment_type: "sandbox" | "live"
      memory_access_mode: "private" | "shared"
      memory_grant_principal_type: "user" | "agent" | "team" | "channel"
      memory_owner_type:
        | "user"
        | "team"
        | "channel"
        | "organization"
        | "agent"
        | "project"
      memory_permission: "read" | "write" | "share" | "delete"
      memory_scope:
        | "personal"
        | "team"
        | "channel"
        | "organization"
        | "agent"
        | "project"
      memory_type:
        | "context"
        | "project"
        | "knowledge"
        | "reference"
        | "personal"
        | "workflow"
      org_member_role: "owner" | "admin" | "member" | "viewer"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "canceled"
      plan_type: "free" | "pro" | "enterprise"
      provider_status: "active" | "disabled" | "maintenance" | "deprecated"
      provider_type:
        | "wallet"
        | "payment_gateway"
        | "card_issuer"
        | "verification"
        | "transfer"
      user_role: "admin" | "user" | "viewer" | "superadmin" | "system"
      webhook_status: "active" | "paused" | "disabled"
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
      environment_type: ["sandbox", "live"],
      memory_access_mode: ["private", "shared"],
      memory_grant_principal_type: ["user", "agent", "team", "channel"],
      memory_owner_type: [
        "user",
        "team",
        "channel",
        "organization",
        "agent",
        "project",
      ],
      memory_permission: ["read", "write", "share", "delete"],
      memory_scope: [
        "personal",
        "team",
        "channel",
        "organization",
        "agent",
        "project",
      ],
      memory_type: [
        "context",
        "project",
        "knowledge",
        "reference",
        "personal",
        "workflow",
      ],
      org_member_role: ["owner", "admin", "member", "viewer"],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "canceled",
      ],
      plan_type: ["free", "pro", "enterprise"],
      provider_status: ["active", "disabled", "maintenance", "deprecated"],
      provider_type: [
        "wallet",
        "payment_gateway",
        "card_issuer",
        "verification",
        "transfer",
      ],
      user_role: ["admin", "user", "viewer", "superadmin", "system"],
      webhook_status: ["active", "paused", "disabled"],
    },
  },
} as const
