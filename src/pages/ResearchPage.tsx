import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BookOpen,
  Plus,
  ExternalLink,
  FileText,
  FlaskConical,
  CheckCircle2,
  Clock,
  Layers,
  Database as DbIcon,
  Tag,
  Trash2,
  Info,
  ChevronDown
} from 'lucide-react'
import { useProjectStore, useAuthStore, toast } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import {
  Button,
  Input,
  Textarea,
  Select,
  Badge,
  Modal,
  EmptyState,
  Spinner,
  Tabs
} from '@/components/ui'
import { cn, formatDate } from '@/lib/utils'
import type { Database } from '@/lib/database.types'

type ResearchPaper = Database['public']['Tables']['research_papers']['Row']

// Structure for Project Report Chapters stored locally / JSON in project doc_links or state
interface ReportChapter {
  id: string
  number: number
  title: string
  status: 'not_started' | 'drafting' | 'under_review' | 'completed'
  assignedTo: string
  wordCount?: number
  lastUpdated: string
}

// Structure for ML/CV Experiments
interface ExperimentRecord {
  id: string
  date: string
  modelArchitecture: string
  modelVersion: string
  datasetSize: string
  splits: string
  precision?: number
  recall?: number
  f1Score?: number
  mapScore?: number
  verifiedByTeam: boolean
  notes: string
}

const PAPER_STATUS_CONFIG: Record<
  ResearchPaper['status'],
  { label: string; bg: string; text: string; border: string }
> = {
  identified: {
    label: 'Identified',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
  },
  reading: {
    label: 'Reading',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  reviewed: {
    label: 'Reviewed',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  cited: {
    label: 'Cited in Report',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
}

export default function ResearchPage() {
  const { currentProject } = useProjectStore()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'papers' | 'chapters' | 'experiments'>('papers')

  // Modals
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false)
  const [isExperimentModalOpen, setIsExperimentModalOpen] = useState(false)

  // Paper Form
  const [paperForm, setPaperForm] = useState<Partial<ResearchPaper>>({
    status: 'identified',
    year: new Date().getFullYear(),
  })
  const [paperTitleError, setPaperTitleError] = useState('')

  // Experiment Form
  const [experimentForm, setExperimentForm] = useState<Partial<ExperimentRecord>>({
    date: new Date().toISOString().split('T')[0],
    splits: '70% Train / 15% Val / 15% Test',
    verifiedByTeam: true,
  })
  const [modelArchError, setModelArchError] = useState('')

  // Query: Research Papers from database
  const { data: papers = [], isLoading: papersLoading } = useQuery({
    queryKey: ['research_papers', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return []
      const { data, error } = await supabase
        .from('research_papers')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ResearchPaper[]
    },
    enabled: !!currentProject?.id,
  })

  // Paper Mutations
  const createPaperMutation = useMutation({
    mutationFn: async (form: Partial<ResearchPaper>) => {
      if (!currentProject?.id || !user?.id) throw new Error('No project or user')
      const { error } = await supabase.from('research_papers').insert({
        project_id: currentProject.id,
        added_by: user.id,
        title: form.title || 'Untitled Paper',
        authors: form.authors || null,
        year: form.year || null,
        doi: form.doi || null,
        url: form.url || null,
        journal: form.journal || null,
        status: form.status || 'identified',
        notes: form.notes || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research_papers', currentProject?.id] })
      setIsPaperModalOpen(false)
      setPaperForm({ status: 'identified', year: new Date().getFullYear() })
      setPaperTitleError('')
      toast('Research paper added successfully', 'success')
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to add research paper', 'error')
    },
  })

  const updatePaperStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ResearchPaper['status'] }) => {
      const { error } = await supabase
        .from('research_papers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research_papers', currentProject?.id] })
      toast('Paper status updated', 'success')
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to update paper status', 'error')
    },
  })

  const deletePaperMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('research_papers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research_papers', currentProject?.id] })
      toast('Research paper removed', 'info')
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to delete paper', 'error')
    },
  })

  // Local storage for engineering report chapters and experiments per project
  const chaptersKey = `project_chapters_${currentProject?.id}`
  const experimentsKey = `project_experiments_${currentProject?.id}`

  const defaultChapters: ReportChapter[] = [
    { id: '1', number: 1, title: 'Introduction & Problem Formulation', status: 'completed', assignedTo: 'Team Leader', lastUpdated: '2026-09-15' },
    { id: '2', number: 2, title: 'Literature Review & State of the Art', status: 'under_review', assignedTo: 'Member 1', lastUpdated: '2026-09-28' },
    { id: '3', number: 3, title: 'Proposed System Architecture & Methodology', status: 'drafting', assignedTo: 'Member 2', lastUpdated: '2026-10-05' },
    { id: '4', number: 4, title: 'Implementation & Experimental Setup', status: 'drafting', assignedTo: 'Member 3', lastUpdated: '2026-10-12' },
    { id: '5', number: 5, title: 'Results, Evaluation & Comparative Analysis', status: 'not_started', assignedTo: 'All', lastUpdated: '2026-10-14' },
    { id: '6', number: 6, title: 'Conclusion, Limitations & Future Scope', status: 'not_started', assignedTo: 'Team Leader', lastUpdated: '2026-10-14' },
  ]

  const [chapters, setChapters] = useState<ReportChapter[]>(() => {
    try {
      const saved = localStorage.getItem(chaptersKey)
      return saved ? JSON.parse(saved) : defaultChapters
    } catch {
      return defaultChapters
    }
  })

  const [experiments, setExperiments] = useState<ExperimentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(experimentsKey)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const updateChapterStatus = (id: string, status: ReportChapter['status']) => {
    const next = chapters.map((c) =>
      c.id === id ? { ...c, status, lastUpdated: new Date().toISOString().split('T')[0] } : c
    )
    setChapters(next)
    localStorage.setItem(chaptersKey, JSON.stringify(next))
  }

  const addExperiment = () => {
    if (!experimentForm.modelArchitecture?.trim()) {
      setModelArchError('Model architecture is required (e.g. YOLOv8, ResNet50)')
      return
    }
    setModelArchError('')
    const newExp: ExperimentRecord = {
      id: crypto.randomUUID(),
      date: experimentForm.date || new Date().toISOString().split('T')[0],
      modelArchitecture: experimentForm.modelArchitecture || 'YOLOv8',
      modelVersion: experimentForm.modelVersion || 'v1.0',
      datasetSize: experimentForm.datasetSize || '5,000 images',
      splits: experimentForm.splits || '70/15/15',
      precision: experimentForm.precision,
      recall: experimentForm.recall,
      f1Score: experimentForm.f1Score,
      mapScore: experimentForm.mapScore,
      verifiedByTeam: true,
      notes: experimentForm.notes || '',
    }
    const next = [newExp, ...experiments]
    setExperiments(next)
    localStorage.setItem(experimentsKey, JSON.stringify(next))
    setIsExperimentModalOpen(false)
    setExperimentForm({
      date: new Date().toISOString().split('T')[0],
      splits: '70% Train / 15% Val / 15% Test',
      verifiedByTeam: true,
    })
    toast('Experiment benchmark saved successfully', 'success')
  }

  if (!currentProject) {
    return (
      <div className="p-8">
        <EmptyState
          title="No Project Selected"
          description="Select a project to manage literature review, citations, report chapters, and experiments."
        />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[--color-text-primary] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[--color-accent]" />
            Research, Documentation & Experiments
          </h1>
          <p className="text-sm text-[--color-text-secondary] mt-0.5">
            Literature review papers, project report chapters, and model evaluation logs
          </p>
        </div>

        {activeTab === 'papers' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsPaperModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Research Paper
          </Button>
        )}

        {activeTab === 'experiments' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsExperimentModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Record Experiment
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'papers', label: 'Literature Review Papers', count: papers.length },
          { id: 'chapters', label: 'Project Report Chapters', count: chapters.length },
          { id: 'experiments', label: 'Model Experiments & Metrics', count: experiments.length },
        ]}
        active={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {/* TAB 1: RESEARCH PAPERS */}
      {activeTab === 'papers' && (
        <div className="space-y-4">
          {/* Summary counts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['identified', 'reading', 'reviewed', 'cited'] as const).map((st) => {
              const count = papers.filter((p) => p.status === st).length
              const cfg = PAPER_STATUS_CONFIG[st]
              return (
                <div
                  key={st}
                  className="bg-white border border-[--color-border] rounded-[--radius-lg] p-3 shadow-xs"
                >
                  <div className="text-xs font-semibold text-[--color-text-tertiary] uppercase">
                    {cfg.label}
                  </div>
                  <div className="text-lg font-bold text-[--color-text-primary] mt-1">
                    {count} papers
                  </div>
                </div>
              )
            })}
          </div>

          {papersLoading ? (
            <div className="py-20 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : papers.length === 0 ? (
            <EmptyState
              title="No Research Papers Added"
              description="Record literature survey papers, IEEE/ACM references, DOIs, and summarize research gaps."
              action={
                <Button variant="primary" size="sm" onClick={() => setIsPaperModalOpen(true)}>
                  Add First Paper
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {papers.map((p) => {
                const cfg = PAPER_STATUS_CONFIG[p.status]
                return (
                  <div
                    key={p.id}
                    className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-xs hover:border-[#D1D5DB] transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-[#202124]">
                            {p.title}
                          </h3>
                          <span
                            className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded border',
                              cfg.bg,
                              cfg.text,
                              cfg.border
                            )}
                          >
                            {cfg.label}
                          </span>
                        </div>

                        <div className="text-xs text-[#6B7280] mt-1 flex items-center gap-3 flex-wrap">
                          {p.authors && <span>Authors: {p.authors}</span>}
                          {p.year && <span>Year: {p.year}</span>}
                          {p.journal && <span>Journal / Venue: {p.journal}</span>}
                        </div>
                      </div>

                      {/* Status Selector & Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <select
                          value={p.status}
                          onChange={(e) =>
                            updatePaperStatusMutation.mutate({
                              id: p.id,
                              status: e.target.value as ResearchPaper['status'],
                            })
                          }
                          className="text-xs border border-[#E5E7EB] rounded px-2 py-1 bg-white font-medium text-[#202124]"
                          aria-label="Update paper status"
                        >
                          <option value="identified">Identified</option>
                          <option value="reading">Reading</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="cited">Cited in Report</option>
                        </select>

                        <button
                          onClick={() => deletePaperMutation.mutate(p.id)}
                          className="text-[#9CA3AF] hover:text-red-600 p-1 transition-colors"
                          title="Delete paper"
                          aria-label="Delete paper"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {p.notes && (
                      <p className="text-xs text-[#4B5563] bg-[#F7F7F5] border border-[#E5E7EB]/60 p-2.5 rounded-md">
                        <strong>Literature Notes & Gaps:</strong> {p.notes}
                      </p>
                    )}

                    <div className="flex items-center gap-3 pt-1 text-xs">
                      {p.doi && (
                        <span className="text-[#6B7280]">
                          DOI: <code className="bg-[#F1F1EE] px-1 py-0.5 rounded text-[11px]">{p.doi}</code>
                        </span>
                      )}
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#4338CA] hover:underline flex items-center gap-1 font-medium"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View Paper / Document
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROJECT REPORT CHAPTERS */}
      {activeTab === 'chapters' && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-[--radius-md] p-3 text-xs text-blue-800">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
            <p>
              Track standard engineering project report chapters as mandated by the university
              guidelines.
            </p>
          </div>

          <div className="bg-white border border-[--color-border] rounded-[--radius-xl] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[--color-surface] border-b border-[--color-border] text-[--color-text-secondary] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-16">Ch #</th>
                    <th className="py-3 px-4">Chapter Title</th>
                    <th className="py-3 px-4">Assigned Member</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--color-border]">
                  {chapters.map((ch) => (
                    <tr key={ch.id} className="hover:bg-[--color-surface] transition-colors">
                      <td className="py-3 px-4 font-bold text-[--color-text-tertiary]">
                        Chapter {ch.number}
                      </td>
                      <td className="py-3 px-4 font-medium text-[--color-text-primary]">
                        {ch.title}
                      </td>
                      <td className="py-3 px-4 text-[--color-text-secondary]">
                        {ch.assignedTo}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={ch.status}
                          onChange={(e) =>
                            updateChapterStatus(ch.id, e.target.value as ReportChapter['status'])
                          }
                          className={cn(
                            'border border-[--color-border] rounded px-2 py-1 text-xs font-semibold',
                            ch.status === 'completed'
                              ? 'bg-green-50 text-green-700'
                              : ch.status === 'under_review'
                              ? 'bg-purple-50 text-purple-700'
                              : ch.status === 'drafting'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-gray-50 text-gray-700'
                          )}
                          aria-label={`Status for ${ch.title}`}
                        >
                          <option value="not_started">Not Started</option>
                          <option value="drafting">Drafting</option>
                          <option value="under_review">Under Review</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-[--color-text-tertiary]">
                        {formatDate(ch.lastUpdated)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MODEL EXPERIMENTS & METRICS */}
      {activeTab === 'experiments' && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-[--radius-md] p-3 text-xs text-amber-800">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
            <p>
              <strong>Academic Integrity Notice:</strong> All training benchmarks, accuracy
              percentages, and evaluation metrics (Precision, Recall, F1, mAP) must be derived from
              reproducible code runs and verified by team members.
            </p>
          </div>

          {experiments.length === 0 ? (
            <EmptyState
              title="No Experiments Logged"
              description="Record model training configurations, dataset splits, hyperparameter runs, and benchmark metrics."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsExperimentModalOpen(true)}
                >
                  Record First Experiment
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {experiments.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-white border border-[--color-border] rounded-[--radius-lg] p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[--color-text-primary]">
                          {exp.modelArchitecture} ({exp.modelVersion})
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          Verified by Team
                        </span>
                      </div>
                      <div className="text-xs text-[--color-text-tertiary] mt-0.5">
                        Logged on {formatDate(exp.date)} · Dataset: {exp.datasetSize} · Splits:{' '}
                        {exp.splits}
                      </div>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center bg-[--color-surface] p-2.5 rounded-[--radius-md]">
                    <div>
                      <div className="text-xs text-[--color-text-tertiary] uppercase">Precision</div>
                      <div className="text-sm font-bold text-[--color-text-primary] mt-0.5">
                        {exp.precision !== undefined ? `${exp.precision}%` : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[--color-text-tertiary] uppercase">Recall</div>
                      <div className="text-sm font-bold text-[--color-text-primary] mt-0.5">
                        {exp.recall !== undefined ? `${exp.recall}%` : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[--color-text-tertiary] uppercase">F1 Score</div>
                      <div className="text-sm font-bold text-[--color-text-primary] mt-0.5">
                        {exp.f1Score !== undefined ? `${exp.f1Score}%` : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[--color-text-tertiary] uppercase">mAP@0.5</div>
                      <div className="text-sm font-bold text-[--color-accent] mt-0.5">
                        {exp.mapScore !== undefined ? `${exp.mapScore}%` : '—'}
                      </div>
                    </div>
                  </div>

                  {exp.notes && (
                    <p className="text-xs text-[--color-text-secondary]">
                      <strong>Notes:</strong> {exp.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Paper Modal */}
      <Modal
        open={isPaperModalOpen}
        onClose={() => {
          setIsPaperModalOpen(false)
          setPaperTitleError('')
        }}
        title="Add Research Paper"
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setIsPaperModalOpen(false)
                setPaperTitleError('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={createPaperMutation.isPending}
              onClick={() => {
                if (!paperForm.title?.trim()) {
                  setPaperTitleError('Please enter a research paper title')
                  return
                }
                setPaperTitleError('')
                createPaperMutation.mutate(paperForm)
              }}
            >
              Save Paper
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Paper Title *"
            placeholder="e.g. Deep Residual Learning for Image Recognition"
            value={paperForm.title || ''}
            error={paperTitleError}
            onChange={(e) => {
              setPaperForm((f) => ({ ...f, title: e.target.value }))
              if (paperTitleError) setPaperTitleError('')
            }}
            required
          />

          <Input
            label="Authors"
            placeholder="e.g. K. He, X. Zhang, S. Ren, J. Sun"
            value={paperForm.authors || ''}
            onChange={(e) => setPaperForm((f) => ({ ...f, authors: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Publication Year"
              type="number"
              value={paperForm.year || ''}
              onChange={(e) =>
                setPaperForm((f) => ({ ...f, year: Number(e.target.value) || undefined }))
              }
            />

            <Select
              label="Reading Status"
              options={[
                { value: 'identified', label: 'Identified' },
                { value: 'reading', label: 'Reading' },
                { value: 'reviewed', label: 'Reviewed' },
                { value: 'cited', label: 'Cited in Report' },
              ]}
              value={paperForm.status || 'identified'}
              onChange={(e) =>
                setPaperForm((f) => ({
                  ...f,
                  status: e.target.value as ResearchPaper['status'],
                }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="DOI"
              placeholder="e.g. 10.1109/CVPR.2016.90"
              value={paperForm.doi || ''}
              onChange={(e) => setPaperForm((f) => ({ ...f, doi: e.target.value }))}
            />

            <Input
              label="URL / Link"
              placeholder="https://arxiv.org/abs/..."
              value={paperForm.url || ''}
              onChange={(e) => setPaperForm((f) => ({ ...f, url: e.target.value }))}
            />
          </div>

          <Input
            label="Conference / Journal"
            placeholder="e.g. IEEE CVPR / ACM Transactions"
            value={paperForm.journal || ''}
            onChange={(e) => setPaperForm((f) => ({ ...f, journal: e.target.value }))}
          />

          <Textarea
            label="Research Gaps, Methodology Notes & Relevance"
            placeholder="Key findings, how this informs our approach, limitations of existing method..."
            value={paperForm.notes || ''}
            onChange={(e) => setPaperForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
          />
        </div>
      </Modal>

      {/* Record Experiment Modal */}
      <Modal
        open={isExperimentModalOpen}
        onClose={() => {
          setIsExperimentModalOpen(false)
          setModelArchError('')
        }}
        title="Record Model Experiment"
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setIsExperimentModalOpen(false)
                setModelArchError('')
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={addExperiment}>
              Save Benchmark
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Model Architecture *"
              placeholder="e.g. YOLOv8s / ResNet50"
              value={experimentForm.modelArchitecture || ''}
              error={modelArchError}
              onChange={(e) => {
                setExperimentForm((f) => ({ ...f, modelArchitecture: e.target.value }))
                if (modelArchError) setModelArchError('')
              }}
              required
            />
            <Input
              label="Model Version / Iteration"
              placeholder="e.g. v1.2-augmented"
              value={experimentForm.modelVersion || ''}
              onChange={(e) => setExperimentForm((f) => ({ ...f, modelVersion: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Dataset Size"
              placeholder="e.g. 8,500 annotated frames"
              value={experimentForm.datasetSize || ''}
              onChange={(e) => setExperimentForm((f) => ({ ...f, datasetSize: e.target.value }))}
            />
            <Input
              label="Splits"
              placeholder="e.g. 70/15/15"
              value={experimentForm.splits || ''}
              onChange={(e) => setExperimentForm((f) => ({ ...f, splits: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Input
              label="Precision (%)"
              type="number"
              step="0.1"
              value={experimentForm.precision ?? ''}
              onChange={(e) =>
                setExperimentForm((f) => ({
                  ...f,
                  precision: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            />
            <Input
              label="Recall (%)"
              type="number"
              step="0.1"
              value={experimentForm.recall ?? ''}
              onChange={(e) =>
                setExperimentForm((f) => ({
                  ...f,
                  recall: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            />
            <Input
              label="F1 Score (%)"
              type="number"
              step="0.1"
              value={experimentForm.f1Score ?? ''}
              onChange={(e) =>
                setExperimentForm((f) => ({
                  ...f,
                  f1Score: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            />
            <Input
              label="mAP@0.5 (%)"
              type="number"
              step="0.1"
              value={experimentForm.mapScore ?? ''}
              onChange={(e) =>
                setExperimentForm((f) => ({
                  ...f,
                  mapScore: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            />
          </div>

          <Textarea
            label="Training Configuration & Hyperparameter Notes"
            placeholder="Batch size, learning rate schedule, optimizer, loss curves..."
            value={experimentForm.notes || ''}
            onChange={(e) => setExperimentForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
          />
        </div>
      </Modal>
    </div>
  )
}
