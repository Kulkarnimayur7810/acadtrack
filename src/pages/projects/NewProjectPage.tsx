import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  X,
  FolderGit2,
  Users,
  FileText,
  ClipboardList,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore, useProjectStore, toast } from '@/lib/store'
import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Divider,
  Badge,
} from '@/components/ui'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamMember {
  name: string
  role: string
}

interface DocLink {
  name: string
  url: string
}

interface FormData {
  // Step 1
  title: string
  description: string
  college: string
  department: string
  academic_year: string
  semester: string
  category: string
  start_date: string
  submission_deadline: string
  // Step 2
  faculty_guide_name: string
  faculty_guide_contact: string
  team_leader_name: string
  team_members: TeamMember[]
  tech_stack: string[]
  // Step 3
  repo_url: string
  doc_links: DocLink[]
  objectives: string
  expected_outcomes: string
  research_paper_required: boolean
}

const INITIAL_FORM: FormData = {
  title: '',
  description: '',
  college: '',
  department: '',
  academic_year: '',
  semester: '',
  category: '',
  start_date: '',
  submission_deadline: '',
  faculty_guide_name: '',
  faculty_guide_contact: '',
  team_leader_name: '',
  team_members: [],
  tech_stack: [],
  repo_url: '',
  doc_links: [],
  objectives: '',
  expected_outcomes: '',
  research_paper_required: false,
}

const DEFAULT_PHASES = [
  'Topic Selection & Approval',
  'Synopsis & Proposal Presentation',
  'Literature Review & Research',
  'Design & Planning Review',
  'Mid-Term Presentation',
  'Implementation & Testing Review',
  'Pre-Final Presentation',
  'Final Presentation & Viva',
  'Final Submission & Closure',
]

const CATEGORY_OPTIONS = [
  { value: 'software', label: 'Software & Web App' },
  { value: 'mobile_app', label: 'Mobile Application' },
  { value: 'ml_ai', label: 'Machine Learning / AI' },
  { value: 'business', label: 'Business & Startup' },
  { value: 'research', label: 'Research & Academic' },
  { value: 'creative', label: 'Creative & Design' },
  { value: 'iot', label: 'IoT & Hardware' },
  { value: 'other', label: 'Personal & General' },
]

const SEMESTER_OPTIONS = [
  { value: 'Semester 1', label: 'Semester 1' },
  { value: 'Semester 2', label: 'Semester 2' },
  { value: 'Semester 3', label: 'Semester 3' },
  { value: 'Semester 4', label: 'Semester 4' },
  { value: 'Semester 5', label: 'Semester 5' },
  { value: 'Semester 6', label: 'Semester 6' },
  { value: 'Semester 7', label: 'Semester 7' },
  { value: 'Semester 8', label: 'Semester 8' },
]

const MEMBER_ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'leader', label: 'Leader' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'faculty', label: 'Faculty' },
]

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Basic Info', icon: FolderGit2 },
  { id: 2, label: 'Team Setup', icon: Users },
  { id: 3, label: 'Project Details', icon: FileText },
  { id: 4, label: 'Review & Create', icon: ClipboardList },
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const done = current > step.id
        const active = current === step.id
        const Icon = step.icon
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all font-medium text-xs',
                  done
                    ? 'bg-[#4338CA] border-[#4338CA] text-white'
                    : active
                    ? 'bg-white border-[#4338CA] text-[#4338CA] shadow-xs ring-2 ring-[#4338CA]/20'
                    : 'bg-white border-[#D1D5DB] text-[#9CA3AF]'
                )}
              >
                {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={cn(
                  'text-xs font-medium hidden sm:block',
                  active ? 'text-[#4338CA] font-semibold' : done ? 'text-[#202124]' : 'text-[#9CA3AF]'
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2 mt-[-14px]',
                  done ? 'bg-[#4338CA]' : 'bg-[#E5E7EB]'
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Step 1: Basic Info ───────────────────────────────────────────────────────

function Step1({ data, onChange }: { data: FormData; onChange: (patch: Partial<FormData>) => void }) {
  const [showAcademic, setShowAcademic] = useState(
    !!(data.college || data.department || data.semester || data.academic_year)
  )

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-base font-semibold text-[#202124] mb-0.5">Project Details</h3>
        <p className="text-sm text-[#6B7280]">
          Create a project for software development, research, team collaboration, or personal productivity.
        </p>
      </div>
      <Divider />

      <Input
        label="Project Name *"
        placeholder="e.g. ApexFlow Platform, Mobile App, AI Agent"
        value={data.title}
        onChange={(e) => onChange({ title: e.target.value })}
        autoFocus
        required
      />

      <Textarea
        label="Project Description"
        placeholder="What is this project about? What are its primary goals?"
        value={data.description}
        onChange={(e) => onChange({ description: e.target.value })}
        rows={3}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          label="Project Category"
          placeholder="Select category"
          options={CATEGORY_OPTIONS}
          value={data.category}
          onChange={(e) => onChange({ category: e.target.value })}
        />
        <Input
          label="Start Date"
          type="date"
          value={data.start_date}
          onChange={(e) => onChange({ start_date: e.target.value })}
        />
        <Input
          label="Target Deadline"
          type="date"
          value={data.submission_deadline}
          onChange={(e) => onChange({ submission_deadline: e.target.value })}
        />
      </div>

      {/* Optional Academic / University Section */}
      <div className="pt-2 border-t border-[#E5E7EB]">
        <button
          type="button"
          onClick={() => setShowAcademic(!showAcademic)}
          className="flex items-center gap-2 text-xs font-semibold text-[#4338CA] hover:text-[#3730A3] transition-colors"
        >
          <span>{showAcademic ? '− Hide' : '+ Add'} Academic / College Details (Optional)</span>
        </button>

        {showAcademic && (
          <div className="mt-3 p-4 bg-[#F7F7F5] border border-[#E5E7EB] rounded-xl space-y-4 animate-in fade-in-0 duration-150">
            <p className="text-xs text-[#6B7280]">
              If this is an academic course or final-year project, you can optionally track college, department, and semester information.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="College / University"
                placeholder="e.g. Stanford / MIT / Tech University"
                value={data.college}
                onChange={(e) => onChange({ college: e.target.value })}
              />
              <Input
                label="Department / Faculty"
                placeholder="e.g. Computer Science & Engineering"
                value={data.department}
                onChange={(e) => onChange({ department: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Academic Year"
                placeholder="e.g. 2024-2025"
                value={data.academic_year}
                onChange={(e) => onChange({ academic_year: e.target.value })}
              />
              <Select
                label="Semester"
                placeholder="Select semester"
                options={SEMESTER_OPTIONS}
                value={data.semester}
                onChange={(e) => onChange({ semester: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Step 2: Team Setup ───────────────────────────────────────────────────────

function Step2({ data, onChange }: { data: FormData; onChange: (patch: Partial<FormData>) => void }) {
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('member')
  const [techInput, setTechInput] = useState('')

  function addMember() {
    if (!newMemberName.trim()) return
    onChange({
      team_members: [...data.team_members, { name: newMemberName.trim(), role: newMemberRole }],
    })
    setNewMemberName('')
    setNewMemberRole('member')
  }

  function removeMember(idx: number) {
    onChange({ team_members: data.team_members.filter((_, i) => i !== idx) })
  }

  function addTech(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && techInput.trim()) {
      e.preventDefault()
      const tag = techInput.trim()
      if (!data.tech_stack.includes(tag)) {
        onChange({ tech_stack: [...data.tech_stack, tag] })
      }
      setTechInput('')
    }
  }

  function removeTech(tag: string) {
    onChange({ tech_stack: data.tech_stack.filter((t) => t !== tag) })
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-base font-semibold text-[#202124] mb-0.5">Team & Collaboration</h3>
        <p className="text-sm text-[#6B7280]">Configure project leads, team members, tech stack, and optional mentors.</p>
      </div>
      <Divider />

      <Input
        label="Project Lead / Creator"
        placeholder="e.g. Your name or team leader"
        value={data.team_leader_name}
        onChange={(e) => onChange({ team_leader_name: e.target.value })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Mentor / Faculty Guide Name (Optional)"
          placeholder="e.g. Dr. Priya Sharma / Advisor"
          value={data.faculty_guide_name}
          onChange={(e) => onChange({ faculty_guide_name: e.target.value })}
        />
        <Input
          label="Mentor / Guide Email (Optional)"
          type="email"
          placeholder="mentor@organization.edu"
          value={data.faculty_guide_contact}
          onChange={(e) => onChange({ faculty_guide_contact: e.target.value })}
        />
      </div>

      <Divider />

      {/* Team Members */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-[--color-text-primary]">Team Members</p>

        {data.team_members.length > 0 && (
          <div className="border border-[--color-border] rounded-[--radius-md] divide-y divide-[--color-border]">
            {data.team_members.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[--color-accent-muted] text-[--color-accent] text-xs font-semibold flex items-center justify-center flex-shrink-0">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-[--color-text-primary]">{m.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">{m.role}</Badge>
                  <button
                    type="button"
                    onClick={() => removeMember(idx)}
                    className="text-[--color-text-tertiary] hover:text-[--color-danger] transition-colors"
                    aria-label="Remove member"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add member row */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Member name"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())}
            className="flex-1 rounded-[--radius-md] border border-[--color-border] bg-white px-3 py-2 text-sm text-[--color-text-primary] placeholder:text-[--color-text-tertiary] focus:outline-none focus:border-[--color-accent] focus:ring-1 focus:ring-[--color-accent]"
          />
          <select
            value={newMemberRole}
            onChange={(e) => setNewMemberRole(e.target.value)}
            className="rounded-[--radius-md] border border-[--color-border] bg-white px-3 py-2 text-sm text-[--color-text-primary] focus:outline-none focus:border-[--color-accent]"
          >
            {MEMBER_ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <Button type="button" variant="secondary" size="sm" onClick={addMember}>
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>

      <Divider />

      {/* Tech Stack */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[--color-text-primary]">Technology Stack</label>
        <div className="flex flex-wrap gap-1.5 mb-1">
          {data.tech_stack.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-[--color-accent-muted] text-[--color-accent] text-xs font-medium px-2 py-0.5 rounded-full"
            >
              {tag}
              <button type="button" onClick={() => removeTech(tag)} className="hover:text-[--color-accent-hover]">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Type a technology and press Enter (e.g. React, Node.js, PostgreSQL)"
          value={techInput}
          onChange={(e) => setTechInput(e.target.value)}
          onKeyDown={addTech}
          className="w-full rounded-[--radius-md] border border-[--color-border] bg-white px-3 py-2 text-sm text-[--color-text-primary] placeholder:text-[--color-text-tertiary] focus:outline-none focus:border-[--color-accent] focus:ring-1 focus:ring-[--color-accent]"
        />
        <p className="text-xs text-[--color-text-tertiary]">Press Enter to add each technology.</p>
      </div>
    </div>
  )
}

// ─── Step 3: Project Details ──────────────────────────────────────────────────

function Step3({ data, onChange }: { data: FormData; onChange: (patch: Partial<FormData>) => void }) {
  const [newDocName, setNewDocName] = useState('')
  const [newDocUrl, setNewDocUrl] = useState('')

  function addDocLink() {
    if (!newDocName.trim() || !newDocUrl.trim()) return
    onChange({
      doc_links: [...data.doc_links, { name: newDocName.trim(), url: newDocUrl.trim() }],
    })
    setNewDocName('')
    setNewDocUrl('')
  }

  function removeDocLink(idx: number) {
    onChange({ doc_links: data.doc_links.filter((_, i) => i !== idx) })
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-base font-semibold text-[--color-text-primary] mb-0.5">Project Details</h3>
        <p className="text-sm text-[--color-text-tertiary]">Repository, documents, objectives, and outcomes.</p>
      </div>
      <Divider />

      <Input
        label="Repository URL"
        placeholder="https://github.com/org/project"
        type="url"
        value={data.repo_url}
        onChange={(e) => onChange({ repo_url: e.target.value })}
      />

      {/* Document Links */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-[--color-text-primary]">Shared Document Links</p>

        {data.doc_links.length > 0 && (
          <div className="border border-[--color-border] rounded-[--radius-md] divide-y divide-[--color-border]">
            {data.doc_links.map((d, idx) => (
              <div key={idx} className="flex items-center justify-between px-3 py-2.5 gap-2">
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-[--color-text-primary] truncate">{d.name}</span>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[--color-accent] truncate hover:underline"
                  >
                    {d.url}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => removeDocLink(idx)}
                  className="text-[--color-text-tertiary] hover:text-[--color-danger] flex-shrink-0 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Document name"
            value={newDocName}
            onChange={(e) => setNewDocName(e.target.value)}
            className="w-36 rounded-[--radius-md] border border-[--color-border] bg-white px-3 py-2 text-sm text-[--color-text-primary] placeholder:text-[--color-text-tertiary] focus:outline-none focus:border-[--color-accent] focus:ring-1 focus:ring-[--color-accent]"
          />
          <input
            type="url"
            placeholder="https://docs.google.com/..."
            value={newDocUrl}
            onChange={(e) => setNewDocUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDocLink())}
            className="flex-1 rounded-[--radius-md] border border-[--color-border] bg-white px-3 py-2 text-sm text-[--color-text-primary] placeholder:text-[--color-text-tertiary] focus:outline-none focus:border-[--color-accent] focus:ring-1 focus:ring-[--color-accent]"
          />
          <Button type="button" variant="secondary" size="sm" onClick={addDocLink}>
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>

      <Divider />

      <Textarea
        label="Project Objectives"
        placeholder="What are the main goals and objectives of this project?"
        value={data.objectives}
        onChange={(e) => onChange({ objectives: e.target.value })}
        rows={4}
      />

      <Textarea
        label="Expected Outcomes"
        placeholder="What will be delivered or achieved by the end of the project?"
        value={data.expected_outcomes}
        onChange={(e) => onChange({ expected_outcomes: e.target.value })}
        rows={4}
      />

      <Checkbox
        label="Research paper / publication required as part of this project"
        checked={data.research_paper_required}
        onChange={(e) => onChange({ research_paper_required: e.target.checked })}
      />
    </div>
  )
}

// ─── Step 4: Review & Create ──────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== false) return null
  return (
    <div className="flex gap-3 py-2 border-b border-[--color-border] last:border-0">
      <span className="text-xs font-medium text-[--color-text-tertiary] w-40 flex-shrink-0 mt-0.5">{label}</span>
      <span className="text-sm text-[--color-text-primary] flex-1 break-words">{value}</span>
    </div>
  )
}

function Step4({ data }: { data: FormData }) {
  const categoryLabel = CATEGORY_OPTIONS.find((c) => c.value === data.category)?.label ?? data.category

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-base font-semibold text-[--color-text-primary] mb-0.5">Review & Create</h3>
        <p className="text-sm text-[--color-text-tertiary]">Double-check everything before creating the project.</p>
      </div>
      <Divider />

      {/* Basic Info */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[--color-text-tertiary] mb-2">Basic Info</p>
        <div className="border border-[--color-border] rounded-[--radius-md] px-3">
          <ReviewRow label="Project Title" value={data.title} />
          <ReviewRow label="Description" value={data.description} />
          <ReviewRow label="College" value={data.college} />
          <ReviewRow label="Department" value={data.department} />
          <ReviewRow label="Academic Year" value={data.academic_year} />
          <ReviewRow label="Semester" value={data.semester} />
          <ReviewRow label="Category" value={categoryLabel} />
          <ReviewRow label="Start Date" value={data.start_date} />
          <ReviewRow label="Submission Deadline" value={data.submission_deadline} />
        </div>
      </div>

      {/* Team */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[--color-text-tertiary] mb-2">Team</p>
        <div className="border border-[--color-border] rounded-[--radius-md] px-3">
          <ReviewRow label="Faculty Guide" value={data.faculty_guide_name} />
          <ReviewRow label="Faculty Email" value={data.faculty_guide_contact} />
          <ReviewRow label="Team Leader" value={data.team_leader_name} />
          <ReviewRow
            label="Team Members"
            value={
              data.team_members.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {data.team_members.map((m, i) => (
                    <Badge key={i} variant="default">{m.name} ({m.role})</Badge>
                  ))}
                </div>
              ) : null
            }
          />
          <ReviewRow
            label="Tech Stack"
            value={
              data.tech_stack.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {data.tech_stack.map((t) => (
                    <span key={t} className="bg-[--color-accent-muted] text-[--color-accent] text-xs font-medium px-2 py-0.5 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              ) : null
            }
          />
        </div>
      </div>

      {/* Details */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[--color-text-tertiary] mb-2">Project Details</p>
        <div className="border border-[--color-border] rounded-[--radius-md] px-3">
          <ReviewRow label="Repository URL" value={data.repo_url} />
          <ReviewRow
            label="Document Links"
            value={
              data.doc_links.length > 0 ? (
                <div className="flex flex-col gap-0.5">
                  {data.doc_links.map((d, i) => (
                    <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" className="text-[--color-accent] hover:underline text-sm">
                      {d.name}
                    </a>
                  ))}
                </div>
              ) : null
            }
          />
          <ReviewRow label="Objectives" value={data.objectives} />
          <ReviewRow label="Expected Outcomes" value={data.expected_outcomes} />
          <ReviewRow label="Research Paper Required" value={data.research_paper_required ? 'Yes' : 'No'} />
        </div>
      </div>

      {/* Phases preview */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[--color-text-tertiary] mb-2">
          Default Presentation Phases (auto-created)
        </p>
        <div className="border border-[--color-border] rounded-[--radius-md] divide-y divide-[--color-border]">
          {DEFAULT_PHASES.map((phase, idx) => (
            <div key={idx} className="flex items-center gap-3 px-3 py-2">
              <span className="text-xs font-medium text-[--color-text-tertiary] w-5 text-right">{idx + 1}</span>
              <span className="text-sm text-[--color-text-primary]">{phase}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewProjectPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { setCurrentProject, setProjects, projects } = useProjectStore()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function patch(updates: Partial<FormData>) {
    setForm((prev) => ({ ...prev, ...updates }))
  }

  function canProceed(): boolean {
    if (step === 1 && !form.title.trim()) return false
    return true
  }

  function next() {
    if (!canProceed()) return
    setStep((s) => Math.min(s + 1, 4))
  }

  function prev() {
    setStep((s) => Math.max(s - 1, 1))
  }

  async function handleSubmit() {
    if (!user) return
    setSubmitting(true)
    setError(null)

    try {
      // 1. Insert project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          title: form.title.trim(),
          description: form.description.trim() || null,
          college: form.college.trim() || null,
          department: form.department.trim() || null,
          academic_year: form.academic_year.trim() || null,
          semester: form.semester || null,
          category: form.category || null,
          start_date: form.start_date || null,
          submission_deadline: form.submission_deadline || null,
          faculty_guide_name: form.faculty_guide_name.trim() || null,
          faculty_guide_contact: form.faculty_guide_contact.trim() || null,
          tech_stack: form.tech_stack.length > 0 ? form.tech_stack : null,
          repo_url: form.repo_url.trim() || null,
          doc_links: form.doc_links.length > 0 ? form.doc_links : null,
          objectives: form.objectives.trim() || null,
          expected_outcomes: form.expected_outcomes.trim() || null,
          research_paper_required: form.research_paper_required,
          status: 'active',
          overall_progress: 0,
          owner_id: user.id,
        })
        .select()
        .single()

      if (projectError) throw projectError

      // 2. Insert owner as project member
      await supabase.from('project_members').insert({
        project_id: project.id,
        user_id: user.id,
        role: 'owner',
        display_name: form.team_leader_name.trim() || null,
      })

      // 3. Create default presentation phases
      const phaseInserts = DEFAULT_PHASES.map((name, idx) => ({
        project_id: project.id,
        name,
        phase_number: idx + 1,
        status: 'not_started' as const,
        is_active: idx === 0,
        is_custom: false,
      }))

      await supabase.from('presentation_phases').insert(phaseInserts)

      // 4. Update store and navigate
      const updatedProjects = [...projects, project]
      setProjects(updatedProjects)
      setCurrentProject(project)
      toast('Project created successfully', 'success')
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create project. Please try again.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-[#E5E7EB] px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#EEF2FF] flex items-center justify-center">
            <FolderGit2 className="w-4 h-4 text-[#4338CA]" />
          </div>
          <span className="text-sm font-semibold text-[#202124]">New Project</span>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-xs font-medium text-[#6B7280] hover:text-[#202124] transition-colors px-2 py-1 rounded hover:bg-[#F1F1EE]"
        >
          Cancel
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 flex justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <StepIndicator current={step} />

          <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-xs p-6 sm:p-8">
            {step === 1 && <Step1 data={form} onChange={patch} />}
            {step === 2 && <Step2 data={form} onChange={patch} />}
            {step === 3 && <Step3 data={form} onChange={patch} />}
            {step === 4 && <Step4 data={form} />}

            {error && (
              <div className="mt-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-5 border-t border-[--color-border]">
              <Button
                type="button"
                variant="secondary"
                onClick={prev}
                disabled={step === 1 || submitting}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <span className="text-xs text-[--color-text-tertiary]">
                Step {step} of {STEPS.length}
              </span>

              {step < 4 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={next}
                  disabled={!canProceed()}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={submitting}
                >
                  <Check className="w-4 h-4" />
                  Create Project
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
