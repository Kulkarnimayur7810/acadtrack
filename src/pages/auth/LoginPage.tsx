import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, AlertTriangle, BookOpen } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Button, Input } from '@/components/ui'

export default function LoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[--color-surface] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex flex-col items-center mb-8 gap-2">
          <div className="w-10 h-10 rounded-[--radius-lg] bg-[--color-accent] flex items-center justify-center">
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
                Supabase is not configured. Create a{' '}
                <code className="font-mono bg-amber-100 px-1 rounded">.env</code> file with{' '}
                <code className="font-mono bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
                <code className="font-mono bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code>.
              </p>
            </div>
          )}

          <div>
            <h2 className="text-base font-semibold text-[--color-text-primary]">Sign in to your account</h2>
            <p className="text-sm text-[--color-text-tertiary] mt-0.5">Welcome back</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Email address"
              type="email"
              placeholder="you@university.edu"
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
              <div className="flex items-center gap-2 bg-[--color-danger-light] border border-red-200 rounded-[--radius-md] px-3 py-2.5">
                <AlertTriangle className="w-4 h-4 text-[--color-danger] flex-shrink-0" />
                <p className="text-xs text-[--color-danger]">{error}</p>
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
