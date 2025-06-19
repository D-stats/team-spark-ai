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
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          role: 'ADMIN' | 'MANAGER' | 'MEMBER';
          slack_user_id: string | null;
          is_active: boolean;
          last_active_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          name: string;
          avatar_url?: string | null;
          role?: 'ADMIN' | 'MANAGER' | 'MEMBER';
          slack_user_id?: string | null;
          is_active?: boolean;
          last_active_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          name?: string;
          avatar_url?: string | null;
          role?: 'ADMIN' | 'MANAGER' | 'MEMBER';
          slack_user_id?: string | null;
          is_active?: boolean;
          last_active_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}