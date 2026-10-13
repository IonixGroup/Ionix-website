// Scritto a mano per rispecchiare supabase/schema.sql.
// Quando il progetto Supabase è collegato, si può rigenerare con:
//   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts

export type TaskStatus = "todo" | "in_progress" | "done";
export type DocumentCategory = "contratto" | "preventivo" | "fattura" | "altro";
export type ProfileRole = "team" | "client" | "owner";
export type WorkerTier = "junior" | "pro";

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          deadline: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          deadline?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          deadline?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          status: TaskStatus;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          status?: TaskStatus;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          status?: TaskStatus;
          position?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          category: DocumentCategory;
          client_visible: boolean;
          file_path: string;
          size_bytes: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          category?: DocumentCategory;
          client_visible?: boolean;
          file_path: string;
          size_bytes?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          category?: DocumentCategory;
          client_visible?: boolean;
          file_path?: string;
          size_bytes?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          role: ProfileRole;
          project_id: string | null;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role: ProfileRole;
          project_id?: string | null;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: ProfileRole;
          project_id?: string | null;
          full_name?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      workers: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          photo_path: string | null;
          active: boolean;
          tier: WorkerTier;
          daily_rate: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone?: string | null;
          photo_path?: string | null;
          active?: boolean;
          tier?: WorkerTier;
          daily_rate?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          photo_path?: string | null;
          active?: boolean;
          tier?: WorkerTier;
          daily_rate?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      attendance: {
        Row: {
          id: string;
          worker_id: string;
          project_id: string;
          work_date: string;
          units: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          project_id: string;
          work_date: string;
          units?: number;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          worker_id?: string;
          project_id?: string;
          work_date?: string;
          units?: number;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "workers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      milestones: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          position: number;
          due_date: string | null;
          completed_at: string | null;
          is_payment: boolean;
          payment_label: string | null;
          payment_amount: number | null;
          payment_paid: boolean;
          payment_paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          position?: number;
          due_date?: string | null;
          completed_at?: string | null;
          is_payment?: boolean;
          payment_label?: string | null;
          payment_amount?: number | null;
          payment_paid?: boolean;
          payment_paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          position?: number;
          due_date?: string | null;
          completed_at?: string | null;
          is_payment?: boolean;
          payment_label?: string | null;
          payment_amount?: number | null;
          payment_paid?: boolean;
          payment_paid_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      photos: {
        Row: {
          id: string;
          project_id: string;
          file_path: string;
          caption: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          file_path: string;
          caption?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          file_path?: string;
          caption?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "photos_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      professionals: {
        Row: {
          id: string;
          full_name: string;
          title: string;
          bio: string | null;
          phone: string | null;
          email: string | null;
          photo_path: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          title: string;
          bio?: string | null;
          phone?: string | null;
          email?: string | null;
          photo_path?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          title?: string;
          bio?: string | null;
          phone?: string | null;
          email?: string | null;
          photo_path?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      project_team: {
        Row: {
          id: string;
          project_id: string;
          professional_id: string;
          role_label: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          professional_id: string;
          role_label: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          professional_id?: string;
          role_label?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_team_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_team_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professionals";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
