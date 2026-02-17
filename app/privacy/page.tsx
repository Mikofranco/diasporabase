"use client";

import { motion } from "framer-motion";
import NavBar from "@/components/navbar";
import Footer from "@/parts/landingPage/footer";
import { FileText } from "lucide-react";

export default function PrivacyScreen() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 dark:bg-gray-900">
      <NavBar />
      <section className="relative py-16 md:py-20 overflow-hidden bg-gradient-to-br from-cyan-500/10 via-white to-blue-500/10 dark:from-cyan-500/5 dark:via-gray-900 dark:to-blue-500/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="container mx-auto px-4 text-center"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mb-4">
            <FileText className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Last updated: December 20, 2025
          </p>
        </motion.div>
      </section>
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-4xl mx-auto bg-white dark:bg-gray-800/50 shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden -mt-6 relative z-10"
        >
          <div className="px-6 py-10 md:px-12 md:py-14">

            <section className="prose prose-lg max-w-none text-gray-700 dark:text-gray-300 space-y-10 prose-headings:text-gray-900 dark:prose-headings:text-white prose-a:text-cyan-600 dark:prose-a:text-cyan-400">
              <p>
                DiasporaBase (“we,” “us,” or “our”) connects diaspora professionals with African public institutions for volunteer and collaboration opportunities. This Privacy Policy explains how we collect, use, share, and protect your personal information. We are committed to safeguarding your privacy.
              </p>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  1. Information We Collect
                </h2>
                <ul className="list-disc pl-6 space-y-3">
                  <li>
                    <strong>Account & Profile Info:</strong> Name, email, phone (optional), country of interest, skills, professional details, LinkedIn profile (optional), and profile photo (optional).
                  </li>
                  <li>
                    <strong>Verification & Trust Data:</strong> Identity checks, role validation for institutions, and basic integrity signals to prevent fraud (only if applicable).
                  </li>
                  <li>
                    <strong>Application & Matching Data:</strong> Opportunities you view, apply to, or post; messages exchanged; availability and preferences.
                  </li>
                  <li>
                    <strong>Technical Data:</strong> IP address, device/browser information, log data, and approximate location (e.g., country) for security, analytics, and localization.
                  </li>
                  <li>
                    <strong>Sensitive Data:</strong> Please do not submit sensitive personal data (e.g., health records, biometric data) unless explicitly required for an opportunity and you have lawful permission.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  2. How We Use Your Information
                </h2>
                <p>We use your information to:</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li>Provide matching, posting, and collaboration features</li>
                  <li>Verify accounts, prevent fraud, and maintain platform safety</li>
                  <li>Send service updates and respond to support requests</li>
                  <li>Improve platform performance, analytics, and usability</li>
                  <li>Comply with legal obligations and enforce our Terms of Service</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  3. Sharing & Disclosure
                </h2>
                <p>We may share information:</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li>With institutions or volunteers you engage with (limited profile and application details necessary for collaboration)</li>
                  <li>With trusted service providers (e.g., hosting, analytics, email delivery) who are bound by confidentiality and security obligations</li>
                  <li>For safety or legal reasons (e.g., required by law or to protect users and DiasporaBase)</li>
                  <li>In business transfers (e.g., merger or acquisition) with appropriate safeguards</li>
                </ul>
                <p className="mt-4 font-medium">We do not sell your personal information.</p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  4. Cross-Border Transfers
                </h2>
                <p>
                  DiasporaBase supports global collaboration. Your data may be processed in countries outside your residence. We implement reasonable safeguards (e.g., standard contractual clauses) to protect it during transfers.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  5. Data Retention
                </h2>
                <p>
                  We retain information only as long as necessary for platform operations, legal requirements, dispute resolution, and agreement enforcement. You can request deletion where permitted by law.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  6. Your Choices & Rights
                </h2>
                <p>Depending on your location, you may have rights to:</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li>Access, correct, or delete your data</li>
                  <li>Object to or restrict processing</li>
                  <li>Withdraw consent (where applicable)</li>
                  <li>Request data portability</li>
                </ul>
                <p className="mt-4">To exercise these rights, please contact us (see Contact section below).</p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  7. Security
                </h2>
                <p>
                  We employ administrative, technical, and organizational measures to protect your data. However, no system is 100% secure—use DiasporaBase at your own risk.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  8. Children
                </h2>
                <p>
                  DiasporaBase is not intended for children under 13 (or the applicable minimum age in your jurisdiction). We do not knowingly collect their personal data.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  9. Updates to This Policy
                </h2>
                <p>
                  We may update this Privacy Policy periodically. Changes take effect upon posting, and we will update the “Last updated” date above.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
                  10. Contact Us
                </h2>
                <p>
                  For questions, requests, or concerns about this Privacy Policy, please reach out via our contact form or email us at{" "}
                  <a href="mailto:privacy@diasporabase.com" className="text-blue-600 hover:underline">
                    support@diasporabase.com
                  </a>
                  .
                </p>
              </div>
            </section>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}