import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useProjectStore, useUIStore, useAuthStore } from '@/lib/store'
import { Avatar, Badge } from '@/components/ui'
import {
  LayoutDashboard, ListTodo, Presentation, Calendar, Users,
  BookOpen, Target, Bell, ChevronDown, ChevronRight, Menu, X,
  Settings, Plus, LogOut, FolderKanban
} from 'lucide-react'

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
  const { currentProject } = useProjectStore()
  const { profile, signOut } = useAuthStore()
  const location = useLocation()
  const [projectMenuOpen, setProjectMenuOpen] = useState(false)

  const isActive = (to: string) => location.pathname.startsWith(to)

  return (
    <div className="flex h-screen bg-[--color-background] overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-[--color-border] transition-transform duration-200',
          'w-56 lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[--color-border] flex-shrink-0">
          <div className="w-7 h-7 rounded-[--radius-md] bg-[--color-accent] flex items-center justify-center flex-shrink-0">
            <FolderKanban size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-[--color-text-primary] truncate">AcadTrack</span>
          <button
            onClick={toggleSidebar}
            className="ml-auto lg:hidden text-[--color-text-tertiary] hover:text-[--color-text-primary]"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Project selector */}
        <div className="px-3 py-2 border-b border-[--color-border] flex-shrink-0 relative">
          <button
            onClick={() => setProjectMenuOpen(!projectMenuOpen)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[--radius-md] hover:bg-[--color-surface] transition-colors text-left"
            aria-expanded={projectMenuOpen}
          >
            <div className="w-6 h-6 rounded-[--radius-sm] bg-[--color-accent-muted] flex-shrink-0 flex items-center justify-center">
              <span className="text-[9px] font-bold text-[--color-accent]">
                {currentProject?.title?.slice(0, 2).toUpperCase() || 'P'}
              </span>
            </div>
            <span className="flex-1 text-xs font-medium text-[--color-text-primary] truncate">
              {currentProject?.title || 'Select Project'}
            </span>
            <ChevronDown size={12} className={cn("text-[--color-text-tertiary] flex-shrink-0 transition-transform", projectMenuOpen && "rotate-180")} />
          </button>

          {projectMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProjectMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-[--color-border] rounded-[--radius-md] shadow-lg z-50 py-1 max-h-56 overflow-y-auto">
                <Link
                  to="/projects"
                  onClick={() => setProjectMenuOpen(false)}
                  className="block px-3 py-1.5 text-xs text-[--color-text-secondary] hover:bg-[--color-surface] hover:text-[--color-text-primary]"
                >
                  📁 All Projects
                </Link>
                <Link
                  to="/projects/new"
                  onClick={() => setProjectMenuOpen(false)}
                  className="block px-3 py-1.5 text-xs text-[--color-accent] hover:bg-[--color-surface] font-medium"
                >
                  ➕ Create New Project
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-2" role="navigation">
          <div className="space-y-0.5">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-[--radius-md] text-sm transition-colors',
                  isActive(to)
                    ? 'bg-[--color-accent-light] text-[--color-accent] font-medium'
                    : 'text-[--color-text-secondary] hover:bg-[--color-surface] hover:text-[--color-text-primary]'
                )}
                aria-current={isActive(to) ? 'page' : undefined}
              >
                <Icon size={15} className="flex-shrink-0" />
                {label}
              </Link>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-[--color-border] space-y-0.5">
            <Link
              to="/projects/new"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-[--radius-md] text-sm text-[--color-text-tertiary] hover:bg-[--color-surface] hover:text-[--color-text-primary] transition-colors"
            >
              <Plus size={15} />
              New Project
            </Link>
            <Link
              to="/settings"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-[--radius-md] text-sm text-[--color-text-tertiary] hover:bg-[--color-surface] hover:text-[--color-text-primary] transition-colors"
            >
              <Settings size={15} />
              Settings
            </Link>
          </div>
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-[--color-border] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Avatar name={profile?.full_name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[--color-text-primary] truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-[11px] text-[--color-text-tertiary] truncate">
                {profile?.email || ''}
              </p>
            </div>
            <button
              onClick={signOut}
              className="text-[--color-text-tertiary] hover:text-[--color-text-primary] transition-colors flex-shrink-0"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-2.5 border-b border-[--color-border] bg-white flex-shrink-0 lg:px-6">
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-[--color-text-tertiary] hover:text-[--color-text-primary] transition-colors p-1"
            aria-label="Toggle menu"
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm min-w-0 flex-1">
            <span className="text-[--color-text-tertiary] truncate">{currentProject?.title || 'No project'}</span>
            {location.pathname !== '/dashboard' && (
              <>
                <ChevronRight size={12} className="text-[--color-text-tertiary] flex-shrink-0" />
                <span className="text-[--color-text-primary] font-medium capitalize truncate">
                  {location.pathname.slice(1).replace(/-/g, ' ')}
                </span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <NotificationsButton />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[--color-surface]">
          {children}
        </main>
      </div>
    </div>
  )
}

function NotificationsButton() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-8 h-8 flex items-center justify-center rounded-[--radius-md] text-[--color-text-secondary] hover:bg-[--color-surface] hover:text-[--color-text-primary] transition-colors"
        aria-label="Notifications"
      >
        <Bell size={16} />
        <span className="absolute top-1 right-1 w-2 h-2 bg-[--color-danger] rounded-full" aria-hidden="true" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-full mt-1.5 w-80 bg-white border border-[--color-border] rounded-[--radius-lg] shadow-[--shadow-lg] z-20 overflow-hidden">
            <div className="px-4 py-3 border-b border-[--color-border] flex items-center justify-between">
              <span className="text-sm font-semibold">Notifications</span>
              <Link to="/notifications" onClick={() => setOpen(false)} className="text-xs text-[--color-accent] hover:underline">View all</Link>
            </div>
            <div className="px-4 py-8 text-center text-sm text-[--color-text-tertiary]">
              No new notifications
            </div>
          </div>
        </>
      )}
    </div>
  )
}
