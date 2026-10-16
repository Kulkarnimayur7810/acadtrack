import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { cn, formatRelativeDate } from '@/lib/utils'
import { useProjectStore, useUIStore, useAuthStore } from '@/lib/store'
import { Avatar, ToastContainer } from '@/components/ui'
import {
  LayoutDashboard, ListTodo, Presentation, Calendar, Users,
  BookOpen, Target, Bell, ChevronDown, ChevronRight, Menu, X,
  Settings, Plus, LogOut, FolderKanban, Check, ExternalLink,
  Layers, AlertCircle
} from 'lucide-react'
import type { Database } from '@/lib/database.types'

type Project = Database['public']['Tables']['projects']['Row']

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/kanban', icon: ListTodo, label: 'Kanban Board' },
  { to: '/presentations', icon: Presentation, label: 'Presentations' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/research', icon: BookOpen, label: 'Research' },
  { to: '/milestones', icon: Target, label: 'Milestones' },
]

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore()
  const { currentProject, setCurrentProject } = useProjectStore()
  const { profile, user, signOut } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [projectMenuOpen, setProjectMenuOpen] = useState(false)

  // Fetch all user projects for the switcher
  const { data: userProjects = [] } = useQuery<Project[]>({
    queryKey: ['user-all-projects', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) return []
      return data || []
    },
    enabled: !!user?.id,
  })

  const isActive = (to: string) => location.pathname.startsWith(to)

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project)
    setProjectMenuOpen(false)
  }

  return (
    <div className="flex h-screen bg-[#F7F7F5] overflow-hidden text-[#202124]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-[#E5E7EB] transition-transform duration-200 ease-in-out',
          'w-60 lg:relative lg:translate-x-0 shrink-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[#E5E7EB] shrink-0 bg-white">
          <div className="w-7 h-7 rounded-[6px] bg-[#4338CA] flex items-center justify-center shrink-0 shadow-xs">
            <FolderKanban size={15} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-semibold tracking-tight text-[#202124] block truncate">AcadTrack</span>
            <span className="text-[10px] text-[#6B7280] block -mt-0.5 truncate">Academic Project Hub</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-[#9CA3AF] hover:text-[#202124] p-1 rounded transition-colors"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Project switcher dropdown */}
        <div className="px-3 py-2.5 border-b border-[#E5E7EB] shrink-0 relative bg-white">
          <button
            onClick={() => setProjectMenuOpen(!projectMenuOpen)}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-[6px] border border-[#E5E7EB] bg-[#F7F7F5] hover:bg-[#F1F1EE] hover:border-[#D1D5DB] transition-all text-left"
            aria-expanded={projectMenuOpen}
            aria-haspopup="true"
          >
            <div className="w-5 h-5 rounded-[4px] bg-[#4338CA] text-white shrink-0 flex items-center justify-center text-[10px] font-bold">
              {currentProject?.title?.slice(0, 1).toUpperCase() || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-[#202124] block truncate">
                {currentProject?.title || 'Select a project'}
              </span>
            </div>
            <ChevronDown size={13} className={cn("text-[#9CA3AF] shrink-0 transition-transform duration-150", projectMenuOpen && "rotate-180")} />
          </button>

          {projectMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProjectMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute left-3 right-3 top-full mt-1.5 bg-white border border-[--color-border] rounded-[--radius-lg] shadow-xl z-50 py-1.5 max-h-64 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[--color-text-tertiary]">
                  Switch Project
                </div>
                {userProjects.length > 0 ? (
                  userProjects.map((p) => {
                    const isCurrent = p.id === currentProject?.id
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSelectProject(p)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors',
                          isCurrent
                            ? 'bg-[--color-accent-light] text-[--color-accent] font-medium'
                            : 'text-[--color-text-secondary] hover:bg-[--color-surface] hover:text-[--color-text-primary]'
                        )}
                      >
                        <div className={cn(
                          'w-4 h-4 rounded text-[9px] flex items-center justify-center font-bold shrink-0',
                          isCurrent ? 'bg-[--color-accent] text-white' : 'bg-gray-200 text-gray-700'
                        )}>
                          {p.title?.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="flex-1 truncate">{p.title}</span>
                        {isCurrent && <Check size={12} className="text-[--color-accent] shrink-0" />}
                      </button>
                    )
                  })
                ) : (
                  <div className="px-3 py-2 text-xs text-[--color-text-tertiary]">No other projects</div>
                )}
                <div className="my-1 border-t border-[--color-border]" />
                <Link
                  to="/projects"
                  onClick={() => setProjectMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-[--color-text-secondary] hover:bg-[--color-surface] hover:text-[--color-text-primary]"
                >
                  <Layers size={13} className="text-[--color-text-tertiary]" />
                  <span>All Projects</span>
                </Link>
                <Link
                  to="/projects/new"
                  onClick={() => setProjectMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-[--color-accent] hover:bg-[--color-accent-light] font-medium"
                >
                  <Plus size={13} />
                  <span>Create New Project</span>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 bg-white" role="navigation">
          <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
            Workspace
          </div>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const active = isActive(to)
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-xs font-medium transition-colors relative',
                  active
                    ? 'bg-[#EEF2FF] text-[#4338CA] font-semibold border-l-2 border-l-[#4338CA]'
                    : 'text-[#6B7280] hover:bg-[#F7F7F5] hover:text-[#202124]'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={16} className={cn('shrink-0', active ? 'text-[#4338CA]' : 'text-[#9CA3AF]')} />
                <span className="truncate">{label}</span>
              </Link>
            )
          })}

          <div className="pt-3 mt-3 border-t border-[#E5E7EB] space-y-1">
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Quick Actions
            </div>
            <Link
              to="/projects/new"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-xs font-medium text-[#6B7280] hover:bg-[#F7F7F5] hover:text-[#202124] transition-colors"
            >
              <Plus size={16} className="text-[#9CA3AF]" />
              <span>New Project</span>
            </Link>
            <Link
              to="/settings"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-xs font-medium transition-colors',
                isActive('/settings')
                  ? 'bg-[#EEF2FF] text-[#4338CA] font-semibold border-l-2 border-l-[#4338CA]'
                  : 'text-[#6B7280] hover:bg-[#F7F7F5] hover:text-[#202124]'
              )}
            >
              <Settings size={16} className={cn('shrink-0', isActive('/settings') ? 'text-[#4338CA]' : 'text-[#9CA3AF]')} />
              <span>Settings</span>
            </Link>
          </div>
        </nav>

        {/* User profile footer */}
        <div className="px-3 py-3 border-t border-[#E5E7EB] shrink-0 bg-[#F7F7F5]">
          <div className="flex items-center gap-2.5">
            <Avatar name={profile?.full_name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#202124] truncate leading-tight">
                {profile?.full_name || 'Academic Scholar'}
              </p>
              <p className="text-[11px] text-[#6B7280] truncate leading-tight mt-0.5">
                {profile?.email || user?.email || 'Logged in'}
              </p>
            </div>
            <button
              onClick={() => {
                signOut()
                navigate('/login')
              }}
              className="p-1 rounded text-[#9CA3AF] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors shrink-0"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F7F7F5]">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-[#E5E7EB] bg-white shrink-0 lg:px-6 shadow-xs">
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-[#6B7280] hover:text-[#202124] transition-colors p-1 rounded"
            aria-label="Toggle navigation menu"
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-2 text-xs min-w-0 flex-1">
            <Link
              to="/dashboard"
              className="text-[#6B7280] hover:text-[#202124] font-medium truncate max-w-[200px]"
            >
              {currentProject?.title || 'Academic Projects'}
            </Link>
            {location.pathname !== '/dashboard' && (
              <>
                <ChevronRight size={13} className="text-[#9CA3AF] shrink-0" />
                <span className="text-[#202124] font-semibold capitalize truncate">
                  {location.pathname.slice(1).replace(/-/g, ' ')}
                </span>
              </>
            )}
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-2 shrink-0">
            <NotificationsButton projectId={currentProject?.id} userId={user?.id} />
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto bg-[#F7F7F5]">
          {children}
        </main>
      </div>

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  )
}

function NotificationsButton({ projectId, userId }: { projectId?: string; userId?: string }) {
  const [open, setOpen] = useState(false)

  const { data: notifications = [] } = useQuery<Database['public']['Tables']['notifications']['Row'][]>({
    queryKey: ['notifications-badge', projectId, userId],
    queryFn: async () => {
      if (!projectId || !userId) return []
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(4)
      if (error) return []
      return data || []
    },
    enabled: !!projectId && !!userId,
  })

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-8 h-8 flex items-center justify-center rounded-[--radius-md] border border-[--color-border] bg-white text-[--color-text-secondary] hover:bg-[--color-surface] hover:text-[--color-text-primary] transition-colors"
        aria-label="View notifications"
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[--color-danger] text-white text-[9px] font-bold flex items-center justify-center shadow-xs"
            aria-label={`${unreadCount} unread`}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-full mt-1.5 w-80 bg-white border border-[--color-border] rounded-[--radius-lg] shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
            <div className="px-4 py-2.5 border-b border-[--color-border] flex items-center justify-between bg-[--color-surface]">
              <span className="text-xs font-semibold text-[--color-text-primary]">Notifications</span>
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-[--color-accent] hover:underline font-medium"
              >
                View all
              </Link>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-[--color-border]">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-[--color-text-tertiary]">
                  No new notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    to={n.link || '/notifications'}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'block px-4 py-2.5 hover:bg-[--color-surface] transition-colors',
                      !n.is_read && 'bg-[--color-accent-light]/20'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-[--color-text-primary] truncate">{n.title}</p>
                      <span className="text-[10px] text-[--color-text-tertiary] shrink-0">
                        {formatRelativeDate(n.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-[--color-text-secondary] mt-0.5 line-clamp-2">{n.body}</p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
