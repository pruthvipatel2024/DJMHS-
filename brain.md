# 🧠 DJMHS ERP — System Brain & Architectural Memory

> **Institution:** Shree Dhaneshkumar Jasvantlal Maheta High School (Est. 1959)  
> **Repository:** DJMHS ERP Platform (Full-Stack Management System)  
> **Primary Maintainer / Developer:** Pruthvi Patel (`patelpruthvi671@gmail.com`)  
> **Last Updated:** November 17, 2026

---

## 🏛️ System Architecture & Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite, React Router v6, i18next (English, Gujarati, Hindi).
- **Backend:** Node.js, Express.js, Prisma ORM 5.x, JWT Authentication, Nodemailer (Gmail SMTP App Password), Cloudinary Media, ExcelJS, PDFKit.
- **Primary Database:** **PostgreSQL (Neon DB Cloud Pooler)** — 100% of ERP core logic, academic roster, fee ledgers, examinations, timetables, and user accounts run on PostgreSQL.
- **Secondary Database (Auxiliary / Non-blocking):** MongoDB Atlas (Communication & Document Subsystem placeholder; wrapped in non-blocking try/catch so it never interrupts the server).

---

## 📌 Core Invariants & Rules (MUST NEVER BE VIOLATED)

### 1. Soft-Delete Policy (`deletedAt`)
- All database queries, count aggregations, and list endpoints **MUST ALWAYS** filter `{ where: { deletedAt: null } }`.
- Staff, students, divisions, and subjects utilize soft deletion (`deletedAt: DateTime?`).
- **Dashboard Metrics:** Total staff (`prisma.staff.count({ where: { deletedAt: null } })`) and department breakdowns (`staffMembers: { where: { deletedAt: null } }`) must strictly exclude deactivated records.
- **Cache Invalidation:** Whenever staff or students are created, updated, or soft-deleted, `clearDashboardCache()` from `dashboard.controller.js` must be invoked.

### 2. Timetable & Scheduling Conflict Rules
- **Rule 1 — Teacher Clash Detection:** A single faculty member **cannot** be scheduled in two classrooms during the same day and period.
  - If a teacher is already booked on `(dayOfWeek, periodNumber)` in any other division, the server rejects the request with `HTTP 409 (Teacher Schedule Clash)`.
- **Rule 2 — Class Slot Replacement (Upsert):** A class division can only have one lecture per period. Re-assigning an existing slot updates the lecture without throwing unique constraint errors (`@@unique([divisionId, dayOfWeek, periodNumber])`).
- **Rule 3 — Room / Laboratory Conflict:** If a specific room/lab is specified (non-generic), two classes cannot occupy the same room at the same time (`HTTP 409 (Room Schedule Clash)`).
- **Rule 4 — Bidirectional Dual-View Sync:**
  - `CLASS_MATRIX` and `FACULTY_MATRIX` read from the same `prisma.timetable` relation.
  - Assigning a period from the Teacher's schedule immediately populates that Class's timetable, and vice-versa.

### 3. Examination & Marks Architecture
- **Schema Mapping:**
  - `Exam` model contains `academicYearId`, `standardId`, `name`, `examType` (`UNIT_TEST_1`, `QUARTERLY`, `UNIT_TEST_2`, `HALF_YEARLY`, `PRELIMINARY`, `ANNUAL_FINAL`), `startDate`, `endDate`, `isPublished`.
  - `Exam` does **not** have a `status` field in Prisma; status is dynamically calculated as `SCHEDULED`, `IN_PROGRESS`, or `COMPLETED` based on dates.
  - `Exam` relates to `ExamSchedule` via `schedules`, **not** `subjects`.
  - `ExamSchedule` maps `(examId, subjectId)` with dates and max/passing marks.
  - `Mark` records map to `(examScheduleId, studentId)` with `@@unique([examScheduleId, studentId])` and `enteredById`.
- **Frontend Modal:** `ScheduleExamModal.tsx` provides the official dialog for scheduling exam terms and auto-generating standard subject schedules.

---

## 📂 Key Directory Map

```text
d:\DJMHS\
├── backend/
│   ├── prisma/schema.prisma         # Single source of truth for PostgreSQL schema
│   ├── src/
│   │   ├── config/db.js             # Prisma Client instance
│   │   ├── config/mongo.js          # Non-blocking MongoDB Atlas connector
│   │   ├── controllers/
│   │   │   ├── dashboard.controller.js  # Dashboard KPIs (soft-delete filtered)
│   │   │   ├── exam.controller.js       # Exam sessions, schedules, marksheet & report card PDF
│   │   │   ├── staff.controller.js      # Faculty directory, Excel import/export, profile CRUD
│   │   │   ├── student.controller.js    # Student General Register, enrollment & promotion
│   │   │   ├── timetable.controller.js  # Real-time conflict-verified timetable slot assignments
│   │   │   └── settings.controller.js   # Standards, divisions, curriculum & teacher allocations
│   │   ├── routes/                  # Express API route declarations
│   │   └── services/                # Background PDF, Excel, OCR, and Timetable generator services
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── dashboard/           # AdminDashboard.tsx, TeacherDashboard.tsx, PortalDashboard.tsx
│   │   │   ├── exams/               # ExamListPage.tsx, ScheduleExamModal.tsx, ExamMarksEntryPage.tsx
│   │   │   ├── timetables/          # TimetablePage.tsx, TimetableCellModal.tsx
│   │   │   ├── staff/               # StaffListPage.tsx, StaffFormModal.tsx, StaffBulkImportModal.tsx
│   │   │   └── settings/            # SettingsPage.tsx (Standards, Divisions, Subjects, Allocations)
│   │   ├── services/                # Axios API services (exam.service, timetable.service, etc.)
│   │   └── components/              # Shared UI (Modal, DataTable, Notifications)
└── brain.md                         # This persistent architectural memory file
```

---

## 📝 Recent Change Log & Resolutions

1. **Staff Count Discrepancy (11 vs 8):**
   - Resolved by ensuring [dashboard.controller.js](file:///d:/DJMHS/backend/src/controllers/dashboard.controller.js) filters `where: { deletedAt: null }` across staff count and department distributions.
2. **MongoDB Connection Warning:**
   - Identified that MongoDB Atlas free cluster paused / DNS SRV failed. Documented that PostgreSQL / Prisma is the primary database and MongoDB is strictly non-blocking.
3. **Schedule Exam Console:**
   - Built [ScheduleExamModal.tsx](file:///d:/DJMHS/frontend/src/features/exams/ScheduleExamModal.tsx) and fixed Prisma schema mismatches (`subjects` -> `schedules`, dynamic status calculation) in [exam.controller.js](file:///d:/DJMHS/backend/src/controllers/exam.controller.js).
4. **Timetable Matrix & Clash Prevention:**
   - Enabled interactive slot assignment across both Class and Faculty views.
   - Enforced strict single-teacher dual-booking prevention (`HTTP 409`) with descriptive clash messages and visual warnings.
