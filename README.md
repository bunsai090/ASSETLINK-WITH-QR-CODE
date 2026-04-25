# AssetLink — Smart School Maintenance

AssetLink is a three-tier, QR-enabled asset management and repair tracking system designed for Philippine public schools. It replaces manual paper logbooks with a transparent, digital workflow that connects teachers, principals, and maintenance staff.

---

## 🏗️ Architecture

The project is structured as a **monorepo** with three distinct services working together:

### 1. `landing/` — The Public Face

- **Role**: Marketing, value proposition, and user onboarding.
- **Tech**: Next.js (App Router), Framer Motion, Lenis (Smooth Scroll), Tailwind CSS.
- **Purpose**: Explains the system's impact and redirects users to the functional dashboard.
- **Port**: `http://localhost:3000`

### 2. `dashboard/` — The Internal Engine

- **Role**: Core productivity application for all user roles.
- **Tech**: Vite, React, Radix UI, TanStack Query, Recharts.
- **Purpose**: Role-based portal for scanning QR codes, reporting damage, and managing repair workflows.
- **Port**: `http://localhost:5173`

### 3. `backend/` — The Source of Truth

- **Role**: API Service & Data Persistence.
- **Tech**: Node.js, Express, Firebase (Admin).
- **Purpose**: Manages the centralized database, handles business logic, and powers the dashboard.
- **Port**: `http://localhost:3001`

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **pnpm** (Recommended package manager)
- **Git**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/bagatata05/ASSETLINK-WITH-QR-CODE.git
   cd ASSETLINK-WITH-QR-CODE
   ```

2. **Install all dependencies**
   Run this from the root directory to install dependencies for all three tiers:
   ```bash
   pnpm install
   ```

### Running Locally

To start the entire system (Landing, Dashboard, and Backend) simultaneously, run:

```bash
pnpm dev
```

- **Landing Page**: Open `http://localhost:3000`
- **Dashboard**: Open `http://localhost:5173`
- **API Health**: Check `http://localhost:3001/`

---

## 📋 Key Dependencies

| Tier          | Primary Packages                                                          |
| ------------- | ------------------------------------------------------------------------- |
| **Landing**   | `next`, `framer-motion`, `lenis`, `lucide-react`, `tailwindcss`           |
| **Dashboard** | `react`, `vite`, `@tanstack/react-query`, `@radix-ui/react-*`, `recharts` |
| **Backend**   | `express`, `cors`, `firebase-admin`, `nodemon`, `helmet`                  |

---

## 🔐 Role-Based Access

The system is optimized for three primary school roles:

1.  **Teacher**: Reports damage via QR scan and verifies completed repairs.
2.  **Principal**: Reviews reports, prioritizes tasks, and assigns work orders.
3.  **Maintenance**: Manages a personal task list and updates repair status.

---

## 🤝 Workflow

1.  **Scan**: User arrives at the **Landing** page, clicks "Sign In".
2.  **Report**: Teacher scans an asset QR code in the **Dashboard** to report damage.
3.  **Triage**: Principal reviews the request (data fetched from **Backend**) and assigns it.
4.  **Repair**: Maintenance staff receives a work order and updates the status.
5.  **Verify**: Teacher signs off on the fix, ensuring accountability.

---

## ⚖️ License

Educational Use Only — ITPE 104 / SDG 4
