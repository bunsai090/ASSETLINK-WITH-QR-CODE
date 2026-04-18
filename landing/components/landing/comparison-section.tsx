import { Check, Minus, X } from "lucide-react"
import { Reveal } from "./motion"
import { cn } from "@/lib/utils"

type CellValue = "yes" | "partial" | "no" | string

type Row = {
  label: string
  detail?: string
  values: [CellValue, CellValue, CellValue]
}

const COLUMNS = [
  { key: "manual", label: "Manual paper process", tone: "muted" },
  { key: "generic", label: "Generic asset trackers", tone: "muted" },
  { key: "assetlink", label: "AssetLink", tone: "primary" },
] as const

const ROWS: Row[] = [
  {
    label: "QR-tagged assets",
    detail: "Every desk, chair, and fan has a unique, scannable identity",
    values: ["no", "partial", "yes"],
  },
  {
    label: "Photo-evidence required",
    detail: "Damage reports always include geo-tagged photos",
    values: ["no", "partial", "yes"],
  },
  {
    label: "Automated ticketing",
    detail: "A ticket is created on scan — no paper form to lose",
    values: ["no", "yes", "yes"],
  },
  {
    label: "Role-based dashboards",
    detail: "Teacher, principal, and maintenance views",
    values: ["no", "partial", "yes"],
  },
  {
    label: "Teacher-verified repairs",
    detail: "The person who reported damage signs off on the fix",
    values: ["no", "no", "yes"],
  },

  {
    label: "Offline-first capture",
    detail: "Tickets queue on-device and sync when connectivity returns",
    values: ["yes", "no", "yes"],
  },
  {
    label: "Philippine context",
    detail: "Built around public school, barangay, and LGU escalation paths",
    values: ["partial", "no", "yes"],
  },
  {
    label: "Typical setup cost",
    detail: "Per pilot school",
    values: ["Forms + filing", "Per-seat SaaS", "Printable tags + web"],
  },
]

function Cell({ value, highlight }: { value: CellValue; highlight?: boolean }) {
  if (value === "yes") {
    return (
      <span
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-full",
          highlight ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary",
        )}
        aria-label="Supported"
      >
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    )
  }
  if (value === "partial") {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-accent"
        aria-label="Partial"
      >
        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    )
  }
  if (value === "no") {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground"
        aria-label="Not supported"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    )
  }
  return <span className="text-xs font-medium text-foreground">{value}</span>
}

export function ComparisonSection() {
  return (
    <section id="comparison" className="border-b border-border/60 bg-secondary/40">
      <div className="w-full px-6 py-20 md:px-12 md:py-24 lg:px-16">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-primary uppercase">
              How AssetLink compares
            </p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight text-balance md:text-4xl">
              Not another asset tracker — a purpose-built tool for public schools.
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground md:text-lg">
              Generic solutions weren&apos;t designed for the realities of Philippine public-school
              maintenance. AssetLink is — from the escalation paths down to the ticket vocabulary.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-background">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th
                      scope="col"
                      className="px-5 py-4 text-xs font-medium tracking-wide text-muted-foreground uppercase"
                    >
                      Capability
                    </th>
                    {COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        scope="col"
                        className={cn(
                          "px-5 py-4 text-center text-xs font-medium tracking-wide uppercase",
                          col.tone === "primary"
                            ? "bg-primary/5 text-primary"
                            : "text-muted-foreground",
                        )}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr
                      key={row.label}
                      className="border-b border-border last:border-b-0 transition-colors hover:bg-secondary/60"
                    >
                      <th scope="row" className="px-5 py-4 align-top">
                        <p className="text-sm font-medium text-foreground">{row.label}</p>
                        {row.detail && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{row.detail}</p>
                        )}
                      </th>
                      {row.values.map((v, i) => {
                        const col = COLUMNS[i]
                        return (
                          <td
                            key={i}
                            className={cn(
                              "px-5 py-4 text-center align-middle",
                              col.tone === "primary" && "bg-primary/5",
                            )}
                          >
                            <Cell value={v} highlight={col.tone === "primary"} />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Comparison based on documented School Maintenance &amp; Other Operating Expenses (MOOE)
          workflow and feature pages of the top three generic asset-tracking products.
        </p>
      </div>
    </section>
  )
}
