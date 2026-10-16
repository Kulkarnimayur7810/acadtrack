import React, { useState, useEffect } from 'react'
import { Modal, Button, Input, Textarea, Select } from '@/components/ui'
import { useProjectStore, useAuthStore, toast } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import type { Database } from '@/lib/database.types'

type Task = Database['public']['Tables']['tasks']['Row']
type Member = Database['public']['Tables']['project_members']['Row'] & { profile?: Database['public']['Tables']['profiles']['Row'] }

interface GlobalCreateTaskModalProps {
  open: boolean
  onClose: () => void
}

const KANBAN_STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Done' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export function GlobalCreateTaskModal({ open, onClose }: GlobalCreateTaskModalProps) {
  const { currentProject, projects } = useProjectStore()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [projectId, setProjectId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'in_review' | 'done'>('todo')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [dueDate, setDueDate] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setProjectId(currentProject?.id || (projects[0]?.id ?? ''))
      setTitle('')
      setDescription('')
      setStatus('todo')
      setPriority('medium')
      setAssigneeId('')
      setDueDate('')
      setTitleError(null)
    }
  }, [open, currentProject, projects])

  // Fetch members for the selected project
  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      if (!projectId) return []
      const { data, error } = await supabase
        .from('project_members')
        .select('*, profile:profiles(*)')
        .eq('project_id', projectId)
      if (error) return []
      return (data as Member[]) || []
    },
    enabled: !!projectId,
  })

  const handleCreate = async () => {
    if (!title.trim()) {
      setTitleError('Task title is required. Please specify what needs to be done.')
      return
    }
    if (!projectId) {
      toast('Please select or create a project first.', 'warning')
      return
    }
    if (!user) return

    setLoading(true)
    setTitleError(null)

    try {
      // Find max column_order
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('column_order, task_number')
        .eq('project_id', projectId)
        .order('column_order', { ascending: false })
        .limit(1)

      const nextOrder = existingTasks?.[0]?.column_order ? existingTasks[0].column_order + 1 : 1
      const nextNumber = existingTasks?.[0]?.task_number ? existingTasks[0].task_number + 1 : 1

      const { error } = await supabase.from('tasks').insert({
        project_id: projectId,
        creator_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        status: status,
        priority: priority,
        assignee_id: assigneeId || null,
        due_date: dueDate || null,
        column_order: nextOrder,
        task_number: nextNumber,
        is_correction_task: false,
      })

      if (error) throw error

      toast('Task created successfully!', 'success')
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      onClose()
    } catch (err: any) {
      console.error('[GlobalCreateTaskModal] error:', err)
      toast(err?.message || 'Failed to create task', 'error')
    } finally {
      setLoading(false)
    }
  }

  const projectOptions = projects.map(p => ({
    value: p.id,
    label: p.title,
  }))

  const memberOptions = members.map(m => ({
    value: m.user_id,
    label: m.profile?.full_name || m.display_name || 'Member',
  }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create New Task"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" loading={loading} onClick={handleCreate}>
            Create Task
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {projects.length > 1 && (
          <Select
            label="Project *"
            options={projectOptions}
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
          />
        )}

        <Input
          label="Task Title *"
          placeholder="e.g. Design user authorization flow & API routes"
          value={title}
          error={titleError || undefined}
          onChange={e => {
            setTitleError(null)
            setTitle(e.target.value)
          }}
          autoFocus
          required
        />

        <Textarea
          label="Description"
          placeholder="Add details, criteria for completion, or notes..."
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Workflow Status"
            options={KANBAN_STATUS_OPTIONS}
            value={status}
            onChange={e => setStatus(e.target.value as any)}
          />
          <Select
            label="Priority"
            options={PRIORITY_OPTIONS}
            value={priority}
            onChange={e => setPriority(e.target.value as any)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Assignee"
            placeholder="Unassigned"
            options={memberOptions}
            value={assigneeId}
            onChange={e => setAssigneeId(e.target.value)}
          />
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}
