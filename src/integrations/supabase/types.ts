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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          order_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          order_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          order_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_performance_metrics: {
        Row: {
          agent_id: string
          conversation_id: string | null
          created_at: string
          first_response_time_seconds: number | null
          id: string
          messages_sent: number | null
          resolution_time_seconds: number | null
        }
        Insert: {
          agent_id: string
          conversation_id?: string | null
          created_at?: string
          first_response_time_seconds?: number | null
          id?: string
          messages_sent?: number | null
          resolution_time_seconds?: number | null
        }
        Update: {
          agent_id?: string
          conversation_id?: string | null
          created_at?: string
          first_response_time_seconds?: number | null
          id?: string
          messages_sent?: number | null
          resolution_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_performance_metrics_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_schedules: {
        Row: {
          agent_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          start_time: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          start_time: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_schedules_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "support_agents"
            referencedColumns: ["user_id"]
          },
        ]
      }
      canned_responses: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          is_global: boolean | null
          message: string
          shortcut: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_global?: boolean | null
          message: string
          shortcut?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_global?: boolean | null
          message?: string
          shortcut?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_auto_responses: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          priority: number
          response_message: string
          trigger_keywords: string[]
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number
          response_message: string
          trigger_keywords: string[]
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number
          response_message?: string
          trigger_keywords?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          assigned_agent_id: string | null
          closed_at: string | null
          created_at: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          id: string
          is_vip: boolean | null
          priority: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_agent_id?: string | null
          closed_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          is_vip?: boolean | null
          priority?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_agent_id?: string | null
          closed_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          is_vip?: boolean | null
          priority?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_feedback: {
        Row: {
          conversation_id: string
          created_at: string
          customer_id: string | null
          feedback_text: string | null
          id: string
          rating: number
        }
        Insert: {
          conversation_id: string
          created_at?: string
          customer_id?: string | null
          feedback_text?: string | null
          id?: string
          rating: number
        }
        Update: {
          conversation_id?: string
          created_at?: string
          customer_id?: string | null
          feedback_text?: string | null
          id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "chat_feedback_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_hourly_stats: {
        Row: {
          avg_resolution_time_seconds: number | null
          avg_response_time_seconds: number | null
          created_at: string
          hour_timestamp: string
          id: string
          resolved_count: number
          total_conversations: number
        }
        Insert: {
          avg_resolution_time_seconds?: number | null
          avg_response_time_seconds?: number | null
          created_at?: string
          hour_timestamp: string
          id?: string
          resolved_count?: number
          total_conversations?: number
        }
        Update: {
          avg_resolution_time_seconds?: number | null
          avg_response_time_seconds?: number | null
          created_at?: string
          hour_timestamp?: string
          id?: string
          resolved_count?: number
          total_conversations?: number
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          conversation_id: string
          created_at: string
          id: string
          message: string
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          message: string
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_id?: string | null
          sender_type?: string
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
      chat_typing_indicators: {
        Row: {
          conversation_id: string
          id: string
          is_typing: boolean | null
          updated_at: string | null
          user_id: string | null
          user_type: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_typing?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          user_type: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_typing?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_typing_indicators_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          phone: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          phone?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          phone?: string | null
          subject?: string
        }
        Relationships: []
      }
      metal_rates: {
        Row: {
          fetched_at: string
          id: string
          metal: string
          rate_per_gram_inr: number
          rate_per_oz_usd: number
          source: string | null
          usd_inr_rate: number
        }
        Insert: {
          fetched_at?: string
          id?: string
          metal: string
          rate_per_gram_inr: number
          rate_per_oz_usd: number
          source?: string | null
          usd_inr_rate: number
        }
        Update: {
          fetched_at?: string
          id?: string
          metal?: string
          rate_per_gram_inr?: number
          rate_per_oz_usd?: number
          source?: string | null
          usd_inr_rate?: number
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_notifications: boolean
          id: string
          likes_100: boolean
          likes_1000: boolean
          likes_10000: boolean
          likes_50: boolean
          likes_500: boolean
          likes_5000: boolean
          updated_at: string
          user_id: string
          views_100: boolean
          views_1000: boolean
          views_10000: boolean
          views_100000: boolean
          views_500: boolean
          views_5000: boolean
          views_50000: boolean
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          likes_100?: boolean
          likes_1000?: boolean
          likes_10000?: boolean
          likes_50?: boolean
          likes_500?: boolean
          likes_5000?: boolean
          updated_at?: string
          user_id: string
          views_100?: boolean
          views_1000?: boolean
          views_10000?: boolean
          views_100000?: boolean
          views_500?: boolean
          views_5000?: boolean
          views_50000?: boolean
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          likes_100?: boolean
          likes_1000?: boolean
          likes_10000?: boolean
          likes_50?: boolean
          likes_500?: boolean
          likes_5000?: boolean
          updated_at?: string
          user_id?: string
          views_100?: boolean
          views_1000?: boolean
          views_10000?: boolean
          views_100000?: boolean
          views_500?: boolean
          views_5000?: boolean
          views_50000?: boolean
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          customer_address: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          items: Json
          notes: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_address?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          items: Json
          notes?: string | null
          status?: string
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_address?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          items?: Json
          notes?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_metal_rate_per_gram: number | null
          category: string
          created_at: string
          description: string | null
          gender: Database["public"]["Enums"]["product_gender"] | null
          id: string
          image: string
          in_stock: boolean | null
          is_new: boolean | null
          low_stock_threshold: number
          name: string
          original_price: number | null
          price: number
          rating: number | null
          stock_quantity: number
          subcategory: string | null
          updated_at: string
        }
        Insert: {
          base_metal_rate_per_gram?: number | null
          category: string
          created_at?: string
          description?: string | null
          gender?: Database["public"]["Enums"]["product_gender"] | null
          id?: string
          image: string
          in_stock?: boolean | null
          is_new?: boolean | null
          low_stock_threshold?: number
          name: string
          original_price?: number | null
          price: number
          rating?: number | null
          stock_quantity?: number
          subcategory?: string | null
          updated_at?: string
        }
        Update: {
          base_metal_rate_per_gram?: number | null
          category?: string
          created_at?: string
          description?: string | null
          gender?: Database["public"]["Enums"]["product_gender"] | null
          id?: string
          image?: string
          in_stock?: boolean | null
          is_new?: boolean | null
          low_stock_threshold?: number
          name?: string
          original_price?: number | null
          price?: number
          rating?: number | null
          stock_quantity?: number
          subcategory?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reel_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          reel_id: string
          user_id: string
          user_name: string
        }
        Insert: {
          comment: string
          created_at?: string
          parent_id?: string | null
          id?: string
          reel_id: string
          user_id: string
          user_name: string
        }
        Update: {
          comment?: string
          created_at?: string
          parent_id?: string | null
          id?: string
          reel_id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_comments_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "reel_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      reel_comment_likes: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "reel_comments"
            referencedColumns: ["id"]
          }
        ]
      }
      reel_likes: {
        Row: {
          created_at: string
          id: string
          reel_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reel_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_likes_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      reel_milestones: {
        Row: {
          id: string
          is_read: boolean
          milestone_type: string
          milestone_value: number
          reached_at: string
          reel_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_read?: boolean
          milestone_type: string
          milestone_value: number
          reached_at?: string
          reel_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_read?: boolean
          milestone_type?: string
          milestone_value?: number
          reached_at?: string
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_milestones_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      reel_templates: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          name: string
          product_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          name: string
          product_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          name?: string
          product_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_templates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      reels: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          is_archived: boolean
          is_featured: boolean
          likes_count: number | null
          product_id: string | null
          scheduled_at: string | null
          status: string
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          video_url: string
          views_count: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          is_featured?: boolean
          likes_count?: number | null
          product_id?: string | null
          scheduled_at?: string | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          video_url: string
          views_count?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          is_featured?: boolean
          likes_count?: number | null
          product_id?: string | null
          scheduled_at?: string | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      satisfaction_alerts: {
        Row: {
          agent_id: string | null
          conversation_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          rating: number
          threshold: number
        }
        Insert: {
          agent_id?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          rating: number
          threshold: number
        }
        Update: {
          agent_id?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          rating?: number
          threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "satisfaction_alerts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_agents: {
        Row: {
          created_at: string
          current_conversations: number
          display_name: string
          email: string | null
          id: string
          is_available: boolean
          max_conversations: number
          user_id: string
        }
        Insert: {
          created_at?: string
          current_conversations?: number
          display_name: string
          email?: string | null
          id?: string
          is_available?: boolean
          max_conversations?: number
          user_id: string
        }
        Update: {
          created_at?: string
          current_conversations?: number
          display_name?: string
          email?: string | null
          id?: string
          is_available?: boolean
          max_conversations?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_category: string
          product_id: string
          product_image: string
          product_name: string
          product_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_category: string
          product_id: string
          product_image: string
          product_name: string
          product_price: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_category?: string
          product_id?: string
          product_image?: string
          product_name?: string
          product_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_agent_performance_stats: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          agent_id: string
          avg_resolution_time_seconds: number
          avg_response_time_seconds: number
          avg_satisfaction_rating: number
          display_name: string
          total_conversations: number
          total_messages_sent: number
        }[]
      }
      get_feedback_analytics: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          avg_rating: number
          feedback_with_comments: number
          rating_1_count: number
          rating_2_count: number
          rating_3_count: number
          rating_4_count: number
          rating_5_count: number
          total_feedback: number
        }[]
      }
      get_feedback_trends: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          avg_rating: number
          date: string
          feedback_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      product_gender: "men" | "women" | "unisex"
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
      app_role: ["admin", "moderator", "user"],
      product_gender: ["men", "women", "unisex"],
    },
  },
} as const
