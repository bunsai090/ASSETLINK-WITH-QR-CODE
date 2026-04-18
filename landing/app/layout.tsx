import type { Metadata, Viewport } from "next"
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SmoothScroll } from "@/components/landing/smooth-scroll"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "AssetLink — QR-enabled School Asset & Repair Tracking",
  description:
    "AssetLink transforms school asset management from paper log-books into a transparent, QR-enabled workflow. Report damage in one scan, route repairs to the right hands, and give DepEd full visibility — in service of SDG 4: Quality Education.",
  generator: "v0.app",
  openGraph: {
    title: "AssetLink — QR-enabled School Asset & Repair Tracking",
    description:
      "Report, track, and resolve school repairs with one scan. Built for teachers, principals, maintenance staff, and DepEd supervisors.",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1a1a" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} bg-background`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                window.addEventListener('pageshow', function(event) {
                  if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
                    window.location.reload();
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body className="relative font-sans antialiased">
        <SmoothScroll>
          {children}
          {process.env.NODE_ENV === "production" && <Analytics />}
        </SmoothScroll>
      </body>
    </html>
  )
}
