"use client"

import { useState } from "react"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Reveal } from "./motion"
import { motion } from "framer-motion"

export function CtaSection() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <section id="demo" className="border-b border-border/60">
      <div className="w-full px-6 py-20 md:px-12 md:py-24 lg:px-16">
        <Reveal className="grid gap-10 rounded-3xl border border-border bg-card p-8 md:p-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium tracking-wide text-primary uppercase">Pilot program</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight text-balance md:text-4xl">
              Bring AssetLink to your school.
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground md:text-lg">
              We&apos;re partnering with a limited number of DepEd schools for the pilot deployment.
              Tell us a bit about your school and we&apos;ll follow up with a tailored walkthrough.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              {[
                "Onboarding support for teachers & maintenance staff",
                "Printable QR tag templates included",
                "Migration from existing paper log-books",
              ].map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden="true" />
                  {i}
                </li>
              ))}
            </ul>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-start justify-center gap-4 rounded-2xl border border-border bg-secondary/40 p-8"
            >
              <motion.span
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 18 }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"
              >
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </motion.span>
              <h3 className="font-serif text-2xl">Thanks — we&apos;ll be in touch.</h3>
              <p className="text-sm text-muted-foreground">
                A member of the AssetLink team will reach out within 2 working days to schedule a
                walkthrough with your principal and maintenance lead.
              </p>
              <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
                Submit another school
              </Button>
            </motion.div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setSubmitted(true)
              }}
              className="rounded-2xl border border-border bg-secondary/30 p-6"
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Your name</FieldLabel>
                  <InputGroup>
                    <InputGroupInput id="name" name="name" placeholder="Ma. Ana Reyes" required />
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="role">Your role</FieldLabel>
                  <InputGroup>
                    <InputGroupInput id="role" name="role" placeholder="Principal, IT coordinator…" required />
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="school">School</FieldLabel>
                  <InputGroup>
                    <InputGroupInput id="school" name="school" placeholder="Bagumbayan Elementary School" required />
                    <InputGroupAddon align="inline-end">
                      <span className="font-mono text-[10px] text-muted-foreground">DepEd</span>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">Work email</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@school.deped.gov.ph"
                      required
                    />
                  </InputGroup>
                  <FieldDescription>
                    We&apos;ll never share your email. Used only for the pilot walkthrough.
                  </FieldDescription>
                </Field>
                <Button type="submit" className="group mt-1 w-full">
                  Request pilot access
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </FieldGroup>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  )
}
