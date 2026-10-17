import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useProjectStore, useUIStore, useAuthStore } from '@/lib/store'
import { Avatar, ToastContainer, Button } from '@/components/ui'
import {
  LayoutDashboard,
  ListTodo,
  Calendar,
  Users,
  Target,
  BookOpen,
  FolderKanban,
  Plus,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Search,
  Sparkles,
  Command,
  Bell,
  Check,
  FolderPlus,
  ExternalLink,
  Layers
} from 'lucide-react'
import type { Database } from '@/lib/database.types'
import { CommandPalette } from '@/components/CommandPalette'
import { AvatarPickerModal } from '@/components/AvatarPickerModal'
import { GlobalCreateTaskModal } from '@/components/GlobalCreateTaskModal'

type Project = Database['public']['Tables']['projects']['Row']

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/kanban', icon: ListTodo, label: 'Timeline & Kanban' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/team', icon: Users, label: 'Team & Workload' },
  { to: '/milestones', icon: Target, label: 'Milestones & Goals' },
  { to: '/research', icon: BookOpen, label: 'Research & Notes' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore()
  const { currentProject, setCurrentProject, setProjects } = useProjectStore()
  const { profile, user, signOut } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const [projectMenuOpen, setProjectMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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

  // Sync projects to store
  useEffect(() => {
    if (userProjects.length > 0) {
      setProjects(userProjects)
      if (!currentProject) {
        setCurrentProject(userProjects[0])
      }
    }
  }, [userProjects, currentProject, setProjects, setCurrentProject])

  const isActive = (to: string) => {
    if (to === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/'
    return location.pathname.startsWith(to)
  }

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project)
    setProjectMenuOpen(false)
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Sign out error:', err)
    } finally {
      signOut()
      navigate('/login')
    }
  }

  return (
    <div className="flex h-screen bg-[#F7F7F5] overflow-hidden text-[#202124]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Modern Collapsible Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-[#E5E7EB] transition-all duration-200 ease-out',
          'w-64 lg:static lg:translate-x-0 shrink-0 shadow-lg lg:shadow-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E5E7EB] shrink-0 bg-white">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 group"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="w-8 h-8 rounded-lg bg-[#4338CA] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold tracking-tight text-[#202124] block leading-none">
                ApexFlow
              </span>
              <span className="text-[10px] font-medium text-[#6B7280] block mt-0.5">
                Productivity Platform
              </span>
            </div>
          </Link>

          <button
            onClick={toggleSidebar}
            className="lg:hidden text-[#9CA3AF] hover:text-[#202124] p-1 rounded-md hover:bg-[#F7F7F5] transition-colors"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Project Switcher */}
        <div className="p-3 border-b border-[#E5E7EB] shrink-0 relative bg-white">
          <button
            onClick={() => setProjectMenuOpen(!projectMenuOpen)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[#E5E7EB] bg-[#F7F7F5] hover:bg-[#F1F1EE] hover:border-[#D1D5DB] transition-all text-left group"
            aria-expanded={projectMenuOpen}
            aria-haspopup="true"
          >
            <div className="w-6 h-6 rounded-md bg-[#4338CA] text-white shrink-0 flex items-center justify-center text-xs font-bold shadow-2xs">
              {currentProject?.title?.slice(0, 1).toUpperCase() || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-[#202124] block truncate">
                {currentProject?.title || 'Select a Project'}
              </span>
              <span className="text-[10px] text-[#6B7280] block truncate">
                {userProjects.length} {userProjects.length === 1 ? 'project' : 'projects'} available
              </span>
            </div>
            <ChevronDown
              size={14}
              className={cn(
                'text-[#9CA3AF] shrink-0 transition-transform duration-150 group-hover:text-[#202124]',
                projectMenuOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Project Switcher Dropdown */}
          {projectMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProjectMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute left-3 right-3 top-full mt-1.5 bg-white border border-[#E5E7EB] rounded-xl shadow-xl z-50 py-1.5 max-h-72 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                  Workspace Projects
                </div>

                {userProjects.length > 0 ? (
                  userProjects.map((p) => {
                    const isCurrent = p.id === currentProject?.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProject(p)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors cursor-pointer',
                          isCurrent
                            ? 'bg-[#EEF2FF] text-[#4338CA] font-semibold'
                            : 'text-[#4B5563] hover:bg-[#F7F7F5] hover:text-[#202124]'
                        )}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 rounded text-[10px] flex items-center justify-center font-bold shrink-0',
                            isCurrent ? 'bg-[#4338CA] text-white' : 'bg-[#E5E7EB] text-[#4B5563]'
                          )}
                        >
                          {p.title?.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="flex-1 truncate">{p.title}</span>
                        {isCurrent && <Check size={13} className="text-[#4338CA] shrink-0" />}
                      </button>
                    )
                  })
                ) : (
                  <div className="px-3 py-2 text-xs text-[#9CA3AF]">No projects found</div>
                )}

                <div className="my-1 border-t border-[#E5E7EB]" />

                <Link
                  to="/projects"
                  onClick={() => setProjectMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-[#4B5563] hover:bg-[#F7F7F5] hover:text-[#202124] transition-colors"
                >
                  <Layers size={14} className="text-[#9CA3AF]" />
                  <span>View All Projects</span>
                </Link>

                <Link
                  to="/projects/new"
                  onClick={() => setProjectMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-[#4338CA] hover:bg-[#EEF2FF] font-semibold transition-colors"
                >
                  <Plus size={14} />
                  <span>Create New Project</span>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 bg-white" role="navigation">
          <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
            Overview
          </div>

          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const active = isActive(to)
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all relative group',
                  active
                    ? 'bg-[#EEF2FF] text-[#4338CA] font-semibold shadow-2xs'
                    : 'text-[#4B5563] hover:bg-[#F7F7F5] hover:text-[#202124]'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon
                  size={16}
                  className={cn(
                    'shrink-0 transition-colors',
                    active ? 'text-[#4338CA]' : 'text-[#9CA3AF] group-hover:text-[#202124]'
                  )}
                />
                <span className="truncate">{label}</span>
              </Link>
            )
          })}

          <div className="pt-3 mt-3 border-t border-[#E5E7EB] space-y-1">
            <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Quick Actions
            </div>

            <button
              type="button"
              onClick={() => {
                setTaskModalOpen(true)
                setSidebarOpen(false)
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#4B5563] hover:bg-[#F7F7F5] hover:text-[#202124] transition-colors text-left"
            >
              <Plus size={16} className="text-[#9CA3AF]" />
              <span>Create Task</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAvatarModalOpen(true)
                setSidebarOpen(false)
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#4B5563] hover:bg-[#F7F7F5] hover:text-[#202124] transition-colors text-left"
            >
              <Sparkles size={16} className="text-[#9CA3AF]" />
              <span>Customize Avatar</span>
            </button>
          </div>
        </nav>

        {/* User Profile Footer Card */}
        <div className="p-3 border-t border-[#E5E7EB] shrink-0 bg-[#F7F7F5] relative">
          <div className="flex items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left p-1 rounded-lg hover:bg-white transition-colors cursor-pointer"
            >
              <Avatar
                name={profile?.full_name}
                src={profile?.avatar_url}
                size="md"
                className="shrink-0 ring-2 ring-[#4338CA]/20"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#202124] truncate leading-tight">
                  {profile?.full_name || 'Anonymous User'}
                </p>
                <p className="text-[10px] text-[#6B7280] truncate leading-tight mt-0.5">
                  {profile?.email || user?.email || 'Logged in'}
                </p>
              </div>
              <ChevronDown size={13} className="text-[#9CA3AF] shrink-0" />
            </button>

            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg text-[#9CA3AF] hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>

          {/* Profile Dropdown */}
          {profileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute left-3 right-3 bottom-full mb-2 bg-white border border-[#E5E7EB] rounded-xl shadow-xl z-50 p-2 animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-[#E5E7EB] mb-1">
                  <p className="text-xs font-bold text-[#202124] truncate">{profile?.full_name || 'My Profile'}</p>
                  <p className="text-[10px] text-[#6B7280] truncate">{profile?.email || user?.email}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false)
                    setAvatarModalOpen(true)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#4B5563] hover:bg-[#EEF2FF] hover:text-[#4338CA] rounded-lg transition-colors font-medium text-left"
                >
                  <Sparkles size={14} className="text-[#4338CA]" />
                  <span>Choose Persona Avatar</span>
                </button>

                <Link
                  to="/settings"
                  onClick={() => setProfileMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#4B5563] hover:bg-[#F7F7F5] hover:text-[#202124] rounded-lg transition-colors font-medium"
                >
                  <Settings size={14} className="text-[#9CA3AF]" />
                  <span>Account & Settings</span>
                </Link>

                <div className="my-1 border-t border-[#E5E7EB]" />

                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false)
                    handleSignOut()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-left"
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F7F7F5]">
        {/* Modern Top Bar */}
        <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[#E5E7EB] bg-white shrink-0 lg:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={toggleSidebar}
              className="lg:hidden text-[#6B7280] hover:text-[#202124] p-1.5 rounded-lg hover:bg-[#F7F7F5] transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb Context */}
            <div className="flex items-center gap-2 text-xs min-w-0">
              <Link
                to="/dashboard"
                className="text-[#6B7280] hover:text-[#202124] font-medium truncate max-w-[180px]"
              >
                {currentProject?.title || 'ApexFlow Workspace'}
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
          </div>

          {/* Quick Actions & Search */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Command Palette Trigger */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-[#F7F7F5] hover:bg-[#F1F1EE] hover:border-[#D1D5DB] text-[#6B7280] text-xs font-medium transition-all"
            >
              <Search size={14} className="text-[#9CA3AF]" />
              <span>Search actions...</span>
              <kbd className="text-[10px] font-bold text-[#9CA3AF] bg-white px-1.5 py-0.5 rounded border border-[#E5E7EB] shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {/* Global Create Task button */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setTaskModalOpen(true)}
              className="shadow-xs"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New Task</span>
            </Button>

            {/* Profile Avatar Trigger */}
            <button
              type="button"
              onClick={() => setAvatarModalOpen(true)}
              className="p-0.5 rounded-full ring-2 ring-transparent hover:ring-[#4338CA]/30 transition-all shrink-0 cursor-pointer"
              title="Customize avatar"
            >
              <Avatar
                name={profile?.full_name}
                src={profile?.avatar_url}
                size="sm"
              />
            </button>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto bg-[#F7F7F5]">
          {children}
        </main>
      </div>

      {/* Global Modals */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenTaskModal={() => setTaskModalOpen(true)}
        onOpenAvatarModal={() => setAvatarModalOpen(true)}
      />

      <AvatarPickerModal
        open={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
      />

      <GlobalCreateTaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
      />

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  )
}
