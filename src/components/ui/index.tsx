import React, { forwardRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'
import { useUIStore, type ToastItem } from '@/lib/store'

// ──────────────────────────────────────────
// Button
// ──────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center gap-2 font-medium rounded-[--radius-md] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent] disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary: 'bg-[--color-accent] text-white hover:bg-[--color-accent-hover]',
      secondary: 'bg-[--color-surface] text-[--color-text-primary] border border-[--color-border] hover:bg-[--color-surface-raised]',
      ghost: 'text-[--color-text-secondary] hover:bg-[--color-surface] hover:text-[--color-text-primary]',
      danger: 'bg-[--color-danger-light] text-[--color-danger] border border-[--color-danger-muted] hover:bg-[--color-danger-muted]',
      outline: 'border border-[--color-accent] text-[--color-accent] hover:bg-[--color-accent-light]',
    }

    const sizes = {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-2.5 py-1.5 text-sm',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-2.5 text-base',
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ──────────────────────────────────────────
// Input
// ──────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1 min-w-0">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[--color-text-primary]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[--color-text-tertiary]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-[--radius-md] border border-[--color-border] bg-white px-3 py-2 text-sm text-[--color-text-primary] placeholder:text-[--color-text-placeholder] transition-colors',
              'focus:outline-none focus:border-[--color-accent] focus:ring-1 focus:ring-[--color-accent]',
              'disabled:bg-[--color-surface] disabled:cursor-not-allowed',
              error && 'border-[--color-danger] focus:border-[--color-danger] focus:ring-[--color-danger]',
              icon && 'pl-8',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-[--color-danger]">{error}</p>}
        {hint && !error && <p className="text-xs text-[--color-text-tertiary]">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ──────────────────────────────────────────
// Textarea
// ──────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1 min-w-0">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[--color-text-primary]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-[--radius-md] border border-[--color-border] bg-white px-3 py-2 text-sm text-[--color-text-primary] placeholder:text-[--color-text-placeholder] transition-colors resize-y min-h-[80px]',
            'focus:outline-none focus:border-[--color-accent] focus:ring-1 focus:ring-[--color-accent]',
            error && 'border-[--color-danger]',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[--color-danger]">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

// ──────────────────────────────────────────
// Select
// ──────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1 min-w-0">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[--color-text-primary]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-[--radius-md] border border-[--color-border] bg-white px-3 py-2 text-sm text-[--color-text-primary] transition-colors',
            'focus:outline-none focus:border-[--color-accent] focus:ring-1 focus:ring-[--color-accent]',
            error && 'border-[--color-danger]',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-[--color-danger]">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

// ──────────────────────────────────────────
// Badge
// ──────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  const variants = {
    default: 'bg-[--color-surface] text-[--color-text-secondary] border border-[--color-border]',
    success: 'bg-[--color-success-light] text-[--color-success]',
    warning: 'bg-[--color-warning-light] text-[--color-warning]',
    danger: 'bg-[--color-danger-light] text-[--color-danger]',
    info: 'bg-[--color-accent-light] text-[--color-accent]',
    purple: 'bg-[--color-purple-light] text-[--color-purple]',
  }
  const sizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-[--radius-sm] font-medium', variants[variant], sizes[size], className)}>
      {children}
    </span>
  )
}

// ──────────────────────────────────────────
// Avatar
// ──────────────────────────────────────────
interface AvatarProps {
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
]

function getAvatarColor(name: string | null | undefined): string {
  if (!name) return AVATAR_COLORS[0]
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

export function Avatar({ name, size = 'sm', className }: AvatarProps) {
  const sizes = { xs: 'w-5 h-5 text-[10px]', sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' }
  return (
    <div className={cn('rounded-full flex items-center justify-center font-medium flex-shrink-0', sizes[size], getAvatarColor(name), className)}>
      {getInitials(name)}
    </div>
  )
}

// ──────────────────────────────────────────
// Card
// ──────────────────────────────────────────
interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className, onClick, padding = 'md' }: CardProps) {
  const paddings = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' }
  return (
    <div
      className={cn(
        'bg-white border border-[--color-border] rounded-[--radius-lg] shadow-[--shadow-sm]',
        paddings[padding],
        onClick && 'cursor-pointer hover:border-[--color-border-strong] hover:shadow-[--shadow-md] transition-all',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// ──────────────────────────────────────────
// Modal
// ──────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  footer?: React.ReactNode
}

export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw]',
  }

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative w-full rounded-[--radius-xl] bg-white border border-[--color-border] shadow-2xl flex flex-col max-h-[88vh] my-auto overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150',
          sizes[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[--color-border] shrink-0 bg-white">
            <h2 className="text-base font-semibold text-[--color-text-primary] tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-[--radius-md] text-[--color-text-tertiary] hover:bg-[--color-surface] hover:text-[--color-text-primary] transition-colors"
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5 overscroll-contain">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-[--color-border] shrink-0 bg-[--color-surface] rounded-b-[--radius-xl]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// Spinner
// ──────────────────────────────────────────
export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <svg
      className={cn('animate-spin text-[--color-accent]', sizes[size], className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ──────────────────────────────────────────
// EmptyState
// ──────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      {icon && <div className="text-[--color-text-tertiary]">{icon}</div>}
      <div>
        <p className="text-sm font-medium text-[--color-text-secondary]">{title}</p>
        {description && <p className="text-xs text-[--color-text-tertiary] mt-1 max-w-xs mx-auto">{description}</p>}
      </div>
      {action && action}
    </div>
  )
}

// ──────────────────────────────────────────
// Progress bar
// ──────────────────────────────────────────
interface ProgressBarProps {
  value: number
  max?: number
  size?: 'sm' | 'md'
  variant?: 'default' | 'success' | 'warning' | 'danger'
  label?: boolean
  className?: string
}

export function ProgressBar({ value, max = 100, size = 'sm', variant = 'default', label = false, className }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const sizes = { sm: 'h-1.5', md: 'h-2.5' }
  const colors = {
    default: 'bg-[--color-accent]',
    success: 'bg-[--color-success]',
    warning: 'bg-[--color-warning]',
    danger: 'bg-[--color-danger]',
  }
  return (
    <div className={cn('flex items-center gap-2 min-w-0', className)}>
      <div className={cn('flex-1 bg-[--color-surface-raised] rounded-full overflow-hidden min-w-0', sizes[size])}>
        <div
          className={cn('h-full rounded-full transition-all', colors[variant])}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {label && <span className="text-xs text-[--color-text-tertiary] flex-shrink-0 w-8 text-right">{pct}%</span>}
    </div>
  )
}

// ──────────────────────────────────────────
// Divider
// ──────────────────────────────────────────
export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-0 border-t border-[--color-border]', className)} />
}

// ──────────────────────────────────────────
// Tooltip (CSS-based, no JS)
// ──────────────────────────────────────────
interface TooltipProps {
  content: string
  children: React.ReactNode
  className?: string
}

export function Tooltip({ content, children, className }: TooltipProps) {
  return (
    <span className={cn('relative group', className)}>
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-900 rounded-[--radius-sm] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
        {content}
      </span>
    </span>
  )
}

// ──────────────────────────────────────────
// Section Header
// ──────────────────────────────────────────
interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4 min-w-0', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-[--color-text-primary] truncate">{title}</h2>
        {subtitle && <p className="text-sm text-[--color-text-tertiary] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// ──────────────────────────────────────────
// Tabs
// ──────────────────────────────────────────
interface TabsProps {
  tabs: { id: string; label: string; count?: number }[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex items-center border-b border-[--color-border]', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5',
            active === tab.id
              ? 'border-[--color-accent] text-[--color-accent]'
              : 'border-transparent text-[--color-text-secondary] hover:text-[--color-text-primary] hover:border-[--color-border]'
          )}
          aria-selected={active === tab.id}
          role="tab"
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
              active === tab.id
                ? 'bg-[--color-accent-light] text-[--color-accent]'
                : 'bg-[--color-surface-raised] text-[--color-text-tertiary]'
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ──────────────────────────────────────────
// Checkbox
// ──────────────────────────────────────────
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const checkId = id || `checkbox-${Math.random().toString(36).slice(2)}`
    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="checkbox"
          id={checkId}
          className={cn(
            'w-4 h-4 rounded border-[--color-border] text-[--color-accent] focus:ring-[--color-accent] cursor-pointer',
            className
          )}
          {...props}
        />
        {label && (
          <label htmlFor={checkId} className="text-sm text-[--color-text-primary] cursor-pointer">
            {label}
          </label>
        )}
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'

// ──────────────────────────────────────────
// Toast Container
// ──────────────────────────────────────────
export function ToastContainer() {
  const { toasts, removeToast } = useUIStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => {
        const icons = {
          success: <CheckCircle2 size={16} className="text-[--color-success] shrink-0" />,
          error: <AlertCircle size={16} className="text-[--color-danger] shrink-0" />,
          warning: <AlertTriangle size={16} className="text-[--color-warning] shrink-0" />,
          info: <Info size={16} className="text-[--color-accent] shrink-0" />,
        }
        const borders = {
          success: 'border-l-4 border-l-[--color-success]',
          error: 'border-l-4 border-l-[--color-danger]',
          warning: 'border-l-4 border-l-[--color-warning]',
          info: 'border-l-4 border-l-[--color-accent]',
        }
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-3.5 bg-white border border-[--color-border] rounded-[--radius-lg] shadow-[--shadow-md] text-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-150',
              borders[t.type || 'info']
            )}
            role="status"
          >
            {icons[t.type || 'info']}
            <div className="flex-1 min-w-0">
              {t.title && <p className="font-semibold text-xs text-[--color-text-primary] mb-0.5">{t.title}</p>}
              <p className="text-xs text-[--color-text-secondary] leading-relaxed break-words">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-[--color-text-tertiary] hover:text-[--color-text-primary] transition-colors p-0.5 rounded"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
