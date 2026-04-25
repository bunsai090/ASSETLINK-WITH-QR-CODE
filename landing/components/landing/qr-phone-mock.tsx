"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Camera, CheckCircle2, ImagePlus, MapPin, ScanLine } from "lucide-react"

/**
 * Stylized mock of the teacher-facing mobile flow.
 * Pure CSS/SVG — no external image assets.
 */
export function QrPhoneMock() {
  const reduce = useReducedMotion()
  return (
    <div className="relative">
      {/* Printable QR tag card, tucked behind the phone */}
      <motion.div
        initial={{ opacity: 0, x: -20, rotate: -12 }}
        animate={{ opacity: 1, x: 0, rotate: -6 }}
        transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -top-6 -left-8 hidden w-56 rounded-xl border border-border bg-card p-4 shadow-sm sm:block"
      >
        <div className="mb-3 flex items-center justify-between text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
          <span>DepEd Asset Tag</span>
          <span className="font-mono">v1</span>
        </div>
        <QrGlyph className="mx-auto h-28 w-28 text-foreground" />
        <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[11px]">
          <span className="font-mono text-muted-foreground">AST-0291</span>
          <span className="font-medium text-foreground">Rm 204 · Desk</span>
        </div>
      </motion.div>

      {/* Phone */}
      <div className="relative mx-auto w-[280px] rounded-[2.2rem] border border-border bg-foreground/90 p-2 shadow-xl sm:w-[320px]">
        <div className="relative overflow-hidden rounded-[1.8rem] bg-background">
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[11px] text-muted-foreground">
            <span className="font-mono">9:41</span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              AssetLink
            </span>
          </div>

          {/* Camera / scanner viewport */}
          <div className="relative mx-4 mt-2 aspect-[4/5] overflow-hidden rounded-2xl bg-foreground text-background">
            <div className="al-grid-bg absolute inset-0 opacity-20" aria-hidden="true" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-40 w-40 rounded-lg border-2 border-primary/70 bg-primary/10">
                {/* Corner markers */}
                <span className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-accent" />
                <span className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-accent" />
                <span className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-accent" />
                <span className="absolute right-0 bottom-0 h-4 w-4 border-r-2 border-b-2 border-accent" />
                <QrGlyph className="absolute inset-3 h-auto w-auto text-background" />
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-x-2 h-0.5 rounded-full bg-accent/80 shadow-[0_0_12px] shadow-accent"
                  initial={{ top: "10%" }}
                  animate={reduce ? { top: "50%" } : { top: ["10%", "90%", "10%"] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>

            <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2 py-1 text-[10px] font-medium text-foreground">
              <ScanLine className="h-3 w-3" aria-hidden="true" />
              Scanning asset…
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/90 px-3 py-1 text-[10px] text-foreground">
              <span className="font-mono">AST-0291</span> · Grade 4 — Rm 204
            </div>
          </div>

          {/* Action sheet / form */}
          <div className="mx-4 mt-3 mb-4 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Report damage</p>
                <p className="text-sm font-semibold text-foreground">Wooden desk, cracked leg</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                Urgent
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              Rm 204 · North wing
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border bg-secondary text-muted-foreground"
                aria-label="Add photo"
              >
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="aspect-square rounded-lg bg-gradient-to-br from-secondary to-muted" />
              <div className="aspect-square rounded-lg bg-gradient-to-br from-muted to-secondary" />
            </div>

            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              Submit repair ticket
            </button>
          </div>
        </div>
      </div>

      {/* Success toast */}
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -right-4 -bottom-4 hidden w-60 rounded-xl border border-border bg-card p-3 shadow-sm sm:block"
      >
        <div className="flex items-start gap-2">
          <motion.span
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 1.1, type: "spring", stiffness: 280, damping: 16 }}
            className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary/15 text-primary"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          </motion.span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">Ticket #T-0412 filed</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Principal Reyes notified · Maintenance queue updated
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function QrGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      {/* Position detection patterns */}
      <rect x="2" y="2" width="10" height="10" rx="1.5" />
      <rect x="5" y="5" width="4" height="4" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="28" y="2" width="10" height="10" rx="1.5" />
      <rect x="31" y="5" width="4" height="4" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="2" y="28" width="10" height="10" rx="1.5" />
      <rect x="5" y="31" width="4" height="4" rx="0.5" fill="currentColor" stroke="none" />
      {/* Data modules */}
      <g fill="currentColor" stroke="none">
        <rect x="15" y="3" width="2" height="2" />
        <rect x="19" y="3" width="2" height="2" />
        <rect x="23" y="3" width="2" height="2" />
        <rect x="15" y="7" width="2" height="2" />
        <rect x="21" y="7" width="2" height="2" />
        <rect x="17" y="11" width="2" height="2" />
        <rect x="23" y="11" width="2" height="2" />
        <rect x="3" y="15" width="2" height="2" />
        <rect x="7" y="15" width="2" height="2" />
        <rect x="11" y="15" width="2" height="2" />
        <rect x="15" y="15" width="2" height="2" />
        <rect x="19" y="15" width="2" height="2" />
        <rect x="25" y="15" width="2" height="2" />
        <rect x="29" y="15" width="2" height="2" />
        <rect x="33" y="15" width="2" height="2" />
        <rect x="5" y="19" width="2" height="2" />
        <rect x="9" y="19" width="2" height="2" />
        <rect x="17" y="19" width="2" height="2" />
        <rect x="21" y="19" width="2" height="2" />
        <rect x="27" y="19" width="2" height="2" />
        <rect x="31" y="19" width="2" height="2" />
        <rect x="3" y="23" width="2" height="2" />
        <rect x="11" y="23" width="2" height="2" />
        <rect x="15" y="23" width="2" height="2" />
        <rect x="23" y="23" width="2" height="2" />
        <rect x="29" y="23" width="2" height="2" />
        <rect x="33" y="23" width="2" height="2" />
        <rect x="17" y="27" width="2" height="2" />
        <rect x="21" y="27" width="2" height="2" />
        <rect x="27" y="27" width="2" height="2" />
        <rect x="31" y="27" width="2" height="2" />
        <rect x="15" y="31" width="2" height="2" />
        <rect x="19" y="31" width="2" height="2" />
        <rect x="25" y="31" width="2" height="2" />
        <rect x="33" y="31" width="2" height="2" />
        <rect x="17" y="35" width="2" height="2" />
        <rect x="23" y="35" width="2" height="2" />
        <rect x="29" y="35" width="2" height="2" />
      </g>
    </svg>
  )
}
