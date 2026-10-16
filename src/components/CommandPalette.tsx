import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  LayoutDashboard,
  ListTodo,
  Calendar,
  Users,
  Target,
  BookOpen,
  FolderKanban,
  Plus,
  Sparkles,
  Settings,
  ArrowRight,
  Folder,
  Command,
  X
} from 'lucide-react'
import { useProjectStore, useUIStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Database } from '@/lib/database.types'

type Project = Database['public']['Tables']['projects']['Row']

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  onOpenTaskModal: () => void
  onOpenAvatarModal: () => void
}

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  action: () => void
  category: 'Actions' | 'Navigation' | 'Projects'
}

export function CommandPalette({
  open,
  onClose,
  onOpenTaskModal,
  onOpenAvatarModal,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { currentProject, projects, setCurrentProject } = useProjectStore()

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Build commands
  const allCommands: CommandItem[] = [
    // Actions
    {
      id: 'action-new-task',
      label: 'Create New Task',
      description: currentProject ? `Add to ${currentProject.title}` : 'Add a new task',
      icon: Plus,
      badge: 'Action',
      category: 'Actions',
      action: () => {
        onClose()
        onOpenTaskModal()
      },
    },
    {
      id: 'action-new-project',
      label: 'Create New Project',
      description: 'Start a new personal, team, or academic project',
      icon: FolderKanban,
      badge: 'Action',
      category: 'Actions',
      action: () => {
        onClose()
        navigate('/projects/new')
      },
    },
    {
      id: 'action-avatar',
      label: 'Customize Avatar & Persona',
      description: 'Choose robot, demon, cyber, or cute avatar',
      icon: Sparkles,
      badge: 'Profile',
      category: 'Actions',
      action: () => {
        onClose()
        onOpenAvatarModal()
      },
    },

    // Navigation
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      description: 'Project overview, metrics & next actions',
      icon: LayoutDashboard,
      category: 'Navigation',
      action: () => {
        onClose()
        navigate('/dashboard')
      },
    },
    {
      id: 'nav-kanban',
      label: 'Go to Kanban Board',
      description: 'To Do, In Progress, In Review, Done',
      icon: ListTodo,
      category: 'Navigation',
      action: () => {
        onClose()
        navigate('/kanban')
      },
    },
    {
      id: 'nav-calendar',
      label: 'Go to Calendar',
      description: 'Deadlines, deliverables & schedules',
      icon: Calendar,
      category: 'Navigation',
      action: () => {
        onClose()
        navigate('/calendar')
      },
    },
    {
      id: 'nav-team',
      label: 'Go to Team & Responsibilities',
      description: 'Member workload & contribution distribution',
      icon: Users,
      category: 'Navigation',
      action: () => {
        onClose()
        navigate('/team')
      },
    },
    {
      id: 'nav-milestones',
      label: 'Go to Milestones',
      description: 'Weighted progress and project milestones',
      icon: Target,
      category: 'Navigation',
      action: () => {
        onClose()
        navigate('/milestones')
      },
    },
    {
      id: 'nav-research',
      label: 'Go to Research & Literature',
      description: 'Track papers, reports & experiments',
      icon: BookOpen,
      category: 'Navigation',
      action: () => {
        onClose()
        navigate('/research')
      },
    },
    {
      id: 'nav-settings',
      label: 'Go to Project Settings',
      description: 'Configure details, dates & preferences',
      icon: Settings,
      category: 'Navigation',
      action: () => {
        onClose()
        navigate('/settings')
      },
    },
  ]

  // Add projects list to switcher
  projects.forEach(p => {
    allCommands.push({
      id: `project-${p.id}`,
      label: `Switch to: ${p.title}`,
      description: p.description || 'Active Workspace Project',
      icon: Folder,
      badge: p.id === currentProject?.id ? 'Current' : 'Project',
      category: 'Projects',
      action: () => {
        setCurrentProject(p)
        onClose()
        navigate('/dashboard')
      },
    })
  })

  // Filter commands by search query
  const filtered = allCommands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    (cmd.description && cmd.description.toLowerCase().includes(query.toLowerCase()))
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 overflow-y-auto bg-black/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E5E7EB]">
          <Search className="w-5 h-5 text-[#9CA3AF] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search actions..."
            className="w-full text-sm font-medium text-[#202124] placeholder:text-[#9CA3AF] bg-transparent focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-[#9CA3AF] hover:text-[#202124] p-1 rounded transition-colors"
            >
              <X size={15} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-[#9CA3AF] bg-[#F1F1EE] px-1.5 py-0.5 rounded border border-[#E5E7EB]">
              ESC
            </kbd>
          )}
        </div>

        {/* Command list */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#9CA3AF]">
              No matching commands or pages found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon
              const isSelected = selectedIndex === idx

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer',
                    isSelected
                      ? 'bg-[#EEF2FF] text-[#4338CA]'
                      : 'text-[#202124] hover:bg-[#F7F7F5]'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                      isSelected ? 'bg-[#4338CA] text-white' : 'bg-[#F1F1EE] text-[#6B7280]'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold truncate block">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={cn(
                            'text-[9px] font-bold uppercase px-1.5 py-0.2 rounded',
                            isSelected
                              ? 'bg-white/80 text-[#4338CA]'
                              : 'bg-[#F1F1EE] text-[#6B7280]'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-[#6B7280] truncate leading-tight mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {isSelected && (
                    <ArrowRight className="w-4 h-4 text-[#4338CA] shrink-0" />
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#E5E7EB] bg-[#F7F7F5] text-[11px] text-[#9CA3AF]">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Dismiss</span>
          </div>
          <span className="font-medium text-[#6B7280]">AcadTrack Quick Command</span>
        </div>
      </div>
    </div>
  )
}
