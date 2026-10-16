import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, differenceInDays, isPast, isToday, isTomorrow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null, fmt = 'MMM d, yyyy'): string {
  if (!date) return '—'
  return format(new Date(date), fmt)
}

export function formatRelativeDate(date: string | Date | null): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return formatDistanceToNow(d, { addSuffix: true })
}

export function daysUntil(date: string | Date | null): number | null {
  if (!date) return null
  return differenceInDays(new Date(date), new Date())
}

export function isOverdue(date: string | Date | null): boolean {
  if (!date) return false
  return isPast(new Date(date)) && !isToday(new Date(date))
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function generateTaskId(projectPrefix: string, taskNumber: number): string {
  return `${projectPrefix.slice(0, 3).toUpperCase()}-${taskNumber}`
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`)
}

export const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-[--color-text-tertiary]', bg: 'bg-[--color-surface]', dot: 'bg-[--color-text-tertiary]' },
  medium: { label: 'Medium', color: 'text-[--color-warning]', bg: 'bg-[--color-warning-light]', dot: 'bg-[--color-warning]' },
  high: { label: 'High', color: 'text-[--color-danger]', bg: 'bg-[--color-danger-light]', dot: 'bg-[--color-danger]' },
  urgent: { label: 'Urgent', color: 'text-[--color-danger]', bg: 'bg-[--color-danger-muted]', dot: 'bg-[--color-danger]' },
} as const

export const STATUS_CONFIG = {
  backlog: { label: 'Backlog', color: 'text-[--color-text-tertiary]' },
  todo: { label: 'To Do', color: 'text-[--color-accent]' },
  in_progress: { label: 'In Progress', color: 'text-[--color-warning]' },
  in_review: { label: 'In Review', color: 'text-[--color-purple]' },
  blocked: { label: 'Blocked', color: 'text-[--color-danger]' },
  done: { label: 'Done', color: 'text-[--color-success]' },
} as const

export const PHASE_STATUS_CONFIG = {
  not_started: { label: 'Not Started', color: 'text-[--color-text-tertiary]', bg: 'bg-[--color-surface]' },
  planning: { label: 'Planning', color: 'text-[--color-accent]', bg: 'bg-[--color-accent-light]' },
  preparing: { label: 'Preparing', color: 'text-[--color-warning]', bg: 'bg-[--color-warning-light]' },
  ready_for_review: { label: 'Ready for Review', color: 'text-[--color-purple]', bg: 'bg-[--color-purple-light]' },
  ready_to_present: { label: 'Ready to Present', color: 'text-[--color-success]', bg: 'bg-[--color-success-light]' },
  presented: { label: 'Presented', color: 'text-[--color-accent]', bg: 'bg-[--color-accent-muted]' },
  corrections_required: { label: 'Corrections Required', color: 'text-[--color-danger]', bg: 'bg-[--color-danger-light]' },
  approved: { label: 'Approved', color: 'text-[--color-success]', bg: 'bg-[--color-success-muted]' },
  completed: { label: 'Completed', color: 'text-[--color-success]', bg: 'bg-[--color-success-muted]' },
} as const

export const DELIVERABLE_STATUS_CONFIG = {
  not_started: { label: 'Not Started', color: 'text-[--color-text-tertiary]' },
  in_progress: { label: 'In Progress', color: 'text-[--color-warning]' },
  submitted_for_review: { label: 'Submitted', color: 'text-[--color-accent]' },
  changes_requested: { label: 'Changes Requested', color: 'text-[--color-danger]' },
  approved: { label: 'Approved', color: 'text-[--color-success]' },
} as const

export const CORRECTION_STATUS_CONFIG = {
  open: { label: 'Open', color: 'text-[--color-danger]', bg: 'bg-[--color-danger-light]' },
  in_progress: { label: 'In Progress', color: 'text-[--color-warning]', bg: 'bg-[--color-warning-light]' },
  ready_for_verification: { label: 'Ready for Verification', color: 'text-[--color-accent]', bg: 'bg-[--color-accent-light]' },
  verified: { label: 'Verified', color: 'text-[--color-success]', bg: 'bg-[--color-success-light]' },
  reopened: { label: 'Reopened', color: 'text-[--color-danger]', bg: 'bg-[--color-danger-muted]' },
} as const
