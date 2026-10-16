import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, AlertTriangle, BookOpen, ArrowRight } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { useAuthStore } from '@/lib/store'
import { Button, Input } from '@/components/ui'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser, setSession, setProfile } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Please enter both email and password.')
      return
    }

    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        setLoading(false)
        if (authError.message.toLowerCase().includes('email not confirmed')) {
          setError(
            'Email confirmation is required on this account. To allow direct password login without verification links, disable "Confirm email" in your Supabase Dashboard: Authentication → Providers → Email.'
          )
        } else if (authError.message.toLowerCase().includes('invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials or create a new account.')
        } else {
          setError(authError.message)
        }
        return
      }

      if (data.session) {
        setSession(data.session)
        setUser(data.user)

        // Fetch user profile if exists
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()
          if (profile) setProfile(profile)
        } catch {
          // ignore profile fetch error
        }

        setLoading(false)
        navigate('/dashboard')
      } else {
        setLoading(false)
        setError('No active session returned. Please verify credentials.')
      }
    } catch (err: any) {
      setLoading(false)
      setError(err?.message || 'An unexpected error occurred during sign in.')
    }
  }

  return (
    <div className="min-h-screen bg-[--color-surface] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8 gap-2">
          <div className="w-10 h-10 rounded-[--radius-lg] bg-[--color-accent] flex items-center justify-center shadow-xs">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-[--color-text-primary] tracking-tight">AcadTrack</h1>
            <p className="text-xs text-[--color-text-tertiary] mt-0.5">College Project Management Platform</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-[--color-border] rounded-[--radius-xl] shadow-[--shadow-sm] p-6 flex flex-col gap-5">
          {/* Supabase not configured warning */}
          {!isSupabaseConfigured && (
            <div className="flex items-start gap-2.5 bg-[--color-warning-light] border border-amber-200 rounded-[--radius-md] px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 text-[--color-warning] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Supabase credentials not configured in <code className="font-mono bg-amber-100 px-1 rounded">.env.local</code>.
              </p>
            </div>
          )}

          <div>
            <h2 className="text-base font-semibold text-[--color-text-primary]">Sign in to your account</h2>
            <p className="text-sm text-[--color-text-tertiary] mt-0.5">Welcome back to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Email Address"
              type="email"
              placeholder="student@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
              disabled={loading}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
              required
              disabled={loading}
            />

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 bg-[--color-danger-light] border border-red-200 rounded-[--radius-md] px-3 py-2.5">
                <AlertTriangle className="w-4 h-4 text-[--color-danger] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[--color-danger] leading-relaxed">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full justify-center"
            >
              {loading ? 'Signing in…' : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
          </form>

          <p className="text-center text-sm text-[--color-text-secondary]">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-[--color-accent] hover:text-[--color-accent-hover] hover:underline transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
