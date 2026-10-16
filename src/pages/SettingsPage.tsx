import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Settings,
  Save,
  Trash2,
  AlertTriangle,
  FolderKanban,
  Layers,
  GraduationCap,
  GitBranch,
  Calendar,
  Check
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProjectStore, useAuthStore, toast } from '@/lib/store'
import {
  Button,
  Input,
  Textarea,
  Select,
  Badge,
  Card,
  Modal,
  EmptyState,
  Spinner,
  Checkbox
} from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Database } from '@/lib/database.types'

type Project = Database['public']['Tables']['projects']['Row']
type Phase = Database['public']['Tables']['presentation_phases']['Row']

export default function SettingsPage() {
  const { currentProject, setCurrentProject } = useProjectStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<Partial<Project>>({})
  const [titleError, setTitleError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  useEffect(() => {
    if (currentProject) {
      setForm(currentProject)
    }
  }, [currentProject])

  // Fetch presentation phases to allow enabling/disabling or renaming
  const { data: phases = [] } = useQuery({
    queryKey: ['presentation_phases', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return []
      const { data, error } = await supabase
        .from('presentation_phases')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('phase_number', { ascending: true })
      if (error) throw error
      return data as Phase[]
    },
    enabled: !!currentProject?.id,
  })

  // Update Project Mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (updated: Partial<Project>) => {
      if (!currentProject?.id) return
      const { data, error } = await supabase
        .from('projects')
        .update({
          title: updated.title,
          description: updated.description,
          college: updated.college,
          department: updated.department,
          academic_year: updated.academic_year,
          semester: updated.semester,
          category: updated.category,
          start_date: updated.start_date,
          submission_deadline: updated.submission_deadline,
          faculty_guide_name: updated.faculty_guide_name,
          faculty_guide_contact: updated.faculty_guide_contact,
          repo_url: updated.repo_url,
          objectives: updated.objectives,
          expected_outcomes: updated.expected_outcomes,
          research_paper_required: updated.research_paper_required,
          status: updated.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentProject.id)
        .select()
        .single()
      if (error) throw error
      return data as Project
    },
    onSuccess: (data) => {
      if (data) {
        setCurrentProject(data)
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      toast('Project settings saved successfully', 'success')
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to save project settings', 'error')
    },
  })

  // Toggle phase active state
  const togglePhaseActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('presentation_phases')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presentation_phases', currentProject?.id] })
      toast('Phase workflow state updated', 'success')
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to update phase', 'error')
    },
  })

  // Delete project
  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      if (!currentProject?.id) return
      const { error } = await supabase.from('projects').delete().eq('id', currentProject.id)
      if (error) throw error
    },
    onSuccess: () => {
      setCurrentProject(null)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast('Project deleted successfully', 'info')
      navigate('/projects')
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to delete project', 'error')
    },
  })

  if (!currentProject) {
    return (
      <div className="p-8">
        <EmptyState
          title="No Project Selected"
          description="Select a project to configure academic settings and presentation phase preferences."
        />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[--color-text-primary] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[--color-accent]" />
            Project Settings & Customization
          </h1>
          <p className="text-sm text-[--color-text-secondary] mt-0.5">
            Update institutional details, guide contacts, and customize presentation phases
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          loading={updateProjectMutation.isPending}
          onClick={() => {
            if (!form.title?.trim()) {
              setTitleError('Project title is required')
              toast('Project title cannot be empty', 'error')
              return
            }
            setTitleError('')
            updateProjectMutation.mutate(form)
          }}
          className="flex items-center gap-1.5"
        >
          {saveSuccess ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
          {saveSuccess ? 'Saved Successfully' : 'Save Changes'}
        </Button>
      </div>

      {/* Section 1: Core Project Details */}
      <div className="bg-white border border-[--color-border] rounded-[--radius-xl] p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[--color-text-primary] flex items-center gap-2 pb-2 border-b border-[--color-border]">
          <FolderKanban className="w-4 h-4 text-[--color-accent]" />
          Project Identification
        </h2>

        <Input
          label="Project Title *"
          value={form.title || ''}
          error={titleError}
          onChange={(e) => {
            setForm((f) => ({ ...f, title: e.target.value }))
            if (titleError) setTitleError('')
          }}
          required
        />

        <Textarea
          label="Abstract / Description"
          value={form.description || ''}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="College / University"
            value={form.college || ''}
            onChange={(e) => setForm((f) => ({ ...f, college: e.target.value }))}
          />
          <Input
            label="Department"
            value={form.department || ''}
            onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Academic Year"
            placeholder="e.g. 2026-2027"
            value={form.academic_year || ''}
            onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))}
          />
          <Input
            label="Semester"
            placeholder="e.g. Semester 8 (Final Year)"
            value={form.semester || ''}
            onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
          />
          <Select
            label="Project Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'archived', label: 'Archived' },
            ]}
            value={form.status || 'active'}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          />
        </div>
      </div>

      {/* Section 2: Guide & Deadlines */}
      <div className="bg-white border border-[--color-border] rounded-[--radius-xl] p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[--color-text-primary] flex items-center gap-2 pb-2 border-b border-[--color-border]">
          <GraduationCap className="w-4 h-4 text-[--color-accent]" />
          Faculty Guide & Schedule
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Faculty Guide Name"
            value={form.faculty_guide_name || ''}
            onChange={(e) => setForm((f) => ({ ...f, faculty_guide_name: e.target.value }))}
          />
          <Input
            label="Guide Email / Contact"
            type="email"
            value={form.faculty_guide_contact || ''}
            onChange={(e) => setForm((f) => ({ ...f, faculty_guide_contact: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Project Start Date"
            type="date"
            value={form.start_date || ''}
            onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
          />
          <Input
            label="Final Submission Deadline"
            type="date"
            value={form.submission_deadline || ''}
            onChange={(e) => setForm((f) => ({ ...f, submission_deadline: e.target.value }))}
          />
        </div>

        <Input
          label="Source Code Repository URL"
          placeholder="https://github.com/..."
          value={form.repo_url || ''}
          onChange={(e) => setForm((f) => ({ ...f, repo_url: e.target.value }))}
        />
      </div>

      {/* Section 3: Phase Customization */}
      <div className="bg-white border border-[--color-border] rounded-[--radius-xl] p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-[--color-text-primary] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[--color-accent]" />
            Presentation Phase Workflow Customization
          </h2>
          <p className="text-xs text-[--color-text-tertiary] mt-0.5">
            Enable, disable, or customize phases to match your institution&apos;s evaluation process
          </p>
        </div>

        <div className="divide-y divide-[--color-border]">
          {phases.map((phase) => (
            <div
              key={phase.id}
              className="py-3 flex items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 text-center font-bold text-[--color-text-tertiary]">
                  {phase.phase_number}
                </span>
                <div>
                  <div className="font-semibold text-[--color-text-primary]">
                    {phase.name}
                  </div>
                  {phase.description && (
                    <div className="text-[11px] text-[--color-text-tertiary]">
                      {phase.description}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[--color-text-secondary]">
                  <input
                    type="checkbox"
                    checked={phase.is_active}
                    onChange={(e) =>
                      togglePhaseActiveMutation.mutate({
                        id: phase.id,
                        is_active: e.target.checked,
                      })
                    }
                    className="rounded border-[--color-border] text-[--color-accent]"
                  />
                  <span>Active in workflow</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Danger Zone */}
      <div className="border border-red-200 rounded-[--radius-xl] p-5 bg-red-50/40 space-y-3">
        <h2 className="text-sm font-bold text-[--color-danger] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Danger Zone
        </h2>
        <p className="text-xs text-[--color-text-secondary]">
          Deleting this project will permanently remove all Kanban tasks, presentation phases,
          deliverables, feedback records, and milestones.
        </p>

        <Button
          variant="danger"
          size="sm"
          onClick={() => setIsDeleteModalOpen(true)}
        >
          Delete Project
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Project Deletion"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteProjectMutation.isPending}
              onClick={() => deleteProjectMutation.mutate()}
            >
              Permanently Delete
            </Button>
          </div>
        }
      >
        <p className="text-xs text-[--color-text-secondary] leading-relaxed">
          Are you sure you want to delete <strong>{currentProject.title}</strong>? This action cannot
          be undone.
        </p>
      </Modal>
    </div>
  )
}
