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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: number
          is_visible: boolean
          name: string
          sort_order: number
          storage_path: string | null
          subtitle: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: never
          is_visible?: boolean
          name: string
          sort_order?: number
          storage_path?: string | null
          subtitle?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: never
          is_visible?: boolean
          name?: string
          sort_order?: number
          storage_path?: string | null
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      hero_media: {
        Row: {
          alt_text: string | null
          autoplay: boolean
          created_at: string
          duration_seconds: number | null
          id: number
          is_visible: boolean
          loop: boolean
          muted: boolean
          poster_storage_path: string | null
          sort_order: number
          storage_path: string
          type: Database["public"]["Enums"]["hero_media_type"]
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          autoplay?: boolean
          created_at?: string
          duration_seconds?: number | null
          id?: never
          is_visible?: boolean
          loop?: boolean
          muted?: boolean
          poster_storage_path?: string | null
          sort_order?: number
          storage_path: string
          type: Database["public"]["Enums"]["hero_media_type"]
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          autoplay?: boolean
          created_at?: string
          duration_seconds?: number | null
          id?: never
          is_visible?: boolean
          loop?: boolean
          muted?: boolean
          poster_storage_path?: string | null
          sort_order?: number
          storage_path?: string
          type?: Database["public"]["Enums"]["hero_media_type"]
          updated_at?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          badge: string | null
          category_id: number
          created_at: string
          id: number
          is_available: boolean
          is_visible: boolean
          name: string
          price: number
          short_description: string | null
          sort_order: number
          storage_path: string | null
          updated_at: string
        }
        Insert: {
          badge?: string | null
          category_id: number
          created_at?: string
          id?: never
          is_available?: boolean
          is_visible?: boolean
          name: string
          price: number
          short_description?: string | null
          sort_order?: number
          storage_path?: string | null
          updated_at?: string
        }
        Update: {
          badge?: string | null
          category_id?: number
          created_at?: string
          id?: never
          is_available?: boolean
          is_visible?: boolean
          name?: string
          price?: number
          short_description?: string | null
          sort_order?: number
          storage_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      opening_hours: {
        Row: {
          closes_at: string | null
          created_at: string
          day_of_week: Database["public"]["Enums"]["weekday"]
          id: number
          is_closed: boolean
          note: string | null
          opens_at: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          day_of_week: Database["public"]["Enums"]["weekday"]
          id?: never
          is_closed?: boolean
          note?: string | null
          opens_at?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          day_of_week?: Database["public"]["Enums"]["weekday"]
          id?: never
          is_closed?: boolean
          note?: string | null
          opens_at?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      restaurant_profile: {
        Row: {
          about: string | null
          address: string | null
          created_at: string
          email: string | null
          id: number
          is_active: boolean
          logo_storage_path: string | null
          name: string
          phone: string | null
          subtitle: string | null
          updated_at: string
          waze_url: string | null
        }
        Insert: {
          about?: string | null
          address?: string | null
          created_at?: string
          email?: string | null
          id?: number
          is_active?: boolean
          logo_storage_path?: string | null
          name: string
          phone?: string | null
          subtitle?: string | null
          updated_at?: string
          waze_url?: string | null
        }
        Update: {
          about?: string | null
          address?: string | null
          created_at?: string
          email?: string | null
          id?: number
          is_active?: boolean
          logo_storage_path?: string | null
          name?: string
          phone?: string | null
          subtitle?: string | null
          updated_at?: string
          waze_url?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: number
          seo_description: string | null
          seo_title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          seo_description?: string | null
          seo_title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          seo_description?: string | null
          seo_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string
          id: number
          is_visible: boolean
          platform: Database["public"]["Enums"]["social_platform"]
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: never
          is_visible?: boolean
          platform: Database["public"]["Enums"]["social_platform"]
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: never
          is_visible?: boolean
          platform?: Database["public"]["Enums"]["social_platform"]
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      hero_media_type: "image" | "video"
      social_platform:
        | "instagram"
        | "facebook"
        | "tiktok"
        | "whatsapp"
        | "youtube"
        | "x"
        | "website"
        | "other"
      weekday:
        | "sunday"
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
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
      hero_media_type: ["image", "video"],
      social_platform: [
        "instagram",
        "facebook",
        "tiktok",
        "whatsapp",
        "youtube",
        "x",
        "website",
        "other",
      ],
      weekday: [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ],
    },
  },
} as const
