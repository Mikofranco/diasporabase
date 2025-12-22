"use client"

import React from 'react'
import NavBar from '@/components/navbar'
import Footer from '@/parts/landingPage/footer'

const AccessibilityScreen = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-800">
      <NavBar />

      <main className="flex-grow max-w-4xl mx-auto px-6 py-12 space-y-10 mt-0 md:mt-10">
        <h1 className="text-3xl font-semibold">
          Accessibility Statement
        </h1>

        <p className="leading-relaxed">
          DiasporaBase is committed to making our platform accessible to all users, including people with disabilities. We aim to follow recognized accessibility standards (such as WCAG) and continuously improve usability across devices and assistive technologies.
        </p>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            What We’re Doing
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Building mobile-friendly, readable layouts</li>
            <li>Supporting keyboard navigation where possible</li>
            <li>Using clear labels and form instructions</li>
            <li>Improving contrast and text clarity over time</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            Need Help?
          </h2>
          <p className="leading-relaxed mb-3">
            If you experience an accessibility issue or need content in an alternative format, please contact us at support@diasporabase.com and include:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>The page URL</li>
            <li>What you were trying to do</li>
            <li>Your device/browser and any assistive technology used</li>
          </ul>
          <p className="leading-relaxed">
            We’ll do our best to respond promptly.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">
            Support Section
          </h2>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">
            1) Help Center
          </h3>
          <p className="font-medium mb-2">Help Center</p>
          <p className="mb-2">Find answers on:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Creating a volunteer profile that institutions can trust</li>
            <li>Posting a project opportunity (institutions)</li>
            <li>How matching works and how to scope a “remote-ready” project</li>
            <li>Messaging, collaboration expectations, and deliverables</li>
            <li>Account, privacy, and security settings</li>
          </ul>
          <p className="mt-3">
            If you can’t find what you need, use Contact Us.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">
            2) Contact Us
          </h3>
          <p className="font-medium mb-2">Contact Us</p>
          <p className="mb-2">
            We’re here to help with account support, verification questions, and safety concerns.
          </p>
          <p className="mb-4">
            General Support: [support@yourdomain.com]
          </p>
          <p className="text-sm text-gray-600">
            Please do not send sensitive personal data or confidential government documents by email unless requested through a secure method.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">
            3) Safety Guidelines
          </h3>
          <p className="font-medium mb-3">Safety Guidelines</p>
          <p className="mb-4">
            DiasporaBase is built for trusted collaboration between diaspora professionals and public institutions. To protect yourself and your organization:
          </p>

          <div className="space-y-4">
            <div>
              <p className="font-semibold">Verify Before You Share</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Keep early conversations on-platform when possible</li>
                <li>Confirm institutional identity and role (official email, verified profile, documentation)</li>
                <li>Be cautious of urgent requests, secrecy, or pressure tactics</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold">Protect Information</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Share only what’s needed for the project</li>
                <li>Avoid uploading restricted, classified, or highly sensitive documents</li>
                <li>Use strong passwords and enable multi-factor authentication when available</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold">Money & Solicitation</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Do not send money, gifts, or “processing fees” to anyone you meet on DiasporaBase</li>
                <li>Report any request for bribes, kickbacks, or unofficial payments immediately</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold">Professional Boundaries</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Use clear scopes, timelines, and deliverables</li>
                <li>Do not share personal home addresses or unnecessary personal information</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold">If Meeting In-Person (Optional)</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Meet in public/professional settings first</li>
                <li>Inform a trusted contact of your plans</li>
                <li>Use institutional channels and documented agendas</li>
              </ul>
              <p className="mt-2">
                If you ever feel unsafe, stop communication and Report Issue.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default AccessibilityScreen
