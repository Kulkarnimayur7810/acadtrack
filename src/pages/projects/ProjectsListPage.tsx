import { useNavigate } from 'react-router-dom'
import { Plus, FolderGit2, Calendar, BookOpen } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore, useProjectStore } from '@/lib/store'
import {
  Button,
  Badge,
  ProgressBar,
  EmptyState,
  Spinner,
  Card,
} from '@/components/ui'
import { cn, formatDate, daysUntil, isOverdue } from '@/lib/utils'
import type { Database } from '@/lib/database.types'

type Project = Database['public']['Tables']['projects']['Row']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge variant="success">Active</Badge>
    case 'on_hold':
      return <Badge variant="warning">On Hold</Badge>
    case 'completed':
      return <Badge variant="info">Completed</Badge>
    case 'archived':
      return <Badge variant="default">Archived</Badge>
    default:
      return <Badge variant="default">{status}</Badge>
  }
}

function getCategoryLabel(category: string | null): string {
  const map: Record<string, string> = {
    web_app: 'Web App',
    mobile_app: 'Mobile App',
    ml_ai: 'ML / AI',
    computer_vision: 'Computer Vision',
    iot: 'IoT',
    embedded_systems: 'Embedded Systems',
    data_science: 'Data Science',
    other: 'Other',
  }
  return category ? (map[category] ?? category) : ''
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  onSelect,
}: {
  project: Project
  onSelect: (p: Project) => void
}) {
  const days = daysUntil(project.submission_deadline)
  const overdue = isOverdue(project.submission_deadline)
  const progress = project.overall_progress ?? 0

  return (
    <Card
      className="flex flex-col gap-3 h-full hover:shadow-sm hover:border-[#D1D5DB] transition-all group bg-white border-[#E5E7EB] cursor-pointer"
      onClick={() => onSelect(project)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center flex-shrink-0 group-hover:bg-[#E0E7FF] transition-colors">
            <FolderGit2 className="w-4 h-4 text-[#4338CA]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#202124] truncate group-hover:text-[#4338CA] transition-colors">
              {project.title}
            </h3>
            {project.college && (
              <p className="text-xs text-[#6B7280] truncate">{project.college}</p>
            )}
          </div>
        </div>
        {getStatusBadge(project.status)}
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-sm text-[#4B5563] line-clamp-2 leading-relaxed">
          {project.description}
        </p>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {project.semester && (
          <span className="flex items-center gap-1 text-xs text-[#6B7280]">
            <BookOpen className="w-3.5 h-3.5 text-[#9CA3AF]" />
            {project.semester}
          </span>
        )}
        {project.category && (
          <span className="text-xs text-[#6B7280]">
            {getCategoryLabel(project.category)}
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#6B7280]">Progress</span>
          <span className="text-xs font-semibold text-[#202124]">{progress}%</span>
        </div>
        <ProgressBar
          value={progress}
          variant={progress === 100 ? 'success' : progress > 60 ? 'default' : progress > 30 ? 'warning' : 'default'}
        />
      </div>

      {/* Footer – deadline */}
      {project.submission_deadline && (
        <div
          className={cn(
            'flex items-center gap-1.5 text-xs mt-auto pt-2.5 border-t border-[#E5E7EB]',
            overdue
              ? 'text-red-600 font-medium'
              : days !== null && days <= 14
              ? 'text-amber-600 font-medium'
              : 'text-[#6B7280]'
          )}
        >
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          {overdue ? (
            <span>Overdue — {formatDate(project.submission_deadline)}</span>
          ) : days === 0 ? (
            <span>Due today</span>
          ) : days !== null && days > 0 ? (
            <span>
              Due {formatDate(project.submission_deadline)}{' '}
              <span className="text-[#9CA3AF]">({days}d left)</span>
            </span>
          ) : (
            <span>Due {formatDate(project.submission_deadline)}</span>
          )}
        </div>
      )}
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectsListPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { setCurrentProject, setProjects } = useProjectStore()

  const {
    data: projects,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!user) return []

      // Fetch project IDs where user is a member
      const { data: memberRows, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id)

      if (memberError) throw memberError
      if (!memberRows || memberRows.length === 0) return []

      const ids = memberRows.map((r) => r.project_id)

      const { data: projectRows, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .in('id', ids)
        .order('created_at', { ascending: false })

      if (projectError) throw projectError

      return projectRows as Project[]
    },
    enabled: !!user,
  })

  // Sync to store whenever projects list loads
  if (projects) {
    setProjects(projects)
  }

  function handleSelectProject(project: Project) {
    setCurrentProject(project)
    navigate('/dashboard')
  }

  function handleNewProject() {
    navigate('/projects/new')
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Page Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-[#202124]">Projects</h1>
            <p className="text-xs text-[#6B7280] mt-0.5">
              {isLoading
                ? 'Loading…'
                : projects && projects.length > 0
                ? `${projects.length} project${projects.length === 1 ? '' : 's'}`
                : 'No projects yet'}
            </p>
          </div>
          <Button variant="primary" onClick={handleNewProject}>
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Spinner size="lg" />
              <p className="text-sm text-[--color-text-tertiary]">Loading your projects…</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex items-center justify-center py-24">
            <div className="max-w-sm text-center">
              <p className="text-sm font-medium text-[--color-danger] mb-1">Failed to load projects</p>
              <p className="text-xs text-[--color-text-tertiary]">
                {error instanceof Error ? error.message : 'An unexpected error occurred.'}
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && projects && projects.length === 0 && (
          <div className="py-16">
            <EmptyState
              icon={<FolderGit2 className="w-12 h-12" />}
              title="No projects yet"
              description="Create your first project to start tracking phases, tasks, and deliverables for your college submission."
              action={
                <Button variant="primary" onClick={handleNewProject}>
                  <Plus className="w-4 h-4" />
                  Create your first project
                </Button>
              }
            />
          </div>
        )}

        {/* Projects grid */}
        {!isLoading && !error && projects && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onSelect={handleSelectProject}
              />
            ))}

            {/* Inline "add" card */}
            <button
              type="button"
              onClick={handleNewProject}
              className={cn(
                'flex flex-col items-center justify-center gap-2 h-full min-h-[180px] p-6',
                'border-2 border-dashed border-[#D1D5DB] rounded-lg bg-white/50',
                'text-[#6B7280] hover:border-[#4338CA] hover:text-[#4338CA] hover:bg-[#EEF2FF]/30',
                'transition-all cursor-pointer'
              )}
            >
              <div className="w-9 h-9 rounded-full bg-[#F1F1EE] flex items-center justify-center">
                <Plus className="w-4 h-4 text-[#6B7280]" />
              </div>
              <span className="text-sm font-medium">New Project</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
