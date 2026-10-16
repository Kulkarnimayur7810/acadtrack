import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO,
  isPast
} from 'date-fns'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  ExternalLink,
  Users,
  AlertCircle,
  FileText,
  CheckCircle2,
  List,
  Grid
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProjectStore, useAuthStore, toast } from '@/lib/store'
import {
  Button,
  Input,
  Textarea,
  Select,
  Badge,
  Modal,
  EmptyState,
  Spinner,
  Tabs
} from '@/components/ui'
import { cn, formatDate, isOverdue } from '@/lib/utils'
import type { Database } from '@/lib/database.types'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type Phase = Database['public']['Tables']['presentation_phases']['Row']
type Member = Database['public']['Tables']['project_members']['Row'] & {
  profile?: Database['public']['Tables']['profiles']['Row']
}

const EVENT_TYPE_CONFIG: Record<
  CalendarEvent['event_type'],
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  presentation: {
    label: 'Presentation',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-600',
  },
  faculty_review: {
    label: 'Faculty Review',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-600',
  },
  deadline: {
    label: 'Deadline',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-600',
  },
  deliverable: {
    label: 'Deliverable',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-600',
  },
  mock: {
    label: 'Mock Presentation',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-600',
  },
  viva: {
    label: 'Viva',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-600',
  },
  submission: {
    label: 'Final Submission',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-600',
  },
  meeting: {
    label: 'Team Meeting',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    dot: 'bg-gray-600',
  },
  other: {
    label: 'Other Event',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    dot: 'bg-gray-500',
  },
}

export default function CalendarPage() {
  const { currentProject } = useProjectStore()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [titleError, setTitleError] = useState<string | null>(null)

  // Form State
  const [eventForm, setEventForm] = useState<Partial<CalendarEvent>>({
    event_type: 'presentation',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '10:00',
    responsible_members: [],
  })

  // Queries
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar_events', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return []
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('date', { ascending: true })
      if (error) throw error
      return data as CalendarEvent[]
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
  const createEventMutation = useMutation({
    mutationFn: async (newEvent: Partial<CalendarEvent>) => {
      if (!currentProject?.id || !user?.id) throw new Error('Missing project or user')
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          project_id: currentProject.id,
          created_by: user.id,
          title: newEvent.title || 'Untitled Event',
          description: newEvent.description || null,
          event_type: newEvent.event_type || 'presentation',
          date: newEvent.date || format(new Date(), 'yyyy-MM-dd'),
          time: newEvent.time || null,
          phase_id: newEvent.phase_id || null,
          location: newEvent.location || null,
          meeting_link: newEvent.meeting_link || null,
          responsible_members: newEvent.responsible_members || [],
          notes: newEvent.notes || null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events', currentProject?.id] })
      setIsAddModalOpen(false)
      setTitleError(null)
      setEventForm({
        event_type: 'presentation',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '10:00',
        responsible_members: [],
      })
      toast('Event scheduled successfully', 'success')
    },
    onError: (err: any) => {
      toast(err?.message || 'Failed to schedule event', 'error')
    },
  })

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from('calendar_events').delete().eq('id', eventId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events', currentProject?.id] })
      setSelectedEvent(null)
      toast('Event deleted', 'info')
    },
    onError: (err: any) => {
      toast(err?.message || 'Failed to delete event', 'error')
    },
  })

  // Month days
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Pad beginning of calendar with blanks
  const startDayOfWeek = monthStart.getDay() // 0 = Sun
  const paddingDays = Array.from({ length: startDayOfWeek })

  // Events map for quick lookup by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    events.forEach((ev) => {
      const dateKey = ev.date
      const current = map.get(dateKey) || []
      current.push(ev)
      map.set(dateKey, current)
    })
    return map
  }, [events])

  // Upcoming events
  const upcomingEvents = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    return events
      .filter((ev) => ev.date >= todayStr)
      .slice(0, 5)
  }, [events])

  const selectedDayEvents = useMemo(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd')
    return eventsByDate.get(dateKey) || []
  }, [eventsByDate, selectedDate])

  if (!currentProject) {
    return (
      <div className="p-8">
        <EmptyState
          title="No Project Selected"
          description="Select or create a project to view and schedule calendar events."
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
            <CalendarIcon className="w-5 h-5 text-[--color-accent]" />
            Project Calendar & Timeline
          </h1>
          <p className="text-sm text-[--color-text-secondary] mt-0.5">
            Track presentations, reviews, viva prep, and deliverable deadlines
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-white border border-[--color-border] rounded-[--radius-md] p-0.5 shadow-xs">
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition-colors',
                viewMode === 'month'
                  ? 'bg-[--color-accent-light] text-[--color-accent]'
                  : 'text-[--color-text-secondary] hover:text-[--color-text-primary]'
              )}
            >
              <Grid className="w-3.5 h-3.5" /> Month
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition-colors',
                viewMode === 'agenda'
                  ? 'bg-[--color-accent-light] text-[--color-accent]'
                  : 'text-[--color-text-secondary] hover:text-[--color-text-primary]'
              )}
            >
              <List className="w-3.5 h-3.5" /> Agenda
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Schedule Event
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Main Calendar View (3 Columns) */}
          <div className="lg:col-span-3 bg-white border border-[--color-border] rounded-[--radius-lg] shadow-xs overflow-hidden">
            {/* Calendar Controls */}
            <div className="px-5 py-4 border-b border-[--color-border] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-[--color-text-primary]">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex items-center gap-1 border border-[--color-border] rounded-[--radius-md] overflow-hidden">
                  <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-1.5 hover:bg-[--color-surface] text-[--color-text-secondary] transition-colors"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-2 py-1 text-xs font-medium text-[--color-text-secondary] hover:bg-[--color-surface] border-x border-[--color-border]"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-1.5 hover:bg-[--color-surface] text-[--color-text-secondary] transition-colors"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs text-[--color-text-tertiary]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Presentation
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500" /> Review
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> Deadline
                </span>
              </div>
            </div>

            {viewMode === 'month' ? (
              <div className="p-4">
                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 mb-2 text-center text-xs font-semibold text-[--color-text-tertiary] uppercase tracking-wider">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                </div>

                {/* Day Grid */}
                <div className="grid grid-cols-7 border-t border-l border-[--color-border]">
                  {paddingDays.map((_, i) => (
                    <div
                      key={`pad-${i}`}
                      className="min-h-[90px] bg-[--color-surface] border-r border-b border-[--color-border] opacity-40"
                    />
                  ))}

                  {daysInMonth.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd')
                    const dayEvents = eventsByDate.get(dateKey) || []
                    const isSelected = isSameDay(day, selectedDate)
                    const isCurrentDay = isToday(day)

                    return (
                      <div
                        key={dateKey}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          'min-h-[90px] p-1.5 border-r border-b border-[#E5E7EB] cursor-pointer transition-colors relative flex flex-col',
                          isSelected ? 'bg-[#EEF2FF]/60' : 'hover:bg-[#F7F7F5]',
                          isCurrentDay && 'font-semibold'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              'text-xs px-1.5 py-0.5 rounded-full inline-block',
                              isCurrentDay
                                ? 'bg-[#4338CA] text-white font-bold'
                                : isSelected
                                ? 'text-[#4338CA] font-bold'
                                : 'text-[#4B5563]'
                            )}
                          >
                            {format(day, 'd')}
                          </span>
                          {dayEvents.length > 0 && (
                            <span className="text-[10px] text-[#6B7280]">
                              {dayEvents.length}
                            </span>
                          )}
                        </div>

                        {/* Event chips */}
                        <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                          {dayEvents.slice(0, 2).map((ev) => {
                            const typeCfg = EVENT_TYPE_CONFIG[ev.event_type] || EVENT_TYPE_CONFIG.other
                            return (
                              <div
                                key={ev.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedEvent(ev)
                                }}
                                className={cn(
                                  'text-[10px] truncate px-1.5 py-0.5 rounded border leading-tight font-medium hover:opacity-85',
                                  typeCfg.bg,
                                  typeCfg.text,
                                  typeCfg.border
                                )}
                              >
                                {ev.time ? `${ev.time} ` : ''}
                                {ev.title}
                              </div>
                            )
                          })}
                          {dayEvents.length > 2 && (
                            <div className="text-[9px] text-[--color-text-tertiary] pl-1 font-medium">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* Agenda View */
              <div className="divide-y divide-[--color-border]">
                {events.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[--color-text-tertiary]">
                    No events scheduled yet.
                  </div>
                ) : (
                  events.map((ev) => {
                    const typeCfg = EVENT_TYPE_CONFIG[ev.event_type] || EVENT_TYPE_CONFIG.other
                    const evPast = isPast(parseISO(`${ev.date}T23:59:59`))
                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className={cn(
                          'p-4 hover:bg-[--color-surface] cursor-pointer flex items-start gap-4 transition-colors',
                          evPast && 'opacity-65'
                        )}
                      >
                        <div className="text-center w-14 flex-shrink-0">
                          <div className="text-xs font-bold uppercase text-[--color-accent]">
                            {format(parseISO(ev.date), 'MMM')}
                          </div>
                          <div className="text-lg font-bold text-[--color-text-primary]">
                            {format(parseISO(ev.date), 'dd')}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-[--color-text-primary]">
                              {ev.title}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] font-medium px-2 py-0.5 rounded-full border',
                                typeCfg.bg,
                                typeCfg.text,
                                typeCfg.border
                              )}
                            >
                              {typeCfg.label}
                            </span>
                            {evPast && (
                              <span className="text-[10px] text-gray-500 font-medium">
                                Past
                              </span>
                            )}
                          </div>

                          {ev.description && (
                            <p className="text-xs text-[--color-text-secondary] mt-1 line-clamp-2">
                              {ev.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 mt-2 text-xs text-[--color-text-tertiary] flex-wrap">
                            {ev.time && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> {ev.time}
                              </span>
                            )}
                            {ev.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" /> {ev.location}
                              </span>
                            )}
                            {ev.meeting_link && (
                              <a
                                href={ev.meeting_link}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-[--color-accent] hover:underline"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> Meeting Link
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar: Selected Day & Upcoming Events (1 Column) */}
          <div className="space-y-6">
            {/* Selected Date Card */}
            <div className="bg-white border border-[--color-border] rounded-[--radius-lg] p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[--color-border]">
                <div>
                  <h3 className="text-sm font-semibold text-[--color-text-primary]">
                    {format(selectedDate, 'EEEE')}
                  </h3>
                  <p className="text-xs text-[--color-text-tertiary]">
                    {format(selectedDate, 'MMMM d, yyyy')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setEventForm((f) => ({ ...f, date: format(selectedDate, 'yyyy-MM-dd') }))
                    setIsAddModalOpen(true)
                  }}
                  className="text-[--color-accent]"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>

              <div className="mt-3 space-y-2">
                {selectedDayEvents.length === 0 ? (
                  <p className="text-xs text-[--color-text-tertiary] text-center py-4">
                    No events scheduled for this day.
                  </p>
                ) : (
                  selectedDayEvents.map((ev) => {
                    const typeCfg = EVENT_TYPE_CONFIG[ev.event_type] || EVENT_TYPE_CONFIG.other
                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className="p-2.5 rounded-[--radius-md] border border-[--color-border] hover:border-[--color-border-strong] cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[--color-text-primary] truncate">
                            {ev.title}
                          </span>
                          <span
                            className={cn(
                              'text-[9px] px-1.5 py-0.5 rounded border flex-shrink-0',
                              typeCfg.bg,
                              typeCfg.text,
                              typeCfg.border
                            )}
                          >
                            {typeCfg.label}
                          </span>
                        </div>
                        {ev.time && (
                          <div className="text-[11px] text-[--color-text-tertiary] mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {ev.time}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Upcoming Deadlines & Presentations */}
            <div className="bg-white border border-[--color-border] rounded-[--radius-lg] p-4 shadow-xs">
              <h3 className="text-sm font-semibold text-[--color-text-primary] mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[--color-warning]" /> Upcoming Deadlines
              </h3>
              <div className="space-y-3">
                {upcomingEvents.length === 0 ? (
                  <p className="text-xs text-[--color-text-tertiary] text-center py-3">
                    No upcoming deadlines or presentations.
                  </p>
                ) : (
                  upcomingEvents.map((ev) => {
                    const typeCfg = EVENT_TYPE_CONFIG[ev.event_type] || EVENT_TYPE_CONFIG.other
                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className="flex items-start gap-2.5 cursor-pointer hover:opacity-85 text-left"
                      >
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                            typeCfg.dot
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-[--color-text-primary] truncate">
                            {ev.title}
                          </div>
                          <div className="text-[11px] text-[--color-text-tertiary]">
                            {formatDate(ev.date, 'MMM d, yyyy')}
                            {ev.time ? ` at ${ev.time}` : ''}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <Modal
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title="Event Details"
          size="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="danger"
                size="sm"
                loading={deleteEventMutation.isPending}
                onClick={() => deleteEventMutation.mutate(selectedEvent.id)}
              >
                Delete Event
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded border',
                    EVENT_TYPE_CONFIG[selectedEvent.event_type].bg,
                    EVENT_TYPE_CONFIG[selectedEvent.event_type].text,
                    EVENT_TYPE_CONFIG[selectedEvent.event_type].border
                  )}
                >
                  {EVENT_TYPE_CONFIG[selectedEvent.event_type].label}
                </span>
                {isPast(parseISO(`${selectedEvent.date}T23:59:59`)) && (
                  <span className="text-xs text-[--color-danger] font-medium">Passed</span>
                )}
              </div>
              <h2 className="text-base font-bold text-[--color-text-primary]">
                {selectedEvent.title}
              </h2>
            </div>

            {selectedEvent.description && (
              <p className="text-sm text-[--color-text-secondary]">
                {selectedEvent.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs bg-[--color-surface] p-3 rounded-[--radius-md]">
              <div>
                <span className="text-[--color-text-tertiary]">Date:</span>
                <p className="font-medium text-[--color-text-primary] mt-0.5">
                  {formatDate(selectedEvent.date, 'MMMM d, yyyy')}
                </p>
              </div>
              <div>
                <span className="text-[--color-text-tertiary]">Time:</span>
                <p className="font-medium text-[--color-text-primary] mt-0.5">
                  {selectedEvent.time || 'All Day / Not set'}
                </p>
              </div>
              {selectedEvent.location && (
                <div>
                  <span className="text-[--color-text-tertiary]">Location:</span>
                  <p className="font-medium text-[--color-text-primary] mt-0.5">
                    {selectedEvent.location}
                  </p>
                </div>
              )}
              {selectedEvent.meeting_link && (
                <div>
                  <span className="text-[--color-text-tertiary]">Link:</span>
                  <p className="font-medium text-[--color-text-primary] mt-0.5">
                    <a
                      href={selectedEvent.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[--color-accent] hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Open Meeting
                    </a>
                  </p>
                </div>
              )}
            </div>

            {selectedEvent.notes && (
              <div>
                <h4 className="text-xs font-semibold text-[--color-text-secondary] uppercase tracking-wider mb-1">
                  Preparation & Notes
                </h4>
                <div className="text-xs text-[--color-text-primary] bg-gray-50 p-2.5 rounded border border-[--color-border]">
                  {selectedEvent.notes}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Add Event Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={() => {
          setTitleError(null)
          setIsAddModalOpen(false)
        }}
        title="Schedule Project Event"
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setTitleError(null)
                setIsAddModalOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={createEventMutation.isPending}
              onClick={() => {
                if (!eventForm.title?.trim()) {
                  setTitleError('Event title is required.')
                  return
                }
                setTitleError(null)
                createEventMutation.mutate(eventForm)
              }}
            >
              Save Event
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Event Title *"
            value={eventForm.title || ''}
            error={titleError || undefined}
            onChange={(e) => {
              setTitleError(null)
              setEventForm((f) => ({ ...f, title: e.target.value }))
            }}
            placeholder="e.g. Mid-Term Viva Presentation"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Event Type"
              options={Object.entries(EVENT_TYPE_CONFIG).map(([k, v]) => ({
                value: k,
                label: v.label,
              }))}
              value={eventForm.event_type || 'presentation'}
              onChange={(e) =>
                setEventForm((f) => ({
                  ...f,
                  event_type: e.target.value as CalendarEvent['event_type'],
                }))
              }
            />

            <Select
              label="Related Phase"
              placeholder="None / Independent"
              options={phases.map((p) => ({
                value: p.id,
                label: `Phase ${p.phase_number}: ${p.name}`,
              }))}
              value={eventForm.phase_id || ''}
              onChange={(e) =>
                setEventForm((f) => ({ ...f, phase_id: e.target.value || null }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date *"
              type="date"
              value={eventForm.date || ''}
              onChange={(e) => setEventForm((f) => ({ ...f, date: e.target.value }))}
              required
            />
            <Input
              label="Time"
              type="time"
              value={eventForm.time || ''}
              onChange={(e) => setEventForm((f) => ({ ...f, time: e.target.value || null }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Venue / Classroom"
              placeholder="e.g. Lab 4B / Seminar Hall"
              value={eventForm.location || ''}
              onChange={(e) => setEventForm((f) => ({ ...f, location: e.target.value || null }))}
            />
            <Input
              label="Online Meeting Link"
              placeholder="https://meet.google.com/..."
              value={eventForm.meeting_link || ''}
              onChange={(e) =>
                setEventForm((f) => ({ ...f, meeting_link: e.target.value || null }))
              }
            />
          </div>

          <Textarea
            label="Description & Agenda"
            value={eventForm.description || ''}
            onChange={(e) =>
              setEventForm((f) => ({ ...f, description: e.target.value || null }))
            }
            rows={2}
          />

          <Textarea
            label="Faculty Guidelines & Preparation Notes"
            value={eventForm.notes || ''}
            onChange={(e) => setEventForm((f) => ({ ...f, notes: e.target.value || null }))}
            rows={2}
            placeholder="Items team must bring or prepare..."
          />
        </div>
      </Modal>
    </div>
  )
}
