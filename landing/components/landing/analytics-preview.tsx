"use client"

import { TrendingDown, TrendingUp } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Reveal, StaggerGroup, StaggerItem } from "./motion"

const resolutionData = [
  { month: "Oct", days: 5.8 },
  { month: "Nov", days: 4.9 },
  { month: "Dec", days: 4.1 },
  { month: "Jan", days: 3.4 },
  { month: "Feb", days: 2.6 },
  { month: "Mar", days: 1.8 },
]

const resolutionConfig: ChartConfig = {
  days: { label: "Avg. resolution (days)", color: "var(--primary)" },
}

const damageData = [
  { type: "Furniture", tickets: 42 },
  { type: "Electrical", tickets: 31 },
  { type: "Plumbing", tickets: 24 },
  { type: "Windows", tickets: 18 },
  { type: "Structural", tickets: 12 },
  { type: "Other", tickets: 8 },
]

const damageConfig: ChartConfig = {
  tickets: { label: "Tickets", color: "var(--primary)" },
}

const statusData = [
  { name: "Resolved", value: 128, fill: "var(--primary)" },
  { name: "In progress", value: 28, fill: "color-mix(in oklch, var(--primary) 55%, white)" },
  { name: "Open", value: 14, fill: "var(--accent)" },
  { name: "Escalated", value: 5, fill: "color-mix(in oklch, var(--foreground) 35%, white)" },
]

const statusConfig: ChartConfig = {
  value: { label: "Tickets" },
  Resolved: { label: "Resolved", color: "var(--primary)" },
  "In progress": { label: "In progress", color: "var(--primary)" },
  Open: { label: "Open", color: "var(--accent)" },
  Escalated: { label: "Escalated", color: "var(--muted-foreground)" },
}

export function AnalyticsPreview() {
  const statusTotal = statusData.reduce((acc, d) => acc + d.value, 0)

  return (
    <section id="analytics" className="border-b border-border/60">
      <div className="w-full px-6 py-20 md:px-12 md:py-24 lg:px-16">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-primary uppercase">Analytics & reporting</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight text-balance md:text-4xl">
              Turn years of paper trails into decisions you can defend.
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground md:text-lg">
              Principals, barangay officials, and school administrators get the same ground-truth data —
              where damage concentrates, how fast it gets resolved, and where resources are actually
              needed next.
            </p>
          </div>
        </Reveal>

        <StaggerGroup
          className="mt-12 grid gap-4 lg:grid-cols-3"
          staggerChildren={0.12}
          delayChildren={0.1}
        >
          {/* Resolution time */}
          <StaggerItem as="article" className="rounded-2xl border border-border bg-card p-5 transition-shadow duration-300 hover:shadow-md">
            <header className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg. resolution time</p>
                <p className="mt-1 flex items-baseline gap-2 font-serif text-3xl">
                  1.8d
                  <span className="inline-flex items-center gap-0.5 text-xs font-sans font-medium text-primary">
                    <TrendingDown className="h-3 w-3" aria-hidden="true" />
                    −69%
                  </span>
                </p>
              </div>
              <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Last 6 months
              </span>
            </header>
            <ChartContainer config={resolutionConfig} className="mt-4 h-44 w-full">
              <LineChart data={resolutionData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Line
                  type="monotone"
                  dataKey="days"
                  stroke="var(--color-days)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--color-days)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          </StaggerItem>

          {/* Damage patterns */}
          <StaggerItem as="article" className="rounded-2xl border border-border bg-card p-5 transition-shadow duration-300 hover:shadow-md">
            <header className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Damage patterns — school-wide</p>
                <p className="mt-1 flex items-baseline gap-2 font-serif text-3xl">
                  135
                  <span className="inline-flex items-center gap-0.5 text-xs font-sans font-medium text-accent-foreground">
                    <TrendingUp className="h-3 w-3" aria-hidden="true" />
                    this quarter
                  </span>
                </p>
              </div>
              <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                By category
              </span>
            </header>
            <ChartContainer config={damageConfig} className="mt-4 h-44 w-full">
              <BarChart data={damageData} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="type"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  interval={0}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <ChartTooltip cursor={{ fill: "var(--secondary)" }} content={<ChartTooltipContent />} />
                <Bar dataKey="tickets" fill="var(--color-tickets)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </StaggerItem>

          {/* Status mix */}
          <StaggerItem as="article" className="rounded-2xl border border-border bg-card p-5 transition-shadow duration-300 hover:shadow-md">
            <header className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ticket status mix</p>
                <p className="mt-1 font-serif text-3xl">{statusTotal}</p>
                <p className="text-xs text-muted-foreground">tickets tracked</p>
              </div>
              <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                This term
              </span>
            </header>
            <div className="mt-2 flex items-center gap-4">
              <ChartContainer config={statusConfig} className="h-40 w-40 shrink-0">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <ul className="flex-1 space-y-2 text-xs">
                {statusData.map((s) => (
                  <li key={s.name} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: s.fill }}
                        aria-hidden="true"
                      />
                      {s.name}
                    </span>
                    <span className="font-mono text-foreground">{s.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </StaggerItem>
        </StaggerGroup>
      </div>
    </section>
  )
}
