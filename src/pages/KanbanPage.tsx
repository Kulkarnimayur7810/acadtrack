import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, TouchSensor,
  KeyboardSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent,
  type DragOverEvent
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy, arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useProjectStore, useAuthStore, toast } from '@/lib/store'
import {
  Button, Input, Select, Badge, Avatar, Modal, Spinner, EmptyState,
  Card, Textarea, Checkbox, Tabs
} from '@/components/ui'
import {
  cn, formatDate, isOverdue, PRIORITY_CONFIG, STATUS_CONFIG,
  daysUntil, formatRelativeDate
} from '@/lib/utils'
import {
  Plus, Search, Filter, X, AlertCircle, Clock, Calendar,
  User, Tag, ChevronDown, GripVertical, Pencil, Trash2,
  MessageSquare, Paperclip, CheckSquare, MoreHorizontal, Flag
} from 'lucide-react'
import type { Database } from '@/lib/database.types'

type Task = Database['public']['Tables']['tasks']['Row']
type Member = Database['public']['Tables']['project_members']['Row'] & { profile?: Database['public']['Tables']['profiles']['Row'] }

const COLUMNS: { id: Task['status']; label: string; color: string }[] = [
  { id: 'backlog', label: 'Backlog', color: 'text-[#6B7280]' },
  { id: 'todo', label: 'To Do', color: 'text-[#4338CA]' },
  { id: 'in_progress', label: 'In Progress', color: 'text-[#B45309]' },
  { id: 'in_review', label: 'In Review', color: 'text-[#6D28D9]' },
  { id: 'blocked', label: 'Blocked', color: 'text-[#B91C1C]' },
  { id: 'done', label: 'Done', color: 'text-[#15803D]' },
]

// ─── Data hooks ────────────────────────────────────────────────────────────────

function useTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      if (!projectId) return []
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('column_order', { ascending: true })
      if (error) throw error
      return data as Task[]
    },
    enabled: !!projectId,
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

// ─── Task Card ─────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task
  members: Member[]
  onOpen: (task: Task) => void
  onDelete: (taskId: string) => void
  isDragging?: boolean
}

function TaskCard({ task, members, onOpen, onDelete, isDragging }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const overdue = isOverdue(task.due_date) && task.status !== 'done'
  const assignee = members.find(m => m.user_id === task.assignee_id)
  const days = daysUntil(task.due_date)
  const priority = PRIORITY_CONFIG[task.priority]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group bg-white border border-[#E5E7EB] rounded-[6px] p-3 cursor-pointer select-none touch-none',
        'hover:border-[#D1D5DB] hover:shadow-xs transition-all',
        isSortDragging && 'opacity-50',
        isDragging && 'shadow-md border-[#4338CA]',
        overdue && 'border-l-4 border-l-[#B91C1C]'
      )}
      onClick={() => onOpen(task)}
    >
      {/* Priority dot + drag handle */}
      <div className="flex items-start gap-2 mb-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-0.5 text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing flex-shrink-0"
          onClick={e => e.stopPropagation()}
          aria-label="Drag task"
        >
          <GripVertical size={14} />
        </div>
        <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', priority.dot)} />
        <span className="flex-1 text-sm font-medium text-[#202124] leading-snug break-words min-w-0">
          {task.title}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onDelete(task.id) }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-[#9CA3AF] hover:text-[#B91C1C] ml-1 flex-shrink-0 p-0.5 rounded"
          aria-label="Delete task"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2 ml-5">
          {task.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] font-medium px-1.5 py-0.5 bg-[#F1F1EE] rounded text-[#6B7280]">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer: due date, assignee */}
      <div className="flex items-center justify-between gap-2 ml-5 pt-1">
        {task.due_date ? (
          <span className={cn(
            'flex items-center gap-1 text-[11px] font-medium',
            overdue ? 'text-[#B91C1C]' : days !== null && days <= 2 ? 'text-[#B45309]' : 'text-[#6B7280]'
          )}>
            <Clock size={11} />
            {overdue ? 'Overdue' : formatRelativeDate(task.due_date)}
          </span>
        ) : <span />}
        {assignee && (
          <Avatar name={assignee.profile?.full_name || assignee.display_name} size="xs" />
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// Column
// ──────────────────────────────────────────

interface ColumnProps {
  column: typeof COLUMNS[0]
  tasks: Task[]
  members: Member[]
  onAddTask: (status: Task['status']) => void
  onOpenTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
}

function Column({ column, tasks, members, onAddTask, onOpenTask, onDeleteTask }: ColumnProps) {
  return (
    <div className="flex flex-col w-72 flex-shrink-0 bg-[#F1F1EE] rounded-[8px] border border-[#E5E7EB] shadow-xs">
      {/* Column header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-[#E5E7EB] bg-white rounded-t-[8px]">
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-bold uppercase tracking-wider', column.color)}>{column.label}</span>
          <span className="text-[11px] font-semibold text-[#6B7280] bg-[#F1F1EE] border border-[#E5E7EB] rounded-full px-2 py-0.2 min-w-5 text-center">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="text-[#9CA3AF] hover:text-[#4338CA] transition-colors p-1 rounded hover:bg-[#F7F7F5]"
          aria-label={`Add task to ${column.label}`}
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Droppable area */}
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2 min-h-[140px] max-h-[calc(100vh-230px)]">
          {tasks.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-[#9CA3AF]">No tasks</p>
              <button
                onClick={() => onAddTask(column.id)}
                className="mt-1 text-xs text-[#4338CA] hover:underline font-medium"
              >
                + Add a task
              </button>
            </div>
          ) : (
            tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                members={members}
                onOpen={onOpenTask}
                onDelete={onDeleteTask}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

// ─── Task Detail Modal ─────────────────────────────────────────────────────────

interface TaskDetailModalProps {
  task: Task | null
  members: Member[]
  projectId: string
  onClose: () => void
  onSave: (updated: Partial<Task>) => void
}

function TaskDetailModal({ task, members, projectId, onClose, onSave }: TaskDetailModalProps) {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [form, setForm] = useState<Partial<Task>>(task || {})
  const [newComment, setNewComment] = useState('')
  const [activeTab, setActiveTab] = useState('details')
  const [saving, setSaving] = useState(false)

  const { data: comments } = useQuery({
    queryKey: ['task-comments', task?.id],
    queryFn: async () => {
      if (!task?.id) return []
      const { data, error } = await supabase
        .from('comments')
        .select('*, author:profiles(*)')
        .eq('task_id', task.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!task?.id && activeTab === 'comments',
  })

  const { data: subtasks, refetch: refetchSubtasks } = useQuery({
    queryKey: ['subtasks', task?.id],
    queryFn: async () => {
      if (!task?.id) return []
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', task.id)
        .order('order_index', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!task?.id,
  })

  const [titleError, setTitleError] = useState<string | null>(null)

  useEffect(() => {
    if (task) {
      setForm(task)
      setTitleError(null)
    }
  }, [task])

  const handleSave = async () => {
    if (!task) return
    if (!form.title?.trim()) {
      setTitleError('Task title cannot be empty.')
      return
    }
    setTitleError(null)
    setSaving(true)
    try {
      await onSave(form)
      toast('Task updated successfully', 'success')
      onClose()
    } catch (err: any) {
      toast(err?.message || 'Failed to update task', 'error')
    } finally {
      setSaving(false)
    }
  }

  const addComment = async () => {
    if (!newComment.trim() || !task || !user) return
    try {
      await supabase.from('comments').insert({
        project_id: projectId,
        task_id: task.id,
        author_id: user.id,
        content: newComment.trim(),
      })
      setNewComment('')
      toast('Comment posted', 'info')
      qc.invalidateQueries({ queryKey: ['task-comments', task.id] })
    } catch (err: any) {
      toast(err?.message || 'Failed to post comment', 'error')
    }
  }

  const toggleSubtask = async (id: string, completed: boolean) => {
    await supabase.from('subtasks').update({ completed }).eq('id', id)
    refetchSubtasks()
  }

  const addSubtask = async (title: string) => {
    if (!task || !title.trim()) return
    await supabase.from('subtasks').insert({
      task_id: task.id,
      title: title.trim(),
      order_index: (subtasks?.length || 0),
    })
    toast('Subtask added', 'success')
    refetchSubtasks()
  }

  if (!task) return null

  const priorityOptions = Object.entries(PRIORITY_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))
  const statusOptions = Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))
  const memberOptions = members.map(m => ({ value: m.user_id, label: m.profile?.full_name || m.display_name || 'Unknown' }))

  return (
    <Modal open={!!task} onClose={onClose} size="lg" title={`Task #${task.task_number || ''}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>Save Changes</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Title *"
          value={form.title || ''}
          error={titleError || undefined}
          onChange={e => {
            setTitleError(null)
            setForm(f => ({ ...f, title: e.target.value }))
          }}
          placeholder="Task title..."
          required
        />
        <Textarea
          label="Description"
          value={form.description || ''}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={3}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Priority"
            options={priorityOptions}
            value={form.priority || 'medium'}
            onChange={e => setForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))}
          />
          <Select
            label="Status"
            options={statusOptions}
            value={form.status || 'todo'}
            onChange={e => setForm(f => ({ ...f, status: e.target.value as Task['status'] }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Assignee"
            placeholder="Unassigned"
            options={memberOptions}
            value={form.assignee_id || ''}
            onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value || null }))}
          />
          <Input
            label="Due Date"
            type="date"
            value={form.due_date || ''}
            onChange={e => setForm(f => ({ ...f, due_date: e.target.value || null }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Estimated Hours"
            type="number"
            min="0"
            value={form.estimated_hours || ''}
            onChange={e => setForm(f => ({ ...f, estimated_hours: e.target.value ? Number(e.target.value) : null }))}
          />
          <Input
            label="Actual Hours"
            type="number"
            min="0"
            value={form.actual_hours || ''}
            onChange={e => setForm(f => ({ ...f, actual_hours: e.target.value ? Number(e.target.value) : null }))}
          />
        </div>

        <Tabs
          tabs={[
            { id: 'details', label: 'Subtasks', count: subtasks?.length },
            { id: 'comments', label: 'Comments', count: comments?.length },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'details' && (
          <SubtaskList
            subtasks={subtasks || []}
            onToggle={toggleSubtask}
            onAdd={addSubtask}
          />
        )}

        {activeTab === 'comments' && (
          <div className="space-y-3">
            {(comments || []).map((c: any) => (
              <div key={c.id} className="flex gap-2">
                <Avatar name={c.author?.full_name} size="xs" className="mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-medium text-[--color-text-primary]">{c.author?.full_name}</span>
                  <span className="text-xs text-[--color-text-tertiary] ml-2">{formatDate(c.created_at, 'MMM d, h:mm a')}</span>
                  <p className="text-sm text-[--color-text-secondary] mt-0.5 break-words">{c.content}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && addComment()}
                className="flex-1"
              />
              <Button variant="primary" size="sm" onClick={addComment}>Post</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

function SubtaskList({ subtasks, onToggle, onAdd }: {
  subtasks: any[]; onToggle: (id: string, completed: boolean) => void; onAdd: (title: string) => void
}) {
  const [newTitle, setNewTitle] = useState('')
  const completed = subtasks.filter(s => s.completed).length

  return (
    <div className="space-y-2">
      {subtasks.length > 0 && (
        <p className="text-xs text-[--color-text-tertiary]">{completed}/{subtasks.length} completed</p>
      )}
      {subtasks.map(s => (
        <div key={s.id} className="flex items-center gap-2">
          <Checkbox
            checked={s.completed}
            onChange={e => onToggle(s.id, e.target.checked)}
          />
          <span className={cn('text-sm flex-1', s.completed && 'line-through text-[--color-text-tertiary]')}>
            {s.title}
          </span>
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="Add subtask..."
          onKeyDown={e => {
            if (e.key === 'Enter' && newTitle.trim()) {
              onAdd(newTitle)
              setNewTitle('')
            }
          }}
          className="flex-1"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => { if (newTitle.trim()) { onAdd(newTitle); setNewTitle('') } }}
        >
          Add
        </Button>
      </div>
    </div>
  )
}

// ─── Create Task Modal ─────────────────────────────────────────────────────────

interface CreateTaskModalProps {
  open: boolean
  onClose: () => void
  defaultStatus: Task['status']
  projectId: string
  members: Member[]
  onCreate: (task: Partial<Task>) => Promise<void>
}

function CreateTaskModal({ open, onClose, defaultStatus, projectId, members, onCreate }: CreateTaskModalProps) {
  const [form, setForm] = useState<Partial<Task>>({ status: defaultStatus, priority: 'medium' })
  const [loading, setLoading] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)

  useEffect(() => {
    setForm({ status: defaultStatus, priority: 'medium' })
    setTitleError(null)
  }, [defaultStatus, open])

  const handleCreate = async () => {
    if (!form.title?.trim()) {
      setTitleError('Task title is required. Please specify what needs to be done.')
      return
    }
    setTitleError(null)
    setLoading(true)
    try {
      await onCreate(form)
      toast('Task created successfully', 'success')
      onClose()
    } catch (err: any) {
      toast(err?.message || 'Failed to create task', 'error')
    } finally {
      setLoading(false)
    }
  }

  const addTag = (tag: string) => {
    if (!tag.trim()) return
    setForm(f => ({ ...f, tags: [...(f.tags || []), tag.trim()] }))
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setForm(f => ({ ...f, tags: (f.tags || []).filter(t => t !== tag) }))
  }

  const priorityOptions = Object.entries(PRIORITY_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))
  const statusOptions = Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))
  const memberOptions = members.map(m => ({ value: m.user_id, label: m.profile?.full_name || m.display_name || 'Unknown' }))

  return (
    <Modal open={open} onClose={onClose} title="Create Task"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={handleCreate}>Create Task</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Title *"
          value={form.title || ''}
          error={titleError || undefined}
          onChange={e => {
            setTitleError(null)
            setForm(f => ({ ...f, title: e.target.value }))
          }}
          placeholder="e.g. Implement user authentication middleware"
          autoFocus
          required
        />
        <Textarea
          label="Description"
          value={form.description || ''}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="What needs to be done?"
        />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Priority" options={priorityOptions} value={form.priority || 'medium'}
            onChange={e => setForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))} />
          <Select label="Status" options={statusOptions} value={form.status || 'todo'}
            onChange={e => setForm(f => ({ ...f, status: e.target.value as Task['status'] }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Assignee" placeholder="Unassigned" options={memberOptions} value={form.assignee_id || ''}
            onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value || null }))} />
          <Input label="Due Date" type="date" value={form.due_date || ''}
            onChange={e => setForm(f => ({ ...f, due_date: e.target.value || null }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Estimated Hours" type="number" min="0" value={form.estimated_hours || ''}
            onChange={e => setForm(f => ({ ...f, estimated_hours: e.target.value ? Number(e.target.value) : null }))} />
        </div>
        {/* Tags */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[--color-text-primary]">Tags</label>
          <div className="flex flex-wrap gap-1 mb-1">
            {(form.tags || []).map(tag => (
              <span key={tag} className="flex items-center gap-1 text-xs px-2 py-0.5 bg-[--color-accent-light] text-[--color-accent] rounded">
                {tag}
                <button onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`}><X size={10} /></button>
              </span>
            ))}
          </div>
          <Input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            placeholder="Add tag and press Enter..."
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) } }}
          />
        </div>
      </div>
    </Modal>
  )
}

// ─── Filter Bar ────────────────────────────────────────────────────────────────

interface FilterState {
  search: string
  priority: string
  assignee: string
  overdue: boolean
}

function FilterBar({ filters, setFilters, members }: {
  filters: FilterState
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>
  members: Member[]
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[--color-text-tertiary]" />
        <input
          type="search"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          className="pl-8 pr-3 py-1.5 text-sm border border-[--color-border] rounded-[--radius-md] bg-white focus:outline-none focus:ring-1 focus:ring-[--color-accent] w-48"
          aria-label="Search tasks"
        />
      </div>
      <select
        value={filters.priority}
        onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
        className="text-sm border border-[--color-border] rounded-[--radius-md] px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[--color-accent]"
        aria-label="Filter by priority"
      >
        <option value="">All priorities</option>
        {Object.entries(PRIORITY_CONFIG).map(([v, c]) => (
          <option key={v} value={v}>{c.label}</option>
        ))}
      </select>
      <select
        value={filters.assignee}
        onChange={e => setFilters(f => ({ ...f, assignee: e.target.value }))}
        className="text-sm border border-[--color-border] rounded-[--radius-md] px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[--color-accent]"
        aria-label="Filter by assignee"
      >
        <option value="">All members</option>
        {members.map(m => (
          <option key={m.user_id} value={m.user_id}>
            {m.profile?.full_name || m.display_name || 'Unknown'}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-1.5 text-sm text-[--color-text-secondary] cursor-pointer">
        <input
          type="checkbox"
          checked={filters.overdue}
          onChange={e => setFilters(f => ({ ...f, overdue: e.target.checked }))}
          className="rounded border-[--color-border]"
        />
        Overdue only
      </label>
      {(filters.search || filters.priority || filters.assignee || filters.overdue) && (
        <Button variant="ghost" size="sm" onClick={() => setFilters({ search: '', priority: '', assignee: '', overdue: false })}>
          <X size={12} /> Clear
        </Button>
      )}
    </div>
  )
}

// ─── Main Kanban Page ──────────────────────────────────────────────────────────

export default function KanbanPage() {
  const { currentProject } = useProjectStore()
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [createStatus, setCreateStatus] = useState<Task['status']>('todo')
  const [showCreate, setShowCreate] = useState(false)
  const [filters, setFilters] = useState<FilterState>({ search: '', priority: '', assignee: '', overdue: false })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { data: allTasks = [], isLoading } = useTasks(currentProject?.id)
  const { data: members = [] } = useMembers(currentProject?.id)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Apply filters
  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (!task.title.toLowerCase().includes(q)) return false
      }
      if (filters.priority && task.priority !== filters.priority) return false
      if (filters.assignee && task.assignee_id !== filters.assignee) return false
      if (filters.overdue && (!isOverdue(task.due_date) || task.status === 'done')) return false
      return true
    })
  }, [allTasks, filters])

  const tasksByColumn = useMemo(() => {
    const map: Record<string, Task[]> = {}
    COLUMNS.forEach(col => { map[col.id] = [] })
    filteredTasks.forEach(task => {
      if (map[task.status]) map[task.status].push(task)
    })
    return map
  }, [filteredTasks])

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status, order }: { taskId: string; status: Task['status']; order: number }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status, column_order: order, updated_at: new Date().toISOString() })
        .eq('id', taskId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', currentProject?.id] }),
  })

  const updateTask = useMutation({
    mutationFn: async (updates: Partial<Task> & { id: string }) => {
      const { id, ...rest } = updates
      const { error } = await supabase
        .from('tasks')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', currentProject?.id] }),
  })

  const createTask = useMutation({
    mutationFn: async (task: Partial<Task>) => {
      if (!currentProject || !user) throw new Error('No project or user')
      // Get next task number
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', currentProject.id)
      const taskNumber = (count || 0) + 1
      const columnTasks = tasksByColumn[task.status || 'todo']
      const { error } = await supabase.from('tasks').insert({
        project_id: currentProject.id,
        creator_id: user.id,
        task_number: taskNumber,
        column_order: columnTasks.length,
        ...task,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', currentProject?.id] }),
  })

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', currentProject?.id] })
      toast('Task deleted successfully', 'info')
    },
    onError: (err: any) => {
      toast(err?.message || 'Failed to delete task', 'error')
    },
  })

  const handleDragStart = (event: DragStartEvent) => {
    const task = allTasks.find(t => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const activeTaskData = allTasks.find(t => t.id === active.id)
    if (!activeTaskData) return

    // Determine target column
    let targetColumn: Task['status'] = activeTaskData.status
    const overTask = allTasks.find(t => t.id === over.id)
    if (overTask) {
      targetColumn = overTask.status
    } else if (COLUMNS.find(c => c.id === over.id)) {
      targetColumn = over.id as Task['status']
    }

    if (targetColumn !== activeTaskData.status || active.id !== over.id) {
      await updateTaskStatus.mutateAsync({
        taskId: activeTaskData.id,
        status: targetColumn,
        order: tasksByColumn[targetColumn].length,
      })
    }
  }

  const handleSaveTask = async (updates: Partial<Task>) => {
    if (!selectedTask) return
    await updateTask.mutateAsync({ id: selectedTask.id, ...updates })
    qc.invalidateQueries({ queryKey: ['tasks', currentProject?.id] })
    setSelectedTask(null)
  }

  const handleDeleteTask = async (taskId: string) => {
    if (deleteConfirm !== taskId) {
      setDeleteConfirm(taskId)
      setTimeout(() => setDeleteConfirm(null), 3000)
      return
    }
    await deleteTask.mutateAsync(taskId)
    setDeleteConfirm(null)
    setSelectedTask(null)
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          title="No project selected"
          description="Select a project from the sidebar to view its Kanban board."
        />
      </div>
    )
  }

  const overdueCount = allTasks.filter(t => isOverdue(t.due_date) && t.status !== 'done').length

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-6 py-4 bg-white border-b border-[#E5E7EB] flex-shrink-0 shadow-xs">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h1 className="text-lg font-bold text-[#202124]">Kanban Board</h1>
            <p className="text-xs text-[#6B7280] mt-0.5">
              {allTasks.length} tasks · {allTasks.filter(t => t.status === 'done').length} completed
              {overdueCount > 0 && (
                <span className="ml-2 text-[#B91C1C] font-semibold">· {overdueCount} overdue</span>
              )}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => { setCreateStatus('todo'); setShowCreate(true) }}
          >
            <Plus size={15} /> New Task
          </Button>
        </div>
        <FilterBar filters={filters} setFilters={setFilters} members={members} />
      </div>

      {/* Board */}
      {isLoading ? (
        <div className="flex items-center justify-center flex-1">
          <Spinner size="lg" />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-3 p-4 min-w-max h-full">
              {COLUMNS.map(col => (
                <Column
                  key={col.id}
                  column={col}
                  tasks={tasksByColumn[col.id] || []}
                  members={members}
                  onAddTask={(status) => { setCreateStatus(status); setShowCreate(true) }}
                  onOpenTask={setSelectedTask}
                  onDeleteTask={handleDeleteTask}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="w-72 opacity-95">
                <TaskCard
                  task={activeTask}
                  members={members}
                  onOpen={() => {}}
                  onDelete={() => {}}
                  isDragging
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Delete confirmation toast */}
      {deleteConfirm && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white border border-[--color-danger-muted] rounded-[--radius-lg] shadow-[--shadow-lg] px-4 py-3 flex items-center gap-3 z-50">
          <AlertCircle size={16} className="text-[--color-danger]" />
          <span className="text-sm">Click delete again to confirm</span>
          <Button variant="danger" size="xs" onClick={() => deleteTask.mutateAsync(deleteConfirm)}>Delete</Button>
          <button onClick={() => setDeleteConfirm(null)} className="text-[--color-text-tertiary]"><X size={14} /></button>
        </div>
      )}

      {/* Modals */}
      <CreateTaskModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        defaultStatus={createStatus}
        projectId={currentProject.id}
        members={members}
        onCreate={async (task) => { await createTask.mutateAsync(task) }}
      />

      <TaskDetailModal
        task={selectedTask}
        members={members}
        projectId={currentProject.id}
        onClose={() => setSelectedTask(null)}
        onSave={handleSaveTask}
      />
    </div>
  )
}
