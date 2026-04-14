# ASSETLINK-v1
AssetLink is a school asset management and QR-enabled repair tracking web app for Philippine public schools under DepEd. Teachers scan QR codes on classroom assets to report damage, which automatically generates repair tickets routed to principals, maintenance staff, barangay officials, and DepEd supervisors. The system replaces manual logbooks and paper forms with a transparent, accountable digital workflow — ensuring classrooms stay well-maintained and repair requests never get lost.

---

## 🚀 Quick Start (Localhost Development)

### Prerequisites
- **Node.js** v18+ ([download](https://nodejs.org))
- **npm** or **yarn**
- **Git**

### Setup

1. **Clone & Install**
```bash
git clone https://github.com/bagatata05/ASSETLINK-v1
cd ASSETLINK-v1
npm install
```

2. **Start Development Server**
```bash
npm run dev
```
The app opens at `http://localhost:5173`

3. **Login with Demo Users**
AssetLink runs in **mock mode** by default (no backend required). Login with any of these:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@assetlink.ph` | (any) |
| Teacher | `teacher@assetlink.ph` | (any) |
| Principal | `principal@assetlink.ph` | (any) |
| Supervisor | `supervisor@assetlink.ph` | (any) |
| Maintenance | `maintenance@assetlink.ph` | (any) |

**Mock data persists in localStorage** — close and reopen the browser to keep your data.

---

## 📋 Features

### Core Workflows
- ✅ **Damage Reporting** — Teachers report asset damage with photos (or scan QR codes)
- ✅ **Repair Request Routing** — Automatic workflows: Pending → Approved → In Progress → Teacher Verification → Completed
- ✅ **Task Management** — Maintenance staff manage assigned repairs with status updates
- ✅ **Maintenance Calendar** — Drag-and-drop weekly scheduling for repairs (maintenance only)
- ✅ **Teacher Verification** — Teachers approve/reject repairs before final closure
- ✅ **Escalation** — Urgent repairs escalate to principals, supervisors, or DepEd
- ✅ **Analytics** — Real-time dashboards showing repair timelines, damage patterns, costs

### Role-Based Access
| Role | Permissions |
|------|-------------|
| **Teacher** | Report damage, verify completed repairs, view repair status |
| **Admin** | Full system access, user/school management, analytics |
| **Principal** | Approve/reject repair requests, assign to maintenance, view analytics |
| **Supervisor** | Multi-school oversight, escalation queue, regional analytics |
| **Maintenance** | View assigned tasks, update progress, drag-and-drop scheduling on calendar |

---

## 🏗️ Project Structure

```
src/
├── pages/              # Route components
│   ├── Dashboard.jsx           # Overview (all roles)
│   ├── Assets.jsx              # Asset inventory
│   ├── ReportDamage.jsx        # Damage reporting + QR scanner placeholder
│   ├── RepairRequests.jsx       # Request management + teacher verification
│   ├── Tasks.jsx               # Maintenance task list
│   ├── MaintenanceCalendar.jsx  # Drag-drop scheduling (maintenance only)
│   ├── Analytics.jsx           # Repair metrics & timelines
│   └── Schools.jsx             # School management
├── components/         # Reusable UI components
│   ├── Layout.jsx              # Navigation & role-based menu
│   ├── StatusBadge.jsx         # Status indicators
│   └── ui/                     # Shadcn composite components
├── lib/
│   ├── AuthContext.jsx         # Authentication & role state
│   └── utils.js                # Utilities
├── api/
│   ├── base44Client.js         # API client (real or mock)
│   ├── mockBase44.js           # Mock backend (localStorage-based)
│   └── seedData.js             # Demo data
└── App.jsx            # Router setup
entities/              # Entity schemas (Base44 metadata)
```

---

## 🔄 Workflow Example: Reporting Damage

### Teacher Flow
1. Teacher visits **Report Damage** page
2. Searches or scans QR code for asset (e.g., "Projector in Room 101")
3. Describes damage: "Bulb burned out, no display"
4. Uploads photo (optional)
5. Submits request → **Principal is notified (email)**

### Principal Flow
1. Views **Repair Requests**, sees pending report
2. Approves request & assigns to maintenance staff
3. Repair request moves to **In Progress**

### Maintenance Flow
1. Views **My Tasks** → sees assigned repair
2. Marks as *In Progress* → starts work
3. Completes work, marks as **"Completed"**
4. **Teacher is notified** to verify repair

### Teacher Verification Flow
1. Teacher receives email: "Repair ready for verification"
2. Visits **Repair Requests**, inspects asset
3. Either:
   - ✅ **Approve & Close** — Repair complete
   - ❌ **Reject & Rework** — Sends back to maintenance with feedback

---

## 📊 Tech Stack

- **Frontend:** React 18 + Vite
- **UI:** Tailwind CSS + Shadcn components + Lucide icons
- **State:** TanStack Query + React Context
- **Routing:** React Router v6
- **Charts:** Recharts
- **DnD:** hello-pangea/dnd (drag-and-drop)
- **Notifications:** Sonner toasts
- **Data:** localStorage (mock), Base44 SDK (production)

---

## 🔐 Authentication & Authorization

All features are **role-gated** in the navigation:
- **Routes** visible only to authorized roles (see `Layout.jsx`)
- **Frontend enforcement** prevents UI accidents
- **BACKEND TODO:** Add server-side validation on all endpoints

See [PERMISSIONS.md](PERMISSIONS.md) for complete access control matrix.

---

## 🛠️ Development Workflow

### Edit Features
Files auto-reload with Vite HMR. Make changes and save:
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: (optional) Run linter
npm run lint
```

### Mock Data
Edit `src/api/seedData.js` to add demo data. Changes appear on next refresh:
```javascript
// Add a new asset
export const SEED_ASSETS = [
  { id: 'ast_011', name: 'New Projector', ... },
  ...
];
```

### Add a New Page
1. Create `src/pages/NewPage.jsx`
2. Add route to `src/App.jsx`
3. Add navigation item to `src/components/Layout.jsx` (with role filter)

---

## 🚦 Build for Production

```bash
npm run build       # Creates dist/
npm run preview     # Preview production build
```

---

## 📱 Backend Integration (Future)

Currently runs in **mock mode** (`VITE_BASE44_REAL_BACKEND=false`).

To connect to a real backend:
1. Set `VITE_BASE44_REAL_BACKEND=true` in `.env`
2. Configure `VITE_BASE44_APP_BASE_URL` and auth token
3. Backend must implement endpoints in [API_SPECIFICATION.md](API_SPECIFICATION.md)
4. Backend must enforce permissions in [PERMISSIONS.md](PERMISSIONS.md)

See [API_SPECIFICATION.md](API_SPECIFICATION.md) for complete backend requirements.

---

## 📖 Documentation

- **[API_SPECIFICATION.md](API_SPECIFICATION.md)** — Complete endpoint reference for backend
- **[PERMISSIONS.md](PERMISSIONS.md)** — Role-based access control matrix
- **[MaintenanceTask Entity](entities/MaintenanceTask)** — Data schema
- **[RepairRequest Entity](entities/RepairRequest)** — Data schema

---

## ✨ Key Features (Coming Soon)

- 🎥 QR code scanning integration (`react-qr-reader`)
- 📍 Multi-school supervisor dashboard (`/supervisor-dashboard`)
- 🏪 Barangay/DepEd escalation workflows
- 📸 Before/after photo documentation
- 🔔 Real-time push notifications
- 📥 CSV export for analytics

---

## 🤝 Contributing

1. Create a branch: `git checkout -b feature/my-feature`
2. Make changes & test locally
3. Commit: `git commit -m "feat: add feature"` (conventional commits)
4. Push & create PR

---

## ⚖️ License

DepEd AssetLink - Educational Use Only
