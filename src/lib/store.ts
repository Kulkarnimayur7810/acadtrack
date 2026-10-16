import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import type { Database } from './database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Project = Database['public']['Tables']['projects']['Row']

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  signOut: () => set({ user: null, session: null, profile: null }),
}))

interface ProjectState {
  currentProject: Project | null
  projects: Project[]
  setCurrentProject: (project: Project | null) => void
  setProjects: (projects: Project[]) => void
  updateProject: (project: Partial<Project> & { id: string }) => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      currentProject: null,
      projects: [],
      setCurrentProject: (project) => set({ currentProject: project }),
      setProjects: (projects) => set({ projects }),
      updateProject: (updated) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === updated.id ? { ...p, ...updated } : p
          ),
          currentProject:
            state.currentProject?.id === updated.id
              ? { ...state.currentProject, ...updated }
              : state.currentProject,
        })),
    }),
    {
      name: 'project-storage',
      partialize: (state) => ({ currentProject: state.currentProject }),
    }
  )
)

export interface ToastItem {
  id: string
  title?: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface UIState {
  sidebarOpen: boolean
  activeModal: string | null
  toasts: ToastItem[]
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  openModal: (name: string) => void
  closeModal: () => void
  addToast: (toast: Omit<ToastItem, 'id'>) => string
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeModal: null,
  toasts: [],
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),
  addToast: (toast) => {
    const id = crypto.randomUUID()
    const newToast: ToastItem = { id, duration: 4000, type: 'info', ...toast }
    set((state) => ({ toasts: [...state.toasts, newToast] }))
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
      }, newToast.duration)
    }
    return id
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

export function toast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', title?: string) {
  return useUIStore.getState().addToast({ message, type, title })
}
