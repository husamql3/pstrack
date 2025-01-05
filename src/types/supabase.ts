export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      group_progres: {
        Row: {
          created_at: string
          current_problem: number | null
          group_no: number | null
          id: string
        }
        Insert: {
          created_at?: string
          current_problem?: number | null
          group_no?: number | null
          id?: string
        }
        Update: {
          created_at?: string
          current_problem?: number | null
          group_no?: number | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'group_progres_current_problem_fkey'
            columns: ['current_problem']
            isOneToOne: false
            referencedRelation: 'roadmap'
            referencedColumns: ['problem_order']
          },
          {
            foreignKeyName: 'group_progres_group_no_fkey'
            columns: ['group_no']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['group_no']
          },
        ]
      }
      groups: {
        Row: {
          group_name: string
          group_no: number
          id: string
        }
        Insert: {
          group_name: string
          group_no?: number
          id?: string
        }
        Update: {
          group_name?: string
          group_no?: number
          id?: string
        }
        Relationships: []
      }
      leetcoders: {
        Row: {
          created_at: string | null
          email: string
          gh_username: string | null
          group_no: number | null
          id: string
          lc_username: string | null
          name: string
          status: string
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          gh_username?: string | null
          group_no?: number | null
          id?: string
          lc_username?: string | null
          name: string
          status?: string
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          gh_username?: string | null
          group_no?: number | null
          id?: string
          lc_username?: string | null
          name?: string
          status?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: 'leetcoders_group_no_fkey'
            columns: ['group_no']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['group_no']
          },
        ]
      }
      roadmap: {
        Row: {
          created_at: string
          difficulty: string
          id: string
          link: string
          problem_no: number
          problem_order: number
          topic: string
        }
        Insert: {
          created_at?: string
          difficulty?: string
          id?: string
          link: string
          problem_no: number
          problem_order: number
          topic: string
        }
        Update: {
          created_at?: string
          difficulty?: string
          id?: string
          link?: string
          problem_no?: number
          problem_order?: number
          topic?: string
        }
        Relationships: []
      }
      submission: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          problem_id: string | null
          solved: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          problem_id?: string | null
          solved?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          problem_id?: string | null
          solved?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'submission_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'leetcoders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'submission_problem_id_fkey'
            columns: ['problem_id']
            isOneToOne: false
            referencedRelation: 'roadmap'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'submission_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'leetcoders'
            referencedColumns: ['id']
          },
        ]
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

type PublicSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    ? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
    ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never
