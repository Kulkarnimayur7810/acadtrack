import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Shield,
  Activity,
  Plus,
  Mail,
  UserCheck,
  Briefcase,
  ChevronRight,
  TrendingUp,
  Info
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProjectStore, useAuthStore } from '@/lib/store'
import {
  Button,
  Input,
  Select,
  Badge,
  Avatar,
  Card,
  Modal,
  EmptyState,
  Spinner,
  ProgressBar
} from '@/components/ui'
import { cn, formatDate, isOverdue, formatRelativeDate } from '@/lib/utils'
import type { Database } from '@/lib/database.types'

type Member = Database['public']['Tables']['project_members']['Row'] & {
  profile?: Database['public']['Tables']['profiles']['Row']
}
type Task = Database['public']['Tables']['tasks']['Row']
type Deliverable = Database['public']['Tables']['deliverables']['Row']
type Correction = Database['public']['Tables']['corrections']['Row']
type ActivityLog = Database['public']['Tables']['activity_logs']['Row']

const ROLE_LABELS: Record<Member['role'], { label: string; badge: 'info' | 'purple' | 'success' | 'warning' | 'default' }> = {
  owner: { label: 'Project Owner', badge: 'purple' },
  leader: { label: 'Team Leader', badge: 'info' },
  member: { label: 'Team Member', badge: 'default' },
  faculty: { label: 'Faculty Guide', badge: 'success' },
  reviewer: { label: 'Reviewer', badge: 'warning' },
}

export default function TeamPage() {
  const { currentProject } = useProjectStore()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<Member['role']>('member')

  // Fetch project members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['project_members', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return []
      const { data, error } = await supabase
        .from('project_members')
        .select('*, profile:profiles(*)')
        .eq('project_id', currentProject.id)
        .order('joined_at', { ascending: true })
      if (error) throw error
      return data as Member[]
    },
    enabled: !!currentProject?.id,
  })

  // Fetch all tasks for stats
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return []
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', currentProject.id)
      if (error) throw error
      return data as Task[]
    },
    enabled: !!currentProject?.id,
  })

  // Fetch deliverables for stats
  const { data: deliverables = [] } = useQuery({
    queryKey: ['deliverables_all', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return []
      const { data, error } = await supabase
        .from('deliverables')
        .select('*')
        .eq('project_id', currentProject.id)
      if (error) throw error
      return data as Deliverable[]
    },
    enabled: !!currentProject?.id,
  })

  // Fetch corrections for stats
  const { data: corrections = [] } = useQuery({
    queryKey: ['corrections_all', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return []
      const { data, error } = await supabase
        .from('corrections')
        .select('*')
        .eq('project_id', currentProject.id)
      if (error) throw error
      return data as Correction[]
    },
    enabled: !!currentProject?.id,
  })

  // Fetch activity logs
  const { data: activityLogs = [] } = useQuery({
    queryKey: ['activity_logs', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return []
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data as ActivityLog[]
    },
    enabled: !!currentProject?.id,
  })

  // Current user's role in this project
  const currentUserRole = useMemo(() => {
    const mem = members.find((m) => m.user_id === user?.id)
    return mem?.role || null
  }, [members, user])

  const canManageRoles = currentUserRole === 'owner' || currentUserRole === 'leader'

  // Update member role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: Member['role'] }) => {
      const { error } = await supabase
        .from('project_members')
        .update({ role })
        .eq('id', memberId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_members', currentProject?.id] })
    },
  })

  // Add member mutation (creates project_member record)
  const addMemberMutation = useMutation({
    mutationFn: async () => {
      if (!currentProject?.id) throw new Error('No project')
      // Try to find if user profile exists with this email, or generate placeholder id
      const dummyUserId = crypto.randomUUID()
      const { error } = await supabase.from('project_members').insert({
        project_id: currentProject.id,
        user_id: dummyUserId,
        display_name: newMemberName.trim() || newMemberEmail.trim(),
        role: newMemberRole,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_members', currentProject?.id] })
      setIsAddModalOpen(false)
      setNewMemberEmail('')
      setNewMemberName('')
      setNewMemberRole('member')
    },
  })

  // Calculate statistics per member
  const memberStats = useMemo(() => {
    const stats = new Map<
      string,
      {
        assignedTasks: Task[]
        completedTasks: number
        inProgressTasks: number
        overdueTasks: number
        totalHoursEstimated: number
        totalHoursActual: number
        deliverablesCount: number
        openCorrectionsCount: number
        completionRate: number
        workloadLevel: 'underutilized' | 'balanced' | 'heavy'
      }
    >()

    members.forEach((m) => {
      const memberTasks = tasks.filter((t) => t.assignee_id === m.user_id)
      const completed = memberTasks.filter((t) => t.status === 'done').length
      const inProgress = memberTasks.filter((t) => t.status === 'in_progress').length
      const overdue = memberTasks.filter((t) => isOverdue(t.due_date) && t.status !== 'done').length
      const memberDeliverables = deliverables.filter((d) => d.assignee_id === m.user_id).length
      const memberCorrections = corrections.filter(
        (c) => c.assignee_id === m.user_id && (c.status === 'open' || c.status === 'reopened')
      ).length

      const estHours = memberTasks.reduce((acc, t) => acc + (t.estimated_hours || 0), 0)
      const actHours = memberTasks.reduce((acc, t) => acc + (t.actual_hours || 0), 0)

      const completionRate =
        memberTasks.length > 0 ? Math.round((completed / memberTasks.length) * 100) : 0

      let workloadLevel: 'underutilized' | 'balanced' | 'heavy' = 'balanced'
      if (memberTasks.length === 0) {
        workloadLevel = 'underutilized'
      } else if (inProgress > 4 || overdue > 2) {
        workloadLevel = 'heavy'
      }

      stats.set(m.user_id, {
        assignedTasks: memberTasks,
        completedTasks: completed,
        inProgressTasks: inProgress,
        overdueTasks: overdue,
        totalHoursEstimated: estHours,
        totalHoursActual: actHours,
        deliverablesCount: memberDeliverables,
        openCorrectionsCount: memberCorrections,
        completionRate,
        workloadLevel,
      })
    })

    return stats
  }, [members, tasks, deliverables, corrections])

  if (!currentProject) {
    return (
      <div className="p-8">
        <EmptyState
          title="No Project Selected"
          description="Select a project to review team members, workload distribution, and responsibilities."
        />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[--color-text-primary] flex items-center gap-2">
            <Users className="w-5 h-5 text-[--color-accent]" />
            Team Contribution & Responsibilities
          </h1>
          <p className="text-sm text-[--color-text-secondary] mt-0.5">
            Monitor workload balance, assigned deliverables, and track member progress
          </p>
        </div>

        {canManageRoles && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Team Member
          </Button>
        )}
      </div>

      {/* Guidance Note */}
      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-[--radius-md] p-3 text-xs text-blue-800">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
        <p className="leading-relaxed">
          <strong>Note for Faculty & Students:</strong> Task and deliverable counts are workload and
          activity indicators to help balance project distribution. They are not intended as
          automated or definitive academic grading scores.
        </p>
      </div>

      {membersLoading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          title="No Team Members"
          description="Add students and faculty guides to this project workspace."
          action={
            <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
              Add First Member
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {members.map((member) => {
            const stat = memberStats.get(member.user_id)
            const displayName = member.profile?.full_name || member.display_name || 'Team Member'
            const roleCfg = ROLE_LABELS[member.role] || ROLE_LABELS.member

            return (
              <div
                key={member.id}
                className="bg-white border border-[--color-border] rounded-[--radius-xl] p-5 shadow-xs flex flex-col justify-between hover:border-[--color-border-strong] transition-all"
              >
                <div>
                  {/* Top info row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={displayName} size="md" />
                      <div>
                        <h2 className="text-sm font-bold text-[--color-text-primary]">
                          {displayName}
                        </h2>
                        <div className="flex items-center gap-2 mt-0.5">
                          {canManageRoles && member.role !== 'owner' ? (
                            <select
                              value={member.role}
                              onChange={(e) =>
                                updateRoleMutation.mutate({
                                  memberId: member.id,
                                  role: e.target.value as Member['role'],
                                })
                              }
                              className="text-xs border border-[--color-border] rounded px-1.5 py-0.5 bg-white font-medium text-[--color-text-secondary]"
                              aria-label={`Change role for ${displayName}`}
                            >
                              <option value="leader">Team Leader</option>
                              <option value="member">Team Member</option>
                              <option value="faculty">Faculty Guide</option>
                              <option value="reviewer">Reviewer</option>
                            </select>
                          ) : (
                            <Badge variant={roleCfg.badge} size="sm">
                              {roleCfg.label}
                            </Badge>
                          )}

                          {stat && stat.workloadLevel === 'heavy' && (
                            <span className="text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded">
                              High Workload
                            </span>
                          )}
                          {stat && stat.workloadLevel === 'underutilized' && (
                            <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                              Underutilized
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setSelectedMember(member)}
                      className="text-[--color-accent] text-xs font-medium"
                    >
                      View Tasks <ChevronRight className="w-3 h-3 ml-0.5" />
                    </Button>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-[--color-border] text-center">
                    <div className="bg-[--color-surface] p-2 rounded-[--radius-md]">
                      <div className="text-base font-bold text-[--color-text-primary]">
                        {stat?.assignedTasks.length || 0}
                      </div>
                      <div className="text-[10px] text-[--color-text-tertiary] uppercase font-semibold">
                        Assigned
                      </div>
                    </div>

                    <div className="bg-[--color-surface] p-2 rounded-[--radius-md]">
                      <div className="text-base font-bold text-[--color-success]">
                        {stat?.completedTasks || 0}
                      </div>
                      <div className="text-[10px] text-[--color-text-tertiary] uppercase font-semibold">
                        Done
                      </div>
                    </div>

                    <div className="bg-[--color-surface] p-2 rounded-[--radius-md]">
                      <div className="text-base font-bold text-[--color-warning]">
                        {stat?.inProgressTasks || 0}
                      </div>
                      <div className="text-[10px] text-[--color-text-tertiary] uppercase font-semibold">
                        In Progress
                      </div>
                    </div>

                    <div className="bg-[--color-surface] p-2 rounded-[--radius-md]">
                      <div
                        className={cn(
                          'text-base font-bold',
                          (stat?.overdueTasks || 0) > 0
                            ? 'text-[--color-danger]'
                            : 'text-[--color-text-secondary]'
                        )}
                      >
                        {stat?.overdueTasks || 0}
                      </div>
                      <div className="text-[10px] text-[--color-text-tertiary] uppercase font-semibold">
                        Overdue
                      </div>
                    </div>
                  </div>

                  {/* Deliverables & Corrections Row */}
                  <div className="flex items-center justify-between text-xs text-[--color-text-secondary] mt-3 px-1">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[--color-text-tertiary]" />
                      <strong>{stat?.deliverablesCount || 0}</strong> deliverables assigned
                    </span>
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-[--color-text-tertiary]" />
                      <strong>{stat?.openCorrectionsCount || 0}</strong> open corrections
                    </span>
                  </div>

                  {/* Task Completion Progress */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-[--color-text-tertiary] mb-1">
                      <span>Task Completion Rate</span>
                      <span className="font-semibold text-[--color-text-primary]">
                        {stat?.completionRate || 0}%
                      </span>
                    </div>
                    <ProgressBar
                      value={stat?.completionRate || 0}
                      size="sm"
                      variant={(stat?.completionRate || 0) >= 80 ? 'success' : 'default'}
                    />
                  </div>
                </div>

                {/* Hours tracking if logged */}
                {stat && (stat.totalHoursEstimated > 0 || stat.totalHoursActual > 0) && (
                  <div className="mt-4 pt-3 border-t border-[--color-border] text-xs text-[--color-text-tertiary] flex items-center justify-between">
                    <span>
                      Effort: <strong>{stat.totalHoursActual}h</strong> logged
                    </span>
                    <span>Est: {stat.totalHoursEstimated}h</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Member Tasks Inspector Modal */}
      {selectedMember && (
        <Modal
          open={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          title={`Assigned Tasks — ${
            selectedMember.profile?.full_name || selectedMember.display_name || 'Member'
          }`}
          size="lg"
          footer={
            <Button variant="secondary" size="sm" onClick={() => setSelectedMember(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4">
            {(() => {
              const assigned = tasks.filter((t) => t.assignee_id === selectedMember.user_id)
              if (assigned.length === 0) {
                return (
                  <p className="text-sm text-[--color-text-tertiary] text-center py-6">
                    No tasks assigned to this team member yet.
                  </p>
                )
              }
              return (
                <div className="divide-y divide-[--color-border]">
                  {assigned.map((t) => (
                    <div key={t.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-[--color-text-primary] truncate">
                          {t.title}
                        </div>
                        <div className="text-xs text-[--color-text-tertiary] flex items-center gap-2 mt-0.5">
                          <span className="capitalize">{t.priority} priority</span>
                          {t.due_date && (
                            <span
                              className={cn(
                                isOverdue(t.due_date) && t.status !== 'done'
                                  ? 'text-[--color-danger] font-medium'
                                  : ''
                              )}
                            >
                              · Due {formatDate(t.due_date)}
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded capitalize flex-shrink-0',
                          t.status === 'done'
                            ? 'bg-green-50 text-green-700'
                            : t.status === 'in_progress'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </Modal>
      )}

      {/* Add Member Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Project Member"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={addMemberMutation.isPending}
              onClick={() => {
                if (!newMemberName.trim() && !newMemberEmail.trim()) {
                  alert('Please enter a member name or email.')
                  return
                }
                addMemberMutation.mutate()
              }}
            >
              Add Member
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="e.g. Rahul Sharma"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            required
          />

          <Input
            label="College Email"
            type="email"
            placeholder="student@university.edu"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
          />

          <Select
            label="Project Role"
            options={[
              { value: 'leader', label: 'Team Leader' },
              { value: 'member', label: 'Team Member' },
              { value: 'faculty', label: 'Faculty Guide' },
              { value: 'reviewer', label: 'External Reviewer' },
            ]}
            value={newMemberRole}
            onChange={(e) => setNewMemberRole(e.target.value as Member['role'])}
          />
        </div>
      </Modal>
    </div>
  )
}
