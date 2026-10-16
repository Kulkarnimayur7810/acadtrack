import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Target,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  Scale,
  Check,
  ChevronRight,
  TrendingUp,
  Sliders
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProjectStore, useAuthStore, toast } from '@/lib/store'
import {
  Button,
  Input,
  Textarea,
  Select,
  Badge,
  Avatar,
  Card,
  Modal,
  EmptyState,
  Spinner,
  ProgressBar
} from '@/components/ui'
import { cn, formatDate, isOverdue } from '@/lib/utils'
import type { Database } from '@/lib/database.types'

type Milestone = Database['public']['Tables']['milestones']['Row']
type Phase = Database['public']['Tables']['presentation_phases']['Row']
type Member = Database['public']['Tables']['project_members']['Row'] & {
  profile?: Database['public']['Tables']['profiles']['Row']
}

export default function MilestonesPage() {
  const { currentProject } = useProjectStore()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [milestoneForm, setMilestoneForm] = useState<Partial<Milestone>>({
    weight: 10,
    status: 'not_started',
  })

  // Queries
  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['milestones', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return []
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('due_date', { ascending: true })
      if (error) throw error
      return data as Milestone[]
    },
    enabled: !!currentProject?.id,
  })

  const { data: phases = [] } = useQuery({
    queryKey: ['presentation_phases', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return []
      const { data, error } = await supabase
        .from('presentation_phases')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('phase_number', { ascending: true })
      if (error) throw error
      return data as Phase[]
    },
    enabled: !!currentProject?.id,
  })

  const { data: members = [] } = useQuery({
    queryKey: ['project_members', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return []
      const { data, error } = await supabase
        .from('project_members')
        .select('*, profile:profiles(*)')
        .eq('project_id', currentProject.id)
      if (error) throw error
      return data as Member[]
    },
    enabled: !!currentProject?.id,
  })

  // Mutations
  const createMilestoneMutation = useMutation({
    mutationFn: async (form: Partial<Milestone>) => {
      if (!currentProject?.id) throw new Error('No project')
      const { error } = await supabase.from('milestones').insert({
        project_id: currentProject.id,
        title: form.title || 'Untitled Milestone',
        description: form.description || null,
        owner_id: form.owner_id || null,
        due_date: form.due_date || null,
        status: form.status || 'not_started',
        weight: form.weight || 10,
        phase_id: form.phase_id || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', currentProject?.id] })
      setIsAddModalOpen(false)
      setTitleError(null)
      setMilestoneForm({ weight: 10, status: 'not_started' })
      toast('Milestone created successfully', 'success')
    },
    onError: (err: any) => {
      toast(err?.message || 'Failed to create milestone', 'error')
    },
  })

  const updateMilestoneMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Milestone> }) => {
      const { error } = await supabase
        .from('milestones')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', currentProject?.id] })
      setEditingMilestone(null)
      setTitleError(null)
      toast('Milestone updated successfully', 'success')
    },
    onError: (err: any) => {
      toast(err?.message || 'Failed to update milestone', 'error')
    },
  })

  const deleteMilestoneMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('milestones').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', currentProject?.id] })
      setEditingMilestone(null)
      toast('Milestone deleted', 'info')
    },
    onError: (err: any) => {
      toast(err?.message || 'Failed to delete milestone', 'error')
    },
  })

  // Transparent weighted progress calculation
  const { totalWeight, completedWeight, weightedPercentage } = useMemo(() => {
    if (milestones.length === 0) return { totalWeight: 0, completedWeight: 0, weightedPercentage: 0 }
    const total = milestones.reduce((sum, m) => sum + (m.weight || 1), 0)
    const completed = milestones
      .filter((m) => m.status === 'completed')
      .reduce((sum, m) => sum + (m.weight || 1), 0)
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    return { totalWeight: total, completedWeight: completed, weightedPercentage: pct }
  }, [milestones])

  if (!currentProject) {
    return (
      <div className="p-8">
        <EmptyState
          title="No Project Selected"
          description="Select or create a project to configure academic milestones."
        />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[--color-text-primary] flex items-center gap-2">
            <Target className="w-5 h-5 text-[--color-accent]" />
            Project Milestones & Weighted Progress
          </h1>
          <p className="text-sm text-[--color-text-secondary] mt-0.5">
            Configure key academic deliverables and compute transparent project completion
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setMilestoneForm({ weight: 10, status: 'not_started' })
            setIsAddModalOpen(true)
          }}
          className="flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Milestone
        </Button>
      </div>

      {/* Weighted Progress Card */}
      <div className="bg-white border border-[--color-border] rounded-[--radius-xl] p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-[--color-text-primary] flex items-center gap-2">
              <Scale className="w-4 h-4 text-[--color-accent]" />
              Overall Weighted Milestone Progress
            </div>
            <p className="text-xs text-[--color-text-tertiary] mt-0.5">
              Calculated using explicit milestone weight points ({completedWeight} of {totalWeight}{' '}
              pts completed)
            </p>
          </div>
          <div className="text-2xl font-bold text-[--color-text-primary]">
            {weightedPercentage}%
          </div>
        </div>

        <ProgressBar
          value={weightedPercentage}
          size="md"
          variant={weightedPercentage === 100 ? 'success' : 'default'}
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs text-[--color-text-secondary]">
          <div>
            Total Milestones:{' '}
            <strong className="text-[--color-text-primary]">{milestones.length}</strong>
          </div>
          <div>
            Completed:{' '}
            <strong className="text-[--color-success]">
              {milestones.filter((m) => m.status === 'completed').length}
            </strong>
          </div>
          <div>
            In Progress:{' '}
            <strong className="text-[--color-warning]">
              {milestones.filter((m) => m.status === 'in_progress').length}
            </strong>
          </div>
          <div>
            Delayed:{' '}
            <strong className="text-[--color-danger]">
              {
                milestones.filter(
                  (m) =>
                    m.status !== 'completed' &&
                    (m.status === 'delayed' || isOverdue(m.due_date))
                ).length
              }
            </strong>
          </div>
        </div>
      </div>

      {/* Milestone List */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : milestones.length === 0 ? (
        <EmptyState
          title="No Milestones Configured"
          description="Establish the key checkpoints for your semester project, from Problem Statement Approval to Final Viva."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              Add First Milestone
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {milestones.map((m) => {
            const isDelayed =
              m.status !== 'completed' &&
              (m.status === 'delayed' || isOverdue(m.due_date))
            const owner = members.find((mem) => mem.user_id === m.owner_id)
            const ownerName = owner?.profile?.full_name || owner?.display_name || 'Unassigned'
            const phase = phases.find((p) => p.id === m.phase_id)

            return (
              <div
                key={m.id}
                className={cn(
                  'bg-white border rounded-[--radius-lg] p-4 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                  m.status === 'completed'
                    ? 'border-[--color-border] bg-white opacity-80'
                    : isDelayed
                    ? 'border-red-300 border-l-4 border-l-red-500'
                    : 'border-[--color-border] hover:border-[--color-border-strong]'
                )}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        'text-sm font-bold',
                        m.status === 'completed'
                          ? 'line-through text-[--color-text-tertiary]'
                          : 'text-[--color-text-primary]'
                      )}
                    >
                      {m.title}
                    </span>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[--color-surface] border border-[--color-border] text-[--color-text-secondary]">
                      Weight: {m.weight} pts
                    </span>

                    {phase && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        Phase {phase.phase_number}
                      </span>
                    )}

                    {isDelayed && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Delayed
                      </span>
                    )}
                  </div>

                  {m.description && (
                    <p className="text-xs text-[--color-text-secondary] line-clamp-2">
                      {m.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-[--color-text-tertiary] flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Owner: <strong>{ownerName}</strong>
                    </span>
                    {m.due_date && (
                      <span
                        className={cn(
                          'flex items-center gap-1',
                          isDelayed ? 'text-[--color-danger] font-semibold' : ''
                        )}
                      >
                        <Calendar className="w-3.5 h-3.5" /> Target: {formatDate(m.due_date)}
                      </span>
                    )}
                    {m.actual_date && (
                      <span className="flex items-center gap-1 text-[--color-success]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed on{' '}
                        {formatDate(m.actual_date)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions & Status Dropdown */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <select
                    value={m.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as Milestone['status']
                      updateMilestoneMutation.mutate({
                        id: m.id,
                        updates: {
                          status: newStatus,
                          actual_date:
                            newStatus === 'completed'
                              ? new Date().toISOString().split('T')[0]
                              : null,
                        },
                      })
                    }}
                    className="text-xs border border-[--color-border] rounded px-2.5 py-1.5 bg-white font-medium text-[--color-text-primary]"
                    aria-label="Update milestone status"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="delayed">Delayed</option>
                  </select>

                  {m.status !== 'completed' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        updateMilestoneMutation.mutate({
                          id: m.id,
                          updates: {
                            status: 'completed',
                            actual_date: new Date().toISOString().split('T')[0],
                          },
                        })
                      }
                      className="flex items-center gap-1 text-xs"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark Done
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() =>
                        updateMilestoneMutation.mutate({
                          id: m.id,
                          updates: { status: 'in_progress', actual_date: null },
                        })
                      }
                      className="text-xs text-[--color-text-tertiary]"
                    >
                      Reopen
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setEditingMilestone(m)
                      setMilestoneForm(m)
                    }}
                    className="text-[--color-text-tertiary] hover:text-[--color-text-primary]"
                  >
                    Edit
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Milestone Modal */}
      <Modal
        open={isAddModalOpen || !!editingMilestone}
        onClose={() => {
          setTitleError(null)
          setIsAddModalOpen(false)
          setEditingMilestone(null)
        }}
        title={editingMilestone ? 'Edit Milestone' : 'Add Project Milestone'}
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            {editingMilestone ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => deleteMilestoneMutation.mutate(editingMilestone.id)}
              >
                Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setTitleError(null)
                  setIsAddModalOpen(false)
                  setEditingMilestone(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={
                  createMilestoneMutation.isPending || updateMilestoneMutation.isPending
                }
                onClick={() => {
                  if (!milestoneForm.title?.trim()) {
                    setTitleError('Milestone title is required.')
                    return
                  }
                  setTitleError(null)
                  if (editingMilestone) {
                    updateMilestoneMutation.mutate({
                      id: editingMilestone.id,
                      updates: milestoneForm,
                    })
                  } else {
                    createMilestoneMutation.mutate(milestoneForm)
                  }
                }}
              >
                {editingMilestone ? 'Save Changes' : 'Create Milestone'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Milestone Title *"
            placeholder="e.g. System Architecture & UML Finalised"
            value={milestoneForm.title || ''}
            error={titleError || undefined}
            onChange={(e) => {
              setTitleError(null)
              setMilestoneForm((f) => ({ ...f, title: e.target.value }))
            }}
            required
          />

          <Textarea
            label="Description & Acceptance Criteria"
            placeholder="Criteria needed to consider this milestone complete..."
            value={milestoneForm.description || ''}
            onChange={(e) => setMilestoneForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Assigned Lead / Owner"
              placeholder="Select team member"
              options={members.map((m) => ({
                value: m.user_id,
                label: m.profile?.full_name || m.display_name || 'Member',
              }))}
              value={milestoneForm.owner_id || ''}
              onChange={(e) =>
                setMilestoneForm((f) => ({ ...f, owner_id: e.target.value || null }))
              }
            />

            <Select
              label="Related Presentation Phase"
              placeholder="Independent"
              options={phases.map((p) => ({
                value: p.id,
                label: `Phase ${p.phase_number}: ${p.name}`,
              }))}
              value={milestoneForm.phase_id || ''}
              onChange={(e) =>
                setMilestoneForm((f) => ({ ...f, phase_id: e.target.value || null }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Target Due Date"
              type="date"
              value={milestoneForm.due_date || ''}
              onChange={(e) =>
                setMilestoneForm((f) => ({ ...f, due_date: e.target.value || null }))
              }
            />

            <Input
              label="Weight Points (1 - 50)"
              type="number"
              min="1"
              max="50"
              value={milestoneForm.weight || 10}
              onChange={(e) =>
                setMilestoneForm((f) => ({
                  ...f,
                  weight: Number(e.target.value) || 1,
                }))
              }
              hint="Higher weight = greater contribution to overall progress %"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
