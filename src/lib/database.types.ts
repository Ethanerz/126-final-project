export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      entities: {
        Row: {
          address: string | null;
          admin_id: string | null;
          aliases: string[];
          archived_at: string | null;
          campus: string;
          category: string | null;
          contact_info: Json | null;
          created_at: string | null;
          description: string | null;
          entity_type: Database["public"]["Enums"]["entity_type"];
          google_place_id: string | null;
          id: string;
          image_link: string | null;
          images: string[] | null;
          latitude: number | null;
          longitude: number | null;
          map_zoom_level: number | null;
          name: string;
          operating_hours: Json | null;
          preparation: string | null;
          source_checked_at: string | null;
          source_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          address?: string | null;
          admin_id?: string | null;
          aliases?: string[];
          archived_at?: string | null;
          campus?: string;
          category?: string | null;
          contact_info?: Json | null;
          created_at?: string | null;
          description?: string | null;
          entity_type: Database["public"]["Enums"]["entity_type"];
          google_place_id?: string | null;
          id?: string;
          image_link?: string | null;
          images?: string[] | null;
          latitude?: number | null;
          longitude?: number | null;
          map_zoom_level?: number | null;
          name: string;
          operating_hours?: Json | null;
          preparation?: string | null;
          source_checked_at?: string | null;
          source_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          address?: string | null;
          admin_id?: string | null;
          aliases?: string[];
          archived_at?: string | null;
          campus?: string;
          category?: string | null;
          contact_info?: Json | null;
          created_at?: string | null;
          description?: string | null;
          entity_type?: Database["public"]["Enums"]["entity_type"];
          google_place_id?: string | null;
          id?: string;
          image_link?: string | null;
          images?: string[] | null;
          latitude?: number | null;
          longitude?: number | null;
          map_zoom_level?: number | null;
          name?: string;
          operating_hours?: Json | null;
          preparation?: string | null;
          source_checked_at?: string | null;
          source_url?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      review_replies: {
        Row: {
          created_at: string | null;
          downvote_count: number | null;
          id: string;
          parent_reply_id: string | null;
          reply_text: string;
          review_id: string;
          updated_at: string | null;
          upvote_count: number | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          downvote_count?: number | null;
          id?: string;
          parent_reply_id?: string | null;
          reply_text: string;
          review_id: string;
          updated_at?: string | null;
          upvote_count?: number | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          downvote_count?: number | null;
          id?: string;
          parent_reply_id?: string | null;
          reply_text?: string;
          review_id?: string;
          updated_at?: string | null;
          upvote_count?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_replies_parent_reply_id_fkey";
            columns: ["parent_reply_id"];
            isOneToOne: false;
            referencedRelation: "review_replies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_replies_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_replies_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          created_at: string | null;
          display_name: string;
          downvote_count: number | null;
          entity_id: string;
          id: string;
          moderation_status: string;
          rating: number;
          review_text: string;
          title: string | null;
          updated_at: string | null;
          upvote_count: number | null;
          user_id: string;
          visited_on: string | null;
        };
        Insert: {
          created_at?: string | null;
          display_name?: string;
          downvote_count?: number | null;
          entity_id: string;
          id?: string;
          moderation_status?: string;
          rating: number;
          review_text: string;
          title?: string | null;
          updated_at?: string | null;
          upvote_count?: number | null;
          user_id: string;
          visited_on?: string | null;
        };
        Update: {
          created_at?: string | null;
          display_name?: string;
          downvote_count?: number | null;
          entity_id?: string;
          id?: string;
          moderation_status?: string;
          rating?: number;
          review_text?: string;
          title?: string | null;
          updated_at?: string | null;
          upvote_count?: number | null;
          user_id?: string;
          visited_on?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      submissions: {
        Row: {
          created_at: string;
          details: string;
          entity_id: string | null;
          id: string;
          kind: string;
          moderator_note: string | null;
          review_id: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          details: string;
          entity_id?: string | null;
          id?: string;
          kind: string;
          moderator_note?: string | null;
          review_id?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          details?: string;
          entity_id?: string | null;
          id?: string;
          kind?: string;
          moderator_note?: string | null;
          review_id?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "submissions_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "submissions_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
        ];
      };
      user_profiles: {
        Row: {
          created_at: string | null;
          full_name: string | null;
          id: string;
          role: Database["public"]["Enums"]["user_role"] | null;
          student_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          full_name?: string | null;
          id: string;
          role?: Database["public"]["Enums"]["user_role"] | null;
          student_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          full_name?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"] | null;
          student_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      votes: {
        Row: {
          created_at: string | null;
          id: string;
          target_id: string;
          target_type: string;
          user_id: string;
          vote_type: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          target_id: string;
          target_type: string;
          user_id: string;
          vote_type: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          target_id?: string;
          target_type?: string;
          user_id?: string;
          vote_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "votes_target_id_fkey";
            columns: ["target_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_my_student_id: { Args: never; Returns: string };
      is_student: { Args: never; Returns: boolean };
      my_user_role: {
        Args: never;
        Returns: Database["public"]["Enums"]["user_role"];
      };
    };
    Enums: {
      entity_type: "facility" | "service";
      user_role: "guest" | "student" | "admin" | "dept_admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      entity_type: ["facility", "service"],
      user_role: ["guest", "student", "admin", "dept_admin"],
    },
  },
} as const;
