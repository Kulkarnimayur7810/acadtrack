// Auto-generated database types
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string | null
          college: string | null
          department: string | null
          academic_year: string | null
          semester: string | null
          category: string | null
          start_date: string | null
          submission_deadline: string | null
          faculty_guide_name: string | null
          faculty_guide_contact: string | null
          team_leader_id: string | null
          tech_stack: string[] | null
          repo_url: string | null
          doc_links: Json | null
          objectives: string | null
          expected_outcomes: string | null
          research_paper_required: boolean
          status: string
          overall_progress: number
          current_phase_id: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          college?: string | null
          department?: string | null
          academic_year?: string | null
          semester?: string | null
          category?: string | null
          start_date?: string | null
          submission_deadline?: string | null
          faculty_guide_name?: string | null
          faculty_guide_contact?: string | null
          team_leader_id?: string | null
          tech_stack?: string[] | null
          repo_url?: string | null
          doc_links?: Json | null
          objectives?: string | null
          expected_outcomes?: string | null
          research_paper_required?: boolean
          status?: string
          overall_progress?: number
          current_phase_id?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          college?: string | null
          department?: string | null
          academic_year?: string | null
          semester?: string | null
          category?: string | null
          start_date?: string | null
          submission_deadline?: string | null
          faculty_guide_name?: string | null
          faculty_guide_contact?: string | null
          team_leader_id?: string | null
          tech_stack?: string[] | null
          repo_url?: string | null
          doc_links?: Json | null
          objectives?: string | null
          expected_outcomes?: string | null
          research_paper_required?: boolean
          status?: string
          overall_progress?: number
          current_phase_id?: string | null
          updated_at?: string
        }
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: 'owner' | 'leader' | 'member' | 'faculty' | 'reviewer'
          display_name: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: 'owner' | 'leader' | 'member' | 'faculty' | 'reviewer'
          display_name?: string | null
          joined_at?: string
        }
        Update: {
          role?: 'owner' | 'leader' | 'member' | 'faculty' | 'reviewer'
          display_name?: string | null
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          task_number: number
          assignee_id: string | null
          creator_id: string
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'done'
          column_order: number
          start_date: string | null
          due_date: string | null
          phase_id: string | null
          milestone_id: string | null
          estimated_hours: number | null
          actual_hours: number | null
          tags: string[] | null
          is_correction_task: boolean
          correction_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          task_number?: number
          assignee_id?: string | null
          creator_id: string
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'done'
          column_order?: number
          start_date?: string | null
          due_date?: string | null
          phase_id?: string | null
          milestone_id?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          tags?: string[] | null
          is_correction_task?: boolean
          correction_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          assignee_id?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'done'
          column_order?: number
          start_date?: string | null
          due_date?: string | null
          phase_id?: string | null
          milestone_id?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          tags?: string[] | null
          updated_at?: string
        }
      }
      subtasks: {
        Row: {
          id: string
          task_id: string
          title: string
          completed: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          title: string
          completed?: boolean
          order_index?: number
          created_at?: string
        }
        Update: {
          title?: string
          completed?: boolean
          order_index?: number
        }
      }
      comments: {
        Row: {
          id: string
          project_id: string
          task_id: string | null
          phase_id: string | null
          deliverable_id: string | null
          correction_id: string | null
          author_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          task_id?: string | null
          phase_id?: string | null
          deliverable_id?: string | null
          correction_id?: string | null
          author_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          content?: string
          updated_at?: string
        }
      }
      presentation_phases: {
        Row: {
          id: string
          project_id: string
          name: string
          description: string | null
          phase_number: number
          status: 'not_started' | 'planning' | 'preparing' | 'ready_for_review' | 'ready_to_present' | 'presented' | 'corrections_required' | 'approved' | 'completed'
          scheduled_date: string | null
          actual_date: string | null
          completion_date: string | null
          faculty_approval_status: 'pending' | 'approved' | 'rejected' | 'not_required'
          faculty_approval_date: string | null
          faculty_approval_notes: string | null
          is_active: boolean
          is_custom: boolean
          color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          description?: string | null
          phase_number: number
          status?: 'not_started' | 'planning' | 'preparing' | 'ready_for_review' | 'ready_to_present' | 'presented' | 'corrections_required' | 'approved' | 'completed'
          scheduled_date?: string | null
          actual_date?: string | null
          completion_date?: string | null
          faculty_approval_status?: 'pending' | 'approved' | 'rejected' | 'not_required'
          faculty_approval_date?: string | null
          faculty_approval_notes?: string | null
          is_active?: boolean
          is_custom?: boolean
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          phase_number?: number
          status?: 'not_started' | 'planning' | 'preparing' | 'ready_for_review' | 'ready_to_present' | 'presented' | 'corrections_required' | 'approved' | 'completed'
          scheduled_date?: string | null
          actual_date?: string | null
          completion_date?: string | null
          faculty_approval_status?: 'pending' | 'approved' | 'rejected' | 'not_required'
          faculty_approval_date?: string | null
          faculty_approval_notes?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      deliverables: {
        Row: {
          id: string
          phase_id: string
          project_id: string
          name: string
          description: string | null
          is_mandatory: boolean
          assignee_id: string | null
          reviewer_id: string | null
          due_date: string | null
          status: 'not_started' | 'in_progress' | 'submitted_for_review' | 'changes_requested' | 'approved'
          file_url: string | null
          version: number
          review_comments: string | null
          last_updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          phase_id: string
          project_id: string
          name: string
          description?: string | null
          is_mandatory?: boolean
          assignee_id?: string | null
          reviewer_id?: string | null
          due_date?: string | null
          status?: 'not_started' | 'in_progress' | 'submitted_for_review' | 'changes_requested' | 'approved'
          file_url?: string | null
          version?: number
          review_comments?: string | null
          last_updated_at?: string
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          is_mandatory?: boolean
          assignee_id?: string | null
          reviewer_id?: string | null
          due_date?: string | null
          status?: 'not_started' | 'in_progress' | 'submitted_for_review' | 'changes_requested' | 'approved'
          file_url?: string | null
          version?: number
          review_comments?: string | null
          last_updated_at?: string
        }
      }
      feedback_records: {
        Row: {
          id: string
          phase_id: string
          project_id: string
          presentation_date: string | null
          reviewer_name: string
          reviewer_id: string | null
          evaluation_criteria: string | null
          marks_obtained: number | null
          max_marks: number | null
          general_feedback: string | null
          strengths: string | null
          areas_for_improvement: string | null
          final_approval_status: 'pending' | 'approved' | 'conditional'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phase_id: string
          project_id: string
          presentation_date?: string | null
          reviewer_name: string
          reviewer_id?: string | null
          evaluation_criteria?: string | null
          marks_obtained?: number | null
          max_marks?: number | null
          general_feedback?: string | null
          strengths?: string | null
          areas_for_improvement?: string | null
          final_approval_status?: 'pending' | 'approved' | 'conditional'
          created_at?: string
          updated_at?: string
        }
        Update: {
          presentation_date?: string | null
          reviewer_name?: string
          evaluation_criteria?: string | null
          marks_obtained?: number | null
          max_marks?: number | null
          general_feedback?: string | null
          strengths?: string | null
          areas_for_improvement?: string | null
          final_approval_status?: 'pending' | 'approved' | 'conditional'
          updated_at?: string
        }
      }
      corrections: {
        Row: {
          id: string
          feedback_id: string
          project_id: string
          phase_id: string
          correction_number: number
          description: string
          assignee_id: string | null
          priority: 'low' | 'medium' | 'high' | 'urgent'
          deadline: string | null
          status: 'open' | 'in_progress' | 'ready_for_verification' | 'verified' | 'reopened'
          evidence_url: string | null
          verified_by: string | null
          verified_at: string | null
          verification_notes: string | null
          task_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          feedback_id: string
          project_id: string
          phase_id: string
          correction_number?: number
          description: string
          assignee_id?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          deadline?: string | null
          status?: 'open' | 'in_progress' | 'ready_for_verification' | 'verified' | 'reopened'
          evidence_url?: string | null
          verified_by?: string | null
          verified_at?: string | null
          verification_notes?: string | null
          task_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          description?: string
          assignee_id?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          deadline?: string | null
          status?: 'open' | 'in_progress' | 'ready_for_verification' | 'verified' | 'reopened'
          evidence_url?: string | null
          verified_by?: string | null
          verified_at?: string | null
          verification_notes?: string | null
          task_id?: string | null
          updated_at?: string
        }
      }
      milestones: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          owner_id: string | null
          due_date: string | null
          actual_date: string | null
          status: 'not_started' | 'in_progress' | 'completed' | 'delayed'
          weight: number
          phase_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          owner_id?: string | null
          due_date?: string | null
          actual_date?: string | null
          status?: 'not_started' | 'in_progress' | 'completed' | 'delayed'
          weight?: number
          phase_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          owner_id?: string | null
          due_date?: string | null
          actual_date?: string | null
          status?: 'not_started' | 'in_progress' | 'completed' | 'delayed'
          weight?: number
          phase_id?: string | null
          updated_at?: string
        }
      }
      calendar_events: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          event_type: 'presentation' | 'faculty_review' | 'deadline' | 'deliverable' | 'mock' | 'viva' | 'submission' | 'meeting' | 'other'
          date: string
          time: string | null
          end_date: string | null
          phase_id: string | null
          location: string | null
          meeting_link: string | null
          responsible_members: string[] | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          event_type?: 'presentation' | 'faculty_review' | 'deadline' | 'deliverable' | 'mock' | 'viva' | 'submission' | 'meeting' | 'other'
          date: string
          time?: string | null
          end_date?: string | null
          phase_id?: string | null
          location?: string | null
          meeting_link?: string | null
          responsible_members?: string[] | null
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          event_type?: 'presentation' | 'faculty_review' | 'deadline' | 'deliverable' | 'mock' | 'viva' | 'submission' | 'meeting' | 'other'
          date?: string
          time?: string | null
          end_date?: string | null
          phase_id?: string | null
          location?: string | null
          meeting_link?: string | null
          responsible_members?: string[] | null
          notes?: string | null
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          project_id: string
          user_id: string
          type: string
          title: string
          body: string
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          type: string
          title: string
          body: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          is_read?: boolean
        }
      }
      activity_logs: {
        Row: {
          id: string
          project_id: string
          actor_id: string
          action: string
          entity_type: string
          entity_id: string | null
          entity_title: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          actor_id: string
          action: string
          entity_type: string
          entity_id?: string | null
          entity_title?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: Record<string, never>
      }
      research_papers: {
        Row: {
          id: string
          project_id: string
          title: string
          authors: string | null
          year: number | null
          doi: string | null
          url: string | null
          journal: string | null
          status: 'identified' | 'reading' | 'reviewed' | 'cited'
          notes: string | null
          added_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          authors?: string | null
          year?: number | null
          doi?: string | null
          url?: string | null
          journal?: string | null
          status?: 'identified' | 'reading' | 'reviewed' | 'cited'
          notes?: string | null
          added_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          authors?: string | null
          year?: number | null
          doi?: string | null
          url?: string | null
          journal?: string | null
          status?: 'identified' | 'reading' | 'reviewed' | 'cited'
          notes?: string | null
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
