"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  ImagePlus,
  MapPin,
  Printer,
  QrCode as QrIcon,
  ScanLine,
  Signature,
  Wrench,
} from "lucide-react"

/**
 * A fixed-size stylized phone frame with five possible screens.
 * Used by the sticky scroll "How it works" section.
 */
export function StepPhone({ step }: { step: number }) {
  return (
    <div className="relative mx-auto h-[560px] w-[280px] select-none">
      {/* soft glow */}
      <div
        aria-hidden="true"
        className="absolute -inset-10 -z-10 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative h-full w-full rounded-[2.25rem] border border-border bg-card p-2 shadow-xl">
        <div className="relative h-full w-full overflow-hidden rounded-[1.9rem] bg-background">
          {/* status bar */}
          <div className="flex h-7 items-center justify-between px-5 text-[10px] font-medium text-muted-foreground">
            <span>9:41</span>
            <span className="flex gap-1">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
            </span>
          </div>

          {/* notch */}
          <div
            aria-hidden="true"
            className="absolute top-2 left-1/2 h-5 w-24 -translate-x-1/2 rounded-full bg-card"
          />

          <div className="relative h-[calc(100%-1.75rem)] w-full">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 flex flex-col px-4 pt-3 pb-5"
              >
                {step === 0 && <TagScreen />}
                {step === 1 && <ScanScreen />}
                {step === 2 && <ReportScreen />}
                {step === 3 && <AssignScreen />}
                {step === 4 && <VerifyScreen />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------ 0. Tag screen ----------------------------- */

function TagScreen() {
  return (
    <>
      <ScreenHeader icon={Printer} title="Print asset tags" subtitle="Admin · Batch printing" />

      <div className="mt-3 rounded-lg border border-border bg-secondary/40 p-3">
        <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          Batch — Grade 4 Wing
        </p>
        <p className="mt-1 font-mono text-xs text-foreground">24 of 60 generated</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "40%" }}
            transition={{ duration: 1.6, ease: "easeOut" }}
            className="h-full rounded-full bg-primary"
          />
        </div>
      </div>

      <div className="mt-3 grid flex-1 grid-cols-2 gap-2 overflow-hidden">
        {[
          { id: "AST-0288", loc: "Rm 203 · Chair" },
          { id: "AST-0289", loc: "Rm 203 · Desk" },
          { id: "AST-0290", loc: "Rm 204 · Chair" },
          { id: "AST-0291", loc: "Rm 204 · Desk" },
          { id: "AST-0292", loc: "Rm 204 · Fan" },
          { id: "AST-0293", loc: "Rm 205 · Board" },
        ].map((tag, i) => (
          <motion.div
            key={tag.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            className="flex flex-col items-center rounded-md border border-border bg-card p-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-foreground">
              <QrGlyph className="h-7 w-7 text-background" />
            </div>
            <p className="mt-1.5 font-mono text-[9px] text-foreground">{tag.id}</p>
            <p className="text-[9px] text-muted-foreground">{tag.loc}</p>
          </motion.div>
        ))}
      </div>

      <PrimaryBtn>Send to printer</PrimaryBtn>
    </>
  )
}

/* ------------------------------ 1. Scan screen ---------------------------- */

function ScanScreen() {
  const reduce = useReducedMotion()
  return (
    <>
      <ScreenHeader icon={ScanLine} title="Scan QR tag" subtitle="Teacher · Camera" />

      <div className="relative mt-3 flex flex-1 items-center justify-center rounded-lg bg-gradient-to-br from-foreground/95 to-foreground/80">
        {/* viewfinder corners */}
        <div className="relative h-40 w-40">
          <Corner className="top-0 left-0" />
          <Corner className="top-0 right-0 rotate-90" />
          <Corner className="bottom-0 right-0 rotate-180" />
          <Corner className="bottom-0 left-0 -rotate-90" />

          <div className="absolute inset-3 flex items-center justify-center rounded-md bg-background/90">
            <QrGlyph className="h-full w-full p-2 text-foreground" />
          </div>

          {/* scan line */}
          <motion.span
            aria-hidden="true"
            className="absolute inset-x-3 h-0.5 rounded-full bg-accent shadow-[0_0_14px] shadow-accent"
            initial={{ top: "10%" }}
            animate={reduce ? { top: "50%" } : { top: ["10%", "90%", "10%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-center text-[10px] text-background/80">
          Center the tag on the desk
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.35 }}
        className="mt-3 flex items-center gap-2 rounded-md border border-border bg-card p-2.5"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Camera className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] text-foreground">AST-0291</p>
          <p className="text-[10px] text-muted-foreground">Rm 204 · Student desk</p>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      </motion.div>
    </>
  )
}

/* ----------------------------- 2. Report screen --------------------------- */

function ReportScreen() {
  return (
    <>
      <ScreenHeader icon={ClipboardList} title="Report damage" subtitle="Teacher · AST-0291" />

      <div className="mt-3 rounded-lg border border-border bg-secondary/40 p-2.5">
        <div className="flex gap-2">
          <div className="relative h-14 w-14 overflow-hidden rounded-md bg-muted">
            {/* faux photo: angled bars */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-amber-100 to-muted" />
            <div className="absolute top-6 left-2 h-0.5 w-10 rotate-[8deg] bg-foreground/40" />
            <div className="absolute top-9 left-1 h-0.5 w-12 rotate-[8deg] bg-foreground/30" />
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">3 photos · geo-tagged</p>
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          Category
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {[
            { label: "Furniture", active: true },
            { label: "Electrical" },
            { label: "Plumbing" },
            { label: "Structural" },
          ].map((c) => (
            <span
              key={c.label}
              className={
                c.active
                  ? "rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground"
                  : "rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground"
              }
            >
              {c.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          Urgency
        </p>
        <div className="mt-1.5 flex gap-1.5">
          {[
            { label: "Low" },
            { label: "Medium", active: true },
            { label: "High" },
          ].map((u) => (
            <span
              key={u.label}
              className={
                u.active
                  ? "flex-1 rounded-md bg-accent py-1 text-center text-[10px] font-medium text-accent-foreground"
                  : "flex-1 rounded-md border border-border py-1 text-center text-[10px] text-muted-foreground"
              }
            >
              {u.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-md border border-border bg-card p-2.5 text-[11px] leading-snug text-muted-foreground">
        Loose leg on left side. Wobbles when students write. Needs re-bolting.
      </div>

      <div className="mt-auto pt-3">
        <PrimaryBtn>Submit report</PrimaryBtn>
      </div>
    </>
  )
}

/* ----------------------------- 3. Assign screen --------------------------- */

function AssignScreen() {
  return (
    <>
      <ScreenHeader icon={Wrench} title="Ticket T-0412" subtitle="Principal · Triage" />

      <div className="mt-3 flex items-center gap-2 rounded-md border border-border bg-card p-2.5">
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
          Medium
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">AST-0291</span>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
          <MapPin className="h-3 w-3" aria-hidden="true" />
          Rm 204
        </span>
      </div>

      <div className="mt-2 rounded-md border border-border bg-secondary/40 p-2.5">
        <p className="text-xs font-medium text-foreground">Loose desk leg, Room 204</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Reported by Ms. Santos · 2m ago
        </p>
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          Assign to
        </p>
        <div className="mt-1.5 space-y-1.5">
          {[
            { name: "Mang Ronnie", role: "Lead maintenance", load: "2 open", active: true },
            { name: "Kuya Jun", role: "Carpentry", load: "1 open" },
            { name: "Escalate → Barangay", role: "For budget request", load: "" },
          ].map((p) => (
            <div
              key={p.name}
              className={
                p.active
                  ? "flex items-center gap-2 rounded-md border border-primary/40 bg-primary/5 p-2"
                  : "flex items-center gap-2 rounded-md border border-border bg-card p-2"
              }
            >
              <span
                className={
                  p.active
                    ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground"
                    : "flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[10px] font-medium text-foreground"
                }
              >
                {p.name
                  .split(" ")
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-foreground">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">{p.role}</p>
              </div>
              {p.load && (
                <span className="rounded-full border border-border bg-card px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  {p.load}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-3">
        <PrimaryBtn>Assign & approve</PrimaryBtn>
      </div>
    </>
  )
}

/* ----------------------------- 4. Verify screen --------------------------- */

function VerifyScreen() {
  return (
    <>
      <ScreenHeader icon={BadgeCheck} title="Verify repair" subtitle="Teacher · AST-0291" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 220, damping: 18 }}
        className="mt-4 flex flex-col items-center rounded-lg border border-border bg-secondary/40 p-4"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="mt-2 text-xs font-semibold text-foreground">Repair complete</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Closed by Mang Ronnie · Today</p>
      </motion.div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-border bg-card p-2">
          <p className="text-[9px] tracking-wide text-muted-foreground uppercase">Before</p>
          <div className="mt-1 h-16 overflow-hidden rounded-sm bg-gradient-to-br from-amber-200 via-amber-100 to-muted" />
        </div>
        <div className="rounded-md border border-border bg-card p-2">
          <p className="text-[9px] tracking-wide text-muted-foreground uppercase">After</p>
          <div className="mt-1 h-16 overflow-hidden rounded-sm bg-gradient-to-br from-primary/30 via-primary/10 to-muted" />
        </div>
      </div>

      <div className="mt-3 rounded-md border border-border bg-card p-2.5">
        <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          Teacher sign-off
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <Signature className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <div className="h-0.5 flex-1 rounded-full bg-border">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.4, duration: 0.9, ease: "easeOut" }}
              className="h-full rounded-full bg-primary"
            />
          </div>
        </div>
        <p className="mt-1.5 text-[10px] text-foreground">Ms. Santos · verified</p>
      </div>

      <div className="mt-auto pt-3">
        <PrimaryBtn>Close ticket</PrimaryBtn>
      </div>
    </>
  )
}

/* ------------------------------ Shared bits ------------------------------- */

function ScreenHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle: string
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-foreground">{title}</p>
        <p className="truncate text-[10px] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}

function PrimaryBtn({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      className="mt-3 w-full rounded-md bg-primary py-2 text-xs font-medium text-primary-foreground shadow-sm"
    >
      {children}
    </button>
  )
}

function Corner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute h-5 w-5 border-t-2 border-l-2 border-accent ${className}`}
    />
  )
}

function QrGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="currentColor">
      <rect x="2" y="2" width="18" height="18" rx="2" />
      <rect x="7" y="7" width="8" height="8" rx="1" fill="var(--background)" />
      <rect x="44" y="2" width="18" height="18" rx="2" />
      <rect x="49" y="7" width="8" height="8" rx="1" fill="var(--background)" />
      <rect x="2" y="44" width="18" height="18" rx="2" />
      <rect x="7" y="49" width="8" height="8" rx="1" fill="var(--background)" />
      <rect x="26" y="4" width="4" height="4" />
      <rect x="34" y="4" width="4" height="4" />
      <rect x="26" y="12" width="4" height="4" />
      <rect x="38" y="12" width="4" height="4" />
      <rect x="4" y="26" width="4" height="4" />
      <rect x="12" y="26" width="4" height="4" />
      <rect x="24" y="24" width="16" height="16" />
      <rect x="28" y="28" width="8" height="8" fill="var(--background)" />
      <rect x="50" y="26" width="4" height="4" />
      <rect x="58" y="34" width="4" height="4" />
      <rect x="26" y="50" width="4" height="4" />
      <rect x="34" y="50" width="4" height="4" />
      <rect x="26" y="58" width="4" height="4" />
      <rect x="38" y="58" width="4" height="4" />
      <rect x="46" y="46" width="4" height="4" />
      <rect x="54" y="46" width="4" height="4" />
      <rect x="46" y="54" width="4" height="4" />
      <rect x="58" y="58" width="4" height="4" />
    </svg>
  )
}

// Used nowhere externally but exporting the icon type for clarity
export const _icons = { QrIcon }
