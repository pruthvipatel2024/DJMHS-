# Shree Dhaneshkumar Jasvantlal Maheta High School — Enterprise ERP System

![SDJM High School Est. 1959](https://img.shields.io/badge/SDJM_High_School-Est._1959-1E40AF?style=for-the-badge&labelColor=F59E0B)
![Enterprise SaaS ERP](https://img.shields.io/badge/Enterprise_SaaS-Production_Ready-1E40AF?style=for-the-badge)
![PostgreSQL & Prisma](https://img.shields.io/badge/Database-PostgreSQL_|_Prisma-336791?style=for-the-badge)
![React & Tailwind](https://img.shields.io/badge/Frontend-React_|_Tailwind_CSS-38B2AC?style=for-the-badge)

## 0. Executive Institutional Overview

**Shree Dhaneshkumar Jasvantlal Maheta High School**, established in 1959 in Bhavnagar, Gujarat, India, is a distinguished educational institution. This software repository encompasses its cloud-native, enterprise-grade **School Enterprise Resource Planning (ERP) platform**. 

Engineered with best-in-class modern SaaS product principles, the system brings together academic administration, financial management, examination evaluation, attendance tracking, and home-school messaging into a multi-role web platform supporting **Administrators, Teachers, Students, and Parents**.

---

## 1. Monorepo Architecture

The codebase is organized as a professional modular workspace monorepo:

```
d:/DJMHS/
├── frontend/             # React (Vite) Single Page Application with Tailwind CSS
│   ├── src/
│   │   ├── components/   # Reusable UI Design System primitives (DataTable, Forms, Modals)
│   │   ├── features/     # Feature modules (auth, dashboard, staff, students, exams, etc.)
│   │   ├── services/     # Axios API client, TanStack Query connectors
│   │   └── types/        # Comprehensive TypeScript schemas & domain type definitions
│   └── package.json
├── backend/              # Node.js + Express REST API Server
│   ├── src/
│   │   ├── controllers/  # Route handler logic per feature module
│   │   ├── middleware/   # JWT verification, RBAC Matrix enforcement, Rate Limiting
│   │   ├── services/     # Core logic, PDF generator, Excel bulk importer, Notifications
│   │   └── app.js        # Express configuration and API router mount point
│   ├── prisma/           # PostgreSQL normalized schema and seeding scripts
│   └── package.json
├── database/             # ER diagrams, SQL query archives, and schema backups
├── docs/                 # Operational manuals and PRD specifications
├── uploads/              # Object file storage directory for documents and avatars
└── package.json          # Monorepo concurrent execution script configuration
```

---

## 2. Technology Stack & Design Philosophy

### Core Technologies
- **Frontend Engine:** React.js powered by Vite, TypeScript, and TanStack Query for optimal server state synchronization.
- **Styling & Aesthetics:** Vanilla & Tailwind CSS implementing the bespoke **Royal Blue (`#1D4ED8`) & Golden Yellow (`#F59E0B`)** institutional design system with crisp Inter typography and soft-shadow `rounded-2xl` structural geometry.
- **Form Architecture:** React Hook Form accompanied by runtime Zod validation and automatic draft persistence.
- **Backend API Engine:** Node.js & Express.js with structured error boundaries and enterprise REST patterns.
- **Security Suite:** JSON Web Tokens (Access + Refresh cookies), bcrypt password hashing, 5-strike automatic account lockouts, Helmet headers, and granular Role-Based Access Control (RBAC).
- **Database Layer:** PostgreSQL relational engine accessed via type-safe Prisma ORM with comprehensive indices and soft deletion capabilities (`deletedAt`).
- **Reporting Engines:** PDFKit for formal receipts & report cards; ExcelJS for high-performance spreadsheet import/export.

---

## 3. Supported Institutional Modules

1. **Authentication & Identity Security** — Role resolution, OTP recovery, concurrent session management, enforced 1st-login password change.
2. **Role-Based Dashboards** — Personalized real-time KPI aggregations for Administrators, Teachers, and Parents (with integrated multi-sibling switcher).
3. **Staff & Faculty Management** — Lifecycle records, departments, automated SMS/Email account provisioning, and Excel bulk partial-success importing.
4. **Student Lifecycle & Promotion Engine** — Admission processing, immutable General Register (GR) numbering, annual roll sequencing, document storage, and end-of-year batch promotions.
5. **Attendance Operations** — Daily period grid sheets with automated absence parent SMS alerts and aggregate leave tracking.
6. **Examination & Assessment Evaluation** — Exam calendars, rapid grade calculation matrices, configurable grade scales, and downloadable academic transcripts.
7. **Timetable Matrix Scheduler** — Conflict-free period planning and classroom schedule publishing.
8. **Fee Collection & Ledger Management** — Standard-specific fee installments, payment receipts generation, and delinquent account reporting.
9. **Communication & Admissions CRM** — Inquiry lead pipeline with instant conversion to student enrollment; ticketing helpdesk with SLAs; targeted institutional broadcasts with read verification.

---

## 4. Development & Quick Start Instructions

### Prerequisites
- **Node.js:** v18.x or above
- **PostgreSQL:** v14.x or above (running locally or accessible via remote network string)

### Installation & Execution
```bash
# 1. Install dependencies across root, frontend, and backend workspaces
npm install

# 2. Configure environment variables in backend/.env
# Example: DATABASE_URL="postgresql://postgres:password@localhost:5432/sdjm_erp"

# 3. Synchronize Prisma Schema with PostgreSQL database & seed sample institutional records
npm run db:migrate -w backend
npm run db:seed -w backend

# 4. Launch concurrent frontend dev server (Vite - Port 5173) and API server (Express - Port 5000)
npm run dev
```

---

## 5. Proprietary Notice
This software is developed exclusively for **Shree Dhaneshkumar Jasvantlal Maheta High School, Bhavnagar**. All institutional logos, structural rules, and database schema configurations are confidential.
