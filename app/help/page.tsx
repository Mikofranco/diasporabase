"use client"

import React from "react"
import NavBar from "@/components/navbar"
import Footer from "@/parts/landingPage/footer"

const HelpCenterPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 max-w-4xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4">Help Center</h1>
            <p className="text-lg text-muted-foreground">
              Find quick answers to common questions or get in touch with our support team.
            </p>
          </div>

          {/* FAQs */}
          <div className="mb-14">
            <h2 className="text-2xl font-semibold mb-6">
              Frequently Asked Questions
            </h2>

            <ul className="space-y-4">
              <li className="p-4 border rounded-lg hover:bg-muted transition">
                How do I reset my password?
              </li>
              <li className="p-4 border rounded-lg hover:bg-muted transition">
                Where can I find my order history?
              </li>
              <li className="p-4 border rounded-lg hover:bg-muted transition">
                How do I contact customer support?
              </li>
              <li className="p-4 border rounded-lg hover:bg-muted transition">
                What is your return policy?
              </li>
            </ul>
          </div>

          {/* Contact Support */}
          <div className="text-center border-t pt-10">
            <h2 className="text-2xl font-semibold mb-3">Need More Help?</h2>
            <p className="text-muted-foreground mb-6">
              Our support team is available to help you with any questions or issues.
            </p>

            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-white font-medium hover:bg-primary/90 transition"
            >
              Contact Support
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default HelpCenterPage
