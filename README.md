# AcadTrack — College Project Management & Presentation Tracking Platform

> Professional academic project management software designed for engineering college student teams and faculty guides to track the complete project lifecycle from idea selection to final viva.

Built with **React 19**, **TypeScript**, **Tailwind CSS v4**, **@dnd-kit**, and **Supabase (PostgreSQL with RLS)**. Designed with a clean, minimalist UI inspired by Linear, Notion, and GitHub Projects.

---

## 🌟 Key Features

### 1. 📋 Drag-and-Drop Kanban Board
- 6 Default workflow columns: **Backlog**, **To Do**, **In Progress**, **In Review**, **Blocked**, and **Done**.
- Powered by `@dnd-kit` with touch-screen and keyboard accessibility.
- Filter tasks by team member, priority, phase, and overdue status.
- Task detail modals with interactive subtask checklists, comments, effort estimations, and tags.
- Direct linkage to presentation deliverables and faculty correction tasks.

### 2. 🎓 Presentation Phase Lifecycle Tracker
Academic evaluation lifecycle tracking across all 9 standard engineering stages:
1. **Topic Selection & Approval** (Problem identification, existing methods, faculty approval)
2. **Synopsis & Proposal Presentation** (Objectives, scope, initial architecture, slides)
3. **Literature Review & Research** (Research papers, gaps, comparative matrix)
4. **Design & Planning Review** (UML diagrams, database schema, model design)
5. **Mid-Term Presentation** (Feature progress, live demo readiness, initial results)
6. **Implementation & Testing Review** (Unit tests, integration, error analysis, test report)
7. **Pre-Final Presentation** (Working prototype, report draft, mock viva)
8. **Final Presentation & Viva** (Final demo, viva preparation, examiner evaluation)
9. **Final Submission & Closure** (Report sign-off, source code repository, archival)

*Strict evaluation gates: A phase cannot be marked "Ready to Present" while mandatory deliverables remain incomplete or unapproved.*

### 3. 📝 Faculty Feedback & Correction Tracking
- Structured recording of presentation reviews: marks, general feedback, strengths, and areas for improvement.
- Trackable correction items assigned to specific team members with deadlines and verification evidence links.
- Reviewer sign-off workflow (`Open` &rarr; `In Progress` &rarr; `Ready for Verification` &rarr; `Verified` / `Reopened`).

### 4. 📊 Project Dashboard & "Next Actions"
- Real-time project completion metrics computed from live database records.
- Visible **Next Actions** queue highlighting overdue tasks, items due within 3 days, and pending corrections.
- Milestone timelines, upcoming calendar events, and team activity audit logs.

### 5. 👥 Team Contribution & Workload Indicators
- Real-time metrics per student: assigned tasks, completed tasks, in-progress tasks, overdue items, assigned deliverables, and open corrections.
- Workload level indicators (`Balanced`, `High Workload`, `Underutilized`).
- Contextual note emphasizing that task counts are workload indicators, not definitive academic performance scores.

### 6. 🎯 Milestones & Weighted Progress
- Transparent weighted progress calculation based on configured checkpoint weights (1–50 pts).
- Planned vs. actual completion dates with automatic delay flags.

### 7. 📚 Research, Documentation & Experiments
- **Research Papers**: Literature survey catalog with DOI, citations, and research gap notes.
- **Report Chapters**: University chapter tracking (`Introduction`, `Literature Survey`, `Architecture`, `Implementation`, `Results`, `Conclusion`).
- **ML / CV Experiments**: Verified benchmark records for training datasets, splits, Precision, Recall, F1 score, and mAP@0.5.

### 8. 📅 Project Calendar & Timeline
- Month grid and chronological agenda views for presentations, reviews, deadlines, and vivas.
- Detail modals with venue locations, online meeting links, and prep notes.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4 (design system tokens with Inter typography)
- **State Management**: Zustand (with persistent project selection) & TanStack React Query
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **Icons**: Lucide React
- **Date Handling**: `date-fns`
- **Backend & Database**: Supabase (PostgreSQL with Row-Level Security)

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Supabase](https://supabase.com/) account (free tier works great)

### 2. Clone and Install
```bash
git clone https://github.com/Kulkarnimayur7810/acadtrack.git
cd acadtrack
npm install
```

### 3. Database Setup (Supabase)
1. In your Supabase dashboard, navigate to the **SQL Editor**.
2. Open and paste the contents of [`supabase/schema.sql`](./supabase/schema.sql).
3. Click **Run** to generate all 15 tables, indexes, triggers, and Row-Level Security policies.

### 4. Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
*(Reference provided in [`.env.example`](./.env.example))*

### 5. Run Development Server
```bash
npm run dev
```

### 6. Build for Production
```bash
npm run build
```

---

## 🔒 Security & Privacy

- All database operations are protected with **PostgreSQL Row-Level Security (RLS)**.
- Client requests only carry public anon keys; service-role secret keys are never exposed in frontend code.
- Workspace and project isolation ensures students only see projects where they are registered members.

---

## 📄 License
This project is licensed under the MIT License.
