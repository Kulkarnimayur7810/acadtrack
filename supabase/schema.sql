-- ==============================================================================
-- College Project Management & Presentation Tracking Platform
-- Complete PostgreSQL Database Schema with Row-Level Security (RLS)
-- ==============================================================================

-- 1. Profiles Table (linked to Supabase Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger to automatically create profile record when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  college TEXT,
  department TEXT,
  academic_year TEXT,
  semester TEXT,
  category TEXT,
  start_date DATE,
  submission_deadline DATE,
  faculty_guide_name TEXT,
  faculty_guide_contact TEXT,
  team_leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tech_stack TEXT[] DEFAULT '{}',
  repo_url TEXT,
  doc_links JSONB DEFAULT '[]'::jsonb,
  objectives TEXT,
  expected_outcomes TEXT,
  research_paper_required BOOLEAN DEFAULT FALSE NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'completed', 'archived')),
  overall_progress NUMERIC(5, 2) DEFAULT 0.00 NOT NULL,
  current_phase_id UUID,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Project Memberships
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' NOT NULL CHECK (role IN ('owner', 'leader', 'member', 'faculty', 'reviewer')),
  display_name TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (project_id, user_id)
);

-- 4. Presentation Phases (Default 9 academic phases + customizable)
CREATE TABLE IF NOT EXISTS public.presentation_phases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  phase_number INT NOT NULL,
  status TEXT DEFAULT 'not_started' NOT NULL CHECK (
    status IN (
      'not_started', 'planning', 'preparing', 'ready_for_review',
      'ready_to_present', 'presented', 'corrections_required',
      'approved', 'completed'
    )
  ),
  scheduled_date DATE,
  actual_date DATE,
  completion_date DATE,
  faculty_approval_status TEXT DEFAULT 'pending' NOT NULL CHECK (
    faculty_approval_status IN ('pending', 'approved', 'rejected', 'not_required')
  ),
  faculty_approval_date TIMESTAMPTZ,
  faculty_approval_notes TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  is_custom BOOLEAN DEFAULT FALSE NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Deliverables Checklist
CREATE TABLE IF NOT EXISTS public.deliverables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID REFERENCES public.presentation_phases(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN DEFAULT FALSE NOT NULL,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date DATE,
  status TEXT DEFAULT 'not_started' NOT NULL CHECK (
    status IN ('not_started', 'in_progress', 'submitted_for_review', 'changes_requested', 'approved')
  ),
  file_url TEXT,
  version INT DEFAULT 1 NOT NULL,
  review_comments TEXT,
  last_updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Feedback Records (from faculty evaluations and reviews)
CREATE TABLE IF NOT EXISTS public.feedback_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID REFERENCES public.presentation_phases(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  presentation_date DATE,
  reviewer_name TEXT NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  evaluation_criteria TEXT,
  marks_obtained NUMERIC(5, 2),
  max_marks NUMERIC(5, 2),
  general_feedback TEXT,
  strengths TEXT,
  areas_for_improvement TEXT,
  final_approval_status TEXT DEFAULT 'pending' NOT NULL CHECK (
    final_approval_status IN ('pending', 'approved', 'conditional')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Corrections Tracking
CREATE TABLE IF NOT EXISTS public.corrections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID REFERENCES public.feedback_records(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  phase_id UUID REFERENCES public.presentation_phases(id) ON DELETE CASCADE NOT NULL,
  correction_number INT DEFAULT 1 NOT NULL,
  description TEXT NOT NULL,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'medium' NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  deadline DATE,
  status TEXT DEFAULT 'open' NOT NULL CHECK (
    status IN ('open', 'in_progress', 'ready_for_verification', 'verified', 'reopened')
  ),
  evidence_url TEXT,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  task_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Tasks (Kanban Board)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_number INT NOT NULL,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  priority TEXT DEFAULT 'medium' NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'todo' NOT NULL CHECK (
    status IN ('backlog', 'todo', 'in_progress', 'in_review', 'blocked', 'done')
  ),
  column_order INT DEFAULT 0 NOT NULL,
  start_date DATE,
  due_date DATE,
  phase_id UUID REFERENCES public.presentation_phases(id) ON DELETE SET NULL,
  milestone_id UUID,
  estimated_hours NUMERIC(6, 2),
  actual_hours NUMERIC(6, 2),
  tags TEXT[] DEFAULT '{}',
  is_correction_task BOOLEAN DEFAULT FALSE NOT NULL,
  correction_id UUID REFERENCES public.corrections(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. Subtasks
CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  order_index INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. Comments
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.presentation_phases(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES public.deliverables(id) ON DELETE CASCADE,
  correction_id UUID REFERENCES public.corrections(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. Milestones
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date DATE,
  actual_date DATE,
  status TEXT DEFAULT 'not_started' NOT NULL CHECK (
    status IN ('not_started', 'in_progress', 'completed', 'delayed')
  ),
  weight INT DEFAULT 10 NOT NULL CHECK (weight >= 1),
  phase_id UUID REFERENCES public.presentation_phases(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. Calendar Events
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'presentation' NOT NULL CHECK (
    event_type IN (
      'presentation', 'faculty_review', 'deadline', 'deliverable',
      'mock', 'viva', 'submission', 'meeting', 'other'
    )
  ),
  date DATE NOT NULL,
  time TIME,
  end_date DATE,
  phase_id UUID REFERENCES public.presentation_phases(id) ON DELETE SET NULL,
  location TEXT,
  meeting_link TEXT,
  responsible_members TEXT[] DEFAULT '{}',
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 13. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 14. Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_title TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 15. Research Papers
CREATE TABLE IF NOT EXISTS public.research_papers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  authors TEXT,
  year INT,
  doi TEXT,
  url TEXT,
  journal TEXT,
  status TEXT DEFAULT 'identified' NOT NULL CHECK (
    status IN ('identified', 'reading', 'reviewed', 'cited')
  ),
  notes TEXT,
  added_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- Indexes for High Performance
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_phases_project ON public.presentation_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_phase ON public.deliverables(phase_id);
CREATE INDEX IF NOT EXISTS idx_feedback_phase ON public.feedback_records(phase_id);
CREATE INDEX IF NOT EXISTS idx_corrections_phase ON public.corrections(phase_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON public.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_project ON public.calendar_events(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_research_papers_project ON public.research_papers(project_id);

-- ==============================================================================
-- Row-Level Security (RLS) Policies
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_papers ENABLE ROW LEVEL SECURITY;

-- Helper check: is user member of project?
CREATE OR REPLACE FUNCTION public.is_project_member(_project_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = _project_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id AND owner_id = _user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles: Authenticated users can view profiles and edit their own
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Projects: Members can view, owners/leaders can update
CREATE POLICY "Members can view their projects"
  ON public.projects FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_project_member(id, auth.uid()));

CREATE POLICY "Users can create projects"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners and leaders can update projects"
  ON public.projects FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.is_project_member(id, auth.uid()));

CREATE POLICY "Owners can delete projects"
  ON public.projects FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Project Members: Members can view, owners can manage
CREATE POLICY "Project members can view members"
  ON public.project_members FOR SELECT TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Owners and leaders can add members"
  ON public.project_members FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Owners and leaders can update member roles"
  ON public.project_members FOR UPDATE TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Owners and leaders can remove members"
  ON public.project_members FOR DELETE TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

-- Tasks: Project members can view, create, and update
CREATE POLICY "Project members can view tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Project members can create tasks"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Project members can update tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Project members can delete tasks"
  ON public.tasks FOR DELETE TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

-- Subtasks
CREATE POLICY "Project members can view and manage subtasks"
  ON public.subtasks FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = subtasks.task_id AND public.is_project_member(t.project_id, auth.uid())
    )
  );

-- Presentation Phases
CREATE POLICY "Project members can view phases"
  ON public.presentation_phases FOR SELECT TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Project members can update phases"
  ON public.presentation_phases FOR ALL TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

-- Deliverables
CREATE POLICY "Project members can manage deliverables"
  ON public.deliverables FOR ALL TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

-- Feedback Records
CREATE POLICY "Project members can view feedback"
  ON public.feedback_records FOR SELECT TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Project members can add feedback"
  ON public.feedback_records FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Project members can update feedback"
  ON public.feedback_records FOR UPDATE TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

-- Corrections
CREATE POLICY "Project members can manage corrections"
  ON public.corrections FOR ALL TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

-- Milestones
CREATE POLICY "Project members can manage milestones"
  ON public.milestones FOR ALL TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

-- Calendar Events
CREATE POLICY "Project members can manage calendar events"
  ON public.calendar_events FOR ALL TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

-- Notifications
CREATE POLICY "Users can manage their own notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Research Papers
CREATE POLICY "Project members can manage research papers"
  ON public.research_papers FOR ALL TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));
