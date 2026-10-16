import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Mail, Lock, AlertTriangle, BookOpen, CheckCircle } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Button, Input } from '@/components/ui'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    })

    if (authError) {
      setLoading(false)
      setError(authError.message)
      return
    }

    // Insert profile row if user was created and session is available
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName.trim(),
        email: email.trim(),
      })

      // Non-fatal: profile insert may fail if already exists via trigger
      if (profileError && profileError.code !== '23505') {
        console.warn('[RegisterPage] Profile insert error:', profileError.message)
      }
    }

    setLoading(false)
    setSuccess(true)
  }

  if (success) {
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

          {/* Success card */}
          <div className="bg-white border border-[--color-border] rounded-[--radius-xl] shadow-[--shadow-sm] p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[--color-success-light] flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-[--color-success]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[--color-text-primary]">Check your email</h2>
              <p className="text-sm text-[--color-text-secondary] mt-1 leading-relaxed">
                We&apos;ve sent a verification link to{' '}
                <span className="font-medium text-[--color-text-primary]">{email}</span>.
                Click the link to activate your account.
              </p>
            </div>
            <p className="text-sm text-[--color-text-secondary]">
              Already verified?{' '}
              <Link
                to="/login"
                className="font-medium text-[--color-accent] hover:text-[--color-accent-hover] hover:underline transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
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
            <h2 className="text-base font-semibold text-[--color-text-primary]">Create an account</h2>
            <p className="text-sm text-[--color-text-tertiary] mt-0.5">Get started for free</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Full name"
              type="text"
              placeholder="Jane Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              icon={<User className="w-4 h-4" />}
              autoComplete="name"
              required
              disabled={loading}
            />

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
              autoComplete="new-password"
              hint="Must be at least 6 characters"
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
              {loading ? 'Creating account…' : 'Sign Up'}
            </Button>
          </form>

          <p className="text-center text-sm text-[--color-text-secondary]">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-[--color-accent] hover:text-[--color-accent-hover] hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
