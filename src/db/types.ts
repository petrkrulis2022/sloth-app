// Database types for Supabase
// These match the table structure from the original schema

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          wallet_address: string;
          perplexity_api_key_enc: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          wallet_address: string;
          perplexity_api_key_enc?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          wallet_address?: string;
          perplexity_api_key_enc?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          perplexity_space_id: string | null;
          perplexity_space_name: string | null;
          perplexity_api_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          perplexity_space_id?: string | null;
          perplexity_space_name?: string | null;
          perplexity_api_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          perplexity_space_id?: string | null;
          perplexity_space_name?: string | null;
          perplexity_api_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_collaborators: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: string;
          invited_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role?: string;
          invited_at?: string;
          accepted_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          role?: string;
          invited_at?: string;
          accepted_at?: string | null;
        };
      };
      invitations: {
        Row: {
          id: string;
          project_id: string;
          email: string;
          invited_by: string;
          status: string;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          email: string;
          invited_by: string;
          status?: string;
          created_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          email?: string;
          invited_by?: string;
          status?: string;
          created_at?: string;
          expires_at?: string;
        };
      };
      views: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          tag: string;
          chat_session_id: string | null;
          chat_session_name: string | null;
          ai_model: string | null;
          system_prompt: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          tag: string;
          chat_session_id?: string | null;
          chat_session_name?: string | null;
          ai_model?: string | null;
          system_prompt?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          tag?: string;
          chat_session_id?: string | null;
          chat_session_name?: string | null;
          ai_model?: string | null;
          system_prompt?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      issues: {
        Row: {
          id: string;
          view_id: string;
          parent_id: string | null;
          name: string;
          description: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          view_id: string;
          parent_id?: string | null;
          name: string;
          description?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          view_id?: string;
          parent_id?: string | null;
          name?: string;
          description?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          issue_id: string;
          parent_id: string | null;
          author_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          parent_id?: string | null;
          author_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          parent_id?: string | null;
          author_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          context_type: string;
          context_id: string;
          file_name: string;
          file_type: string;
          file_size: number;
          storage_path: string;
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          context_type: string;
          context_id: string;
          file_name: string;
          file_type: string;
          file_size: number;
          storage_path: string;
          uploaded_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          context_type?: string;
          context_id?: string;
          file_name?: string;
          file_type?: string;
          file_size?: number;
          storage_path?: string;
          uploaded_by?: string;
          created_at?: string;
        };
      };
      links: {
        Row: {
          id: string;
          context_type: string;
          context_id: string;
          url: string;
          description: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          context_type: string;
          context_id: string;
          url: string;
          description?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          context_type?: string;
          context_id?: string;
          url?: string;
          description?: string | null;
          created_by?: string;
          created_at?: string;
        };
      };
      ai_conversations: {
        Row: {
          id: string;
          context_type: string;
          context_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          context_type: string;
          context_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          context_type?: string;
          context_id?: string;
          created_at?: string;
        };
      };
      ai_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: string;
          content?: string;
          created_at?: string;
        };
      };
    };
  };
}

// Helper types for easier use
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectCollaborator =
  Database["public"]["Tables"]["project_collaborators"]["Row"];
export type Invitation = Database["public"]["Tables"]["invitations"]["Row"];
export type View = Database["public"]["Tables"]["views"]["Row"];
export type Issue = Database["public"]["Tables"]["issues"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type Link = Database["public"]["Tables"]["links"]["Row"];
export type AIConversation =
  Database["public"]["Tables"]["ai_conversations"]["Row"];
export type AIMessage = Database["public"]["Tables"]["ai_messages"]["Row"];
