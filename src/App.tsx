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

import { Sparkles, Loader2 } from 'lucide-react'

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
  const { setUser, setSession, setProfile, setIsInitialized, setIsLoading } = useAuthStore()

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsInitialized(true)
      setIsLoading(false)
      return
    }

    let isMounted = true

    const fetchProfile = async (userId: string) => {
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
        if (data && isMounted) setProfile(data)
      } catch {
        // ignore profile fetch error
      }
    }

    // 1. Initial session check on mount (reads persisted localStorage token)
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }: any) => {
        if (!isMounted) return
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
        setIsInitialized(true)
        setIsLoading(false)
      })
      .catch((err: any) => {
        console.warn('[Supabase Auth] Session fetch failed:', err)
        if (isMounted) {
          setIsInitialized(true)
          setIsLoading(false)
        }
      })

    // 2. Listen for auth changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: string, session: any) => {
      if (!isMounted) return
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setIsInitialized(true)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [setUser, setSession, setProfile, setIsInitialized, setIsLoading])

  return <>{children}</>
}

// Protected route wrapper - waits for session resolution before redirecting
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, isInitialized } = useAuthStore()
  const location = useLocation()

  if (isSupabaseConfigured) {
    // If auth state is still resolving from localStorage, render a clean loading splash
    if (!isInitialized) {
      return (
        <div className="min-h-screen bg-[#F7F7F5] flex flex-col items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3 animate-in fade-in duration-300">
            <div className="w-10 h-10 rounded-xl bg-[#4338CA] flex items-center justify-center shadow-md animate-pulse">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs font-semibold text-[#6B7280] tracking-wide uppercase">
              Restoring session...
            </p>
          </div>
        </div>
      )
    }

    // Once initialized, if not authenticated, redirect to login
    if (!session) {
      return <Navigate to="/login" state={{ from: location }} replace />
    }
  }

  return <>{children}</>
}

// Public-only route wrapper - redirects already-authenticated users to dashboard
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { session, isInitialized } = useAuthStore()
  const location = useLocation()

  if (isSupabaseConfigured) {
    // Wait until auth state is resolved
    if (!isInitialized) {
      return (
        <div className="min-h-screen bg-[#F7F7F5] flex flex-col items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4338CA] flex items-center justify-center shadow-md animate-pulse">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      )
    }

    // If already authenticated, redirect to intended page or dashboard
    if (session) {
      const fromPath = (location.state as any)?.from?.pathname || '/dashboard'
      return <Navigate to={fromPath} replace />
    }
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
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <RegisterPage />
                </PublicOnlyRoute>
              }
            />

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
