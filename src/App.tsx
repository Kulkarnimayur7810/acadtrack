import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore, useProjectStore } from '@/lib/store'

import { AppShell } from '@/components/AppShell'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ProjectsListPage from '@/pages/projects/ProjectsListPage'
import NewProjectPage from '@/pages/projects/NewProjectPage'
import DashboardPage from '@/pages/DashboardPage'
import KanbanPage from '@/pages/KanbanPage'
import PresentationsPage from '@/pages/PresentationsPage'
import CalendarPage from '@/pages/CalendarPage'
import TeamPage from '@/pages/TeamPage'
import MilestonesPage from '@/pages/MilestonesPage'
import ResearchPage from '@/pages/ResearchPage'
import NotificationsPage from '@/pages/NotificationsPage'
import SettingsPage from '@/pages/SettingsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
})

function AuthSync({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setProfile } = useAuthStore()

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const fetchProfile = async (userId: string) => {
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
        if (data) setProfile(data)
      } catch {
        // ignore profile fetch error
      }
    }

    // Initialize session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
    }).catch((err: any) => {
      console.warn('[Supabase Auth] Session fetch failed:', err)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setSession, setProfile])

  return <>{children}</>
}

// Protected route wrapper
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session } = useAuthStore()
  const location = useLocation()

  // Only enforce login redirection if Supabase is actively configured
  if (isSupabaseConfigured && !session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthSync>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Application Routes wrapped in AppShell */}
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <AppShell>
                    <DashboardPage />
                  </AppShell>
                </RequireAuth>
              }
            />
            <Route
              path="/kanban"
              element={
                <RequireAuth>
                  <AppShell>
                    <KanbanPage />
                  </AppShell>
                </RequireAuth>
              }
            />
            <Route
              path="/presentations"
              element={
                <RequireAuth>
                  <AppShell>
                    <PresentationsPage />
                  </AppShell>
                </RequireAuth>
              }
            />
            <Route
              path="/calendar"
              element={
                <RequireAuth>
                  <AppShell>
                    <CalendarPage />
                  </AppShell>
                </RequireAuth>
              }
            />
            <Route
              path="/team"
              element={
                <RequireAuth>
                  <AppShell>
                    <TeamPage />
                  </AppShell>
                </RequireAuth>
              }
            />
            <Route
              path="/milestones"
              element={
                <RequireAuth>
                  <AppShell>
                    <MilestonesPage />
                  </AppShell>
                </RequireAuth>
              }
            />
            <Route
              path="/research"
              element={
                <RequireAuth>
                  <AppShell>
                    <ResearchPage />
                  </AppShell>
                </RequireAuth>
              }
            />
            <Route
              path="/notifications"
              element={
                <RequireAuth>
                  <AppShell>
                    <NotificationsPage />
                  </AppShell>
                </RequireAuth>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireAuth>
                  <AppShell>
                    <SettingsPage />
                  </AppShell>
                </RequireAuth>
              }
            />
            <Route
              path="/projects"
              element={
                <RequireAuth>
                  <AppShell>
                    <ProjectsListPage />
                  </AppShell>
                </RequireAuth>
              }
            />
            <Route
              path="/projects/new"
              element={
                <RequireAuth>
                  <AppShell>
                    <NewProjectPage />
                  </AppShell>
                </RequireAuth>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthSync>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
