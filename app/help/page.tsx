"use client"

import React from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"   // ← from shadcn/ui

import NavBar from "@/components/navbar"
import Footer from "@/parts/landingPage/footer"

const HelpCenterPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 my-20">
        <section className="container mx-auto px-4 py-16 max-w-4xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4">Help Center</h1>
            <p className="text-lg text-muted-foreground">
              Find quick answers to common questions or get in touch with our support team.
            </p>
          </div>

          {/* Accordion FAQs */}
          <div className="mb-14">
            <h2 className="text-2xl font-semibold mb-6 text-center md:text-left">
              Frequently Asked Questions
            </h2>

            <Accordion type="single" collapsible className="w-full">
              {/* Password Reset Item */}
              <AccordionItem value="password-reset" className="border-b py-1">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="text-lg font-medium">
                    How do I reset my password?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pt-2 text-muted-foreground">
                  <p className="mb-4">
                    To reset your password, visit our password reset page where you can enter your email and follow the instructions sent to you.
                  </p>
                  <Link
                    href="/forgot-password"
                    className="underline hove:text-diaspora-darkBlue transition"
                  >
                    Go to Reset Password Page
                  </Link>
                </AccordionContent>
              </AccordionItem>

              {/* Contact Support Item */}
              <AccordionItem value="contact-support" className="border-b py-1">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="text-lg font-medium">
                    How do I contact customer support?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pt-2 text-muted-foreground">
                  <p className="mb-4">
                    You can reach our support team by sending an email or filling out our contact form. We're here to help!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a
                      href="mailto:support@diasporabase.com"
                      className="inline-flex items-center justify-center rounded-md border border-input bg-background px-5 py-2.5 text-sm font-medium hover:bg-accent transition"
                    >
                      Email support@diasporabase.com
                    </a>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Still Keep the General Contact Section (optional) */}
          <div className="text-center border-t pt-10">
            <h2 className="text-2xl font-semibold mb-3">Need More Help?</h2>
            <p className="text-muted-foreground mb-6">
              Our support team is available to assist with any other questions or issues.
            </p>

            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-md action-btn px-6 py-3 text-white font-medium hover:bg-primary/90 transition"
            >
              Contact Support
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default HelpCenterPage