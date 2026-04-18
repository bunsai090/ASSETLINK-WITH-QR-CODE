import { QrCode } from "lucide-react"

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Role dashboards", href: "#roles" },
      { label: "Analytics", href: "#analytics" },
      { label: "Pilot program", href: "#demo" },
    ],
  },
  {
    heading: "For roles",
    links: [
      { label: "Teachers", href: "#roles" },
      { label: "Principals", href: "#roles" },
      { label: "Maintenance staff", href: "#roles" },
      { label: "DepEd supervisors", href: "#roles" },
    ],
  },
  {
    heading: "Capstone",
    links: [
      { label: "Research background", href: "#sdg" },
      { label: "SDG 4 alignment", href: "#sdg" },
      { label: "Scope & limitations", href: "#sdg" },
      { label: "References", href: "#sdg" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="bg-background">
      <div className="w-full px-6 py-14 md:px-12 lg:px-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <QrCode className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-base font-semibold tracking-tight">AssetLink</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A QR code-enabled school asset management and repair tracking system — built in service
              of SDG 4: Quality Education.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs font-medium tracking-wide text-foreground uppercase">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>
            &copy; {new Date().getFullYear()} AssetLink capstone project. For academic and pilot use.
          </p>
          <p className="font-mono">
            SDG 4 · Quality Education · DepEd-aligned
          </p>
        </div>
      </div>
    </footer>
  )
}
