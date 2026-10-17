import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useProjectStore, useAuthStore, toast } from '@/lib/store'
import {
  Button,
  Input,
  Select,
  Badge,
  Avatar,
  Modal,
  Spinner,
  EmptyState,
  Card,
  Textarea,
  Checkbox,
  Tabs,
} from '@/components/ui'
import {
  cn,
  formatDate,
  isOverdue,
  PRIORITY_CONFIG,
  daysUntil,
  formatRelativeDate,
} from '@/lib/utils'
import {
  Plus,
  Search,
  Filter,
  X,
  AlertCircle,
  Clock,
  Calendar,
  User,
  Tag,
  ChevronDown,
  GripVertical,
  Pencil,
  Trash2,
  MessageSquare,
  Paperclip,
  CheckSquare,
  MoreHorizontal,
  Flag,
  ArrowUpDown,
  Sparkles,
  Layers,
} from 'lucide-react'
import type { Database } from '@/lib/database.types'
import { TimelineStudioView } from '@/components/TimelineStudioView'

type Task = Database['public']['Tables']['tasks']['Row']
type Member = Database['public']['Tables']['project_members']['Row'] & {
  profile?: Database['public']['Tables']['profiles']['Row']
}

// ─── Exactly FOUR Workflow Statuses ──────────────────────────────────────────
export type KanbanStatus = 'todo' | 'in_progress' | 'in_review' | 'done'

const COLUMNS: {
  id: KanbanStatus
  label: string
  color: string
  badgeBg: string
  dotColor: string
}[] = [
  { id: 'todo', label: 'To Do', color: 'text-[#4338CA]', badgeBg: 'bg-[#EEF2FF]', dotColor: 'bg-[#4338CA]' },
  { id: 'in_progress', label: 'In Progress', color: 'text-[#B45309]', badgeBg: 'bg-[#FEF3C7]', dotColor: 'bg-[#F59E0B]' },
  { id: 'in_review', label: 'In Review', color: 'text-[#6D28D9]', badgeBg: 'bg-[#EDE9FE]', dotColor: 'bg-[#8B5CF6]' },
  { id: 'done', label: 'Done', color: 'text-[#15803D]', badgeBg: 'bg-[#DCFCE7]', dotColor: 'bg-[#22C55E]' },
]

// Safe normalization for legacy statuses without deleting data
function normalizeStatus(status: Task['status']): KanbanStatus {
  if (status === 'backlog') return 'todo'
  if (status === 'blocked') return 'in_progress'
  return status as KanbanStatus
}

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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortDragging,
  } = useSortable({ id: task.id })

  const style = { transform: CSS.Transform.toString(transform), transition }
  const overdue = isOverdue(task.due_date) && task.status !== 'done'
  const assignee = members.find((m) => m.user_id === task.assignee_id)
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group bg-white border border-[#E5E7EB] rounded-lg p-3.5 cursor-pointer select-none touch-none',
        'hover:border-[#D1D5DB] hover:shadow-sm transition-all relative',
        isSortDragging && 'opacity-40',
        isDragging && 'shadow-lg border-[#4338CA] rotate-1 scale-[1.02]',
        overdue && 'border-l-4 border-l-red-500'
      )}
      onClick={() => onOpen(task)}
    >
      {/* Priority dot + drag handle + title */}
      <div className="flex items-start gap-2 mb-1.5">
        <div
          {...attributes}
          {...listeners}
          className="mt-0.5 text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shrink-0"
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag task"
        >
          <GripVertical size={14} />
        </div>

        <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', priority.dot)} />

        <span className="flex-1 text-xs font-semibold text-[#202124] leading-snug break-words">
          {task.title}
        </span>
      </div>

      {/* Description Preview */}
      {task.description && (
        <p className="text-[11px] text-[#6B7280] line-clamp-2 pl-4 mb-2.5 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-4 mb-2.5">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-medium bg-[#F1F1EE] text-[#4B5563] px-1.5 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer row: Due date & Assignee Avatar */}
      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#F1F1EE] text-[#6B7280]">
        <div className="flex items-center gap-1.5">
          {task.due_date ? (
            <span
              className={cn(
                'flex items-center gap-1 font-medium text-[10px]',
                overdue
                  ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded'
                  : 'text-[#6B7280]'
              )}
            >
              <Calendar size={11} />
              {overdue ? 'Overdue' : formatDate(task.due_date, 'MMM d')}
            </span>
          ) : (
            <span className="text-[10px] text-[#9CA3AF]">No due date</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {assignee ? (
            <Avatar
              name={assignee.profile?.full_name || assignee.display_name}
              src={assignee.profile?.avatar_url}
              size="xs"
              className="ring-1 ring-white"
            />
          ) : (
            <span className="w-5 h-5 rounded-full border border-dashed border-[#D1D5DB] flex items-center justify-center text-[9px] text-[#9CA3AF]">
              +
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Kanban Column ─────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  column: (typeof COLUMNS)[0]
  tasks: Task[]
  members: Member[]
  onOpenTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  onQuickAdd: (status: KanbanStatus) => void
}

function KanbanColumn({
  column,
  tasks,
  members,
  onOpenTask,
  onDeleteTask,
  onQuickAdd,
}: KanbanColumnProps) {
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks])

  return (
    <div className="flex flex-col w-72 sm:w-80 shrink-0 bg-[#F1F1EE] border border-[#E5E7EB] rounded-xl overflow-hidden max-h-[calc(100vh-140px)]">
      {/* Column Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-[#E5E7EB] bg-white">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', column.dotColor)} />
          <h2 className="text-xs font-bold text-[#202124]">{column.label}</h2>
          <span
            className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center',
              column.badgeBg,
              column.color
            )}
          >
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onQuickAdd(column.id)}
          className="w-6 h-6 rounded flex items-center justify-center text-[#6B7280] hover:text-[#202124] hover:bg-[#F7F7F5] transition-colors"
          title={`Add task to ${column.label}`}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              members={members}
              onOpen={onOpenTask}
              onDelete={onDeleteTask}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="py-8 text-center border-2 border-dashed border-[#D1D5DB] rounded-lg">
            <p className="text-[11px] text-[#9CA3AF]">No tasks here yet</p>
            <button
              onClick={() => onQuickAdd(column.id)}
              className="mt-1 text-xs font-semibold text-[#4338CA] hover:underline"
            >
              + Add a task
            </button>
          </div>
        )}
      </div>

      {/* Footer Add Task Button */}
      <div className="p-2 border-t border-[#E5E7EB] bg-white/50">
        <button
          onClick={() => onQuickAdd(column.id)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-[#6B7280] hover:text-[#202124] hover:bg-white rounded-lg transition-all"
        >
          <Plus size={13} />
          <span>Add task</span>
        </button>
      </div>
    </div>
  )
}

// ─── Task Detail Modal ─────────────────────────────────────────────────────────

interface TaskDetailModalProps {
  task: Task | null
  projectId: string
  members: Member[]
  onClose: () => void
  onUpdate: (updated: Partial<Task>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function TaskDetailModal({
  task,
  projectId,
  members,
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailModalProps) {
  const { user } = useAuthStore()
  const [form, setForm] = useState<Partial<Task>>({})
  const [saving, setSaving] = useState(false)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details')
  const [newComment, setNewComment] = useState('')
  const qc = useQueryClient()

  useEffect(() => {
    if (task) {
      setForm(task)
      setTitleError(null)
    }
  }, [task])

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['task-comments', task?.id],
    queryFn: async () => {
      if (!task?.id) return []
      const { data, error } = await supabase
        .from('comments')
        .select('*, author:profiles(*)')
        .eq('task_id', task.id)
        .order('created_at', { ascending: true })
      if (error) return []
      return data || []
    },
    enabled: !!task?.id,
  })

  const { data: subtasks = [], refetch: refetchSubtasks } = useQuery({
    queryKey: ['task-subtasks', task?.id],
    queryFn: async () => {
      if (!task?.id) return []
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', task.id)
        .order('order_index', { ascending: true })
      if (error) return []
      return data || []
    },
    enabled: !!task?.id,
  })

  const handleSave = async () => {
    if (!form.title?.trim()) {
      setTitleError('Task title is required.')
      return
    }
    setSaving(true)
    try {
      await onUpdate(form)
      toast('Task saved', 'success')
      onClose()
    } catch (err: any) {
      toast(err?.message || 'Failed to update task', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!task) return
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await onDelete(task.id)
        toast('Task deleted', 'info')
        onClose()
      } catch (err: any) {
        toast(err?.message || 'Failed to delete task', 'error')
      }
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !task || !user) return
    try {
      await supabase.from('comments').insert({
        project_id: projectId,
        task_id: task.id,
        author_id: user.id,
        content: newComment.trim(),
      })
      setNewComment('')
      refetchComments()
      toast('Comment posted', 'info')
    } catch (err: any) {
      toast(err?.message || 'Failed to post comment', 'error')
    }
  }

  const handleToggleSubtask = async (id: string, completed: boolean) => {
    await supabase.from('subtasks').update({ completed }).eq('id', id)
    refetchSubtasks()
  }

  const handleAddSubtask = async (title: string) => {
    if (!task || !title.trim()) return
    await supabase.from('subtasks').insert({
      task_id: task.id,
      title: title.trim(),
      order_index: subtasks.length,
    })
    refetchSubtasks()
  }

  if (!task) return null

  const statusOptions = COLUMNS.map((c) => ({ value: c.id, label: c.label }))
  const priorityOptions = Object.entries(PRIORITY_CONFIG).map(([v, c]) => ({
    value: v,
    label: c.label,
  }))
  const memberOptions = members.map((m) => ({
    value: m.user_id,
    label: m.profile?.full_name || m.display_name || 'Member',
  }))

  return (
    <Modal
      open={!!task}
      onClose={onClose}
      size="lg"
      title={`Task #${task.task_number || task.id.slice(0, 6)}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Title *"
          value={form.title || ''}
          error={titleError || undefined}
          onChange={(e) => {
            setTitleError(null)
            setForm((f) => ({ ...f, title: e.target.value }))
          }}
          placeholder="Task title..."
          required
        />

        <Textarea
          label="Description"
          value={form.description || ''}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          placeholder="Details about what must be done..."
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Workflow Status"
            options={statusOptions}
            value={form.status || 'todo'}
            onChange={(e) =>
              setForm((f) => ({ ...f, status: e.target.value as Task['status'] }))
            }
          />

          <Select
            label="Priority"
            options={priorityOptions}
            value={form.priority || 'medium'}
            onChange={(e) =>
              setForm((f) => ({ ...f, priority: e.target.value as Task['priority'] }))
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Assignee"
            placeholder="Unassigned"
            options={memberOptions}
            value={form.assignee_id || ''}
            onChange={(e) => setForm((f) => ({ ...f, assignee_id: e.target.value || null }))}
          />

          <Input
            label="Due Date"
            type="date"
            value={form.due_date || ''}
            onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value || null }))}
          />
        </div>

        {/* Subtasks and Comments Tabs */}
        <div className="pt-2">
          <Tabs
            tabs={[
              { id: 'details', label: 'Checklist / Subtasks', count: subtasks.length },
              { id: 'comments', label: 'Discussion & Activity', count: comments.length },
            ]}
            active={activeTab}
            onChange={setActiveTab as any}
          />

          {activeTab === 'details' && (
            <div className="pt-3 space-y-2">
              {subtasks.map((s: any) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 p-2 bg-[#F7F7F5] rounded-lg border border-[#E5E7EB]"
                >
                  <Checkbox
                    checked={s.completed}
                    onChange={(e) => handleToggleSubtask(s.id, e.target.checked)}
                  />
                  <span
                    className={cn(
                      'text-xs flex-1',
                      s.completed && 'line-through text-[#9CA3AF]'
                    )}
                  >
                    {s.title}
                  </span>
                </div>
              ))}

              <div className="flex gap-2 pt-1">
                <Input
                  id="new-subtask-input"
                  placeholder="Add a checklist item..."
                  className="text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const val = (e.target as HTMLInputElement).value
                      if (val.trim()) {
                        handleAddSubtask(val)
                        ;(e.target as HTMLInputElement).value = ''
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="pt-3 space-y-3">
              {comments.map((c: any) => (
                <div key={c.id} className="flex gap-2.5 p-2.5 rounded-lg bg-[#F7F7F5] border border-[#E5E7EB]">
                  <Avatar
                    name={c.author?.full_name}
                    src={c.author?.avatar_url}
                    size="xs"
                    className="shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#202124]">
                        {c.author?.full_name || 'Member'}
                      </span>
                      <span className="text-[#9CA3AF]">
                        {formatRelativeDate(c.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-[#4B5563] mt-1 break-words">{c.content}</p>
                  </div>
                </div>
              ))}

              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAddComment()
                    }
                  }}
                />
                <Button variant="primary" size="sm" onClick={handleAddComment}>
                  Post
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ─── Main Kanban Page ──────────────────────────────────────────────────────────

export default function KanbanPage() {
  const { currentProject } = useProjectStore()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [quickAddStatus, setQuickAddStatus] = useState<KanbanStatus | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'studio' | 'kanban'>('studio')

  const { data: tasks = [], isLoading: tasksLoading } = useTasks(currentProject?.id)
  const { data: members = [] } = useMembers(currentProject?.id)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Mutations
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', currentProject?.id] })
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', currentProject?.id] })
    },
  })

  const createTaskMutation = useMutation({
    mutationFn: async (newTask: Partial<Task>) => {
      if (!currentProject || !user) throw new Error('No active project')
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...newTask,
          project_id: currentProject.id,
          creator_id: user.id,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', currentProject?.id] })
    },
  })

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesPriority =
        priorityFilter === 'all' || t.priority === priorityFilter

      return matchesSearch && matchesPriority
    })
  }, [tasks, searchQuery, priorityFilter])

  // Group strictly into the 4 workflow columns
  const columnsWithTasks = useMemo(() => {
    const map: Record<KanbanStatus, Task[]> = {
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
    }

    filteredTasks.forEach((task) => {
      const statusKey = normalizeStatus(task.status)
      map[statusKey].push(task)
    })

    return map
  }, [filteredTasks])

  // Drag and Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const currentTask = tasks.find((t) => t.id === activeId)
    if (!currentTask) return

    // Find if over is a column
    const isOverColumn = COLUMNS.some((col) => col.id === overId)

    if (isOverColumn) {
      const newStatus = overId as KanbanStatus
      if (currentTask.status !== newStatus) {
        updateTaskMutation.mutate({ id: activeId, status: newStatus })
      }
      return
    }

    // Over another task
    const overTask = tasks.find((t) => t.id === overId)
    if (overTask && currentTask.id !== overTask.id) {
      const targetStatus = normalizeStatus(overTask.status)
      updateTaskMutation.mutate({
        id: activeId,
        status: targetStatus,
        column_order: overTask.column_order,
      })
    }
  }

  if (!currentProject) {
    return (
      <div className="p-8">
        <EmptyState
          title="No Project Selected"
          description="Select or create a project to manage tasks on your 4-column Kanban board."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-white border-b border-[#E5E7EB] shrink-0">
        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-[#F1F5F9] p-1 rounded-xl border border-[#E2E8F0] shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('studio')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                viewMode === 'studio'
                  ? 'bg-white text-[#0284C7] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              )}
            >
              <Sparkles size={13} className={viewMode === 'studio' ? 'text-[#00A3FF]' : 'text-[#64748B]'} />
              <span>Timeline Studio</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                viewMode === 'kanban'
                  ? 'bg-white text-[#4338CA] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              )}
            >
              <Layers size={13} className={viewMode === 'kanban' ? 'text-[#4338CA]' : 'text-[#64748B]'} />
              <span>4-Status Board</span>
            </button>
          </div>

          <div className="hidden md:block">
            <Badge variant="default" size="sm">
              {viewMode === 'studio' ? 'Interactive Roadmap' : '4 Workflow States'}
            </Badge>
          </div>
        </div>

        {/* Search, Filter & Add Button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-[#F7F7F5] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#4338CA] focus:bg-white transition-all w-36 sm:w-48 text-[#202124]"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-[#F7F7F5] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 font-medium text-[#4B5563] focus:outline-none focus:border-[#4338CA]"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setQuickAddStatus('todo')}
            className="shrink-0 shadow-xs"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Add Task</span>
          </Button>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'studio' ? (
        <div className="flex-1 overflow-y-auto bg-[#E5F5F6]">
          <TimelineStudioView
            tasks={tasks}
            members={members}
            currentProject={currentProject}
            onOpenTask={setSelectedTask}
            onQuickAdd={setQuickAddStatus}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 sm:p-6 bg-[#F7F7F5]">
          {tasksLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex items-start gap-4 h-full pb-4">
                {COLUMNS.map((col) => (
                  <KanbanColumn
                    key={col.id}
                    column={col}
                    tasks={columnsWithTasks[col.id]}
                    members={members}
                    onOpenTask={setSelectedTask}
                    onDeleteTask={(id) => deleteTaskMutation.mutate(id)}
                    onQuickAdd={setQuickAddStatus}
                  />
                ))}
              </div>

              <DragOverlay>
                {activeTask ? (
                  <div className="w-72 bg-white border-2 border-[#4338CA] rounded-lg p-3.5 shadow-2xl rotate-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#202124]">
                        {activeTask.title}
                      </span>
                    </div>
                    {activeTask.description && (
                      <p className="text-[11px] text-[#6B7280] line-clamp-1">
                        {activeTask.description}
                      </p>
                    )}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projectId={currentProject.id}
          members={members}
          onClose={() => setSelectedTask(null)}
          onUpdate={async (updated) => {
            await updateTaskMutation.mutateAsync({ id: selectedTask.id, ...updated })
          }}
          onDelete={async (id) => {
            await deleteTaskMutation.mutateAsync(id)
          }}
        />
      )}

      {/* Quick Add In Column Modal */}
      {quickAddStatus && (
        <QuickAddModal
          open={!!quickAddStatus}
          defaultStatus={quickAddStatus}
          onClose={() => setQuickAddStatus(null)}
          onCreate={async (task) => {
            await createTaskMutation.mutateAsync(task)
            toast('Task created!', 'success')
            setQuickAddStatus(null)
          }}
          members={members}
        />
      )}
    </div>
  )
}

function QuickAddModal({
  open,
  defaultStatus,
  onClose,
  onCreate,
  members,
}: {
  open: boolean
  defaultStatus: KanbanStatus
  onClose: () => void
  onCreate: (task: Partial<Task>) => Promise<void>
  members: Member[]
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [assigneeId, setAssigneeId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    setLoading(true)
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || null,
        status: defaultStatus,
        priority,
        assignee_id: assigneeId || null,
        due_date: dueDate || null,
      })
    } catch (err: any) {
      setError(err?.message || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  const priorityOptions = Object.entries(PRIORITY_CONFIG).map(([v, c]) => ({
    value: v,
    label: c.label,
  }))
  const memberOptions = members.map((m) => ({
    value: m.user_id,
    label: m.profile?.full_name || m.display_name || 'Member',
  }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Add Task — ${COLUMNS.find((c) => c.id === defaultStatus)?.label}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit}>
            Create Task
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Title *"
          placeholder="e.g. Set up database indices and queries"
          value={title}
          error={error || undefined}
          onChange={(e) => {
            setError(null)
            setTitle(e.target.value)
          }}
          autoFocus
        />

        <Textarea
          label="Description"
          placeholder="What needs to be done?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Priority"
            options={priorityOptions}
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
          />
          <Select
            label="Assignee"
            placeholder="Unassigned"
            options={memberOptions}
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
          />
        </div>

        <Input
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
    </Modal>
  )
}
