import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  AlertCircle,
  Clock,
  FileText,
  MessageSquare,
  CheckCircle2,
  Trash2,
  ExternalLink
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProjectStore, useAuthStore } from '@/lib/store'
import {
  Button,
  Badge,
  EmptyState,
  Spinner,
  Tabs
} from '@/components/ui'
import { cn, formatRelativeDate } from '@/lib/utils'
import type { Database } from '@/lib/database.types'

type Notification = Database['public']['Tables']['notifications']['Row']

export default function NotificationsPage() {
  const { currentProject } = useProjectStore()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', currentProject?.id, user?.id],
    queryFn: async () => {
      if (!currentProject?.id || !user?.id) return []
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Notification[]
    },
    enabled: !!currentProject?.id && !!user?.id,
  })

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentProject?.id, user?.id] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!currentProject?.id || !user?.id) return
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('project_id', currentProject.id)
        .eq('user_id', user.id)
        .eq('is_read', false)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentProject?.id, user?.id] })
    },
  })

  const filteredNotifications = notifications.filter((n) =>
    filter === 'unread' ? !n.is_read : true
  )

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (!currentProject) {
    return (
      <div className="p-8">
        <EmptyState
          title="No Project Selected"
          description="Select a project to review your notifications and assigned tasks."
        />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[--color-text-primary] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[--color-accent]" />
            Notifications & Updates
          </h1>
          <p className="text-sm text-[--color-text-secondary] mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification(s)` : 'All caught up!'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              loading={markAllAsReadMutation.isPending}
              onClick={() => markAllAsReadMutation.mutate()}
              className="flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'all', label: 'All Updates', count: notifications.length },
          { id: 'unread', label: 'Unread', count: unreadCount },
        ]}
        active={filter}
        onChange={(id) => setFilter(id as 'all' | 'unread')}
      />

      {/* Notifications List */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          title={filter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
          description="Updates about task assignments, deadlines, reviews, and faculty feedback will appear here."
        />
      ) : (
        <div className="bg-white border border-[--color-border] rounded-[--radius-xl] divide-y divide-[--color-border] overflow-hidden shadow-xs">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                'p-4 flex items-start justify-between gap-4 transition-colors',
                !notif.is_read ? 'bg-blue-50/30' : 'hover:bg-[--color-surface]'
              )}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                    !notif.is_read ? 'bg-[--color-accent]' : 'bg-transparent'
                  )}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[--color-text-primary]">
                      {notif.title}
                    </span>
                    <span className="text-[10px] text-[--color-text-tertiary]">
                      {formatRelativeDate(notif.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-[--color-text-secondary] mt-1 leading-relaxed">
                    {notif.body}
                  </p>

                  {notif.link && (
                    <div className="mt-2">
                      <Link
                        to={notif.link}
                        onClick={() => {
                          if (!notif.is_read) markAsReadMutation.mutate(notif.id)
                        }}
                        className="text-xs text-[--color-accent] hover:underline font-medium inline-flex items-center gap-1"
                      >
                        View relevant record <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {!notif.is_read && (
                <button
                  onClick={() => markAsReadMutation.mutate(notif.id)}
                  className="text-xs text-[--color-text-tertiary] hover:text-[--color-text-primary] px-2 py-1 rounded hover:bg-white"
                  title="Mark as read"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
