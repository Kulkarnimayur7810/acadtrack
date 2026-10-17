import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { User, Mail, Lock, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { useAuthStore } from '@/lib/store'
import { Button, Input } from '@/components/ui'

export default function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setUser, setSession } = useAuthStore()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!fullName.trim()) {
      setError('Please enter your full name.')
      return
    }

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      // 1. Sign up user with email and password (no email verification required when disabled in Supabase)
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      })

      if (authError) {
        setLoading(false)
        if (authError.message.toLowerCase().includes('rate limit')) {
          setError(
            'Email rate limit reached on Supabase. Please disable "Confirm email" in your Supabase Dashboard (Authentication → Providers → Email → Toggle OFF "Confirm email") so signups work instantly without verification emails.'
          )
        } else {
          setError(authError.message)
        }
        return
      }

      // 2. If session is immediately returned (Email confirmation disabled in Supabase)
      let activeSession = data.session

      // If no session was returned, try signing in immediately with the password
      if (!activeSession && data.user) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (!signInError && signInData.session) {
          activeSession = signInData.session
        }
      }

      // 3. Upsert user profile
      if (data.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            email: email.trim(),
            updated_at: new Date().toISOString(),
          })
        } catch (profileErr) {
          console.warn('[RegisterPage] Profile upsert notice:', profileErr)
        }
      }

      setLoading(false)

      if (activeSession) {
        setSession(activeSession)
        setUser(activeSession.user)
        const destination = (location.state as any)?.from?.pathname || '/dashboard'
        navigate(destination, { replace: true })
      } else {
        // If confirmation is still strictly required on Supabase side
        setError(
          'Account created! However, Supabase requires email confirmation. In your Supabase Dashboard, go to Authentication → Providers → Email and uncheck "Confirm email" to log in immediately without email links.'
        )
      }
    } catch (err: any) {
      setLoading(false)
      setError(err?.message || 'An unexpected error occurred during sign up.')
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8 gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#4338CA] flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-[#202124] tracking-tight">ApexFlow</h1>
            <p className="text-xs text-[#6B7280] mt-0.5">Next-Gen Project Management & Productivity</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-xs p-6 flex flex-col gap-5">
          {/* Supabase not configured warning */}
          {!isSupabaseConfigured && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Supabase credentials not detected. Ensure <code className="font-mono bg-amber-100 px-1 rounded">.env.local</code> contains your project URL and publishable key.
              </p>
            </div>
          )}

          <div>
            <h2 className="text-base font-semibold text-[#202124]">Create an account</h2>
            <p className="text-sm text-[#6B7280] mt-0.5">Sign up with email and password</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              icon={<User className="w-4 h-4" />}
              autoComplete="name"
              required
              disabled={loading}
            />

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
              autoComplete="new-password"
              hint="Must be at least 6 characters"
              required
              disabled={loading}
            />

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 leading-relaxed">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full justify-center"
            >
              {loading ? 'Creating Account…' : 'Sign Up'}
              {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
          </form>

          <p className="text-center text-sm text-[#6B7280]">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-[#4338CA] hover:text-[#3730A3] hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
