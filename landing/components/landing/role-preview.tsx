"use client"

import { useState } from "react"
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  HardHat,
  Layers,
  MapPin,
  ScanLine,
  Search,
  Wrench,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Reveal } from "./motion"

type TicketStatus = "Open" | "Assigned" | "In progress" | "Awaiting verify" | "Resolved"

function StatusBadge({ status }: { status: TicketStatus }) {
  const styles: Record<TicketStatus, string> = {
    Open: "bg-accent/15 text-accent-foreground border-accent/30",
    Assigned: "bg-primary/10 text-primary border-primary/20",
    "In progress": "bg-primary/10 text-primary border-primary/20",
    "Awaiting verify": "bg-secondary text-foreground border-border",
    Resolved: "bg-primary/10 text-primary border-primary/20",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        styles[status],
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "Open" ? "bg-accent" : status === "Resolved" ? "bg-primary" : "bg-primary/70",
        )}
        aria-hidden="true"
      />
      {status}
    </span>
  )
}

function DashboardFrame({
  title,
  breadcrumb,
  children,
}: {
  title: string
  breadcrumb: string
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-secondary/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
          </div>
          <span className="ml-2 font-mono text-[11px] text-muted-foreground">{breadcrumb}</span>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">assetlink.app</span>
      </div>
      <div className="p-5 md:p-6">
        <h4 className="sr-only">{title}</h4>
        {children}
      </div>
    </div>
  )
}

/* ---------- Teacher ---------- */

function TeacherDashboard() {
  const tickets: Array<{
    id: string
    asset: string
    room: string
    status: TicketStatus
    note: string
    date: string
  }> = [
    { id: "T-0412", asset: "Wooden desk — cracked leg", room: "Rm 204", status: "In progress", note: "Assigned to Mang Ador", date: "Today" },
    { id: "T-0408", asset: "Ceiling fan — not spinning", room: "Rm 204", status: "Awaiting verify", note: "Please confirm fix", date: "Yesterday" },
    { id: "T-0391", asset: "Projector bulb replacement", room: "AVR", status: "Resolved", note: "Verified Mar 12", date: "Mar 12" },
  ]

  return (
    <DashboardFrame title="Teacher dashboard" breadcrumb="teacher / my-reports">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Good morning,</p>
              <p className="text-lg font-semibold">Ms. Andrea Cruz · Grade 4 — Rm 204</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
            >
              <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
              Scan new asset
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { label: "Open", value: 1, tone: "bg-accent/15 text-accent-foreground" },
              { label: "In progress", value: 2, tone: "bg-primary/10 text-primary" },
              { label: "Resolved · 30d", value: 7, tone: "bg-secondary text-foreground" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-background p-3">
                <div className={cn("inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-medium", s.tone)}>
                  {s.label}
                </div>
                <p className="mt-2 font-serif text-2xl">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-border">
            <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-muted-foreground">
              <span>My recent reports</span>
              <span className="font-mono">{tickets.length} tickets</span>
            </div>
            <ul className="divide-y divide-border">
              {tickets.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-3 px-3 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground">{t.id}</span>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-foreground">{t.asset}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {t.room} · {t.note}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{t.date}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="w-full rounded-xl border border-border bg-background p-4 md:w-72">
          <p className="text-xs font-medium text-muted-foreground">Awaiting your verification</p>
          <div className="mt-2 rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">T-0408</span>
              <StatusBadge status="Awaiting verify" />
            </div>
            <p className="mt-1 text-sm font-medium">Ceiling fan — not spinning</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Maintenance marked this repaired at 2:14 PM.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground">
                Confirm fix
              </button>
              <button className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground">
                Reopen
              </button>
            </div>
          </div>
        </aside>
      </div>
    </DashboardFrame>
  )
}

/* ---------- Principal ---------- */

function PrincipalDashboard() {
  const queue = [
    { id: "T-0412", asset: "Wooden desk — cracked leg", room: "Rm 204", reporter: "A. Cruz", urgency: "High", assignee: null },
    { id: "T-0411", asset: "Comfort room faucet leak", room: "CR — 2F", reporter: "J. Reyes", urgency: "Medium", assignee: "Mang Ador" },
    { id: "T-0410", asset: "Whiteboard replacement", room: "Rm 101", reporter: "M. Santos", urgency: "Low", assignee: null },
    { id: "T-0409", asset: "Broken window latch", room: "Rm 307", reporter: "R. Lim", urgency: "High", assignee: "Kuya Ben" },
  ]

  return (
    <DashboardFrame title="Principal dashboard" breadcrumb="principal / triage">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Bagumbayan Elementary School</p>
          <p className="text-lg font-semibold">Good morning, Principal Reyes</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent-foreground">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          4 tickets need triage
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Open today", value: 4 },
          { label: "Avg. response", value: "1.2d" },
          { label: "Resolved · 30d", value: 38 },
          { label: "Escalated", value: 2 },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-background p-3">
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-serif text-2xl">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-border">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            Repair queue
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground md:flex">
              <Search className="h-3 w-3" aria-hidden="true" />
              Filter by room, urgency…
            </div>
            <button className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
              Assign selected
            </button>
          </div>
        </div>

        <ul className="divide-y divide-border">
          {queue.map((q) => (
            <li key={q.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-3 md:grid-cols-[auto_1fr_auto_auto_auto]">
              <input type="checkbox" aria-label={`Select ${q.id}`} className="h-3.5 w-3.5 accent-[color:var(--primary)]" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground">{q.id}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                      q.urgency === "High"
                        ? "bg-accent/15 text-accent-foreground"
                        : q.urgency === "Medium"
                          ? "bg-secondary text-foreground"
                          : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {q.urgency}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm font-medium">{q.asset}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  {q.room} · Reported by {q.reporter}
                </p>
              </div>
              <div className="hidden text-[11px] text-muted-foreground md:block">
                {q.assignee ? (
                  <span className="inline-flex items-center gap-1">
                    <HardHat className="h-3 w-3" aria-hidden="true" />
                    {q.assignee}
                  </span>
                ) : (
                  <span className="italic">Unassigned</span>
                )}
              </div>
              <button className="hidden rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground md:inline-flex">
                Assign
              </button>
              <button className="inline-flex items-center gap-1 text-[11px] text-primary">
                View <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </DashboardFrame>
  )
}

/* ---------- Maintenance ---------- */

function MaintenanceDashboard() {
  const jobs = [
    { id: "T-0412", asset: "Wooden desk — cracked leg", room: "Rm 204", eta: "Today · 2:00 PM", progress: 60, status: "In progress" as TicketStatus },
    { id: "T-0411", asset: "Comfort room faucet leak", room: "CR — 2F", eta: "Today · 3:30 PM", progress: 10, status: "Assigned" as TicketStatus },
    { id: "T-0409", asset: "Broken window latch", room: "Rm 307", eta: "Tomorrow", progress: 0, status: "Assigned" as TicketStatus },
  ]

  return (
    <DashboardFrame title="Maintenance dashboard" breadcrumb="maintenance / my-queue">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">My work queue</p>
          <p className="text-lg font-semibold">Mang Ador Dela Cruz · School Maintenance</p>
        </div>
        <div className="hidden grid-cols-3 gap-2 md:grid">
          {[
            { label: "Assigned", value: 3 },
            { label: "In progress", value: 1 },
            { label: "Done · wk", value: 9 },
          ].map((s) => (
            <div key={s.label} className="rounded-md border border-border bg-background px-3 py-2 text-right">
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className="font-serif text-lg">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <ul className="mt-5 grid gap-3">
        {jobs.map((j) => (
          <li key={j.id} className="rounded-xl border border-border bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground">{j.id}</span>
                  <StatusBadge status={j.status} />
                  <span className="text-[11px] text-muted-foreground">ETA: {j.eta}</span>
                </div>
                <p className="mt-1 text-sm font-medium">{j.asset}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  {j.room}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] text-foreground">
                  Add note
                </button>
                <button className="rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-medium text-primary-foreground">
                  Mark repaired
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Progress value={j.progress} className="h-1.5 flex-1" />
              <span className="w-10 text-right font-mono text-[11px] text-muted-foreground">
                {j.progress}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </DashboardFrame>
  )
}

/* ---------- DepEd Supervisor ---------- */



/* ---------- Section wrapper ---------- */

const ROLES = [
  { value: "teacher", label: "Teacher", icon: GraduationCap, desc: "Scan, report, and verify." },
  { value: "principal", label: "Principal", icon: ClipboardList, desc: "Triage, prioritize, assign." },
  { value: "maintenance", label: "Maintenance", icon: HardHat, desc: "Clear work orders with proof." },
]

const DASHBOARD_COMPONENTS: Record<string, () => React.JSX.Element> = {
  teacher: TeacherDashboard,
  principal: PrincipalDashboard,
  maintenance: MaintenanceDashboard,
}

export function RolePreview() {
  const [active, setActive] = useState<string>("teacher")
  const ActiveDashboard = DASHBOARD_COMPONENTS[active] ?? TeacherDashboard

  return (
    <section id="roles" className="border-b border-border/60 bg-secondary/40">
      <div className="w-full px-6 py-20 md:px-12 md:py-24 lg:px-16">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-wide text-primary uppercase">Role-based dashboards</p>
              <h2 className="mt-3 font-serif text-3xl tracking-tight text-balance md:text-4xl">
                One platform. Three tailored experiences.
              </h2>
              <p className="mt-4 text-pretty text-muted-foreground md:text-lg">
                AssetLink surfaces exactly what each role needs — no clutter, no training-heavy interfaces,
                no leaking sensitive data to people who shouldn&apos;t see it.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <Tabs value={active} onValueChange={setActive} className="mt-10 gap-6">
            <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-background p-1">
              {ROLES.map((r) => {
                const Icon = r.icon
                return (
                  <TabsTrigger
                    key={r.value}
                    value={r.value}
                    className="flex-1 gap-2 text-xs md:text-sm"
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="font-medium">{r.label}</span>
                    {r.desc && <span className="hidden text-muted-foreground md:inline">— {r.desc}</span>}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {/* Animate dashboard swap by keying on the active tab */}
            <div className="relative">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ActiveDashboard />
                </motion.div>
              </AnimatePresence>
            </div>
          </Tabs>
        </Reveal>
      </div>
    </section>
  )
}
