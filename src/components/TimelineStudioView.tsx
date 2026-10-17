import React, { useState, useRef, useEffect } from 'react'
import {
  Compass,
  Calendar,
  Clock,
  Pencil,
  Plus,
  Phone,
  PhoneOff,
  Paperclip,
  Smile,
  Mic,
  Send,
  Play,
  Pause,
  X,
  MoreHorizontal,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Box,
  MessageCircle,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Volume2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Database } from '@/lib/database.types'

type Task = Database['public']['Tables']['tasks']['Row']
type Member = Database['public']['Tables']['project_members']['Row'] & {
  profile?: Database['public']['Tables']['profiles']['Row']
}

interface TimelineStudioViewProps {
  tasks: Task[]
  members: Member[]
  currentProject: Database['public']['Tables']['projects']['Row'] | null
  onOpenTask: (task: Task) => void
  onQuickAdd: (status: 'todo' | 'in_progress' | 'in_review' | 'done') => void
}

// Days in timeline grid
const DAYS = [
  { day: 'M', date: '08', isWeekend: false },
  { day: 'T', date: '09', isWeekend: false },
  { day: 'W', date: '10', isWeekend: false },
  { day: 'T', date: '11', isWeekend: false },
  { day: 'F', date: '12', isWeekend: false },
  { day: 'S', date: '13', isWeekend: true },
  { day: 'S', date: '14', isWeekend: true },
  { day: 'M', date: '15', isWeekend: false },
  { day: 'T', date: '16', isWeekend: false },
  { day: 'W', date: '17', isWeekend: false },
  { day: 'T', date: '18', isWeekend: false },
  { day: 'F', date: '19', isWeekend: false },
  { day: 'S', date: '20', isWeekend: true },
  { day: 'S', date: '21', isWeekend: true, isToday: true },
  { day: 'M', date: '22', isWeekend: false },
  { day: 'T', date: '23', isWeekend: false },
]

// Sample team avatars matching the playful editorial design
const DEMO_AVATARS = {
  ingrid: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  thomas: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  peter: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
  liza: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  alex: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
  sarah: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80',
}

interface ChatMessage {
  id: string
  sender: string
  avatar: string
  text?: string
  isAudio?: boolean
  audioDuration?: string
  isOutgoing?: boolean
  timestamp: string
}

export function TimelineStudioView({
  tasks,
  members,
  currentProject,
  onOpenTask,
  onQuickAdd,
}: TimelineStudioViewProps) {
  // Selected task in right inspector
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0)

  // Floating call popover
  const [callActive, setCallActive] = useState<boolean>(true)
  const [callStatus, setCallStatus] = useState<'incoming' | 'connected' | 'ended'>('incoming')

  // Audio note playback state
  const [audioPlaying, setAudioPlaying] = useState(false)

  // Chat widget
  const [chatOpen, setChatOpen] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'Liza',
      avatar: DEMO_AVATARS.liza,
      isAudio: true,
      audioDuration: '1:29',
      isOutgoing: false,
      timestamp: '09:28',
    },
    {
      id: '2',
      sender: 'You',
      avatar: DEMO_AVATARS.thomas,
      text: "Yep, it's complete!",
      isOutgoing: true,
      timestamp: '09:30',
    },
  ])

  // Studio timeline tasks
  const timelinePills = [
    {
      id: 'dash',
      title: 'Dashboard',
      gradient: 'from-[#00A3FF] to-[#0284C7]',
      shadow: 'shadow-[0_8px_20px_rgba(0,163,255,0.3)]',
      startCol: 6,
      spanCols: 4,
      row: 1,
      hasCallBtn: true,
      avatars: [DEMO_AVATARS.alex, DEMO_AVATARS.sarah],
    },
    {
      id: 'pay',
      title: 'Payment',
      gradient: 'from-[#F87171] to-[#EF4444]',
      shadow: 'shadow-[0_8px_20px_rgba(239,68,68,0.28)]',
      startCol: 7,
      spanCols: 3,
      row: 2,
      avatars: [DEMO_AVATARS.peter, DEMO_AVATARS.ingrid],
    },
    {
      id: 'msg',
      title: 'Messenger',
      gradient: 'from-[#2DD4BF] to-[#14B8A6]',
      shadow: 'shadow-[0_8px_20px_rgba(20,184,166,0.28)]',
      startCol: 11,
      spanCols: 4,
      row: 2,
      avatars: [DEMO_AVATARS.thomas, DEMO_AVATARS.liza],
    },
    {
      id: 'prof',
      title: 'Profile',
      gradient: 'from-[#86EFAC] to-[#34D399]',
      shadow: 'shadow-[0_8px_20px_rgba(52,211,153,0.25)]',
      startCol: 7,
      spanCols: 3,
      row: 3,
      avatars: [DEMO_AVATARS.ingrid],
    },
    {
      id: 'mus',
      title: 'Music',
      gradient: 'from-[#38BDF8] to-[#22D3EE]',
      shadow: 'shadow-[0_8px_20px_rgba(34,211,238,0.28)]',
      startCol: 6,
      spanCols: 5,
      row: 4,
      progress: '81%',
      avatars: [DEMO_AVATARS.alex, DEMO_AVATARS.sarah],
    },
    {
      id: 'del',
      title: 'Delivery Service',
      gradient: 'from-[#FBBF24] to-[#F59E0B]',
      shadow: 'shadow-[0_8px_20px_rgba(245,158,11,0.28)]',
      startCol: 8,
      spanCols: 6,
      row: 5,
      progress: '89%',
      hasCheck: true,
      avatars: [DEMO_AVATARS.peter, DEMO_AVATARS.thomas],
    },
  ]

  // Queue and in-progress sample data mapped from real tasks or demo cards
  const inProgressList = tasks.filter((t) => t.status === 'in_progress').length > 0
    ? tasks.filter((t) => t.status === 'in_progress')
    : [
        {
          id: 'demo-1',
          title: 'Create payment system',
          tag: 'Dashboard',
          tagColor: 'bg-[#FCE7F3] text-[#BE185D]',
          progress: 81,
          avatars: [DEMO_AVATARS.ingrid, DEMO_AVATARS.thomas],
        },
        {
          id: 'demo-2',
          title: 'Listen similar audio function',
          tag: 'Music',
          tagColor: 'bg-[#EDE9FE] text-[#6D28D9]',
          progress: 54,
          avatars: [DEMO_AVATARS.alex],
        },
      ]

  const queueList = tasks.filter((t) => t.status === 'todo').length > 0
    ? tasks.filter((t) => t.status === 'todo')
    : [
        {
          id: 'demo-3',
          title: 'Create messanger with multi calls',
          author: 'Peter S.',
          avatars: [DEMO_AVATARS.peter, DEMO_AVATARS.liza],
        },
        {
          id: 'demo-4',
          title: 'Design System Documentation',
          author: 'Peter S.',
          avatars: [DEMO_AVATARS.thomas],
        },
      ]

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const newMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'You',
      avatar: DEMO_AVATARS.thomas,
      text: chatInput.trim(),
      isOutgoing: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setChatMessages((prev) => [...prev, newMsg])
    setChatInput('')

    // Auto reply for delightful interactive feel
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'Liza',
          avatar: DEMO_AVATARS.liza,
          text: 'Great work! Merging this into the preview branch now.',
          isOutgoing: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    }, 1200)
  }

  return (
    <div className="min-h-full bg-[#E5F5F6] p-2 sm:p-5 flex flex-col justify-center items-center">
      {/* Mega App Frame with smooth modern rounded borders */}
      <div className="w-full max-w-[1480px] bg-white rounded-[32px] shadow-[0_25px_60px_-15px_rgba(20,110,130,0.12)] border border-[#E0EDF0] flex flex-col overflow-hidden relative">
        
        {/* ─── 1. TOP HEADER ──────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9] shrink-0 bg-white">
          {/* Left: Back button + Project Emblem + Title & Stage */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
              title="Back"
            >
              <ChevronLeft size={16} />
            </button>

            {/* 3D Playful Icon Block */}
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] flex items-center justify-center shadow-xs border border-[#FCD34D]/40 relative group cursor-pointer">
              <span className="text-xl select-none transform group-hover:scale-110 transition-transform">
                🚀
              </span>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00A3FF] flex items-center justify-center border-2 border-white">
                <Play size={7} className="text-white fill-white ml-0.5" />
              </div>
            </div>

            {/* Title & Stage Pills */}
            <div>
              <h1 className="text-base font-bold text-[#0F172A] tracking-tight">
                {currentProject?.title || 'Apps Store Project Management'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B]">
                  <span className="w-3.5 h-3.5 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                    <Pencil size={8} />
                  </span>
                  {currentProject?.category || 'Design Stage'}
                </span>
                <span className="bg-[#E0F2FE] text-[#0284C7] font-bold text-[11px] px-2 py-0.5 rounded-full">
                  83%
                </span>
              </div>
            </div>
          </div>

          {/* Right: + Invite Designers, Avatars, Icons, Profile */}
          <div className="flex items-center gap-3">
            {/* Invite Button */}
            <button
              type="button"
              onClick={() => onQuickAdd('todo')}
              className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-dashed border-[#CBD5E1] text-[#475569] hover:border-[#00A3FF] hover:text-[#00A3FF] font-semibold text-xs transition-all"
            >
              <span className="w-4 h-4 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B]">
                <Plus size={10} />
              </span>
              <span>Invite Designers</span>
            </button>

            {/* Member Stack with +21 Badge */}
            <div className="flex items-center -space-x-2">
              <img
                src={DEMO_AVATARS.sarah}
                alt="Sarah"
                className="w-7 h-7 rounded-full object-cover ring-2 ring-white"
              />
              <img
                src={DEMO_AVATARS.peter}
                alt="Peter"
                className="w-7 h-7 rounded-full object-cover ring-2 ring-white"
              />
              <img
                src={DEMO_AVATARS.liza}
                alt="Liza"
                className="w-7 h-7 rounded-full object-cover ring-2 ring-white"
              />
              <div className="w-7 h-7 rounded-full bg-[#E0F2FE] border-2 border-dashed border-[#38BDF8] flex items-center justify-center text-[10px] font-bold text-[#0284C7] shadow-2xs select-none">
                +21
              </div>
            </div>

            <div className="w-px h-6 bg-[#E2E8F0] mx-1" />

            {/* 3D Cube Icon Button */}
            <button
              type="button"
              className="w-8 h-8 rounded-xl bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5] flex items-center justify-center hover:scale-105 transition-transform"
              title="3D Asset Library"
            >
              <Box size={15} />
            </button>

            {/* Chat Bubble Icon Button with Live Dot */}
            <button
              type="button"
              onClick={() => setChatOpen(!chatOpen)}
              className="w-8 h-8 rounded-xl bg-[#F0FDFA] text-[#0D9488] border border-[#CCFBF1] flex items-center justify-center hover:scale-105 transition-transform relative"
              title="Toggle Live Chat"
            >
              <MessageCircle size={15} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#00A3FF] ring-2 ring-white" />
            </button>

            {/* Current Profile Avatar */}
            <div className="flex items-center gap-1 pl-1 cursor-pointer">
              <img
                src={DEMO_AVATARS.ingrid}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-[#00A3FF]/20"
              />
              <ChevronDown size={13} className="text-[#94A3B8]" />
            </div>
          </div>
        </header>

        {/* ─── 2. MAIN 3-COLUMN CONTENT CANVAS ────────────────────────────────────── */}
        <div className="flex-1 grid grid-cols-12 overflow-hidden min-h-[640px]">
          
          {/* ── COLUMN A: TASK QUEUE / IN PROGRESS (Col 1-3) ─────────────────────── */}
          <div className="col-span-12 lg:col-span-3 border-r border-[#F1F5F9] bg-[#FCFDFD] p-5 flex flex-col gap-6 overflow-y-auto">
            
            {/* Group 1: In Progress */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#0F172A] tracking-tight">
                    In Progress
                  </span>
                  <span className="w-5 h-5 rounded-full bg-[#E0F2FE] text-[#0284C7] text-[10px] font-bold flex items-center justify-center">
                    2
                  </span>
                </div>
                <button type="button" className="text-[#94A3B8] hover:text-[#0F172A]">
                  <MoreHorizontal size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {/* Floating Card 1: Create payment system */}
                <div
                  onClick={() => onQuickAdd('in_progress')}
                  className="bg-white rounded-2xl p-4 shadow-[0_8px_20px_rgba(0,0,0,0.04)] border border-[#F1F5F9] hover:border-[#00A3FF]/40 hover:shadow-md transition-all cursor-pointer relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-[#0F172A] leading-snug">
                      Create payment system
                    </span>
                    <span className="text-xs font-bold text-[#0F172A]">81%</span>
                  </div>

                  <div className="flex items-center justify-between mt-3.5">
                    <span className="text-[10px] font-bold bg-[#FCE7F3] text-[#BE185D] px-2.5 py-0.5 rounded-full">
                      Dashboard
                    </span>
                    <div className="flex items-center -space-x-1.5">
                      <img
                        src={DEMO_AVATARS.ingrid}
                        alt="Ingrid"
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
                      />
                      <img
                        src={DEMO_AVATARS.thomas}
                        alt="Thomas"
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
                      />
                      <span className="w-5 h-5 rounded-full bg-[#F1F5F9] text-[9px] font-bold text-[#64748B] flex items-center justify-center ring-1 ring-white">
                        SD
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating Card 2: Listen similar audio function */}
                <div
                  onClick={() => onQuickAdd('in_progress')}
                  className="bg-white rounded-2xl p-4 shadow-[0_8px_20px_rgba(0,0,0,0.04)] border border-[#F1F5F9] hover:border-[#00A3FF]/40 hover:shadow-md transition-all cursor-pointer relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-[#0F172A] leading-snug">
                      Listen similar audio function
                    </span>
                    <span className="text-xs font-bold text-[#0F172A]">54%</span>
                  </div>

                  <div className="flex items-center justify-between mt-3.5">
                    <span className="text-[10px] font-bold bg-[#EDE9FE] text-[#6D28D9] px-2.5 py-0.5 rounded-full">
                      Music
                    </span>
                    <div className="flex items-center -space-x-1.5">
                      <img
                        src={DEMO_AVATARS.alex}
                        alt="Alex"
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
                      />
                      <span className="w-5 h-5 rounded-full bg-[#E0F2FE] text-[9px] font-bold text-[#0284C7] flex items-center justify-center ring-1 ring-white">
                        FR
                      </span>
                    </div>
                  </div>
                </div>

                {/* + Task pill button */}
                <button
                  type="button"
                  onClick={() => onQuickAdd('in_progress')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#F0F9FF] hover:bg-[#E0F2FE] text-[#0284C7] text-xs font-semibold transition-all border border-[#E0F2FE]"
                >
                  <span className="w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-2xs">
                    <Pencil size={9} />
                  </span>
                  <span>+ Task</span>
                </button>
              </div>
            </div>

            {/* Group 2: Queue */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#0F172A] tracking-tight">
                    Queue
                  </span>
                  <span className="w-5 h-5 rounded-full bg-[#F1F5F9] text-[#64748B] text-[10px] font-bold flex items-center justify-center">
                    6
                  </span>
                </div>
                <button type="button" className="text-[#94A3B8] hover:text-[#0F172A]">
                  <MoreHorizontal size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {/* Card 3: Create messenger with multi calls */}
                <div
                  onClick={() => onQuickAdd('todo')}
                  className="bg-white rounded-2xl p-4 shadow-[0_8px_20px_rgba(0,0,0,0.04)] border border-[#F1F5F9] hover:border-[#00A3FF]/40 hover:shadow-md transition-all cursor-pointer"
                >
                  <span className="text-xs font-bold text-[#0F172A] block leading-snug">
                    Create messenger with multi calls
                  </span>

                  <div className="flex items-center justify-between mt-3 text-[11px] text-[#64748B]">
                    <div className="flex items-center gap-1">
                      <span>by</span>
                      <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-600 text-[8px] font-bold flex items-center justify-center">
                        TH
                      </span>
                      <span className="font-medium text-[#0F172A]">Peter S.</span>
                    </div>

                    <div className="flex items-center -space-x-1.5">
                      <img
                        src={DEMO_AVATARS.peter}
                        alt="Peter"
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
                      />
                      <span className="w-5 h-5 rounded-full bg-[#F1F5F9] text-[9px] font-bold text-[#64748B] flex items-center justify-center ring-1 ring-white">
                        FR
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 4: Design System */}
                <div
                  onClick={() => onQuickAdd('todo')}
                  className="bg-white rounded-2xl p-4 shadow-[0_8px_20px_rgba(0,0,0,0.04)] border border-[#F1F5F9] hover:border-[#00A3FF]/40 hover:shadow-md transition-all cursor-pointer"
                >
                  <span className="text-xs font-bold text-[#0F172A] block leading-snug">
                    Design System
                  </span>
                  <div className="flex items-center gap-1 mt-2 text-[11px] text-[#64748B]">
                    <span>by</span>
                    <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-600 text-[8px] font-bold flex items-center justify-center">
                      TH
                    </span>
                    <span className="font-medium text-[#0F172A]">Peter S.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── COLUMN B: INTERACTIVE TIMELINE / GANTT GRID (Col 4-9) ───────────── */}
          <div className="col-span-12 lg:col-span-6 bg-white flex flex-col overflow-x-auto relative">
            
            {/* Timeline Header Row (Days) */}
            <div className="grid grid-cols-16 border-b border-[#F1F5F9] py-3 px-2 text-center text-xs select-none relative shrink-0 min-w-[600px]">
              {DAYS.map((d, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex flex-col items-center justify-center transition-colors',
                    d.isToday ? 'font-bold text-[#00A3FF]' : 'text-[#64748B]'
                  )}
                >
                  <span className="text-[10px] text-[#94A3B8] font-medium">{d.day}</span>
                  <span className={cn('text-xs mt-0.5', d.isToday && 'text-[#00A3FF]')}>
                    {d.date}
                  </span>
                </div>
              ))}

              {/* Today Pill & Time Label on S 21 */}
              <div className="absolute right-[11.5%] top-1.5 flex flex-col items-center z-20 pointer-events-none">
                <span className="bg-[#0F172A] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs mb-1">
                  9:31
                </span>
                <button
                  type="button"
                  className="pointer-events-auto bg-white border border-[#CBD5E1] shadow-2xs rounded-full px-2.5 py-0.5 text-[10px] font-bold text-[#0F172A] hover:bg-[#F8FAFC] flex items-center gap-1"
                >
                  <span>&lt; Today &gt;</span>
                </button>
              </div>
            </div>

            {/* Timeline Grid Body with Vertical Columns & Horizontal Rows */}
            <div className="flex-1 relative min-h-[500px] min-w-[600px] p-2">
              
              {/* Vertical Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-16 pointer-events-none">
                {DAYS.map((d, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'border-r border-[#F8FAFC] h-full relative',
                      d.isToday && 'border-r-2 border-r-[#00A3FF]/40 bg-[#00A3FF]/[0.02]'
                    )}
                  />
                ))}
              </div>

              {/* Vertical Today Line */}
              <div className="absolute right-[14.8%] top-0 bottom-0 w-0.5 bg-[#00A3FF] z-10 pointer-events-none opacity-80" />

              {/* ─── SVG Bezier Milestone Curve ─── */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Curved dashed cyan path from amber diamond to Dashboard and workflow node */}
                <path
                  d="M 230 45 C 280 45, 320 65, 330 95"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />
              </svg>

              {/* Milestone Diamond Marker */}
              <div className="absolute left-[34%] top-6 z-20 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 rotate-45 flex items-center justify-center shadow-xs border border-white">
                  <span className="-rotate-45 text-[10px]">💎</span>
                </div>
              </div>

              {/* Multi-color Figma/workflow Node */}
              <div className="absolute left-[54%] top-23 z-20 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-5 h-5 rounded-full bg-white shadow-md border border-[#E2E8F0] flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-0.5 p-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  </div>
                </div>
              </div>

              {/* ─── Timeline Gantt Pill Bars ─── */}
              <div className="relative z-10 space-y-4 pt-4">
                
                {/* Row 1: Blue Dashboard Pill */}
                <div className="h-10 flex items-center relative">
                  <div
                    style={{ left: '33%', width: '30%' }}
                    className="absolute bg-gradient-to-r from-[#00A3FF] to-[#0284C7] text-white rounded-full px-3 py-1.5 shadow-[0_6px_18px_rgba(0,163,255,0.35)] flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => setSelectedTaskIndex(0)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center -space-x-1.5">
                        <img
                          src={DEMO_AVATARS.alex}
                          alt="Alex"
                          className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
                        />
                        <img
                          src={DEMO_AVATARS.sarah}
                          alt="Sarah"
                          className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
                        />
                      </div>
                      <span className="text-xs font-bold tracking-tight">Dashboard</span>
                    </div>

                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                      <Phone size={10} className="text-white" />
                    </div>
                  </div>
                </div>

                {/* Row 2: Red Payment & Mint Messenger Pills */}
                <div className="h-10 flex items-center relative">
                  {/* Coral Payment Pill */}
                  <div
                    style={{ left: '42%', width: '18%' }}
                    className="absolute bg-gradient-to-r from-[#F87171] to-[#EF4444] text-white rounded-full px-3 py-1.5 shadow-[0_6px_18px_rgba(239,68,68,0.3)] flex items-center gap-2 cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => setSelectedTaskIndex(1)}
                  >
                    <img
                      src={DEMO_AVATARS.peter}
                      alt="Peter"
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
                    />
                    <span className="text-xs font-bold truncate">Payment</span>
                  </div>

                  {/* Mint Messenger Pill */}
                  <div
                    style={{ left: '68%', width: '27%' }}
                    className="absolute bg-gradient-to-r from-[#2DD4BF] to-[#14B8A6] text-white rounded-full px-3.5 py-1.5 shadow-[0_6px_18px_rgba(20,184,166,0.3)] flex items-center gap-2 cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => setSelectedTaskIndex(0)}
                  >
                    <div className="flex items-center -space-x-1.5">
                      <img
                        src={DEMO_AVATARS.thomas}
                        alt="Thomas"
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
                      />
                      <img
                        src={DEMO_AVATARS.liza}
                        alt="Liza"
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
                      />
                    </div>
                    <span className="text-xs font-bold truncate">Messenger</span>
                  </div>
                </div>

                {/* Row 3: Soft Mint Profile Pill */}
                <div className="h-10 flex items-center relative">
                  <div
                    style={{ left: '41%', width: '19%' }}
                    className="absolute bg-[#A7F3D0] text-[#065F46] rounded-full px-3 py-1.5 shadow-xs flex items-center gap-2 cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => setSelectedTaskIndex(0)}
                  >
                    <img
                      src={DEMO_AVATARS.ingrid}
                      alt="Ingrid"
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
                    />
                    <span className="text-xs font-bold truncate">Profile</span>
                  </div>
                </div>

                {/* Row 4: Cyan Music Pill */}
                <div className="h-10 flex items-center relative">
                  <div
                    style={{ left: '33%', width: '38%' }}
                    className="absolute bg-gradient-to-r from-[#38BDF8] to-[#22D3EE] text-white rounded-full px-3.5 py-1.5 shadow-[0_6px_18px_rgba(56,189,248,0.3)] flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => setSelectedTaskIndex(1)}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={DEMO_AVATARS.alex}
                        alt="Alex"
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
                      />
                      <span className="text-xs font-bold">Music</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold">
                      <span>81%</span>
                      <ChevronRight size={12} />
                    </div>
                  </div>
                </div>

                {/* Row 5: Golden Amber Delivery Service Pill */}
                <div className="h-10 flex items-center relative">
                  {/* Left 89% Indicator */}
                  <div
                    style={{ left: '30%' }}
                    className="absolute bg-[#FEF3C7] text-[#D97706] font-bold text-[11px] px-2.5 py-1 rounded-full shadow-2xs flex items-center gap-1"
                  >
                    <span>89%</span>
                    <ChevronRight size={11} />
                  </div>

                  {/* Delivery Service Capsule */}
                  <div
                    style={{ left: '48%', width: '45%' }}
                    className="absolute bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] text-white rounded-full px-3.5 py-1.5 shadow-[0_6px_18px_rgba(245,158,11,0.28)] flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => setSelectedTaskIndex(0)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center -space-x-1.5">
                        <img
                          src={DEMO_AVATARS.peter}
                          alt="Peter"
                          className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
                        />
                        <img
                          src={DEMO_AVATARS.thomas}
                          alt="Thomas"
                          className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
                        />
                      </div>
                      <span className="text-xs font-bold">Delivery Service</span>
                    </div>

                    <div className="w-5 h-5 rounded-full bg-white text-[#F59E0B] flex items-center justify-center shadow-2xs">
                      <Check size={11} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Floating Group Call Popover ─── */}
              {callActive && (
                <div
                  style={{ left: '50%', top: '35%' }}
                  className="absolute z-30 transform -translate-x-1/2 w-48 bg-white rounded-2xl shadow-[0_16px_36px_rgba(0,0,0,0.12)] border border-[#E2E8F0] p-3 text-center animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      onClick={() => setCallActive(false)}
                      className="text-[#94A3B8] hover:text-[#0F172A]"
                    >
                      <X size={13} />
                    </button>
                    <button type="button" className="text-[#94A3B8] hover:text-[#0F172A]">
                      <MoreHorizontal size={13} />
                    </button>
                  </div>

                  <div className="flex flex-col items-center">
                    <img
                      src={DEMO_AVATARS.ingrid}
                      alt="Ingrid Helm"
                      className="w-12 h-12 rounded-full object-cover ring-4 ring-[#E0F2FE] mb-2"
                    />
                    <h4 className="text-xs font-bold text-[#0F172A]">Ingrid Helm</h4>
                    <p className="text-[10px] text-[#64748B] mt-0.5">Group call</p>
                  </div>

                  <div className="flex items-center justify-center gap-3 mt-3">
                    <button
                      type="button"
                      onClick={() => setCallStatus('connected')}
                      className="w-8 h-8 rounded-full bg-[#10B981] hover:bg-[#059669] text-white flex items-center justify-center shadow-sm transition-transform hover:scale-105"
                      title="Accept call"
                    >
                      <Phone size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCallActive(false)}
                      className="w-8 h-8 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white flex items-center justify-center shadow-sm transition-transform hover:scale-105"
                      title="Decline call"
                    >
                      <PhoneOff size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── COLUMN C: TASK DETAIL & INSPECTOR (Col 10-12) ────────────────────── */}
          <div className="col-span-12 lg:col-span-3 border-l border-[#F1F5F9] bg-white p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Header Badges */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#F5F3FF] text-[#7C3AED] px-3 py-1 rounded-full">
                  <Pencil size={11} />
                  UI Design Team
                </span>

                <button
                  type="button"
                  className="flex items-center gap-1 text-xs font-semibold text-[#475569] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-full hover:bg-[#F1F5F9]"
                >
                  <span>Task 8</span>
                  <ChevronDown size={12} />
                </button>
              </div>

              {/* Big Bold Headline */}
              <h2 className="text-2xl font-bold text-[#0F172A] leading-tight tracking-tight mt-2">
                Create profile page with news feed.
              </h2>

              {/* Creator line */}
              <div className="flex items-center gap-2 mt-4">
                <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-600 font-bold text-[9px] flex items-center justify-center">
                  TH
                </span>
                <span className="text-xs font-medium text-[#64748B]">Thomas Hayes</span>
              </div>

              {/* Members Section */}
              <div className="mt-8">
                <h3 className="text-xs font-bold text-[#0F172A] mb-3">Members</h3>
                <div className="flex items-center gap-2">
                  <img
                    src={DEMO_AVATARS.thomas}
                    alt="Thomas"
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-2xs"
                  />
                  <span className="w-8 h-8 rounded-full bg-[#E0F2FE] text-[#0284C7] font-bold text-xs flex items-center justify-center shadow-2xs">
                    FR
                  </span>
                  <img
                    src={DEMO_AVATARS.liza}
                    alt="Liza"
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-2xs"
                  />
                  <img
                    src={DEMO_AVATARS.sarah}
                    alt="Sarah"
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-2xs"
                  />
                  <div className="w-8 h-8 rounded-full bg-white border border-dashed border-[#CBD5E1] text-[#64748B] font-bold text-xs flex items-center justify-center cursor-pointer hover:border-[#00A3FF]">
                    +4
                  </div>
                </div>
              </div>

              {/* Scheduled Time Card */}
              <div className="mt-8 bg-[#F0F9FF] border border-[#E0F2FE] rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white shadow-2xs flex items-center justify-center text-[#00A3FF]">
                    <Compass size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0F172A]">Sunday, 21 September</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">08:00 – 11:00 AM</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="text-[#94A3B8] hover:text-[#0F172A] p-1"
                  title="Edit schedule"
                >
                  <Pencil size={13} />
                </button>
              </div>
            </div>

            {/* Quick Status / Milestone Progress button */}
            <div className="pt-6 border-t border-[#F1F5F9] mt-6">
              <button
                type="button"
                onClick={() => onQuickAdd('in_progress')}
                className="w-full py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <CheckCircle2 size={14} />
                <span>Mark Task Complete</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── 3. FLOATING LIVE TEAM CHAT WIDGET (Bottom Right) ────────────────────── */}
        {chatOpen && (
          <div className="fixed bottom-6 right-8 z-50 w-80 bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-[#E2E8F0] p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Chat Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0F172A]">Chat</span>
                <span className="flex items-center gap-1 text-[10px] text-[#64748B]">
                  <Pencil size={9} />
                  Liza is typing...
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center -space-x-1.5">
                  <img
                    src={DEMO_AVATARS.liza}
                    alt="Liza"
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
                  />
                  <img
                    src={DEMO_AVATARS.thomas}
                    alt="Thomas"
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  className="text-[#94A3B8] hover:text-[#0F172A]"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="space-y-3 py-1 max-h-48 overflow-y-auto">
              {/* Voice Message Bubble */}
              <div className="flex items-center gap-2">
                <img
                  src={DEMO_AVATARS.liza}
                  alt="Liza"
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-white shrink-0 self-end"
                />
                <div className="bg-[#E0F2FE] rounded-2xl px-3 py-2 flex items-center gap-2.5 text-xs text-[#0284C7] shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setAudioPlaying(!audioPlaying)}
                    className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-xs hover:scale-105 transition-transform"
                  >
                    {audioPlaying ? (
                      <Pause size={10} className="fill-[#0284C7] text-[#0284C7]" />
                    ) : (
                      <Play size={10} className="fill-[#0284C7] text-[#0284C7] ml-0.5" />
                    )}
                  </button>

                  {/* Waveform Visualizer */}
                  <div className="flex items-center gap-0.5 h-4">
                    {[12, 18, 8, 16, 22, 10, 14, 20, 9, 15].map((h, i) => (
                      <span
                        key={i}
                        style={{ height: `${h}px` }}
                        className={cn(
                          'w-0.5 bg-[#0284C7] rounded-full transition-all duration-150',
                          audioPlaying && 'animate-pulse'
                        )}
                      />
                    ))}
                  </div>

                  <span className="text-[11px] font-bold">1:29</span>
                  <span className="text-[10px] font-bold bg-white/60 px-1 rounded">Aa</span>
                </div>
              </div>

              {/* Dynamic Chat Messages */}
              {chatMessages
                .filter((m) => !m.isAudio)
                .map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      'flex items-end gap-2',
                      m.isOutgoing ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {!m.isOutgoing && (
                      <img
                        src={m.avatar}
                        alt={m.sender}
                        className="w-6 h-6 rounded-full object-cover ring-1 ring-white shrink-0"
                      />
                    )}
                    <div
                      className={cn(
                        'px-3.5 py-2 rounded-2xl text-xs max-w-[210px] break-words shadow-2xs leading-relaxed',
                        m.isOutgoing
                          ? 'bg-[#00A3FF] text-white rounded-br-xs font-medium'
                          : 'bg-[#F1F5F9] text-[#0F172A] rounded-bl-xs'
                      )}
                    >
                      {m.text}
                    </div>
                    {m.isOutgoing && (
                      <img
                        src={m.avatar}
                        alt="You"
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-white shrink-0"
                      />
                    )}
                  </div>
                ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="pt-1">
              <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-2.5 py-1">
                <button
                  type="button"
                  className="text-[#94A3B8] hover:text-[#0F172A] p-1"
                  title="Attach file"
                >
                  <Paperclip size={13} />
                </button>
                <input
                  type="text"
                  placeholder="Message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none"
                />
                <button
                  type="button"
                  className="text-[#94A3B8] hover:text-[#0F172A] p-1"
                  title="Add emoji"
                >
                  <Smile size={13} />
                </button>
                <button
                  type="button"
                  className="text-[#94A3B8] hover:text-[#0F172A] p-1"
                  title="Voice note"
                >
                  <Mic size={13} />
                </button>
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="w-6 h-6 rounded-full bg-[#00A3FF] text-white flex items-center justify-center hover:bg-[#0284C7] disabled:opacity-40 transition-colors shrink-0"
                  title="Send"
                >
                  <Send size={11} className="ml-0.5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
