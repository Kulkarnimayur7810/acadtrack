import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Flag,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CalendarDays,
  MessageSquareWarning,
  Activity,
  ChevronRight,
  BookOpen,
  FolderOpen,
  TrendingUp,
  ListChecks,
  Inbox,
} from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { useProjectStore } from '@/lib/store'
import {
  cn,
  formatDate,
  formatRelativeDate,
  daysUntil,
  isOverdue,
  PHASE_STATUS_CONFIG,
  CORRECTION_STATUS_CONFIG,
  DELIVERABLE_STATUS_CONFIG,
} from '@/lib/utils'
import {
  Badge,
  Avatar,
  Card,
  Spinner,
  EmptyState,
  ProgressBar,
  Button,
  SectionHeader,
  Divider,
} from '@/components/ui'
import type { Database } from '@/lib/database.types'

// ─── Local type aliases ────────────────────────────────────────────────────────
type Task = Database['public']['Tables']['tasks']['Row']
type Correction = Database['public']['Tables']['corrections']['Row']
type Deliverable = Database['public']['Tables']['deliverables']['Row']
type Milestone = Database['public']['Tables']['milestones']['Row']
type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type FeedbackRecord = Database['public']['Tables']['feedback_records']['Row']
type ActivityLog = Database['public']['Tables']['activity_logs']['Row']
type PresentationPhase = Database['public']['Tables']['presentation_phases']['Row']

// ─── Helpers ───────────────────────────────────────────────────────────────────
function projectStatusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'active': return 'success'
    case 'planning': return 'info'
    case 'on_hold': return 'warning'
    case 'completed': return 'default'
    case 'cancelled': return 'danger'
    default: return 'default'
  }
}

function projectStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function eventTypeVariant(type: CalendarEvent['event_type']): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' {
  switch (type) {
    case 'presentation': return 'purple'
    case 'faculty_review': return 'info'
    case 'deadline': return 'danger'
    case 'deliverable': return 'warning'
    case 'submission': return 'danger'
    case 'viva': return 'purple'
    case 'mock': return 'warning'
    case 'meeting': return 'default'
    default: return 'default'
  }
}

function eventTypeLabel(type: CalendarEvent['event_type']): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number | string
  sub?: string
  icon: React.ReactNode
  href: string
  urgent?: boolean
}

function StatCard({ label, value, sub, icon, href, urgent }: StatCardProps) {
  const navigate = useNavigate()
  return (
    <Card
      padding="md"
      className={cn('cursor-pointer transition-all', urgent && 'border-[--color-danger]/40 bg-[--color-danger-light]/30')}
      onClick={() => navigate(href)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-[--color-text-tertiary] font-medium uppercase tracking-wide">{label}</p>
          <p className={cn('text-2xl font-bold mt-1', urgent ? 'text-[--color-danger]' : 'text-[--color-text-primary]')}>
            {value}
          </p>
          {sub && <p className="text-xs text-[--color-text-tertiary] mt-0.5">{sub}</p>}
        </div>
        <div className={cn('p-2 rounded-[--radius-md] flex-shrink-0', urgent ? 'bg-[--color-danger-light] text-[--color-danger]' : 'bg-[--color-surface-raised] text-[--color-text-tertiary]')}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

// ─── Next Actions item types ────────────────────────────────────────────────────
type NextActionItem =
  | { kind: 'task'; id: string; title: string; assignee: string | null; daysLeft: number | null; overdue: boolean; href: string }
  | { kind: 'deliverable'; id: string; title: string; assignee: string | null; daysLeft: number | null; overdue: boolean; href: string }
  | { kind: 'correction'; id: string; title: string; assignee: string | null; daysLeft: number | null; overdue: boolean; href: string }

function NextActionRow({ item }: { item: NextActionItem }) {
  const badge = item.overdue
    ? <Badge variant="danger">Overdue</Badge>
    : item.daysLeft === 0
    ? <Badge variant="warning">Today</Badge>
    : item.daysLeft === 1
    ? <Badge variant="warning">Tomorrow</Badge>
    : item.daysLeft !== null
    ? <Badge variant="info">{item.daysLeft}d left</Badge>
    : null

  const kindIcon =
    item.kind === 'task' ? <ListChecks size={13} className="text-[--color-accent]" /> :
    item.kind === 'deliverable' ? <BookOpen size={13} className="text-[--color-warning]" /> :
    <MessageSquareWarning size={13} className="text-[--color-danger]" />

  return (
    <Link to={item.href} className="flex items-center gap-3 py-2.5 hover:bg-[--color-surface] px-2 -mx-2 rounded-[--radius-md] transition-colors group">
      <div className="flex-shrink-0 mt-0.5">{kindIcon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[--color-text-primary] truncate group-hover:text-[--color-accent] transition-colors">
          {item.title}
        </p>
        {item.assignee && (
          <p className="text-xs text-[--color-text-tertiary] mt-0.5 truncate">{item.assignee}</p>
        )}
      </div>
      {badge}
      <ChevronRight size={14} className="text-[--color-text-tertiary] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()
  const { currentProject } = useProjectStore()
  const projectId = currentProject?.id ?? null

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId!)
        .order('column_order')
      if (error) throw error
      return data ?? []
    },
  })

  // ── Corrections ─────────────────────────────────────────────────────────────
  const { data: corrections = [], isLoading: correctionsLoading } = useQuery<Correction[]>({
    queryKey: ['corrections', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('corrections')
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  // ── Deliverables ────────────────────────────────────────────────────────────
  const { data: deliverables = [], isLoading: deliverablesLoading } = useQuery<Deliverable[]>({
    queryKey: ['deliverables', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliverables')
        .select('*')
        .eq('project_id', projectId!)
        .order('due_date', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })

  // ── Milestones ─────────────────────────────────────────────────────────────
  const { data: milestones = [], isLoading: milestonesLoading } = useQuery<Milestone[]>({
    queryKey: ['milestones', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId!)
        .neq('status', 'completed')
        .order('due_date', { ascending: true })
        .limit(4)
      if (error) throw error
      return data ?? []
    },
  })

  // ── Calendar Events ────────────────────────────────────────────────────────
  const { data: calendarEvents = [], isLoading: eventsLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['calendar_events', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('project_id', projectId!)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(4)
      if (error) throw error
      return data ?? []
    },
  })

  // ── Feedback Records ───────────────────────────────────────────────────────
  const { data: feedbackRecords = [], isLoading: feedbackLoading } = useQuery<FeedbackRecord[]>({
    queryKey: ['feedback_records', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      let query = supabase
        .from('feedback_records')
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false })
        .limit(1)
      if (currentProject?.current_phase_id) {
        query = supabase
          .from('feedback_records')
          .select('*')
          .eq('project_id', projectId!)
          .eq('phase_id', currentProject.current_phase_id)
          .order('created_at', { ascending: false })
          .limit(1)
      }
      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
  })

  // ── Activity Logs ──────────────────────────────────────────────────────────
  const { data: activityLogs = [], isLoading: activityLoading } = useQuery<ActivityLog[]>({
    queryKey: ['activity_logs', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return data ?? []
    },
  })

  // ── Current Phase ──────────────────────────────────────────────────────────
  const { data: currentPhase } = useQuery<PresentationPhase | null>({
    queryKey: ['current_phase', currentProject?.current_phase_id],
    enabled: !!currentProject?.current_phase_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('presentation_phases')
        .select('*')
        .eq('id', currentProject!.current_phase_id!)
        .single()
      if (error) return null
      return data
    },
  })

  // ── Members (for name resolution) ─────────────────────────────────────────
  const { data: members = [] } = useQuery({
    queryKey: ['project_members', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_members')
        .select('user_id, display_name, role')
        .eq('project_id', projectId!)
      if (error) throw error
      return data ?? []
    },
  })

  // ── Derived data ───────────────────────────────────────────────────────────
  const memberNameMap = React.useMemo(() => {
    const map: Record<string, string> = {}
    for (const m of members) {
      map[m.user_id] = m.display_name ?? 'Unknown'
    }
    return map
  }, [members])

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'done').length
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length
  const overdueTasks = tasks.filter((t) => t.status !== 'done' && isOverdue(t.due_date)).length
  const openCorrections = corrections.filter((c) => c.status === 'open' || c.status === 'reopened').length

  const submissionDaysLeft = daysUntil(currentProject?.submission_deadline ?? null)

  // ── Next Actions ───────────────────────────────────────────────────────────
  const nextActions = React.useMemo((): NextActionItem[] => {
    const items: NextActionItem[] = []
    const now = new Date()
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    // Overdue & due-in-3-days tasks (not done)
    for (const t of tasks) {
      if (t.status === 'done') continue
      const due = t.due_date ? new Date(t.due_date) : null
      if (!due) continue
      const overdue = isOverdue(t.due_date)
      if (overdue || due <= in3Days) {
        items.push({
          kind: 'task',
          id: t.id,
          title: t.title,
          assignee: t.assignee_id ? (memberNameMap[t.assignee_id] ?? null) : null,
          daysLeft: daysUntil(t.due_date),
          overdue,
          href: '/kanban',
        })
      }
    }

    // Pending mandatory deliverables
    for (const d of deliverables) {
      if (!d.is_mandatory) continue
      if (d.status === 'approved') continue
      const overdue = isOverdue(d.due_date)
      const daysLeft = daysUntil(d.due_date)
      if (overdue || (daysLeft !== null && daysLeft <= 3)) {
        items.push({
          kind: 'deliverable',
          id: d.id,
          title: d.name,
          assignee: d.assignee_id ? (memberNameMap[d.assignee_id] ?? null) : null,
          daysLeft,
          overdue,
          href: '/presentations',
        })
      }
    }

    // Open corrections with deadlines
    for (const c of corrections) {
      if (c.status === 'verified') continue
      if (!c.deadline) continue
      const overdue = isOverdue(c.deadline)
      const daysLeft = daysUntil(c.deadline)
      if (overdue || (daysLeft !== null && daysLeft <= 3)) {
        items.push({
          kind: 'correction',
          id: c.id,
          title: `Correction #${c.correction_number}: ${c.description.slice(0, 60)}${c.description.length > 60 ? '…' : ''}`,
          assignee: c.assignee_id ? (memberNameMap[c.assignee_id] ?? null) : null,
          daysLeft,
          overdue,
          href: '/presentations',
        })
      }
    }

    // Sort: overdue first, then by daysLeft ascending
    items.sort((a, b) => {
      if (a.overdue && !b.overdue) return -1
      if (!a.overdue && b.overdue) return 1
      return (a.daysLeft ?? 999) - (b.daysLeft ?? 999)
    })

    return items.slice(0, 5)
  }, [tasks, deliverables, corrections, memberNameMap])

  const latestFeedback = feedbackRecords[0] ?? null
  const latestFeedbackCorrectionCount = latestFeedback
    ? corrections.filter((c) => c.feedback_id === latestFeedback.id).length
    : 0

  const upcomingMilestones = milestones.slice(0, 4)
  const openCorrectionList = corrections
    .filter((c) => c.status === 'open' || c.status === 'reopened')
    .slice(0, 5)

  const isLoading =
    tasksLoading || correctionsLoading || deliverablesLoading ||
    milestonesLoading || eventsLoading || feedbackLoading || activityLoading

  // ── No project selected ────────────────────────────────────────────────────
  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={<FolderOpen size={40} />}
          title="No project selected"
          description="Select an existing project or create a new one to get started."
          action={
            <Button variant="primary" onClick={() => navigate('/projects')}>
              Go to Projects
            </Button>
          }
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  const project = currentProject!

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

      {/* ── Project Header ─────────────────────────────────────────────────── */}
      <Card padding="lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: meta */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-[--color-text-primary] truncate">{project.title}</h1>
              <Badge variant={projectStatusVariant(project.status)}>
                {projectStatusLabel(project.status)}
              </Badge>
              {currentPhase && (
                <Badge
                  className={cn(
                    PHASE_STATUS_CONFIG[currentPhase.status]?.bg,
                    PHASE_STATUS_CONFIG[currentPhase.status]?.color,
                  )}
                >
                  {currentPhase.name}
                </Badge>
              )}
            </div>

            {project.description && (
              <p className="text-sm text-[--color-text-secondary] line-clamp-2 mb-3">{project.description}</p>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[--color-text-tertiary]">
              {project.college && (
                <span className="flex items-center gap-1">
                  <BookOpen size={11} /> {project.college}
                </span>
              )}
              {project.department && <span>{project.department}</span>}
              {project.semester && <span>Sem {project.semester}</span>}
              {project.faculty_guide_name && (
                <span className="flex items-center gap-1">
                  <span className="font-medium text-[--color-text-secondary]">Guide:</span> {project.faculty_guide_name}
                </span>
              )}
            </div>
          </div>

          {/* Right: deadline chip */}
          {project.submission_deadline && (
            <div
              className={cn(
                'flex-shrink-0 flex flex-col items-center justify-center rounded-[--radius-lg] border px-4 py-3 min-w-[110px] text-center',
                submissionDaysLeft !== null && submissionDaysLeft < 0
                  ? 'border-[--color-danger]/40 bg-[--color-danger-light] text-[--color-danger]'
                  : submissionDaysLeft !== null && submissionDaysLeft <= 7
                  ? 'border-[--color-warning]/40 bg-[--color-warning-light] text-[--color-warning]'
                  : 'border-[--color-border] bg-[--color-surface] text-[--color-text-secondary]',
              )}
            >
              <CalendarDays size={16} className="mb-1" />
              <span className="text-2xl font-bold leading-tight">
                {submissionDaysLeft !== null
                  ? submissionDaysLeft < 0
                    ? Math.abs(submissionDaysLeft)
                    : submissionDaysLeft
                  : '—'}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wide">
                {submissionDaysLeft !== null && submissionDaysLeft < 0 ? 'days overdue' : 'days left'}
              </span>
              <span className="text-[10px] text-[--color-text-tertiary] mt-0.5">
                {formatDate(project.submission_deadline, 'MMM d')}
              </span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-[--color-text-secondary]">Overall Progress</span>
            <span className="text-xs font-bold text-[--color-text-primary]">{project.overall_progress}%</span>
          </div>
          <ProgressBar
            value={project.overall_progress}
            size="md"
            variant={
              project.overall_progress >= 80 ? 'success' :
              project.overall_progress >= 40 ? 'default' : 'warning'
            }
          />
        </div>
      </Card>

      {/* ── Stats Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Tasks"
          value={`${completedTasks}/${totalTasks}`}
          sub="completed"
          icon={<CheckCircle2 size={18} />}
          href="/kanban"
        />
        <StatCard
          label="In Progress"
          value={inProgressTasks}
          sub={inProgressTasks === 1 ? 'task active' : 'tasks active'}
          icon={<TrendingUp size={18} />}
          href="/kanban"
        />
        <StatCard
          label="Overdue Tasks"
          value={overdueTasks}
          sub={overdueTasks === 1 ? 'task overdue' : 'tasks overdue'}
          icon={<AlertTriangle size={18} />}
          href="/kanban"
          urgent={overdueTasks > 0}
        />
        <StatCard
          label="Open Corrections"
          value={openCorrections}
          sub={openCorrections === 1 ? 'correction open' : 'corrections open'}
          icon={<MessageSquareWarning size={18} />}
          href="/presentations"
          urgent={openCorrections > 0}
        />
      </div>

      {/* ── Main 2-column content ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

        {/* LEFT column */}
        <div className="space-y-5">

          {/* ── Next Actions ──────────────────────────────────────────────── */}
          <Card padding="md">
            <SectionHeader
              title="Next Actions"
              subtitle="Most urgent items requiring attention"
              className="mb-3"
              action={
                <Flag size={16} className="text-[--color-danger]" />
              }
            />
            <Divider className="mb-3" />
            {nextActions.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 size={28} />}
                title="All caught up!"
                description="No urgent tasks, deliverables, or corrections in the next 3 days."
              />
            ) : (
              <div className="divide-y divide-[--color-border]">
                {nextActions.map((item) => (
                  <NextActionRow key={`${item.kind}-${item.id}`} item={item} />
                ))}
              </div>
            )}
          </Card>

          {/* ── Upcoming Milestones ───────────────────────────────────────── */}
          <Card padding="md">
            <SectionHeader
              title="Upcoming Milestones"
              className="mb-3"
              action={
                <Link to="/kanban" className="text-xs text-[--color-accent] hover:underline">
                  View all
                </Link>
              }
            />
            <Divider className="mb-3" />
            {upcomingMilestones.length === 0 ? (
              <EmptyState
                icon={<CalendarDays size={28} />}
                title="No upcoming milestones"
                description="All milestones are completed or none have been created yet."
              />
            ) : (
              <div className="space-y-0 divide-y divide-[--color-border]">
                {upcomingMilestones.map((m) => {
                  const dl = daysUntil(m.due_date)
                  const late = isOverdue(m.due_date)
                  return (
                    <div key={m.id} className="flex items-center gap-3 py-2.5">
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full flex-shrink-0',
                          m.status === 'delayed' || late ? 'bg-[--color-danger]' :
                          m.status === 'in_progress' ? 'bg-[--color-warning]' :
                          'bg-[--color-border-strong]',
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[--color-text-primary] truncate">{m.title}</p>
                        <p className="text-xs text-[--color-text-tertiary]">{formatDate(m.due_date)}</p>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {late ? (
                          <Badge variant="danger">Overdue</Badge>
                        ) : dl !== null ? (
                          <Badge variant={dl <= 3 ? 'warning' : 'default'}>{dl === 0 ? 'Today' : `${dl}d`}</Badge>
                        ) : null}
                        <Badge
                          variant={
                            m.status === 'completed' ? 'success' :
                            m.status === 'delayed' ? 'danger' :
                            m.status === 'in_progress' ? 'warning' : 'default'
                          }
                        >
                          {m.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

        </div>

        {/* RIGHT column */}
        <div className="space-y-5">

          {/* ── Latest Faculty Feedback ────────────────────────────────────── */}
          <Card padding="md">
            <SectionHeader
              title="Latest Faculty Feedback"
              className="mb-3"
              action={
                <Link to="/presentations" className="text-xs text-[--color-accent] hover:underline">
                  View all
                </Link>
              }
            />
            <Divider className="mb-3" />
            {!latestFeedback ? (
              <EmptyState
                icon={<Inbox size={28} />}
                title="No feedback yet"
                description="Faculty feedback will appear here after a presentation."
              />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Avatar name={latestFeedback.reviewer_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[--color-text-primary] truncate">{latestFeedback.reviewer_name}</p>
                    <p className="text-xs text-[--color-text-tertiary]">{formatRelativeDate(latestFeedback.created_at)}</p>
                  </div>
                  <Badge
                    variant={
                      latestFeedback.final_approval_status === 'approved' ? 'success' :
                      latestFeedback.final_approval_status === 'conditional' ? 'warning' : 'default'
                    }
                  >
                    {latestFeedback.final_approval_status}
                  </Badge>
                </div>

                {latestFeedback.general_feedback && (
                  <p className="text-sm text-[--color-text-secondary] line-clamp-3 bg-[--color-surface] rounded-[--radius-md] p-2.5">
                    {latestFeedback.general_feedback}
                  </p>
                )}

                {latestFeedback.marks_obtained !== null && latestFeedback.max_marks !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[--color-text-tertiary]">Marks:</span>
                    <span className="text-sm font-bold text-[--color-text-primary]">
                      {latestFeedback.marks_obtained}/{latestFeedback.max_marks}
                    </span>
                    <ProgressBar
                      value={latestFeedback.marks_obtained}
                      max={latestFeedback.max_marks}
                      size="sm"
                      className="flex-1"
                      variant={
                        latestFeedback.marks_obtained / latestFeedback.max_marks >= 0.7 ? 'success' :
                        latestFeedback.marks_obtained / latestFeedback.max_marks >= 0.4 ? 'warning' : 'danger'
                      }
                    />
                  </div>
                )}

                {latestFeedbackCorrectionCount > 0 && (
                  <Link
                    to="/presentations"
                    className="flex items-center gap-2 text-xs text-[--color-danger] hover:underline"
                  >
                    <AlertTriangle size={12} />
                    {latestFeedbackCorrectionCount} correction{latestFeedbackCorrectionCount !== 1 ? 's' : ''} assigned
                  </Link>
                )}
              </div>
            )}
          </Card>

          {/* ── Upcoming Events ────────────────────────────────────────────── */}
          <Card padding="md">
            <SectionHeader
              title="Upcoming Events"
              className="mb-3"
              action={
                <Link to="/calendar" className="text-xs text-[--color-accent] hover:underline">
                  View all
                </Link>
              }
            />
            <Divider className="mb-3" />
            {calendarEvents.length === 0 ? (
              <EmptyState
                icon={<CalendarDays size={28} />}
                title="No upcoming events"
                description="Calendar events will appear here."
              />
            ) : (
              <div className="space-y-0 divide-y divide-[--color-border]">
                {calendarEvents.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3 py-2.5">
                    <div className="flex-shrink-0 w-10 h-10 bg-[--color-surface-raised] rounded-[--radius-md] flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold text-[--color-text-tertiary] uppercase leading-none">
                        {formatDate(ev.date, 'MMM')}
                      </span>
                      <span className="text-base font-bold text-[--color-text-primary] leading-none">
                        {formatDate(ev.date, 'd')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[--color-text-primary] truncate">{ev.title}</p>
                      <p className="text-xs text-[--color-text-tertiary]">
                        {ev.time ? ev.time : formatRelativeDate(ev.date)}
                        {ev.location ? ` · ${ev.location}` : ''}
                      </p>
                    </div>
                    <Badge variant={eventTypeVariant(ev.event_type)}>{eventTypeLabel(ev.event_type)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ── Team Activity ──────────────────────────────────────────────── */}
          <Card padding="md">
            <SectionHeader title="Team Activity" className="mb-3" />
            <Divider className="mb-3" />
            {activityLogs.length === 0 ? (
              <EmptyState
                icon={<Activity size={28} />}
                title="No activity yet"
                description="Team actions and changes will appear here."
              />
            ) : (
              <div className="space-y-0 divide-y divide-[--color-border]">
                {activityLogs.map((log) => {
                  const actorName = memberNameMap[log.actor_id] ?? 'Someone'
                  return (
                    <div key={log.id} className="flex items-start gap-2.5 py-2.5">
                      <Avatar name={actorName} size="xs" className="mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[--color-text-primary]">
                          <span className="font-semibold">{actorName}</span>{' '}
                          <span className="text-[--color-text-secondary]">{log.action}</span>
                          {log.entity_title && (
                            <span className="font-medium"> "{log.entity_title}"</span>
                          )}
                        </p>
                        <p className="text-[10px] text-[--color-text-tertiary] mt-0.5">
                          {formatRelativeDate(log.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* ── Pending Corrections ────────────────────────────────────────── */}
          {openCorrectionList.length > 0 && (
            <Card padding="md">
              <SectionHeader
                title="Pending Corrections"
                subtitle={`${openCorrections} open correction${openCorrections !== 1 ? 's' : ''}`}
                className="mb-3"
                action={
                  <Link to="/presentations" className="text-xs text-[--color-accent] hover:underline flex items-center gap-1">
                    View all <ChevronRight size={12} />
                  </Link>
                }
              />
              <Divider className="mb-3" />
              <div className="space-y-0 divide-y divide-[--color-border]">
                {openCorrectionList.map((c) => {
                  const cfg = CORRECTION_STATUS_CONFIG[c.status]
                  const dl = daysUntil(c.deadline)
                  const late = isOverdue(c.deadline)
                  return (
                    <Link
                      key={c.id}
                      to="/presentations"
                      className="flex items-start gap-3 py-2.5 hover:bg-[--color-surface] px-2 -mx-2 rounded-[--radius-md] transition-colors group"
                    >
                      <span
                        className={cn(
                          'mt-1 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold flex-shrink-0',
                          cfg.bg, cfg.color,
                        )}
                      >
                        {c.correction_number}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[--color-text-primary] line-clamp-2 group-hover:text-[--color-accent] transition-colors">
                          {c.description}
                        </p>
                        {c.assignee_id && (
                          <p className="text-[10px] text-[--color-text-tertiary] mt-0.5">
                            {memberNameMap[c.assignee_id] ?? 'Unassigned'}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        <Badge variant={c.status === 'open' || c.status === 'reopened' ? 'danger' : 'warning'}>
                          {cfg.label}
                        </Badge>
                        {c.deadline && (
                          <span className={cn('text-[10px]', late ? 'text-[--color-danger] font-semibold' : 'text-[--color-text-tertiary]')}>
                            {late ? 'Overdue' : dl === 0 ? 'Today' : `${dl}d`}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
