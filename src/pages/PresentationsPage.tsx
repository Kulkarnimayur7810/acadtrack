import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useProjectStore, useAuthStore, toast } from '@/lib/store'
import {
  Button, Badge, Card, Modal, Input, Textarea, Select,
  Spinner, EmptyState, ProgressBar, Avatar, Tabs, SectionHeader, Checkbox
} from '@/components/ui'
import {
  cn, formatDate, daysUntil, isOverdue,
  PHASE_STATUS_CONFIG, DELIVERABLE_STATUS_CONFIG, CORRECTION_STATUS_CONFIG
} from '@/lib/utils'
import {
  Plus, ChevronDown, ChevronUp, CheckCircle2, Circle, AlertCircle,
  Clock, Calendar, User, FileText, Star, Pencil, Trash2, X,
  Check, Link, MessageSquare, Flag, MoreHorizontal, RotateCcw, Shield
} from 'lucide-react'
import type { Database } from '@/lib/database.types'

type Phase = Database['public']['Tables']['presentation_phases']['Row']
type Deliverable = Database['public']['Tables']['deliverables']['Row']
type Feedback = Database['public']['Tables']['feedback_records']['Row']
type Correction = Database['public']['Tables']['corrections']['Row']
type Member = Database['public']['Tables']['project_members']['Row'] & { profile?: Database['public']['Tables']['profiles']['Row'] }

// ─── Data hooks ────────────────────────────────────────────────────────────────

function usePhases(projectId: string | undefined) {
  return useQuery({
    queryKey: ['phases', projectId],
    queryFn: async () => {
      if (!projectId) return []
      const { data, error } = await supabase
        .from('presentation_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('phase_number', { ascending: true })
      if (error) throw error
      return data as Phase[]
    },
    enabled: !!projectId,
  })
}

function useDeliverables(phaseId: string | undefined) {
  return useQuery({
    queryKey: ['deliverables', phaseId],
    queryFn: async () => {
      if (!phaseId) return []
      const { data, error } = await supabase
        .from('deliverables')
        .select('*')
        .eq('phase_id', phaseId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Deliverable[]
    },
    enabled: !!phaseId,
  })
}

function useFeedback(phaseId: string | undefined) {
  return useQuery({
    queryKey: ['feedback', phaseId],
    queryFn: async () => {
      if (!phaseId) return []
      const { data, error } = await supabase
        .from('feedback_records')
        .select('*')
        .eq('phase_id', phaseId)
        .order('created_at', { descending: true } as any)
      if (error) throw error
      return data as Feedback[]
    },
    enabled: !!phaseId,
  })
}

function useCorrections(phaseId: string | undefined) {
  return useQuery({
    queryKey: ['corrections', phaseId],
    queryFn: async () => {
      if (!phaseId) return []
      const { data, error } = await supabase
        .from('corrections')
        .select('*')
        .eq('phase_id', phaseId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Correction[]
    },
    enabled: !!phaseId,
  })
}

function useMembers(projectId: string | undefined) {
  return useQuery({
    queryKey: ['members', projectId],
    queryFn: async () => {
      if (!projectId) return []
      const { data, error } = await supabase
        .from('project_members')
        .select('*, profile:profiles(*)')
        .eq('project_id', projectId)
      if (error) throw error
      return data as Member[]
    },
    enabled: !!projectId,
  })
}

// ─── Phase Status Badge ────────────────────────────────────────────────────────

function PhaseStatusBadge({ status }: { status: Phase['status'] }) {
  const config = PHASE_STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', config.color, config.bg)}>
      {config.label}
    </span>
  )
}

// ─── Deliverable Item ─────────────────────────────────────────────────────────

function DeliverableItem({ deliverable, members, onUpdate, onDelete }: {
  deliverable: Deliverable
  members: Member[]
  onUpdate: (id: string, updates: Partial<Deliverable>) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const config = DELIVERABLE_STATUS_CONFIG[deliverable.status]
  const assignee = members.find(m => m.user_id === deliverable.assignee_id)
  const overdue = isOverdue(deliverable.due_date) && deliverable.status !== 'approved'

  const statusOptions: { value: Deliverable['status']; label: string }[] = [
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'submitted_for_review', label: 'Submitted for Review' },
    { value: 'changes_requested', label: 'Changes Requested' },
    { value: 'approved', label: 'Approved' },
  ]

  return (
    <div className={cn(
      'border rounded-[--radius-md] overflow-hidden transition-colors',
      deliverable.is_mandatory ? 'border-[--color-border]' : 'border-[--color-border] border-dashed',
      overdue && 'border-l-2 border-l-[--color-danger]'
    )}>
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[--color-surface] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Status icon */}
        <div className="flex-shrink-0">
          {deliverable.status === 'approved' ? (
            <CheckCircle2 size={16} className="text-[--color-success]" />
          ) : (
            <Circle size={16} className="text-[--color-text-tertiary]" />
          )}
        </div>

        {/* Name + mandatory */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-medium', deliverable.status === 'approved' && 'line-through text-[--color-text-tertiary]')}>
              {deliverable.name}
            </span>
            {deliverable.is_mandatory && (
              <span className="text-[10px] px-1 py-0.5 bg-[--color-danger-light] text-[--color-danger] rounded font-medium">Required</span>
            )}
            {deliverable.version > 1 && (
              <span className="text-[10px] text-[--color-text-tertiary]">v{deliverable.version}</span>
            )}
          </div>
          {deliverable.due_date && (
            <span className={cn('text-xs', overdue ? 'text-[--color-danger]' : 'text-[--color-text-tertiary]')}>
              Due {formatDate(deliverable.due_date)}
            </span>
          )}
        </div>

        {/* Assignee + status */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {assignee && <Avatar name={assignee.profile?.full_name || assignee.display_name} size="xs" />}
          <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
          {expanded ? <ChevronUp size={14} className="text-[--color-text-tertiary]" /> : <ChevronDown size={14} className="text-[--color-text-tertiary]" />}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-[--color-border] space-y-3 bg-[--color-surface]">
          {deliverable.description && (
            <p className="text-sm text-[--color-text-secondary] mt-3">{deliverable.description}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            <select
              value={deliverable.status}
              onChange={e => onUpdate(deliverable.id, { status: e.target.value as Deliverable['status'] })}
              className="text-xs border border-[--color-border] rounded px-2 py-1 bg-white"
              aria-label="Update status"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {deliverable.status !== 'approved' && (
              <button
                onClick={() => onUpdate(deliverable.id, {
                  status: 'approved',
                  version: deliverable.version + 1,
                  last_updated_at: new Date().toISOString()
                })}
                className="text-xs px-2 py-1 bg-[--color-success-light] text-[--color-success] rounded border border-[--color-success-muted] hover:bg-[--color-success-muted]"
              >
                Mark Approved
              </button>
            )}
          </div>
          {deliverable.file_url && (
            <a href={deliverable.file_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs text-[--color-accent] hover:underline">
              <Link size={11} /> View file
            </a>
          )}
          {deliverable.review_comments && (
            <div className="text-xs bg-[--color-warning-light] text-[--color-warning] p-2 rounded">
              <strong>Review notes:</strong> {deliverable.review_comments}
            </div>
          )}
          <button
            onClick={() => onDelete(deliverable.id)}
            className="text-xs text-[--color-danger] hover:underline"
          >
            Remove deliverable
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Correction Item ───────────────────────────────────────────────────────────

function CorrectionItem({ correction, members, onUpdate }: {
  correction: Correction
  members: Member[]
  onUpdate: (id: string, updates: Partial<Correction>) => void
}) {
  const config = CORRECTION_STATUS_CONFIG[correction.status]
  const assignee = members.find(m => m.user_id === correction.assignee_id)

  return (
    <div className={cn('border rounded-[--radius-md] p-3', correction.status === 'verified' ? 'opacity-60' : '')}>
      <div className="flex items-start gap-2">
        <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
          correction.status === 'verified' ? 'bg-[--color-success]' :
          correction.status === 'open' || correction.status === 'reopened' ? 'bg-[--color-danger]' :
          'bg-[--color-warning]'
        )} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[--color-text-primary]">{correction.description}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded', config.color, config.bg)}>{config.label}</span>
            {assignee && (
              <span className="text-xs text-[--color-text-tertiary] flex items-center gap-1">
                <User size={11} />
                {assignee.profile?.full_name || assignee.display_name}
              </span>
            )}
            {correction.deadline && (
              <span className={cn('text-xs flex items-center gap-1', isOverdue(correction.deadline) ? 'text-[--color-danger]' : 'text-[--color-text-tertiary]')}>
                <Clock size={11} />
                {formatDate(correction.deadline)}
              </span>
            )}
          </div>
          {correction.evidence_url && (
            <a href={correction.evidence_url} target="_blank" rel="noreferrer"
              className="text-xs text-[--color-accent] hover:underline flex items-center gap-1 mt-1">
              <Link size={11} /> Evidence
            </a>
          )}
        </div>
        <div className="flex-shrink-0">
          <select
            value={correction.status}
            onChange={e => onUpdate(correction.id, { status: e.target.value as Correction['status'] })}
            className="text-xs border border-[--color-border] rounded px-1.5 py-1 bg-white"
            aria-label="Update correction status"
          >
            {Object.entries(CORRECTION_STATUS_CONFIG).map(([v, c]) => (
              <option key={v} value={v}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

// ─── Feedback Record ──────────────────────────────────────────────────────────

function FeedbackRecord({ feedback, corrections, members, projectId, phaseId, onAddCorrection, onUpdateCorrection }: {
  feedback: Feedback
  corrections: Correction[]
  members: Member[]
  projectId: string
  phaseId: string
  onAddCorrection: (data: Partial<Correction>) => void
  onUpdateCorrection: (id: string, updates: Partial<Correction>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showAddCorrection, setShowAddCorrection] = useState(false)
  const [correctionForm, setCorrectionForm] = useState<Partial<Correction>>({ priority: 'medium' })
  const [descriptionError, setDescriptionError] = useState<string | null>(null)

  const feedbackCorrections = corrections.filter(c => c.feedback_id === feedback.id)
  const openCount = feedbackCorrections.filter(c => c.status === 'open' || c.status === 'reopened').length

  return (
    <div className="border border-[--color-border] rounded-[--radius-lg] overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[--color-surface] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{feedback.reviewer_name}</span>
            {feedback.presentation_date && (
              <span className="text-xs text-[--color-text-tertiary]">{formatDate(feedback.presentation_date)}</span>
            )}
            {feedback.marks_obtained !== null && feedback.max_marks !== null && (
              <span className="text-xs px-1.5 py-0.5 bg-[--color-accent-light] text-[--color-accent] rounded font-medium">
                {feedback.marks_obtained}/{feedback.max_marks}
              </span>
            )}
          </div>
          {feedback.general_feedback && (
            <p className="text-xs text-[--color-text-tertiary] mt-0.5 truncate">{feedback.general_feedback}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {openCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 bg-[--color-danger-light] text-[--color-danger] rounded font-medium">
              {openCount} open
            </span>
          )}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-[--color-border]">
          {feedback.general_feedback && (
            <div className="mt-3">
              <p className="text-xs font-medium text-[--color-text-secondary] mb-1">General Feedback</p>
              <p className="text-sm text-[--color-text-primary]">{feedback.general_feedback}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {feedback.strengths && (
              <div className="bg-[--color-success-light] rounded-[--radius-md] p-3">
                <p className="text-xs font-medium text-[--color-success] mb-1">Strengths</p>
                <p className="text-sm text-[--color-text-primary]">{feedback.strengths}</p>
              </div>
            )}
            {feedback.areas_for_improvement && (
              <div className="bg-[--color-warning-light] rounded-[--radius-md] p-3">
                <p className="text-xs font-medium text-[--color-warning] mb-1">Areas for Improvement</p>
                <p className="text-sm text-[--color-text-primary]">{feedback.areas_for_improvement}</p>
              </div>
            )}
          </div>

          {/* Corrections */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[--color-text-secondary] uppercase tracking-wide">
                Corrections ({feedbackCorrections.length})
              </p>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setDescriptionError(null)
                  setShowAddCorrection(!showAddCorrection)
                }}
              >
                <Plus size={12} /> Add Correction
              </Button>
            </div>

            {showAddCorrection && (
              <div className="border border-[--color-border] rounded-[--radius-md] p-3 space-y-3 bg-[--color-surface] mb-2">
                <Textarea
                  label="Description *"
                  value={correctionForm.description || ''}
                  error={descriptionError || undefined}
                  onChange={e => {
                    setDescriptionError(null)
                    setCorrectionForm(f => ({ ...f, description: e.target.value }))
                  }}
                  placeholder="What needs to be corrected?"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    label="Priority"
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                      { value: 'urgent', label: 'Urgent' },
                    ]}
                    value={correctionForm.priority || 'medium'}
                    onChange={e => setCorrectionForm(f => ({ ...f, priority: e.target.value as Correction['priority'] }))}
                  />
                  <Select
                    label="Assignee"
                    placeholder="Unassigned"
                    options={members.map(m => ({ value: m.user_id, label: m.profile?.full_name || m.display_name || 'Unknown' }))}
                    value={correctionForm.assignee_id || ''}
                    onChange={e => setCorrectionForm(f => ({ ...f, assignee_id: e.target.value || null }))}
                  />
                </div>
                <Input
                  label="Deadline"
                  type="date"
                  value={correctionForm.deadline || ''}
                  onChange={e => setCorrectionForm(f => ({ ...f, deadline: e.target.value || null }))}
                />
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      if (!correctionForm.description?.trim()) {
                        setDescriptionError('Please describe the required correction.')
                        return
                      }
                      setDescriptionError(null)
                      onAddCorrection({
                        feedback_id: feedback.id,
                        phase_id: phaseId,
                        project_id: projectId,
                        ...correctionForm,
                      })
                      toast('Correction added successfully', 'success')
                      setCorrectionForm({ priority: 'medium' })
                      setShowAddCorrection(false)
                    }}
                  >
                    Add Correction
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddCorrection(false)}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {feedbackCorrections.length === 0 ? (
                <p className="text-xs text-[--color-text-tertiary]">No corrections recorded.</p>
              ) : (
                feedbackCorrections.map(c => (
                  <CorrectionItem key={c.id} correction={c} members={members} onUpdate={onUpdateCorrection} />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Phase Card ────────────────────────────────────────────────────────────────

interface PhaseCardProps {
  phase: Phase
  members: Member[]
  projectId: string
  isCurrentPhase: boolean
}

function PhaseCard({ phase, members, projectId, isCurrentPhase }: PhaseCardProps) {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [expanded, setExpanded] = useState(isCurrentPhase)
  const [activeTab, setActiveTab] = useState('deliverables')
  const [showAddDeliverable, setShowAddDeliverable] = useState(false)
  const [showAddFeedback, setShowAddFeedback] = useState(false)
  const [deliverableForm, setDeliverableForm] = useState<Partial<Deliverable>>({ is_mandatory: false })
  const [feedbackForm, setFeedbackForm] = useState<Partial<Feedback>>({})
  const [deliverableNameError, setDeliverableNameError] = useState<string | null>(null)
  const [reviewerError, setReviewerError] = useState<string | null>(null)

  const { data: deliverables = [] } = useDeliverables(phase.id)
  const { data: feedbackList = [] } = useFeedback(phase.id)
  const { data: corrections = [] } = useCorrections(phase.id)

  const completedDeliverables = deliverables.filter(d => d.status === 'approved').length
  const totalDeliverables = deliverables.length
  const mandatoryIncomplete = deliverables.filter(d => d.is_mandatory && d.status !== 'approved').length
  const openCorrections = corrections.filter(c => c.status === 'open' || c.status === 'reopened').length
  const completionPct = totalDeliverables > 0 ? Math.round((completedDeliverables / totalDeliverables) * 100) : 0

  const days = daysUntil(phase.scheduled_date)
  const isPast = days !== null && days < 0
  const isSoon = days !== null && days >= 0 && days <= 7

  const updatePhase = useMutation({
    mutationFn: async (updates: Partial<Phase>) => {
      const { error } = await supabase
        .from('presentation_phases')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', phase.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['phases', projectId] }),
  })

  const updateDeliverable = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Deliverable> }) => {
      const { error } = await supabase
        .from('deliverables')
        .update({ ...updates, last_updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deliverables', phase.id] })
      toast('Deliverable updated', 'info')
    },
  })

  const deleteDeliverable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('deliverables').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deliverables', phase.id] })
      toast('Deliverable removed', 'info')
    },
  })

  const addDeliverable = useMutation({
    mutationFn: async (data: Partial<Deliverable>) => {
      const { error } = await supabase.from('deliverables').insert({
        phase_id: phase.id,
        project_id: projectId,
        name: data.name!,
        description: data.description,
        is_mandatory: data.is_mandatory ?? false,
        assignee_id: data.assignee_id,
        due_date: data.due_date,
        status: 'not_started',
        version: 1,
        last_updated_at: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deliverables', phase.id] })
      setDeliverableForm({ is_mandatory: false })
      setShowAddDeliverable(false)
      toast('Deliverable added successfully', 'success')
    },
    onError: (err: any) => {
      toast(err?.message || 'Failed to add deliverable', 'error')
    },
  })

  const addFeedback = useMutation({
    mutationFn: async (data: Partial<Feedback>) => {
      const { error } = await supabase.from('feedback_records').insert({
        phase_id: phase.id,
        project_id: projectId,
        reviewer_name: data.reviewer_name!,
        reviewer_id: data.reviewer_id,
        presentation_date: data.presentation_date,
        marks_obtained: data.marks_obtained,
        max_marks: data.max_marks,
        general_feedback: data.general_feedback,
        strengths: data.strengths,
        areas_for_improvement: data.areas_for_improvement,
        final_approval_status: 'pending',
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback', phase.id] })
      setFeedbackForm({})
      setShowAddFeedback(false)
      toast('Faculty feedback saved successfully', 'success')
    },
    onError: (err: any) => {
      toast(err?.message || 'Failed to save feedback', 'error')
    },
  })

  const addCorrection = useMutation({
    mutationFn: async (data: Partial<Correction>) => {
      const { count } = await supabase
        .from('corrections')
        .select('*', { count: 'exact', head: true })
        .eq('phase_id', phase.id)
      const { error } = await supabase.from('corrections').insert({
        feedback_id: data.feedback_id!,
        project_id: projectId,
        phase_id: phase.id,
        correction_number: (count || 0) + 1,
        description: data.description!,
        assignee_id: data.assignee_id,
        priority: data.priority || 'medium',
        deadline: data.deadline,
        status: 'open',
      })
      if (error) throw error
      // Update phase status to corrections_required if not already
      if (phase.status === 'presented' || phase.status === 'approved') {
        await supabase.from('presentation_phases')
          .update({ status: 'corrections_required', updated_at: new Date().toISOString() })
          .eq('id', phase.id)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['corrections', phase.id] })
      qc.invalidateQueries({ queryKey: ['phases', projectId] })
    },
  })

  const updateCorrection = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Correction> }) => {
      const { error } = await supabase
        .from('corrections')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['corrections', phase.id] }),
  })

  const statusOptions: { value: Phase['status']; label: string }[] = [
    { value: 'not_started', label: 'Not Started' },
    { value: 'planning', label: 'Planning' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready_for_review', label: 'Ready for Review' },
    { value: 'ready_to_present', label: 'Ready to Present' },
    { value: 'presented', label: 'Presented' },
    { value: 'corrections_required', label: 'Corrections Required' },
    { value: 'approved', label: 'Approved' },
    { value: 'completed', label: 'Completed' },
  ]

  const canMarkReadyToPresent = mandatoryIncomplete === 0

  return (
    <div className={cn(
      'border rounded-[--radius-xl] overflow-hidden bg-white transition-all',
      isCurrentPhase ? 'border-[--color-accent] shadow-[--shadow-md]' : 'border-[--color-border]',
      phase.status === 'completed' || phase.status === 'approved' ? 'opacity-80' : ''
    )}>
      {/* Phase header */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-[--color-surface] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Phase number */}
        <div className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
          phase.status === 'completed' || phase.status === 'approved'
            ? 'bg-[--color-success-muted] text-[--color-success]'
            : isCurrentPhase
            ? 'bg-[--color-accent] text-white'
            : 'bg-[--color-surface-raised] text-[--color-text-tertiary]'
        )}>
          {phase.status === 'completed' ? <Check size={14} /> : phase.phase_number}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[--color-text-primary]">{phase.name}</span>
            {isCurrentPhase && (
              <span className="text-[10px] px-1.5 py-0.5 bg-[--color-accent] text-white rounded font-medium">Current</span>
            )}
            <PhaseStatusBadge status={phase.status} />
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {phase.scheduled_date && (
              <span className={cn(
                'text-xs flex items-center gap-1',
                isSoon && !isPast ? 'text-[--color-warning]' : isPast ? 'text-[--color-text-tertiary]' : 'text-[--color-text-tertiary]'
              )}>
                <Calendar size={11} />
                {formatDate(phase.scheduled_date)}
                {!isPast && days !== null && ` · ${days}d away`}
              </span>
            )}
            {totalDeliverables > 0 && (
              <span className="text-xs text-[--color-text-tertiary]">
                {completedDeliverables}/{totalDeliverables} deliverables
              </span>
            )}
            {openCorrections > 0 && (
              <span className="text-xs text-[--color-danger] flex items-center gap-1">
                <AlertCircle size={11} /> {openCorrections} corrections open
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {totalDeliverables > 0 && (
            <div className="w-20 hidden sm:block">
              <ProgressBar value={completionPct} variant={completionPct === 100 ? 'success' : 'default'} />
            </div>
          )}
          {expanded ? <ChevronUp size={15} className="text-[--color-text-tertiary]" /> : <ChevronDown size={15} className="text-[--color-text-tertiary]" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[--color-border]">
          {/* Phase controls */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[--color-surface] border-b border-[--color-border] flex-wrap gap-y-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-[--color-text-tertiary]">Status:</label>
              <select
                value={phase.status}
                onChange={e => {
                  const newStatus = e.target.value as Phase['status']
                  if (newStatus === 'ready_to_present' && !canMarkReadyToPresent) {
                    toast(`Cannot mark as Ready to Present: ${mandatoryIncomplete} mandatory deliverable(s) are not approved yet.`, 'warning', 'Prerequisites Incomplete')
                    return
                  }
                  updatePhase.mutate({ status: newStatus })
                  toast(`Phase status updated to ${newStatus.replace(/_/g, ' ')}`, 'info')
                }}
                className="text-xs border border-[--color-border] rounded px-2 py-1 bg-white"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-[--color-text-tertiary]">Scheduled:</label>
              <input
                type="date"
                value={phase.scheduled_date || ''}
                onChange={e => updatePhase.mutate({ scheduled_date: e.target.value || null })}
                className="text-xs border border-[--color-border] rounded px-2 py-1 bg-white"
                aria-label="Scheduled date"
              />
            </div>
            {!canMarkReadyToPresent && (
              <span className="text-xs text-[--color-danger] flex items-center gap-1 ml-auto">
                <AlertCircle size={11} />
                {mandatoryIncomplete} mandatory deliverable(s) incomplete
              </span>
            )}
          </div>

          {/* Tabs */}
          <Tabs
            tabs={[
              { id: 'deliverables', label: 'Deliverables', count: totalDeliverables },
              { id: 'feedback', label: 'Feedback', count: feedbackList.length },
              { id: 'corrections', label: 'Corrections', count: corrections.length },
            ]}
            active={activeTab}
            onChange={setActiveTab}
            className="px-4"
          />

          <div className="p-4 space-y-3">
            {/* ── Deliverables ── */}
            {activeTab === 'deliverables' && (
              <div className="space-y-2">
                {deliverables.map(d => (
                  <DeliverableItem
                    key={d.id}
                    deliverable={d}
                    members={members}
                    onUpdate={(id, updates) => updateDeliverable.mutate({ id, updates })}
                    onDelete={id => deleteDeliverable.mutate(id)}
                  />
                ))}
                {deliverables.length === 0 && (
                  <p className="text-sm text-[--color-text-tertiary] text-center py-4">No deliverables added yet.</p>
                )}

                {showAddDeliverable ? (
                  <div className="border border-[--color-border] rounded-[--radius-md] p-3 space-y-3 bg-[--color-surface]">
                    <Input
                      label="Deliverable Name *"
                      value={deliverableForm.name || ''}
                      error={deliverableNameError || undefined}
                      onChange={e => {
                        setDeliverableNameError(null)
                        setDeliverableForm(f => ({ ...f, name: e.target.value }))
                      }}
                      placeholder="e.g. Project Report Draft"
                      required
                    />
                    <Textarea
                      label="Description"
                      value={deliverableForm.description || ''}
                      onChange={e => setDeliverableForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Deliverable specifications, acceptance requirements..."
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        label="Assignee"
                        placeholder="Unassigned"
                        options={members.map(m => ({ value: m.user_id, label: m.profile?.full_name || m.display_name || 'Unknown' }))}
                        value={deliverableForm.assignee_id || ''}
                        onChange={e => setDeliverableForm(f => ({ ...f, assignee_id: e.target.value || null }))}
                      />
                      <Input
                        label="Due Date"
                        type="date"
                        value={deliverableForm.due_date || ''}
                        onChange={e => setDeliverableForm(f => ({ ...f, due_date: e.target.value || null }))}
                      />
                    </div>
                    <Checkbox
                      label="Mark as mandatory (phase cannot be 'Ready to Present' without this)"
                      checked={deliverableForm.is_mandatory || false}
                      onChange={e => setDeliverableForm(f => ({ ...f, is_mandatory: e.target.checked }))}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        loading={addDeliverable.isPending}
                        onClick={() => {
                          if (!deliverableForm.name?.trim()) {
                            setDeliverableNameError('Deliverable name is required.')
                            return
                          }
                          setDeliverableNameError(null)
                          addDeliverable.mutate(deliverableForm)
                        }}
                      >
                        Add Deliverable
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeliverableNameError(null)
                          setShowAddDeliverable(false)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeliverableNameError(null)
                      setShowAddDeliverable(true)
                    }}
                  >
                    <Plus size={14} /> Add Deliverable
                  </Button>
                )}
              </div>
            )}

            {/* ── Feedback ── */}
            {activeTab === 'feedback' && (
              <div className="space-y-3">
                {feedbackList.map(f => (
                  <FeedbackRecord
                    key={f.id}
                    feedback={f}
                    corrections={corrections}
                    members={members}
                    projectId={projectId}
                    phaseId={phase.id}
                    onAddCorrection={data => addCorrection.mutate(data)}
                    onUpdateCorrection={(id, updates) => updateCorrection.mutate({ id, updates })}
                  />
                ))}
                {feedbackList.length === 0 && (
                  <p className="text-sm text-[--color-text-tertiary] text-center py-4">No feedback recorded yet.</p>
                )}

                {showAddFeedback ? (
                  <div className="border border-[--color-border] rounded-[--radius-md] p-4 space-y-3 bg-[--color-surface]">
                    <h4 className="text-sm font-semibold">Record Faculty Feedback</h4>
                    <Input
                      label="Reviewer Name *"
                      value={feedbackForm.reviewer_name || ''}
                      error={reviewerError || undefined}
                      onChange={e => {
                        setReviewerError(null)
                        setFeedbackForm(f => ({ ...f, reviewer_name: e.target.value }))
                      }}
                      placeholder="e.g. Dr. Ramesh Kumar (Project Guide)"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Presentation Date"
                        type="date"
                        value={feedbackForm.presentation_date || ''}
                        onChange={e => setFeedbackForm(f => ({ ...f, presentation_date: e.target.value || null }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Marks Obtained"
                        type="number"
                        placeholder="e.g. 18"
                        value={feedbackForm.marks_obtained ?? ''}
                        onChange={e => setFeedbackForm(f => ({ ...f, marks_obtained: e.target.value ? Number(e.target.value) : null }))}
                      />
                      <Input
                        label="Max Marks"
                        type="number"
                        placeholder="e.g. 20"
                        value={feedbackForm.max_marks ?? ''}
                        onChange={e => setFeedbackForm(f => ({ ...f, max_marks: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                    <Textarea
                      label="General Feedback"
                      value={feedbackForm.general_feedback || ''}
                      onChange={e => setFeedbackForm(f => ({ ...f, general_feedback: e.target.value }))}
                      placeholder="Summary of presentation review and overall remarks..."
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Textarea
                        label="Strengths"
                        value={feedbackForm.strengths || ''}
                        onChange={e => setFeedbackForm(f => ({ ...f, strengths: e.target.value }))}
                        placeholder="What went well..."
                      />
                      <Textarea
                        label="Areas for Improvement"
                        value={feedbackForm.areas_for_improvement || ''}
                        onChange={e => setFeedbackForm(f => ({ ...f, areas_for_improvement: e.target.value }))}
                        placeholder="Suggestions for refinement..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        loading={addFeedback.isPending}
                        onClick={() => {
                          if (!feedbackForm.reviewer_name?.trim()) {
                            setReviewerError('Reviewer name is required.')
                            return
                          }
                          setReviewerError(null)
                          addFeedback.mutate(feedbackForm)
                        }}
                      >
                        Save Feedback
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReviewerError(null)
                          setShowAddFeedback(false)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReviewerError(null)
                      setShowAddFeedback(true)
                    }}
                  >
                    <Plus size={14} /> Record Feedback
                  </Button>
                )}
              </div>
            )}

            {/* ── Corrections ── */}
            {activeTab === 'corrections' && (
              <div className="space-y-2">
                {corrections.length === 0 ? (
                  <p className="text-sm text-[--color-text-tertiary] text-center py-4">No corrections for this phase.</p>
                ) : (
                  corrections.map(c => (
                    <CorrectionItem
                      key={c.id}
                      correction={c}
                      members={members}
                      onUpdate={(id, updates) => updateCorrection.mutate({ id, updates })}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Presentations Page ───────────────────────────────────────────────────

export default function PresentationsPage() {
  const { currentProject } = useProjectStore()
  const qc = useQueryClient()
  const [showAddPhase, setShowAddPhase] = useState(false)
  const [phaseForm, setPhaseForm] = useState<Partial<Phase>>({})
  const [phaseNameError, setPhaseNameError] = useState<string | null>(null)

  const { data: phases = [], isLoading } = usePhases(currentProject?.id)
  const { data: members = [] } = useMembers(currentProject?.id)

  const currentPhaseId = currentProject?.current_phase_id

  const addPhase = useMutation({
    mutationFn: async (data: Partial<Phase>) => {
      const { error } = await supabase.from('presentation_phases').insert({
        project_id: currentProject!.id,
        name: data.name!,
        description: data.description,
        phase_number: (phases.length || 0) + 1,
        status: 'not_started',
        scheduled_date: data.scheduled_date,
        is_active: true,
        is_custom: true,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['phases', currentProject?.id] })
      setPhaseForm({})
      setShowAddPhase(false)
      toast('Presentation phase added successfully', 'success')
    },
    onError: (err: any) => {
      toast(err?.message || 'Failed to add presentation phase', 'error')
    },
  })

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState title="No project selected" description="Select a project to view presentation phases." />
      </div>
    )
  }

  // Summary stats
  const completedPhases = phases.filter(p => p.status === 'completed' || p.status === 'approved').length
  const totalPhases = phases.length

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[--color-text-primary]">Presentation Tracker</h1>
          <p className="text-sm text-[--color-text-tertiary] mt-0.5">
            {completedPhases}/{totalPhases} phases completed
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setPhaseNameError(null)
            setShowAddPhase(true)
          }}
        >
          <Plus size={15} /> Add Phase
        </Button>
      </div>

      {/* Progress overview */}
      {totalPhases > 0 && (
        <div className="bg-white border border-[--color-border] rounded-[--radius-lg] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Presentation Progress</span>
            <span className="text-sm text-[--color-text-tertiary]">{completedPhases}/{totalPhases} phases</span>
          </div>
          <ProgressBar
            value={completedPhases}
            max={totalPhases}
            size="md"
            variant={completedPhases === totalPhases ? 'success' : 'default'}
            label
          />
        </div>
      )}

      {/* Phase list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : phases.length === 0 ? (
        <EmptyState
          title="No presentation phases"
          description="Add phases to track your project presentation lifecycle."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setPhaseNameError(null)
                setShowAddPhase(true)
              }}
            >
              <Plus size={14} /> Add First Phase
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {phases.map(phase => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              members={members}
              projectId={currentProject.id}
              isCurrentPhase={phase.id === currentPhaseId}
            />
          ))}
        </div>
      )}

      {/* Add phase modal */}
      <Modal
        open={showAddPhase}
        onClose={() => {
          setPhaseNameError(null)
          setShowAddPhase(false)
        }}
        title="Add Presentation Phase"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setPhaseNameError(null)
                setShowAddPhase(false)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={addPhase.isPending}
              onClick={() => {
                if (!phaseForm.name?.trim()) {
                  setPhaseNameError('Phase name is required.')
                  return
                }
                setPhaseNameError(null)
                addPhase.mutate(phaseForm)
              }}
            >
              Add Phase
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Phase Name *"
            value={phaseForm.name || ''}
            error={phaseNameError || undefined}
            onChange={e => {
              setPhaseNameError(null)
              setPhaseForm(f => ({ ...f, name: e.target.value }))
            }}
            placeholder="e.g. Pre-Final Evaluation & Viva"
            required
          />
          <Textarea
            label="Description"
            value={phaseForm.description || ''}
            onChange={e => setPhaseForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Scope, review agenda, and objectives for this phase..."
          />
          <Input
            label="Scheduled Date"
            type="date"
            value={phaseForm.scheduled_date || ''}
            onChange={e => setPhaseForm(f => ({ ...f, scheduled_date: e.target.value || null }))}
          />
        </div>
      </Modal>
    </div>
  )
}
