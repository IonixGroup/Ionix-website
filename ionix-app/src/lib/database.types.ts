// Scritto a mano per rispecchiare supabase/schema.sql.
// Quando il progetto Supabase è collegato, si può rigenerare con:
//   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts

export type TaskStatus = "todo" | "in_progress" | "done";

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
